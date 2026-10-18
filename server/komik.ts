/*
 * Perpustakaan Luna - Komik
 * Sumber: API publik MangaDex (https://api.mangadex.org/docs/).
 *
 * Catatan:
 *  - Hanya konten ber-rating "safe" yang ditampilkan (ramah keluarga).
 *  - Browser tidak memanggil MangaDex langsung (CORS). Semua lewat server ini, dan respons di-cache
 *    di CDN agar tidak kena batas permintaan MangaDex.
 *  - Hak cipta karya dimiliki pembuat/penerbitnya; halaman Luna selalu mencantumkan sumber.
 */

const API = 'https://api.mangadex.org';
const UA = 'LunaAI-Library/1.0 (+https://luna.gimoystudio.my.id)';
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class KomikError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type KomikSort = 'popular' | 'latest' | 'new';
export type KomikLang = 'id' | 'en';

export interface KomikItem {
  id: string;
  title: string;
  description: string;
  cover?: string;
  status?: string;
  year?: number | null;
  tags: string[];
  author?: string;
}

export interface KomikChapter {
  id: string;
  chapter: string | null;
  volume: string | null;
  title: string;
  pages: number;
  publishAt: string;
  group?: string;
}

async function md(path: string, params: Array<[string, string]> = []): Promise<any> {
  const url = new URL(API + path);
  for (const [k, v] of params) url.searchParams.append(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new KomikError(504, 'Sumber komik tidak dapat dihubungi saat ini. Coba lagi sebentar lagi.');
  }
  if (res.status === 429) throw new KomikError(429, 'Terlalu banyak permintaan ke sumber komik. Coba lagi sebentar lagi.');
  if (res.status === 404) throw new KomikError(404, 'Komik atau bab tidak ditemukan.');
  if (!res.ok) throw new KomikError(502, `Sumber komik membalas HTTP ${res.status}.`);
  return res.json();
}

/* ------------------------------ Normalisasi ------------------------------ */

function pick(obj: Record<string, string> | undefined, prefs: string[]): string {
  if (!obj) return '';
  for (const p of prefs) if (obj[p]) return obj[p];
  return Object.values(obj)[0] || '';
}

export function normalizeManga(m: any, lang: KomikLang, coverSize: 256 | 512 = 256): KomikItem {
  const a = m?.attributes || {};
  const prefs = [lang, 'id', 'en'];
  // Utamakan judul dalam bahasa yang dipilih (mis. judul Indonesia), lalu Inggris, lalu romaji
  const alt = (a.altTitles || []).find((t: Record<string, string>) => t[lang]);
  const title =
    alt?.[lang] ||
    pick(a.title, ['en', lang, 'id']) ||
    pick(a.title, ['ja-ro', 'ko-ro', 'ja', 'ko']) ||
    'Tanpa judul';

  const rels: any[] = m?.relationships || [];
  const coverFile = rels.find((r) => r.type === 'cover_art')?.attributes?.fileName;
  const author = rels.find((r) => r.type === 'author')?.attributes?.name;

  return {
    id: m.id,
    title,
    description: pick(a.description, prefs).slice(0, 1200),
    cover: coverFile ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.${coverSize}.jpg` : undefined,
    status: a.status,
    year: a.year ?? null,
    tags: (a.tags || [])
      .map((t: any) => pick(t?.attributes?.name, ['en']))
      .filter(Boolean)
      .slice(0, 6),
    author,
  };
}

export function normalizeChapters(feed: any[]): KomikChapter[] {
  const seen = new Set<string>();
  const out: KomikChapter[] = [];
  for (const c of feed) {
    const a = c?.attributes || {};
    if (!a.pages || a.externalUrl) continue; // bab eksternal / kosong tidak bisa dibaca di sini
    const key = a.chapter != null ? `${a.volume ?? ''}|${a.chapter}` : c.id;
    if (seen.has(key)) continue; // satu bab dari beberapa grup: ambil yang pertama
    seen.add(key);
    out.push({
      id: c.id,
      chapter: a.chapter ?? null,
      volume: a.volume ?? null,
      title: a.title || '',
      pages: a.pages,
      publishAt: a.publishAt || '',
      group: (c.relationships || []).find((r: any) => r.type === 'scanlation_group')?.attributes?.name,
    });
  }
  const num = (c: KomikChapter) => (c.chapter == null ? Number.POSITIVE_INFINITY : parseFloat(c.chapter));
  return out.sort((x, y) => num(x) - num(y));
}

/* ------------------------------ Endpoint ------------------------------ */

export async function listKomik(opts: {
  q?: string;
  sort?: string;
  lang?: string;
  offset?: number;
  limit?: number;
}) {
  const lang: KomikLang = opts.lang === 'en' ? 'en' : 'id';
  const sort: KomikSort = opts.sort === 'latest' || opts.sort === 'new' ? opts.sort : 'popular';
  const limit = Math.min(30, Math.max(6, Math.floor(opts.limit || 24)));
  const offset = Math.max(0, Math.floor(opts.offset || 0));
  const q = (opts.q || '').trim().slice(0, 100);

  const params: Array<[string, string]> = [
    ['limit', String(limit)],
    ['offset', String(offset)],
    ['availableTranslatedLanguage[]', lang],
    ['hasAvailableChapters', 'true'],
    ['contentRating[]', 'safe'],
    ['includes[]', 'cover_art'],
    ['includes[]', 'author'],
  ];
  if (q) {
    params.push(['title', q], ['order[relevance]', 'desc']);
  } else if (sort === 'latest') {
    params.push(['order[latestUploadedChapter]', 'desc']);
  } else if (sort === 'new') {
    params.push(['order[createdAt]', 'desc']);
  } else {
    params.push(['order[followedCount]', 'desc']);
  }

  const json = await md('/manga', params);
  return {
    items: (json.data || []).map((m: any) => normalizeManga(m, lang)),
    total: json.total ?? 0,
    offset,
    limit,
  };
}

export async function getKomik(id: string, langInput?: string) {
  if (!UUID_RE.test(id)) throw new KomikError(400, 'ID komik tidak valid.');
  const lang: KomikLang = langInput === 'en' ? 'en' : 'id';

  const mangaReq = md(`/manga/${id}`, [
    ['includes[]', 'cover_art'],
    ['includes[]', 'author'],
  ]);

  const feed: any[] = [];
  const feedReq = (async () => {
    let offset = 0;
    for (let page = 0; page < 4; page++) {
      const j = await md(`/manga/${id}/feed`, [
        ['translatedLanguage[]', lang],
        ['order[chapter]', 'asc'],
        ['limit', '500'],
        ['offset', String(offset)],
        ['contentRating[]', 'safe'],
        ['includeExternalUrl', '0'],
        ['includes[]', 'scanlation_group'],
      ]);
      feed.push(...(j.data || []));
      offset += 500;
      if (offset >= (j.total || 0)) break;
    }
  })();

  const [mangaJson] = await Promise.all([mangaReq, feedReq]);
  const m = mangaJson.data;
  if (m?.attributes?.contentRating !== 'safe') {
    throw new KomikError(403, 'Konten ini tidak tersedia di Perpustakaan Luna.');
  }
  return { manga: normalizeManga(m, lang, 512), chapters: normalizeChapters(feed), lang };
}

export async function getChapterPages(chapterId: string) {
  if (!UUID_RE.test(chapterId)) throw new KomikError(400, 'ID bab tidak valid.');

  const [meta, home] = await Promise.all([
    md(`/chapter/${chapterId}`, [['includes[]', 'manga']]),
    md(`/at-home/server/${chapterId}`),
  ]);

  const manga = (meta.data?.relationships || []).find((r: any) => r.type === 'manga');
  if (manga?.attributes?.contentRating && manga.attributes.contentRating !== 'safe') {
    throw new KomikError(403, 'Konten ini tidak tersedia di Perpustakaan Luna.');
  }

  const base: string = home.baseUrl;
  const hash: string = home.chapter?.hash;
  const data: string[] = home.chapter?.data || [];
  const saver: string[] = home.chapter?.dataSaver || [];
  if (!base || !hash || (!data.length && !saver.length)) {
    throw new KomikError(502, 'Halaman bab tidak tersedia saat ini.');
  }

  const a = meta.data?.attributes || {};
  return {
    mangaId: manga?.id as string | undefined,
    chapter: a.chapter ?? null,
    title: a.title || '',
    pages: (saver.length ? saver : data).map((f) => `${base}/data-saver/${hash}/${f}`),
    pagesHQ: (data.length ? data : saver).map((f) => `${base}/data/${hash}/${f}`),
  };
}
