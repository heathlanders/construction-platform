// workers/export-worker.ts — Async audit log export (T-35, T-37)
// Queried at full 7-year depth, zipped as CSV, delivered via pre-signed URL + email + notification.
// Locked decisions: T-35, T-36, T-37, T-05, A-06

import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageClient } from '../lib/storage.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { createNotification } from '../lib/notify.js';

const LIVE_BUCKET = process.env.STORAGE_LIVE_BUCKET!;

// 7-day TTL for export download URL (T-35)
const EXPORT_URL_TTL_SECONDS = 7 * 24 * 60 * 60;

interface ExportPayload {
  tenant_id: string;
  requested_by: string; // user_id to notify on completion
}

/**
 * Build a CSV string from audit log rows.
 * ip_address is excluded — it is never exposed at application layer (T-33).
 */
function buildAuditLogCsv(rows: Record<string, unknown>[]): string {
  const headers = [
    'id', 'created_at', 'category', 'action',
    'actor_id', 'actor_email', 'actor_role',
    'resource_type', 'resource_id',
    'previous_hash', 'entry_hash',
  ];

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvRows = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(',')
  );

  return [headers.join(','), ...csvRows].join('\n');
}

export async function handleAuditLogExport(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { requested_by } = payload as unknown as ExportPayload;

  // Step 1: Query full 7-year audit log depth inside tenant context (T-37)
  let csvContent: string;
  let requestedByUserId = requested_by;

  await withTenantContext(tenantId, async (client) => {
    // Full depth — no LIMIT (T-37 requires complete 7-year history)
    // ip_address intentionally excluded (T-33)
    const { rows } = await client.query(
      `SELECT id, created_at, category, action,
              actor_id, actor_email, actor_role,
              resource_type, resource_id,
              previous_hash, entry_hash
       FROM audit_log
       WHERE tenant_id = $1
       ORDER BY created_at ASC, id ASC`,
      [tenantId],
    );

    csvContent = buildAuditLogCsv(rows);

    // Step 2: Upload CSV to live storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const storagePath = `${tenantId}/live/exports/audit-log-${timestamp}.csv`;

    await storageClient.send(
      new PutObjectCommand({
        Bucket: LIVE_BUCKET,
        Key: storagePath,
        Body: csvContent,
        ContentType: 'text/csv',
      }),
    );

    // Step 3: Generate 7-day pre-signed download URL (T-35)
    const downloadUrl = await getSignedUrl(
      storageClient,
      new GetObjectCommand({ Bucket: LIVE_BUCKET, Key: storagePath }),
      { expiresIn: EXPORT_URL_TTL_SECONDS },
    );

    // Step 4: Send email notification (via SendGrid if configured)
    if (process.env.SENDGRID_API_KEY) {
      await sendExportEmail(tenantId, requestedByUserId, downloadUrl, client);
    } else {
      console.info({ tenantId, downloadUrl }, 'export-worker: SendGrid not configured — export URL logged');
    }

    // Step 5: Create in-app notification for the requesting user
    await createNotification(client, tenantId, {
      userId: requestedByUserId,
      title: 'Audit Log Export Ready',
      body: 'Your audit log export is ready. The download link is valid for 7 days.',
      category: 'system',
      data: { download_url: downloadUrl, type: 'audit_log_export' },
    });
  });

  console.info({ tenantId, requestedBy: requestedByUserId }, 'audit_log.export: completed');
}

/**
 * Send export-ready email via SendGrid.
 * Placeholder — uses SendGrid's v3 Mail Send API.
 */
async function sendExportEmail(
  tenantId: string,
  userId: string,
  downloadUrl: string,
  client: import('pg').PoolClient,
): Promise<void> {
  // Look up user email
  const { rows } = await client.query<{ email: string; first_name: string }>(
    `SELECT email, first_name FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId],
  );
  if (rows.length === 0) return;
  const { email, first_name } = rows[0];

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'noreply@constructionplatform.com' },
      subject: 'Your Audit Log Export is Ready',
      content: [
        {
          type: 'text/plain',
          value: `Hi ${first_name},\n\nYour audit log export is ready. Download it here (link valid for 7 days):\n${downloadUrl}\n\nBest,\nThe Construction Platform Team`,
        },
      ],
    }),
  });

  if (!res.ok) {
    console.warn({ tenantId, userId, status: res.status }, 'export-worker: SendGrid email failed');
  }
}
