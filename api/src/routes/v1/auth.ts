// routes/v1/auth.ts — POST /v1/auth/signup, POST /v1/auth/login, POST /v1/auth/logout
// Locked decisions: A-05, P-05, P-06, T-09, T-11
// See: api/CLAUDE.md

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { pgPool } from '../../lib/db.js';
import { withTenantContext } from '../../lib/tenant-context.js';
import { issueToken, revokeToken } from '../../middleware/auth.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate } from '../../plugins/auth-plugin.js';
import {
  generateResetToken,
  consumeResetToken,
  sendPasswordResetEmail,
} from '../../lib/password-reset.js';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  tenant_slug: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const signupSchema = z.object({
  company_name: z.string().min(2).max(100),
  company_slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  platform: z.enum(['web', 'mobile']).default('web'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenant_slug: z.string().min(1),
  platform: z.enum(['web', 'mobile']).default('web'),
});

// ─── Types for DB rows ────────────────────────────────────────────────────────

interface TenantRow {
  id: string;
  status: string;
}

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: string;
  language_preference: string;
  status: string;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /v1/auth/signup
   * Body: { company_name, company_slug, first_name, last_name, email, password, platform }
   * Returns: 201 { token, user }
   *
   * Creates a new tenant + owner user + trial subscription.
   * No auth required — this IS the signup endpoint.
   * Locked decisions: P-05 (14-day Professional trial), P-06 (self-serve)
   */
  app.post(
    '/auth/signup',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = signupSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            fields: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const { company_name, company_slug, first_name, last_name, email, password, platform } =
        body.data;

      // Check slug uniqueness — tenants table has no RLS, safe to query directly
      const slugCheck = await pgPool.query<{ id: string }>(
        `SELECT id FROM tenants WHERE slug = $1`,
        [company_slug]
      );
      if (slugCheck.rows.length > 0) {
        return reply.status(409).send({
          error: { code: 'SLUG_TAKEN', message: 'Company ID is already taken' },
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const tenantId = randomUUID();
      const userId = randomUUID();

      // Create tenant, user, subscription, and storage record in a single transaction
      // inside tenant context so RLS is active for user insert (T-48, T-50)
      await withTenantContext(tenantId, async (client) => {
        // tenants has no RLS — insert is not filtered
        await client.query(
          `INSERT INTO tenants (id, name, slug, tier, status, trial_ends_at)
           VALUES ($1, $2, $3, 'professional', 'trial', NOW() + INTERVAL '14 days')`,
          [tenantId, company_name, company_slug]
        );

        // users has RLS — requires app.current_tenant_id = tenantId (set by withTenantContext)
        await client.query(
          `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, language_preference)
           VALUES ($1, $2, $3, $4, $5, $6, 'owner', 'active', 'en')`,
          [userId, tenantId, email.toLowerCase(), passwordHash, first_name, last_name]
        );

        // tenant_subscriptions has no RLS — P-05: trial gets Professional-tier access for 14 days
        await client.query(
          `INSERT INTO tenant_subscriptions (tenant_id, tier, status, addon_gc_module, addon_cross_tenant, current_period_end)
           VALUES ($1, 'professional', 'trial', false, false, NOW() + INTERVAL '14 days')`,
          [tenantId]
        );

        // tenant_storage_usage has no RLS
        await client.query(
          `INSERT INTO tenant_storage_usage (tenant_id, bytes_used) VALUES ($1, 0)`,
          [tenantId]
        );

        await writeAuditEntry(client, {
          tenantId,
          category: 'auth',
          action: 'tenant.created',
          actorId: userId,
          actorEmail: email.toLowerCase(),
          actorRole: 'owner',
          ipAddress: req.ip,
        });
      });

      const token = issueToken(
        {
          id: userId,
          tenantId,
          role: 'owner' as Parameters<typeof issueToken>[0]['role'],
          email: email.toLowerCase(),
          languagePreference: 'en',
        },
        platform
      );

      return reply.status(201).send({
        token,
        user: {
          id: userId,
          email: email.toLowerCase(),
          role: 'owner',
          language_preference: 'en',
          tenant_id: tenantId,
        },
      });
    }
  );

  /**
   * POST /v1/auth/login
   * Body: { email, password, tenant_slug, platform }
   * Returns: { token, user }
   *
   * No auth required — this IS the auth endpoint.
   */
  app.post(
    '/auth/login',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = loginSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            fields: body.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      const { email, password, tenant_slug, platform } = body.data;

      // Look up tenant by slug — no RLS needed (tenants table has no RLS)
      const tenantResult = await pgPool.query<TenantRow>(
        `SELECT id, status FROM tenants WHERE slug = $1 AND deleted_at IS NULL`,
        [tenant_slug]
      );

      if (tenantResult.rows.length === 0) {
        return reply.status(401).send({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
      }

      const tenant = tenantResult.rows[0];

      if (tenant.status === 'suspended') {
        return reply.status(403).send({
          error: { code: 'TENANT_SUSPENDED', message: 'This account has been suspended' },
        });
      }

      // Look up user + verify password + update last_login_at — all inside tenant context
      // RLS requires app.current_tenant_id to be set even for reads (fails closed without it)
      const { user, token } = await withTenantContext(tenant.id, async (client) => {
        const userResult = await client.query<UserRow>(
          `SELECT id, tenant_id, email, password_hash, role, language_preference, status
           FROM users
           WHERE tenant_id = $1 AND email = $2 AND deleted_at IS NULL`,
          [tenant.id, email.toLowerCase()]
        );

        if (userResult.rows.length === 0) return { user: null, token: null };

        const u = userResult.rows[0];

        if (u.status === 'suspended' || u.status === 'deactivated') {
          return { user: u, token: null };
        }

        const passwordValid = await bcrypt.compare(password, u.password_hash);
        if (!passwordValid) return { user: null, token: null };

        const t = issueToken(
          {
            id: u.id,
            tenantId: u.tenant_id,
            role: u.role as Parameters<typeof issueToken>[0]['role'],
            email: u.email,
            languagePreference: u.language_preference,
          },
          platform
        );

        await client.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [u.id]);
        await writeAuditEntry(client, {
          tenantId: u.tenant_id,
          category: 'auth',
          action: 'user.login',
          actorId: u.id,
          actorEmail: u.email,
          actorRole: u.role,
          ipAddress: req.ip,
        });

        return { user: u, token: t };
      });

      if (!user || !token) {
        return reply.status(401).send({
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
      }

      if (user.status === 'suspended' || user.status === 'deactivated') {
        return reply.status(403).send({
          error: { code: 'USER_SUSPENDED', message: 'Your account has been suspended' },
        });
      }

      return reply.status(200).send({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          language_preference: user.language_preference,
          tenant_id: user.tenant_id,
        },
      });
    }
  );

  /**
   * POST /v1/auth/logout
   * Revokes the current JWT by adding its jti to the Redis blacklist.
   * Requires auth.
   */
  app.post(
    '/auth/logout',
    { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { jti, exp, tenant_id, user_id, email, role } = req.jwt;

      await revokeToken(jti, exp);

      // Audit log — use tenant context so RLS is enforced
      await withTenantContext(tenant_id, async (client) => {
        await writeAuditEntry(client, {
          tenantId: tenant_id,
          category: 'auth',
          action: 'user.logout',
          actorId: user_id,
          actorEmail: email,
          actorRole: role,
          ipAddress: req.ip,
        });
      });

      return reply.status(204).send();
    }
  );

  /**
   * POST /v1/auth/forgot-password
   * Body: { email, tenant_slug }
   * Returns: 200 always — never leak whether email/tenant exists (anti-enumeration)
   *
   * Sends a password reset link to the user's email if the account is found.
   */
  app.post(
    '/auth/forgot-password',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = forgotPasswordSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
        });
      }

      const { email, tenant_slug } = body.data;

      // Look up tenant — do not reveal whether it exists in the response
      const tenantResult = await pgPool.query<TenantRow>(
        `SELECT id, status FROM tenants WHERE slug = $1 AND deleted_at IS NULL`,
        [tenant_slug]
      );

      if (tenantResult.rows.length > 0) {
        const tenant = tenantResult.rows[0];
        if (tenant.status !== 'suspended') {
          const found = await withTenantContext(tenant.id, async (client) => {
            const { rows } = await client.query<{ id: string; email: string; first_name: string }>(
              `SELECT id, email, first_name FROM users
               WHERE tenant_id = $1 AND email = $2 AND deleted_at IS NULL AND status != 'deactivated'`,
              [tenant.id, email.toLowerCase()]
            );
            return rows[0] ?? null;
          });

          if (found) {
            const token = await generateResetToken(found.id, tenant.id);
            // Fire-and-forget — don't block response on email delivery
            sendPasswordResetEmail(found.email, found.first_name, tenant_slug, token).catch(
              (err) => console.warn({ err }, 'forgot-password: email send failed')
            );
          }
        }
      }

      // Always 200 — do not reveal account existence
      return reply.status(200).send({ ok: true });
    }
  );

  /**
   * POST /v1/auth/reset-password
   * Body: { token, password }
   * Returns: 200 { ok: true }
   *
   * Validates the single-use token from Redis, sets the new password,
   * and activates invited users (status 'invited' → 'active').
   */
  app.post(
    '/auth/reset-password',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = resetPasswordSchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(422).send({
          error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
        });
      }

      const { token, password } = body.data;

      const tokenData = await consumeResetToken(token);
      if (!tokenData) {
        return reply.status(400).send({
          error: { code: 'INVALID_TOKEN', message: 'Reset link is invalid or has expired' },
        });
      }

      const { userId, tenantId } = tokenData;
      const passwordHash = await bcrypt.hash(password, 12);

      await withTenantContext(tenantId, async (client) => {
        // Set new password + activate invited users in one update
        const { rows } = await client.query<{ email: string; role: string }>(
          `UPDATE users
           SET password_hash = $1,
               status = CASE WHEN status = 'invited' THEN 'active' ELSE status END,
               updated_at = NOW()
           WHERE id = $2 AND deleted_at IS NULL
           RETURNING email, role`,
          [passwordHash, userId]
        );

        if (rows.length > 0) {
          await writeAuditEntry(client, {
            tenantId,
            category: 'auth',
            action: 'user.password_reset',
            actorId: userId,
            actorEmail: rows[0].email,
            actorRole: rows[0].role,
            ipAddress: req.ip,
          });
        }
      });

      return reply.status(200).send({ ok: true });
    }
  );
}
