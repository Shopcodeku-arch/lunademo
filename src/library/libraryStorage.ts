import { useSyncExternalStore } from 'react';

/** Penyimpanan lokal Perpustakaan: favorit, progres baca, dan preferensi (aman bila localStorage diblokir). */

const KEY = 'luna:library:v1';

export interface KomikFav {
  id: string;
  title: string;
  cover?: string;
}
export interface KomikProgress {
  chapterId: string;
  label: string;
  at: number;
}

export interface LibraryState {
  favKomik: Record<string, KomikFav>;
  favDongeng: string[];
  progressKomik: Record<string, KomikProgress & { title?: string; cover?: string }>;
  readDongeng: Record<string, number>;
  fontSize: number;
}

const EMPTY: LibraryState = { favKomik: {}, favDongeng: [], progressKomik: {}, readDongeng: {}, fontSize: 18 };

let state: LibraryState = load();
const listeners = new Set<() => void>();

function load(): LibraryState {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

function persist(next: LibraryState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // penyimpanan penuh / diblokir: tetap simpan di memori selama sesi
  }
  listeners.forEach((l) => l());
}

export const libraryStore = {
  get: () => state,
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  toggleFavKomik(item: KomikFav) {
    const fav = { ...state.favKomik };
    if (fav[item.id]) delete fav[item.id];
    else fav[item.id] = item;
    persist({ ...state, favKomik: fav });
  },
  toggleFavDongeng(slug: string) {
    const has = state.favDongeng.includes(slug);
    persist({ ...state, favDongeng: has ? state.favDongeng.filter((s) => s !== slug) : [...state.favDongeng, slug] });
  },
  saveKomikProgress(mangaId: string, p: KomikProgress & { title?: string; cover?: string }) {
    persist({ ...state, progressKomik: { ...state.progressKomik, [mangaId]: p } });
  },
  markDongengRead(slug: string) {
    persist({ ...state, readDongeng: { ...state.readDongeng, [slug]: Date.now() } });
  },
  setFontSize(size: number) {
    persist({ ...state, fontSize: Math.min(26, Math.max(15, Math.round(size))) });
  },
};

export function useLibraryState(): LibraryState {
  return useSyncExternalStore(libraryStore.subscribe, libraryStore.get, libraryStore.get);
}
