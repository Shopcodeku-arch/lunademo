import express from 'express';
import dotenv from 'dotenv';
import { db } from './db.js';
import { Readable } from 'node:stream';
import { normalizeMessages, requestOverchat, collectOverchatText } from './overchat.js';
import { resolveTikTok, parseSafeMediaUrl, safeFileName } from './tiktok.js';
import { buildRealtimeContext } from './realtime.js';
import { KomikError, listKomik, getKomik, getChapterPages } from './komik.js';

dotenv.config();

const app = express();

// Enable JSON parsing
app.use(express.json({ limit: '50mb' }));

// CORS middleware so Vercel client and preview domains are never blocked
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// --- Health Check ---
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    engine: 'Luna AI Engine (Gimoy Studio)',
    databaseReady: true,
  });
});

// --- Luna AI -> Overchat (streaming SSE diteruskan apa adanya ke klien) ---
app.post(['/api/ai/chat', '/ai/chat'], async (req, res) => {
  const controller = new AbortController();
  // Pengguna menutup tab / menekan stop -> hentikan permintaan ke Overchat juga
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const messages = normalizeMessages(body.messages);
    if (messages.length === 0) {
      return res.status(400).json({ error: 'Array messages diperlukan' });
    }
    const wantStream = body.stream !== false;

    let upstream = await requestOverchat(messages, controller.signal);
    // Gangguan sementara / batas permintaan: tunggu sebentar lalu coba sekali lagi
    if (!upstream.ok && [429, 500, 502, 503, 504].includes(upstream.status)) {
      await new Promise((r) => setTimeout(r, 900));
      if (!controller.signal.aborted) upstream = await requestOverchat(messages, controller.signal);
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return res
        .status(upstream.status)
        .json({ error: `Overchat AI membalas HTTP ${upstream.status}`, detail: detail.slice(0, 500) });
    }

    if (!wantStream) {
      const text = await collectOverchatText(upstream);
      return res.json({ status: 'success', result: { message: { content: text } } });
    }

    if (!upstream.body) {
      return res.status(502).json({ error: 'Overchat AI tidak mengirim data' });
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err: any) {
    if (controller.signal.aborted) return;
    console.error('Overchat AI error:', err);
    if (!res.headersSent) {
      res.status(502).json({ error: err?.message || 'Gagal memproses permintaan AI' });
    } else {
      res.end();
    }
  }
});

// --- Auth Endpoints ---
app.post(['/api/auth/login', '/auth/login'], (req, res) => {
  try {
    const { username, email, displayName, pin } = req.body || {};
    const candidate = ((username || email || '') as string).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!candidate) {
      return res.status(400).json({ error: 'Username wajib diisi' });
    }

    if (candidate === 'guest_user') {
      return res.status(400).json({ error: 'Akun uji coba telah dinonaktifkan. Silakan buat akun Anda sendiri.' });
    }

    const existing = db.getUser(candidate);

    if (existing) {
      if (db.userHasPin(existing)) {
        if (!pin) {
          return res.status(401).json({ error: 'Akun ini dilindungi PIN. Masukkan PIN Anda.' });
        }
        if (!db.verifyUserPin(existing, pin)) {
          return res.status(401).json({ error: 'PIN tidak sesuai' });
        }
      }
      const user = db.touchUser(candidate, displayName) || existing;
      return res.json({ success: true, user: db.toPublicUser(user) });
    }

    const created = db.createUser(candidate, displayName, pin, email);
    res.json({ success: true, user: db.toPublicUser(created) });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err?.message || 'Gagal melakukan login' });
  }
});

app.get(['/api/auth/me', '/auth/me'], (req, res) => {
  try {
    const identifier = ((req.query.email || req.query.username) as string) || '';
    if (!identifier) {
      return res.status(400).json({ error: 'Email parameter diperlukan' });
    }
    const cleanEmail = identifier.trim().toLowerCase();
    if (cleanEmail === 'ardan' || cleanEmail === 'guest_user') {
      return res.status(404).json({ error: 'Akun uji coba telah dinonaktifkan' });
    }
    const user = db.getUser(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ success: true, user: db.toPublicUser(user) });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

app.put(['/api/auth/profile', '/auth/profile'], (req, res) => {
  try {
    const { username, displayName, avatarColor, systemPrompt } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'Username diperlukan' });
    }
    const updated = db.updateUser(username, {
      ...(displayName ? { displayName } : {}),
      ...(avatarColor ? { avatarColor } : {}),
      ...(systemPrompt ? { systemPrompt } : {}),
    });
    if (!updated) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
});

// --- Chat History Endpoints ---
app.get(['/api/chats', '/chats'], (req, res) => {
  try {
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({ error: 'Username parameter diperlukan' });
    }
    const chats = db.listUserChats(username);
    res.json({ success: true, chats });
  } catch (err) {
    console.error('List chats error:', err);
    res.status(500).json({ error: 'Gagal mengambil riwayat chat' });
  }
});

app.post(['/api/chats', '/chats'], (req, res) => {
  try {
    const { username, title, model } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'Username diperlukan' });
    }
    const newChat = db.createChat(username, title, model);
    res.json({ success: true, chat: newChat });
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ error: 'Gagal membuat sesi chat' });
  }
});

app.get(['/api/chats/:id', '/chats/:id'], (req, res) => {
  try {
    const chatId = req.params.id;
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({ error: 'Username parameter diperlukan' });
    }
    const chat = db.getChat(chatId, username);
    if (!chat) {
      return res.status(404).json({ error: 'Sesi percakapan tidak ditemukan' });
    }
    res.json({ success: true, chat });
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ error: 'Gagal memuat detail chat' });
  }
});

app.put(['/api/chats/:id', '/chats/:id'], (req, res) => {
  try {
    const chatId = req.params.id;
    const { username, title, pinned, model } = req.body || {};
    if (!username) {
      return res.status(400).json({ error: 'Username diperlukan' });
    }
    const updated = db.updateChat(chatId, username, { title, pinned, model });
    if (!updated) {
      return res.status(404).json({ error: 'Sesi chat tidak ditemukan' });
    }
    res.json({ success: true, chat: updated });
  } catch (err) {
    console.error('Update chat error:', err);
    res.status(500).json({ error: 'Gagal memperbarui status chat' });
  }
});

app.delete(['/api/chats/:id', '/chats/:id'], (req, res) => {
  try {
    const chatId = req.params.id;
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({ error: 'Username diperlukan' });
    }
    db.deleteChat(chatId, username);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(500).json({ error: 'Gagal menghapus percakapan' });
  }
});

app.delete(['/api/chats', '/chats'], (req, res) => {
  try {
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({ error: 'Username diperlukan' });
    }
    const count = db.clearUserChats(username);
    res.json({ success: true, count });
  } catch (err) {
    console.error('Clear chats error:', err);
    res.status(500).json({ error: 'Gagal menghapus riwayat chat' });
  }
});

// --- TikTok: ambil info video tanpa watermark ---
app.get(['/api/tiktok/media', '/api/tiktok-downloader'], async (req, res) => {
  const rawUrl = String(req.query.videoUrl || req.query.url || '').trim();
  if (!rawUrl) {
    return res.status(400).json({ error: 'URL video TikTok diperlukan' });
  }
  try {
    const data = await resolveTikTok(rawUrl);
    res.setHeader('Cache-Control', 'no-store');
    return res.json(data);
  } catch (err: any) {
    console.error('TikTok downloader error:', err?.message || err);
    return res.status(502).json({
      error: 'Gagal mengambil video TikTok. Pastikan tautan benar dan videonya bersifat publik, lalu coba lagi.',
      detail: String(err?.message || err).slice(0, 300),
    });
  }
});

// --- TikTok: proxy unduh / putar video (streaming + dukungan Range) ---
app.get(['/api/tiktok/download-video', '/api/download-proxy'], async (req, res) => {
  const target = parseSafeMediaUrl(String(req.query.url || '').trim());
  if (!target) return res.status(400).send('URL video tidak valid');

  const inline = req.query.inline === '1';
  const fileName = safeFileName(String(req.query.name || 'tiktok_nowm.mp4'));

  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      Referer: target.hostname.includes('tikwm') ? 'https://www.tikwm.com/' : 'https://www.tiktok.com/',
      Accept: '*/*',
    };
    if (req.headers.range) headers.Range = String(req.headers.range);

    const upstream = await fetch(target, { headers, redirect: 'follow', signal: controller.signal });
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status === 404 ? 404 : 502).send('Gagal mengambil file video');
    }

    const type = upstream.headers.get('content-type') || 'video/mp4';
    if (!/^(video\/|application\/octet-stream|binary\/)/i.test(type)) {
      return res.status(415).send('Tautan tersebut bukan file video');
    }

    res.status(upstream.status);
    res.setHeader('Content-Type', type.startsWith('video/') ? type : 'video/mp4');
    for (const h of ['content-length', 'content-range', 'accept-ranges']) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    res.setHeader('Cache-Control', 'private, max-age=300');

    if (!upstream.body) return res.end();
    const stream = Readable.fromWeb(upstream.body as any);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (err: any) {
    if (controller.signal.aborted) return;
    console.error('Download video proxy error:', err?.message || err);
    if (!res.headersSent) res.status(502).send('Gagal mengunduh file video');
    else res.destroy();
  }
});

// --- Perpustakaan: komik (MangaDex, hanya konten safe) ---
const komikHandler =
  (fn: (req: express.Request) => Promise<unknown>, cache = 'public, s-maxage=300, stale-while-revalidate=900') =>
  async (req: express.Request, res: express.Response) => {
    try {
      const data = await fn(req);
      res.setHeader('Cache-Control', cache);
      res.json(data);
    } catch (err: any) {
      const status = err instanceof KomikError ? err.status : 502;
      if (!(err instanceof KomikError)) console.error('Komik error:', err?.message || err);
      res.status(status).json({ error: err?.message || 'Gagal memuat data komik' });
    }
  };

app.get(
  ['/api/library/komik/chapter/:chapterId', '/library/komik/chapter/:chapterId'],
  komikHandler((req) => getChapterPages(String(req.params.chapterId)), 'no-store')
);
app.get(
  ['/api/library/komik/:id', '/library/komik/:id'],
  komikHandler((req) => getKomik(String(req.params.id), String(req.query.lang || 'id')))
);
app.get(
  ['/api/library/komik', '/library/komik'],
  komikHandler((req) =>
    listKomik({
      q: String(req.query.q || ''),
      sort: String(req.query.sort || 'popular'),
      lang: String(req.query.lang || 'id'),
      offset: Number(req.query.offset) || 0,
      limit: Number(req.query.limit) || 24,
    })
  )
);

// --- Data real-time (waktu, berita, web, cuaca, kurs, kripto) ---
app.get(['/api/realtime', '/realtime'], async (req, res) => {
  try {
    const q = String(req.query.q || '').slice(0, 300);
    const tz = String(req.query.tz || '').slice(0, 60);
    const result = await buildRealtimeContext(q, tz);
    res.setHeader('Cache-Control', 'no-store');
    return res.json(result);
  } catch (err: any) {
    console.error('Realtime context error:', err?.message || err);
    return res.status(502).json({ error: 'Gagal mengambil data real-time' });
  }
});

// --- Chat Message Storage Endpoint ---
app.post(['/api/chats/:id/messages', '/chats/:id/messages'], (req, res) => {
  try {
    const chatId = req.params.id;
    const { username, role, content, model, imageUrl, storagePath, imageName, tiktokData, fileAttachment } = req.body || {};
    if (!username || !role || !content) {
      return res.status(400).json({ error: 'Data pesan tidak lengkap' });
    }
    const added = db.addMessage(chatId, username, { role, content, model, imageUrl, storagePath, imageName, tiktokData, fileAttachment } as any);
    if (!added) {
      return res.status(404).json({ error: 'Sesi percakapan tidak ditemukan' });
    }
    res.json({ success: true, message: added });
  } catch (err: any) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Gagal menyimpan pesan' });
  }
});

export default app;
