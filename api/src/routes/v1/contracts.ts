// routes/v1/contracts.ts — Contract CRUD
// Critical missing entity: governs invoices, change orders, and payments
// Locked decisions: T-01, T-02, T-03, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  contract_type: z.enum(['prime_contract', 'subcontract', 'purchase_order']),
  vendor_id: z.string().uuid().optional(),
  original_value_cents: z.number().int().min(0).default(0),
  status: z.enum(['draft', 'pending_signature', 'executed', 'complete', 'terminated']).default('draft'),
  retainage_pct: z.number().min(0).max(100).default(0),
  executed_at: z.string().datetime().optional(),
  docusign_envelope_id: z.string().optional(),
});

const UpdateSchema = z.object({
  contract_type: z.enum(['prime_contract', 'subcontract', 'purchase_order']).optional(),
  vendor_id: z.string().uuid().optional().nullable(),
  original_value_cents: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'pending_signature', 'executed', 'complete', 'terminated']).optional(),
  retainage_pct: z.number().min(0).max(100).optional(),
  executed_at: z.string().datetime().optional().nullable(),
  docusign_envelope_id: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

const ListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'pending_signature', 'executed', 'complete', 'terminated']).optional(),
  contract_type: z.enum(['prime_contract', 'subcontract', 'purchase_order']).optional(),
});

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER'] as const;

// current_value_cents is computed in app layer: original_value_cents + approved_co_value_cents
const SELECT_FIELDS = `
  *,
  (original_value_cents + approved_co_value_cents) AS current_value_cents
`;

export async function contractRoutes(app: FastifyInstance): Promise<void> {
  app.post('/contracts', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, contract_type, vendor_id, original_value_cents, status, retainage_pct, executed_at, docusign_envelope_id } = body.data;

      const contract = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO contracts
             (tenant_id, project_id, contract_type, vendor_id, original_value_cents,
              status, retainage_pct, executed_at, docusign_envelope_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING ${SELECT_FIELDS}`,
          [tenant_id, project_id, contract_type, vendor_id ?? null, original_value_cents,
           status, retainage_pct, executed_at ?? null, docusign_envelope_id ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'contract.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'contract', resourceId: rows[0].id, payload: { project_id, contract_type, original_value_cents }, ipAddress: req.ip });
        return rows[0];
      });
      return reply.status(201).send({ contract });
    }
  );

  app.get('/contracts', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit, status, contract_type } = query.data;

      const contracts = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conditions = ['deleted_at IS NULL', 'project_id = $2'];
        let idx = 3;
        if (cursor) { conditions.push(`(created_at, id) < (SELECT created_at, id FROM contracts WHERE id = $${idx++})`); params.push(cursor); }
        if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
        if (contract_type) { conditions.push(`contract_type = $${idx++}`); params.push(contract_type); }
        const { rows } = await client.query(
          `SELECT ${SELECT_FIELDS} FROM contracts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = contracts.length > limit;
      const items = hasMore ? contracts.slice(0, limit) : contracts;
      return reply.status(200).send({ contracts: items, pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null } });
    }
  );

  app.get('/contracts/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const contract = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT ${SELECT_FIELDS} FROM contracts WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!contract) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contract not found' } });
      return reply.status(200).send({ contract });
    }
  );

  app.patch('/contracts/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { contract_type, vendor_id, original_value_cents, status, retainage_pct, executed_at, docusign_envelope_id, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (contract_type !== undefined) { params.push(contract_type); sets.push(`contract_type = $${idx++}`); }
        if (vendor_id !== undefined) { params.push(vendor_id); sets.push(`vendor_id = $${idx++}`); }
        if (original_value_cents !== undefined) { params.push(original_value_cents); sets.push(`original_value_cents = $${idx++}`); }
        if (status !== undefined) { params.push(status); sets.push(`status = $${idx++}`); }
        if (retainage_pct !== undefined) { params.push(retainage_pct); sets.push(`retainage_pct = $${idx++}`); }
        if (executed_at !== undefined) { params.push(executed_at); sets.push(`executed_at = $${idx++}`); }
        if (docusign_envelope_id !== undefined) { params.push(docusign_envelope_id); sets.push(`docusign_envelope_id = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(
          `UPDATE contracts SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL
           RETURNING ${SELECT_FIELDS}`,
          params
        );
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'contract.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'contract', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' };
        }
        const { rows: check } = await client.query(`SELECT id FROM contracts WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contract not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });
      return reply.status(200).send({ contract: result.row });
    }
  );

  app.delete('/contracts/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE contracts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'contract.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'contract', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contract not found' } });
      return reply.status(204).send();
    }
  );
}
