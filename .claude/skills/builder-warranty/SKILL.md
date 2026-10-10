# Builder Warranty Skill
**Feature added: Session 30 (2026-04-17)**
**Domain 15 — Business+ tier gate**

## What this feature does

GCs issue warranties to homeowners/buyers at project completion. Covers workmanship,
systems, and structural defects with configurable duration per coverage type.
Homeowners get a self-serve portal to submit and track claims. Sub-contractor liability
is routed automatically with cost tracking. HOW and 2-10 HBW insurance policies tracked.

## Tier gate
ALL warranty endpoints: `assertTier(tenant_id, 'BUSINESS')` → 402 for Starter/Professional.
Exception: `/homeowner/*` routes — no tier gate (homeowners don't have subscriptions).

## Key invariants

1. **Coverage snapshot at issuance** — `warranty_coverage_items` rows are copied from template at warranty creation with computed `expiry_date`. Template changes never affect issued warranties.
2. **System templates** — `tenant_id = '00000000-0000-0000-0000-000000000000'`. RLS policy allows read by any tenant. Mutations return 403.
3. **Status history append-only** — insert `warranty_claim_status_history` row on every status transition. Never update.
4. **Sub-liability routing is async** — always enqueue `warranty.sub_notify` job; never notify inline.
5. **Circular FK** — `warranty_claims.insurance_claim_id` FK added via `ALTER TABLE` after both tables exist (migration constraint).

## Table quick reference (12 tables)

| Table | Purpose |
|-------|---------|
| `warranty_coverage_templates` | Reusable coverage templates |
| `warranty_coverage_template_items` | Template line items (duration_months per type) |
| `builder_warranties` | Master warranty record |
| `warranty_coverage_items` | Coverage snapshot (copied from template at issuance) |
| `warranty_homeowner_bindings` | Warranty ↔ homeowner_portal user link |
| `warranty_claims` | Claims (staff or homeowner submitted) |
| `warranty_claim_status_history` | Append-only status transition log |
| `warranty_claim_photos` | Photos attached to claims |
| `warranty_sub_liability_items` | Sub-contractor liability assignments |
| `warranty_insurance_policies` | HOW / 2-10 HBW / builder_risk policies |
| `warranty_insurance_claims` | Claims against insurance policies |
| `warranty_audit_events` | Append-only domain event log |

## API quick reference

```
# Coverage templates (Business+)
GET    /v1/warranty-coverage-templates           — list (system + tenant's own)
POST   /v1/warranty-coverage-templates           — create
PATCH  /v1/warranty-coverage-templates/:id       — update (tenant-owned only)
DELETE /v1/warranty-coverage-templates/:id       — delete (tenant-owned only)
POST/PATCH/DELETE /v1/warranty-coverage-templates/:id/items

# Warranties (Business+)
GET    /v1/builder-warranties                    — list (?status=&project_id=)
GET    /v1/builder-warranties/dashboard          — status counts, expiring coverage, open claims
POST   /v1/builder-warranties                    — create + copy template snapshot + optionally create homeowner user
GET    /v1/builder-warranties/:id                — detail (with coverage_items + recent_claims)
PATCH  /v1/builder-warranties/:id                — update (optimistic locking)
DELETE /v1/builder-warranties/:id                — soft delete
POST   /v1/builder-warranties/:id/send-magic-link

# Claims (Business+)
GET    /v1/warranty-claims                       — platform list (?status=&priority=&warranty_id=)
GET    /v1/builder-warranties/:id/claims         — per-warranty list
POST   /v1/builder-warranties/:id/claims         — create claim
GET    /v1/builder-warranties/:id/claims/:cid    — detail (history + photos + sub items)
PATCH  /v1/builder-warranties/:id/claims/:cid    — update (status transition → history row)
POST   /v1/builder-warranties/:id/claims/:cid/sub-liability

# Insurance (Business+)
GET/POST   /v1/warranty-insurance-policies
PATCH/DELETE /v1/warranty-insurance-policies/:pid
GET/POST   /v1/warranty-insurance-policies/:pid/claims
PATCH      /v1/warranty-insurance-policies/:pid/claims/:cid

# Homeowner portal (no tier gate)
POST   /homeowner/auth/exchange                  — magic link token → JWT
POST   /homeowner/auth/logout
GET    /homeowner/warranties
GET    /homeowner/warranties/:id
GET/POST /homeowner/warranties/:id/claims
GET    /homeowner/warranties/:id/claims/:cid
```

## Homeowner magic link flow

```
staff: POST /builder-warranties/:id/send-magic-link
  → enqueues warranty.homeowner_magic_link job
  → worker: generateHomeownerMagicLinkToken(userId) stores Redis key warranty_magic:{token} = userId (7-day TTL)
  → worker: SendGrid email with {APP_URL}/homeowner/login?token={token}
homeowner: POST /homeowner/auth/exchange { token }
  → consumeHomeownerMagicLinkToken(token) — single use (Redis GET + DEL)
  → lookup user by ID in pgPool (not withTenantContext — homeowner has no tenant JWT yet)
  → issue JWT with HOMEOWNER_PORTAL role + tenant_id
  → homeowner uses JWT for all subsequent portal requests
```

## Coverage snapshot pattern

```typescript
// At warranty creation — copy template items as snapshot
if (d.template_id) {
  const items = await client.query(
    `SELECT * FROM warranty_coverage_template_items
     WHERE template_id = $1 AND deleted_at IS NULL ORDER BY sort_order`,
    [d.template_id]
  );
  for (const item of items.rows) {
    const expiryDate = new Date(d.effective_date);
    expiryDate.setMonth(expiryDate.getMonth() + item.duration_months);
    await client.query(
      `INSERT INTO warranty_coverage_items
         (tenant_id, warranty_id, coverage_type, title, description, duration_months, expiry_date, sort_order)
       VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7)`,
      [warranty.id, item.coverage_type, item.title, item.description,
       item.duration_months, expiryDate.toISOString().split('T')[0], item.sort_order]
    );
  }
}
```

## Status transition pattern

```typescript
// On claim PATCH — when status changes
if (fields.status && fields.status !== oldStatus) {
  await client.query(
    `INSERT INTO warranty_claim_status_history
       (tenant_id, claim_id, from_status, to_status, changed_by_user_id, notes)
     VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5)`,
    [claimId, oldStatus, fields.status, user_id, status_notes ?? null]
  );
  // Also insert warranty_audit_events row
}
// Auto-set completed_at when transitioning to repair_complete
if (fields.status === 'repair_complete' && oldStatus !== 'repair_complete') {
  fields.completed_at = new Date().toISOString();
}
```

## Background jobs

| Job type | Trigger | Action |
|----------|---------|--------|
| `warranty.daily_expiry_check` | Daily cron 07:00 | Scan coverage_items + insurance_policies; notify at 60/30/7 day thresholds |
| `warranty.sub_notify` | Sub-liability assigned | Update notified_at; notify Owner/PM |
| `warranty.homeowner_magic_link` | send-magic-link endpoint | Generate Redis token + send SendGrid email |

Dispatcher: `dispatchWarrantyJob()` in `warranty-worker.ts`.
Registration: `stripe-worker.ts` (cases before default).

## File locations

```
prisma/migrations/0012_builder_warranty/  — DB schema (12 tables + 1-2-10 system template seed)
api/src/routes/v1/warranty-coverage-templates.ts
api/src/routes/v1/builder-warranties.ts
api/src/routes/v1/warranty-claims.ts
api/src/routes/v1/warranty-insurance.ts
api/src/routes/v1/homeowner-auth.ts
api/src/routes/v1/homeowner-warranty.ts
api/src/workers/warranty-worker.ts
api/src/lib/password-reset.ts             — generateHomeownerMagicLinkToken, consumeHomeownerMagicLinkToken, sendHomeownerMagicLinkEmail
api/src/middleware/auth.ts                — UserRole union includes 'HOMEOWNER_PORTAL'
mobile/src/screens/warranties/            — 4 mobile screens
```
