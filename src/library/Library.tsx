import React, { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Link, parseLibraryRoute } from '../utils/router';
import { setPageMeta } from '../utils/pageMeta';
import { DONGENG, FEATURED_SLUGS, getDongeng } from './dongengData';
import { DongengList, StoryCard, StoryReader } from './DongengView';
import { KomikCatalog, KomikDetailView, KomikReader } from './KomikView';
import { StoryCover } from './StoryCover';
import { useLibraryState } from './libraryStorage';

/** Ilustrasi panel komik sederhana (SVG). */
export const ComicArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 240 180" className={className} aria-hidden="true">
    <rect x="6" y="6" width="104" height="82" rx="8" fill="#2a2150" />
    <rect x="118" y="6" width="116" height="48" rx="8" fill="#3b2d78" />
    <rect x="118" y="62" width="116" height="26" rx="8" fill="#241c47" />
    <rect x="6" y="96" width="70" height="78" rx="8" fill="#33286a" />
    <rect x="84" y="96" width="150" height="78" rx="8" fill="#2a2150" />
    <circle cx="58" cy="48" r="20" fill="#8b5cf6" opacity="0.85" />
    <path d="M30 88 q28 -30 56 0z" fill="#6d44e8" opacity="0.8" />
    <path d="M132 22 h76 a8 8 0 0 1 8 8 v6 a8 8 0 0 1 -8 8 h-52 l-14 10 l3 -10 h-13 a8 8 0 0 1 -8 -8 v-6 a8 8 0 0 1 8 -8z" fill="#ede9fe" opacity="0.92" />
    <rect x="140" y="29" width="60" height="4" rx="2" fill="#7c5cff" />
    <rect x="140" y="37" width="40" height="4" rx="2" fill="#a78bfa" />
    <path d="M18 160 l20 -40 l16 24 l12 -14 l0 30z" fill="#8b5cf6" opacity="0.7" />
    <path d="M96 150 q30 -40 62 -8 t66 -10" stroke="#c4b5fd" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const Hub: React.FC = () => {
  const lib = useLibraryState();

  useEffect(() => {
    setPageMeta({
      title: 'Perpustakaan Luna: Baca Komik & Dongeng Indonesia Gratis',
      description:
        'Perpustakaan Luna: baca komik online dan dongeng Indonesia (Si Kancil, Malin Kundang, Timun Mas, dan lainnya) gratis, bisa didengarkan, tanpa perlu akun.',
      path: '/perpustakaan',
    });
  }, []);

  const lastKomik = Object.entries(lib.progressKomik).sort((a, b) => b[1].at - a[1].at)[0];
  const lastStorySlug = Object.entries(lib.readDongeng).sort((a, b) => b[1] - a[1])[0]?.[0];
  const lastStory = lastStorySlug ? getDongeng(lastStorySlug) : undefined;
  const featured = FEATURED_SLUGS.map((s) => getDongeng(s)).filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
        <BookOpen className="h-4 w-4" /> Perpustakaan Luna
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-neutral-50 sm:text-5xl">
        Mau baca apa hari ini?
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">
        Komik dan dongeng Indonesia dalam satu tempat. Gratis, tanpa perlu masuk akun, dan bisa dibaca di HP maupun komputer.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          to="/perpustakaan/komik"
          className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d1740] to-[#14122a] p-6 transition-transform duration-300 hover:-translate-y-1"
        >
          <ComicArt className="pointer-events-none absolute -right-6 -top-2 w-64 opacity-90 transition-transform duration-500 group-hover:scale-105 sm:w-72" />
          <span className="relative max-w-[55%]">
            <span className="text-2xl font-semibold tracking-tight text-white">Komik</span>
            <span className="mt-2 block text-sm leading-relaxed text-neutral-300">Ribuan judul, cari dan simpan favorit.</span>
          </span>
          <span className="relative mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur group-hover:bg-white/20">
            Buka komik <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          to="/perpustakaan/dongengid"
          className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2a2c] to-[#101a2e] p-6 transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="pointer-events-none absolute -right-4 top-3 flex">
            {['si-kancil-dan-buaya', 'malin-kundang', 'sangkuriang'].map((slug, i) => {
              const d = getDongeng(slug)!;
              return (
                <div
                  key={slug}
                  className="relative -ml-10 h-40 w-28 overflow-hidden rounded-xl border border-white/15 shadow-xl shadow-black/50 transition-transform duration-500 group-hover:-translate-y-1"
                  style={{ transform: `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -6 : 6}px)`, zIndex: i }}
                >
                  <StoryCover scene={d.scene} hue={d.hue} className="absolute inset-0 h-full w-full" />
                </div>
              );
            })}
          </div>
          <span className="relative max-w-[50%]">
            <span className="text-2xl font-semibold tracking-tight text-white">Dongeng Indonesia</span>
            <span className="mt-2 block text-sm leading-relaxed text-neutral-300">Si Kancil dan cerita rakyat Nusantara.</span>
          </span>
          <span className="relative mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur group-hover:bg-white/20">
            Buka dongeng <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {(lastKomik || lastStory) && (
        <section className="mt-9" aria-label="Lanjutkan membaca">
          <h2 className="text-sm font-semibold text-neutral-200">Lanjutkan membaca</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {lastKomik && (
              <Link
                to={`/perpustakaan/komik/${lastKomik[0]}/${lastKomik[1].chapterId}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#16151d] p-3 transition-colors hover:bg-[#1c1b25]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><BookOpen className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-neutral-100">{lastKomik[1].title || 'Komik'}</span>
                  <span className="block truncate text-xs text-violet-300">{lastKomik[1].label}</span>
                </span>
              </Link>
            )}
            {lastStory && (
              <Link
                to={`/perpustakaan/dongengid/${lastStory.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#16151d] p-3 transition-colors hover:bg-[#1c1b25]"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <StoryCover scene={lastStory.scene} hue={lastStory.hue} className="absolute inset-0 h-full w-full" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-neutral-100">{lastStory.title}</span>
                  <span className="block truncate text-xs text-neutral-400">Dongeng · baca lagi</span>
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="mt-10" aria-label="Pilihan dongeng">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-100">Pilihan untuk dibaca</h2>
            <p className="mt-0.5 text-sm text-neutral-400">Si Kancil dan cerita-cerita yang paling sering dikenang.</p>
          </div>
          <Link to="/perpustakaan/dongengid" className="hidden items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200 sm:inline-flex">
            Lihat semua ({DONGENG.length}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {featured.map((d) => (
            <StoryCard key={d.slug} story={d} className="w-36 shrink-0 sm:w-40" />
          ))}
        </div>
      </section>

      <div className="mt-10 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-neutral-300">Ingin tahu apa saja yang baru di Luna?</p>
        <button
          onClick={() => window.dispatchEvent(new Event('luna:whatsnew'))}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-neutral-100 hover:bg-white/10"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Fitur terbaru
        </button>
      </div>
    </div>
  );
};

interface LibraryProps {
  pathname: string;
  search: string;
  onAskLuna: (prompt: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ pathname, search, onAskLuna }) => {
  const route = parseLibraryRoute(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Kembali ke atas setiap berpindah halaman
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  let content: React.ReactNode;
  switch (route.view) {
    case 'komik':
      content = <KomikCatalog />;
      break;
    case 'komik-detail':
      content = <KomikDetailView id={route.id} search={search} />;
      break;
    case 'komik-reader':
      content = <KomikReader id={route.id} chapterId={route.chapterId} search={search} />;
      break;
    case 'dongeng':
      content = <DongengList />;
      break;
    case 'dongeng-story':
      content = <StoryReader slug={route.slug} scrollRef={scrollRef} onAskLuna={onAskLuna} />;
      break;
    default:
      content = <Hub />;
  }

  return (
    <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-24 sm:px-6">{content}</div>
    </main>
  );
};
