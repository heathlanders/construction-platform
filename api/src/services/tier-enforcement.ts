// tier-enforcement.ts — service-layer tier limit checks
// See: docs/Pricing_Tier_Enforcement_Matrix.md
// Locked decisions: PR-01 through PR-08, P-03
//
// Enforcement location: SERVICE LAYER only — never in routes, middleware, or DB triggers.
// API Route Handler → Service Layer (tier check here) → DB Query (withTenantContext)

import { redis } from '../lib/redis.js';
import { pgPool } from '../lib/db.js';
import { withTenantContext } from '../lib/tenant-context.js';

// ─── Error class ──────────────────────────────────────────────────────────────

export class TierEnforcementError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly upgradeToTier?: string
  ) {
    super(message);
    this.name = 'TierEnforcementError';
  }

  /** Returns the 402 response body format from Pricing_Tier_Enforcement_Matrix.md §6 */
  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.upgradeToTier ? { upgrade_to: this.upgradeToTier } : {}),
      },
    };
  }
}

// ─── Tier limits ──────────────────────────────────────────────────────────────

type Tier = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';

const USER_LIMITS: Record<Tier, number | null> = {
  STARTER: 5,
  PROFESSIONAL: 20,
  BUSINESS: 50,
  ENTERPRISE: null,
};

const PROJECT_LIMITS: Record<Tier, number | null> = {
  STARTER: 5,
  PROFESSIONAL: 20,
  BUSINESS: null,
  ENTERPRISE: null,
};

const STORAGE_LIMITS_BYTES: Record<Tier, number | null> = {
  STARTER: 10 * 1024 ** 3,         // 10 GB
  PROFESSIONAL: 50 * 1024 ** 3,    // 50 GB
  BUSINESS: 250 * 1024 ** 3,       // 250 GB
  ENTERPRISE: null,
};

const TIER_ORDER: Tier[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'];

function nextTier(tier: Tier): Tier | undefined {
  const idx = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[idx + 1];
}

// ─── Subscription cache ───────────────────────────────────────────────────────

interface CachedSubscription {
  tier: Tier;
  status: string;
  addons: { gc_module: boolean; cross_tenant: boolean };
  trial_ends_at?: string;
}

const CACHE_TTL_SECONDS = 300; // 5 minutes

async function getSubscription(tenantId: string): Promise<CachedSubscription> {
  const cacheKey = `sub:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as CachedSubscription;

  // Fetch from DB — use direct pool (not withTenantContext) because
  // tenant_subscriptions has no RLS and billing service validates tenant_id directly
  const client = await pgPool.connect();
  try {
    const result = await client.query<{
      tier: string;
      status: string;
      addon_gc_module: boolean | null;
      addon_cross_tenant: boolean | null;
    }>(
      `SELECT
         COALESCE(ts.tier, t.tier) AS tier,
         COALESCE(ts.status, 'trial') AS status,
         COALESCE(ts.addon_gc_module, false) AS addon_gc_module,
         COALESCE(ts.addon_cross_tenant, false) AS addon_cross_tenant
       FROM tenants t
       LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
       WHERE t.id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      // Unknown tenant — treat as starter trial
      const sub: CachedSubscription = {
        tier: 'STARTER',
        status: 'TRIAL',
        addons: { gc_module: false, cross_tenant: false },
      };
      await redis.set(cacheKey, JSON.stringify(sub), 'EX', CACHE_TTL_SECONDS);
      return sub;
    }

    const row = result.rows[0];
    const sub: CachedSubscription = {
      tier: row.tier.toUpperCase() as Tier,
      status: row.status.toUpperCase(),
      addons: {
        gc_module: row.addon_gc_module ?? false,
        cross_tenant: row.addon_cross_tenant ?? false,
      },
    };
    await redis.set(cacheKey, JSON.stringify(sub), 'EX', CACHE_TTL_SECONDS);
    return sub;
  } finally {
    client.release();
  }
}

/** Invalidate subscription cache — call after any subscription change */
export async function invalidateSubscriptionCache(tenantId: string): Promise<void> {
  await redis.del(`sub:${tenantId}`);
}

// ─── Count helpers ────────────────────────────────────────────────────────────

async function getUserCount(tenantId: string): Promise<number> {
  return withTenantContext(tenantId, async (client) => {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users
       WHERE deleted_at IS NULL AND status != 'deactivated'`
    );
    return parseInt(result.rows[0].count, 10);
  });
}

async function getProjectCount(tenantId: string): Promise<number> {
  return withTenantContext(tenantId, async (client) => {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL`
    );
    return parseInt(result.rows[0].count, 10);
  });
}

async function getStorageUsageBytes(tenantId: string): Promise<number> {
  const client = await pgPool.connect();
  try {
    const result = await client.query<{ bytes_used: string }>(
      `SELECT COALESCE(bytes_used, 0) as bytes_used
       FROM tenant_storage_usage WHERE tenant_id = $1`,
      [tenantId]
    );
    return result.rows.length > 0 ? parseInt(result.rows[0].bytes_used, 10) : 0;
  } finally {
    client.release();
  }
}

// ─── Enforcement functions ────────────────────────────────────────────────────

/** Check user limit before POST /v1/users */
export async function assertCanAddUser(tenantId: string): Promise<void> {
  const [sub, count] = await Promise.all([
    getSubscription(tenantId),
    getUserCount(tenantId),
  ]);
  const limit = USER_LIMITS[sub.tier];
  if (limit !== null && count >= limit) {
    throw new TierEnforcementError(
      'USER_LIMIT_REACHED',
      `Your ${sub.tier} plan includes ${limit} users. Upgrade to add more.`,
      nextTier(sub.tier)
    );
  }
}

/** Check project limit before POST /v1/projects */
export async function assertCanCreateProject(tenantId: string): Promise<void> {
  const [sub, count] = await Promise.all([
    getSubscription(tenantId),
    getProjectCount(tenantId),
  ]);
  const limit = PROJECT_LIMITS[sub.tier];
  if (limit !== null && count >= limit) {
    throw new TierEnforcementError(
      'PROJECT_LIMIT_REACHED',
      `Your ${sub.tier} plan includes ${limit} projects. Upgrade to create more.`,
      nextTier(sub.tier)
    );
  }
}

/** Check storage quota before POST /v1/files/upload */
export async function assertStorageQuota(
  tenantId: string,
  fileSizeBytes: number
): Promise<void> {
  const [sub, used] = await Promise.all([
    getSubscription(tenantId),
    getStorageUsageBytes(tenantId),
  ]);
  const limit = STORAGE_LIMITS_BYTES[sub.tier];
  if (limit !== null && used + fileSizeBytes > limit) {
    throw new TierEnforcementError(
      'STORAGE_QUOTA_EXCEEDED',
      `You've reached your storage limit. Upgrade your plan to add more storage.`,
      nextTier(sub.tier)
    );
  }
}

/** Check addon access — gc_module or cross_tenant */
export async function assertHasAddon(
  tenantId: string,
  addon: 'gc_module' | 'cross_tenant'
): Promise<void> {
  const sub = await getSubscription(tenantId);

  // Business+ plans include addons regardless of addon flag
  if (sub.tier === 'BUSINESS' || sub.tier === 'ENTERPRISE') return;

  if (!sub.addons[addon]) {
    const addonLabel = addon === 'gc_module' ? 'GC Module' : 'Cross-Tenant Collaboration';
    throw new TierEnforcementError(
      'ADDON_REQUIRED',
      `This feature requires the ${addonLabel} add-on.`
    );
  }
}

/** Check minimum tier — e.g. Enterprise for API access */
export async function assertTier(tenantId: string, minTier: Tier): Promise<void> {
  const sub = await getSubscription(tenantId);
  const current = TIER_ORDER.indexOf(sub.tier);
  const required = TIER_ORDER.indexOf(minTier);
  if (current < required) {
    throw new TierEnforcementError(
      'TIER_REQUIRED',
      `This feature requires the ${minTier} plan.`,
      minTier
    );
  }
}
