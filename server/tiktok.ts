/*
 * Pengunduh TikTok tanpa watermark.
 *  1) tikwm.com (tanpa API key)
 *  2) RapidAPI (opsional) - hanya jika env RAPIDAPI_KEY diisi
 * Mengembalikan data yang sudah dinormalisasi sesuai tipe TikTokData di klien.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';

export interface TikTokOut {
  id: string;
  author: { username: string; nickname: string; avatar?: string; verified: boolean; signature: string };
  description: string;
  cover?: string;
  stats: { likes: number; comments: number; views: number; shares: number; saves: number };
  hashtags: Array<{ hashtagName: string }>;
  downloadUrl: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function absolute(u: unknown, base = 'https://www.tikwm.com'): string {
  const s = typeof u === 'string' ? u.trim() : '';
  if (!s) return '';
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('/')) return `${base}${s}`;
  return s;
}

export function extractHashtags(text: string): Array<{ hashtagName: string }> {
  const tags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(tags.map((t) => t.slice(1)))].map((hashtagName) => ({ hashtagName }));
}

export function mapTikwm(d: any): TikTokOut {
  const downloadUrl = absolute(d.play) || absolute(d.hdplay) || absolute(d.wmplay);
  const title = String(d.title || '');
  return {
    id: String(d.id || d.video_id || Date.now()),
    author: {
      username: d.author?.unique_id || 'creator',
      nickname: d.author?.nickname || d.author?.unique_id || 'TikTok Creator',
      avatar: absolute(d.author?.avatar) || undefined,
      verified: false,
      signature: '',
    },
    description: title,
    cover: absolute(d.cover) || absolute(d.origin_cover) || undefined,
    stats: {
      likes: Number(d.digg_count || 0),
      comments: Number(d.comment_count || 0),
      views: Number(d.play_count || 0),
      shares: Number(d.share_count || 0),
      saves: Number(d.collect_count || 0),
    },
    hashtags: extractHashtags(title),
    downloadUrl,
  };
}

async function fromTikwm(videoUrl: string): Promise<TikTokOut> {
  let lastMsg = 'tidak ada respons';
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&hd=1`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    const json: any = await res.json().catch(() => null);
    if (json?.code === 0 && json.data) {
      const out = mapTikwm(json.data);
      if (!out.downloadUrl) throw new Error('tautan unduhan kosong');
      return out;
    }
    lastMsg = json?.msg || `HTTP ${res.status}`;
    // Batas 1 request/detik pada API gratis: tunggu sebentar lalu coba sekali lagi
    if (attempt === 0 && /limit/i.test(lastMsg)) {
      await sleep(1300);
      continue;
    }
    break;
  }
  throw new Error(lastMsg);
}

async function fromRapid(videoUrl: string, key: string): Promise<TikTokOut> {
  let target = videoUrl;
  if (/(vt|vm)\.tiktok\.com|\/t\//.test(videoUrl) || !videoUrl.includes('/video/')) {
    try {
      const r = await fetch(videoUrl, { redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
      if (r.url.includes('tiktok.com')) target = r.url;
    } catch {
      // pakai URL asli
    }
  }
  const res = await fetch(
    `https://tiktok-video-downloader-api.p.rapidapi.com/media?videoUrl=${encodeURIComponent(target)}`,
    {
      headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'tiktok-video-downloader-api.p.rapidapi.com' },
      signal: AbortSignal.timeout(15000),
    }
  );
  const raw: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(raw?.message || raw?.error || `RapidAPI HTTP ${res.status}`);
  const downloadUrl = raw.downloadUrl || raw.videoUrl || raw.playUrl || raw.noWatermarkUrl || raw.url;
  if (!downloadUrl) throw new Error('tautan unduhan tidak ditemukan');
  return {
    id: String(raw.id || raw.videoId || Date.now()),
    author: {
      username: raw.author?.username || raw.author?.unique_id || 'creator',
      nickname: raw.author?.nickname || raw.author?.username || 'TikTok Creator',
      avatar: raw.author?.avatar || raw.author?.avatar_thumb,
      verified: Boolean(raw.author?.verified),
      signature: raw.author?.signature || '',
    },
    description: raw.description || raw.title || '',
    cover: raw.cover || raw.origin_cover || raw.dynamic_cover,
    stats: {
      likes: Number(raw.stats?.likes ?? raw.stats?.digg_count ?? raw.likes ?? 0),
      comments: Number(raw.stats?.comments ?? raw.stats?.comment_count ?? raw.comments ?? 0),
      views: Number(raw.stats?.views ?? raw.stats?.play_count ?? raw.views ?? 0),
      shares: Number(raw.stats?.shares ?? raw.stats?.share_count ?? raw.shares ?? 0),
      saves: Number(raw.stats?.saves ?? raw.stats?.collect_count ?? raw.saves ?? 0),
    },
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.filter((h: any) => h && h.hashtagName) : [],
    downloadUrl,
  };
}

export async function resolveTikTok(rawUrl: string): Promise<TikTokOut> {
  const url = rawUrl.trim().replace(/["']/g, '');
  const errors: string[] = [];

  try {
    return await fromTikwm(url);
  } catch (e: any) {
    errors.push(`tikwm: ${e?.message || e}`);
  }

  const key = process.env.RAPIDAPI_KEY;
  if (key) {
    try {
      return await fromRapid(url, key);
    } catch (e: any) {
      errors.push(`rapidapi: ${e?.message || e}`);
    }
  }

  throw new Error(errors.join(' | '));
}

/** Hanya izinkan https ke host publik (cegah proxy dipakai mengakses jaringan internal). */
export function parseSafeMediaUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const h = url.hostname.toLowerCase();
  if (
    h === 'localhost' ||
    h.startsWith('[') ||
    /^[0-9.]+$/.test(h) ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    !h.includes('.')
  ) {
    return null;
  }
  return url;
}

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\-]+/g, '_').replace(/^\.+/, '').slice(0, 80);
  return cleaned.toLowerCase().endsWith('.mp4') ? cleaned : `${cleaned || 'tiktok_nowm'}.mp4`;
}
