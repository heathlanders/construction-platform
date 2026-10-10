# Tenant Context Skill
**Locked decisions: T-42, T-43, T-48, T-49, T-50**

## The rule
EVERY database query must be wrapped in `withTenantContext()`.
No exceptions. No superadmin bypass.

## Why this matters
RLS at the DB layer enforces tenant isolation.
But RLS relies on `app.current_tenant_id` being set per transaction.
If a query runs without this context, it either fails or returns data for the wrong tenant.
Application bugs CANNOT leak data across tenants if this is enforced consistently.

## Dual-client pattern (T-42, T-43, T-50)
`fn` receives the **raw pg PoolClient** — NOT the Prisma client.
All tenant-scoped queries use `client.query()` on the same connection where `SET LOCAL` was issued.
Prisma is used ONLY for migrations and non-tenant-scoped queries (e.g., health checks).

> **Why not Prisma inside withTenantContext?** Prisma manages its own connection pool.
> Calling `SET LOCAL` on a raw pg connection then querying through Prisma would use a
> *different* connection, so RLS would not be enforced. T-42 and T-50 lock this decision.

```typescript
import { Pool, PoolClient } from 'pg';
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

// The withTenantContext wrapper (T-50: fn receives PoolClient, never PrismaClient)
async function withTenantContext<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // DISCARD ALL as backstop — clears all session state even on success (T-49)
    // Must be in finally so it runs regardless of success or failure
    try { await client.query('DISCARD ALL'); } catch {}
    client.release();
  }
}

// Usage example
const project = await withTenantContext(tenantId, async (client) => {
  const { rows } = await client.query(
    'SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL',
    [projectId]
  );
  return rows[0];
});
```

## Rules (non-negotiable)
- `SET LOCAL` ONLY — never `SET SESSION` (breaks PgBouncer transaction mode) (T-48)
- `DISCARD ALL` in the `finally` block — runs on both success and failure (T-49)
- `fn` receives raw `PoolClient` — never `PrismaClient` (T-42, T-50)
- Never pass raw tenant_id from user input — always validate from JWT claim
- Superadmin operations: use `tenant_id: 'PLATFORM'` sentinel — this is NOT an RLS bypass.
  `SET LOCAL app.current_tenant_id = 'PLATFORM'` returns zero rows from all RLS-protected tables,
  which is the correct safe behavior. See `docs/SuperAdmin_Operations_v1_0.md` for the full pattern.
  T-52 prohibits application-layer RLS bypass; using the PLATFORM sentinel is not a bypass — it is
  a non-matching tenant_id that RLS naturally rejects.
- Staging validation checklist: grep for raw DB calls outside withTenantContext before every PR

## PgBouncer constraint
PgBouncer runs in **transaction mode**.
`SET SESSION` would persist across pooled connections — CATASTROPHIC data leak risk.
`SET LOCAL` scopes to the current transaction only — safe with connection pooling.

## Pre-PR checklist
```bash
# Run before every PR — catch any raw DB calls outside withTenantContext
grep -rn "pgPool\.query\|pgPool\.connect" --include="*.ts" | grep -v "withTenantContext"
grep -rn "new PrismaClient\|prisma\." --include="*.ts" | grep -v "migrations\|schema\|seed"
```
