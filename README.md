# Luna AI

Asisten AI berbahasa Indonesia dari Gimoy Studio, plus **Perpustakaan Luna** (komik & dongeng Indonesia).
Situs: https://luna.gimoystudio.my.id

## Fitur
- Obrolan AI (Overchat API lewat server sendiri), data real-time (waktu, berita, cuaca, kurs, kripto), unduh TikTok tanpa watermark.
- **Perpustakaan** `/perpustakaan`
  - `/perpustakaan/komik`: katalog komik (sumber: API publik MangaDex, hanya konten *safe*), pembaca, favorit, lanjutkan membaca.
  - `/perpustakaan/dongengid`: 23 dongeng Indonesia (Si Kancil, Malin Kundang, Timun Mas, dll.), sampul bergambar tokoh, mode dengarkan, pesan moral, "Tanya Luna".
- Slide "Update terbaru" untuk pengunjung baru (`src/library/WhatsNew.tsx`).

## Menambah / mengganti dongeng
- Tambah objek baru di `src/library/dongengData.ts` (slug, judul, kategori, `paragraphs`, `moral`, ...). Halaman statis SEO & sitemap ikut dibuat otomatis saat build.
- Sampul bawaan = ilustrasi tokoh di `src/library/storyArt.tsx` (`ART[slug]`). Cerita tanpa entri di sana memakai latar pemandangan saja.
- Ingin sampul buatan sendiri? Taruh gambar di `public/covers/nama.webp` (rasio 3:4) lalu isi `image: '/covers/nama.webp'` pada ceritanya.

## Struktur singkat
- `src/library/` — Perpustakaan (data dongeng di `dongengData.ts`).
- `src/utils/router.tsx` — router ringan berbasis History API.
- `server/` — Express: `overchat.ts`, `realtime.ts`, `tiktok.ts`, `komik.ts`; dipanggil lewat `api/index.ts` di Vercel.
- `scripts/seo-pages.ts` — setelah `vite build`, membuat HTML statis per rute + `sitemap.xml`.
- `public/` — favicon, manifest, `robots.txt`, `og-image.png`.

## Menjalankan
```
npm install
npm run dev        # server + Vite
npm run build:web  # untuk Vercel
```

## Deploy Vercel
1. Import repo (framework: Vite). Build command sudah diatur di `vercel.json` (`npm run build:web`).
2. Login Google: lihat bagian domain login di `src/services/firebase.ts` dan `vercel.json` (`/__/auth/*`).
   Firebase Authorized domains harus memuat domain situs; OAuth client harus memuat redirect URI `https://login.gimoystudio.my.id/__/auth/handler`.
3. Opsional: `RAPIDAPI_KEY` sebagai cadangan pengunduh TikTok (jangan ditulis di kode).

## SEO
Setelah deploy, daftarkan situs di Google Search Console (properti URL prefix `https://luna.gimoystudio.my.id`),
kirim `https://luna.gimoystudio.my.id/sitemap.xml`, lalu minta pengindeksan halaman utama.
