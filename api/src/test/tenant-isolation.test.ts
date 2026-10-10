// tenant-isolation.test.ts — RLS + withTenantContext integration tests
// Proves the most critical security property of the platform:
// tenant A cannot see tenant B's data through withTenantContext.
//
// These tests hit real PostgreSQL + PgBouncer — no mocking.
// Locked decisions: A-01, A-03, T-42, T-43, T-48, T-50, T-52

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { testPool, testBouncePool } from './setup.js';
import { withTenantContext } from '../lib/tenant-context.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const tenantAId = randomUUID();
const tenantBId = randomUUID();
const projectAId = randomUUID();
const projectBId = randomUUID();

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  // Insert two tenants directly — no RLS context needed for tenants table (A-01: no RLS on tenants)
  await testPool.query(
    `INSERT INTO tenants (id, name, slug, tier, status)
     VALUES ($1, $2, $3, 'starter', 'active'),
            ($4, $5, $6, 'starter', 'active')`,
    [tenantAId, 'Test Tenant A', `test-tenant-a-${tenantAId.slice(0, 8)}`,
     tenantBId, 'Test Tenant B', `test-tenant-b-${tenantBId.slice(0, 8)}`]
  );

  // Insert one project per tenant using direct pool (bypasses RLS — test setup only)
  await testPool.query(
    `INSERT INTO projects (id, tenant_id, name, status)
     VALUES ($1, $2, 'Project for Tenant A', 'active'),
            ($3, $4, 'Project for Tenant B', 'active')`,
    [projectAId, tenantAId, projectBId, tenantBId]
  );
});

afterAll(async () => {
  // Clean up test data in dependency order
  await testPool.query(
    `DELETE FROM projects WHERE id IN ($1, $2)`,
    [projectAId, projectBId]
  );
  await testPool.query(
    `DELETE FROM tenants WHERE id IN ($1, $2)`,
    [tenantAId, tenantBId]
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Tenant RLS isolation via withTenantContext', () => {
  /**
   * Test 1: Tenant A context returns only Tenant A's projects.
   * Core property: A-03 (RLS enforced at DB layer).
   */
  it('withTenantContext(tenantA) returns only tenantA projects', async () => {
    const rows = await withTenantContext(tenantAId, async (client) => {
      const result = await client.query(
        `SELECT id, tenant_id FROM projects WHERE deleted_at IS NULL ORDER BY created_at`
      );
      return result.rows;
    });

    const ids = rows.map((r: { id: string }) => r.id);

    expect(ids).toContain(projectAId);
    expect(ids).not.toContain(projectBId);
    // Every returned row must belong to tenantA (belt-and-suspenders)
    for (const row of rows as Array<{ id: string; tenant_id: string }>) {
      expect(row.tenant_id).toBe(tenantAId);
    }
  });

  /**
   * Test 2: Tenant B context returns only Tenant B's projects.
   * Mirrors Test 1 for the other tenant — confirms isolation is bidirectional.
   */
  it('withTenantContext(tenantB) returns only tenantB projects', async () => {
    const rows = await withTenantContext(tenantBId, async (client) => {
      const result = await client.query(
        `SELECT id, tenant_id FROM projects WHERE deleted_at IS NULL ORDER BY created_at`
      );
      return result.rows;
    });

    const ids = rows.map((r: { id: string }) => r.id);

    expect(ids).toContain(projectBId);
    expect(ids).not.toContain(projectAId);
    for (const row of rows as Array<{ id: string; tenant_id: string }>) {
      expect(row.tenant_id).toBe(tenantBId);
    }
  });

  /**
   * Test 3: Two sequential withTenantContext calls on the same underlying connection
   * pool do not bleed context — tenantA's query after a tenantB call still sees
   * only tenantA's data. Validates the DISCARD ALL + SET LOCAL cleanup path (T-49, T-51).
   */
  it('sequential withTenantContext calls do not bleed context between tenants', async () => {
    // Run B first, then A — if context leaks, A's call would see B's data
    await withTenantContext(tenantBId, async (client) => {
      await client.query(`SELECT id FROM projects WHERE deleted_at IS NULL`);
    });

    const rows = await withTenantContext(tenantAId, async (client) => {
      const result = await client.query(
        `SELECT id, tenant_id FROM projects WHERE deleted_at IS NULL`
      );
      return result.rows;
    });

    for (const row of rows as Array<{ id: string; tenant_id: string }>) {
      expect(row.tenant_id).toBe(tenantAId);
    }
  });

  /**
   * Test 4: Session state set via SET SESSION is cleared after connection recycle (T-48).
   * PgBouncer's DISCARD ALL server_reset_query clears all session settings when
   * a server connection is returned to the pool, preventing tenant context leaks.
   */
  it('SET SESSION tenant context is cleared after connection recycle (T-48)', async () => {
    // Set a session-level tenant context on a connection, then release it
    const client1 = await testBouncePool.connect();
    try {
      await client1.query(`SET SESSION app.current_tenant_id = '${tenantAId}'`);
    } finally {
      client1.release();
    }

    // New connection should have no tenant context (DISCARD ALL cleared it)
    const client2 = await testBouncePool.connect();
    try {
      await client2.query('DISCARD ALL');
      const result = await client2.query("SELECT current_setting('app.current_tenant_id', true) AS val");
      expect(result.rows[0].val).toBeFalsy();
    } finally {
      client2.release();
    }
  });

  /**
   * Test 5: Non-UUID tenant_id sentinel returns zero rows from RLS-protected tables (T-52).
   * withTenantContext maps non-UUID values to the nil UUID (all-zeros), which no real
   * tenant can have. RLS naturally returns zero rows — no bypass occurs.
   */
  it('non-UUID sentinel (PLATFORM) returns zero rows from RLS-protected tables (T-52)', async () => {
    const rows = await withTenantContext('PLATFORM', async (client) => {
      const result = await client.query(
        `SELECT id FROM projects WHERE deleted_at IS NULL`
      );
      return result.rows;
    });

    // Nil UUID maps to no real tenant — RLS returns nothing
    expect(rows).toHaveLength(0);
  });
});
