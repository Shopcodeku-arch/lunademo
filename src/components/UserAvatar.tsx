import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface UserAvatarProps {
  user: Pick<UserProfile, 'photoURL' | 'displayName' | 'avatarColor'>;
  /** Kelas ukuran, mis. "h-8 w-8". */
  className?: string;
  ringClassName?: string;
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
      style={{ backgroundColor: user.avatarColor || '#6366f1' }}
    >
      {(user.displayName || '?').charAt(0).toUpperCase()}
    </div>
  );
};
