// studio/image-meta.ts — strip metadata (EXIF GPS of someone's HOME, camera serials, XMP) from a
// client photo before it leaves the platform for an AI provider, and from stored renders.
//
// Pure byte surgery, no decoder: JPEG drops APP1–APP15 + COM segments (keeps APP0/JFIF + image data);
// PNG drops eXIf/tEXt/zTXt/iTXt/tIME chunks. Orientation lives in EXIF, so the web client re-encodes
// photos upright via canvas before upload (P3) — this server pass is the defense-in-depth layer.
//
// FAILS CLOSED: a JPEG/PNG the walker can't fully parse throws UnsafeImageError instead of handing
// back the original bytes (which would still carry the GPS block). Callers turn that into a 422 or a
// failed render — never a silent pass-through.

export class UnsafeImageError extends Error {
  constructor(message: string) { super(message); this.name = 'UnsafeImageError'; }
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * `passUnknown` lets a non-JPEG/PNG through unchanged — only for PROVIDER OUTPUT (some return WebP),
 * never for a client's photo.
 */
export function stripImageMetadata(buf: Buffer, opts: { passUnknown?: boolean } = {}): Buffer {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return stripJpeg(buf);
  if (buf.length > 8 && buf.subarray(0, 8).equals(PNG_SIG)) return stripPng(buf);
  if (opts.passUnknown) return buf;
  throw new UnsafeImageError('not a JPEG or PNG');
}

function stripJpeg(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new UnsafeImageError('JPEG: expected a marker');
    // Any number of 0xFF fill bytes may precede a marker (ITU T.81 §B.1.1.2) — skip them.
    while (i + 1 < buf.length && buf[i + 1] === 0xff) i++;
    if (i + 1 >= buf.length) break;
    const marker = buf[i + 1]!;
    if (marker === 0xda) { out.push(buf.subarray(i)); return Buffer.concat(out); } // SOS: rest is image data
    if (marker === 0xd9) { out.push(buf.subarray(i, i + 2)); return Buffer.concat(out); }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { out.push(buf.subarray(i, i + 2)); i += 2; continue; }
    if (i + 4 > buf.length) break;
    const len = buf.readUInt16BE(i + 2);
    if (len < 2 || i + 2 + len > buf.length) throw new UnsafeImageError('JPEG: segment runs past the end');
    const drop = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!drop) out.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  throw new UnsafeImageError('JPEG: no image data');
}

const PNG_DROP = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME']);
function stripPng(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString('latin1', i + 4, i + 8);
    const end = i + 12 + len;
    if (end > buf.length) throw new UnsafeImageError('PNG: chunk runs past the end');
    if (!PNG_DROP.has(type)) out.push(buf.subarray(i, end));
    i = end;
    if (type === 'IEND') return Buffer.concat(out);
  }
  throw new UnsafeImageError('PNG: no IEND');
}
