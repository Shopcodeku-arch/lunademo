import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpDown, BookOpen, Bookmark, Loader2, RefreshCw, Search } from 'lucide-react';
import { Link, navigate } from '../utils/router';
import { setPageMeta } from '../utils/pageMeta';
import {
  KomikChapter,
  KomikDetail,
  KomikItem,
  KomikLang,
  KomikPages,
  KomikSort,
  chapterLabel,
  komikApi,
} from './komikApi';
import { libraryStore, useLibraryState } from './libraryStorage';

const CREDIT =
  'Data dan gambar komik bersumber dari MangaDex. Hak cipta karya ada pada pembuat dan penerbitnya masing-masing.';

const langQuery = (lang: KomikLang) => (lang === 'en' ? '?lang=en' : '');
const parseLang = (search: string): KomikLang => (new URLSearchParams(search).get('lang') === 'en' ? 'en' : 'id');

/* ------------------------------ Bagian kecil ------------------------------ */

const Cover: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-[#1a1922] text-neutral-500 ${className}`}>
        <BookOpen className="h-8 w-8" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`bg-[#1a1922] object-cover ${className}`}
    />
  );
};

const ErrorBox: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="mx-auto mt-10 max-w-md rounded-2xl border border-rose-800/60 bg-rose-950/40 p-5 text-center">
    <p className="text-sm leading-relaxed text-rose-100">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-900/80 px-4 py-2 text-xs font-medium text-white hover:bg-rose-800"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
      </button>
    )}
  </div>
);

const Credit: React.FC = () => <p className="mt-12 border-t border-white/5 pt-5 text-center text-[11px] leading-relaxed text-neutral-500">{CREDIT}</p>;

const KomikCard: React.FC<{ item: KomikItem; lang: KomikLang }> = ({ item, lang }) => (
  <Link
    to={`/perpustakaan/komik/${item.id}${langQuery(lang)}`}
    className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
  >
    <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#16151d] shadow-lg shadow-black/30 transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-[0.98]">
      <Cover src={item.cover} alt={`Sampul ${item.title}`} className="h-full w-full" />
    </div>
    <h3 className="mt-2.5 line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-100 group-hover:text-white">{item.title}</h3>
    {item.tags.length > 0 && <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-400">{item.tags.slice(0, 3).join(' · ')}</p>}
  </Link>
);

const SkeletonGrid: React.FC<{ n?: number }> = ({ n = 8 }) => (
  <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
    {Array.from({ length: n }, (_, i) => (
      <div key={i}>
        <div className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[0.05]" />
        <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-white/[0.06]" />
      </div>
    ))}
  </div>
);

/* ------------------------------ Katalog ------------------------------ */

const SORTS: Array<{ key: KomikSort; label: string }> = [
  { key: 'popular', label: 'Populer' },
  { key: 'latest', label: 'Update terbaru' },
  { key: 'new', label: 'Baru ditambahkan' },
];

export const KomikCatalog: React.FC = () => {
  const lib = useLibraryState();
  const [tab, setTab] = useState<'jelajah' | 'favorit'>('jelajah');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<KomikSort>('popular');
  const [lang, setLang] = useState<KomikLang>('id');
  const [items, setItems] = useState<KomikItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const reqRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Baca Komik Online Gratis Bahasa Indonesia | Perpustakaan Luna',
      description:
        'Baca komik online gratis dalam bahasa Indonesia di Perpustakaan Luna. Cari judul, simpan favorit, dan lanjutkan membaca dari bab terakhir.',
      path: '/perpustakaan/komik',
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 450);
    return () => clearTimeout(t);
  }, [qInput]);

  // Muat ulang dari awal saat pencarian / urutan / bahasa berubah
  useEffect(() => {
    if (tab !== 'jelajah') return;
    reqRef.current?.abort();
    const ctrl = new AbortController();
    reqRef.current = ctrl;
    setLoading(true);
    setError(null);
    setItems([]);
    komikApi
      .list({ q, sort, lang, offset: 0 }, ctrl.signal)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [q, sort, lang, tab, retry]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const r = await komikApi.list({ q, sort, lang, offset: items.length });
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...r.items.filter((x) => !seen.has(x.id))];
      });
      setTotal(r.total);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, sort, lang, items.length]);

  const favs = Object.values(lib.favKomik);
  const continueList = useMemo(
    () =>
      Object.entries(lib.progressKomik)
        .sort((a, b) => b[1].at - a[1].at)
        .slice(0, 6),
    [lib.progressKomik]
  );

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active ? 'border-violet-400/60 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.07]'
    }`;

  return (
    <div>
      <nav aria-label="Navigasi" className="mb-4 text-xs text-neutral-400">
        <Link to="/perpustakaan" className="hover:text-white">Perpustakaan</Link>
        <span className="mx-1.5" aria-hidden="true">/</span>
        <span className="text-neutral-200">Komik</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">Komik</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-neutral-400">
        Jelajahi ribuan judul, simpan favorit, dan lanjutkan membaca dari bab terakhir. Hanya konten ramah keluarga yang ditampilkan.
      </p>

      {continueList.length > 0 && (
        <section className="mt-7" aria-label="Lanjutkan membaca">
          <h2 className="text-sm font-semibold text-neutral-200">Lanjutkan membaca</h2>
          <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {continueList.map(([id, p]) => (
              <Link
                key={id}
                to={`/perpustakaan/komik/${id}/${p.chapterId}`}
                className="flex w-64 shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#16151d] p-2.5 transition-colors hover:bg-[#1c1b25]"
              >
                <Cover src={p.cover} alt="" className="h-16 w-11 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-neutral-100">{p.title || 'Komik'}</span>
                  <span className="block truncate text-xs text-violet-300">{p.label}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-7 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Tampilan komik">
          <button role="tab" aria-selected={tab === 'jelajah'} onClick={() => setTab('jelajah')} className={chip(tab === 'jelajah')}>Jelajahi</button>
          <button role="tab" aria-selected={tab === 'favorit'} onClick={() => setTab('favorit')} className={chip(tab === 'favorit')}>
            Favorit{favs.length ? ` (${favs.length})` : ''}
          </button>
        </div>

        {tab === 'jelajah' && (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative lg:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Cari judul komik..."
                aria-label="Cari judul komik"
                className="h-10 w-full rounded-full border border-neutral-800 bg-[#16151d] pl-10 pr-4 text-base text-neutral-200 outline-none placeholder:text-neutral-500 focus:border-violet-500/70 sm:text-sm"
              />
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
              {SORTS.map((s) => (
                <button key={s.key} onClick={() => setSort(s.key)} className={chip(sort === s.key && !q)} disabled={!!q} title={q ? 'Urutan mengikuti kecocokan saat mencari' : undefined}>
                  {s.label}
                </button>
              ))}
              <span className="mx-1 w-px shrink-0 self-stretch bg-white/10" aria-hidden="true" />
              <button onClick={() => setLang('id')} className={chip(lang === 'id')}>Bahasa Indonesia</button>
              <button onClick={() => setLang('en')} className={chip(lang === 'en')}>English</button>
            </div>
          </div>
        )}
      </div>

      {tab === 'favorit' ? (
        favs.length === 0 ? (
          <p className="mt-16 text-center text-sm text-neutral-400">Belum ada komik favorit. Ketuk tombol Simpan di halaman komik.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {favs.map((f) => (
              <KomikCard key={f.id} item={{ id: f.id, title: f.title, cover: f.cover, description: '', tags: [] }} lang={lang} />
            ))}
          </div>
        )
      ) : error && items.length === 0 ? (
        <ErrorBox message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : loading && items.length === 0 ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-neutral-400">Tidak ada komik yang cocok{q ? ` dengan “${q}”` : ''}.</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <KomikCard key={it.id} item={it} lang={lang} />
            ))}
          </div>
          {error && <ErrorBox message={error} />}
          {items.length < total && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 py-2.5 text-sm font-medium text-neutral-100 transition-colors hover:bg-white/[0.1] disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Muat lebih banyak
              </button>
            </div>
          )}
        </>
      )}
      <Credit />
    </div>
  );
};

/* ------------------------------ Detail komik ------------------------------ */

export const KomikDetailView: React.FC<{ id: string; search: string }> = ({ id, search }) => {
  const lang = parseLang(search);
  const lib = useLibraryState();
  const [data, setData] = useState<KomikDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [newestFirst, setNewestFirst] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);
    komikApi
      .detail(id, lang, ctrl.signal)
      .then((d) => {
        if (ctrl.signal.aborted) return;
        setData(d);
        setPageMeta({
          title: `${d.manga.title} - Baca Komik Online | Perpustakaan Luna`,
          description: d.manga.description ? d.manga.description.slice(0, 155) : `Baca komik ${d.manga.title} di Perpustakaan Luna.`,
          path: `/perpustakaan/komik/${id}`,
        });
      })
      .catch((e) => {
        if (e?.name !== 'AbortError' && !ctrl.signal.aborted) setError(e.message);
      });
    return () => ctrl.abort();
  }, [id, lang, retry]);

  if (error) return <ErrorBox message={error} onRetry={() => setRetry((n) => n + 1)} />;

  if (!data) {
    return (
      <div className="animate-pulse" aria-busy="true">
        <div className="flex gap-5">
          <div className="aspect-[2/3] w-36 shrink-0 rounded-2xl bg-white/[0.06] sm:w-48" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-7 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
            <div className="h-3 w-full rounded bg-white/[0.05]" />
            <div className="h-3 w-5/6 rounded bg-white/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  const { manga, chapters } = data;
  const isFav = Boolean(lib.favKomik[manga.id]);
  const progress = lib.progressKomik[manga.id];
  const first = chapters[0];
  const shown = newestFirst ? [...chapters].reverse() : chapters;
  const resume = progress && chapters.find((c) => c.id === progress.chapterId);
  const target = resume || first;
  const readLink = target ? `/perpustakaan/komik/${manga.id}/${target.id}${langQuery(lang)}` : null;

  return (
    <div>
      <nav aria-label="Navigasi" className="mb-4 text-xs text-neutral-400">
        <Link to="/perpustakaan" className="hover:text-white">Perpustakaan</Link>
        <span className="mx-1.5" aria-hidden="true">/</span>
        <Link to="/perpustakaan/komik" className="hover:text-white">Komik</Link>
      </nav>

      <div className="flex gap-5">
        <Cover
          src={manga.cover}
          alt={`Sampul ${manga.title}`}
          className="aspect-[2/3] w-36 shrink-0 rounded-2xl border border-white/10 shadow-xl shadow-black/40 sm:w-48"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-neutral-50 sm:text-4xl">{manga.title}</h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            {[manga.author, manga.year, manga.status].filter(Boolean).join(' · ')}
          </p>
          {manga.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {manga.tags.map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-neutral-300">{t}</span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {readLink && (
              <Link
                to={readLink}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 active:scale-95"
              >
                <BookOpen className="h-4 w-4" />
                {resume ? `Lanjutkan ${progress.label}` : 'Mulai membaca'}
              </Link>
            )}
            <button
              onClick={() => libraryStore.toggleFavKomik({ id: manga.id, title: manga.title, cover: manga.cover })}
              aria-pressed={isFav}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/[0.09] active:scale-95"
            >
              <Bookmark className={`h-4 w-4 ${isFav ? 'fill-violet-400 text-violet-400' : ''}`} />
              {isFav ? 'Tersimpan' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      {manga.description && (
        <div className="mt-6 max-w-2xl">
          <p className={`whitespace-pre-line text-[15px] leading-relaxed text-neutral-300 ${expanded ? '' : 'line-clamp-4'}`}>{manga.description}</p>
          {manga.description.length > 260 && (
            <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs font-medium text-violet-300 hover:text-violet-200">
              {expanded ? 'Ringkas' : 'Selengkapnya'}
            </button>
          )}
        </div>
      )}

      <section className="mt-8" aria-label="Daftar bab">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-100">{chapters.length} bab</h2>
          {chapters.length > 1 && (
            <button onClick={() => setNewestFirst(!newestFirst)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/[0.09]">
              <ArrowUpDown className="h-3.5 w-3.5" /> {newestFirst ? 'Terbaru dulu' : 'Terlama dulu'}
            </button>
          )}
        </div>
        {chapters.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-400">
            Belum ada bab yang bisa dibaca di sini untuk bahasa ini.{lang === 'id' ? ' Coba pilih English di halaman katalog.' : ''}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-[#16151d]">
            {shown.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/perpustakaan/komik/${manga.id}/${c.id}${langQuery(lang)}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04] ${
                    progress?.chapterId === c.id ? 'bg-violet-500/10' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-neutral-100">{chapterLabel(c)}</span>
                    <span className="block truncate text-[11px] text-neutral-500">
                      {c.pages} halaman{c.group ? ` · ${c.group}` : ''}
                      {c.publishAt ? ` · ${new Date(c.publishAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-neutral-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Credit />
    </div>
  );
};

/* ------------------------------ Pembaca komik ------------------------------ */

const PageImage: React.FC<{ src: string; index: number }> = ({ src, index }) => {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [nonce, setNonce] = useState(0);
  return (
    <div className={`relative w-full ${state === 'ok' ? '' : 'min-h-[60vh]'}`}>
      {state !== 'ok' && (
        <div className="absolute inset-0 grid place-items-center bg-white/[0.03] text-xs text-neutral-500">
          {state === 'error' ? (
            <button
              onClick={() => {
                setState('loading');
                setNonce((n) => n + 1);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-neutral-200 hover:bg-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Muat ulang halaman {index + 1}
            </button>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </div>
      )}
      <img
        key={nonce}
        src={nonce ? `${src}${src.includes('?') ? '&' : '?'}r=${nonce}` : src}
        alt={`Halaman ${index + 1}`}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={`mx-auto block h-auto w-full ${state === 'ok' ? '' : 'opacity-0'}`}
      />
    </div>
  );
};

export const KomikReader: React.FC<{ id: string; chapterId: string; search: string }> = ({ id, chapterId, search }) => {
  const lang = parseLang(search);
  const [pages, setPages] = useState<KomikPages | null>(null);
  const [detail, setDetail] = useState<KomikDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [hq, setHq] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setPages(null);
    setError(null);
    komikApi
      .chapter(chapterId, ctrl.signal)
      .then((p) => !ctrl.signal.aborted && setPages(p))
      .catch((e) => {
        if (e?.name !== 'AbortError' && !ctrl.signal.aborted) setError(e.message);
      });
    komikApi
      .detail(id, lang, ctrl.signal)
      .then((d) => !ctrl.signal.aborted && setDetail(d))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [id, chapterId, lang, retry]);

  const chapters: KomikChapter[] = detail?.chapters || [];
  const idx = chapters.findIndex((c) => c.id === chapterId);
  const current = idx >= 0 ? chapters[idx] : null;
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;
  const label = current ? chapterLabel(current) : pages?.chapter ? `Bab ${pages.chapter}` : 'Membaca';

  useEffect(() => {
    setPageMeta({
      title: `${detail?.manga.title || 'Komik'} - ${label} | Perpustakaan Luna`,
      path: `/perpustakaan/komik/${id}/${chapterId}`,
      noindex: true,
    });
  }, [detail, label, id, chapterId]);

  // Simpan progres membaca
  useEffect(() => {
    if (!pages) return;
    libraryStore.saveKomikProgress(id, {
      chapterId,
      label: current ? chapterLabel({ chapter: current.chapter, title: '' }) : label,
      at: Date.now(),
      title: detail?.manga.title,
      cover: detail?.manga.cover,
    });
  }, [pages, id, chapterId, detail, current, label]);

  const go = (c: KomikChapter | null) => c && navigate(`/perpustakaan/komik/${id}/${c.id}${langQuery(lang)}`);
  const list = pages ? (hq ? pages.pagesHQ : pages.pages) : [];

  return (
    <div className="-mx-4 sm:-mx-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pb-3 sm:px-6">
        <Link to={`/perpustakaan/komik/${id}${langQuery(lang)}`} className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> <span className="truncate">{detail?.manga.title || 'Kembali'}</span>
        </Link>
        <label className="flex shrink-0 items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={hq} onChange={(e) => setHq(e.target.checked)} className="accent-violet-500" />
          Kualitas tinggi
        </label>
      </div>

      {error ? (
        <div className="px-4"><ErrorBox message={error} onRetry={() => setRetry((n) => n + 1)} /></div>
      ) : !pages ? (
        <div className="grid min-h-[50vh] place-items-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="mx-auto max-w-3xl bg-black/30">
          {list.map((src, i) => (
            <PageImage key={`${hq}-${src}`} src={src} index={i} />
          ))}
        </div>
      )}

      {pages && (
        <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-3 px-4 text-center">
          <p className="text-sm text-neutral-300">Selesai membaca {label}.</p>
          <div className="flex gap-2">
            {next ? (
              <button onClick={() => go(next)} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 active:scale-95">
                Bab berikutnya <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link to={`/perpustakaan/komik/${id}${langQuery(lang)}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-neutral-100 hover:bg-white/10">
                Kembali ke daftar bab
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Bilah navigasi bab */}
      <div className="sticky bottom-0 z-10 mt-8 border-t border-white/10 bg-[#0d0c12]/92 px-3 py-2.5 backdrop-blur pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button onClick={() => go(prev)} disabled={!prev} aria-label="Bab sebelumnya" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-neutral-100 transition-colors hover:bg-white/10 disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <select
            value={chapterId}
            onChange={(e) => go(chapters.find((c) => c.id === e.target.value) || null)}
            aria-label="Pilih bab"
            className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-[#16151d] px-4 text-base text-neutral-100 outline-none focus:border-violet-500/70 sm:text-sm"
          >
            {chapters.length === 0 && <option value={chapterId}>{label}</option>}
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{chapterLabel(c)}</option>
            ))}
          </select>
          <button onClick={() => go(next)} disabled={!next} aria-label="Bab berikutnya" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-neutral-100 transition-colors hover:bg-white/10 disabled:opacity-30">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
