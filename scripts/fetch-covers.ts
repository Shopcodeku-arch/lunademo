/*
 * Pasca-build: mengambil sampul asli (Wikimedia Commons, lisensi terbuka terverifikasi) untuk semua dongeng
 * dan menulis dist/covers.json. Dibaca browser sebagai berkas statis, jadi sampul langsung tampil tanpa menunggu API.
 * Bila jaringan build bermasalah, skrip ini aman dilewati: browser akan memakai /api/library/cover/:slug.
 *
 * Pakai: tsx scripts/fetch-covers.ts [folderDist]
 */
import fs from 'node:fs';
import path from 'node:path';
import { DONGENG } from '../src/library/dongengData';
import { resolveAllCovers } from '../server/covers';

const dist = path.resolve(process.argv[2] || 'dist');

async function main() {
  if (!fs.existsSync(dist)) {
    console.error(`[covers] folder ${dist} tidak ada. Jalankan "vite build" dulu.`);
    process.exit(1);
  }
  const covers = await resolveAllCovers(
    DONGENG.map((d) => d.slug),
    5
  );
  const found = Object.values(covers).filter(Boolean).length;
  fs.writeFileSync(
    path.join(dist, 'covers.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), covers })
  );
  console.log(`[covers] ${found}/${DONGENG.length} sampul asli ditemukan, covers.json ditulis di ${dist}`);
}

main().catch((e) => {
  console.error('[covers] gagal:', e?.message || e);
  process.exit(1);
});
