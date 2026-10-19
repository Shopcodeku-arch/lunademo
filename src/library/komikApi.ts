/** Klien API komik Luna (/api/library/komik...). Respons detail di-cache selama sesi. */

export type KomikLang = 'id' | 'en';
export type KomikSort = 'popular' | 'latest' | 'new';

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
  /** Versi lain dari bab yang sama (grup berbeda), dipakai bila versi utama gagal dimuat. */
  alts?: Array<{ id: string; group?: string; pages: number }>;
}

export interface KomikList {
  items: KomikItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface KomikDetail {
  manga: KomikItem;
  chapters: KomikChapter[];
  lang: KomikLang;
}

export interface KomikPages {
  mangaId?: string;
  chapter: string | null;
  title: string;
  pages: string[];
  pagesHQ: string[];
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Tidak bisa terhubung ke server Luna. Periksa koneksi internet lalu coba lagi.');
  }
  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data) {
    if (res.status === 404 && !data) {
      throw new Error('Server komik Luna belum aktif (404). Pastikan folder api/ ikut ter-deploy.');
    }
    throw new Error(data?.error || `Server membalas HTTP ${res.status}.`);
  }
  return data as T;
}

const detailCache = new Map<string, Promise<KomikDetail>>();

export const komikApi = {
  list(
    p: { q?: string; sort?: KomikSort; lang?: KomikLang; offset?: number; limit?: number },
    signal?: AbortSignal
  ) {
    const params = new URLSearchParams();
    if (p.q) params.set('q', p.q);
    params.set('sort', p.sort || 'popular');
    params.set('lang', p.lang || 'id');
    params.set('offset', String(p.offset || 0));
    params.set('limit', String(p.limit || 24));
    return getJson<KomikList>(`/api/library/komik?${params.toString()}`, signal);
  },

  detail(id: string, lang: KomikLang = 'id', signal?: AbortSignal): Promise<KomikDetail> {
    const key = `${id}|${lang}`;
    let p = detailCache.get(key);
    if (!p) {
      p = getJson<KomikDetail>(`/api/library/komik/${id}?lang=${lang}`, signal).catch((e) => {
        detailCache.delete(key); // jangan cache kegagalan
        throw e;
      });
      detailCache.set(key, p);
    }
    return p;
  },

  chapter(chapterId: string, signal?: AbortSignal) {
    return getJson<KomikPages>(`/api/library/komik/chapter/${chapterId}`, signal);
  },
};

/** Label pendek (untuk dropdown): "Bab 12" / "Oneshot". */
export function chapterShort(c: Pick<KomikChapter, 'chapter'>): string {
  return c.chapter != null ? `Bab ${c.chapter}` : 'Oneshot';
}

export function chapterLabel(c: Pick<KomikChapter, 'chapter' | 'title'>): string {
  const n = c.chapter != null ? `Bab ${c.chapter}` : 'Oneshot';
  return c.title ? `${n}: ${c.title}` : n;
}
