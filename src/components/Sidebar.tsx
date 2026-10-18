import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Download,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  Check,
  X,
  MoreVertical,
  BookOpen,
} from 'lucide-react';
import { ChatSummary, UserProfile } from '../types';
import { LunaOrb } from './LunaOrb';
import { UserAvatar } from './UserAvatar';
import { Link } from '../utils/router';
import { StorageService } from '../services/storage';
import { getModelLabel } from '../utils/modelLabel';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string, currentPin: boolean) => void;
  currentUser: UserProfile;
  onOpenSettings: () => void;
  onLogout: () => void;
  onOpenAuth?: () => void;
  /** Dipanggil setelah berpindah ke Perpustakaan (mis. menutup bilah sisi di HP). */
  onOpenLibrary?: () => void;
  isLibraryActive?: boolean;
}

const rowAction =
  'flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors';

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onTogglePin,
  currentUser,
  onOpenSettings,
  onLogout,
  onOpenAuth,
  onOpenLibrary,
  isLibraryActive = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Escape menutup panel (mobile) / menu aksi
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuId || editingId) {
        setMenuId(null);
        setEditingId(null);
        setConfirmDeleteId(null);
      } else if (window.matchMedia('(max-width: 767px)').matches) {
        onToggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, menuId, editingId, onToggle]);

  const query = searchQuery.trim().toLowerCase();
  const filtered = chats.filter((c) => c.title.toLowerCase().includes(query));

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);
  const today = rest.filter((c) => now - c.updatedAt < day);
  const yesterday = rest.filter((c) => now - c.updatedAt >= day && now - c.updatedAt < 2 * day);
  const week = rest.filter((c) => now - c.updatedAt >= 2 * day && now - c.updatedAt < 7 * day);
  const older = rest.filter((c) => now - c.updatedAt >= 7 * day);

  const closeMenu = () => {
    setMenuId(null);
    setConfirmDeleteId(null);
  };

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    closeMenu();
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) onRenameChat(id, editTitle.trim());
    setEditingId(null);
  };

  const exportChatAsMarkdown = async (chat: ChatSummary) => {
    try {
      const full = await StorageService.getChat(chat.id, currentUser.username);
      if (!full) return;
      let md = `# ${full.title}\n\n*Waktu: ${new Date(full.createdAt).toLocaleString('id-ID')}*\n\n---\n\n`;
      for (const m of full.messages) {
        const who = m.role === 'user' ? `Pengguna (${currentUser.displayName})` : getModelLabel(m.model);
        md += `### ${who}\n\n${m.content}\n\n---\n\n`;
      }
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${full.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'percakapan'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      closeMenu();
    }
  };

  const renderGroup = (title: string, list: ChatSummary[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-4" key={title}>
        <div className="px-3 py-1 text-[11px] font-semibold tracking-wide text-neutral-400">{title}</div>
        <div className="mt-1 space-y-0.5">
          {list.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isEditing = chat.id === editingId;
            const isMenu = chat.id === menuId;

            return (
              <div key={chat.id}>
                <div
                  className={`group flex items-center rounded-full text-sm transition-colors ${
                    isActive ? 'bg-[#221f2d] text-white' : 'text-neutral-300 hover:bg-[#1a1922] hover:text-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-1 px-2 py-1.5 min-w-0">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(chat.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        maxLength={120}
                        aria-label="Judul percakapan"
                        className="min-w-0 flex-1 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-base sm:text-xs text-white outline-none ring-1 ring-violet-500"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditing(chat.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-emerald-400 hover:bg-neutral-700"
                        aria-label="Simpan judul"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700"
                        aria-label="Batal"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectChat(chat.id)}
                        className="flex min-h-10 flex-1 items-center gap-2.5 min-w-0 rounded-full pl-3 pr-1 py-2 text-left"
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <MessageSquare
                          className={`h-4 w-4 shrink-0 ${
                            chat.pinned ? 'text-violet-400' : isActive ? 'text-violet-300' : 'text-neutral-500'
                          }`}
                        />
                        <span className={`truncate text-[13px] ${isActive ? 'font-medium' : ''}`}>{chat.title}</span>
                        {chat.pinned && <Pin className="h-3 w-3 shrink-0 text-violet-400/80" />}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(null);
                          setMenuId(isMenu ? null : chat.id);
                        }}
                        aria-expanded={isMenu}
                        aria-label={`Opsi untuk ${chat.title}`}
                        className={`mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-700 hover:text-white transition ${
                          isActive || isMenu ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
                        }`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {isMenu && !isEditing && (
                  <div className="fade-in mx-1 mt-1 mb-1.5 rounded-xl border border-neutral-700/70 bg-[#16151d] p-1">
                    {confirmDeleteId === chat.id ? (
                      <div className="p-2 space-y-2">
                        <div className="text-xs font-semibold text-rose-200">Hapus percakapan ini?</div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteChat(chat.id);
                              closeMenu();
                            }}
                            className="h-9 flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
                          >
                            Ya, hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-9 flex-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            onTogglePin(chat.id, chat.pinned);
                            closeMenu();
                          }}
                          className={rowAction}
                        >
                          <Pin className="h-4 w-4 text-violet-400" />
                          <span>{chat.pinned ? 'Lepas sematan' : 'Sematkan'}</span>
                        </button>
                        <button onClick={() => startEditing(chat.id, chat.title)} className={rowAction}>
                          <Edit2 className="h-4 w-4 text-blue-400" />
                          <span>Ubah judul</span>
                        </button>
                        <button onClick={() => exportChatAsMarkdown(chat)} className={rowAction}>
                          <Download className="h-4 w-4 text-emerald-400" />
                          <span>Ekspor (.md)</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(chat.id)}
                          className={`${rowAction} !text-rose-400 hover:!bg-rose-950/40`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Hapus</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Latar belakang gelap dengan backdrop blur halus */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        inert={!isOpen}
        aria-label="Riwayat percakapan"
        className={`fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] md:static md:z-auto md:shrink-0 border-r border-[#252330] bg-[#121118] overflow-hidden transition-[transform,width] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen
            ? 'translate-x-0 md:w-72 shadow-2xl'
            : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 pointer-events-none md:pointer-events-auto'
        }`}
      >
        <div className="flex h-full w-[min(19rem,86vw)] md:w-72 flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 border-b border-neutral-800/60 pt-[env(safe-area-inset-top)] box-content">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center select-none">
                <LunaOrb size={0.34} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold tracking-tight text-white leading-tight">Luna AI</span>
                <span className="text-[10px] text-violet-400/90 font-medium truncate">Dibuat oleh Gimoy Studio</span>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
              title="Tutup menu"
              aria-label="Tutup menu"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2 p-3 pb-2">
            <button
              onClick={onNewChat}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1a1922] px-4 text-sm font-medium text-white border border-neutral-700/60 hover:bg-[#282633] hover:border-neutral-600 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-violet-400" />
              <span>Obrolan baru</span>
            </button>
            <Link
              to="/perpustakaan"
              onNavigate={onOpenLibrary}
              aria-current={isLibraryActive ? 'page' : undefined}
              className={`flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-all active:scale-[0.98] ${
                isLibraryActive
                  ? 'border-violet-400/50 bg-violet-500/15 text-violet-100'
                  : 'border-transparent bg-transparent text-neutral-300 hover:bg-[#1a1922] hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4 text-violet-400" />
              <span>Perpustakaan</span>
            </Link>
          </div>

          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                placeholder="Cari percakapan..."
                aria-label="Cari percakapan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full bg-[#16151d] pl-10 pr-9 text-base sm:text-xs text-neutral-200 placeholder-neutral-500 outline-none border border-neutral-800 focus:border-violet-500/70 transition-colors [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:text-white"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-1 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-neutral-500">
                <MessageSquare className="h-8 w-8 mb-2 opacity-30 text-violet-400" />
                <span>{query ? 'Tidak ada percakapan yang cocok' : 'Belum ada riwayat percakapan. Mulai obrolan baru dengan Luna!'}</span>
              </div>
            ) : (
              <>
                {renderGroup('Disematkan', pinned)}
                {renderGroup('Hari ini', today)}
                {renderGroup('Kemarin', yesterday)}
                {renderGroup('7 hari terakhir', week)}
                {renderGroup('Lebih lama', older)}
              </>
            )}
          </nav>

          <div className="shrink-0 border-t border-[#252330] bg-[#0f0e14] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {currentUser.uid ? (
              <div className="flex items-center justify-between gap-1">
                <button
                  className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-neutral-800/60 transition-colors flex-1 min-w-0 text-left cursor-pointer"
                  onClick={onOpenSettings}
                  aria-label="Buka pengaturan akun"
                  title="Akun Google terhubung ke Database"
                >
                  <UserAvatar user={currentUser} className="h-8 w-8" ringClassName="ring-1 ring-violet-400/40" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span>{currentUser.displayName}</span>
                    </div>
                    <div className="truncate text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>Google Sync</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={onOpenSettings}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white cursor-pointer"
                  title="Pengaturan"
                  aria-label="Pengaturan"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-rose-400 cursor-pointer"
                  title="Keluar dari Akun Google"
                  aria-label="Keluar dari akun Google"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={onOpenAuth}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 py-2.5 px-3 text-xs font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  title="Masuk dengan Akun Google untuk sinkronisasi cloud"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Masuk dengan Google</span>
                </button>
                <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
                  <span>Mode Tamu</span>
                  <button
                    onClick={onOpenSettings}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Pengaturan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
