import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { load } from 'cheerio';
import { safeFetch } from './safeFetch';
import { decodeIco } from './decodeIco';
export const ICON_ERROR = "We couldn't fetch this website's icon. Please provide a PNG file.";
export async function cacheImage(bytes: Buffer, cacheDir: string, pngOnly = false): Promise<string> {
  if (bytes.length > 2 * 1024 * 1024) throw Error('Image exceeds 2 MB');
  if (!pngOnly && bytes.length >= 6 && bytes.readUInt32LE(0) === 0x00010000) bytes = await decodeIco(bytes);
  const image = sharp(bytes, { limitInputPixels: 4096 * 4096 });
  const metadata = await image.metadata();
  if (pngOnly && metadata.format !== 'png') throw Error('Please provide a PNG file');
  if (!['png', 'jpeg', 'webp', 'gif'].includes(metadata.format || '') || !metadata.width || !metadata.height || metadata.width > 4096 || metadata.height > 4096) throw Error('Unsupported image type or dimensions');
  const buffer = await image.resize(128, 128, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  fs.mkdirSync(cacheDir, { recursive: true }); const target = path.join(cacheDir, randomUUID() + '.png'); fs.writeFileSync(target, buffer); return target;
}
export async function fetchWebsiteIcon(siteUrl: string, cacheDir: string) {
  const candidates: string[] = [];
  try {
    const page = await safeFetch(siteUrl);
    if (page.type === 'text/html') {
      const $ = load(page.bytes.toString('utf8'));
      $('link[rel]').each((_, el) => { if (/\bicon\b/i.test($(el).attr('rel') || '') && candidates.length < 4) { const href = $(el).attr('href'); if (href) { try { candidates.push(new URL(href, page.url).href); } catch {} } } });
    }
  } catch {}
  candidates.push(new URL('/favicon.ico', siteUrl).href);
  for (const url of candidates) {
    try { const fetched = await safeFetch(url); return { ok: true as const, cachePath: await cacheImage(fetched.bytes, cacheDir), source: 'fetched' as const }; } catch {}
  }
  return { ok: false as const, reason: ICON_ERROR };
}
