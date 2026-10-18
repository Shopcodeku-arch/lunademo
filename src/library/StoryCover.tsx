import React, { useId } from 'react';
import type { SceneKey } from './dongengData';

const hsl = (h: number, s: number, l: number, a = 1) => `hsl(${h} ${s}% ${l}% / ${a})`;

const STARS: Array<[number, number, number]> = [
  [30, 40, 1.4], [70, 90, 1], [112, 50, 1.6], [150, 24, 1], [190, 70, 1.3], [250, 38, 1.5],
  [275, 96, 1], [48, 140, 1.1], [126, 120, 1], [204, 150, 1.2], [262, 150, 1], [92, 20, 1],
];

/** Deretan pohon segitiga bersusun; posisi dibuat deterministik agar tidak berubah antar render. */
function Trees({ y, count, size, color, seed }: { y: number; count: number; size: number; color: string; seed: number }) {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i * 300) / (count - 1 || 1) + (((seed * 31 + i * 47) % 19) - 9);
    const h = size * (0.8 + (((seed + i * 7) % 5) / 10));
    const w = h * 0.36;
    items.push(
      <g key={i} fill={color}>
        <polygon points={`${x},${y - h} ${x - w},${y - h * 0.38} ${x + w},${y - h * 0.38}`} />
        <polygon points={`${x},${y - h * 0.7} ${x - w * 1.25},${y} ${x + w * 1.25},${y}`} />
      </g>
    );
  }
  return <>{items}</>;
}

interface StoryCoverProps {
  scene: SceneKey;
  hue: number;
  className?: string;
  label?: string;
}

export const StoryCover: React.FC<StoryCoverProps> = ({ scene, hue, className = '', label }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const sky0 = hsl(hue, 58, 15);
  const sky1 = hsl(hue, 52, 36);
  const far = hsl(hue, 42, 24);
  const mid = hsl(hue, 44, 18);
  const near = hsl(hue, 48, 11);
  const water = hsl(hue, 55, 28);
  const water2 = hsl(hue, 60, 38);
  const light = hsl(hue, 85, 88);
  const glow = hsl(hue, 90, 70, 0.28);

  const showStars = scene === 'night' || scene === 'mountain' || scene === 'temple' || scene === 'sea';

  let body: React.ReactNode = null;

  switch (scene) {
    case 'river':
      body = (
        <>
          <path d="M0 250 C60 210 110 240 170 215 C230 190 270 230 300 215 L300 400 L0 400Z" fill={far} />
          <path d="M0 285 C70 255 140 290 210 262 C250 248 280 262 300 258 L300 400 L0 400Z" fill={water} />
          <path d="M0 320 C50 308 90 330 150 316 C210 302 250 326 300 312 L300 400 L0 400Z" fill={water2} opacity="0.55" />
          <path d="M20 350 q18 -9 36 0 t36 0 t36 0" stroke={light} strokeOpacity="0.4" strokeWidth="2" fill="none" />
          <path d="M150 372 q18 -9 36 0 t36 0 t36 0" stroke={light} strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <g fill={near}>
            <rect x="22" y="312" width="4" height="88" rx="2" />
            <rect x="34" y="326" width="3.5" height="74" rx="2" />
            <ellipse cx="24" cy="308" rx="5" ry="14" />
            <ellipse cx="36" cy="322" rx="4.5" ry="12" />
          </g>
          <g fill={near}>
            <ellipse cx="190" cy="318" rx="34" ry="8" />
            <path d="M156 318 q8 -14 22 -8 t24 -6 t20 14z" />
            <circle cx="214" cy="306" r="3" fill={light} />
          </g>
        </>
      );
      break;

    case 'field':
      body = (
        <>
          <path d="M0 230 C70 200 130 225 200 205 C250 190 280 210 300 200 L300 400 L0 400Z" fill={far} />
          <polygon points="0,400 300,400 300,260 0,260" fill={mid} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${150 + (i - 2.5) * 6} 262 L${(i - 2.5) * 70 + 150} 400`}
              stroke={hsl(hue, 50, 30)}
              strokeWidth="3"
              fill="none"
            />
          ))}
          <path d="M0 300 Q150 285 300 300" stroke={hsl(hue, 50, 30)} strokeWidth="2" fill="none" />
          <path d="M0 340 Q150 322 300 340" stroke={hsl(hue, 50, 30)} strokeWidth="2.5" fill="none" />
          <g fill={near}>
            <rect x="214" y="224" width="46" height="34" />
            <polygon points="208,226 237,198 266,226" />
            <rect x="231" y="238" width="12" height="20" fill={mid} />
          </g>
        </>
      );
      break;

    case 'forest':
      body = (
        <>
          <Trees y={262} count={9} size={120} color={far} seed={1} />
          <Trees y={310} count={7} size={150} color={mid} seed={2} />
          <rect x="0" y="300" width="300" height="100" fill={mid} />
          <Trees y={380} count={5} size={190} color={near} seed={3} />
          <rect x="0" y="372" width="300" height="28" fill={near} />
        </>
      );
      break;

    case 'sea':
      body = (
        <>
          <rect x="0" y="236" width="300" height="164" fill={water} />
          <path d="M0 260 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke={light} strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <path d="M0 292 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke={light} strokeOpacity="0.3" strokeWidth="2" fill="none" />
          <path d="M0 330 q25 -12 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke={light} strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
          <g transform="translate(90 214)">
            <path d="M0 40 L100 40 L84 62 L16 62Z" fill={near} />
            <rect x="48" y="-20" width="3.5" height="60" fill={near} />
            <polygon points="54,-18 54,34 96,34" fill={light} fillOpacity="0.85" />
            <polygon points="45,-6 45,34 8,34" fill={light} fillOpacity="0.6" />
          </g>
          <rect x="0" y="372" width="300" height="28" fill={near} opacity="0.6" />
        </>
      );
      break;

    case 'mountain':
      body = (
        <>
          <polygon points="-20,320 90,150 200,320" fill={far} />
          <polygon points="80,330 205,110 330,330" fill={mid} />
          <polygon points="205,110 228,150 214,146 205,160 196,146 183,150" fill={light} fillOpacity="0.9" />
          <circle cx="205" cy="92" r="9" fill={light} fillOpacity="0.35" />
          <circle cx="216" cy="74" r="12" fill={light} fillOpacity="0.22" />
          <rect x="0" y="318" width="300" height="82" fill={near} />
          <Trees y={332} count={10} size={44} color={near} seed={4} />
        </>
      );
      break;

    case 'lake':
      body = (
        <>
          <polygon points="-30,260 70,140 170,260" fill={far} />
          <polygon points="110,262 220,150 330,262" fill={mid} />
          <rect x="0" y="258" width="300" height="142" fill={water} />
          <path d="M0 290 q30 -8 60 0 t60 0 t60 0 t60 0 t60 0" stroke={light} strokeOpacity="0.32" strokeWidth="2" fill="none" />
          <path d="M0 330 q30 -9 60 0 t60 0 t60 0 t60 0 t60 0" stroke={light} strokeOpacity="0.26" strokeWidth="2.5" fill="none" />
          <ellipse cx="170" cy="300" rx="64" ry="14" fill={near} />
          <polygon points="118,300 170,262 222,300" fill={near} />
          <rect x="0" y="376" width="300" height="24" fill={near} opacity="0.6" />
        </>
      );
      break;

    case 'temple': {
      const tower = (x: number, w: number, h: number, key: string) => (
        <g key={key} fill={near}>
          <rect x={x - w / 2} y={330 - h * 0.22} width={w} height={h * 0.22} />
          <rect x={x - w * 0.42} y={330 - h * 0.45} width={w * 0.84} height={h * 0.23} />
          <rect x={x - w * 0.3} y={330 - h * 0.7} width={w * 0.6} height={h * 0.25} />
          <polygon points={`${x - w * 0.22},${330 - h * 0.7} ${x},${330 - h} ${x + w * 0.22},${330 - h * 0.7}`} />
        </g>
      );
      body = (
        <>
          <path d="M0 300 C80 280 160 300 300 282 L300 400 L0 400Z" fill={far} />
          {tower(150, 86, 190, 'a')}
          {tower(70, 54, 120, 'b')}
          {tower(230, 54, 120, 'c')}
          <rect x="0" y="328" width="300" height="72" fill={near} />
          <rect x="116" y="318" width="68" height="12" fill={near} />
        </>
      );
      break;
    }

    case 'village':
      body = (
        <>
          <path d="M0 250 C70 228 140 248 210 232 C250 224 280 236 300 230 L300 400 L0 400Z" fill={far} />
          <rect x="0" y="300" width="300" height="100" fill={mid} />
          {[[38, 300, 56], [128, 292, 64], [220, 302, 54]].map(([x, y, w], i) => (
            <g key={i} fill={near}>
              <rect x={x} y={y} width={w} height={44} />
              <polygon points={`${x - 8},${y + 2} ${x + w / 2},${y - 28} ${x + w + 8},${y + 2}`} />
              <rect x={x + w / 2 - 6} y={y + 22} width={12} height={22} fill={mid} />
            </g>
          ))}
          <g fill={near}>
            <rect x="268" y="236" width="4" height="70" rx="2" />
            <path d="M270 238 q-24 -4 -34 14 M270 238 q24 -4 34 14 M270 238 q-12 -22 -26 -18 M270 238 q12 -22 26 -18" stroke={near} strokeWidth="5" fill="none" strokeLinecap="round" />
          </g>
          <rect x="0" y="360" width="300" height="40" fill={near} />
        </>
      );
      break;

    case 'pond':
      body = (
        <>
          <path d="M0 230 C60 210 120 232 190 216 C240 205 280 222 300 214 L300 400 L0 400Z" fill={far} />
          <rect x="0" y="262" width="300" height="138" fill={water} />
          {[[70, 316, 40], [170, 342, 54], [236, 300, 36], [112, 372, 34]].map(([x, y, r], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.28} fill={hsl(hue, 55, 34)} />
              <ellipse cx={x} cy={y - 2} rx={r * 0.9} ry={r * 0.22} fill={hsl(hue, 55, 42)} />
            </g>
          ))}
          <g transform="translate(140 270)">
            <circle cx="0" cy="0" r="22" fill={light} fillOpacity="0.92" />
            <path d="M0 0 m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8 a4.5 4.5 0 1 1 4.5 4.5" stroke={hsl(hue, 60, 30)} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M-20 14 q-14 -2 -22 6" stroke={light} strokeOpacity="0.8" strokeWidth="5" fill="none" strokeLinecap="round" />
          </g>
          <g fill={near}>
            <rect x="262" y="250" width="4" height="150" />
            <ellipse cx="264" cy="246" rx="6" ry="16" />
          </g>
        </>
      );
      break;

    case 'night':
    default:
      body = (
        <>
          <path d="M0 292 C60 262 120 290 190 266 C240 250 280 270 300 262 L300 400 L0 400Z" fill={far} />
          <path d="M0 336 C70 310 130 340 210 318 C250 308 280 322 300 316 L300 400 L0 400Z" fill={near} />
          <Trees y={340} count={8} size={72} color={near} seed={5} />
        </>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky0} />
          <stop offset="1" stopColor={sky1} />
        </linearGradient>
        <radialGradient id={`glow${uid}`} cx="0.72" cy="0.28" r="0.5">
          <stop offset="0" stopColor={glow} />
          <stop offset="1" stopColor={hsl(hue, 90, 70, 0)} />
        </radialGradient>
        <mask id={`moon${uid}`}>
          <rect width="300" height="400" fill="#fff" />
          <circle cx="228" cy="98" r="34" fill="#000" />
        </mask>
        <linearGradient id={`shade${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#sky${uid})`} />
      <rect width="300" height="400" fill={`url(#glow${uid})`} />
      {showStars &&
        STARS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={light} opacity="0.75" />)}
      {scene === 'night' ? (
        <circle cx="212" cy="108" r="38" fill={light} mask={`url(#moon${uid})`} />
      ) : (
        <circle cx="218" cy="112" r="30" fill={light} opacity="0.92" />
      )}
      {body}
      <rect width="300" height="400" fill={`url(#shade${uid})`} />
    </svg>
  );
};
