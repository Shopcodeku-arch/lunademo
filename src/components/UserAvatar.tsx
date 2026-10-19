import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface UserAvatarProps {
  user: Pick<UserProfile, 'photoURL' | 'displayName' | 'avatarColor'>;
  /** Kelas ukuran, mis. "h-8 w-8". */
  className?: string;
  ringClassName?: string;
}

/** Warna avatar lama yang kuning/oranye diganti ungu (data lama di Firestore tidak diubah). */
function safeAvatarColor(color?: string): string {
  const fallback = '#6366f1';
  if (!color) return fallback;
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (!m) return color;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return color;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const s = max === 0 ? 0 : d / max;
  return s > 0.25 && h >= 20 && h <= 75 ? '#8b5cf6' : color;
}

/**
 * Foto profil Google dengan cadangan huruf awal.
 * Foto Google kadang gagal dimuat (diblokir / kedaluwarsa); tanpa cadangan ini
 * yang tampil hanyalah ikon gambar rusak.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  className = 'h-8 w-8',
  ringClassName = 'ring-1 ring-white/15',
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [user.photoURL]);

  if (user.photoURL && !failed) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        className={`${className} ${ringClassName} shrink-0 rounded-full object-cover select-none`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      aria-label={user.displayName}
      className={`${className} ${ringClassName} flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white select-none`}
      style={{ backgroundColor: safeAvatarColor(user.avatarColor) }}
    >
      {(user.displayName || '?').charAt(0).toUpperCase()}
    </div>
  );
};
