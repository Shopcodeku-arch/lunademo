import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Headphones,
  MapPin,
  MessageCircle,
  Minus,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  Square,
} from 'lucide-react';
import { Link } from '../utils/router';
import { setPageMeta } from '../utils/pageMeta';
import { copyText } from '../utils/clipboard';
import { DONGENG, Dongeng, DongengCategory, getDongeng, readMinutes } from './dongengData';
import { StoryCover } from './StoryCover';
import { libraryStore, useLibraryState } from './libraryStorage';

/* ------------------------------ Kartu cerita ------------------------------ */

export const StoryCard: React.FC<{ story: Dongeng; className?: string }> = ({ story, className = '' }) => (
  <Link
    to={`/perpustakaan/dongengid/${story.slug}`}
    className={`group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${className}`}
  >
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#16151d] shadow-lg shadow-black/30 transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-[0.98]">
      <StoryCover scene={story.scene} hue={story.hue} className="absolute inset-0 h-full w-full" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/90 backdrop-blur">
        {story.category}
      </span>
    </div>
    <h3 className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-100 group-hover:text-white">
      {story.title}
    </h3>
    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
      <MapPin className="h-3 w-3 shrink-0" />
      <span className="truncate">{story.origin}</span>
      <span aria-hidden="true">·</span>
      <span className="shrink-0">{readMinutes(story)} mnt</span>
    </p>
  </Link>
);

/* ------------------------------ Daftar dongeng ------------------------------ */

type Filter = 'Semua' | DongengCategory | 'Favorit';
const FILTERS: Filter[] = ['Semua', 'Fabel', 'Legenda', 'Cerita Rakyat', 'Favorit'];

export const DongengList: React.FC = () => {
  const lib = useLibraryState();
  const [filter, setFilter] = useState<Filter>('Semua');
  const [q, setQ] = useState('');

  useEffect(() => {
    setPageMeta({
      title: 'Dongeng Indonesia: Kumpulan Cerita Rakyat, Legenda & Fabel Si Kancil | Perpustakaan Luna',
      description:
        'Baca dongeng Indonesia gratis: Si Kancil, Malin Kundang, Bawang Merah Bawang Putih, Timun Mas, Sangkuriang, Danau Toba, dan banyak lagi, lengkap dengan pesan moral dan mode dengarkan.',
      path: '/perpustakaan/dongengid',
    });
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return DONGENG.filter((d) => {
      if (filter === 'Favorit' && !lib.favDongeng.includes(d.slug)) return false;
      if (filter !== 'Semua' && filter !== 'Favorit' && d.category !== filter) return false;
      if (!needle) return true;
      return (
        d.title.toLowerCase().includes(needle) ||
        d.origin.toLowerCase().includes(needle) ||
        d.keywords.some((k) => k.includes(needle))
      );
    });
  }, [filter, q, lib.favDongeng]);

  return (
    <div>
      <nav aria-label="Navigasi" className="mb-4 text-xs text-neutral-400">
        <Link to="/perpustakaan" className="hover:text-white">Perpustakaan</Link>
        <span className="mx-1.5" aria-hidden="true">/</span>
        <span className="text-neutral-200">Dongeng Indonesia</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">Dongeng Indonesia</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-neutral-400">
        Kumpulan cerita rakyat dari berbagai daerah, dari kecerdikan Si Kancil sampai legenda gunung dan danau. Bisa dibaca
        sendiri atau didengarkan.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Kategori dongeng">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                  : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.07]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari dongeng..."
            aria-label="Cari dongeng"
            className="h-10 w-full rounded-full border border-neutral-800 bg-[#16151d] pl-10 pr-4 text-base text-neutral-200 outline-none placeholder:text-neutral-500 focus:border-violet-500/70 sm:text-sm"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-16 text-center text-sm text-neutral-400">
          {filter === 'Favorit' ? 'Belum ada dongeng favorit. Ketuk ikon penanda di halaman cerita.' : 'Tidak ada dongeng yang cocok.'}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((d) => (
            <StoryCard key={d.slug} story={d} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------ Suara (dengarkan) ------------------------------ */

function splitChunks(text: string, max = 200): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*[”"]?\s*/g) || [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function useSpeech(texts: string[]) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [index, setIndex] = useState(-1);
  const idxRef = useRef(0);
  const tokenRef = useRef(0);
  const keepRef = useRef<SpeechSynthesisUtterance | null>(null); // cegah objek dibuang GC sebelum selesai

  const cancel = () => {
    tokenRef.current++;
    if (supported) window.speechSynthesis.cancel();
  };

  const speakFrom = (start: number) => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const token = ++tokenRef.current;
    setState('playing');

    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('id'));

    const next = (k: number) => {
      if (token !== tokenRef.current) return;
      if (k >= texts.length) {
        setState('idle');
        setIndex(-1);
        return;
      }
      idxRef.current = k;
      setIndex(k);
      const chunks = splitChunks(texts[k]);
      let c = 0;
      const run = () => {
        if (token !== tokenRef.current) return;
        if (c >= chunks.length) {
          next(k + 1);
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[c++]);
        u.lang = 'id-ID';
        u.rate = 0.95;
        if (voice) u.voice = voice;
        u.onend = run;
        u.onerror = () => {
          if (token === tokenRef.current) {
            setState('idle');
            setIndex(-1);
          }
        };
        keepRef.current = u;
        synth.speak(u);
      };
      run();
    };
    next(start);
  };

  useEffect(() => cancel, []); // berhenti saat meninggalkan halaman

  return {
    supported,
    state,
    index,
    play: () => speakFrom(state === 'paused' ? idxRef.current : 0),
    pause: () => {
      cancel();
      setState('paused');
    },
    stop: () => {
      cancel();
      setState('idle');
      setIndex(-1);
      idxRef.current = 0;
    },
  };
}

/* ------------------------------ Pembaca cerita ------------------------------ */

interface StoryReaderProps {
  slug: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onAskLuna: (prompt: string) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({ slug, scrollRef, onAskLuna }) => {
  const story = getDongeng(slug);
  const lib = useLibraryState();
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const paraRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const speech = useSpeech(story ? story.paragraphs : []);

  useEffect(() => {
    if (!story) {
      setPageMeta({ title: 'Dongeng tidak ditemukan | Perpustakaan Luna', path: `/perpustakaan/dongengid/${slug}`, noindex: true });
      return;
    }
    setPageMeta({
      title: `${story.title}: Dongeng ${story.category} dari ${story.origin} | Perpustakaan Luna`,
      description: `${story.summary} Baca ceritanya lengkap dengan pesan moral di Perpustakaan Luna.`,
      path: `/perpustakaan/dongengid/${story.slug}`,
    });
    libraryStore.markDongengRead(story.slug);
  }, [story, slug]);

  // Progres membaca
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, slug]);

  // Gulir ke paragraf yang sedang dibacakan
  useEffect(() => {
    if (speech.index >= 0) {
      paraRefs.current[speech.index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [speech.index]);

  if (!story) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold text-neutral-100">Dongeng tidak ditemukan</h1>
        <p className="mt-2 text-sm text-neutral-400">Cerita yang kamu cari tidak ada atau tautannya salah.</p>
        <Link to="/perpustakaan/dongengid" className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">
          <ArrowLeft className="h-4 w-4" /> Lihat semua dongeng
        </Link>
      </div>
    );
  }

  const idx = DONGENG.findIndex((d) => d.slug === story.slug);
  const prev = idx > 0 ? DONGENG[idx - 1] : null;
  const next = idx < DONGENG.length - 1 ? DONGENG[idx + 1] : null;
  const isFav = lib.favDongeng.includes(story.slug);
  const fontSize = lib.fontSize;

  const share = async () => {
    const url = `${window.location.origin}/perpustakaan/dongengid/${story.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: story.title, text: story.summary, url });
        return;
      }
    } catch {
      return; // pengguna membatalkan
    }
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const btn =
    'inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-neutral-200 transition-colors hover:bg-white/[0.09] active:scale-95';

  return (
    <article>
      {/* Bilah progres membaca */}
      <div className="pointer-events-none sticky top-0 z-10 -mx-4 h-[3px] bg-transparent sm:-mx-6" aria-hidden="true">
        <div className="h-full bg-violet-400 transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <nav aria-label="Navigasi" className="mb-4 mt-3 text-xs text-neutral-400">
        <Link to="/perpustakaan" className="hover:text-white">Perpustakaan</Link>
        <span className="mx-1.5" aria-hidden="true">/</span>
        <Link to="/perpustakaan/dongengid" className="hover:text-white">Dongeng Indonesia</Link>
      </nav>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="relative aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-black/40 sm:w-44">
          <StoryCover scene={story.scene} hue={story.hue} label={`Sampul ${story.title}`} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="min-w-0">
          <span className="inline-block rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200">
            {story.category}
          </span>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-neutral-50 sm:text-4xl">{story.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {story.origin}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readMinutes(story)} menit baca</span>
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-300">{story.summary}</p>
        </div>
      </header>

      {/* Alat baca */}
      <div className="sticky top-1 z-10 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#121118]/90 p-2 backdrop-blur">
        {speech.supported && (
          <>
            {speech.state === 'playing' ? (
              <button onClick={speech.pause} className={`${btn} border-violet-400/50 bg-violet-500/20 text-violet-100`}>
                <Pause className="h-3.5 w-3.5" /> Jeda
              </button>
            ) : (
              <button onClick={speech.play} className={`${btn} border-violet-400/50 bg-violet-500/20 text-violet-100`}>
                {speech.state === 'paused' ? <Play className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                {speech.state === 'paused' ? 'Lanjutkan' : 'Dengarkan'}
              </button>
            )}
            {speech.state !== 'idle' && (
              <button onClick={speech.stop} className={btn} aria-label="Berhenti">
                <Square className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.04]">
          <button onClick={() => libraryStore.setFontSize(fontSize - 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Perkecil huruf">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-xs tabular-nums text-neutral-300" aria-live="polite">{fontSize}</span>
          <button onClick={() => libraryStore.setFontSize(fontSize + 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Perbesar huruf">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button onClick={() => libraryStore.toggleFavDongeng(story.slug)} className={btn} aria-pressed={isFav}>
          <Bookmark className={`h-3.5 w-3.5 ${isFav ? 'fill-violet-400 text-violet-400' : ''}`} />
          {isFav ? 'Tersimpan' : 'Simpan'}
        </button>
        <button onClick={share} className={btn}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? 'Tautan disalin' : 'Bagikan'}
        </button>
      </div>

      {/* Isi cerita */}
      <div className="mx-auto mt-8 max-w-2xl" style={{ fontSize }}>
        {story.paragraphs.map((p, i) => (
          <p
            key={i}
            ref={(el) => {
              paraRefs.current[i] = el;
            }}
            className={`mb-5 rounded-lg px-2 py-1 leading-[1.85] text-neutral-200 transition-colors duration-300 ${
              speech.index === i ? 'bg-violet-500/15 text-white' : ''
            }`}
          >
            {p}
          </p>
        ))}

        <aside className="mt-8 rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-300">Pesan moral</h2>
          <p className="mt-2 text-[0.95em] leading-relaxed text-neutral-100">{story.moral}</p>
        </aside>

        <div className="mt-6 flex flex-wrap gap-2" style={{ fontSize: 14 }}>
          <button
            onClick={() =>
              onAskLuna(
                `Saya baru membaca dongeng "${story.title}" dari ${story.origin}. Tolong jelaskan pesan moralnya dengan bahasa yang mudah dipahami anak-anak, lalu berikan tiga pertanyaan diskusi untuk dibicarakan bersama orang tua.`
              )
            }
            className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" /> Tanya Luna tentang cerita ini
          </button>
        </div>
      </div>

      {/* Sebelum / sesudah */}
      <nav aria-label="Cerita lainnya" className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3">
        {prev ? (
          <Link to={`/perpustakaan/dongengid/${prev.slug}`} className="rounded-2xl border border-white/10 bg-[#16151d] p-4 transition-colors hover:bg-[#1c1b25]">
            <span className="flex items-center gap-1 text-[11px] text-neutral-400"><ArrowLeft className="h-3 w-3" /> Sebelumnya</span>
            <span className="mt-1 block line-clamp-2 text-sm font-semibold text-neutral-100">{prev.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/perpustakaan/dongengid/${next.slug}`} className="rounded-2xl border border-white/10 bg-[#16151d] p-4 text-right transition-colors hover:bg-[#1c1b25]">
            <span className="flex items-center justify-end gap-1 text-[11px] text-neutral-400">Berikutnya <ArrowRight className="h-3 w-3" /></span>
            <span className="mt-1 block line-clamp-2 text-sm font-semibold text-neutral-100">{next.title}</span>
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
};
