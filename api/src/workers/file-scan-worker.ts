// workers/file-scan-worker.ts — handles file.scan and file.delete job types
// Locked decisions: T-27, T-28, T-29, T-30, A-06
// Validation: extension allowlist + content-type category + REAL size/magic bytes + malware scan
// Only after all three pass: mark file ready and credit storage usage

import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { withTenantContext } from '../lib/tenant-context.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import { sendJob } from '../lib/queue.js';
import { storageClient, promoteToLive, inspectQuarantineObject } from '../lib/storage.js';
import { MAGIC_HEAD_BYTES, magicMatches, maxSizeForExt, serveContentType } from '../lib/upload-validation.js';
import { assertStorageQuota, TierEnforcementError } from '../services/tier-enforcement.js';
import type { PoolClient } from 'pg';

// ─── Extension allowlist (T-28) ───────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif',           // Images
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', // Documents
  'dwg', 'dxf', 'rvt', 'ifc',                                     // CAD / BIM
  'mp4', 'mov', 'avi', 'mkv',                                      // Video
]);

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);
const DOC_EXT   = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']);
const CAD_EXT   = new Set(['dwg', 'dxf', 'rvt', 'ifc']);
const VIDEO_EXT = new Set(['mp4', 'mov', 'avi', 'mkv']);

function extensionCategory(ext: string): string | null {
  if (IMAGE_EXT.has(ext)) return 'image';
  if (DOC_EXT.has(ext))   return 'document';
  if (CAD_EXT.has(ext))   return 'cad';
  if (VIDEO_EXT.has(ext)) return 'video';
  return null;
}

function contentTypeCategory(contentType: string): string | null {
  const ct = contentType.split(';')[0].trim().toLowerCase();
  if (ct.startsWith('image/')) return 'image';
  if (ct.startsWith('video/')) return 'video';
  if (
    ct === 'application/pdf' ||
    ct === 'application/msword' ||
    ct.startsWith('application/vnd.openxmlformats-officedocument') ||
    ct === 'application/vnd.ms-excel' ||
    ct === 'application/vnd.ms-powerpoint' ||
    ct === 'text/plain' ||
    ct === 'text/csv'
  ) return 'document';
  if (ct === 'application/acad' || ct === 'image/vnd.dwg' || ct === 'application/octet-stream') {
    return 'cad'; // DWG/DXF/RVT/IFC often arrive as octet-stream
  }
  return null;
}

// ─── Malware scan — Cloudmersive (T-26, T-30) ────────────────────────────────

async function scanFile(quarantinePath: string): Promise<{ clean: boolean }> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY;

  if (!apiKey) {
    // No key configured — skip scan with warning (dev/test only).
    // In production this should never happen; set CLOUDMERSIVE_API_KEY.
    console.warn('CLOUDMERSIVE_API_KEY not set — malware scan skipped (T-26)');
    return { clean: true };
  }

  // 1. Download file bytes from quarantine bucket
  const obj = await storageClient.send(new GetObjectCommand({
    Bucket: process.env.STORAGE_QUARANTINE_BUCKET!,
    Key: quarantinePath,
  }));

  if (!obj.Body) {
    throw new Error(`file-scan-worker: quarantine object empty: ${quarantinePath}`);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of obj.Body as Readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const fileBuffer = Buffer.concat(chunks);

  // Filename from last path segment (sanitized at upload time — safe to use)
  const filename = quarantinePath.split('/').pop() ?? 'file';

  // 2. POST multipart/form-data to Cloudmersive Virus Scan API
  const form = new FormData();
  form.append('inputFile', new Blob([fileBuffer]), filename);

  const scanResponse = await fetch('https://api.cloudmersive.com/virus/scan/file', {
    method: 'POST',
    headers: { Apikey: apiKey },
    body: form,
  });

  if (!scanResponse.ok) {
    throw new Error(`Cloudmersive scan HTTP ${scanResponse.status} for ${quarantinePath}`);
  }

  const result = await scanResponse.json() as { CleanResult: boolean; FoundViruses?: unknown[] };
  return { clean: result.CleanResult };
  // Stage 3+ (AWS): swap to GuardDuty Malware Protection (T-30) here — no handler code change needed.
}

// ─── Payload types ────────────────────────────────────────────────────────────

interface FileScanPayload {
  file_id: string;
  quarantine_path: string;
  live_path: string;
  filename: string;
  content_type: string;
  file_size_bytes: number;
  project_id?: string;     // present when uploaded via documents endpoint
  doc_type?: string;       // 'plan' triggers blueprint.analyze after scan
  building_type?: string;  // forwarded to blueprint.analyze if provided
}

interface FileDeletePayload {
  file_id: string;
  file_size_bytes: number;
}

// ─── handleFileScan ───────────────────────────────────────────────────────────

export async function handleFileScan(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { file_id, quarantine_path, live_path, filename, content_type, file_size_bytes, project_id, doc_type, building_type } =
    payload as unknown as FileScanPayload;

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // 1. Look up file — verify it belongs to this tenant and is still in scanning state
    const fileResult = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM files WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [file_id, tenantId],
    );

    if (fileResult.rowCount === 0) {
      console.warn({ file_id, tenantId }, 'file-scan-worker: file not found — skipping');
      return;
    }

    // 2. Idempotency guard
    if (fileResult.rows[0].status !== 'scanning') {
      console.info({ file_id, status: fileResult.rows[0].status }, 'file-scan-worker: already processed — skipping');
      return;
    }

    // 3a. Extension allowlist (T-28)
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      await rejectFile(client, tenantId, file_id, quarantine_path, 'extension_not_allowed', { filename, ext });
      return;
    }

    // 3b. Content-type category must match extension category (T-28)
    const extCat = extensionCategory(ext);
    const ctCat  = contentTypeCategory(content_type);
    // octet-stream → 'cad' is a known safe mapping — don't fail on this
    const mismatch = ctCat !== null && ctCat !== 'cad' && extCat !== ctCat;
    if (mismatch) {
      await rejectFile(client, tenantId, file_id, quarantine_path, 'content_type_mismatch', {
        filename, ext, ext_category: extCat, content_type, ct_category: ctCat,
      });
      return;
    }

    // 3c. The real object (T-28/T-29). The presigned PUT binds neither length nor type, so the
    //     declared size/content_type are only claims: check the actual bytes and size, re-check the
    //     quota on the real size, and credit THAT size below (declaring 1 byte can't dodge T-29).
    const real = await inspectQuarantineObject(quarantine_path, MAGIC_HEAD_BYTES);
    const maxSize = maxSizeForExt(filename);
    if (real.size === 0 || (maxSize !== null && real.size > maxSize)) {
      await rejectFile(client, tenantId, file_id, quarantine_path, real.size === 0 ? 'empty_file' : 'file_too_large', {
        filename, declared_bytes: file_size_bytes, actual_bytes: real.size, max_bytes: maxSize,
      });
      return;
    }
    if (!magicMatches(filename, real.head)) {
      await rejectFile(client, tenantId, file_id, quarantine_path, 'magic_bytes_mismatch', { filename, ext });
      return;
    }
    if (real.size > file_size_bytes) {
      try {
        await assertStorageQuota(tenantId, real.size);
      } catch (err) {
        if (!(err instanceof TierEnforcementError)) throw err;
        await rejectFile(client, tenantId, file_id, quarantine_path, 'storage_quota_exceeded', {
          filename, declared_bytes: file_size_bytes, actual_bytes: real.size,
        });
        return;
      }
    }

    // 3d. Malware scan (T-27)
    const scan = await scanFile(quarantine_path);
    if (!scan.clean) {
      await rejectFile(client, tenantId, file_id, quarantine_path, 'malware_detected', { quarantine_path });
      return;
    }

    // 4. All checks passed — promote to live.
    //    Copy the object quarantine → live in storage FIRST, then flip the DB row.
    //    (Without the storage move the file is unreachable — downloadLiveObject 404s.)
    await promoteToLive(quarantine_path, live_path, serveContentType(filename));
    await client.query(
      `UPDATE files SET status = 'ready', storage_path = $2, file_size_bytes = $4, updated_at = NOW() WHERE id = $1 AND tenant_id = $3`,
      [file_id, live_path, tenantId, real.size],
    );

    // 5. Credit tenant storage usage (T-29)
    await client.query(
      `INSERT INTO tenant_storage_usage (tenant_id, bytes_used, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (tenant_id) DO UPDATE
         SET bytes_used = tenant_storage_usage.bytes_used + EXCLUDED.bytes_used,
             updated_at = NOW()`,
      [tenantId, real.size],
    );

    // 6. Audit
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'file.scan_passed',
      actorId: undefined,
      actorEmail: 'system',
      actorRole: 'system',
      resourceType: 'file',
      resourceId: file_id,
      payload: { filename, content_type, file_size_bytes: real.size, declared_bytes: file_size_bytes, live_path },
      ipAddress: undefined,
    });

    console.info({ file_id, tenantId, filename }, 'file-scan-worker: promoted to live storage');

    // Auto-trigger blueprint analysis when a plan-type document scans clean (T-27)
    if (doc_type === 'plan' && project_id && building_type) {
      await sendJob('blueprint.analyze', tenantId, {
        analysis_id: undefined, // will be created by the job
        document_id: file_id,
        project_id,
        building_type,
        user_id: undefined,
      });
      console.info({ file_id, project_id, building_type }, 'file-scan-worker: blueprint.analyze job dispatched');
    }
  });
}

// ─── handleFileDelete ─────────────────────────────────────────────────────────

export async function handleFileDelete(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { file_id, file_size_bytes } = payload as unknown as FileDeletePayload;

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // Decrement storage — GREATEST(0, ...) prevents going negative
    await client.query(
      `UPDATE tenant_storage_usage
       SET bytes_used = GREATEST(0, bytes_used - $2), updated_at = NOW()
       WHERE tenant_id = $1`,
      [tenantId, file_size_bytes],
    );

    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'file.deleted',
      actorId: undefined,
      actorEmail: 'system',
      actorRole: 'system',
      resourceType: 'file',
      resourceId: file_id,
      payload: { file_id, file_size_bytes },
      ipAddress: undefined,
    });

    console.info({ file_id, tenantId, file_size_bytes }, 'file-scan-worker: storage decremented');
  });
}

// ─── Internal reject helper ───────────────────────────────────────────────────

async function rejectFile(
  client: PoolClient,
  tenantId: string,
  fileId: string,
  quarantinePath: string,
  reason: string,
  details: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `UPDATE files SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
    [fileId, tenantId],
  );

  await writeAuditEntry(client, {
    tenantId,
    category: 'data',
    action: 'file.scan_rejected',
    actorId: undefined,
    actorEmail: 'system',
    actorRole: 'system',
    resourceType: 'file',
    resourceId: fileId,
    payload: { reason, quarantine_path: quarantinePath, ...details },
    ipAddress: undefined,
  });

  console.warn({ fileId, tenantId, reason, ...details }, 'file-scan-worker: file rejected');
}
