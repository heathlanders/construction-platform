# SuperAdmin Operations Guide v1.0
**Locked decisions: T-32, T-34, T-44, T-45, T-46, T-47, T-52**

> Super admins operate the platform. They cannot read raw tenant data.
> All super admin actions are logged as platform-scope audit events.

---

## 1. Super admin authentication

Super admins authenticate with a **platform-scope JWT** — distinct from tenant JWTs.

```typescript
interface SuperAdminJWTPayload {
  jti: string;
  admin_id: string;        // UUID — from platform_admins table
  role: 'SUPER_ADMIN';
  tenant_id: 'PLATFORM';  // Literal string — NOT a tenant UUID
  exp: number;
}
```

The `tenant_id: 'PLATFORM'` claim is never a real tenant UUID.
Any middleware that calls `withTenantContext(req.jwt.tenant_id, ...)` would attempt
to set `app.current_tenant_id = 'PLATFORM'`, which returns zero rows from all RLS-protected
tables — the correct safe behavior.

Super admins have **no path** to read tenant data via RLS-protected queries.

---

## 2. What super admins can do

| Operation | Mechanism | Audit category |
|-----------|-----------|----------------|
| Portal user migration | Copy records to new tenant with new UUIDs (T-46) | `admin` |
| DLQ inspection and replay | Read failed background jobs, re-enqueue | `admin` |
| Audit log read (all tenants) | Read-only via admin UI, no IP exposure to tenants (T-33) | `access` |
| Tenant suspension / reactivation | Update `tenants.status` | `admin` |
| Tenant data export trigger | Initiate async export on behalf of tenant | `admin` |
| Hash chain integrity verification | Run nightly verifier or on-demand | `admin` |

---

## 3. What super admins CANNOT do

- Read raw tenant business data (projects, invoices, documents) — RLS prevents this
- Bypass `withTenantContext()` at the application layer (T-52)
- Delete or modify audit log entries (T-32 — append-only)
- Expose IP addresses or user-agent strings in tenant-visible logs (T-33)
- Self-approve a portal user migration (T-47 — separate initiator + approver required)

---

## 4. Portal user migration procedure (T-46, T-47)

Moves a Sub Portal user from a GC's tenant to their own independent tenant.

**Step 1 — Initiation** (different super admin or triggered by sub's request)
```
POST /v1/admin/portal-migrations
Body: { user_id, source_tenant_id, target_tenant_id_or_new }
```

**Step 2 — Approval** (second super admin reviews)
```
POST /v1/admin/portal-migrations/:id/approve
```

**Step 3 — Execution** (system runs migration — `POST /v1/admin/portal-migrations/:id/approve`)
1. Copy the user record to the target tenant with a new UUID (T-46).
2. **Copy associated data** (BUILT — migration 0035): the projects the sub was a member of + those
   projects' documents are copied into the target tenant with new UUIDs, FK-remapped (document →
   copied project), giving the migrated sub a self-contained snapshot in their own tenant. Each copy
   is recorded in `portal_migration_records` (source_id → target_id) — the T-58 chain of custody and
   the idempotency key (unique on `migration_id, source_table, source_id`) that makes the copy
   **resumable** (a re-run skips already-copied rows). Runs BEFORE the source soft-delete so a copy
   failure leaves the source tenant fully intact (`status='failed'`, mapping preserved).
3. Soft-delete the original **user** (`deleted_at = NOW()` — never purge) and remove the sub's
   `project_members` footprint in the GC tenant. **The GC's own projects/documents are NEVER
   modified** — the copies belong to the sub's new tenant. (Post-migration, GC↔sub collaborate via
   the cross-tenant bridge, not the GC's in-tenant sub_portal seat.)
4. Notify both tenants' owners/PMs (in-app `notifications`, category `system`) — best-effort.
5. Log a platform-scope audit event for the approval + one `portal_migration.record_copied` per
   copied row.

> **Follow-up:** the document copy is metadata-only — the file bytes still live under the GC's
> storage prefix. Copying bytes into the target tenant's storage prefix is a documented follow-up.

**Prohibited:** Re-stamping `tenant_id` on existing rows. Always copy (new UUID) + soft-delete.

---

## 5. DLQ inspection

```
GET /v1/admin/jobs/failed          — list failed jobs
GET /v1/admin/jobs/failed/:job_id  — inspect single job
POST /v1/admin/jobs/failed/:job_id/replay  — re-enqueue
DELETE /v1/admin/jobs/failed/:job_id       — discard without replay
```

All replayed jobs go through standard `withTenantContext()` processing —
no special admin path bypasses tenant context.

---

## 6. Audit log for super admin actions

Super admin actions are logged in the audit log with `tenant_id = 'PLATFORM'`
(or a dedicated platform_audit_log table) to distinguish from tenant-scoped events.

```typescript
await writePlatformAuditEntry({
  category: 'admin',
  action: 'portal_migration.approved',
  actor_id: req.jwt.admin_id,
  resource_type: 'portal_migration',
  resource_id: migrationId,
  payload: { source_tenant_id, target_tenant_id, user_id },
});
```

Hash chain applies to platform audit log as well — tamper-evident, 7-year retention.

---

## 7. Super admin table

```sql
-- Not subject to tenant RLS — platform-scoped table
CREATE TABLE platform_admins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
-- NO RLS on this table — it's not tenant-scoped
-- Protected by application-layer auth only (requireSuperAdminJwt middleware)
```
