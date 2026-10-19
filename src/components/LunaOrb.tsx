import React from 'react';

interface LunaOrbProps {
  /** Faktor skala dari 100px. 0.32 = 32px. */
  size?: number;
  className?: string;
  /** true = gelombang suara bergerak (Luna sedang merespons). false = diam. */
  animated?: boolean;
}

const BAR_COUNT = 7;

/**
 * Avatar Luna: diagram gelombang suara.
 * Bergerak selagi Luna merespons, berhenti (membentuk pola diam) saat selesai.
 * Semua batang berada di dalam kotak 1em x 1em sehingga tidak bisa terpotong.
 * Gaya ada di src/index.css (kelas .lw-*).
 */
export const LunaOrb: React.FC<LunaOrbProps> = ({ size = 0.32, className = '', animated = false }) => {
  const dim = Math.max(12, Math.round(100 * size));

  return (
    <span
      aria-hidden="true"
      className={`lw ${animated ? 'lw-animated' : ''} ${className}`}
      style={{ fontSize: dim, width: '1em', height: '1em' }}
    >
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span key={i} className="lw-bar" />
      ))}
    </span>
  );
};
