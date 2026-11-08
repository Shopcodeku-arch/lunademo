import { deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, where, collection } from 'firebase/firestore';
import { db } from './firebase';
import { ChatMessage, ChatSession } from '../types';

/**
 * Berbagi percakapan: salinan (snapshot) chat disimpan di Firestore pada koleksi `sharedChats/{shareId}`.
 * Siapa pun yang memegang tautan /s/{shareId} dapat membacanya (tanpa login), tetapi hanya pemilik yang bisa
 * membuat, memperbarui, atau menghapusnya (lihat firestore.rules). ID acak 12 karakter = tidak mudah ditebak.
 */

export interface SharedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface SharedChat {
  id: string;
  chatId: string;
  ownerUid: string;
  ownerName: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messages: SharedMessage[];
}

const COLLECTION = 'sharedChats';
const MAX_MESSAGES = 300;
const MAX_CONTENT = 20000;
const MAX_TOTAL_BYTES = 700_000; // batas dokumen Firestore 1 MiB; sisakan ruang

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export function newShareId(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function isValidShareId(id: string): boolean {
  return /^[A-Za-z0-9]{8,40}$/.test(id);
}

/** Tautan publik. Di domain Gimoy Studio selalu memakai domain utama (bukan login.*). */
export function shareUrl(id: string): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const root = 'gimoystudio.my.id';
  const base =
    host === root || host.endsWith(`.${root}`) ? 'https://luna.gimoystudio.my.id' : window.location.origin;
  return `${base}/s/${id}`;
}

/** Salinan aman: hanya teks percakapan. Lampiran (gambar/berkas) dan data unduhan tidak ikut dibagikan. */
export function sanitizeMessages(messages: ChatMessage[]): SharedMessage[] {
  const out: SharedMessage[] = [];
  let bytes = 0;
  for (const m of messages) {
    if ((m.role !== 'user' && m.role !== 'assistant') || m.isStreaming) continue;
    let content = (m.content || '').trim();
    const attached = [m.imageName, m.fileAttachment?.name].filter(Boolean);
    if (attached.length) content = `${content}\n\n_Lampiran tidak dibagikan: ${attached.join(', ')}_`.trim();
    if (!content) continue;
    if (content.length > MAX_CONTENT) content = `${content.slice(0, MAX_CONTENT)}\n\n_(dipotong)_`;
    bytes += content.length * 2 + 120;
    if (out.length >= MAX_MESSAGES || bytes > MAX_TOTAL_BYTES) break;
    out.push({ id: m.id, role: m.role, content, createdAt: m.createdAt || Date.now() });
  }
  return out;
}

export class ShareError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function toShareError(err: any): ShareError {
  if (err instanceof ShareError) return err;
  const code = String(err?.code || '');
  if (code.includes('permission-denied')) {
    return new ShareError(
      'rules',
      'Firestore belum mengizinkan fitur berbagi. Salin isi firestore.rules dari repo ke Firebase Console → Firestore → Rules, lalu tekan Publish.'
    );
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return new ShareError('network', 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.');
  }
  return new ShareError('unknown', 'Terjadi kendala saat memproses tautan. Coba lagi sebentar lagi.');
}

/** Cari tautan yang sudah dibuat untuk obrolan ini (milik pengguna). */
export async function findShare(uid: string, chatId: string): Promise<SharedChat | null> {
  try {
    const q = query(collection(db, COLLECTION), where('ownerUid', '==', uid), where('chatId', '==', chatId), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...(d.data() as Omit<SharedChat, 'id'>), id: d.id };
  } catch (err) {
    throw toShareError(err);
  }
}

/** Buat tautan baru, atau perbarui isi tautan yang sudah ada (ID tetap sama). */
export async function createOrUpdateShare(opts: {
  uid: string;
  ownerName: string;
  chat: ChatSession;
  existingId?: string;
}): Promise<SharedChat> {
  const messages = sanitizeMessages(opts.chat.messages);
  if (messages.length === 0) throw new ShareError('empty', 'Obrolan ini belum berisi pesan yang bisa dibagikan.');

  const now = Date.now();
  const id = opts.existingId || newShareId();
  const payload: Omit<SharedChat, 'id'> = {
    chatId: opts.chat.id,
    ownerUid: opts.uid,
    ownerName: opts.ownerName.slice(0, 60),
    title: (opts.chat.title || 'Percakapan').slice(0, 120),
    model: opts.chat.model || 'standard',
    createdAt: opts.existingId ? (await safeCreatedAt(id)) ?? now : now,
    updatedAt: now,
    messages,
  };
  try {
    await setDoc(doc(db, COLLECTION, id), payload);
  } catch (err) {
    throw toShareError(err);
  }
  return { ...payload, id };
}

async function safeCreatedAt(id: string): Promise<number | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? (snap.data() as SharedChat).createdAt : null;
  } catch {
    return null;
  }
}

/** Baca tautan publik (tanpa login). null = tidak ada / sudah dihentikan. */
export async function getShare(id: string): Promise<SharedChat | null> {
  if (!isValidShareId(id)) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? { ...(snap.data() as Omit<SharedChat, 'id'>), id: snap.id } : null;
  } catch (err) {
    throw toShareError(err);
  }
}

export async function stopShare(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw toShareError(err);
  }
}
