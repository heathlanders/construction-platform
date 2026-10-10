// storage.ts — S3/Spaces client + presigned URL generation
// Locked decisions: A-06, A-12, T-05, T-25, T-27, T-29
// Uses S3-compatible API — works with DigitalOcean Spaces at Stage 1–2
// and AWS S3 at Stage 3+ (swap STORAGE_ENDPOINT env var only — A-12)

import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

export const storageClient = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
  // Required for DigitalOcean Spaces path-style URLs
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
});

// Presigned URLs are opened by the BROWSER, so they must be signed for a host the browser can reach.
// In the Docker stack the API talks to MinIO at the internal `minio:9000`, which no browser resolves —
// set STORAGE_PUBLIC_ENDPOINT (e.g. http://localhost:19000, or a tunnel hostname) to sign URLs for it.
// Unset (Spaces/S3 in production) → the same client signs, exactly as before.
const presignClient = process.env.STORAGE_PUBLIC_ENDPOINT
  ? new S3Client({
      endpoint: process.env.STORAGE_PUBLIC_ENDPOINT,
      region: process.env.STORAGE_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
    })
  : storageClient;

const QUARANTINE_BUCKET = process.env.STORAGE_QUARANTINE_BUCKET!;
const LIVE_BUCKET = process.env.STORAGE_LIVE_BUCKET!;

// ─── Upload URL (quarantine only — T-27) ─────────────────────────────────────

/**
 * Generate a pre-signed PUT URL targeting the quarantine bucket.
 * All uploads land in quarantine — never directly to live storage (T-27).
 * 5-minute TTL. Returns the quarantine path for tracking.
 */
export async function generateUploadUrl(
  tenantId: string,
  originalFilename: string
): Promise<{ uploadUrl: string; quarantinePath: string }> {
  // Sanitize filename — reject traversal, allow alphanumeric + common punctuation
  const safeFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const quarantinePath = `${tenantId}/${randomUUID()}/${safeFilename}`;

  const uploadUrl = await getSignedUrl(
    presignClient,
    new PutObjectCommand({ Bucket: QUARANTINE_BUCKET, Key: quarantinePath }),
    { expiresIn: 300 } // 5 minutes
  );

  return { uploadUrl, quarantinePath };
}

/**
 * The REAL size + leading bytes of a quarantined object. The presigned PUT binds neither length nor
 * type, so the scan worker must never trust the size/content-type the client declared (T-28/T-29).
 */
export async function inspectQuarantineObject(quarantinePath: string, headBytes = 32): Promise<{ size: number; head: Buffer }> {
  const meta = await storageClient.send(new HeadObjectCommand({ Bucket: QUARANTINE_BUCKET, Key: quarantinePath }));
  const size = Number(meta.ContentLength ?? 0);
  if (size === 0) return { size, head: Buffer.alloc(0) };
  const out = await storageClient.send(new GetObjectCommand({
    Bucket: QUARANTINE_BUCKET, Key: quarantinePath, Range: `bytes=0-${headBytes - 1}`,
  }));
  const bytes = await out.Body!.transformToByteArray();
  return { size, head: Buffer.from(bytes) };
}

// ─── Download URL (live storage only — T-05) ─────────────────────────────────

/**
 * Generate a pre-signed GET URL for a file in live storage.
 * 15-minute TTL (T-05 — never expose direct storage bucket URLs).
 */
export async function generateDownloadUrl(storagePath: string, expiresIn = 900): Promise<string> {
  // Default 15 min (T-05, in-app downloads). Callers may pass a longer TTL for export-style,
  // customer-facing links (e.g. an emailed proposal at 7 days — T-35 data-export precedent).
  return getSignedUrl(
    presignClient,
    new GetObjectCommand({ Bucket: LIVE_BUCKET, Key: storagePath }),
    { expiresIn }
  );
}

// ─── Direct download to memory (worker use only) ─────────────────────────────

/**
 * Fetch object bytes from live storage as a Buffer.
 * Used by background workers (e.g. blueprint extraction) — never expose to clients.
 */
export async function downloadLiveObject(storagePath: string): Promise<Buffer> {
  const out = await storageClient.send(
    new GetObjectCommand({ Bucket: LIVE_BUCKET, Key: storagePath }),
  );
  // S3 SDK v3 streams the body — collect into a Buffer
  const chunks: Buffer[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = out.Body as any;
  if (!stream) throw new Error(`No body returned for storage path: ${storagePath}`);
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Move a scanned object from the quarantine bucket to the live bucket (T-27).
 * Server-side copy then delete the quarantine original. Called by the file-scan
 * worker once all validation passes — this is what actually makes the file
 * reachable via downloadLiveObject / pre-signed download URLs.
 */
export async function promoteToLive(quarantinePath: string, livePath: string, contentType?: string): Promise<void> {
  await storageClient.send(
    new CopyObjectCommand({
      Bucket: LIVE_BUCKET,
      Key: livePath,
      // CopySource is `bucket/key`; our keys are sanitized (alnum . _ - /), so safe unencoded.
      CopySource: `${QUARANTINE_BUCKET}/${quarantinePath}`,
      // The uploader chose the quarantine object's Content-Type on its PUT; presigned downloads serve
      // it back verbatim. Replace it with a server-chosen type so an upload can't be served as HTML.
      ...(contentType ? { MetadataDirective: 'REPLACE' as const, ContentType: contentType } : {}),
    }),
  );
  await storageClient.send(
    new DeleteObjectCommand({ Bucket: QUARANTINE_BUCKET, Key: quarantinePath }),
  );
}

/**
 * Write a SYSTEM-GENERATED object straight to live storage (no quarantine — the platform made it, e.g.
 * a proposal PDF or a Design Studio render). Never use for user uploads (T-27).
 */
export async function putLiveObject(storagePath: string, body: Buffer, contentType: string): Promise<void> {
  await storageClient.send(new PutObjectCommand({ Bucket: LIVE_BUCKET, Key: storagePath, Body: body, ContentType: contentType }));
}

// ─── Live storage path helpers (A-06) ────────────────────────────────────────

/**
 * True when `path` is a key inside this tenant's live prefix (`{tenant_id}/live/...`).
 * Any route that stores or presigns a client-supplied path MUST check this — otherwise a
 * tenant can record another tenant's key and mint a download URL for it (T-03/T-05).
 */
export function isTenantLivePath(tenantId: string, path: string | null | undefined): boolean {
  if (!path) return false;
  if (!path.startsWith(`${tenantId}/live/`)) return false;
  // Reject traversal-looking or empty segments; our generated keys never contain them.
  return !path.split('/').some((seg) => seg === '' || seg === '.' || seg === '..');
}

/** Path for project-scoped files: /{tenant_id}/live/projects/{project_id}/{category}/{filename} */
export function liveProjectPath(
  tenantId: string,
  projectId: string,
  category: string,
  filename: string
): string {
  return `${tenantId}/live/projects/${projectId}/${category}/${filename}`;
}

/** Path for tenant-level company files: /{tenant_id}/live/company/{category}/{filename} */
export function liveCompanyPath(
  tenantId: string,
  category: string,
  filename: string
): string {
  return `${tenantId}/live/company/${category}/${filename}`;
}
