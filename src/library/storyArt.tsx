import React from 'react';

/**
 * Ilustrasi tokoh untuk sampul dongeng (SVG datar, viewBox 300x400).
 * Setiap cerita punya komposisi sendiri (ART[slug]) yang digambar di atas latar pemandangan.
 * Warna sengaja menghindari kuning/oranye.
 */

export interface Palette {
  hue: number;
  light: string;
  far: string;
  mid: string;
  near: string;
  water: string;
  water2: string;
}

interface G {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
}

const T: React.FC<G & { children: React.ReactNode }> = ({ x, y, s = 1, flip, rot = 0, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`}>{children}</g>
);

const INK = '#241c2c';
const CREAM = '#efe9f5';

/* ------------------------------ Hewan ------------------------------ */

export const Kancil: React.FC<G> = (p) => (
  <T {...p}>
    <g stroke="#6b4a48" strokeWidth="3.2" strokeLinecap="round" fill="none">
      <path d="M-17 -27 L-24 -13 L-19 0" />
      <path d="M-9 -26 L-11 -12 L-7 0" />
      <path d="M13 -26 L16 -12 L14 0" />
      <path d="M21 -28 L28 -16 L33 -9" />
    </g>
    <ellipse cx="0" cy="-34" rx="27" ry="14" fill="#8a6764" />
    <ellipse cx="3" cy="-27" rx="19" ry="6.5" fill={CREAM} />
    <path d="M17 -41 Q26 -58 34 -62 L40 -56 Q30 -50 26 -34Z" fill="#8a6764" />
    <ellipse cx="38" cy="-61" rx="10.5" ry="6.5" transform="rotate(-18 38 -61)" fill="#8a6764" />
    <path d="M44 -64 L56 -58 Q56 -54 49 -55 L44 -56Z" fill="#8a6764" />
    <circle cx="55.5" cy="-58" r="1.7" fill={INK} />
    <path d="M33 -65 Q25 -80 36 -83 Q39 -72 37 -65Z" fill="#8a6764" />
    <path d="M34 -67 Q30 -77 36 -79 Q37 -72 36 -67Z" fill="#d7a5b8" />
    <circle cx="41" cy="-63" r="2.7" fill="#fff" />
    <circle cx="41.8" cy="-63" r="1.5" fill={INK} />
    <ellipse cx="-27" cy="-40" rx="3.2" ry="2.4" fill={CREAM} />
    {[[-14, -41], [-4, -44], [6, -43], [-9, -36], [10, -38]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="1.5" fill={CREAM} opacity="0.85" />
    ))}
  </T>
);

export const Buaya: React.FC<G> = (p) => (
  <T {...p}>
    <path d="M-92 7 C-70 -2 -50 -12 -20 -13 C0 -14 25 -12 50 -9 L88 -6 L98 -2 L98 3 L88 6 L50 7 C25 10 0 12 -20 11 C-50 10 -70 8 -92 7Z" fill="#35684f" />
    <path d="M-62 6 C-30 10 20 9 88 3 L88 6 L50 7 C0 12 -50 10 -62 6Z" fill="#8fc3a4" />
    {Array.from({ length: 10 }, (_, i) => (
      <path key={i} d={`M${-70 + i * 12} ${-9 - (i % 2)} q4 -9 8 0Z`} fill="#1f4636" />
    ))}
    <path d="M-30 9 l-7 9 l9 0Z M30 7 l-3 11 l10 0Z" fill="#2b5641" />
    <circle cx="60" cy="-11" r="4.4" fill="#35684f" />
    <circle cx="60.5" cy="-11.5" r="2.5" fill="#fff" />
    <circle cx="61.2" cy="-11.5" r="1.3" fill={INK} />
    <circle cx="94" cy="-3" r="1.3" fill={INK} />
    {Array.from({ length: 6 }, (_, i) => (
      <path key={i} d={`M${62 + i * 5.5} 3 l2.4 -4.6 l2.4 4.6Z`} fill="#fff" />
    ))}
  </T>
);

export const Harimau: React.FC<G> = (p) => (
  <T {...p}>
    <path d="M40 -42 Q72 -48 64 -82" stroke="#b5503f" strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M62 -62 l6 -2 M64 -72 l7 -2" stroke={INK} strokeWidth="3" />
    <g fill="#9b4235">
      <rect x="-34" y="-32" width="9" height="32" rx="4" />
      <rect x="-20" y="-30" width="9" height="30" rx="4" />
      <rect x="16" y="-30" width="9" height="30" rx="4" />
      <rect x="30" y="-32" width="9" height="32" rx="4" />
    </g>
    <ellipse cx="0" cy="-40" rx="42" ry="20" fill="#b5503f" />
    <ellipse cx="-2" cy="-32" rx="30" ry="8" fill="#ecd3cf" />
    <g stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none">
      <path d="M-24 -58 q4 12 0 24" />
      <path d="M-8 -60 q5 13 0 26" />
      <path d="M8 -60 q5 13 0 26" />
      <path d="M24 -56 q4 12 0 22" />
    </g>
    <circle cx="-48" cy="-58" r="17" fill="#b5503f" />
    <circle cx="-58" cy="-74" r="5.5" fill="#b5503f" />
    <circle cx="-38" cy="-75" r="5.5" fill="#b5503f" />
    <circle cx="-58" cy="-74" r="2.6" fill="#ecd3cf" />
    <circle cx="-38" cy="-75" r="2.6" fill="#ecd3cf" />
    <ellipse cx="-58" cy="-52" rx="10" ry="8" fill="#ecd3cf" />
    <path d="M-66 -52 q8 12 16 0 l-2 8 q-6 5 -12 0Z" fill="#5a1d20" />
    <path d="M-63 -52 l2 4 l2 -4 M-55 -52 l2 4 l2 -4" stroke="#fff" strokeWidth="1.6" fill="#fff" />
    <path d="M-64 -57 l4 2 l-4 1Z" fill={INK} />
    <path d="M-54 -66 l8 3 M-46 -69 l8 -2" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    <circle cx="-46" cy="-62" r="2.2" fill="#fff" />
    <circle cx="-46.4" cy="-62" r="1.2" fill={INK} />
  </T>
);

export const Siput: React.FC<G & { shell?: string }> = ({ shell = '#c7b7f6', ...p }) => (
  <T {...p}>
    <path d="M-34 0 C-34 -9 -14 -11 6 -9 C20 -8 26 -14 26 -26" stroke="#8d86a8" strokeWidth="11" strokeLinecap="round" fill="none" />
    <path d="M26 -26 l-4 -12 M26 -26 l7 -11" stroke="#8d86a8" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="22" cy="-39" r="3" fill="#fff" />
    <circle cx="33" cy="-38" r="3" fill="#fff" />
    <circle cx="22.6" cy="-39" r="1.4" fill={INK} />
    <circle cx="33.6" cy="-38" r="1.4" fill={INK} />
    <circle cx="-8" cy="-23" r="21" fill={shell} />
    <path d="M-8 -23 m-3 0 a3 3 0 1 1 6 0 a8 8 0 1 1 -16 0 a13 13 0 1 1 26 0 a18 18 0 1 1 -32 6" stroke="#6b5aa8" strokeWidth="2.6" fill="none" strokeLinecap="round" />
  </T>
);

export const Kura: React.FC<G> = (p) => (
  <T {...p}>
    <ellipse cx="-20" cy="1" rx="9" ry="5" fill="#5f8f6a" />
    <ellipse cx="18" cy="1" rx="9" ry="5" fill="#5f8f6a" />
    <path d="M36 -2 C42 -2 46 -8 44 -15 C42 -20 34 -20 30 -14Z" fill="#6fa27a" />
    <circle cx="40" cy="-12" r="2.2" fill="#fff" />
    <circle cx="40.6" cy="-12" r="1.1" fill={INK} />
    <path d="M-34 0 C-34 -34 34 -34 34 0Z" fill="#3f6e57" />
    <path d="M-34 0 C-34 -34 34 -34 34 0" stroke="#27483a" strokeWidth="2.4" fill="none" />
    <g stroke="#7fb08a" strokeWidth="2.2" fill="none" strokeLinejoin="round">
      <path d="M-12 -24 l12 -4 l12 4 l-4 12 h-16Z" />
      <path d="M-22 -10 l10 -2 M22 -10 l-10 -2 M0 -28 v-4" />
    </g>
  </T>
);

export const Monyet: React.FC<G & { fur?: string }> = ({ fur = '#55425f', ...p }) => (
  <T {...p}>
    <path d="M-14 -8 C-44 -6 -48 -52 -28 -60" stroke={fur} strokeWidth="6" strokeLinecap="round" fill="none" />
    <ellipse cx="0" cy="-24" rx="16" ry="21" fill={fur} />
    <ellipse cx="3" cy="-20" rx="9" ry="13" fill="#7d6786" opacity="0.7" />
    <path d="M10 -34 C22 -30 24 -18 20 -8" stroke={fur} strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M-8 -6 L-12 2 M8 -6 L14 2" stroke={fur} strokeWidth="6" strokeLinecap="round" />
    <circle cx="5" cy="-52" r="13.5" fill={fur} />
    <circle cx="-8" cy="-54" r="4.6" fill={fur} />
    <circle cx="18" cy="-54" r="4.6" fill={fur} />
    <ellipse cx="8" cy="-49" rx="9" ry="8" fill="#e0c3c8" />
    <circle cx="5" cy="-52" r="2" fill="#fff" />
    <circle cx="12.4" cy="-52" r="2" fill="#fff" />
    <circle cx="5.4" cy="-52" r="1.1" fill={INK} />
    <circle cx="12.8" cy="-52" r="1.1" fill={INK} />
    <path d="M5 -45 q4 3 8 0" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </T>
);

export const Ikan: React.FC<G> = (p) => (
  <T {...p}>
    <path d="M-22 0 L-44 -16 Q-38 0 -44 16Z" fill="#e0558a" />
    <path d="M-8 -10 Q0 -26 14 -12Z" fill="#e0558a" />
    <ellipse cx="0" cy="0" rx="26" ry="13" fill="#f283ae" />
    <g stroke="#d1457b" strokeWidth="1.8" fill="none">
      <path d="M-6 -8 q6 8 0 16 M4 -9 q6 9 0 18 M14 -8 q5 8 0 16" />
    </g>
    <path d="M-4 8 Q4 18 16 10Z" fill="#e0558a" />
    <circle cx="17" cy="-3" r="3.2" fill="#fff" />
    <circle cx="17.8" cy="-3" r="1.7" fill={INK} />
  </T>
);

export const Hiu: React.FC<G> = (p) => (
  <T {...p}>
    <path d="M-52 0 L-74 -20 L-66 0 L-74 18Z" fill="#5a6f93" />
    <path d="M-52 0 C-30 -19 20 -22 56 -3 C22 11 -30 13 -52 0Z" fill="#6f85aa" />
    <path d="M-40 4 C-10 12 30 10 56 -3 C24 12 -26 14 -40 4Z" fill="#dfe6f3" />
    <path d="M-6 -15 L8 -42 L18 -12Z" fill="#5a6f93" />
    <path d="M10 6 L-4 24 L22 8Z" fill="#5a6f93" />
    <g stroke="#4c5f82" strokeWidth="1.8" strokeLinecap="round"><path d="M22 -8 l-2 10 M28 -7 l-2 10 M34 -6 l-2 9" /></g>
    <circle cx="44" cy="-6" r="2.8" fill="#fff" />
    <circle cx="44.6" cy="-6" r="1.5" fill={INK} />
    <path d="M42 2 l3 -5 l3 5 l3 -5 l3 5" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" />
  </T>
);

export const Ayam: React.FC<G> = (p) => (
  <T {...p}>
    <g fill="none" strokeLinecap="round">
      <path d="M-14 -28 C-44 -34 -46 -66 -30 -80" stroke="#4a8f9e" strokeWidth="6" />
      <path d="M-14 -26 C-48 -24 -54 -50 -46 -66" stroke="#9c6fe0" strokeWidth="6" />
      <path d="M-12 -30 C-34 -44 -30 -72 -12 -84" stroke="#e0558a" strokeWidth="5" />
    </g>
    <g stroke="#8d86a8" strokeWidth="3" strokeLinecap="round">
      <path d="M-4 -14 V0 M6 -14 V0" />
      <path d="M-10 0 h12 M0 0 h12" />
    </g>
    <ellipse cx="0" cy="-27" rx="19" ry="14" fill="#7a5cc8" />
    <path d="M-10 -28 Q4 -40 16 -26 Q4 -14 -10 -28Z" fill="#5b43a8" />
    <path d="M10 -34 C16 -44 18 -52 16 -56 L26 -56 C26 -46 24 -38 18 -30Z" fill="#b79cf0" />
    <circle cx="22" cy="-58" r="8.5" fill="#b79cf0" />
    <path d="M16 -66 q2 -8 5 -3 q2 -8 5 -2 q3 -6 4 2 q-4 4 -14 3Z" fill="#d7405b" />
    <path d="M28 -58 l9 3 l-9 3Z" fill="#efbfd0" />
    <path d="M26 -52 q3 7 0 8" stroke="#d7405b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    <circle cx="23" cy="-60" r="2.3" fill="#fff" />
    <circle cx="23.6" cy="-60" r="1.2" fill={INK} />
  </T>
);

export const Kepiting: React.FC<G> = (p) => (
  <T {...p}>
    <g stroke="#a83a4c" strokeWidth="3.2" strokeLinecap="round" fill="none">
      <path d="M-24 -4 l-14 6 M-20 4 l-14 10 M24 -4 l14 6 M20 4 l14 10" />
      <path d="M-26 -18 l-16 -12 M26 -18 l16 -12" />
    </g>
    <path d="M-52 -42 q-10 -8 -2 -16 q10 4 12 16Z" fill="#c8485a" />
    <path d="M52 -42 q10 -8 2 -16 q-10 4 -12 16Z" fill="#c8485a" />
    <path d="M-42 -30 L-30 -20 M42 -30 L30 -20" stroke="#c8485a" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="0" cy="-10" rx="30" ry="16" fill="#c8485a" />
    <ellipse cx="0" cy="-8" rx="22" ry="9" fill="#d8707e" />
    <path d="M-8 -22 l-2 -9 M8 -22 l2 -9" stroke="#c8485a" strokeWidth="3" strokeLinecap="round" />
    <circle cx="-10" cy="-33" r="3.2" fill="#fff" />
    <circle cx="10" cy="-33" r="3.2" fill="#fff" />
    <circle cx="-10" cy="-33" r="1.5" fill={INK} />
    <circle cx="10" cy="-33" r="1.5" fill={INK} />
  </T>
);

export const Naga: React.FC<{ color?: string; belly?: string; flip?: boolean; x?: number; y?: number; s?: number }> = ({
  color = '#3f8f86',
  belly = '#a9dcd2',
  flip,
  x = 0,
  y = 0,
  s = 1,
}) => (
  <T x={x} y={y} s={s} flip={flip}>
    <path d="M-100 24 C-84 -34 -50 -40 -28 -2 S26 40 52 -8 S88 -44 104 -22" stroke={color} strokeWidth="16" strokeLinecap="round" fill="none" />
    <path d="M-100 24 C-84 -34 -50 -40 -28 -2 S26 40 52 -8 S88 -44 104 -22" stroke={belly} strokeWidth="4.5" strokeLinecap="round" fill="none" strokeDasharray="2 7" />
    <g fill={color}>
      <path d="M-84 -14 l-4 -12 l9 6Z M-58 -26 l0 -13 l9 8Z M-26 -8 l-3 -12 l10 5Z M24 8 l2 -12 l8 7Z M60 -18 l1 -13 l9 7Z" />
    </g>
    <path d="M100 -22 C112 -34 128 -30 132 -22 C128 -12 112 -10 100 -14Z" fill={color} />
    <path d="M108 -32 l-4 -14 M118 -32 l1 -14" stroke={belly} strokeWidth="3" strokeLinecap="round" />
    <circle cx="118" cy="-23" r="3.4" fill="#fff" />
    <circle cx="119" cy="-23" r="1.8" fill={INK} />
    <path d="M130 -20 q8 0 12 4 M130 -17 q8 3 10 8" stroke="#d7405b" strokeWidth="2" fill="none" strokeLinecap="round" />
  </T>
);

/* ------------------------------ Manusia & benda ------------------------------ */

interface PersonProps extends G {
  dress?: string;
  hair?: string;
  skin?: string;
  long?: boolean;
  arms?: 'down' | 'up' | 'out';
  scarf?: string;
}
export const Orang: React.FC<PersonProps> = ({ dress = '#7a5cc8', hair = '#241c2c', skin = '#e2b49f', long = true, arms = 'down', scarf, ...p }) => (
  <T {...p}>
    {long && <path d="M-8 -54 C-14 -40 -12 -26 -8 -20 L8 -20 C12 -26 14 -40 8 -54Z" fill={hair} />}
    <g stroke={skin} strokeWidth="4.2" strokeLinecap="round">
      <path d="M-4 -14 V0 M4 -14 V0" />
    </g>
    <path d="M-10 -42 L10 -42 L15 -12 L-15 -12Z" fill={dress} />
    <path d="M-10 -42 L10 -42 L8 -36 L-8 -36Z" fill="#ffffff" opacity="0.18" />
    <g stroke={skin} strokeWidth="4" strokeLinecap="round" fill="none">
      {arms === 'down' && <path d="M-10 -40 L-14 -24 M10 -40 L14 -24" />}
      {arms === 'up' && <path d="M-10 -40 L-20 -56 M10 -40 L20 -56" />}
      {arms === 'out' && <path d="M-10 -40 L-24 -36 M10 -40 L24 -44" />}
    </g>
    <circle cx="0" cy="-50" r="8" fill={skin} />
    <path d="M-9 -50 C-9 -62 9 -62 9 -50 C5 -56 -5 -56 -9 -50Z" fill={hair} />
    <circle cx="-2.8" cy="-50" r="1" fill={INK} />
    <circle cx="2.8" cy="-50" r="1" fill={INK} />
    {scarf && <path d="M-8 -42 C-40 -50 -30 -80 -64 -70 M8 -42 C40 -34 52 -66 82 -52" stroke={scarf} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />}
  </T>
);

export const Raksasa: React.FC<G> = (p) => (
  <T {...p}>
    <path d="M-34 0 L-24 -60 L24 -60 L34 0Z" fill="#3e7c57" />
    <rect x="-52" y="-72" width="22" height="50" rx="11" fill="#3e7c57" transform="rotate(14 -41 -47)" />
    <rect x="30" y="-72" width="22" height="50" rx="11" fill="#3e7c57" transform="rotate(-14 41 -47)" />
    <rect x="46" y="-96" width="9" height="60" rx="4" fill="#6b4a48" transform="rotate(12 50 -66)" />
    <circle cx="52" cy="-100" r="11" fill="#55383c" />
    <circle cx="0" cy="-84" r="26" fill="#4f9a6a" />
    <path d="M-26 -92 l-7 -14 l12 5 l4 -14 l9 10 l8 -14 l7 13 l11 -9 l3 14 l12 -3 l-9 14Z" fill={INK} />
    <circle cx="-9" cy="-86" r="5.4" fill="#fff" />
    <circle cx="10" cy="-86" r="5.4" fill="#fff" />
    <circle cx="-9" cy="-86" r="3" fill="#d7405b" />
    <circle cx="10" cy="-86" r="3" fill="#d7405b" />
    <path d="M-16 -98 l12 5 M17 -98 l-12 5" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M-14 -72 q14 9 28 0 l-3 8 q-11 6 -22 0Z" fill="#521c22" />
    <path d="M-11 -72 l3 -10 l4 10Z M7 -72 l4 -10 l3 10Z" fill="#fff" />
  </T>
);

export const Labu: React.FC<G> = (p) => (
  <T {...p}>
    <path d="M0 -62 q-3 -12 6 -16" stroke="#3f8f60" strokeWidth="5" strokeLinecap="round" fill="none" />
    <ellipse cx="-24" cy="-26" rx="22" ry="26" fill="#a43b86" />
    <ellipse cx="24" cy="-26" rx="22" ry="26" fill="#a43b86" />
    <ellipse cx="0" cy="-27" rx="22" ry="28" fill="#c25aa3" />
    <path d="M0 -55 q-9 27 0 54 M-13 -52 q-14 26 -3 50 M13 -52 q14 26 3 50" stroke="#8b2f72" strokeWidth="2.4" fill="none" />
    <path d="M-30 -58 q-14 -6 -12 -16 q12 -2 18 8Z" fill="#46a06d" />
  </T>
);

export const Gem: React.FC<{ x: number; y: number; c: string; s?: number }> = ({ x, y, c, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -8 L7 -2 L0 8 L-7 -2Z" fill={c} />
    <path d="M0 -8 L2 -2 L0 8 L-3 -2Z" fill="#fff" opacity="0.35" />
  </g>
);

export const Timun: React.FC<G> = (p) => (
  <T {...p}>
    <ellipse cx="0" cy="0" rx="17" ry="8" fill="#4d9a64" />
    <path d="M-10 -5 L-6 5 M-2 -7 L2 7 M6 -5 L10 5" stroke="#2f7347" strokeWidth="2" strokeLinecap="round" />
  </T>
);

export const Perahu: React.FC<G & { sail?: string }> = ({ sail = '#dfe6f3', ...p }) => (
  <T {...p}>
    <path d="M-50 0 L50 0 L38 20 L-38 20Z" fill={INK} />
    <rect x="-1.5" y="-56" width="3.5" height="56" fill={INK} />
    <path d="M5 -54 L5 -6 L46 -6Z" fill={sail} fillOpacity="0.88" />
    <path d="M-5 -42 L-5 -6 L-38 -6Z" fill={sail} fillOpacity="0.6" />
  </T>
);

const Awan: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = '#1b2542' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={c} opacity="0.92">
    <ellipse cx="0" cy="0" rx="40" ry="14" />
    <ellipse cx="-20" cy="-8" rx="22" ry="14" />
    <ellipse cx="14" cy="-12" rx="26" ry="16" />
  </g>
);

const Cipratan: React.FC<{ x: number; y: number; n?: number; c?: string }> = ({ x, y, n = 5, c = '#fff' }) => (
  <g fill={c} opacity="0.85">
    {Array.from({ length: n }, (_, i) => (
      <circle key={i} cx={x + (i - n / 2) * 7} cy={y - ((i * 5) % 14) - 4} r={2 + (i % 3) * 0.7} />
    ))}
  </g>
);

/* ------------------------------ Komposisi per cerita ------------------------------ */

type Draw = (p: Palette) => React.ReactNode;

export const ART: Record<string, Draw> = {
  'si-kancil-dan-buaya': () => (
    <>
      <path d="M0 296 q30 -8 60 0 t60 0 t60 0 t60 0 t60 0" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" fill="none" />
      <Buaya x={46} y={336} s={0.78} />
      <Buaya x={152} y={352} s={0.95} />
      <Buaya x={262} y={338} s={0.78} flip />
      <Kancil x={150} y={338} s={1.1} rot={-6} />
      <Cipratan x={92} y={336} n={4} />
      <Cipratan x={218} y={334} n={4} />
    </>
  ),
  'si-kancil-mencuri-timun': () => (
    <>
      <g>
        <rect x="205" y="262" width="4" height="86" fill="#4a3a44" />
        <rect x="178" y="286" width="58" height="4" rx="2" fill="#4a3a44" />
        <circle cx="207" cy="258" r="11" fill="#c9bfd6" />
        <path d="M188 254 L207 228 L226 254Z" fill="#2a2234" />
        <path d="M182 256 h50" stroke="#2a2234" strokeWidth="4" strokeLinecap="round" />
        <path d="M184 290 l-8 18 M232 290 l8 18" stroke="#c9bfd6" strokeWidth="3" strokeLinecap="round" />
      </g>
      <Timun x={150} y={372} s={1.1} rot={-8} />
      <Timun x={125} y={384} s={0.9} rot={10} />
      <Timun x={250} y={380} s={1} />
      <Kancil x={78} y={372} s={1.25} />
    </>
  ),
  'si-kancil-dan-harimau': () => (
    <>
      <path d="M300 128 C260 130 232 138 200 160" stroke="#2c1f2a" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M214 156 V176" stroke="#2c1f2a" strokeWidth="2" />
      <ellipse cx="214" cy="198" rx="17" ry="24" fill="#c8bde6" />
      <g fill="#7b6aa8"><circle cx="208" cy="192" r="2.6" /><circle cx="220" cy="200" r="2.6" /><circle cx="210" cy="208" r="2.6" /></g>
      <g fill="#8b7cff">{[[190, 190], [236, 184], [196, 224], [238, 214]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" />)}</g>
      <Harimau x={92} y={382} s={1.1} flip />
      <Kancil x={236} y={384} s={1} />
    </>
  ),
  'malin-kundang': () => (
    <>
      <Awan x={70} y={64} s={1.3} />
      <Awan x={178} y={46} s={1.5} />
      <Awan x={262} y={92} s={1.1} />
      <path d="M214 70 L196 128 L212 124 L190 190" stroke="#e9e3ff" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <Perahu x={214} y={252} s={0.82} flip />
      <path d="M0 400 L0 330 C20 318 70 318 118 340 L150 400Z" fill="#3b3f58" />
      <path d="M24 396 C20 354 32 326 52 316 C68 310 82 318 80 334 C78 348 70 352 74 396Z" fill="#79809b" />
      <circle cx="60" cy="304" r="12" fill="#79809b" />
      <path d="M72 336 L96 314 M70 346 L98 330" stroke="#79809b" strokeWidth="7" strokeLinecap="round" />
      <g fill="#8fb4e8"><path d="M52 312 q-3 8 0 12 q3 -4 0 -12Z" /><path d="M68 316 q-3 8 0 12 q3 -4 0 -12Z" /></g>
    </>
  ),
  'bawang-merah-bawang-putih': () => (
    <>
      <Labu x={142} y={382} s={1.45} />
      {[['#6be0d0', 118, 372], ['#ff7ab8', 150, 388], ['#9d8bff', 182, 374], ['#6be0d0', 168, 394], ['#ff7ab8', 102, 392]].map(([c, x, y], i) => (
        <Gem key={i} x={x as number} y={y as number} c={c as string} s={1.3} />
      ))}
      <Orang x={248} y={390} s={1.25} dress="#f4f0ff" hair="#241c2c" arms="up" />
      <Orang x={44} y={390} s={1.05} dress="#d7405b" hair="#241c2c" arms="out" />
    </>
  ),
  'timun-mas': () => (
    <>
      <Raksasa x={70} y={346} s={1.65} />
      <Timun x={140} y={380} s={1.1} rot={6} />
      <Timun x={170} y={390} s={0.9} rot={-12} />
      <Orang x={232} y={388} s={1.3} dress="#e0558a" hair="#241c2c" arms="out" />
      <path d="M216 360 q-16 4 -26 14" stroke="#241c2c" strokeWidth="4" strokeLinecap="round" fill="none" />
    </>
  ),
  sangkuriang: () => (
    <>
      <path d="M0 318 Q150 250 300 318" fill="none" stroke="#ff5b78" strokeOpacity="0.55" strokeWidth="26" />
      <path d="M8 332 C40 270 90 214 150 196 C210 214 262 270 292 332 C230 308 70 308 8 332Z" fill="#1d1530" opacity="0.62" />
      <path d="M8 332 C40 270 90 214 150 196 C210 214 262 270 292 332" fill="none" stroke="#1d1530" strokeWidth="6" strokeLinecap="round" />
      <path d="M8 332 q-10 -16 -2 -36 M292 332 q10 -16 2 -36" stroke="#1d1530" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M150 198 V300" stroke="#8b7cff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      <Orang x={62} y={388} s={1.2} dress="#7a5cc8" hair="#241c2c" arms="up" />
      <path d="M70 376 l22 -14" stroke="#e2b49f" strokeWidth="5" strokeLinecap="round" />
      <g fill="#241c2c"><ellipse cx="248" cy="384" rx="14" ry="7" /><circle cx="262" cy="378" r="6" /><path d="M262 372 l3 -7 l3 7Z" /></g>
    </>
  ),
  'legenda-danau-toba': () => (
    <>
      <Ikan x={150} y={248} s={1.9} rot={-32} />
      <path d="M96 296 q54 18 108 0" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" fill="none" />
      <Cipratan x={128} y={300} n={7} />
      <Cipratan x={178} y={298} n={5} />
      <Perahu x={52} y={346} s={0.55} sail="#c7b7f6" />
      <Orang x={64} y={344} s={0.5} dress="#7a5cc8" long={false} />
    </>
  ),
  'roro-jonggrang': () => (
    <>
      <ellipse cx="150" cy="330" rx="170" ry="70" fill="#ff4d79" opacity="0.18" />
      <g transform="translate(52 384)">
        <rect x="-26" y="-14" width="52" height="14" fill="#9a93b3" />
        <rect x="-20" y="-24" width="40" height="10" fill="#aaa3c2" />
        <path d="M-13 -24 L-9 -72 L9 -72 L13 -24Z" fill="#b9b2d0" />
        <circle cx="0" cy="-82" r="10" fill="#c7c0dc" />
        <path d="M-12 -88 L0 -122 L12 -88Z" fill="#b9b2d0" />
        <path d="M-9 -66 L-26 -50 M9 -66 L26 -50" stroke="#b9b2d0" strokeWidth="6" strokeLinecap="round" />
        <circle cx="-3" cy="-82" r="1.3" fill="#6f6890" /><circle cx="3" cy="-82" r="1.3" fill="#6f6890" />
      </g>
      <Ayam x={250} y={346} s={0.7} />
    </>
  ),
  'keong-mas': () => (
    <>
      <circle cx="150" cy="316" r="64" fill="#c7b7f6" opacity="0.2" />
      <circle cx="150" cy="316" r="38" fill="#c7b7f6" opacity="0.2" />
      <Siput x={152} y={338} s={2.1} shell="#d3c7fb" />
      {[[48, 330], [252, 316], [90, 376]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M-16 0 Q-12 -22 0 -26 Q12 -22 16 0Z" fill="#f08cc0" />
          <path d="M-26 0 Q-24 -16 -10 -18 Q-12 -6 -6 0Z M26 0 Q24 -16 10 -18 Q12 -6 6 0Z" fill="#d86aa8" />
        </g>
      ))}
    </>
  ),
  'asal-usul-rawa-pening': () => (
    <>
      <Naga x={140} y={334} s={1.05} color="#3f8f6a" belly="#b7e6cc" />
      <path d="M262 340 V250" stroke="#4a3a44" strokeWidth="3" />
      <path d="M262 262 q-14 -6 -18 -18 M262 270 q16 -4 20 -16 M262 254 q-6 -12 2 -20" stroke="#46a06d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g transform="translate(60 366)">
        <path d="M-34 0 H34 L26 12 H-26Z" fill="#5a4042" />
        <ellipse cx="0" cy="-2" rx="30" ry="5" fill="#745a5c" />
      </g>
      <Orang x={60} y={366} s={0.75} dress="#c7b7f6" hair="#d9d2e8" long={false} />
    </>
  ),
  'lutung-kasarung': () => (
    <>
      <path d="M300 238 C250 244 214 258 176 290" stroke="#2b1f33" strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M262 244 q16 -22 40 -26 M234 254 q-6 -22 -26 -30" stroke="#2b1f33" strokeWidth="6" strokeLinecap="round" fill="none" />
      <Monyet x={196} y={290} s={1.7} fur="#42334d" />
      <circle cx="208" cy="204" r="3" fill="#8bf0e0" opacity="0.95" />
      <circle cx="226" cy="204" r="3" fill="#8bf0e0" opacity="0.95" />
      <Orang x={62} y={392} s={1.3} dress="#e0558a" hair="#241c2c" arms="up" />
    </>
  ),
  'si-kancil-dan-siput': () => (
    <>
      <path d="M244 372 V296" stroke="#4a3a44" strokeWidth="3.4" />
      <path d="M244 298 L276 308 L244 320Z" fill="#8b7cff" />
      <path d="M200 378 h90" stroke="#fff" strokeWidth="3" strokeDasharray="6 5" opacity="0.8" />
      <Kancil x={88} y={380} s={1.5} rot={-4} />
      <g fill="#8fb4e8" opacity="0.9"><path d="M122 312 q-3 7 0 10 q3 -3 0 -10Z" /><path d="M132 322 q-3 7 0 10 q3 -3 0 -10Z" /></g>
      <Siput x={218} y={390} s={1.25} shell="#c7b7f6" />
    </>
  ),
  'kura-kura-dan-monyet': () => (
    <>
      <path d="M150 400 C146 340 154 290 150 236" stroke="#6b4a48" strokeWidth="13" strokeLinecap="round" fill="none" />
      <g fill="#3f9a63">
        <path d="M150 238 C110 214 86 224 66 250 C100 240 126 242 150 238Z" />
        <path d="M150 238 C190 214 214 224 234 250 C200 240 174 242 150 238Z" />
        <path d="M150 238 C134 196 112 186 92 190 C114 204 130 216 150 238Z" />
        <path d="M150 238 C166 196 188 186 208 190 C186 204 170 216 150 238Z" />
      </g>
      <g fill="#9fd6a8">
        {[[160, 262], [170, 272], [160, 282], [172, 292]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q16 -4 22 8 q-14 6 -22 -8Z`} />
        ))}
      </g>
      <Monyet x={128} y={300} s={1.05} fur="#55425f" />
      <Kura x={236} y={388} s={1.35} />
    </>
  ),
  'sura-dan-baya': () => (
    <>
      <Hiu x={92} y={322} s={1.45} />
      <Buaya x={222} y={350} s={1.0} flip />
      <path d="M120 306 q34 -30 70 0" stroke="#fff" strokeWidth="3.5" strokeOpacity="0.85" fill="none" />
      <Cipratan x={152} y={296} n={10} />
      <Cipratan x={190} y={304} n={6} />
    </>
  ),
  cindelaras: () => (
    <>
      <ellipse cx="150" cy="320" rx="180" ry="80" fill="#ff5b9a" opacity="0.18" />
      <Ayam x={162} y={372} s={2.1} />
      <Orang x={52} y={384} s={1.2} dress="#4a8f9e" hair="#241c2c" long={false} arms="out" />
    </>
  ),
  'jaka-tarub': () => (
    <>
      <Orang x={74} y={176} s={0.95} dress="#f0a0d0" hair="#241c2c" arms="up" scarf="#ff8cc0" />
      <Orang x={156} y={118} s={0.95} dress="#b79cf0" hair="#241c2c" arms="up" scarf="#9c8bff" />
      <Orang x={226} y={184} s={0.95} dress="#8be0d0" hair="#241c2c" arms="up" scarf="#7be0d0" />
      <path d="M0 300 q80 -16 150 0 t150 0" stroke="#fff" strokeOpacity="0.16" strokeWidth="2" fill="none" />
      <Orang x={40} y={392} s={1.1} dress="#3b3550" hair="#241c2c" long={false} />
    </>
  ),
  'gunung-bromo': () => (
    <>
      <circle cx="205" cy="104" r="8" fill="#ff5b78" opacity="0.85" />
      {[[214, 84, 12], [226, 62, 16], [244, 46, 20], [270, 38, 18]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#d9d2e8" opacity={0.34 - i * 0.04} />
      ))}
      <Orang x={236} y={392} s={0.95} dress="#d7405b" hair="#241c2c" arms="up" />
      <Orang x={272} y={394} s={0.85} dress="#6f4fd0" hair="#241c2c" long={false} arms="up" />
      <g fill="#8bf0e0"><circle cx="236" cy="334" r="4" /><circle cx="272" cy="344" r="3.4" /></g>
    </>
  ),
  'telaga-warna': (p) => (
    <>
      {[[320, 150, 44], [280, 124, 36], [230, 98, 28], [190, 72, 20], [160, 46, 12]].map(([h, rx, ry], i) => (
        <ellipse key={i} cx="150" cy="326" rx={rx as number} ry={ry as number} fill={`hsl(${h} 70% ${44 + i * 3}%)`} opacity="0.85" />
      ))}
      {[[60, 290, '#ff7ab8'], [250, 296, '#6be0d0'], [96, 346, '#9d8bff'], [208, 352, '#ff7ab8'], [150, 372, '#6be0d0'], [272, 340, '#9d8bff']].map(([x, y, c], i) => (
        <Gem key={i} x={x as number} y={y as number} c={c as string} s={1.1} />
      ))}
      <Orang x={42} y={384} s={1.25} dress="#e0558a" hair="#241c2c" arms="out" />
      <path d="M30 332 l5 -9 l5 6 l5 -8 l5 9Z" fill={p.light} />
    </>
  ),
  'batu-menangis': () => (
    <>
      <path d="M60 400 C52 340 72 292 120 276 C156 262 198 276 216 304 C238 336 246 372 244 400Z" fill="#6f7790" />
      <path d="M120 276 C112 250 128 228 154 226 C184 224 204 246 196 274Z" fill="#7b83a0" />
      <path d="M90 340 C120 352 180 352 214 336" stroke="#565e78" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M142 252 q6 4 12 0 M168 250 q6 4 12 0" stroke="#4a5169" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g fill="#8fb4e8">
        <path d="M148 258 q-5 14 0 24 q5 -10 0 -24Z" /><path d="M176 256 q-5 14 0 24 q5 -10 0 -24Z" />
        <path d="M148 286 q-3 10 0 16 q3 -6 0 -16Z" /><path d="M176 284 q-3 10 0 16 q3 -6 0 -16Z" />
      </g>
      <path d="M150 300 q-4 40 -8 90 M178 298 q4 40 8 92" stroke="#8fb4e8" strokeWidth="3" strokeOpacity="0.55" fill="none" strokeLinecap="round" />
    </>
  ),
  'putri-mandalika': () => (
    <>
      <path d="M0 400 L0 296 C30 288 80 292 118 330 L130 400Z" fill="#2c2748" />
      <Orang x={58} y={296} s={1.5} dress="#8b5cf6" hair="#241c2c" arms="out" scarf="#c7b7f6" />
      {[[168, 316, '#ff7ab8'], [214, 336, '#6be0d0'], [252, 322, '#9d8bff'], [190, 364, '#6be0d0'], [240, 372, '#ff7ab8'], [150, 342, '#9d8bff']].map(([x, y, c], i) => (
        <path key={i} d={`M${(x as number) - 10} ${y} q5 -9 10 0 t10 0`} stroke={c as string} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      ))}
    </>
  ),
  'ande-ande-lumut': () => (
    <>
      <g transform="translate(246 262)">
        <rect x="-16" y="-14" width="32" height="26" fill="#2a2338" />
        <path d="M-22 -14 L0 -34 L22 -14Z" fill="#3a3050" />
        <rect x="-4" y="-2" width="8" height="14" fill="#8b7cff" opacity="0.7" />
      </g>
      <Kepiting x={150} y={352} s={1.55} />
      <Orang x={150} y={324} s={0.95} dress="#e0558a" hair="#241c2c" arms="out" />
    </>
  ),
  'manik-angkeran': () => (
    <>
      <Naga x={96} y={300} s={0.9} color="#6f4fd0" belly="#c7b7f6" />
      {[['#6be0d0', 190, 394], ['#ff7ab8', 212, 384], ['#9d8bff', 232, 396], ['#6be0d0', 252, 388], ['#ff7ab8', 270, 398]].map(([c, x, y], i) => (
        <Gem key={i} x={x as number} y={y as number} c={c as string} s={1.5} />
      ))}
      <Orang x={156} y={396} s={1.15} dress="#4a8f9e" hair="#241c2c" long={false} arms="up" />
    </>
  ),
};

/** Latar tertentu menggambar hiasan sendiri (perahu, buaya, siput); dimatikan bila tokoh sudah digambar. */
export const hasArt = (slug?: string): boolean => Boolean(slug && ART[slug]);
