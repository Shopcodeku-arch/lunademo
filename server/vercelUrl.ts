/**
 * Di Vercel semua /api/* diarahkan (rewrite) ke satu fungsi: /api/index?route=<path>.
 * Fungsi ini memulihkan URL aslinya (/api/<path>?...) supaya cocok dengan rute Express,
 * apa pun yang Vercel taruh di req.url (URL asli maupun URL tujuan rewrite).
 */
export function restoreApiUrl(rawUrl: string | undefined): string {
  const url = new URL(rawUrl || '/', 'http://localhost');
  const route = url.searchParams.get('route');

  if (route !== null) {
    url.searchParams.delete('route');
    const clean = route.replace(/^\/+|\/+$/g, '');
    const qs = url.searchParams.toString();
    return `/api${clean ? `/${clean}` : ''}${qs ? `?${qs}` : ''}`;
  }
  return `${url.pathname}${url.search}`;
}
