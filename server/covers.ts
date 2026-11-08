/*
 * Sampul dongeng dari gambar asli (bukan ilustrasi buatan sendiri).
 *
 * Sumber: foto/ilustrasi utama artikel Wikipedia yang relevan (mis. Danau Toba, Candi Prambanan, Kancil),
 * yang tersimpan di Wikimedia Commons. Setiap gambar DIVERIFIKASI lisensinya lewat API Commons:
 *  - hanya lisensi terbuka (CC BY, CC BY-SA, CC0, Domain Publik, GFDL, ...)
 *  - ditolak bila ada NC (nonkomersial) / ND (tanpa turunan) / non-free / unggahan lokal (bukan Commons)
 * Atribusi (pembuat, lisensi, tautan) dikembalikan agar dapat ditampilkan di halaman cerita.
 */

const UA = 'LunaAI-Library/1.0 (https://luna.gimoystudio.my.id; perpustakaan dongeng)';

export interface CoverCredit {
  /** Judul artikel Wikipedia sumber. */
  article: string;
  articleUrl: string;
  /** Halaman berkas di Wikimedia Commons. */
  fileUrl: string;
  author: string;
  license: string;
}

export interface Cover {
  url: string;
  width: number;
  height: number;
  credit: CoverCredit;
}

interface Source {
  lang: 'id' | 'en';
  /** Kata pencarian artikel. */
  q: string;
  /** Judul artikel harus cocok (mencegah hasil pencarian yang tidak relevan). */
  match: RegExp;
}

/** Sumber gambar per cerita, dicoba berurutan sampai ada yang lolos verifikasi lisensi. */
export const COVER_SOURCES: Record<string, Source[]> = {
  'si-kancil-dan-buaya': [
    { lang: 'id', q: 'Kancil Tragulus', match: /kancil|pelanduk|tragulus/i },
    { lang: 'en', q: 'Lesser mouse-deer', match: /mouse-deer/i },
  ],
  'si-kancil-mencuri-timun': [
    { lang: 'en', q: 'Greater mouse-deer', match: /mouse-deer/i },
    { lang: 'id', q: 'Pelanduk napu', match: /pelanduk|kancil|tragulus/i },
  ],
  'si-kancil-dan-harimau': [
    { lang: 'id', q: 'Harimau sumatra', match: /harimau/i },
    { lang: 'en', q: 'Sumatran tiger', match: /tiger/i },
  ],
  'malin-kundang': [
    { lang: 'id', q: 'Malin Kundang', match: /malin/i },
    { lang: 'id', q: 'Pantai Air Manis Padang', match: /air manis/i },
  ],
  'bawang-merah-bawang-putih': [
    { lang: 'id', q: 'Bawang merah', match: /bawang/i },
    { lang: 'id', q: 'Bawang putih', match: /bawang/i },
  ],
  'timun-mas': [
    { lang: 'id', q: 'Mentimun', match: /mentimun|timun/i },
    { lang: 'en', q: 'Cucumber', match: /cucumber/i },
  ],
  sangkuriang: [
    { lang: 'id', q: 'Gunung Tangkuban Parahu', match: /tangkuban|sangkuriang/i },
    { lang: 'id', q: 'Sangkuriang', match: /sangkuriang|tangkuban/i },
  ],
  'legenda-danau-toba': [
    { lang: 'id', q: 'Danau Toba', match: /toba/i },
    { lang: 'en', q: 'Lake Toba', match: /toba/i },
  ],
  'roro-jonggrang': [
    { lang: 'id', q: 'Candi Prambanan', match: /prambanan|jonggrang/i },
    { lang: 'en', q: 'Prambanan', match: /prambanan/i },
  ],
  'keong-mas': [
    { lang: 'id', q: 'Keong mas', match: /keong/i },
    { lang: 'en', q: 'Pomacea canaliculata', match: /pomacea/i },
  ],
  'asal-usul-rawa-pening': [
    { lang: 'id', q: 'Rawa Pening', match: /rawa pening/i },
    { lang: 'en', q: 'Rawa Pening', match: /rawa pening/i },
  ],
  'lutung-kasarung': [
    { lang: 'id', q: 'Lutung jawa', match: /lutung/i },
    { lang: 'en', q: 'Javan lutung', match: /lutung/i },
  ],
  'si-kancil-dan-siput': [
    { lang: 'id', q: 'Siput', match: /siput/i },
    { lang: 'en', q: 'Snail', match: /snail/i },
  ],
  'kura-kura-dan-monyet': [
    { lang: 'id', q: 'Kura-kura', match: /kura/i },
    { lang: 'en', q: 'Tortoise', match: /tortoise|turtle/i },
  ],
  'sura-dan-baya': [
    { lang: 'id', q: 'Monumen Suro dan Boyo', match: /suro|sura|boyo|baya/i },
    { lang: 'id', q: 'Kota Surabaya', match: /surabaya/i },
  ],
  cindelaras: [
    { lang: 'id', q: 'Ayam hutan hijau', match: /ayam/i },
    { lang: 'en', q: 'Green junglefowl', match: /junglefowl/i },
  ],
  'jaka-tarub': [
    { lang: 'id', q: 'Jaka Tarub', match: /tarub/i },
    { lang: 'id', q: 'Bidadari', match: /bidadari/i },
  ],
  'gunung-bromo': [
    { lang: 'id', q: 'Gunung Bromo', match: /bromo/i },
    { lang: 'en', q: 'Mount Bromo', match: /bromo/i },
  ],
  'telaga-warna': [
    { lang: 'id', q: 'Telaga Warna Puncak Cisarua', match: /telaga warna/i },
    { lang: 'en', q: 'Telaga Warna', match: /telaga warna/i },
  ],
  'batu-menangis': [
    { lang: 'id', q: 'Batu Menangis', match: /batu menangis/i },
    { lang: 'en', q: 'Batu Menangis', match: /batu menangis/i },
  ],
  'putri-mandalika': [
    { lang: 'id', q: 'Pantai Seger Lombok', match: /seger/i },
    { lang: 'id', q: 'Bau Nyale', match: /nyale/i },
  ],
  'ande-ande-lumut': [
    { lang: 'id', q: 'Ande Ande Lumut', match: /ande/i },
    { lang: 'id', q: 'Kepiting', match: /kepiting|yuyu/i },
  ],
  'manik-angkeran': [
    { lang: 'id', q: 'Selat Bali', match: /selat bali/i },
    { lang: 'en', q: 'Bali Strait', match: /bali strait/i },
  ],
};

async function wj(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

// Lisensi terbuka yang diizinkan; tanpa NC/ND
const FREE_LICENSE = /^(cc[- ]?by|cc[- ]?zero|cc0|public domain|pd\b|gfdl|attribution|fal\b|ogl)/i;
const RESTRICTED = /(\bnc\b|-nc|\bnd\b|-nd|noncommercial|non-commercial|no derivatives)/i;

export interface LicenseInfo {
  license: string;
  author: string;
  fileUrl: string;
}

/** Cek lisensi berkas di Commons. null = tidak ada di Commons, non-free, atau lisensinya terbatas. */
export async function commonsLicense(fileName: string): Promise<LicenseInfo | null> {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action', 'query');
  u.searchParams.set('titles', `File:${fileName}`);
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'extmetadata');
  u.searchParams.set('iiextmetadatafilter', 'LicenseShortName|Artist|NonFree|Restrictions|AttributionRequired');
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  const data = await wj(u.toString());
  const page = data?.query?.pages?.[0];
  if (!page || page.missing || !page.imageinfo?.[0]) return null;

  const em = page.imageinfo[0].extmetadata || {};
  if (String(em.NonFree?.value || '').toLowerCase() === 'true') return null;
  const license = stripHtml(String(em.LicenseShortName?.value || ''));
  if (!license || !FREE_LICENSE.test(license) || RESTRICTED.test(license)) return null;

  return {
    license,
    author: stripHtml(String(em.Artist?.value || '')).slice(0, 80) || 'Kontributor Wikimedia Commons',
    fileUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName.replace(/ /g, '_'))}`,
  };
}

async function fromSource(src: Source): Promise<Cover | null> {
  const u = new URL(`https://${src.lang}.wikipedia.org/w/api.php`);
  u.searchParams.set('action', 'query');
  u.searchParams.set('generator', 'search');
  u.searchParams.set('gsrsearch', src.q);
  u.searchParams.set('gsrlimit', '5');
  u.searchParams.set('gsrnamespace', '0');
  u.searchParams.set('prop', 'pageimages|info');
  u.searchParams.set('piprop', 'thumbnail|name');
  u.searchParams.set('pithumbsize', '640');
  u.searchParams.set('inprop', 'url');
  u.searchParams.set('format', 'json');
  u.searchParams.set('formatversion', '2');
  const data = await wj(u.toString());
  const pages: any[] = (data?.query?.pages || []).slice().sort((a: any, b: any) => (a.index ?? 99) - (b.index ?? 99));

  for (const p of pages) {
    if (!p.pageimage || !p.thumbnail?.source) continue;
    if (!src.match.test(String(p.title || ''))) continue;
    // Hanya berkas Commons (unggahan lokal wiki bisa non-free)
    if (!/\/wikipedia\/commons\//.test(p.thumbnail.source)) continue;
    // Abaikan logo/peta/ikon bergaya SVG kecil
    if (/\.svg$/i.test(p.pageimage) && /(logo|flag|map|locator|coat)/i.test(p.pageimage)) continue;

    const lic = await commonsLicense(p.pageimage);
    if (!lic) continue;
    return {
      url: String(p.thumbnail.source),
      width: Number(p.thumbnail.width) || 640,
      height: Number(p.thumbnail.height) || 480,
      credit: {
        article: String(p.title),
        articleUrl: String(p.fullurl || `https://${src.lang}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`),
        fileUrl: lic.fileUrl,
        author: lic.author,
        license: lic.license,
      },
    };
  }
  return null;
}

const memory = new Map<string, { at: number; cover: Cover | null }>();
const inflight = new Map<string, Promise<Cover | null>>();
const TTL_OK = 12 * 3600_000;
const TTL_MISS = 30 * 60_000;

/** Cari sampul asli untuk satu cerita. null = tidak ada gambar berlisensi terbuka (pakai ilustrasi bawaan). */
export function resolveCover(slug: string): Promise<Cover | null> {
  const sources = COVER_SOURCES[slug];
  if (!sources) return Promise.resolve(null);

  const hit = memory.get(slug);
  if (hit && Date.now() - hit.at < (hit.cover ? TTL_OK : TTL_MISS)) return Promise.resolve(hit.cover);
  const running = inflight.get(slug);
  if (running) return running;

  const p = (async () => {
    let cover: Cover | null = null;
    let hadError = false;
    for (const src of sources) {
      try {
        cover = await fromSource(src);
        if (cover) break;
      } catch {
        hadError = true; // gangguan jaringan: jangan simpan sebagai "tidak ada" terlalu lama
      }
    }
    memory.set(slug, { at: hadError && !cover ? Date.now() - (TTL_MISS - 60_000) : Date.now(), cover });
    return cover;
  })().finally(() => inflight.delete(slug));

  inflight.set(slug, p);
  return p;
}

/** Resolusi massal dengan batas konkurensi (dipakai skrip build). */
export async function resolveAllCovers(slugs: string[], concurrency = 4): Promise<Record<string, Cover | null>> {
  const out: Record<string, Cover | null> = {};
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, slugs.length) }, async () => {
      while (i < slugs.length) {
        const slug = slugs[i++];
        out[slug] = await resolveCover(slug);
      }
    })
  );
  return out;
}
