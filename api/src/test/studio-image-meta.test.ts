// studio-image-meta.test.ts — client photo metadata stripping (home GPS must never reach an AI provider).

import { describe, it, expect } from 'vitest';
import { stripImageMetadata, UnsafeImageError } from '../lib/studio/image-meta.js';

const seg = (marker: number, payload: Buffer) => {
  const len = Buffer.alloc(2); len.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, marker]), len, payload]);
};

describe('stripImageMetadata', () => {
  it('drops JPEG APP1 (EXIF/GPS), APPn and comments; keeps JFIF + image data', () => {
    const jfif = seg(0xe0, Buffer.from('JFIF\0keep'));
    const exif = seg(0xe1, Buffer.from('Exif\0\0GPS 43.07N 89.40W'));
    const xmp = seg(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/ secret'));
    const com = seg(0xfe, Buffer.from('camera serial 12345'));
    const dqt = seg(0xdb, Buffer.from('quant-table'));
    const sos = Buffer.concat([Buffer.from([0xff, 0xda, 0x00, 0x04, 0x01, 0x02]), Buffer.from('PIXELS'), Buffer.from([0xff, 0xd9])]);
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8]), jfif, exif, xmp, com, dqt, sos]);
    const out = stripImageMetadata(jpg).toString('latin1');
    expect(out).not.toContain('GPS');
    expect(out).not.toContain('adobe');
    expect(out).not.toContain('serial');
    expect(out).toContain('JFIF');
    expect(out).toContain('quant-table');
    expect(out).toContain('PIXELS');
  });

  it('drops PNG text/eXIf chunks; keeps image chunks', () => {
    const chunk = (type: string, data: string) => {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
      return Buffer.concat([len, Buffer.from(type, 'latin1'), Buffer.from(data, 'latin1'), Buffer.alloc(4)]);
    };
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', 'header'), chunk('eXIf', 'GPS'), chunk('tEXt', 'Comment secret'), chunk('IDAT', 'pixels'), chunk('IEND', ''),
    ]);
    const out = stripImageMetadata(png).toString('latin1');
    expect(out).not.toContain('GPS');
    expect(out).not.toContain('secret');
    expect(out).toContain('IHDR');
    expect(out).toContain('pixels');
    expect(out).toContain('IEND');
  });

  it('skips 0xFF fill bytes before a marker and still drops EXIF', () => {
    const exif = seg(0xe1, Buffer.from('Exif\0\0GPS 43.07N 89.40W'));
    const sos = Buffer.concat([Buffer.from([0xff, 0xda, 0x00, 0x04, 0x01, 0x02]), Buffer.from('PIXELS'), Buffer.from([0xff, 0xd9])]);
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xff]), exif, sos]);
    const out = stripImageMetadata(jpg).toString('latin1');
    expect(out).not.toContain('GPS');
    expect(out).toContain('PIXELS');
  });

  it('fails closed on malformed or unknown data (never returns the original bytes)', () => {
    expect(() => stripImageMetadata(Buffer.from('not an image'))).toThrow(UnsafeImageError);
    const truncated = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 0x00]);
    expect(() => stripImageMetadata(truncated)).toThrow(UnsafeImageError);
    const exifNoImage = Buffer.concat([Buffer.from([0xff, 0xd8]), seg(0xe1, Buffer.from('GPS'))]);
    expect(() => stripImageMetadata(exifNoImage)).toThrow(UnsafeImageError);
    const badPng = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from([0, 0, 0, 9, 0x65, 0x58])]);
    expect(() => stripImageMetadata(badPng)).toThrow(UnsafeImageError);
  });

  it('passes unknown formats only when asked (provider output)', () => {
    const webp = Buffer.from('RIFF....WEBPVP8 ');
    expect(stripImageMetadata(webp, { passUnknown: true })).toBe(webp);
  });
});
