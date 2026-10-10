// routes/v1/admin.ts — Super admin routes
// Locked decisions: T-31, T-32, T-34, T-52
// All routes gated by requireSuperAdmin (role === 'SUPER_ADMIN' AND tenant_id === 'PLATFORM')
// Super admins cannot read tenant business data — RLS prevents it via 'PLATFORM' tenant context (T-52)

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pgPool } from '../../lib/db.js';
import { writeAuditEntry, type AuditCategory } from '../../lib/audit-log.js';
import { getQueue } from '../../lib/queue.js';
// Shared guard decodes the bearer token, enforces role==='SUPER_ADMIN' && tenant_id==='PLATFORM'
// (T-52), checks the jti blacklist, AND sets req.jwt so handlers can read admin_id for audit.
// (The former local guard only READ req.jwt — which nothing populated — so it 403'd everything.)
import { requireSuperAdmin, issueSuperAdminToken, revokeToken, revokeTenantSessions } from '../../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

interface SuperAdminJwt {
  role: string;        // 'SUPER_ADMIN' — string so comparison works
  tenant_id: string;   // 'PLATFORM' literal
  admin_id?: string;
  user_id?: string;
}

// Helper: write a platform-scoped audit entry (tenant_id = 'PLATFORM')
// audit_log has FORCE ROW LEVEL SECURITY, so even a PLATFORM-scoped insert must run with
// app.current_tenant_id set or the WITH CHECK fails (42501). We do it in a transaction with
// SET LOCAL = 'PLATFORM' — the literal sentinel returns zero rows from real tenant tables (T-52),
// but satisfies the audit_log policy. (Without this, every admin route that audits 500s.)
async function writePlatformAuditEntry(params: {
  category: AuditCategory;
  action: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL app.current_tenant_id = 'PLATFORM'");
    await writeAuditEntry(client, {
      tenantId: 'PLATFORM',
      category: params.category,
      action: params.action,
      actorId: params.actorId,
      actorEmail: 'superadmin@platform',
      actorRole: 'SUPER_ADMIN',
      resourceType: params.resourceType,
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

const ALLOWED_TENANT_STATUSES = ['trial', 'active', 'cancelled', 'grace_period', 'suspended'] as const;

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {

  // ── Super admin login (UNGUARDED — this IS the auth endpoint) ──────────────
  // Verifies against platform_admins (no RLS — platform-scoped table). Issues a
  // platform-scope JWT (role SUPER_ADMIN, tenant_id 'PLATFORM'). Generic 401 on any
  // failure — never leak whether the email exists.
  app.post(
    '/admin/login',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = adminLoginSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
        });
      }
      const { email, password } = body.data;

      const result = await pgPool.query<{ id: string; email: string; password_hash: string; status: string }>(
        `SELECT id, email, password_hash, status FROM platform_admins WHERE email = $1`,
        [email.toLowerCase()]
      );

      const admin = result.rows[0];
      // Compare even when the row is missing, to keep timing uniform.
      const hash = admin?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
      const passwordValid = await bcrypt.compare(password, hash);

      if (!admin || !passwordValid || admin.status !== 'active') {
        return reply.status(401).send({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
      }

      const token = issueSuperAdminToken(admin.id, admin.email);

      await pgPool.query(`UPDATE platform_admins SET last_login_at = NOW() WHERE id = $1`, [admin.id]);
      await writePlatformAuditEntry({
        category: 'auth',
        action: 'admin.login',
        actorId: admin.id,
        resourceType: 'platform_admin',
        resourceId: admin.id,
        ipAddress: req.ip,
      });

      return reply.status(200).send({ token, admin: { id: admin.id, email: admin.email } });
    }
  );

  // ── Super admin logout — blacklist the current jti ─────────────────────────
  app.post(
    '/admin/logout',
    { preHandler: requireSuperAdmin },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const jwt = req.jwt as unknown as { jti: string; exp: number; admin_id?: string };
      await revokeToken(jwt.jti, jwt.exp);
      await writePlatformAuditEntry({
        category: 'auth',
        action: 'admin.logout',
        actorId: jwt.admin_id,
        ipAddress: req.ip,
      });
      return reply.status(204).send();
    }
  );

  // ── Super admin change password ────────────────────────────────────────────
  // Verifies the current password, then stores a fresh bcrypt hash (cost 12, matching
  // the tenant auth flow). Does NOT revoke the active session — the admin stays logged in.
  app.post(
    '/admin/change-password',
    { preHandler: requireSuperAdmin },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const jwt = req.jwt as unknown as { admin_id?: string };
      const adminId = jwt.admin_id;
      if (!adminId) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      }

      const body = changePasswordSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' },
        });
      }
      const { current_password, new_password } = body.data;

      const result = await pgPool.query<{ password_hash: string }>(
        `SELECT password_hash FROM platform_admins WHERE id = $1 AND status = 'active'`,
        [adminId]
      );
      const row = result.rows[0];
      if (!row || !(await bcrypt.compare(current_password, row.password_hash))) {
        return reply.status(401).send({
          error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' },
        });
      }

      const newHash = await bcrypt.hash(new_password, 12);
      await pgPool.query(`UPDATE platform_admins SET password_hash = $1 WHERE id = $2`, [newHash, adminId]);
      await writePlatformAuditEntry({
        category: 'admin',
        action: 'admin.password_changed',
        actorId: adminId,
        resourceType: 'platform_admin',
        resourceId: adminId,
        ipAddress: req.ip,
      });

      return reply.status(204).send();
    }
  );

  // ── DLQ: list failed jobs ─────────────────────────────────────────────────
  app.get(
    '/admin/jobs/failed',
    { preHandler: requireSuperAdmin },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          `SELECT id, name, data, output, created_on, started_on, retried_on,
                  retry_limit, retry_count, state
           FROM pgboss.job
           WHERE state = 'failed'
           ORDER BY created_on DESC
           LIMIT 50`
        );
        return reply.send({ jobs: result.rows });
      } finally {
        client.release();
      }
    }
  );

  // ── DLQ: inspect single failed job ───────────────────────────────────────
  app.get(
    '/admin/jobs/failed/:job_id',
    { preHandler: requireSuperAdmin },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { job_id } = req.params as { job_id: string };
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          `SELECT id, name, data, output, created_on, started_on, retried_on,
                  retry_limit, retry_count, state
           FROM pgboss.job WHERE id = $1`,
          [job_id]
        );
        if (result.rows.length === 0) {
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
        }
        return reply.send({ job: result.rows[0] });
      } finally {
        client.release();
      }
    }
  );

  // ── DLQ: replay failed job ────────────────────────────────────────────────
  app.post(
    '/admin/jobs/failed/:job_id/replay',
    { preHandler: requireSuperAdmin },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { job_id } = req.params as { job_id: string };
      const jwt = (req as FastifyRequest & { jwt?: SuperAdminJwt }).jwt;
      const client = await pgPool.connect();
      try {
        const jobResult = await client.query<{ id: string; name: string; data: Record<string, unknown> }>(
          `SELECT id, name, data FROM pgboss.job WHERE id = $1 AND state = 'failed'`,
          [job_id]
        );
        if (jobResult.rows.length === 0) {
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Failed job not found' } });
        }
        const job = jobResult.rows[0];

        // Re-enqueue via pg-boss
        const boss = await getQueue();
        const newJobId = await boss.send(job.name, job.data);

        // Mark old job as completed so it leaves the failed view
        await client.query(
          `UPDATE pgboss.job SET state = 'completed', completed_on = NOW() WHERE id = $1`,
          [job_id]
        );

        await writePlatformAuditEntry({
          category: 'admin',
          action: 'job.replayed',
          actorId: jwt?.admin_id ?? jwt?.user_id,
          resourceType: 'job',
          resourceId: job_id,
          payload: { job_name: job.name, new_job_id: newJobId },
          ipAddress: req.ip,
        });

        return reply.send({ replayed: true, new_job_id: newJobId });
      } finally {
        client.release();
      }
    }
  );

  // ── DLQ: discard failed job ───────────────────────────────────────────────
  app.delete(
    '/admin/jobs/failed/:job_id',
    { preHandler: requireSuperAdmin },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { job_id } = req.params as { job_id: string };
      const jwt = (req as FastifyRequest & { jwt?: SuperAdminJwt }).jwt;
      const client = await pgPool.connect();
      try {
        const result = await client.query<{ id: string }>(
          `UPDATE pgboss.job
           SET state = 'cancelled', completed_on = NOW()
           WHERE id = $1 AND state = 'failed'
           RETURNING id`,
          [job_id]
        );
        if (result.rows.length === 0) {
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Failed job not found' } });
        }

        await writePlatformAuditEntry({
          category: 'admin',
          action: 'job.discarded',
          actorId: jwt?.admin_id ?? jwt?.user_id,
          resourceType: 'job',
          resourceId: job_id,
          ipAddress: req.ip,
        });

        return reply.send({ discarded: true });
      } finally {
        client.release();
      }
    }
  );

  // ── Tenants: list ─────────────────────────────────────────────────────────
  // No withTenantContext — tenants table has no RLS
  app.get(
    '/admin/tenants',
    { preHandler: requireSuperAdmin },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          `SELECT id, name, slug, tier, status, trial_ends_at, created_at
           FROM tenants
           WHERE deleted_at IS NULL
           ORDER BY created_at DESC
           LIMIT 100`
        );
        return reply.send({ tenants: result.rows });
      } finally {
        client.release();
      }
    }
  );

  // ── Tenants: update status ────────────────────────────────────────────────
  app.patch(
    '/admin/tenants/:id',
    { preHandler: requireSuperAdmin },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = req.body as { status?: string } | null;
      const jwt = (req as FastifyRequest & { jwt?: SuperAdminJwt }).jwt;
      const { status } = body ?? {};

      if (!status || !(ALLOWED_TENANT_STATUSES as readonly string[]).includes(status)) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_STATUS',
            message: `status must be one of: ${ALLOWED_TENANT_STATUSES.join(', ')}`,
          },
        });
      }

      const client = await pgPool.connect();
      try {
        const result = await client.query<{ id: string; name: string; status: string }>(
          `UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status`,
          [status, id]
        );
        if (result.rows.length === 0) {
          return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } });
        }
        if (status === 'suspended') await revokeTenantSessions(id);

        await writePlatformAuditEntry({
          category: 'admin',
          action: 'tenant.status_updated',
          actorId: jwt?.admin_id ?? jwt?.user_id,
          resourceType: 'tenant',
          resourceId: id,
          payload: { new_status: status },
          ipAddress: req.ip,
        });

        return reply.send({ tenant: result.rows[0] });
      } finally {
        client.release();
      }
    }
  );
}
