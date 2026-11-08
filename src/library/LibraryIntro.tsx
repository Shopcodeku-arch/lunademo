import React, { useEffect, useMemo, useState } from 'react';
import { Book, BookMarked, BookOpen } from 'lucide-react';

const ICONS = [BookOpen, Book, BookMarked];
const SEEN_KEY = 'luna:libintro:at';

/** Sapaan hanya dimunculkan bila belum tampil dalam 90 detik terakhir (agar tidak mengganggu saat bolak-balik). */
export function shouldShowLibraryIntro(): boolean {
  try {
    const last = Number(sessionStorage.getItem(SEEN_KEY) || 0);
    return Date.now() - last > 90_000;
  } catch {
    return true;
  }
}

interface Props {
  /** Nama depan pengguna (bila sudah masuk). */
  name?: string;
  onDone: () => void;
}

interface Piece {
  Icon: (typeof ICONS)[number];
  tx: number;
  ty: number;
  rot: number;
  delay: number;
  size: number;
}

/** Posisi ikon buku: tiga lingkaran konsentris yang menutupi seluruh layar, dengan sedikit variasi acak yang tetap. */
function buildPieces(): Piece[] {
  const rings: Array<[number, number]> = [
    [9, 24],
    [14, 42],
    [20, 62],
  ];
  const out: Piece[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  rings.forEach(([count, radius], ri) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ri * 0.35 + (rnd() - 0.5) * 0.3;
      const r = radius * (0.9 + rnd() * 0.25);
      out.push({
        Icon: ICONS[(i + ri) % ICONS.length],
        tx: Math.cos(a) * r * 1.05,
        ty: Math.sin(a) * r * 1.0,
        rot: Math.round((rnd() - 0.5) * 70),
        delay: Math.round(ri * 140 + rnd() * 380),
        size: Math.round(24 + rnd() * 30 + ri * 6),
      });
    }
  });
  return out;
}

export const LibraryIntro: React.FC<Props> = ({ name, onDone }) => {
  const [leaving, setLeaving] = useState(false);
  const pieces = useMemo(buildPieces, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      // diabaikan
    }
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t1 = setTimeout(() => setLeaving(true), reduce ? 1100 : 2700);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, 520);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && setLeaving(true);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setLeaving(true)}
      className={`lib-intro fixed inset-0 z-[90] cursor-pointer overflow-hidden bg-[#0d0c12] transition-opacity duration-500 ease-out ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Cahaya & gelombang yang membesar dari tengah */}
      <div className="lib-intro-glow" aria-hidden="true" />
      <div className="lib-intro-ring" style={{ animationDelay: '0ms' }} aria-hidden="true" />
      <div className="lib-intro-ring" style={{ animationDelay: '420ms' }} aria-hidden="true" />

      {/* Ikon buku menyebar ke seluruh layar */}
      <div className="lib-intro-icons" aria-hidden="true">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="lib-intro-icon"
            style={
              {
                '--tx': `${p.tx.toFixed(1)}vw`,
                '--ty': `${p.ty.toFixed(1)}vh`,
                '--rot': `${p.rot}deg`,
                '--d': `${p.delay}ms`,
                width: p.size,
                height: p.size,
              } as React.CSSProperties
            }
          >
            <p.Icon className="h-full w-full" strokeWidth={1.6} />
          </span>
        ))}
      </div>

      {/* Sapaan */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="lib-intro-badge">
          <BookOpen className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h1 className="lib-intro-title mt-6 max-w-md break-words text-[30px] font-semibold leading-[1.15] tracking-tight text-neutral-50 sm:text-5xl">
          Ingin membaca apa{name ? ',' : ' hari ini?'}
          {name && (
            <>
              <br />
              <span className="text-violet-300">{name}?</span>
            </>
          )}
        </h1>
        <p className="lib-intro-sub mt-4 text-sm text-neutral-400">Menyiapkan perpustakaan untukmu...</p>
        <div className="lib-intro-bar mt-6" aria-hidden="true">
          <span />
        </div>
        <p className="lib-intro-skip mt-8 text-[11px] text-neutral-600">Ketuk untuk melewati</p>
      </div>
    </div>
  );
};
