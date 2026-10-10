# Sub Portal Skill
**Locked decisions: P-04, T-44, T-45, T-46, T-47**

## What is the Sub Portal?

The Sub Portal gives subcontractors a free, limited environment to collaborate
with GC tenants that invite them. It is the primary acquisition engine — GCs
invite subs for free, subs convert to paying tenants over time (P-04).

## Two sub user types

1. **Portal User (non-tenant sub):** A subcontractor with no paid subscription.
   They exist as a `users` row in the GC's tenant with `role = 'sub_portal'`.
   They see only what the GC shares with them through their scoped tenant access.
   They are NOT using the cross-tenant bridge — they are in the GC's tenant.

2. **Sub Tenant (converted sub):** A subcontractor with their own paid tenant.
   They have full isolation. Connected to GC via `tenant_connections` table.
   They access shared data through `shared_project_events` only (T-44, T-45).

## Sub Portal invitation flow

```
GC Owner/PM → POST /v1/sub-portal/invite
  body: { email, first_name, last_name, project_id }

1. Create user row in GC tenant:
   { tenant_id: gc_tenant_id, role: 'sub_portal', status: 'invited' }
2. Send invitation email via SendGrid (A-15)
3. Sub clicks link → sets password → status: 'active'
4. Sub can now view shared project data (documents, RFIs, submittals)
   scoped within the GC's tenant — NOT via cross-tenant bridge
```

## What portal users can access (scoped to GC's tenant)

Per P-04 and the Roles & Permissions doc:
- View assigned documents (no create/edit)
- View RFIs directed to them (can respond)
- View submittals assigned to them (can approve/reject)
- View schedule data (read-only)
- Cannot access: financials, budget, team management, settings, other projects

## JWT for portal users

Portal users receive a standard tenant JWT scoped to the GC's tenant:

```typescript
interface PortalUserJWT {
  user_id: string;
  tenant_id: string;   // GC's tenant_id — NOT a special value
  role: 'sub_portal';
  exp: number;
}
```

All their DB queries run through `withTenantContext(gc_tenant_id, ...)`.
RLS ensures they cannot access any other tenant's data, even if they know
other tenant IDs. Role-based permission guards restrict which GC data they see.

## Important: portal users are NOT cross-tenant

Portal users live entirely within the GC's tenant. They use the same RLS,
same `withTenantContext()`, same auth middleware as any other GC tenant user.
Cross-tenant bridge (T-44, T-45) is only used after a portal user migrates
to their own tenant.

## Portal user migration to full sub tenant (T-46, T-47)

When a portal user wants their own paid account:

```
Step 1 — Initiation (super admin or triggered by sub's request)
POST /v1/admin/portal-migrations
  body: { user_id, source_tenant_id, target_tenant_id_or_new }

Step 2 — Approval (second super admin reviews — T-47)
POST /v1/admin/portal-migrations/:id/approve

Step 3 — Execution (system runs migration)
1. Copy user record to target tenant with new UUID (T-46)
   — NEVER re-stamp tenant_id on existing rows
2. Copy associated project-visible data with new UUIDs
3. Soft-delete original GC tenant record (deleted_at = NOW())
   — NEVER purge original records
4. Notify GC tenant admin and sub tenant admin by email
5. Log platform-scope audit events for all steps (T-32)
```

After migration, GC and sub connect via `tenant_connections` and share data
through the `shared_project_events` bridge (T-44, T-45).

## Sub Portal vs full cross-tenant — decision guide

| Scenario | Mechanism |
|----------|-----------|
| GC invites a sub with no account | Sub Portal — user row in GC tenant |
| Sub wants to collaborate on one GC's projects for free | Sub Portal |
| Sub wants their own tenant and multiple GC connections | Migrate to sub tenant |
| Sub tenant connecting to a GC tenant | Cross-tenant bridge (shared_project_events) |

## Tier note

Sub Portal is free for the sub (P-04). The GC's plan must support project
membership (user count limits include sub_portal users — assertCanAddUser applies).

## BUILT (Phase 5, PR #14) — invariants when touching this

- **Route file:** `api/src/routes/v1/sub-portal.ts`. Magic-link helpers in `password-reset.ts`
  (`generate/consumeSubPortalMagicLinkToken` store `userId:tenantId`, 7-day, single-use `sub_portal_magic:`).
- **Linkage = `project_members` row** (`role='sub_portal'`). Every portal endpoint re-derives the
  caller's allowed `project_ids` from `project_members` (`memberProjectIds`) and filters on it —
  NO portal query is unscoped. `GET /projects/:id` 403s a non-member (never reveals existence).
- **CONTAINMENT GATE (do not remove):** a global `onRequest` hook in `index.ts` decode-only inspects the
  bearer and rejects any `SUB_PORTAL` token on every `/v1/*` path except `/v1/sub-portal` (403). This is
  what stops a sub_portal token reaching general/financial routes (tenant RLS alone would not — the sub
  lives IN the GC tenant). Decode-only is safe: it's deny-only; the per-route `authenticate` still fully
  verifies. A new sub-portal path is covered automatically (same prefix).
- **Accept reads under the token's tenant:** the magic token carries `tenantId`, so accept does the
  user lookup + password-set inside `withTenantContext(tenantId)`. Do NOT do a raw cross-tenant
  `pgPool` SELECT of a users row — after any `withTenantContext` runs on a pooled connection the custom
  GUC `app.current_tenant_id` reverts to `''`, and users RLS `current_setting(...)::uuid` throws
  `invalid input syntax for type uuid: ""`. (`homeowner-auth.ts`'s raw-pool pattern is latently affected.)
- **Endpoints:** `POST /invite` (OWNER/PM, `assertCanAddUser`, idempotent re-invite adds membership),
  `POST /auth/accept` (public), `POST /auth/logout`, `GET /projects`, `GET /projects/:id`,
  `POST /rfis/:id/respond` (assignee_id must = caller).
- **Tests:** `api/src/test/sub-portal.test.ts` — includes the LEAK GUARD (other-project 403) +
  CONTAINMENT (general + financial route 403) assertions. Keep them on refactor.
- **Web:** GC invite `web/src/app/(dashboard)/projects/[id]/sub-portal/page.tsx` (i18n
  `connections.sub_portal.*` EN+ES) + project tile; public accept `(sub-portal-auth)/sub-portal/accept`
  + cookie proxy `api/sub-portal/accept/route.ts`; gated portal `(sub-portal)/sub-portal/**`
  (layout gates role case-insensitively). Sub-facing portal chrome is English (client-portal precedent).
