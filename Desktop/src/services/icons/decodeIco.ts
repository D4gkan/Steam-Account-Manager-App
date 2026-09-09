import sharp from 'sharp';
// ICO input is decoded to a raster; neither HTML nor SVG is accepted.
export async function decodeIco(bytes: Buffer): Promise<Buffer> {
  if (bytes.length < 6 || bytes.readUInt32LE(0) !== 0x00010000) throw Error('Invalid ICO');
  const count = bytes.readUInt16LE(4); if (!count || count > 64 || bytes.length < 6 + count * 16) throw Error('Invalid ICO directory');
  const entries = Array.from({ length: count }, (_, i) => {
    const p = 6 + i * 16;
    return { width: bytes[p] || 256, height: bytes[p + 1] || 256, length: bytes.readUInt32LE(p + 8), offset: bytes.readUInt32LE(p + 12) };
  }).sort((a,b) => b.width - a.width);
  for (const e of entries) {
    if (e.offset < 6 + count * 16 || e.offset + e.length > bytes.length) continue;
    const data = bytes.subarray(e.offset, e.offset + e.length);
    if (data.length > 8 && data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return data;
    if (data.length < 40 || data.readUInt32LE(0) !== 40 || data.readUInt32LE(16) !== 0) continue;
    const width = data.readInt32LE(4), height = data.readInt32LE(8) / 2, bits = data.readUInt16LE(14);
    if (width !== e.width || height !== e.height || ![24,32].includes(bits)) continue;
    const stride = Math.ceil(width * bits / 32) * 4;
    const maskStride = Math.ceil(width / 32) * 4;
    if (40 + stride * height > data.length) continue;
    const out = Buffer.alloc(width * height * 4);
    let hasAlpha = false;
    if (bits === 32) for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[40 + y * stride + x * 4 + 3]) hasAlpha = true;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const p = 40 + (height - 1 - y) * stride + x * bits / 8, o = (y * width + x) * 4;
      out[o] = data[p+2]; out[o+1] = data[p+1]; out[o+2] = data[p];
      const maskOffset = 40 + stride * height + (height - 1 - y) * maskStride + Math.floor(x / 8);
      const masked = maskOffset < data.length && (data[maskOffset] & (128 >> (x % 8)));
      out[o+3] = hasAlpha ? data[p+3] : masked ? 0 : 255;
    }
    return sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer();
  }
  throw Error('ICO contains no supported PNG or bitmap');
}
