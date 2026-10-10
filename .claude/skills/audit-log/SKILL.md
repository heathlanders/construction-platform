# Audit Log Skill
**Locked decisions: T-31, T-32, T-33, T-34**

## 6 audit log categories (T-31)
1. **auth** — logins, logouts, token refresh, failed attempts
2. **data** — create, update, delete on all significant entities
3. **access** — file downloads, report exports, sensitive data views
4. **admin** — role changes, user provisioning/deprovisioning
5. **billing** — subscription changes, payment events, tier upgrades
6. **cross_tenant** — connection requests, approvals, data sharing events

## Tamper-evident hash chain (T-32)
Each audit log entry includes a hash of the previous entry.
Tampering with any entry invalidates the entire chain from that point forward.

```typescript
interface AuditLogEntry {
  id: UUID;
  tenant_id: UUID;
  category: AuditCategory;
  action: string;
  actor_id: UUID;
  actor_role: string;
  resource_type: string;
  resource_id: UUID;
  payload: JSONB;        // before/after for data changes
  ip_address: string;
  created_at: TIMESTAMPTZ;
  previous_hash: string; // hash of previous entry
  entry_hash: string;    // hash of this entry's content + previous_hash
}
```

## Access rules (T-33)
- Tenant admins (Owner role): READ-ONLY access to their own tenant's log
- Super admin: READ-ONLY access to all tenants
- NO role can delete or modify audit log entries
- RLS applies: tenants cannot see other tenants' logs

## Retention (T-34)
- 7-year retention (construction industry compliance requirement)
- After 90 days: move to cold storage (DigitalOcean Spaces / S3 Glacier)
- Hot storage: last 90 days
- Tenant data export includes audit log (CCPA compliance)

## Writing audit events

Call from the **service layer** only — never from API route handlers directly.
Actor details come from the validated JWT context, never from request body.

```typescript
import { createHash } from 'crypto';
import { PoolClient } from 'pg';

// Call this from service layer with the same PoolClient from withTenantContext
async function writeAuditEntry(
  client: PoolClient,
  entry: {
    tenant_id: string;
    category: 'auth' | 'data' | 'access' | 'admin' | 'billing' | 'cross_tenant';
    action: string;           // e.g. 'project.updated', 'user.role_changed'
    actor_id: string;         // UUID from JWT — never from request body
    actor_email: string;      // Denormalized — preserved if user is later deleted (T-34)
    actor_role: string;       // Role from JWT claim
    resource_type: string;    // e.g. 'project', 'user', 'invoice'
    resource_id: string;      // UUID of affected resource
    payload?: Record<string, unknown>;  // before/after for data changes
    ip_address?: string;      // from request — NOT exposed to tenant admins (T-33)
  }
): Promise<void> {
  // Fetch hash of most recent entry for this tenant to build chain (T-32)
  const { rows } = await client.query<{ entry_hash: string }>(
    `SELECT entry_hash FROM audit_log
     WHERE tenant_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [entry.tenant_id]
  );
  const previousHash = rows[0]?.entry_hash ?? 'genesis';

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Build hash: SHA-256 of (id + tenant_id + action + actor_id + created_at + previous_hash)
  const entryHash = createHash('sha256')
    .update(`${id}|${entry.tenant_id}|${entry.action}|${entry.actor_id}|${createdAt}|${previousHash}`)
    .digest('hex');

  await client.query(
    `INSERT INTO audit_log
       (id, tenant_id, category, action, actor_id, actor_email, actor_role,
        resource_type, resource_id, payload, ip_address, created_at, previous_hash, entry_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id, entry.tenant_id, entry.category, entry.action,
      entry.actor_id, entry.actor_email, entry.actor_role,
      entry.resource_type, entry.resource_id,
      JSON.stringify(entry.payload ?? {}),
      entry.ip_address ?? null,
      createdAt, previousHash, entryHash,
    ]
  );
}

// Usage example in service layer
await withTenantContext(tenantId, async (client) => {
  const before = await getProject(client, projectId);
  await updateProject(client, projectId, updates);
  await writeAuditEntry(client, {
    tenant_id: tenantId,
    category: 'data',
    action: 'project.updated',
    actor_id: ctx.userId,       // from JWT
    actor_email: ctx.userEmail, // from JWT
    actor_role: ctx.userRole,   // from JWT
    resource_type: 'project',
    resource_id: projectId,
    payload: { before, after: updates },
    ip_address: ctx.ip,
  });
});
```

## Hash chain integrity verification
A nightly job must verify the chain is unbroken for each tenant:
```typescript
// Pseudocode — run as background job, alert on any break
for each tenant:
  for each audit_log entry (ordered by created_at ASC):
    expectedHash = sha256(id|tenant_id|action|actor_id|created_at|previous_hash)
    if expectedHash !== stored entry_hash: ALERT — chain broken at entry.id
```
