// routes/v1/sub-portal.ts — Sub Portal invite funnel + scoped portal surface (P-04)
//
// The Sub Portal is the free acquisition engine: a GC invites a subcontractor who has
// NO account. The sub joins as a `sub_portal` user INSIDE the GC's tenant and sees ONLY
// the project(s) they are a member of — never financials, team, settings, or other projects.
//
// SECURITY BOUNDARY (ultrathink):
//   A sub_portal user lives inside the GC tenant, so tenant RLS alone would expose the
//   whole tenant. Two layers close that:
//     1. A GLOBAL deny hook (index.ts) rejects any SUB_PORTAL token on every /v1/* path
//        except /v1/sub-portal — so a sub_portal token cannot reach general routes at all.
//     2. Every endpoint here re-derives the caller's allowed project_ids from
//        `project_members` and filters/authorizes on it. No portal query is unscoped.
//   No tier gate on the sub side (P-04 — free for the sub); the GC's seat limit applies
//   via assertCanAddUser at invite time.

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { withTenantContext } from '../../lib/tenant-context.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { issueToken, revokeToken } from '../../middleware/auth.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { assertCanAddUser, TierEnforcementError } from '../../services/tier-enforcement.js';
import {
  generateSubPortalMagicLinkToken,
  consumeSubPortalMagicLinkToken,
  sendSubPortalInviteEmail,
} from '../../lib/password-reset.js';
import type { PoolClient } from 'pg';

const InviteSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  project_id: z.string().uuid(),
});

const AcceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const RespondSchema = z.object({
  note: z.string().max(4000).optional(),
});

/** Project ids this sub_portal user is a member of. The scoping key for every read. */
async function memberProjectIds(client: PoolClient, userId: string): Promise<string[]> {
  const res = await client.query(
    `SELECT DISTINCT project_id FROM project_members WHERE user_id = $1`,
    [userId]
  );
  return res.rows.map((r) => r.project_id as string);
}

export async function subPortalRoutes(app: FastifyInstance): Promise<void> {
  const requireSubPortal = [authenticate, requireRole('SUB_PORTAL')];

  // ── POST /v1/sub-portal/invite — GC invites a sub (OWNER/PM) ────────────────
  app.post(
    '/sub-portal/invite',
    { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = InviteSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) },
        });
      }
      const { tenant_id, user_id, email: actorEmail, role: actorRole } = req.jwt;
      const { email, first_name, last_name, project_id } = body.data;

      try {
        const result = await withTenantContext(tenant_id, async (client) => {
          // Project must exist in this tenant (RLS scopes the lookup)
          const proj = await client.query(`SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL`, [project_id]);
          if (proj.rows.length === 0) {
            throw Object.assign(new Error('Project not found'), { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
          }

          // Does a user with this email already exist in the tenant?
          const existing = await client.query(
            `SELECT id, role, status FROM users WHERE tenant_id = $1 AND email = $2 AND deleted_at IS NULL`,
            [tenant_id, email.toLowerCase()]
          );

          let userRow: { id: string; email: string; first_name: string; last_name: string; role: string; status: string };
          let reinvite = false;

          if (existing.rows.length > 0) {
            const ex = existing.rows[0];
            if (ex.role !== 'sub_portal') {
              throw Object.assign(new Error('A user with this email already exists in this tenant'), { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
            }
            // Existing sub_portal user — add them to this project + re-issue a link (idempotent funnel).
            reinvite = true;
            await client.query(
              `INSERT INTO project_members (tenant_id, project_id, user_id, role)
               SELECT $1, $2, $3, 'sub_portal'
               WHERE NOT EXISTS (
                 SELECT 1 FROM project_members WHERE tenant_id = $1 AND project_id = $2 AND user_id = $3
               )`,
              [tenant_id, project_id, ex.id]
            );
            const r = await client.query(
              `SELECT id, email, first_name, last_name, role, status FROM users WHERE id = $1`,
              [ex.id]
            );
            userRow = r.rows[0];
          } else {
            // New sub_portal user — counts toward the GC's seat limit (P-04).
            await assertCanAddUser(tenant_id);
            const tempHash = await bcrypt.hash(randomUUID(), 10);
            const ins = await client.query(
              `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, language_preference, status, created_by)
               VALUES ($1,$2,$3,$4,$5,'sub_portal','en','invited',$6)
               RETURNING id, email, first_name, last_name, role, status`,
              [tenant_id, email.toLowerCase(), tempHash, first_name, last_name, user_id]
            );
            userRow = ins.rows[0];
            await client.query(
              `INSERT INTO project_members (tenant_id, project_id, user_id, role) VALUES ($1,$2,$3,'sub_portal')`,
              [tenant_id, project_id, userRow.id]
            );
          }

          await writeAuditEntry(client, {
            tenantId: tenant_id,
            category: 'admin',
            action: reinvite ? 'sub_portal.reinvited' : 'sub_portal.invited',
            actorId: user_id,
            actorEmail: actorEmail,
            actorRole: actorRole,
            resourceType: 'user',
            resourceId: userRow.id,
            payload: { email: userRow.email, project_id },
            ipAddress: req.ip,
          });

          // GC company name for the email body.
          const t = await client.query(`SELECT name FROM tenants WHERE id = $1`, [tenant_id]);
          return { userRow, gcName: (t.rows[0]?.name as string) ?? 'A contractor' };
        });

        // Magic link — fire-and-forget email (mirrors users.ts invite).
        const token = await generateSubPortalMagicLinkToken(result.userRow.id, tenant_id);
        sendSubPortalInviteEmail(result.userRow.email, result.userRow.first_name, result.gcName, token).catch(
          (err) => req.log.warn({ err }, 'sub-portal invite email failed')
        );

        return reply.status(201).send({ user: result.userRow });
      } catch (err: any) {
        if (err instanceof TierEnforcementError) {
          return reply.status(402).send({ error: { code: err.code, message: err.message, upgrade_to: err.upgradeToTier } });
        }
        if (err?.statusCode) {
          return reply.status(err.statusCode).send({ error: { code: err.code ?? 'ERROR', message: err.message } });
        }
        throw err;
      }
    }
  );

  // ── POST /v1/sub-portal/auth/accept — sub sets password (public) ────────────
  app.post('/sub-portal/auth/accept', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = AcceptSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.errors[0]?.message } });
    }
    const consumed = await consumeSubPortalMagicLinkToken(body.data.token);
    if (!consumed) return reply.status(401).send({ error: { code: 'TOKEN_INVALID', message: 'Invite link is invalid or expired' } });

    // The token carries the tenant, so read + update under the user's own RLS context
    // (no cross-tenant raw read — which would hit RLS on a NOBYPASSRLS pool).
    const passwordHash = await bcrypt.hash(body.data.password, 10);
    const user = await withTenantContext(consumed.tenantId, async (c) => {
      const res = await c.query(
        `UPDATE users SET password_hash = $1, status = 'active', updated_at = NOW()
         WHERE id = $2 AND role = 'sub_portal' AND deleted_at IS NULL
         RETURNING id, tenant_id, email, first_name, last_name, language_preference`,
        [passwordHash, consumed.userId]
      );
      return res.rows[0] ?? null;
    });
    if (!user) return reply.status(401).send({ error: { code: 'USER_NOT_FOUND', message: 'Sub portal account not found' } });

    const token = issueToken(
      { id: user.id, tenantId: user.tenant_id, role: 'SUB_PORTAL', email: user.email, languagePreference: user.language_preference },
      'web'
    );
    return reply.send({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name } });
  });

  // ── POST /v1/sub-portal/auth/logout ─────────────────────────────────────────
  app.post('/sub-portal/auth/logout', { preHandler: requireSubPortal }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await revokeToken(req.jwt.jti, req.jwt.exp);
    } catch {
      /* already invalid — fine */
    }
    return reply.status(204).send();
  });

  // ── GET /v1/sub-portal/projects — projects the sub is a member of ───────────
  app.get('/sub-portal/projects', { preHandler: requireSubPortal }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tenant_id, user_id } = req.jwt;
    const projects = await withTenantContext(tenant_id, async (client) => {
      const ids = await memberProjectIds(client, user_id);
      if (ids.length === 0) return [];
      const res = await client.query(
        `SELECT id, name, status, start_date, end_date, address, city, state
         FROM projects WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL ORDER BY name`,
        [ids]
      );
      return res.rows;
    });
    return reply.send({ projects });
  });

  // ── GET /v1/sub-portal/projects/:id — scoped project bundle ─────────────────
  app.get('/sub-portal/projects/:id', { preHandler: requireSubPortal }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tenant_id, user_id } = req.jwt;
    const { id } = req.params as { id: string };

    const bundle = await withTenantContext(tenant_id, async (client) => {
      const ids = await memberProjectIds(client, user_id);
      if (!ids.includes(id)) return null; // not a member → 403 (never reveals existence)

      const proj = await client.query(
        `SELECT id, name, status, start_date, end_date, address, city, state
         FROM projects WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );
      if (proj.rows.length === 0) return null;

      // Read-only schedule (safe fields only — no cost data).
      const tasks = await client.query(
        `SELECT id, title, status, planned_start, planned_end, percent_complete, phase
         FROM schedule_tasks WHERE project_id = $1 AND deleted_at IS NULL
         ORDER BY planned_start NULLS LAST, created_at LIMIT 200`,
        [id]
      );
      // Documents (metadata only — download via presigned URL is a follow-up).
      const docs = await client.query(
        `SELECT id, doc_type, title, status, created_at
         FROM documents WHERE project_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 200`,
        [id]
      );
      // RFIs directed to THIS sub (assignee_id = caller) — the ones they can respond to.
      const rfis = await client.query(
        `SELECT id, number, subject, status, due_date, created_at
         FROM rfis WHERE project_id = $1 AND assignee_id = $2 AND deleted_at IS NULL
         ORDER BY number DESC`,
        [id, user_id]
      );
      return { project: proj.rows[0], tasks: tasks.rows, documents: docs.rows, rfis: rfis.rows };
    });

    if (!bundle) return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not a member of this project' } });
    return reply.send(bundle);
  });

  // ── POST /v1/sub-portal/rfis/:id/respond — answer an RFI directed to the sub ─
  app.post('/sub-portal/rfis/:id/respond', { preHandler: requireSubPortal }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { tenant_id, user_id, email, role } = req.jwt;
    const { id } = req.params as { id: string };
    const body = RespondSchema.safeParse(req.body ?? {});
    if (!body.success) {
      return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.errors[0]?.message } });
    }

    const outcome = await withTenantContext(tenant_id, async (client) => {
      // The RFI must be assigned to THIS sub AND live in a project they're a member of.
      const rfi = await client.query(
        `SELECT r.id, r.status, r.version
         FROM rfis r
         JOIN project_members pm ON pm.project_id = r.project_id AND pm.user_id = $2
         WHERE r.id = $1 AND r.assignee_id = $2 AND r.deleted_at IS NULL`,
        [id, user_id]
      );
      if (rfi.rows.length === 0) return { code: 'FORBIDDEN' as const };
      if (rfi.rows[0].status === 'closed') return { code: 'RFI_CLOSED' as const };

      const upd = await client.query(
        `UPDATE rfis SET status = 'answered', version = version + 1, updated_at = NOW()
         WHERE id = $1 RETURNING id, number, subject, status, version`,
        [id]
      );
      await writeAuditEntry(client, {
        tenantId: tenant_id,
        category: 'data',
        action: 'rfi.responded',
        actorId: user_id,
        actorEmail: email,
        actorRole: role,
        resourceType: 'rfi',
        resourceId: id,
        payload: { note: body.data.note ?? null },
        ipAddress: req.ip,
      });
      return { code: 'OK' as const, rfi: upd.rows[0] };
    });

    if (outcome.code === 'FORBIDDEN') return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'RFI not assigned to you' } });
    if (outcome.code === 'RFI_CLOSED') return reply.status(409).send({ error: { code: 'RFI_CLOSED', message: 'RFI is closed' } });
    return reply.send({ rfi: outcome.rfi });
  });
}
