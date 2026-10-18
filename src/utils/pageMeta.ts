/** Ubah judul/deskripsi/URL kanonik halaman secara dinamis (SPA) supaya konsisten dengan SEO statis. */

export const SITE_URL = 'https://luna.gimoystudio.my.id';
export const DEFAULT_TITLE = 'Luna AI - Asisten AI Bahasa Indonesia, Komik & Dongeng Indonesia';
export const DEFAULT_DESCRIPTION =
  'Luna AI oleh Gimoy Studio: asisten AI berbahasa Indonesia dengan data real-time, plus Perpustakaan Luna untuk membaca komik dan dongeng Indonesia secara gratis.';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setPageMeta(opts: { title?: string; description?: string; path?: string; noindex?: boolean }) {
  if (typeof document === 'undefined') return;
  const title = opts.title || DEFAULT_TITLE;
  const description = opts.description || DEFAULT_DESCRIPTION;
  const url = SITE_URL + (opts.path && opts.path !== '/' ? opts.path : '/');

  document.title = title;
  setMeta('meta[name="description"]', 'name', 'description', description);
  setMeta('meta[property="og:title"]', 'property', 'og:title', title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', url);
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMeta('meta[name="robots"]', 'name', 'robots', opts.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large');

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}
