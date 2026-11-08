import { useEffect, useSyncExternalStore } from 'react';

/**
 * Sampul asli dongeng (foto berlisensi terbuka dari Wikimedia Commons).
 * Sumber data: /covers.json (dibuat saat build) lalu /api/library/cover/:slug untuk yang belum ada.
 * Selama belum ada / gagal dimuat, tampilan memakai ilustrasi bawaan.
 */

export interface CoverCredit {
  article: string;
  articleUrl: string;
  fileUrl: string;
  author: string;
  license: string;
}
export interface CoverInfo {
  url: string;
  width: number;
  height: number;
  credit: CoverCredit;
}

type Entry = CoverInfo | null; // null = tidak ada gambar berlisensi terbuka
const LS_KEY = 'luna:covers:v1';
const TTL_OK = 7 * 24 * 3600_000;
const TTL_MISS = 6 * 3600_000;

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
const pending = new Set<string>();
const queue: string[] = [];
let active = 0;
let manifest: Promise<void> | null = null;

const emit = () => listeners.forEach((l) => l());

function loadLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Record<string, { at: number; c: Entry }>;
    const now = Date.now();
    for (const [slug, v] of Object.entries(raw)) {
      if (!v || typeof v.at !== 'number') continue;
      if (now - v.at < (v.c ? TTL_OK : TTL_MISS)) entries.set(slug, v.c);
    }
  } catch {
    // diabaikan
  }
}
function saveLocal(slug: string, c: Entry) {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    raw[slug] = { at: Date.now(), c };
    localStorage.setItem(LS_KEY, JSON.stringify(raw));
  } catch {
    // diabaikan
  }
}
if (typeof window !== 'undefined') loadLocal();

function ensureManifest(): Promise<void> {
  if (!manifest) {
    manifest = fetch('/covers.json', { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.covers) return;
        for (const [slug, c] of Object.entries(j.covers as Record<string, Entry>)) {
          if (c && c.url && !entries.get(slug)) {
            entries.set(slug, c);
            saveLocal(slug, c);
          }
        }
        emit();
      })
      .catch(() => undefined);
  }
  return manifest;
}

async function fetchOne(slug: string) {
  await ensureManifest();
  if (entries.get(slug)) return; // sudah dari manifest
  try {
    const res = await fetch(`/api/library/cover/${slug}`);
    const data = res.ok ? await res.json() : null;
    const c: Entry = data?.cover?.url ? (data.cover as CoverInfo) : null;
    if (res.ok) {
      entries.set(slug, c);
      saveLocal(slug, c);
      emit();
    }
  } catch {
    // jaringan bermasalah: biarkan memakai ilustrasi, coba lagi saat berikutnya
  }
}

function pump() {
  while (active < 3 && queue.length) {
    const slug = queue.shift()!;
    active++;
    fetchOne(slug).finally(() => {
      active--;
      pending.delete(slug);
      pump();
    });
  }
}

export function requestCover(slug: string) {
  if (typeof window === 'undefined') return;
  if (entries.has(slug) && entries.get(slug)) return;
  if (pending.has(slug) || (entries.has(slug) && entries.get(slug) === null)) return;
  pending.add(slug);
  queue.push(slug);
  pump();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Sampul asli untuk cerita ini (null bila belum ada / tidak tersedia). */
export function useCover(slug?: string): CoverInfo | null {
  useEffect(() => {
    if (slug) requestCover(slug);
  }, [slug]);
  return useSyncExternalStore(
    subscribe,
    () => (slug ? entries.get(slug) ?? null : null),
    () => null
  );
}
