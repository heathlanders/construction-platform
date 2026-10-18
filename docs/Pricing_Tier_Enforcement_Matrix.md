# Pricing Tier Enforcement Matrix
**Locked decisions: PR-01 through PR-08, P-03**

> ⛔ **Superseded by PR-09 / PR-10 (ADR-0001, accepted 2026-10-18).** Business software becomes free; revenue comes from payments and from success fees on platform-sourced work, never per lead.
> **This doc still describes what the code enforces today.** The `assertTier`, `assertCanAddUser`, `assertCanCreateProject` and `assertHasAddon` calls are unchanged until the pricing migration ships.
>
> **Target state:**
> - Seat, project and trade-module limits are removed.
> - Storage quotas stay as **fair-use** caps, with the numbers to be re-set (ADR-0001 open question).
> - AI usage caps stay (`ai_usage_events`).
> - `assertHasAddon('cross_tenant')` is removed from GC discovery search (PR-10).
> - T-55 (permit milestones) and T-56 (assets Business+) are under review.
>
> Update this doc in the same PR as that code change.

> This document defines WHERE and HOW tier limits are enforced in code.
> All enforcement happens server-side — never trust client-side tier checks.

---

## 1. Tier limits reference

| Limit | Starter ($149/mo) | Professional ($349/mo) | Business ($749/mo) | Enterprise ($1,499+/mo) |
|-------|------------------|-----------------------|--------------------|------------------------|
| Users | 5 | 20 | 50 | Unlimited |
| Projects | 5 | 20 | Unlimited | Unlimited |
| Trade modules | 1 | 2 | 5 | All |
| Storage | 10 GB | 50 GB | 250 GB | Unlimited |
| GC module | Add-on ($99/mo) | Add-on ($99/mo) | Included | Included |
| Cross-tenant collab | No | Add-on ($149/mo) | Included | Included |
| API access | No | No | No | Yes |

---

## 2. Enforcement location

Tier enforcement happens in the **service layer** — not in API route handlers, not in the DB.

```
API Route Handler → Service Layer (tier check here) → DB Query (withTenantContext)
```

Never enforce tier limits in:
- Frontend/mobile (can be bypassed)
- Database triggers (hard to maintain, hard to test)
- Middleware (too early — no business context)

---

## 3. Tenant subscription model

```typescript
interface TenantSubscription {
  tenant_id: string;
  tier: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'GRACE_PERIOD';
  addons: {
    gc_module: boolean;
    cross_tenant: boolean;
  };
  // Cached from Stripe — updated via webhook
  current_period_end: Date;
}
```

Cache the subscription in Redis (TTL: 5 minutes) to avoid DB lookup on every request.
Source of truth: Stripe. Redis is a read cache only.

---

## 4. Tier enforcement service

```typescript
// services/tier-enforcement.ts

export class TierEnforcementError extends Error {
  constructor(
    public code: string,
    message: string,
    public upgradeToTier?: string
  ) {
    super(message);
  }
}

export async function assertCanAddUser(tenantId: string): Promise<void> {
  const [sub, userCount] = await Promise.all([
    getSubscription(tenantId),
    getUserCount(tenantId),
  ]);
  const limit = USER_LIMITS[sub.tier];
  if (limit !== null && userCount >= limit) {
    throw new TierEnforcementError(
      'USER_LIMIT_REACHED',
      `Your ${sub.tier} plan includes ${limit} users. Upgrade to add more.`,
      nextTier(sub.tier)
    );
  }
}

export async function assertCanCreateProject(tenantId: string): Promise<void> {
  const [sub, count] = await Promise.all([
    getSubscription(tenantId),
    getProjectCount(tenantId),
  ]);
  const limit = PROJECT_LIMITS[sub.tier];
  if (limit !== null && count >= limit) {
    throw new TierEnforcementError('PROJECT_LIMIT_REACHED', `...`, nextTier(sub.tier));
  }
}

export async function assertHasAddon(tenantId: string, addon: 'gc_module' | 'cross_tenant'): Promise<void> {
  const sub = await getSubscription(tenantId);
  if (!sub.addons[addon]) {
    throw new TierEnforcementError(
      'ADDON_REQUIRED',
      `This feature requires the ${addon} add-on.`
    );
  }
}

export async function assertStorageQuota(tenantId: string, fileSizeBytes: number): Promise<void> {
  const [sub, usage] = await Promise.all([
    getSubscription(tenantId),
    getStorageUsageBytes(tenantId),
  ]);
  const limitBytes = STORAGE_LIMITS_BYTES[sub.tier];
  if (limitBytes !== null && usage + fileSizeBytes > limitBytes) {
    throw new TierEnforcementError('STORAGE_QUOTA_EXCEEDED', `...`);
  }
}

// Tier limits
const USER_LIMITS: Record<string, number | null> = {
  STARTER: 5, PROFESSIONAL: 20, BUSINESS: 50, ENTERPRISE: null,
};
const PROJECT_LIMITS: Record<string, number | null> = {
  STARTER: 5, PROFESSIONAL: 20, BUSINESS: null, ENTERPRISE: null,
};
const STORAGE_LIMITS_BYTES: Record<string, number | null> = {
  STARTER:       10  * 1024 ** 3,
  PROFESSIONAL:  50  * 1024 ** 3,
  BUSINESS:      250 * 1024 ** 3,
  ENTERPRISE:    null,
};
```

---

## 5. Endpoints that enforce tier limits

| Endpoint | Tier check |
|----------|-----------|
| `POST /v1/users` | `assertCanAddUser` |
| `POST /v1/projects` | `assertCanCreateProject` |
| `POST /v1/files/upload` | `assertStorageQuota(fileSize)` |
| `POST /v1/projects/:id/members` | `assertCanAddUser` (project members count toward tenant limit) |
| `POST /v1/connections` (cross-tenant) | `assertHasAddon('cross_tenant')` |
| `GET /v1/gc/*` (GC module endpoints) | `assertHasAddon('gc_module')` |
| `GET /v1/api/*` (external API access) | `assertTier('ENTERPRISE')` |
| `POST /v1/permits/:id/generate-milestones` | `assertTier('PROFESSIONAL')` — 402 for Starter (T-55) |
| `GET /v1/assets` (and all `/v1/assets*` routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (T-56) |
| `GET /v1/asset-groups` (and all `/v1/asset-groups*` routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (T-56) |
| `GET /v1/asset-insurance-policies` (and all insurance policy routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (T-56) |
| `GET /v1/asset-inspection-templates` (and all template routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (T-56) |
| `GET /v1/builder-warranties` (and all `/v1/builder-warranties*` routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (Domain 15) |
| `GET /v1/warranty-coverage-templates` (and all template routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (Domain 15) |
| `GET /v1/warranty-claims` (and all claim routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (Domain 15) |
| `GET /v1/warranty-insurance-policies` (and all insurance routes) | `assertTier('BUSINESS')` — 402 for Starter and Professional (Domain 15) |

**Soft gates (graceful degradation):**
`POST /v1/permits` auto-generates AHJ inspection milestones for Professional+, silently skips for Starter.
Returns `tier_note: "Upgrade to Professional to enable AHJ inspection milestone auto-generation."` in the response body instead of a 402 error. Starter tenants can still create and track permits manually.

---

## 6. Error response format

Tier enforcement errors must return `402 Payment Required` with upgrade hint:

```json
{
  "error": {
    "code": "USER_LIMIT_REACHED",
    "message": "Your Starter plan includes 5 users. Upgrade to Professional to add more.",
    "upgrade_to": "PROFESSIONAL"
  }
}
```

---

## 7. Mid-cycle tier changes

- **Upgrades:** Take effect immediately. New limits apply at next request.
- **Downgrades:** Take effect at end of billing period (Stripe handles this).
  - During grace period between downgrade request and period end, old limits apply.
  - At period end: if usage exceeds new tier limit, block creation of new resources.
    Existing resources are NOT deleted — users must archive/delete manually.
- **Cancellations:** Grace period defined in `TenantStatus.GRACE_PERIOD`.
  Grace period: 30 days. After grace: status → SUSPENDED, API returns 402.

---

## 8. Trial enforcement

During `TRIAL` status: Professional tier limits apply (P-05 — 14-day full Professional access).
Trial expiry: `tenants.trial_ends_at` timestamp, checked on every tier enforcement call.
Stripe charges card at trial end. If payment fails: `GRACE_PERIOD` → `SUSPENDED`.
