// routes/v1/portal-migrations.ts — super-admin portal-user → own-tenant migration (T-46, T-47)
//
// A Sub Portal user lives as a `users` row inside a GC's tenant (role sub_portal). When they want
// their own tenant, a super admin INITIATES a migration; a DIFFERENT super admin APPROVES it (T-47),
// which EXECUTES: copy the user into the target tenant with a NEW uuid, then soft-delete the original
// (T-46 — never re-stamp tenant_id). All steps logged as PLATFORM-scope audit events.
//
// `portal_migrations` is a platform-scoped, NO-RLS table (migration 0034) — guarded by
// requireSuperAdmin. Cross-tenant user reads/writes use withTenantContext(realTenantId) — a real
// tenant scope, NOT a superadmin RLS bypass (T-52 respected).
//
// SCOPE: this migrates the user record itself (the load-bearing T-46 invariant). Copying the user's
// associated project-visible data is a documented follow-up (see docs/SuperAdmin_Operations_v1_0.md §4).

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { pgPool } from '../../lib/db.js';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { requireSuperAdmin, revokeUserSessions } from '../../middleware/auth.js';

interface AdminJwt { admin_id?: string }

async function platformAudit(params: {
  action: string; actorId?: string; resourceId?: string; payload?: Record<string, unknown>; ipAddress?: string;
}): Promise<void> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL app.current_tenant_id = 'PLATFORM'");
    await writeAuditEntry(client, {
      tenantId: 'PLATFORM',
      category: 'admin',
      action: params.action,
      actorId: params.actorId,
      actorEmail: 'superadmin@platform',
      actorRole: 'SUPER_ADMIN',
      resourceType: 'portal_migration',
      resourceId: params.resourceId,
      payload: params.payload,
      ipAddress: params.ipAddress,
    });
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

interface Migration {
  id: string; user_id: string; source_tenant_id: string; target_tenant_id: string;
  status: string; initiated_by: string; new_user_id: string | null;
}

/** Record one copied source→target row (idempotent — a re-run never duplicates). */
async function recordMap(m: Migration, table: string, sourceId: string, targetId: string): Promise<void> {
  await pgPool.query(
    `INSERT INTO portal_migration_records (migration_id, source_table, source_tenant_id, source_id, target_tenant_id, target_id)
     VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (migration_id, source_table, source_id) DO NOTHING`,
    [m.id, table, m.source_tenant_id, sourceId, m.target_tenant_id, targetId],
  );
}

/**
 * Copy the sub's project-visible data (the projects they were a member of + those projects'
 * documents) into the target tenant with NEW uuids (T-46), FK-remapped project_id, recorded in
 * portal_migration_records for idempotency + T-58 chain of custody. Never touches the GC's rows.
 * Returns counts of NEWLY-copied rows (already-mapped rows are skipped — resumable).
 */
async function copyAssociatedData(m: Migration, newUserId: string, ip?: string): Promise<{ projects: number; documents: number }> {
  const projectIds = await withTenantContext(m.source_tenant_id, async (c) => {
    const { rows } = await c.query(`SELECT DISTINCT project_id FROM project_members WHERE user_id = $1`, [m.user_id]);
    return rows.map((r) => r.project_id as string);
  });
  if (projectIds.length === 0) return { projects: 0, documents: 0 };

  // Load existing mappings so a re-run resumes instead of duplicating.
  const { rows: mapped } = await pgPool.query(
    `SELECT source_table, source_id, target_id FROM portal_migration_records WHERE migration_id = $1`, [m.id]);
  const map = new Map<string, string>(mapped.map((r) => [`${r.source_table}:${r.source_id}`, r.target_id]));

  const projectMap = new Map<string, string>(); // source project_id → target project_id
  let projects = 0;

  for (const pid of projectIds) {
    let targetPid = map.get(`projects:${pid}`);
    if (!targetPid) {
      const src = await withTenantContext(m.source_tenant_id, async (c) => {
        const { rows } = await c.query(
          `SELECT name, status, start_date, end_date, address, city, state, zip, county_fips, county_name
             FROM projects WHERE id = $1 AND deleted_at IS NULL`, [pid]);
        return rows[0] ?? null;
      });
      if (!src) continue; // project gone — skip
      targetPid = await withTenantContext(m.target_tenant_id, async (c) => {
        const { rows } = await c.query(
          `INSERT INTO projects (tenant_id, name, status, start_date, end_date, address, city, state, zip, county_fips, county_name, created_by)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [src.name, src.status, src.start_date, src.end_date, src.address, src.city, src.state, src.zip, src.county_fips, src.county_name, newUserId]);
        return rows[0].id as string;
      });
      await recordMap(m, 'projects', pid, targetPid);
      await platformAudit({ action: 'portal_migration.record_copied', actorId: m.initiated_by, resourceId: m.id, payload: { source_table: 'projects', source_id: pid, target_id: targetPid }, ipAddress: ip });
      projects++;
    }
    projectMap.set(pid, targetPid);
  }

  // Documents in those projects — metadata copy (byte-copy across tenant storage prefixes is a follow-up).
  const docs = await withTenantContext(m.source_tenant_id, async (c) => {
    const { rows } = await c.query(
      `SELECT id, project_id, doc_type, title, storage_path, file_size_bytes, status
         FROM documents WHERE project_id = ANY($1::uuid[]) AND deleted_at IS NULL`, [projectIds]);
    return rows;
  });
  let documents = 0;
  for (const d of docs) {
    if (map.get(`documents:${d.id}`)) continue;
    const targetPid = projectMap.get(d.project_id);
    if (!targetPid) continue;
    const targetDocId = await withTenantContext(m.target_tenant_id, async (c) => {
      const { rows } = await c.query(
        `INSERT INTO documents (tenant_id, project_id, doc_type, title, storage_path, file_size_bytes, status, created_by)
         VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [targetPid, d.doc_type, d.title, d.storage_path, d.file_size_bytes, d.status, newUserId]);
      return rows[0].id as string;
    });
    await recordMap(m, 'documents', d.id, targetDocId);
    documents++;
  }

  return { projects, documents };
}

/** Notify both tenants' owners/PMs that the migration completed (T-47 step 4). Best-effort. */
async function notifyMigrationComplete(m: Migration): Promise<void> {
  const notify = async (tenantId: string, title: string, body: string) => {
    await withTenantContext(tenantId, async (c) => {
      const { rows } = await c.query(
        `SELECT id FROM users WHERE role IN ('owner','project_manager') AND status = 'active' AND deleted_at IS NULL`);
      for (const o of rows) {
        await c.query(
          `INSERT INTO notifications (tenant_id, user_id, title, body, category)
           VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'system')`,
          [o.id, title, body]);
      }
    });
  };
  await notify(m.source_tenant_id, 'Sub-portal user migrated', 'A sub-portal user was migrated to their own tenant.');
  await notify(m.target_tenant_id, 'Account migration complete', 'Your account and project data were migrated to this tenant.');
}

const InitiateSchema = z.object({
  user_id: z.string().uuid(),
  source_tenant_id: z.string().uuid(),
  target_tenant_id: z.string().uuid(),
  note: z.string().max(1000).optional(),
});

const MIGRATION_COLS = `id, user_id, source_tenant_id, target_tenant_id, status,
  initiated_by, approved_by, new_user_id, note, error, created_at, updated_at`;

export async function portalMigrationRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /v1/admin/portal-migrations — list (newest first) ─────────────────
  app.get('/admin/portal-migrations', { preHandler: requireSuperAdmin }, async (_req, reply) => {
    const { rows } = await pgPool.query(
      `SELECT ${MIGRATION_COLS} FROM portal_migrations ORDER BY created_at DESC LIMIT 200`,
    );
    return reply.status(200).send({ migrations: rows });
  });

  // ── POST /v1/admin/portal-migrations — initiate (T-47 step 1) ─────────────
  app.post('/admin/portal-migrations', { preHandler: requireSuperAdmin }, async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = InitiateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'user_id, source_tenant_id, target_tenant_id (uuid) required' } });
    }
    const { user_id, source_tenant_id, target_tenant_id, note } = parsed.data;
    const admin_id = (req.jwt as unknown as AdminJwt).admin_id;

    if (source_tenant_id === target_tenant_id) {
      return reply.status(400).send({ error: { code: 'INVALID_REQUEST', message: 'Source and target tenant must differ' } });
    }

    // Both tenants must exist
    const tCheck = await pgPool.query<{ id: string }>(`SELECT id FROM tenants WHERE id = ANY($1) AND deleted_at IS NULL`, [[source_tenant_id, target_tenant_id]]);
    if (tCheck.rowCount !== 2) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Source or target tenant not found' } });
    }

    // The user must exist in the source tenant and be a sub_portal user
    const user = await withTenantContext(source_tenant_id, async (client) => {
      const { rows } = await client.query(`SELECT id, role FROM users WHERE id = $1 AND deleted_at IS NULL`, [user_id]);
      return rows[0] ?? null;
    });
    if (!user) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found in source tenant' } });
    if (user.role !== 'sub_portal') {
      return reply.status(422).send({ error: { code: 'NOT_PORTAL_USER', message: 'Only sub_portal users can be migrated' } });
    }

    try {
      const { rows } = await pgPool.query(
        `INSERT INTO portal_migrations (user_id, source_tenant_id, target_tenant_id, status, initiated_by, note)
         VALUES ($1,$2,$3,'pending',$4,$5) RETURNING ${MIGRATION_COLS}`,
        [user_id, source_tenant_id, target_tenant_id, admin_id ?? null, note ?? null],
      );
      await platformAudit({ action: 'portal_migration.initiated', actorId: admin_id, resourceId: rows[0].id, payload: { user_id, source_tenant_id, target_tenant_id }, ipAddress: req.ip });
      return reply.status(201).send({ migration: rows[0] });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === '23505') {
        return reply.status(409).send({ error: { code: 'MIGRATION_EXISTS', message: 'An active migration already exists for this user' } });
      }
      throw e;
    }
  });

  // ── POST /v1/admin/portal-migrations/:id/approve — approve + execute (T-47 step 2, T-46) ─
  app.post('/admin/portal-migrations/:id/approve', { preHandler: requireSuperAdmin }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const admin_id = (req.jwt as unknown as AdminJwt).admin_id;

    const mRes = await pgPool.query(`SELECT ${MIGRATION_COLS} FROM portal_migrations WHERE id = $1`, [id]);
    if (mRes.rowCount === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Migration not found' } });
    const m = mRes.rows[0];

    if (m.status !== 'pending') {
      return reply.status(409).send({ error: { code: 'INVALID_STATUS', message: `Migration is already ${m.status}` } });
    }
    // T-47: the approver must differ from the initiator
    if (admin_id && m.initiated_by && admin_id === m.initiated_by) {
      return reply.status(403).send({ error: { code: 'SAME_ADMIN', message: 'A different super admin must approve this migration' } });
    }

    const fail = async (msg: string, code: string, http: number) => {
      await pgPool.query(`UPDATE portal_migrations SET status='failed', error=$2, updated_at=NOW() WHERE id=$1`, [id, msg]);
      await platformAudit({ action: 'portal_migration.failed', actorId: admin_id, resourceId: id, payload: { error: msg }, ipAddress: req.ip });
      return reply.status(http).send({ error: { code, message: msg } });
    };

    // Read the source user (full record) under the source tenant scope.
    const src = await withTenantContext(m.source_tenant_id, async (client) => {
      const { rows } = await client.query(
        `SELECT email, password_hash, first_name, last_name, role, language_preference, status
           FROM users WHERE id = $1 AND deleted_at IS NULL`, [m.user_id]);
      return rows[0] ?? null;
    });
    if (!src) return fail('Source user no longer exists', 'SOURCE_GONE', 409);

    // Email must be free in the target tenant (UNIQUE (tenant_id, email)).
    const collision = await withTenantContext(m.target_tenant_id, async (client) => {
      const { rows } = await client.query(`SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`, [src.email]);
      return rows.length > 0;
    });
    if (collision) return fail('A user with that email already exists in the target tenant', 'EMAIL_EXISTS', 409);

    // T-46: COPY the user into target tenant with a NEW uuid (DB default).
    const newUserId = await withTenantContext(m.target_tenant_id, async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, language_preference, status)
         VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [src.email, src.password_hash, src.first_name, src.last_name, src.role, src.language_preference, src.status]);
      return rows[0].id as string;
    });

    // Phase 7: copy the sub's project-visible data (projects + their documents) into the target
    // tenant with new uuids — mapped for idempotency + T-58 chain of custody. Runs BEFORE the source
    // soft-delete so a copy failure leaves the source tenant fully intact (resumable via the map).
    let copied: { projects: number; documents: number };
    try {
      copied = await copyAssociatedData(m as Migration, newUserId, req.ip);
    } catch (e) {
      return fail(`Associated-data copy failed: ${(e as Error).message}`, 'DATA_COPY_FAILED', 500);
    }

    // Soft-delete the original user (T-46 — never purge) and remove the sub's membership footprint
    // in the GC tenant. The GC's projects/documents are NEVER modified — the copies are the sub's own.
    await withTenantContext(m.source_tenant_id, async (client) => {
      await client.query(`UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [m.user_id]);
      await client.query(`DELETE FROM project_members WHERE user_id = $1`, [m.user_id]);
    });
    await revokeUserSessions(m.user_id); // the GC-tenant seat is gone — so are its tokens

    // T-47 step 4: notify both tenant admins (best-effort — never fails the migration).
    await notifyMigrationComplete(m as Migration).catch((e) => req.log.warn({ e }, 'portal-migration notify failed'));

    const { rows } = await pgPool.query(
      `UPDATE portal_migrations SET status='complete', approved_by=$2, new_user_id=$3, error=NULL, updated_at=NOW()
       WHERE id=$1 RETURNING ${MIGRATION_COLS}`, [id, admin_id ?? null, newUserId]);

    await platformAudit({ action: 'portal_migration.approved', actorId: admin_id, resourceId: id, payload: { user_id: m.user_id, new_user_id: newUserId, source_tenant_id: m.source_tenant_id, target_tenant_id: m.target_tenant_id, copied }, ipAddress: req.ip });

    return reply.status(200).send({ migration: rows[0], copied });
  });
}
