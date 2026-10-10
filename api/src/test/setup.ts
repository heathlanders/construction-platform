// test/setup.ts — global test setup
// Runs before all test files via vitest setupFiles.
//
// testPool    — connects as 'postgres' superuser via direct PostgreSQL.
//               Used ONLY for inserting/deleting test fixtures (bypasses RLS intentionally).
//               NEVER use this pool in app code — only in test beforeAll/afterAll.
//
// testBouncePool — connects as 'platform_user' via PgBouncer (transaction mode).
//                  This is the same path as real app traffic. Subject to RLS.
//                  Used to validate PgBouncer behavior (T-43, T-48, T-49).

import { afterAll } from 'vitest';
import pg from 'pg';

const { Pool } = pg;

// Direct PostgreSQL pool as postgres superuser — for test setup operations only.
// postgres superuser has BYPASSRLS so test data can be inserted without tenant context.
export const testPool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:15432/platform_dev',
  max: 5,
});

// PgBouncer pool as platform_user — for testing RLS enforcement + transaction mode.
// platform_user has NOBYPASSRLS so RLS policies are enforced as in production.
export const testBouncePool = new Pool({
  connectionString:
    process.env.DATABASE_POOL_URL ??
    'postgresql://platform_user:changeme@localhost:15433/platform_dev',
  max: 5,
});

// Pools are left open — individual test files manage their own cleanup.
// Node.js process exit cleans up the pool connections automatically.
