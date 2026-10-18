/*
 * Pasca-build (dijalankan setelah `vite build`):
 *  - Membuat HTML statis per rute Perpustakaan (judul, deskripsi, kanonik, JSON-LD, isi cerita)
 *    sehingga Google dan media sosial langsung melihat konten tanpa menunggu JavaScript.
 *  - Membuat sitemap.xml.
 *
 * Pakai: tsx scripts/seo-pages.ts [folderDist]
 */
import fs from 'node:fs';
import path from 'node:path';
import { DONGENG, readMinutes } from '../src/library/dongengData';

const SITE = 'https://luna.gimoystudio.my.id';
const dist = path.resolve(process.argv[2] || 'dist');

interface Page {
  path: string;
  title: string;
  description: string;
  ogType?: 'website' | 'article';
  jsonLd: Record<string, unknown>[];
  bodyHtml: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const crumbs = (items: Array<[string, string]>) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: SITE + p,
  })),
});

const nav = `<nav aria-label="Menu utama"><a href="/">Obrolan dengan Luna AI</a> · <a href="/perpustakaan">Perpustakaan Luna</a> · <a href="/perpustakaan/komik">Baca komik</a> · <a href="/perpustakaan/dongengid">Dongeng Indonesia</a></nav>`;

const storyLinks = DONGENG.map(
  (d) => `<li><a href="/perpustakaan/dongengid/${d.slug}">${esc(d.title)}</a>: ${esc(d.summary)}</li>`
).join('');

export function buildPages(): Page[] {
  const pages: Page[] = [];

  pages.push({
    path: '/perpustakaan',
    title: 'Perpustakaan Luna: Baca Komik & Dongeng Indonesia Gratis',
    description:
      'Perpustakaan Luna: baca komik online dan dongeng Indonesia (Si Kancil, Malin Kundang, Timun Mas, dan lainnya) gratis, bisa didengarkan, tanpa perlu akun.',
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: 'Perpustakaan Luna',
        url: `${SITE}/perpustakaan`,
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${SITE}/#website` },
      },
      crumbs([['Luna AI', '/'], ['Perpustakaan', '/perpustakaan']]),
    ],
    bodyHtml: `<header><h1>Perpustakaan Luna</h1><p>Baca komik dan dongeng Indonesia dalam satu tempat. Gratis, tanpa perlu masuk akun.</p></header>${nav}<main><h2>Dongeng Indonesia</h2><ul>${storyLinks}</ul><h2>Komik</h2><p><a href="/perpustakaan/komik">Jelajahi komik online</a> dalam bahasa Indonesia, simpan favorit, dan lanjutkan dari bab terakhir.</p></main>`,
  });

  pages.push({
    path: '/perpustakaan/komik',
    title: 'Baca Komik Online Gratis Bahasa Indonesia | Perpustakaan Luna',
    description:
      'Baca komik online gratis dalam bahasa Indonesia di Perpustakaan Luna. Cari judul, simpan favorit, dan lanjutkan membaca dari bab terakhir.',
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: 'Komik - Perpustakaan Luna',
        url: `${SITE}/perpustakaan/komik`,
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${SITE}/#website` },
      },
      crumbs([['Luna AI', '/'], ['Perpustakaan', '/perpustakaan'], ['Komik', '/perpustakaan/komik']]),
    ],
    bodyHtml: `<header><h1>Baca Komik Online Gratis</h1><p>Jelajahi ribuan judul komik berbahasa Indonesia, cari judul favoritmu, simpan, dan lanjutkan membaca dari bab terakhir. Hanya konten ramah keluarga yang ditampilkan.</p></header>${nav}<main><p>Data dan gambar komik bersumber dari MangaDex. Hak cipta karya ada pada pembuat dan penerbitnya masing-masing.</p></main>`,
  });

  pages.push({
    path: '/perpustakaan/dongengid',
    title: 'Dongeng Indonesia: Kumpulan Cerita Rakyat, Legenda & Fabel Si Kancil | Perpustakaan Luna',
    description:
      'Baca dongeng Indonesia gratis: Si Kancil, Malin Kundang, Bawang Merah Bawang Putih, Timun Mas, Sangkuriang, Danau Toba, dan banyak lagi, lengkap dengan pesan moral dan mode dengarkan.',
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: 'Dongeng Indonesia - Perpustakaan Luna',
        url: `${SITE}/perpustakaan/dongengid`,
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${SITE}/#website` },
        hasPart: DONGENG.map((d) => ({ '@type': 'CreativeWork', name: d.title, url: `${SITE}/perpustakaan/dongengid/${d.slug}` })),
      },
      {
        '@type': 'ItemList',
        itemListElement: DONGENG.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: d.title,
          url: `${SITE}/perpustakaan/dongengid/${d.slug}`,
        })),
      },
      crumbs([['Luna AI', '/'], ['Perpustakaan', '/perpustakaan'], ['Dongeng Indonesia', '/perpustakaan/dongengid']]),
    ],
    bodyHtml: `<header><h1>Dongeng Indonesia</h1><p>Kumpulan cerita rakyat dari berbagai daerah, dari kecerdikan Si Kancil sampai legenda gunung dan danau.</p></header>${nav}<main><ul>${storyLinks}</ul></main>`,
  });

  for (const d of DONGENG) {
    const url = `${SITE}/perpustakaan/dongengid/${d.slug}`;
    pages.push({
      path: `/perpustakaan/dongengid/${d.slug}`,
      title: `${d.title}: Dongeng ${d.category} dari ${d.origin} | Perpustakaan Luna`,
      description: `${d.summary} Baca ceritanya lengkap dengan pesan moral di Perpustakaan Luna.`,
      ogType: 'article',
      jsonLd: [
        {
          '@type': 'Article',
          headline: d.title,
          description: d.summary,
          url,
          mainEntityOfPage: url,
          inLanguage: 'id-ID',
          genre: d.category,
          keywords: d.keywords.join(', '),
          timeRequired: `PT${readMinutes(d)}M`,
          image: `${SITE}/og-image.png`,
          author: { '@id': `${SITE}/#organization` },
          publisher: { '@id': `${SITE}/#organization` },
          isPartOf: { '@id': `${SITE}/#website` },
        },
        crumbs([
          ['Luna AI', '/'],
          ['Perpustakaan', '/perpustakaan'],
          ['Dongeng Indonesia', '/perpustakaan/dongengid'],
          [d.title, `/perpustakaan/dongengid/${d.slug}`],
        ]),
      ],
      bodyHtml: `<article><header><p><a href="/perpustakaan/dongengid">Dongeng Indonesia</a> / ${esc(d.category)} / ${esc(d.origin)}</p><h1>${esc(d.title)}</h1><p>${esc(d.summary)}</p></header>${d.paragraphs
        .map((p) => `<p>${esc(p)}</p>`)
        .join('')}<h2>Pesan moral</h2><p>${esc(d.moral)}</p></article>${nav}`,
    });
  }

  return pages;
}

/* ------------------------------ Penulis HTML ------------------------------ */

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`meta ${key} tidak ditemukan di index.html`);
  return html.replace(re, (_m, a, b) => `${a}${esc(value)}${b}`);
}

export function renderPage(tpl: string, page: Page): string {
  const url = SITE + page.path;
  let html = tpl;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:type', page.ogType || 'website');
  html = setMeta(html, 'name', 'twitter:title', page.title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<link rel="alternate" hreflang="id" href=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, `$1${url}$2`);

  // JSON-LD: pertahankan WebSite/Organization/WebApplication, tambahkan data halaman
  const ld = /<script type="application\/ld\+json" id="ld-main">([\s\S]*?)<\/script>/;
  const m = html.match(ld);
  if (!m) throw new Error('JSON-LD (ld-main) tidak ditemukan di index.html');
  const base = JSON.parse(m[1]);
  base['@graph'] = [...base['@graph'], ...page.jsonLd];
  html = html.replace(
    ld,
    `<script type="application/ld+json" id="ld-main">${JSON.stringify(base).replace(/</g, '\\u003c')}</script>`
  );

  // Konten awal untuk crawler
  const pre = /<!--seo:start-->[\s\S]*?<!--seo:end-->/;
  if (!pre.test(html)) throw new Error('penanda <!--seo:start--> tidak ditemukan di index.html');
  html = html.replace(pre, () => `<!--seo:start--><div id="seo-prerender">${page.bodyHtml}</div><!--seo:end-->`);

  return html;
}

export function buildSitemap(pages: Page[], today = new Date().toISOString().slice(0, 10)): string {
  const entries = [{ path: '/', priority: '1.0', freq: 'weekly' }].concat(
    pages.map((p) => ({
      path: p.path,
      priority: p.path === '/perpustakaan' ? '0.9' : p.path.split('/').length > 3 ? '0.6' : '0.8',
      freq: p.path.split('/').length > 3 ? 'monthly' : 'weekly',
    }))
  );
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${SITE}${e.path === '/' ? '/' : e.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${e.freq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function main() {
  const indexFile = path.join(dist, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.error(`[seo] ${indexFile} tidak ada. Jalankan "vite build" dulu.`);
    process.exit(1);
  }
  const tpl = fs.readFileSync(indexFile, 'utf8');
  const pages = buildPages();

  for (const page of pages) {
    const dir = path.join(dist, page.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderPage(tpl, page));
  }
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), buildSitemap(pages));
  console.log(`[seo] ${pages.length} halaman statis + sitemap.xml dibuat di ${dist}`);
}

// Jalankan hanya bila dipanggil langsung (bukan saat di-import untuk pengujian)
if (process.argv[1] && /seo-pages\.[cm]?[tj]s$/.test(process.argv[1])) main();
