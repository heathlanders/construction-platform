// lib/upload-validation.ts — pre-upload triple validation (T-28) + size limits (T-29), shared by the
// general /v1/files/upload route and namespaced uploads (e.g. the Design Studio client photo upload,
// which must NOT open /v1/files/upload to portal roles — invariant 3). Pure, no I/O.

// ─── Allowlists (T-28) ────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  image:    ['jpg','jpeg','png','gif','webp','heic','heif'],
  document: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv'],
  plan:     ['dwg','dxf','rvt','ifc','pdf'],
  video:    ['mp4','mov','avi','mkv'],
};

// content_type → allowed category (must match extension category)
export const CONTENT_TYPE_CATEGORY: Record<string, string> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'image',
  'image/webp': 'image', 'image/heic': 'image', 'image/heif': 'image',
  'application/pdf': 'document', 'application/pdf;plan': 'plan',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'application/vnd.ms-powerpoint': 'document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
  'text/plain': 'document', 'text/csv': 'document',
  'application/octet-stream': 'plan', // DWG, DXF, RVT, IFC — generic binary
  'video/mp4': 'video', 'video/quicktime': 'video', 'video/x-msvideo': 'video',
  'video/x-matroska': 'video',
};

// Size limits by category in bytes (T-29)
export const SIZE_LIMITS: Record<string, number> = {
  image:    25  * 1024 * 1024,
  document: 50  * 1024 * 1024,
  plan:     250 * 1024 * 1024,
  video:    500 * 1024 * 1024,
};

export function getExtCategory(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  for (const [cat, exts] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (exts.includes(ext)) return cat;
  }
  return null;
}

export type UploadCheck =
  | { ok: true; category: string }
  | { ok: false; code: 'INVALID_FILE_TYPE' | 'INVALID_CONTENT_TYPE' | 'FILE_TYPE_MISMATCH' | 'FILE_TOO_LARGE'; message: string };

/**
 * Extension allowlist + content-type allowlist + the two must agree + per-category size limit.
 * `allowedCategories` narrows further (e.g. images only).
 */
export function checkUpload(filename: string, contentType: string, sizeBytes: number, allowedCategories?: readonly string[]): UploadCheck {
  const extCategory = getExtCategory(filename);
  if (!extCategory || (allowedCategories && !allowedCategories.includes(extCategory))) {
    return { ok: false, code: 'INVALID_FILE_TYPE', message: allowedCategories
      ? `File type not permitted. Allowed: ${allowedCategories.join(', ')}`
      : 'File type not permitted. Allowed: images (jpg/png/webp/heic), documents (pdf/doc/docx/xls/xlsx), plans (dwg/dxf/rvt/ifc), video (mp4/mov)' };
  }
  const ctBase = contentType.split(';')[0]!.trim().toLowerCase();
  const ctCategory = CONTENT_TYPE_CATEGORY[ctBase] ?? CONTENT_TYPE_CATEGORY[contentType.toLowerCase()];
  if (!ctCategory) return { ok: false, code: 'INVALID_CONTENT_TYPE', message: `Content-Type '${ctBase}' is not permitted` };
  // PDF can be document OR plan; octet-stream covers CAD files.
  const mismatch = extCategory !== ctCategory
    && !(ctBase === 'application/pdf' && (extCategory === 'document' || extCategory === 'plan'))
    && !(ctBase === 'application/octet-stream' && extCategory === 'plan');
  if (mismatch) return { ok: false, code: 'FILE_TYPE_MISMATCH', message: 'Extension and Content-Type do not match' };
  const sizeLimit = SIZE_LIMITS[extCategory]!;
  if (sizeBytes > sizeLimit) {
    return { ok: false, code: 'FILE_TOO_LARGE', message: `${extCategory} files must be under ${Math.round(sizeLimit / (1024 * 1024))} MB` };
  }
  return { ok: true, category: extCategory };
}

// ─── Post-upload content checks (scan worker — T-28 magic bytes, T-29 real size) ─────────────
// The presigned PUT binds neither length nor type, so the declared filename/content_type/size are
// only claims. The scan worker reads the real object and checks it against these before promoting.

/** Largest size any category allowing this extension permits (pdf is both document AND plan). */
export function maxSizeForExt(filename: string): number | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  let max: number | null = null;
  for (const [cat, exts] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (exts.includes(ext)) max = Math.max(max ?? 0, SIZE_LIMITS[cat] ?? 0);
  }
  return max;
}

const startsWith = (head: Buffer, sig: number[], at = 0) =>
  head.length >= at + sig.length && sig.every((b, i) => head[at + i] === b);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const FTYP = (h: Buffer) => startsWith(h, ascii('ftyp'), 4); // ISO-BMFF: heic/heif/mp4/mov

const MAGIC: Record<string, (h: Buffer) => boolean> = {
  jpg: (h) => startsWith(h, [0xff, 0xd8, 0xff]),
  jpeg: (h) => startsWith(h, [0xff, 0xd8, 0xff]),
  png: (h) => startsWith(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  gif: (h) => startsWith(h, ascii('GIF87a')) || startsWith(h, ascii('GIF89a')),
  webp: (h) => startsWith(h, ascii('RIFF')) && startsWith(h, ascii('WEBP'), 8),
  heic: FTYP, heif: FTYP, mp4: FTYP, mov: FTYP,
  avi: (h) => startsWith(h, ascii('RIFF')) && startsWith(h, ascii('AVI '), 8),
  mkv: (h) => startsWith(h, [0x1a, 0x45, 0xdf, 0xa3]),
  // PDF header may sit anywhere in the first 1024 bytes (ISO 32000 §7.5.2).
  pdf: (h) => h.subarray(0, 1024).includes(Buffer.from('%PDF-')),
  docx: (h) => startsWith(h, ZIP), xlsx: (h) => startsWith(h, ZIP), pptx: (h) => startsWith(h, ZIP),
  doc: (h) => startsWith(h, OLE), xls: (h) => startsWith(h, OLE), ppt: (h) => startsWith(h, OLE),
};

/** Bytes the scan worker must read to check every signature above. */
export const MAGIC_HEAD_BYTES = 1024;

/**
 * True when the file's leading bytes match its extension. Extensions without a reliable signature
 * (txt, csv, dwg, dxf, rvt, ifc) pass — the extension + content-type + malware checks still apply.
 */
export function magicMatches(filename: string, head: Buffer): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const check = MAGIC[ext];
  return check ? check(head) : true;
}

const SERVE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif', pdf: 'application/pdf',
  doc: 'application/msword', xls: 'application/vnd.ms-excel', ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8',
  mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
};

/** Content-Type to SERVE a promoted file with — from the validated extension, never the client's claim. */
export function serveContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return SERVE_TYPES[ext] ?? 'application/octet-stream';
}
