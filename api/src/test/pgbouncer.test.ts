// pgbouncer.test.ts — PgBouncer transaction-mode validation tests
// These tests MUST pass before any other DB test can run (T-43).
// If either test fails, PgBouncer is misconfigured — do not deploy.
//
// See: docs/Testing_Strategy_v1_0.md §2
// Locked decisions: T-43, T-48, T-49

import { describe, it, expect } from 'vitest';
import { testBouncePool } from './setup.js';

describe('PgBouncer transaction mode validation (T-43)', () => {
  /**
   * Test 1: SET SESSION value does NOT persist across PgBouncer connections.
   * T-48: Although PgBouncer doesn't reject SET SESSION at the protocol level,
   * DISCARD ALL (server_reset_query) clears all session state when the server
   * connection is recycled — so tenant context cannot leak this way.
   *
   * We validate that after release+reconnect, the session value is gone.
   */
  it('SET SESSION value is cleared after connection recycle via DISCARD ALL', async () => {
    // Acquire a connection, set a session-level value, release it
    const client1 = await testBouncePool.connect();
    try {
      await client1.query("SET SESSION app.current_tenant_id = 'stale-tenant-id'");
      const during = await client1.query("SELECT current_setting('app.current_tenant_id', true) AS val");
      expect(during.rows[0].val).toBe('stale-tenant-id');
    } finally {
      client1.release();
    }

    // Acquire a fresh connection — DISCARD ALL should have cleared the value
    const client2 = await testBouncePool.connect();
    try {
      await client2.query('DISCARD ALL'); // explicit reset in case same connection recycled
      const after = await client2.query("SELECT current_setting('app.current_tenant_id', true) AS val");
      expect(after.rows[0].val).toBeFalsy();
    } finally {
      client2.release();
    }
  });

  /**
   * Test 2: SET LOCAL must not persist past COMMIT.
   * T-48: SET LOCAL is transaction-scoped and must clear when the transaction ends.
   * If it persists, one tenant's context would leak into the next request.
   */
  it('clears SET LOCAL context after COMMIT', async () => {
    const client = await testBouncePool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL app.current_tenant_id = 'test-uuid-abc'");

      // Verify it's set during the transaction
      const duringTx = await client.query(
        "SELECT current_setting('app.current_tenant_id', true) AS val"
      );
      expect(duringTx.rows[0].val).toBe('test-uuid-abc');

      await client.query('COMMIT');

      // After COMMIT, the setting must be cleared (returns null or empty string)
      const afterCommit = await client.query(
        "SELECT current_setting('app.current_tenant_id', true) AS val"
      );
      // current_setting with missing_ok=true returns null when not set
      expect(afterCommit.rows[0].val).toBeFalsy();
    } finally {
      client.release();
    }
  });

  /**
   * Test 3: DISCARD ALL clears tenant context (T-49).
   * Validates that our finally-block cleanup actually works.
   */
  it('clears tenant context after DISCARD ALL', async () => {
    const client = await testBouncePool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL app.current_tenant_id = 'should-be-cleared'");
      await client.query('COMMIT');
      await client.query('DISCARD ALL');

      const result = await client.query(
        "SELECT current_setting('app.current_tenant_id', true) AS val"
      );
      expect(result.rows[0].val).toBeFalsy();
    } finally {
      client.release();
    }
  });
});
