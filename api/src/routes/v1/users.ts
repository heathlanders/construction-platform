// routes/v1/users.ts — user management routes
// GET /v1/users/me, GET /v1/users, POST /v1/users, GET /v1/users/:id,
// PATCH /v1/users/:id, DELETE /v1/users/:id
// Locked decisions: A-05, T-03, T-11

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { pgPool } from '../../lib/db.js';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { assertCanAddUser } from '../../services/tier-enforcement.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { generateResetToken, sendInviteEmail } from '../../lib/password-reset.js';
import { revokeUserSessions } from '../../middleware/auth.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const UserRoleEnum = z.enum([
  'owner','project_manager','estimator','foreman',
  'field_tech','accountant','safety_officer','client_portal','sub_portal','homeowner_portal',
]);

const CreateUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: UserRoleEnum,
  language_preference: z.enum(['en','es']).default('en'),
  // Optional payroll config, applied only when the creator is an OWNER (admin sets pay, not the employee).
  employment_type: z.enum(['w2','contractor_1099']).optional(),
  default_hourly_rate_cents: z.number().int().min(0).optional(),
  overtime_multiplier: z.number().min(1).max(3).optional(),
  pay_frequency: z.enum(['weekly','biweekly','semimonthly','monthly']).optional(),
});

const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  language_preference: z.enum(['en','es']).optional(),
  role: UserRoleEnum.optional(),
  status: z.enum(['active','invited','suspended','deactivated']).optional(),
});

const ListUsersQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active','invited','suspended','deactivated']).optional(),
});

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function userRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /v1/users/me — get current authenticated user's profile
   */
  app.get(
    '/users/me',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      const user = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT id, tenant_id, email, first_name, last_name, role,
                  language_preference, status, last_login_at, created_at
           FROM users WHERE id = $1 AND deleted_at IS NULL`,
          [user_id]
        );
        return rows[0] ?? null;
      });

      if (!user) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      }
      return reply.status(200).send(user);
    }
  );

  /**
   * GET /v1/users — list tenant users
   */
  app.get(
    '/users',
    { preHandler: [authenticate, requireRole('OWNER','PROJECT_MANAGER','ACCOUNTANT')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListUsersQuerySchema.safeParse(req.query);
      if (!query.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id } = req.jwt;
      const { cursor, limit, status } = query.data;

      const users = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1];
        const conditions: string[] = ['deleted_at IS NULL'];
        let idx = 2;

        if (cursor) {
          conditions.push(`(created_at, id) < (SELECT created_at, id FROM users WHERE id = $${idx++})`);
          params.push(cursor);
        }
        if (status) {
          conditions.push(`status = $${idx++}`);
          params.push(status);
        }

        const { rows } = await client.query(
          `SELECT id, tenant_id, email, first_name, last_name, role,
                  language_preference, status, last_login_at, created_at
           FROM users
           WHERE ${conditions.join(' AND ')}
           ORDER BY created_at DESC, id DESC
           LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = users.length > limit;
      const items = hasMore ? users.slice(0, limit) : users;
      return reply.status(200).send({
        users: items,
        pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null },
      });
    }
  );

  /**
   * POST /v1/users — invite a new user to the tenant
   */
  app.post(
    '/users',
    { preHandler: [authenticate, requireRole('OWNER','PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateUserSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }
      const { tenant_id, user_id, email: actorEmail, role: actorRole } = req.jwt;
      const { email, first_name, last_name, role, language_preference } = body.data;
      const { employment_type, default_hourly_rate_cents, overtime_multiplier, pay_frequency } = body.data;
      // Only OWNER may set pay at creation (payroll-settings edits are OWNER/ACCOUNTANT; PMs create users but not pay).
      const setPayroll = actorRole === 'OWNER' && (
        employment_type !== undefined || default_hourly_rate_cents !== undefined ||
        overtime_multiplier !== undefined || pay_frequency !== undefined
      );

      // Tier enforcement: check user limit before creating
      await assertCanAddUser(tenant_id);

      // Generate a random temporary password — user must reset via invite link
      const tempPasswordHash = await bcrypt.hash(randomUUID(), 10);

      const newUser = await withTenantContext(tenant_id, async (client) => {
        let rows;
        try {
          const result = await client.query(
            `INSERT INTO users
               (tenant_id, email, password_hash, first_name, last_name, role, language_preference, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'invited',$8)
             RETURNING id, tenant_id, email, first_name, last_name, role, language_preference, status, created_at`,
            [tenant_id, email.toLowerCase(), tempPasswordHash, first_name, last_name, role, language_preference, user_id]
          );
          rows = result.rows;
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'constraint' in err && (err as { constraint: string }).constraint === 'users_tenant_id_email_key') {
            throw Object.assign(new Error('Email already exists in this tenant'), { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
          }
          throw err;
        }

        // Admin-set pay config (OWNER only) — create the user_payroll_settings row up front so a
        // new employee isn't stuck at rate $0 until someone remembers the separate payroll screen.
        if (setPayroll) {
          await client.query(
            `INSERT INTO user_payroll_settings
               (tenant_id, user_id, employment_type, default_hourly_rate_cents, overtime_multiplier, pay_frequency, created_by)
             VALUES ($1,$2,COALESCE($3,'w2'),COALESCE($4,0),COALESCE($5,1.50),COALESCE($6,'biweekly'),$7)
             ON CONFLICT (user_id) DO NOTHING`,
            [tenant_id, rows[0].id, employment_type ?? null, default_hourly_rate_cents ?? null,
             overtime_multiplier ?? null, pay_frequency ?? null, user_id]
          );
        }

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'user.invited',
          actorId: user_id, actorEmail, actorRole,
          resourceType: 'user', resourceId: rows[0].id,
          payload: { email, role, payroll_set: setPayroll },
          ipAddress: req.ip,
        });

        return rows[0];
      });

      // Send invite email with a one-time password-set link (fire-and-forget)
      // Look up tenant slug so the email can name the company
      const tenantRow = await pgPool.query<{ slug: string }>(
        `SELECT slug FROM tenants WHERE id = $1`,
        [tenant_id]
      );
      const tenantSlug = tenantRow.rows[0]?.slug ?? tenant_id;
      const inviteToken = await generateResetToken(newUser.id, tenant_id);
      sendInviteEmail(newUser.email, newUser.first_name, tenantSlug, inviteToken).catch(
        (err) => console.warn({ err }, 'invite: email send failed')
      );

      return reply.status(201).send({ user: newUser });
    }
  );

  /**
   * GET /v1/users/:id — get a specific tenant user
   */
  app.get(
    '/users/:id',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const user = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT id, tenant_id, email, first_name, last_name, role,
                  language_preference, status, last_login_at, created_at
           FROM users WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        return rows[0] ?? null;
      });

      if (!user) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return reply.status(200).send({ user });
    }
  );

  /**
   * PATCH /v1/users/:id — update user profile or role
   * OWNER can update any field including role/status.
   * Other roles can only update their own first_name/last_name/language_preference.
   */
  app.patch(
    '/users/:id',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateUserSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      }

      const { tenant_id, user_id, role: actorRole, email: actorEmail } = req.jwt;
      const isOwner = actorRole === 'OWNER';
      const isSelf = user_id === id;

      // Non-owners can only update their own basic profile, not role/status
      if (!isOwner) {
        if (!isSelf) return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
        if (body.data.role !== undefined || body.data.status !== undefined) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only an Owner can change role or status' } });
        }
      }

      const { first_name, last_name, language_preference, role, status } = body.data;

      const updated = await withTenantContext(tenant_id, async (client) => {
        const sets: string[] = ['updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;

        if (first_name !== undefined) { params.push(first_name); sets.push(`first_name = $${idx++}`); }
        if (last_name !== undefined) { params.push(last_name); sets.push(`last_name = $${idx++}`); }
        if (language_preference !== undefined) { params.push(language_preference); sets.push(`language_preference = $${idx++}`); }
        if (role !== undefined) { params.push(role); sets.push(`role = $${idx++}`); }
        if (status !== undefined) { params.push(status); sets.push(`status = $${idx++}`); if (status === 'deactivated') sets.push(`deleted_at = NOW()`); }

        if (sets.length === 1) return { user: null, notFound: false, noChange: true };

        params.push(id);
        const { rows } = await client.query(
          `UPDATE users SET ${sets.join(', ')}
           WHERE id = $${idx} AND deleted_at IS NULL
           RETURNING id, tenant_id, email, first_name, last_name, role, language_preference, status, created_at`,
          params
        );

        if (rows.length === 0) return { user: null, notFound: true, noChange: false };

        await writeAuditEntry(client, {
          tenantId: tenant_id, category: 'data', action: 'user.updated',
          actorId: user_id, actorEmail, actorRole,
          resourceType: 'user', resourceId: id,
          payload: body.data,
          ipAddress: req.ip,
        });

        return { user: rows[0], notFound: false, noChange: false };
      });

      // A role change or a suspend/deactivate must not leave the old token usable for up to 30 days.
      if (updated.user && (role !== undefined || (status !== undefined && status !== 'active' && status !== 'invited'))) {
        await revokeUserSessions(id);
      }
      if (updated.noChange) return reply.status(200).send({ user: null });
      if (updated.notFound) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return reply.status(200).send({ user: updated.user });
    }
  );

  /**
   * DELETE /v1/users/:id — deactivate user (soft delete, OWNER only)
   */
  app.delete(
    '/users/:id',
    { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email: actorEmail, role: actorRole } = req.jwt;

      if (user_id === id) {
        return reply.status(400).send({ error: { code: 'CANNOT_DEACTIVATE_SELF', message: 'You cannot deactivate your own account' } });
      }

      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE users SET status = 'deactivated', deleted_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
          [id]
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, {
            tenantId: tenant_id, category: 'data', action: 'user.deactivated',
            actorId: user_id, actorEmail, actorRole,
            resourceType: 'user', resourceId: id,
            payload: {},
            ipAddress: req.ip,
          });
        }
        return rows[0] ?? null;
      });

      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      await revokeUserSessions(id);
      return reply.status(204).send();
    }
  );
}
