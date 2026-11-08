import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, Link2, Loader2, RefreshCw, Share2, X } from 'lucide-react';
import { ChatSession, UserProfile } from '../types';
import {
  SharedChat,
  ShareError,
  createOrUpdateShare,
  findShare,
  shareUrl,
  stopShare,
} from '../services/shareChat';
import { copyText } from '../utils/clipboard';

interface ShareModalProps {
  /** id obrolan yang akan dibagikan; null = tertutup. */
  chatId: string | null;
  chatTitle?: string;
  user: UserProfile;
  /** Mengambil isi lengkap obrolan (pesan terbaru) saat tautan dibuat/diperbarui. */
  loadChat: (id: string) => Promise<ChatSession | null>;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ chatId, chatTitle, user, loadChat, onClose }) => {
  const [share, setShare] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<'create' | 'update' | 'stop' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const uid = user.uid;
  const ownerName = user.displayName || user.username || 'Pengguna';

  // Cek apakah obrolan ini sudah punya tautan
  useEffect(() => {
    if (!chatId || !uid) return;
    let cancelled = false;
    setShare(null);
    setError(null);
    setConfirmStop(false);
    setCopied(false);
    setLoading(true);
    findShare(uid, chatId)
      .then((s) => !cancelled && setShare(s))
      .catch((e: ShareError) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [chatId, uid]);

  useEffect(() => {
    if (!chatId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatId, onClose]);

  const publish = useCallback(
    async (mode: 'create' | 'update') => {
      if (!chatId || !uid) return;
      setBusy(mode);
      setError(null);
      try {
        const chat = await loadChat(chatId);
        if (!chat) throw new ShareError('missing', 'Obrolan tidak ditemukan.');
        const result = await createOrUpdateShare({ uid, ownerName, chat, existingId: share?.id });
        setShare(result);
      } catch (e: any) {
        setError(e?.message || 'Gagal membuat tautan.');
      } finally {
        setBusy(null);
      }
    },
    [chatId, uid, ownerName, loadChat, share?.id]
  );

  const remove = async () => {
    if (!share) return;
    setBusy('stop');
    setError(null);
    try {
      await stopShare(share.id);
      setShare(null);
      setConfirmStop(false);
    } catch (e: any) {
      setError(e?.message || 'Gagal menghentikan berbagi.');
    } finally {
      setBusy(null);
    }
  };

  const url = share ? shareUrl(share.id) : '';

  const copy = async () => {
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: share?.title || 'Percakapan Luna AI', text: 'Lihat percakapan ini di Luna AI', url });
    } catch {
      // dibatalkan pengguna
    }
  };

  const primary =
    'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 active:scale-95 disabled:opacity-60';
  const secondary =
    'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-xs font-medium text-neutral-100 transition-colors hover:bg-white/10 active:scale-95 disabled:opacity-60';

  return (
    <AnimatePresence>
      {chatId && (
        <motion.div
          key="share"
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#121118] p-6 shadow-2xl shadow-black/60"
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-neutral-300 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>

            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 text-violet-300">
              <Share2 className="h-5 w-5" />
            </div>
            <h2 id="share-title" className="mt-4 text-xl font-semibold tracking-tight text-neutral-50">Bagikan obrolan</h2>
            <p className="mt-1 break-words text-sm text-neutral-400">{chatTitle || share?.title || 'Percakapan'}</p>

            {loading ? (
              <div className="grid h-28 place-items-center text-neutral-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !share ? (
              <>
                <p className="mt-4 text-sm leading-relaxed text-neutral-300">
                  Buat tautan publik agar orang lain dapat membaca percakapan ini hanya dengan membuka tautannya, tanpa perlu masuk akun.
                </p>
                <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-neutral-400">
                  <li>Yang dibagikan adalah salinan teks percakapan pada saat ini. Gambar dan berkas lampiran tidak ikut.</li>
                  <li>Siapa pun yang memiliki tautan dapat membacanya. Jangan bagikan bila ada data pribadi.</li>
                  <li>Kamu bisa memperbarui isinya atau menghentikan berbagi kapan saja.</li>
                </ul>
                <button onClick={() => publish('create')} disabled={busy !== null} className={`${primary} mt-5 w-full`}>
                  {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Buat tautan publik
                </button>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-neutral-300">Tautan publik aktif. Siapa pun yang membukanya dapat membaca percakapan ini.</p>
                <div className="mt-3 flex items-stretch gap-2">
                  <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label="Tautan publik"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-800 bg-[#0d0c12] px-3 text-base text-neutral-200 outline-none focus:border-violet-500/70 sm:text-xs"
                  />
                  <button onClick={copy} className={`${secondary} !h-11 shrink-0`} aria-label="Salin tautan">
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">
                  {share.messages.length} pesan · diperbarui{' '}
                  {new Date(share.updatedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button onClick={nativeShare} className={primary}>
                      <Share2 className="h-4 w-4" /> Bagikan
                    </button>
                  )}
                  <button onClick={() => publish('update')} disabled={busy !== null} className={secondary}>
                    {busy === 'update' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Perbarui isi
                  </button>
                </div>

                <div className="mt-5 border-t border-white/5 pt-4">
                  {confirmStop ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-neutral-300">Tautan akan berhenti berfungsi.</span>
                      <button onClick={remove} disabled={busy !== null} className="h-9 rounded-full bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60">
                        {busy === 'stop' ? 'Menghentikan...' : 'Ya, hentikan'}
                      </button>
                      <button onClick={() => setConfirmStop(false)} className="h-9 rounded-full px-3 text-xs text-neutral-400 hover:text-white">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmStop(true)} className="text-xs font-medium text-rose-400 hover:text-rose-300">
                      Hentikan berbagi
                    </button>
                  )}
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="mt-4 break-words rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-xs leading-relaxed text-rose-100">
                {error}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
