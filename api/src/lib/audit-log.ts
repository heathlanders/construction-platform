// audit-log.ts — hash-chained audit log writer
// See: .claude/skills/audit-log/SKILL.md
// Locked decisions: T-31, T-32, T-33, T-34

import { createHash, randomUUID } from 'crypto';
import { PoolClient } from 'pg';

export type AuditCategory =
  | 'auth'
  | 'data'
  | 'access'
  | 'admin'
  | 'billing'
  | 'cross_tenant';

export interface AuditEntryInput {
  tenantId: string;          // 'PLATFORM' for super admin events
  category: AuditCategory;
  action: string;            // e.g. 'project.updated', 'user.role_changed'
  actorId?: string;          // UUID from JWT — never from request body
  actorEmail?: string;       // Denormalized — preserved if user deleted (T-34)
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  payload?: Record<string, unknown>;  // before/after for data changes
  ipAddress?: string;        // NOT exposed to tenant admins (T-33)
}

/**
 * Write an append-only, hash-chained audit log entry.
 * Call from the service layer using the same PoolClient from withTenantContext.
 * Never call from route handlers directly.
 */
export async function writeAuditEntry(
  client: PoolClient,
  input: AuditEntryInput
): Promise<void> {
  // Fetch previous entry hash to build chain (T-32)
  const prev = await client.query<{ entry_hash: string }>(
    `SELECT entry_hash FROM audit_log
     WHERE tenant_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [input.tenantId]
  );
  const previousHash = prev.rows[0]?.entry_hash ?? 'genesis';

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  // SHA-256 of key fields + previous hash (T-32)
  const entryHash = createHash('sha256')
    .update(
      `${id}|${input.tenantId}|${input.action}|${input.actorId ?? ''}|${createdAt}|${previousHash}`
    )
    .digest('hex');

  await client.query(
    `INSERT INTO audit_log
       (id, tenant_id, category, action, actor_id, actor_email, actor_role,
        resource_type, resource_id, payload, ip_address, created_at, previous_hash, entry_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      input.tenantId,
      input.category,
      input.action,
      input.actorId ?? null,
      input.actorEmail ?? null,
      input.actorRole ?? null,
      input.resourceType ?? null,
      input.resourceId ?? null,
      input.payload ? JSON.stringify(input.payload) : null,
      input.ipAddress ?? null,
      createdAt,
      previousHash,
      entryHash,
    ]
  );
}

/**
 * Write a platform-scope audit entry for super admin operations.
 * Uses tenant_id = 'PLATFORM' — distinguishes from tenant-scoped events.
 * See: docs/SuperAdmin_Operations_v1_0.md §6
 */
export async function writePlatformAuditEntry(
  client: PoolClient,
  input: Omit<AuditEntryInput, 'tenantId'>
): Promise<void> {
  return writeAuditEntry(client, { ...input, tenantId: 'PLATFORM' });
}
