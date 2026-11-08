import type { Request, Response } from 'express';
import app from '../server/app.js';
import { restoreApiUrl } from '../server/vercelUrl.js';

// Vercel Serverless Function: semua /api/* masuk ke sini lewat rewrite di vercel.json.
export default function handler(req: Request, res: Response) {
  req.url = restoreApiUrl(req.url);
  return (app as unknown as (req: Request, res: Response) => void)(req, res);
}
