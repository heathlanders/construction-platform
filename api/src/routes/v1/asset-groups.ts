// routes/v1/asset-groups.ts — Fleet group management
// Locked decisions: T-56 (Business+ tier gate)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';

async function guardTier(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const { tenant_id } = (request as any).jwt;
  try { await assertTier(tenant_id, 'BUSINESS'); return tenant_id; }
  catch (e) {
    if (e instanceof TierEnforcementError) { reply.status(402).send({ error: { code: e.code, message: e.message, upgrade_to: e.upgradeToTier } }); return null; }
    throw e;
  }
}

const CreateSchema = z.object({ name: z.string().min(1), description: z.string().optional().nullable() });
const UpdateSchema = z.object({ version: z.number().int().positive(), name: z.string().min(1).optional(), description: z.string().optional().nullable() });

export async function assetGroupRoutes(app: FastifyInstance): Promise<void> {

  app.get('/asset-groups', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`
          SELECT ag.*, COUNT(ca.id) FILTER (WHERE ca.deleted_at IS NULL) AS asset_count
          FROM asset_groups ag LEFT JOIN company_assets ca ON ca.group_id = ag.id
          WHERE ag.deleted_at IS NULL GROUP BY ag.id ORDER BY ag.name ASC`);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/asset-groups', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`INSERT INTO asset_groups (tenant_id, name, description, created_by) VALUES (current_setting('app.current_tenant_id')::uuid, $1,$2,$3) RETURNING *`, [body.data.name, body.data.description ?? null, user_id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset_group.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_group', resourceId: res.rows[0].id, payload: { name: res.rows[0].name }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/asset-groups/:gid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT * FROM asset_groups WHERE id = $1 AND deleted_at IS NULL`, [req.params.gid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset group not found' } });
        const sets: string[] = []; const params: unknown[] = []; let i = 1;
        if (fields.name !== undefined) { sets.push(`name = $${i++}`); params.push(fields.name); }
        if ('description' in fields) { sets.push(`description = $${i++}`); params.push(fields.description ?? null); }
        if (sets.length === 0) return reply.status(400).send({ error: { code: 'NO_FIELDS', message: 'No fields to update' } });
        sets.push(`updated_at = NOW()`);
        params.push(req.params.gid, version);
        const res = await client.query(`UPDATE asset_groups SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Group was modified by another user.' } });
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset_group.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_group', resourceId: req.params.gid, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/asset-groups/:gid', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT * FROM asset_groups WHERE id = $1 AND deleted_at IS NULL`, [req.params.gid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset group not found' } });
        const active = await client.query(`SELECT COUNT(*) AS n FROM company_assets WHERE group_id = $1 AND deleted_at IS NULL`, [req.params.gid]);
        if (parseInt(active.rows[0].n, 10) > 0) return reply.status(422).send({ error: { code: 'GROUP_HAS_ASSETS', message: `Cannot delete group with ${active.rows[0].n} active assets. Reassign assets first.` } });
        await client.query(`UPDATE asset_groups SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [req.params.gid]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset_group.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_group', resourceId: req.params.gid, payload: { name: existing.rows[0].name }, ipAddress: (req as any).ip });
        return reply.status(204).send();
      });
    },
  );
}
