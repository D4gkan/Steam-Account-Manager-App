import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { cacheImage } from '../src/services/icons/iconFetcher';
import { decodeIco } from '../src/services/icons/decodeIco';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
describe('untrusted icon decoding', () => {
  it('accepts PNG-in-ICO and re-encodes it to a bounded PNG', async () => {
    const png = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#cc3333' } }).png().toBuffer();
    const ico = Buffer.alloc(22 + png.length); ico.writeUInt16LE(1,2); ico.writeUInt16LE(1,4); ico[6] = 32; ico[7] = 32; ico.writeUInt32LE(png.length,14); ico.writeUInt32LE(22,18); png.copy(ico,22);
    expect(await decodeIco(ico)).toEqual(png);
    const file = await cacheImage(ico, mkdtempSync(join(tmpdir(), 'sam-image-test-')));
    expect((await sharp(file).metadata()).format).toBe('png');
  });
  it('rejects SVG and non-PNG uploads', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sam-image-test-'));
    await expect(cacheImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'), dir)).rejects.toThrow();
    const jpeg = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } }).jpeg().toBuffer();
    await expect(cacheImage(jpeg, dir, true)).rejects.toThrow('PNG');
  });
});
