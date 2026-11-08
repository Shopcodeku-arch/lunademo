import React, { useEffect, useState } from 'react';
import { X, Trash2, Download, Check, Save, Cpu, Database } from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onClearHistory: () => void;
  totalChats: number;
}

const DEFAULT_PROMPT =
  'Anda adalah Luna, asisten AI cerdas yang dibuat oleh Gimoy Studio. Selalu jawab dengan ramah, terstruktur, dan informatif.';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onClearHistory,
  totalChats,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [systemPrompt, setSystemPrompt] = useState(currentUser.systemPrompt ?? DEFAULT_PROMPT);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Muat ulang form & cek server setiap kali dibuka
  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(currentUser.displayName);
    setSystemPrompt(currentUser.systemPrompt ?? DEFAULT_PROMPT);
    setConfirmClear(false);
    setServerOnline(null);
    let alive = true;
    StorageService.checkBackend().then((ok) => alive && setServerOnline(ok));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    try {
      const updated = await StorageService.updateProfile(currentUser.username, {
        displayName: displayName.trim(),
        systemPrompt,
      });
      onUpdateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const summaries = await StorageService.listChats(currentUser.username);
      const chats = (
        await Promise.all(summaries.map((c) => StorageService.getChat(c.id, currentUser.username)))
      ).filter(Boolean);
      const blob = new Blob(
        [JSON.stringify({ user: currentUser, chats, exportedAt: new Date().toISOString() }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_luna_${currentUser.username}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const field =
    'w-full rounded-xl bg-neutral-900 border border-neutral-700/80 px-3.5 py-2.5 text-base sm:text-sm text-white outline-none focus:border-violet-500/80';

  return (
    <div
      className="fade-in fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border border-neutral-800 bg-[#16151d] shadow-2xl text-neutral-100 max-h-[92dvh] flex flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800/80 px-5 sm:px-6 py-4">
          <h3 id="settings-title" className="text-base font-bold text-white">
            Pengaturan & akun
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Tutup pengaturan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 scrollbar-thin">
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-neutral-400">Profil & Akun</h4>
            <div>
              <span className="block text-xs font-medium text-neutral-400 mb-1">Email Google / Akun</span>
              <div className="text-xs font-mono text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 select-all">
                {currentUser.email || currentUser.username}
              </div>
            </div>
            <div>
              <label htmlFor="set-name" className="block text-xs font-medium text-neutral-300 mb-1">
                Nama tampilan
              </label>
              <input
                id="set-name"
                type="text"
                value={displayName}
                maxLength={60}
                onChange={(e) => setDisplayName(e.target.value)}
                className={field}
              />
            </div>
            {currentUser.photoURL ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800">
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="h-10 w-10 rounded-full object-cover shadow-md border border-violet-400/50"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-neutral-200">Foto Profil Google</span>
                  <span className="text-[11px] text-neutral-400">Sinkron otomatis dari akun Google yang sedang aktif</span>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-3 border-t border-neutral-800/80 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-neutral-400">Persona AI</h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-violet-400">
                <Cpu className="h-3 w-3" />
                Luna Engine v2 (Gimoy Studio)
              </span>
            </div>
            <div>
              <label htmlFor="set-prompt" className="block text-xs font-medium text-neutral-300 mb-1">
                Instruksi tambahan
              </label>
              <textarea
                id="set-prompt"
                value={systemPrompt}
                maxLength={2000}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className={`${field} text-sm sm:text-xs leading-relaxed resize-none`}
                placeholder="Atur gaya bicara dan sikap Luna..."
              />
              <p className="mt-1 text-[11px] text-neutral-400">Diterapkan pada setiap jawaban baru. Kosongkan untuk memakai bawaan Luna.</p>
            </div>
          </section>

          <section className="space-y-3 border-t border-neutral-800/80 pt-5">
            <h4 className="text-xs font-semibold text-neutral-400">Data & riwayat</h4>
            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Obrolan tersimpan</span>
                <span className="font-semibold text-white font-mono">{totalChats} sesi</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Server cadangan</span>
                <span
                  className={`flex items-center gap-1.5 font-medium ${
                    serverOnline === null ? 'text-neutral-400' : serverOnline ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <Database className="h-3 w-3" />
                  {serverOnline === null ? 'Memeriksa...' : serverOnline ? 'Tersambung' : 'Tidak tersambung (mode lokal)'}
                </span>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-violet-400" />
                  <span>Cadangkan (JSON)</span>
                </button>

                {confirmClear ? (
                  <div className="flex flex-1 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearHistory();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Ya, hapus semua</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="h-10 rounded-xl border border-neutral-700 bg-neutral-800 px-3 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    disabled={totalChats === 0}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-900/60 bg-rose-950/20 px-3 text-xs font-medium text-rose-400 hover:bg-rose-900/40 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Kosongkan riwayat</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-neutral-800/80 px-5 sm:px-6 py-3 bg-[#121118] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] text-neutral-400" role="status">
            {saved ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Tersimpan
              </span>
            ) : (
              '@' + currentUser.username
            )}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="h-10 rounded-xl px-4 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 px-5 text-xs font-bold text-white shadow hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
