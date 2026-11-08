import { TikTokData } from '../types';

/**
 * Ambil URL TikTok dari teks pesan.
 * Mendukung:
 * - https://www.tiktok.com/@user/video/1234567890
 * - https://vt.tiktok.com/ZSjXxx/  |  https://vm.tiktok.com/ZSjXxx/
 * - https://m.tiktok.com/v/1234567890
 */
export function extractTikTokUrl(text: string): string | null {
  const match = text.match(/https?:\/\/(?:[a-zA-Z0-9_-]+\.)?tiktok\.com\/[^\s"')<>]+/i);
  return match ? match[0] : null;
}

/**
 * Alamat proxy di server Luna untuk memutar / mengunduh video.
 * Lewat proxy supaya tidak terblokir CORS / hotlink TikTok dan unduhan benar-benar
 * tersimpan sebagai file (bukan hanya dibuka di tab baru).
 */
export function tiktokProxyUrl(videoUrl: string, opts: { inline?: boolean; name?: string } = {}): string {
  const params = new URLSearchParams({ url: videoUrl });
  if (opts.inline) params.set('inline', '1');
  if (opts.name) params.set('name', opts.name);
  return `/api/tiktok/download-video?${params.toString()}`;
}

/**
 * Ambil info video TikTok tanpa watermark lewat server Luna (/api/tiktok/media).
 * Tidak ada API key di sisi klien.
 */
export async function fetchTikTokNoWm(videoUrl: string): Promise<TikTokData> {
  const cleanUrl = videoUrl.trim().replace(/["']/g, '');

  let res: Response;
  try {
    res = await fetch(`/api/tiktok/media?videoUrl=${encodeURIComponent(cleanUrl)}`);
  } catch {
    throw new Error('Tidak bisa terhubung ke server Luna. Periksa koneksi internet lalu coba lagi.');
  }

  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.error || `Server membalas HTTP ${res.status} saat mengambil video TikTok.`);
  }
  if (!data.downloadUrl) {
    throw new Error('Tautan unduhan tanpa watermark tidak ditemukan untuk video ini.');
  }

  return {
    id: String(data.id || Date.now()),
    author: {
      username: data.author?.username || 'creator',
      nickname: data.author?.nickname || data.author?.username || 'TikTok Creator',
      avatar: data.author?.avatar,
      verified: Boolean(data.author?.verified),
      signature: data.author?.signature || '',
    },
    description: data.description || '',
    cover: data.cover,
    stats: {
      likes: Number(data.stats?.likes || 0),
      comments: Number(data.stats?.comments || 0),
      views: Number(data.stats?.views || 0),
      shares: Number(data.stats?.shares || 0),
      saves: Number(data.stats?.saves || 0),
    },
    hashtags: Array.isArray(data.hashtags) ? data.hashtags.filter((h: any) => h && h.hashtagName) : [],
    downloadUrl: data.downloadUrl,
  };
}

/** Ringkasan teks untuk video yang berhasil diunduh. */
export function formatTikTokReport(data: TikTokData): string {
  const authorName = data.author.nickname || data.author.username;
  const verified = data.author.verified ? ' (terverifikasi)' : '';
  const fmt = (n?: number) => (n || 0).toLocaleString('id-ID');
  const tags = (data.hashtags || []).map((h) => `#${h.hashtagName.replace(/^#/, '')}`).join(' ');
  const description = data.description ? `\n> ${data.description}\n` : '';

  return `### Video TikTok berhasil diunduh (tanpa watermark)

- **Pembuat:** ${authorName} (\`@${data.author.username}\`)${verified}
- **Suka:** ${fmt(data.stats?.likes)}
- **Komentar:** ${fmt(data.stats?.comments)}
- **Tayangan:** ${fmt(data.stats?.views)}
${tags ? `- **Tagar:** ${tags}\n` : ''}${description}
Video dapat diputar langsung di bawah, dan file MP4-nya dapat diunduh dengan tombol yang tersedia.`;
}
