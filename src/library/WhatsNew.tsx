import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, X } from 'lucide-react';
import { navigate } from '../utils/router';
import { FEATURED_SLUGS, getDongeng } from './dongengData';
import { StoryCover } from './StoryCover';
import { ComicArt } from './Library';
import { LunaOrb } from '../components/LunaOrb';

const STORAGE_KEY = 'luna:whatsnew:v1';

function hasSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // diabaikan
  }
}

const Covers: React.FC<{ slugs: string[]; tilt?: boolean }> = ({ slugs, tilt }) => (
  <div className="flex h-full items-center justify-center">
    {slugs.map((slug, i) => {
      const d = getDongeng(slug);
      if (!d) return null;
      return (
        <div
          key={slug}
          className="relative -ml-5 h-36 w-24 overflow-hidden rounded-xl border border-white/15 shadow-xl shadow-black/50 first:ml-0 sm:h-40 sm:w-28"
          style={tilt ? { transform: `rotate(${(i - (slugs.length - 1) / 2) * 8}deg) translateY(${Math.abs(i - 1) * 6}px)`, zIndex: i } : undefined}
        >
          <StoryCover scene={d.scene} hue={d.hue} className="absolute inset-0 h-full w-full" />
        </div>
      );
    })}
  </div>
);

interface Slide {
  key: string;
  badge: string;
  title: string;
  text: string;
  points?: string[];
  visual: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    key: 'perpustakaan',
    badge: 'Baru',
    title: 'Perpustakaan Luna kini hadir',
    text: 'Satu tempat untuk membaca komik dan dongeng Indonesia. Gratis dan tanpa perlu masuk akun.',
    visual: <Covers slugs={['si-kancil-dan-buaya', 'malin-kundang', 'sangkuriang']} tilt />,
  },
  {
    key: 'komik',
    badge: 'Komik',
    title: 'Komik dalam bahasa Indonesia',
    text: 'Jelajahi ribuan judul dengan tampilan baca yang nyaman di HP.',
    points: ['Cari judul atau lihat yang sedang populer', 'Lanjutkan dari bab terakhir yang kamu baca', 'Simpan komik favorit di perangkatmu'],
    visual: <ComicArt className="mx-auto h-full max-h-44 w-auto" />,
  },
  {
    key: 'dongeng',
    badge: 'Dongeng Indonesia',
    title: 'Dongeng dari seluruh Nusantara',
    text: 'Dari kecerdikan Si Kancil sampai legenda gunung dan danau.',
    points: ['12 cerita, lengkap dengan pesan moral', 'Mode dengarkan dan ukuran huruf yang bisa diatur', 'Tanya Luna untuk memahami isi ceritanya'],
    visual: <Covers slugs={['si-kancil-mencuri-timun', 'timun-mas', 'legenda-danau-toba', 'roro-jonggrang']} />,
  },
  {
    key: 'luna',
    badge: 'Luna',
    title: 'Luna kini lebih tahu',
    text: 'Pembaruan lain yang ikut hadir di versi ini.',
    points: ['Tahu waktu, berita, cuaca, dan kurs terbaru', 'Unduh video TikTok tanpa watermark', 'Gaya bahasa yang lebih profesional'],
    visual: (
      <div className="grid h-full place-items-center">
        <LunaOrb size={1.1} animated />
      </div>
    ),
  },
];

const FINAL_KEY = 'mulai';
const TOTAL = SLIDES.length + 1;

export const WhatsNew: React.FC<{ pathname: string }> = ({ pathname }) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // Muncul sekali untuk pengguna baru, hanya di beranda / perpustakaan
  useEffect(() => {
    if (hasSeen()) return;
    if (pathname !== '/' && pathname !== '/perpustakaan') return;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [pathname]);

  // Dibuka ulang dari tombol "Fitur terbaru"
  useEffect(() => {
    const show = () => {
      setIndex(0);
      setDir(1);
      setOpen(true);
    };
    window.addEventListener('luna:whatsnew', show);
    return () => window.removeEventListener('luna:whatsnew', show);
  }, []);

  const close = useCallback(() => {
    markSeen();
    setOpen(false);
  }, []);

  const go = useCallback((n: number) => {
    setIndex((cur) => {
      const next = Math.min(TOTAL - 1, Math.max(0, n));
      setDir(next >= cur ? 1 : -1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    primaryRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, go, close]);

  const startReading = (to = '/perpustakaan') => {
    close();
    navigate(to);
  };

  const isFinal = index === TOTAL - 1;
  const slide = !isFinal ? SLIDES[index] : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="whatsnew"
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsnew-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#121118] shadow-2xl shadow-black/60"
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Tutup"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-neutral-200 backdrop-blur hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(index + 1);
                else if (info.offset.x > 60) go(index - 1);
              }}
              className="touch-pan-y"
            >
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={isFinal ? FINAL_KEY : slide!.key}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -40 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="h-52 bg-gradient-to-b from-[#1b1736] to-[#121118] px-6 pb-2 pt-10 sm:h-56">
                    {isFinal ? (
                      <div className="grid h-full grid-cols-3 gap-2.5">
                        {FEATURED_SLUGS.map((slug) => {
                          const d = getDongeng(slug);
                          if (!d) return null;
                          return (
                            <button
                              key={slug}
                              onClick={() => startReading(`/perpustakaan/dongengid/${slug}`)}
                              aria-label={`Baca ${d.title}`}
                              className="group relative overflow-hidden rounded-xl border border-white/10 transition-transform hover:-translate-y-0.5 active:scale-95"
                            >
                              <StoryCover scene={d.scene} hue={d.hue} className="absolute inset-0 h-full w-full" />
                              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-5 text-left text-[10px] font-semibold leading-tight text-white">
                                {d.title.replace('Legenda ', '').replace('Si Kancil dan ', 'Kancil & ')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      slide!.visual
                    )}
                  </div>

                  <div className="px-6 pb-2 pt-4">
                    <span className="inline-block rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200">
                      {isFinal ? 'Siap membaca' : slide!.badge}
                    </span>
                    <h2 id="whatsnew-title" className="mt-2.5 text-2xl font-semibold leading-tight tracking-tight text-neutral-50">
                      {isFinal ? 'Mau mulai dari mana?' : slide!.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                      {isFinal ? 'Pilih salah satu cerita di atas, atau buka perpustakaan untuk melihat semuanya.' : slide!.text}
                    </p>
                    {!isFinal && slide!.points && (
                      <ul className="mt-3 space-y-1.5">
                        {slide!.points.map((p) => (
                          <li key={p} className="flex items-start gap-2 text-sm text-neutral-200">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-4">
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Halaman">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Halaman ${i + 1}`}
                    onClick={() => go(i)}
                    className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-violet-400' : 'w-1.5 bg-white/20 hover:bg-white/35'}`}
                  />
                ))}
              </div>
              {isFinal ? (
                <button
                  ref={primaryRef}
                  onClick={() => startReading()}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/50 transition-colors hover:bg-violet-400 active:scale-95"
                >
                  Ayo, Membaca <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={close} className="rounded-full px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white">
                    Lewati
                  </button>
                  <button
                    ref={primaryRef}
                    onClick={() => go(index + 1)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20 active:scale-95"
                  >
                    Lanjut <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
