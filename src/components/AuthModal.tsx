import React, { useEffect, useState } from 'react';
import { Loader2, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
import { LunaOrb } from './LunaOrb';
import { signInWithGoogle } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  currentUser?: UserProfile | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
  currentUser,
}) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Jika user sudah login (memiliki UID Firebase), otomatis tutup modal
  useEffect(() => {
    if (currentUser?.uid && isOpen && onClose) {
      onClose();
    }
  }, [currentUser, isOpen, onClose]);

  // Reset error ketika modal dibuka
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || currentUser?.uid) return null;

  // Firebase Google Login
  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setError(null);

    try {
      const userProfile = await signInWithGoogle();
      onLoginSuccess(userProfile);
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Jendela masuk Google ditutup sebelum proses selesai.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError('Permintaan login dibatalkan.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError(
          `Domain "${window.location.hostname}" belum diizinkan di Firebase. Buka Firebase Console → Authentication → Settings → Authorized domains, lalu tambahkan domain ini.`
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Popup login diblokir browser. Izinkan popup untuk situs ini lalu klik Coba Lagi.');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.');
      } else {
        setError(err?.message || 'Gagal masuk dengan Google. Silakan klik Coba Lagi.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="fade-in fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="my-auto w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#16151d] shadow-2xl text-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="relative border-b border-neutral-800/80 px-6 pt-6 pb-5 text-center">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
              aria-label="Tutup modal login"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="mx-auto flex h-14 w-14 items-center justify-center mb-3 select-none">
            <LunaOrb size={0.48} />
          </div>

          <h3 id="auth-title" className="text-xl font-bold text-white tracking-tight">
            Masuk ke Luna AI
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Gunakan akun Google Anda untuk mulai mengobrol & menyimpan riwayat obrolan
          </p>
        </div>

        {/* Body Modal: Google Auth Only */}
        <div className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-950/70 border border-rose-800/80 p-4 text-xs text-rose-200 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 text-base">⚠️</span>
                <div className="flex-1">
                  <div className="font-semibold text-rose-100">Login Google Gagal</div>
                  <div className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">{error}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white py-2.5 px-3 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex h-13 items-center justify-center gap-3.5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 px-5 text-sm font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 cursor-pointer border border-neutral-200"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-800" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google 'G' Logo */}
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Lanjutkan dengan Google</span>
                </>
              )}
            </button>

            <div className="rounded-xl bg-neutral-900/80 border border-neutral-800 p-3.5 text-xs text-neutral-400 space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-300 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Sinkronisasi Database Cloud</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-400 pl-6">
                Riwayat obrolan Anda akan tersimpan otomatis di database cloud dan foto profil Google Anda akan langsung digunakan sebagai identitas percakapan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
