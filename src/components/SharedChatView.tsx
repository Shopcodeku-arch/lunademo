import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { getShare, SharedChat, ShareError } from '../services/shareChat';
import { setPageMeta } from '../utils/pageMeta';
import { navigate } from '../utils/router';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LunaOrb } from './LunaOrb';

/** Halaman publik /s/{id}: membaca percakapan yang dibagikan (hanya-baca, tanpa login). */
export const SharedChatView: React.FC<{ id: string }> = ({ id }) => {
  const [data, setData] = useState<SharedChat | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setData(null);
    getShare(id)
      .then((s) => {
        if (cancelled) return;
        if (!s) setState('missing');
        else {
          setData(s);
          setState('ok');
        }
      })
      .catch((e: ShareError) => {
        if (cancelled) return;
        setError(e.message);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, retry]);

  useEffect(() => {
    setPageMeta({
      title: data ? `${data.title} - Percakapan dibagikan | Luna AI` : 'Percakapan dibagikan | Luna AI',
      description: 'Percakapan yang dibagikan dari Luna AI.',
      path: `/s/${id}`,
      noindex: true,
    });
  }, [data, id]);

  if (state === 'loading') {
    return (
      <div className="grid flex-1 place-items-center pt-16 text-neutral-500" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (state !== 'ok' || !data) {
    return (
      <div className="grid flex-1 place-items-center px-6 pt-16 text-center">
        <div className="max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
            {state === 'missing' ? 'Tautan tidak ditemukan' : 'Gagal memuat percakapan'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            {state === 'missing'
              ? 'Percakapan ini tidak ada, atau pemiliknya sudah menghentikan berbagi.'
              : error || 'Terjadi kendala saat memuat percakapan.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {state === 'error' && (
              <button onClick={() => setRetry((n) => n + 1)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-neutral-100 hover:bg-white/10">
                <RefreshCw className="h-4 w-4" /> Coba lagi
              </button>
            )}
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">
              Buka Luna AI <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-24 sm:px-6">
        <header className="mb-8 border-b border-white/5 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Percakapan dibagikan</p>
          <h1 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight text-neutral-50 sm:text-3xl">{data.title}</h1>
          <p className="mt-2 break-words text-sm text-neutral-400">
            Oleh {data.ownerName} ·{' '}
            {new Date(data.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} · {data.messages.length} pesan
          </p>
        </header>

        <div className="space-y-7">
          {data.messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={m.id || i} className="flex justify-end">
                <div className="max-w-[88%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-[#221f2d] px-4 py-3 text-[15px] leading-relaxed text-neutral-100 [overflow-wrap:anywhere]">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id || i} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <LunaOrb size={0.3} />
                </div>
                <div className="min-w-0 flex-1 text-neutral-200">
                  <p className="mb-1 text-xs font-semibold text-neutral-300">Luna</p>
                  <MarkdownRenderer content={m.content} />
                </div>
              </div>
            )
          )}
        </div>

        <footer className="mt-12 rounded-2xl border border-white/10 bg-[#16151d] p-5 text-center">
          <p className="text-sm text-neutral-300">Ini salinan percakapan yang bersifat hanya-baca. Luna dapat membuat kekeliruan, jadi verifikasi informasi penting.</p>
          <button onClick={() => navigate('/')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 active:scale-95">
            Mulai obrolan dengan Luna <ArrowRight className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </main>
  );
};
