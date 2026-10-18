/*
 * Data real-time untuk Luna.
 * Semua sumber gratis & tanpa API key. Tiap sumber punya batas waktu sendiri dan
 * boleh gagal tanpa menggagalkan yang lain (Promise.allSettled).
 *
 *  - Waktu         : dihitung dari jam server + zona waktu pengguna
 *  - Berita        : Google News RSS (pencarian & headline Indonesia / dunia)
 *  - Pencarian web : DuckDuckGo (HTML) - best effort
 *  - Fakta umum    : Wikipedia (id)
 *  - Cuaca         : Open-Meteo
 *  - Kurs          : open.er-api.com
 *  - Kripto        : CoinGecko
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
const TIMEOUT_MS = 4500;

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.6' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getJson<T = any>(url: string): Promise<T> {
  return JSON.parse(await getText(url)) as T;
}

/* ------------------------------ Waktu ------------------------------ */

export function formatNow(tz?: string, now: Date = new Date()) {
  let zone = 'Asia/Jakarta';
  if (tz) {
    try {
      new Intl.DateTimeFormat('id-ID', { timeZone: tz });
      zone = tz;
    } catch {
      // zona tidak valid -> pakai default
    }
  }
  const date = new Intl.DateTimeFormat('id-ID', {
    timeZone: zone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return { zone, date, time, iso: now.toISOString() };
}

/* ------------------------------ Util teks ------------------------------ */

export function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

const STOPWORDS = new Set(
  (
    'tolong coba bisa kamu anda luna apakah apa siapa bagaimana gimana kapan dimana mengapa kenapa ' +
    'saat ini sekarang hari terbaru terkini yang di dan ke dari itu ini dong deh sih ya kah lah ' +
    'jelaskan ceritakan beritahu kasih tau tahu cari carikan info informasi tentang mengenai'
  ).split(' ')
);

export function cleanQuery(q: string): string {
  const base = q
    .replace(/^\s*\/cari\s*/i, '')
    .replace(/[?!.,;:()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = base.split(' ').filter((w) => w && !STOPWORDS.has(w.toLowerCase()));
  const cleaned = words.join(' ').trim();
  return (cleaned.length >= 3 ? cleaned : base).slice(0, 120);
}

/* ------------------------------ Intent ------------------------------ */

export function detectIntents(q: string) {
  const t = q.toLowerCase();
  const weather = /\b(cuaca|hujan|suhu|prakiraan|ramalan cuaca)\b/.test(t);
  const rates = /\b(kurs|nilai tukar|dolar|usd|euro|eur|rupiah|idr|yen|ringgit)\b/.test(t);
  const crypto = /\b(bitcoin|btc|ethereum|eth|kripto|crypto|solana|dogecoin|doge|bnb)\b/.test(t);
  const headlines = /(berita|kabar|headline|ada apa|apa yang terjadi|lagi ramai|trending|viral|peristiwa)/.test(t);
  const facts = /(siapa|apa itu|apa yang dimaksud|profil|biografi|ibu kota|presiden|menteri|gubernur|ceo|pemimpin|jumlah penduduk|berapa)/.test(
    t
  );
  const specialOnly = (weather || rates || crypto) && !headlines && !facts;
  return { weather, rates, crypto, headlines, facts, specialOnly };
}

/* ------------------------------ Berita ------------------------------ */

export interface NewsItem {
  title: string;
  source: string;
  date: string;
}

export function parseRss(xml: string, limit = 6): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && items.length < limit) {
    const block = m[1];
    const get = (tag: string) => {
      const mm = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      if (!mm) return '';
      return decodeEntities(mm[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim();
    };
    let title = get('title');
    const source = stripTags(get('source'));
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const pub = get('pubDate');
    const d = pub ? new Date(pub) : null;
    const date = d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '';
    if (title) items.push({ title, source, date });
  }
  return items;
}

async function newsSearch(q: string): Promise<NewsItem[]> {
  const xml = await getText(
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=id&gl=ID&ceid=ID:id`
  );
  return parseRss(xml, 6);
}

async function headlines(): Promise<{ id: NewsItem[]; world: NewsItem[] }> {
  const [id, world] = await Promise.allSettled([
    getText('https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id'),
    getText('https://news.google.com/rss/headlines/section/topic/WORLD?hl=id&gl=ID&ceid=ID:id'),
  ]);
  return {
    id: id.status === 'fulfilled' ? parseRss(id.value, 6) : [],
    world: world.status === 'fulfilled' ? parseRss(world.value, 6) : [],
  };
}

/* ------------------------------ Web & Wikipedia ------------------------------ */

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

export function parseDuckDuckGo(html: string, limit = 5): WebResult[] {
  const out: WebResult[] = [];
  const re =
    /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < limit) {
    let url = decodeEntities(m[1]);
    const uddg = url.match(/[?&]uddg=([^&]+)/);
    if (uddg) {
      try {
        url = decodeURIComponent(uddg[1]);
      } catch {
        // biarkan
      }
    }
    const title = stripTags(m[2]);
    const snippet = stripTags(m[3]);
    if (title && snippet) out.push({ title, url, snippet });
  }
  return out;
}

async function webSearch(q: string): Promise<WebResult[]> {
  const html = await getText(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=id-id`);
  return parseDuckDuckGo(html, 5);
}

async function wikipedia(q: string): Promise<Array<{ title: string; extract: string }>> {
  const data = await getJson(
    `https://id.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      q
    )}&gsrlimit=2&prop=extracts&exintro=1&explaintext=1&exsentences=3&format=json&formatversion=2`
  );
  const pages: any[] = data?.query?.pages || [];
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((p) => p.extract)
    .map((p) => ({ title: p.title, extract: String(p.extract).slice(0, 600) }));
}

/* ------------------------------ Cuaca ------------------------------ */

const WEATHER_CODES: Record<number, string> = {
  0: 'cerah', 1: 'cerah berawan', 2: 'berawan sebagian', 3: 'berawan tebal',
  45: 'berkabut', 48: 'berkabut', 51: 'gerimis ringan', 53: 'gerimis', 55: 'gerimis lebat',
  61: 'hujan ringan', 63: 'hujan sedang', 65: 'hujan lebat', 80: 'hujan lokal ringan',
  81: 'hujan lokal sedang', 82: 'hujan lokal lebat', 95: 'badai petir', 96: 'badai petir disertai es',
  99: 'badai petir disertai es lebat',
};

export function extractCity(q: string, tz?: string): string {
  const m = q.match(
    /(?:di|untuk|kota|kabupaten|daerah)\s+([a-zA-Z][a-zA-Z\s]{2,28}?)(?=\s+(?:hari|sekarang|besok|lusa|saat|nanti|malam|pagi|siang|sore)\b|[?.,!]|$)/i
  );
  if (m) return m[1].trim();
  const last = (tz || '').split('/').pop();
  return last && last !== 'UTC' ? last.replace(/_/g, ' ') : 'Jakarta';
}

async function weather(q: string, tz?: string): Promise<string> {
  const city = extractCity(q, tz);
  const geo = await getJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`
  );
  const place = geo?.results?.[0];
  if (!place) throw new Error(`Lokasi "${city}" tidak ditemukan`);
  const f = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
  );
  const c = f.current;
  const lines = [
    `Lokasi: ${place.name}${place.admin1 ? `, ${place.admin1}` : ''}, ${place.country || ''}`.trim(),
    `Saat ini (${c.time}): ${WEATHER_CODES[c.weather_code] ?? 'kode ' + c.weather_code}, ${c.temperature_2m}°C ` +
      `(terasa ${c.apparent_temperature}°C), kelembapan ${c.relative_humidity_2m}%, angin ${c.wind_speed_10m} km/j, curah hujan ${c.precipitation} mm`,
  ];
  const d = f.daily;
  for (let i = 0; i < (d?.time?.length || 0); i++) {
    lines.push(
      `${d.time[i]}: ${WEATHER_CODES[d.weather_code[i]] ?? '-'}, ${d.temperature_2m_min[i]}–${d.temperature_2m_max[i]}°C, peluang hujan ${d.precipitation_probability_max[i]}%`
    );
  }
  return lines.join('\n');
}

/* ------------------------------ Kurs & Kripto ------------------------------ */

async function rates(): Promise<string> {
  const d = await getJson('https://open.er-api.com/v6/latest/USD');
  const r = d?.rates;
  if (!r?.IDR) throw new Error('Data kurs kosong');
  const idr = (code: string) => (r[code] ? Math.round(r.IDR / r[code]).toLocaleString('id-ID') : null);
  const parts = ['USD', 'EUR', 'SGD', 'JPY', 'MYR', 'SAR', 'CNY', 'AUD', 'GBP']
    .map((c) => (idr(c) ? `1 ${c} = Rp${idr(c)}` : ''))
    .filter(Boolean);
  return `Kurs terhadap Rupiah (pembaruan ${d.time_last_update_utc}):\n${parts.join('\n')}`;
}

async function crypto(): Promise<string> {
  const ids = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'dogecoin'];
  const d = await getJson(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd,idr&include_24hr_change=true`
  );
  const lines = ids
    .filter((id) => d[id])
    .map((id) => {
      const x = d[id];
      const ch = typeof x.usd_24h_change === 'number' ? `, 24 jam ${x.usd_24h_change.toFixed(2)}%` : '';
      return `${id}: US$${Number(x.usd).toLocaleString('en-US')} (Rp${Math.round(x.idr).toLocaleString('id-ID')})${ch}`;
    });
  if (!lines.length) throw new Error('Data kripto kosong');
  return lines.join('\n');
}

/* ------------------------------ Perakit konteks ------------------------------ */

export interface RealtimeResult {
  context: string;
  sources: string[];
}

const fmtNews = (items: NewsItem[]) =>
  items.map((n, i) => `${i + 1}. ${n.title}${n.source ? ` — ${n.source}` : ''}${n.date ? ` (${n.date})` : ''}`).join('\n');

export async function buildRealtimeContext(query: string, tz?: string): Promise<RealtimeResult> {
  const now = formatNow(tz);
  const q = cleanQuery(query);
  const intent = detectIntents(query);
  const sources: string[] = [];
  const sections: string[] = [];
  const failures: string[] = [];

  type Job = { label: string; source: string; run: () => Promise<string> };
  const jobs: Job[] = [];

  if (intent.weather) jobs.push({ label: 'Cuaca', source: 'Open-Meteo', run: () => weather(query, tz) });
  if (intent.rates) jobs.push({ label: 'Kurs mata uang', source: 'open.er-api.com', run: rates });
  if (intent.crypto) jobs.push({ label: 'Harga kripto', source: 'CoinGecko', run: crypto });

  if (!intent.specialOnly) {
    const genericHeadlines =
      intent.headlines &&
      q
        .toLowerCase()
        .replace(/\b(berita|kabar|headline|ada|apa|terjadi|dunia|indonesia|lagi|ramai|trending|viral|peristiwa|sedang|saja)\b/g, '')
        .trim().length < 3;
    if (genericHeadlines) {
      jobs.push({
        label: 'Headline berita hari ini',
        source: 'Google News',
        run: async () => {
          const h = await headlines();
          if (!h.id.length && !h.world.length) throw new Error('kosong');
          return `Indonesia:\n${fmtNews(h.id)}\n\nDunia:\n${fmtNews(h.world)}`;
        },
      });
    }
    if (!genericHeadlines) jobs.push({
      label: `Berita terkait "${q}"`,
      source: 'Google News',
      run: async () => {
        const n = await newsSearch(q);
        if (!n.length) throw new Error('kosong');
        return fmtNews(n);
      },
    });
    if (!genericHeadlines) jobs.push({
      label: `Hasil pencarian web "${q}"`,
      source: 'DuckDuckGo',
      run: async () => {
        const r = await webSearch(q);
        if (!r.length) throw new Error('kosong');
        return r.map((x, i) => `${i + 1}. ${x.title} — ${x.snippet} (${x.url})`).join('\n');
      },
    });
    if (intent.facts) {
      jobs.push({
        label: `Ringkasan Wikipedia "${q}"`,
        source: 'Wikipedia',
        run: async () => {
          const w = await wikipedia(q);
          if (!w.length) throw new Error('kosong');
          return w.map((x) => `${x.title}: ${x.extract}`).join('\n');
        },
      });
    }
  }

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.trim()) {
      sections.push(`### ${jobs[i].label} (sumber: ${jobs[i].source})\n${r.value}`);
      if (!sources.includes(jobs[i].source)) sources.push(jobs[i].source);
    } else {
      failures.push(jobs[i].source);
    }
  });

  let context =
    `Waktu saat ini: ${now.date}, pukul ${now.time} (zona waktu ${now.zone}). UTC: ${now.iso}.\n` +
    `Pengambilan data: ${now.iso}.\n\n`;
  context += sections.length
    ? sections.join('\n\n')
    : 'Tidak ada data eksternal yang berhasil diambil untuk pertanyaan ini.';
  if (failures.length && sections.length) {
    context += `\n\n(Sumber yang tidak dapat dijangkau: ${[...new Set(failures)].join(', ')}.)`;
  }

  return { context: context.slice(0, 7000), sources };
}
