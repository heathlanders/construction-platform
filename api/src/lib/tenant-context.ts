// tenant-context.ts
// The central withTenantContext wrapper — EVERY tenant-scoped DB query must use this.
// See: .claude/skills/tenant-context/SKILL.md
// Locked decisions: T-42, T-43, T-48, T-49, T-50, T-51, T-52

import { PoolClient } from 'pg';
import { pgPool } from './db.js';

/**
 * Run fn inside a transaction with tenant RLS context set via SET LOCAL.
 *
 * Rules (non-negotiable):
 * - SET LOCAL only — never SET SESSION (T-48, breaks PgBouncer transaction mode)
 * - fn receives the raw PoolClient — never PrismaClient (T-50)
 * - DISCARD ALL in finally block (not only catch) to clear session state (T-51)
 * - 'PLATFORM' as tenantId is safe — returns zero rows from RLS tables (T-52)
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    // T-48: SET LOCAL via set_config(name, value, is_local=true) — scopes to current transaction only
    // Cannot use parameterized $1 with SET LOCAL (DDL command); set_config() is the safe parameterized equivalent
    // T-52: 'PLATFORM' or any non-UUID sentinel maps to nil UUID — RLS returns zero rows naturally
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeTenantId = UUID_RE.test(tenantId) ? tenantId : '00000000-0000-0000-0000-000000000000';
    await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant_id', safeTenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    // T-51: DISCARD ALL in finally — runs on success AND failure
    // T-49: Defense-in-depth against stale PgBouncer connection state
    try {
      await client.query('DISCARD ALL');
    } catch {
      // Ignore errors from DISCARD ALL — connection will be released anyway
    }
    client.release();
  }
}
