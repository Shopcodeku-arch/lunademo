import React, { useMemo, useSyncExternalStore } from 'react';

/**
 * Router ringan berbasis History API (tanpa dependensi tambahan).
 * Cukup untuk beberapa halaman: /, /perpustakaan, /perpustakaan/komik, /perpustakaan/dongengid, dst.
 */

const NAV_EVENT = 'luna:navigate';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}

const getSnapshot = () => window.location.pathname + window.location.search;
const getServerSnapshot = () => '/';

export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/{2,}/g, '/');
  return p.length > 1 ? p.replace(/\/+$/, '') : p || '/';
}

/** Lokasi saat ini: { pathname, search } dan ikut ter-render ulang saat berpindah halaman. */
export function useLocation(): { pathname: string; search: string } {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    const i = raw.indexOf('?');
    const pathname = normalizePath(i === -1 ? raw : raw.slice(0, i));
    return { pathname, search: i === -1 ? '' : raw.slice(i) };
  }, [raw]);
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname + window.location.search;
  if (to === current) return;
  if (options.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(NAV_EVENT));
}

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  onNavigate?: () => void;
}

/** Tautan internal: tetap berupa <a href> sungguhan (bagus untuk SEO & klik tengah/tab baru). */
export const Link: React.FC<LinkProps> = ({ to, onNavigate, onClick, children, ...rest }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        rest.target === '_blank'
      ) {
        return;
      }
      e.preventDefault();
      navigate(to);
      onNavigate?.();
    }}
    {...rest}
  >
    {children}
  </a>
);

export type LibraryRoute =
  | { view: 'hub' }
  | { view: 'komik' }
  | { view: 'komik-detail'; id: string }
  | { view: 'komik-reader'; id: string; chapterId: string }
  | { view: 'dongeng' }
  | { view: 'dongeng-story'; slug: string };

export function isLibraryPath(pathname: string): boolean {
  return pathname === '/perpustakaan' || pathname.startsWith('/perpustakaan/');
}

export function parseLibraryRoute(pathname: string): LibraryRoute {
  const parts = normalizePath(pathname).split('/').filter(Boolean); // ['perpustakaan', ...]
  const [, section, a, b] = parts;
  if (section === 'komik') {
    if (a && b) return { view: 'komik-reader', id: a, chapterId: b };
    if (a) return { view: 'komik-detail', id: a };
    return { view: 'komik' };
  }
  if (section === 'dongengid') {
    if (a) return { view: 'dongeng-story', slug: a };
    return { view: 'dongeng' };
  }
  return { view: 'hub' };
}
