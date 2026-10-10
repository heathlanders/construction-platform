# Testing Strategy v1.0

> **Required reading before writing any test:** `docs/LOCKED_DECISIONS.md` (T-43, T-48, T-49, T-50, T-51, T-52)

---

## 1. Testing principles

- Tests run against a **real PostgreSQL + PgBouncer** — no mocked DB clients
- RLS policies must be validated in the test environment, not assumed
- Every tenant isolation test verifies cross-tenant leak is **zero rows**, not just "less than expected"
- PgBouncer transaction mode must be validated in CI before any test that touches the DB

---

## 2. PgBouncer transaction mode validation (T-43)

This test must pass before any other DB tests run. It validates the core RLS safety assumption.

```typescript
// tests/infra/pgbouncer.test.ts
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_POOL_URL });

test('PgBouncer is in transaction mode — SET SESSION is rejected', async () => {
  const client = await pool.connect();
  try {
    await expect(
      client.query("SET SESSION app.current_tenant_id = 'test'")
    ).rejects.toThrow(/not allowed in transaction mode/i);
  } finally {
    client.release();
  }
});

test('SET LOCAL scopes to transaction only — cleared after COMMIT', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL app.current_tenant_id = 'test-uuid'");
    const { rows } = await client.query("SELECT current_setting('app.current_tenant_id')");
    expect(rows[0].current_setting).toBe('test-uuid');
    await client.query('COMMIT');

    // After commit — setting must be cleared
    const { rows: after } = await client.query(
      "SELECT current_setting('app.current_tenant_id', true) AS val"
    );
    expect(after[0].val).toBeNull();
  } finally {
    client.release();
  }
});
```

---

## 3. RLS isolation tests

```typescript
// tests/rls/tenant-isolation.test.ts
describe('RLS tenant isolation', () => {
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    // Create two test tenants (using migration account that bypasses RLS)
    tenantA = await createTestTenant('Tenant A');
    tenantB = await createTestTenant('Tenant B');
    await createTestProject(tenantA, 'Project Alpha');
    await createTestProject(tenantB, 'Project Beta');
  });

  test('Tenant A cannot see Tenant B projects', async () => {
    const rows = await withTenantContext(tenantA, async (client) => {
      const { rows } = await client.query('SELECT * FROM projects');
      return rows;
    });
    expect(rows.every(r => r.tenant_id === tenantA)).toBe(true);
    expect(rows.some(r => r.tenant_id === tenantB)).toBe(false);
  });

  test('Direct WHERE filter for other tenant returns zero rows', async () => {
    const rows = await withTenantContext(tenantA, async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM projects WHERE tenant_id = $1',
        [tenantB]
      );
      return rows;
    });
    expect(rows).toHaveLength(0);
  });

  test('withTenantContext DISCARD ALL clears context after transaction', async () => {
    await withTenantContext(tenantA, async (client) => {
      const { rows } = await client.query('SELECT * FROM projects');
      expect(rows.length).toBeGreaterThan(0);
    });
    // Context must be cleared — direct query on same logical connection returns no context
    // (DISCARD ALL in finally ensures this)
  });
});
```

---

## 4. withTenantContext unit tests

```typescript
// tests/unit/tenant-context.test.ts
test('fn receives PoolClient — not PrismaClient', async () => {
  await withTenantContext('some-tenant-id', async (client) => {
    // PoolClient has query(), not $queryRaw()
    expect(typeof client.query).toBe('function');
    expect((client as any).$queryRaw).toBeUndefined();
  });
});

test('DISCARD ALL runs in finally — even on success', async () => {
  const discardSpy = jest.spyOn(/* pool client */, 'query');
  await withTenantContext('tenant-id', async () => { /* success */ });
  expect(discardSpy).toHaveBeenCalledWith('DISCARD ALL');
});

test('DISCARD ALL runs in finally — on thrown error', async () => {
  const discardSpy = jest.spyOn(/* pool client */, 'query');
  await expect(
    withTenantContext('tenant-id', async () => { throw new Error('test error'); })
  ).rejects.toThrow('test error');
  expect(discardSpy).toHaveBeenCalledWith('DISCARD ALL');
});
```

---

## 5. Cross-tenant isolation tests

```typescript
// tests/rls/cross-tenant.test.ts
describe('shared_project_events access control', () => {
  test('GC can only read events for connections they own', async () => {
    // Attempt to read events for a connection the GC is not part of
    // Application layer must throw FORBIDDEN — not return rows
  });

  test('Sub data never appears in GC tenant queries', async () => {
    // Verify no sub-tenant rows in any GC-scoped query
  });
});
```

---

## 6. Offline sync conflict resolution tests

```typescript
// tests/mobile/conflict-resolution.test.ts
describe('Optimistic locking conflicts (T-12, T-13, T-14)', () => {
  test('Version mismatch returns 409 Conflict', async () => {
    const project = await createProject({ version: 1 });
    await updateProject(project.id, { name: 'Server update' }); // version → 2

    // Client sends stale version
    const response = await syncPush({ id: project.id, version: 1, name: 'Client update' });
    expect(response.status).toBe(409);
  });

  test('Financial field conflict blocks — does not auto-resolve', async () => { });
  test('Append-only field (note) uses last-write-wins', async () => { });
  test('Safety field conflict blocks until authorized user resolves', async () => { });
});
```

---

## 7. Audit log hash chain verification

```typescript
// tests/audit/hash-chain.test.ts
test('Audit log hash chain is unbroken', async () => {
  const { rows } = await adminClient.query(
    'SELECT * FROM audit_log WHERE tenant_id = $1 ORDER BY created_at ASC',
    [testTenantId]
  );

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    expect(curr.previous_hash).toBe(prev.entry_hash);
  }
});

test('Tampered entry breaks chain verification', async () => {
  // Modify a row directly (bypass RLS using admin client)
  // Verify hash chain verifier detects the break
});
```

---

## 8. CI pipeline order

1. `pgbouncer.test.ts` — must pass first; blocks everything else
2. RLS isolation tests
3. Unit tests (withTenantContext, auth, etc.)
4. Integration tests (API endpoints with real DB)
5. Cross-tenant tests
6. Audit log tests
7. Offline sync tests (mobile)

---

## 9. Test environment setup

```bash
# Use a separate test database — never run tests against dev or prod
DATABASE_URL=postgresql://platform_user:changeme@localhost:15432/platform_test
DATABASE_POOL_URL=postgresql://platform_user:changeme@localhost:15433/platform_test

# Reset test DB before each test run
pnpm prisma migrate reset --force --skip-seed
pnpm test
```
