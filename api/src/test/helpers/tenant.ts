// test/helpers/tenant.ts — create test tenant, user, and JWT for integration tests
// Used in route/service integration tests to set up isolated test fixtures.

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testPool } from '../setup.js';

const TEST_JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-do-not-use-in-production';

export interface TestTenant {
  id: string;
  slug: string;
  name: string;
}

export interface TestUser {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  role: string;
}

export interface TestFixture {
  tenant: TestTenant;
  user: TestUser;
  token: string;
}

/**
 * Create an isolated test tenant + owner user + JWT.
 * Cleans up in the teardown (call cleanup() in afterEach/afterAll).
 */
export async function createTestFixture(
  overrides: { role?: string } = {}
): Promise<TestFixture & { cleanup: () => Promise<void> }> {
  const tenantId = randomUUID();
  const userId = randomUUID();
  const slug = `test-${tenantId.slice(0, 8)}`;
  const email = `testuser+${userId.slice(0, 8)}@example.com`;
  const password = 'Test1234!';
  const role = overrides.role ?? 'owner';

  // Insert tenant (no RLS on tenants table)
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, $2, $3, 'starter', 'active')`,
    [tenantId, `Test Tenant ${slug}`, slug]
  );

  // Insert user (bypasses RLS via direct pool — safe for test setup only)
  const passwordHash = await bcrypt.hash(password, 10);
  await testPool.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, language_preference)
     VALUES ($1, $2, $3, $4, 'Test', 'User', $5, 'en')`,
    [userId, tenantId, email, passwordHash, role]
  );

  // Insert minimal subscription row
  await testPool.query(
    `INSERT INTO tenant_subscriptions (id, tenant_id, tier, status, addon_gc_module, addon_cross_tenant)
     VALUES ($1, $2, 'starter', 'active', false, false)`,
    [randomUUID(), tenantId]
  );

  // Issue JWT (same structure as production)
  const token = jwt.sign(
    {
      jti: randomUUID(),
      user_id: userId,
      tenant_id: tenantId,
      role: role.toUpperCase(),
      email,
      preferred_language: 'en',
    },
    TEST_JWT_SECRET,
    { expiresIn: 3600 }
  );

  const cleanup = async () => {
    await testPool.query(`DELETE FROM audit_log WHERE tenant_id = $1`, [tenantId]);
    await testPool.query(`DELETE FROM projects WHERE tenant_id = $1`, [tenantId]);
    await testPool.query(`DELETE FROM tenant_subscriptions WHERE tenant_id = $1`, [tenantId]);
    await testPool.query(`DELETE FROM users WHERE tenant_id = $1`, [tenantId]);
    await testPool.query(`DELETE FROM tenants WHERE id = $1`, [tenantId]);
  };

  return {
    tenant: { id: tenantId, slug, name: `Test Tenant ${slug}` },
    user: { id: userId, tenantId, email, password, role },
    token,
    cleanup,
  };
}
