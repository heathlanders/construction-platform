// db.ts — raw pg pool for withTenantContext (T-42, T-50)
// PgBouncer URL (transaction mode) — NOT the direct DATABASE_URL
// Direct URL is for migrations/seed only (prisma migrate dev)

import pg from 'pg';

const { Pool } = pg;

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_POOL_URL ?? 'postgresql://platform_user:changeme@localhost:15433/platform_dev',
  // Keep connection count low — PgBouncer manages the real pool
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pgPool.on('error', (err) => {
  console.error('pg pool error:', err);
});
