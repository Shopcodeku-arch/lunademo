/*
 * Luna AI -> Overchat API
 * Referensi: Khafa - t.me/KhafaReal | Channel: https://t.me/khafaxyz
 *
 * Request dibuat persis seperti skrip referensi (endpoint, header, payload).
 * Dipanggil dari server (bukan dari browser) karena header Origin/Referer/User-Agent
 * tidak boleh diatur oleh browser dan Overchat tidak mengizinkan CORS.
 */
import { randomUUID } from 'node:crypto';

export const OVERCHAT_ENDPOINT = 'https://api.overchat.ai/v1/chat/completions';
export const OVERCHAT_ORIGIN = 'https://overchat.ai';
export const OVERCHAT_MODEL = 'openai/gpt-4o';

export interface OverchatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildHeaders(): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Referer': `${OVERCHAT_ORIGIN}/`,
    'Origin': OVERCHAT_ORIGIN,
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'X-Device-Language': 'id-ID',
    'X-Device-Platform': 'web',
    'X-Device-Version': '1.0.44',
    'X-Device-Uuid': randomUUID(),
  };
}

/** Rapikan pesan dari klien: buang yang kosong/tidak valid, pastikan id & role benar. */
export function normalizeMessages(input: unknown): OverchatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: OverchatMessage[] = [];
  for (const m of input as any[]) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'system' || m.role === 'assistant' ? m.role : 'user';
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '');
    if (!content.trim()) continue;
    out.push({ id: typeof m.id === 'string' && m.id ? m.id : randomUUID(), role, content });
  }
  return out;
}

/** Kirim ke Overchat dan kembalikan Response mentah (SSE). */
export function requestOverchat(messages: OverchatMessage[], signal?: AbortSignal): Promise<Response> {
  const payload = {
    chatId: randomUUID(),
    frequency_penalty: 0,
    max_tokens: 4000,
    messages,
    model: OVERCHAT_MODEL,
    personaId: 'best-free-ai-chat-landing',
    presence_penalty: 0,
    stream: true,
    temperature: 0.5,
    top_p: 0.95,
  };

  return fetch(OVERCHAT_ENDPOINT, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
    signal,
  });
}

/** Baca seluruh aliran SSE lalu gabungkan token menjadi satu teks (mode non-stream). */
export async function collectOverchatText(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.substring(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const token = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
        if (token) full += token;
      } catch {
        // potongan JSON belum lengkap, abaikan
      }
    }
  }
  return full.trim();
}
