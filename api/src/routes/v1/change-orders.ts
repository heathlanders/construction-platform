// routes/v1/change-orders.ts — Change order CRUD
// Locked decisions: T-01, T-02, T-06, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';
import {
  validateConnectionMembership,
  publishIfActive,
  buildChangeOrderEventPayload,
  notifyCounterparty,
} from '../../lib/cross-tenant/bridge.js';

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  amount_cents: z.number().int(),
  status: z.enum(['pending','approved','rejected']).default('pending'),
  contract_id: z.string().uuid().optional(),
  schedule_impact_days: z.number().int().default(0),
  direction: z.enum(['owner_to_gc', 'gc_to_sub']).optional(),
  vendor_id: z.string().uuid().optional(),
  reason_code: z.string().optional(),
  connection_id: z.string().uuid().optional(), // share with a connected Sub (cross-tenant bridge)
});

const UpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  amount_cents: z.number().int().optional(),
  status: z.enum(['pending','approved','rejected']).optional(),
  contract_id: z.string().uuid().optional().nullable(),
  schedule_impact_days: z.number().int().optional(),
  direction: z.enum(['owner_to_gc', 'gc_to_sub']).optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  reason_code: z.string().optional().nullable(),
  version: z.number().int().min(1),
});

const ListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending','approved','rejected']).optional(),
});

const WRITE_ROLES = ['OWNER','PROJECT_MANAGER','ACCOUNTANT'] as const;

export async function changeOrderRoutes(app: FastifyInstance): Promise<void> {
  app.post('/change-orders', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, description, amount_cents, status, contract_id, schedule_impact_days, direction, vendor_id, reason_code, connection_id } = body.data;

      // Cross-tenant share (T-45): caller must be the GC of an ACTIVE connection.
      if (connection_id !== undefined) {
        const conn = await validateConnectionMembership(connection_id, tenant_id);
        if (!conn || conn.gc_tenant_id !== tenant_id) return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not the GC of this connection' } });
        if (conn.status !== 'active') return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Connection must be active to share a change order' } });
      }

      const co = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO change_orders
             (tenant_id, project_id, title, description, amount_cents, status,
              contract_id, schedule_impact_days, direction, vendor_id, reason_code, connection_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [tenant_id, project_id, title, description ?? null, amount_cents, status,
           contract_id ?? null, schedule_impact_days, direction ?? null, vendor_id ?? null,
           reason_code ?? null, connection_id ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'change_order.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'change_order', resourceId: rows[0].id, payload: { project_id, title, amount_cents }, ipAddress: req.ip });
        return rows[0];
      });

      if (connection_id !== undefined) {
        const p = buildChangeOrderEventPayload(co);
        const ev = await publishIfActive(connection_id, tenant_id, 'change_order.created', p);
        if (ev) await notifyCounterparty(connection_id, tenant_id, 'change_order.created', p);
      }

      return reply.status(201).send({ change_order: co });
    }
  );

  app.get('/change-orders', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit, status } = query.data;

      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conditions = ['deleted_at IS NULL', 'project_id = $2'];
        let idx = 3;
        if (cursor) { conditions.push(`(created_at, id) < (SELECT created_at, id FROM change_orders WHERE id = $${idx++})`); params.push(cursor); }
        if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
        const { rows } = await client.query(`SELECT * FROM change_orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT $1`, params);
        return rows;
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      return reply.status(200).send({ change_orders: data, pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null } });
    }
  );

  app.get('/change-orders/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM change_orders WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Change order not found' } });
      return reply.status(200).send({ change_order: item });
    }
  );

  app.patch('/change-orders/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { title, description, amount_cents, status, contract_id, schedule_impact_days, direction, vendor_id, reason_code, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (title !== undefined) { params.push(title); sets.push(`title = $${idx++}`); }
        if (description !== undefined) { params.push(description); sets.push(`description = $${idx++}`); }
        if (amount_cents !== undefined) { params.push(amount_cents); sets.push(`amount_cents = $${idx++}`); }
        if (status !== undefined) { params.push(status); sets.push(`status = $${idx++}`); }
        if (contract_id !== undefined) { params.push(contract_id); sets.push(`contract_id = $${idx++}`); }
        if (schedule_impact_days !== undefined) { params.push(schedule_impact_days); sets.push(`schedule_impact_days = $${idx++}`); }
        if (direction !== undefined) { params.push(direction); sets.push(`direction = $${idx++}`); }
        if (vendor_id !== undefined) { params.push(vendor_id); sets.push(`vendor_id = $${idx++}`); }
        if (reason_code !== undefined) { params.push(reason_code); sets.push(`reason_code = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(`UPDATE change_orders SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'change_order.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'change_order', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' };
        }
        const { rows: check } = await client.query(`SELECT id FROM change_orders WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Change order not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });
      if (result.row.connection_id) { const p = buildChangeOrderEventPayload(result.row); const ev = await publishIfActive(result.row.connection_id, tenant_id, 'change_order.updated', p); if (ev) await notifyCounterparty(result.row.connection_id, tenant_id, 'change_order.updated', p); }
      return reply.status(200).send({ change_order: result.row });
    }
  );

  // Approve a change order (status pending → approved)
  // Dispatches budget_co_adjustment job if contract_id is set
  app.post('/change-orders/:id/approve', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: curr } = await client.query(
          `SELECT id, status, project_id, contract_id FROM change_orders WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (curr.length === 0) return { row: null, status: 'not_found' };
        if (curr[0].status === 'approved') return { row: curr[0], status: 'already_approved' };
        if (curr[0].status === 'rejected') return { row: null, status: 'already_rejected' };

        const { rows } = await client.query(
          `UPDATE change_orders SET status = 'approved', version = version + 1, updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
          [id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'change_order.approved', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'change_order', resourceId: id, payload: { contract_id: curr[0].contract_id }, ipAddress: req.ip });
        return { row: rows[0], status: 'ok', contract_id: curr[0].contract_id };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Change order not found' } });
      if (result.status === 'already_approved') return reply.status(409).send({ error: { code: 'ALREADY_APPROVED', message: 'Change order is already approved' } });
      if (result.status === 'already_rejected') return reply.status(409).send({ error: { code: 'ALREADY_REJECTED', message: 'Change order has been rejected and cannot be approved' } });

      // Dispatch budget reconciliation job if linked to a contract
      if (result.contract_id) {
        await sendJob('reconciliation.budget_co_adjustment', tenant_id, {
          change_order_id: id,
          contract_id: result.contract_id,
          project_id: result.row.project_id,
        });
      }

      // Mirror the approval across the bridge when shared (gap fix — PATCH already mirrors,
      // approve/reject previously didn't). publishIfActive re-validates membership + active (T-45).
      if (result.row.connection_id) {
        const p = buildChangeOrderEventPayload(result.row);
        const ev = await publishIfActive(result.row.connection_id, tenant_id, 'change_order.updated', p);
        if (ev) await notifyCounterparty(result.row.connection_id, tenant_id, 'change_order.updated', p);
      }

      return reply.status(200).send({ change_order: result.row });
    }
  );

  // Reject a change order (status pending → rejected)
  app.post('/change-orders/:id/reject', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: curr } = await client.query(
          `SELECT id, status FROM change_orders WHERE id = $1 AND deleted_at IS NULL`,
          [id]
        );
        if (curr.length === 0) return { row: null, status: 'not_found' };
        if (curr[0].status === 'rejected') return { row: curr[0], status: 'already_rejected' };
        if (curr[0].status === 'approved') return { row: null, status: 'already_approved' };

        const { rows } = await client.query(
          `UPDATE change_orders SET status = 'rejected', version = version + 1, updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
          [id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'change_order.rejected', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'change_order', resourceId: id, payload: {}, ipAddress: req.ip });
        return { row: rows[0], status: 'ok' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Change order not found' } });
      if (result.status === 'already_rejected') return reply.status(409).send({ error: { code: 'ALREADY_REJECTED', message: 'Change order is already rejected' } });
      if (result.status === 'already_approved') return reply.status(409).send({ error: { code: 'ALREADY_APPROVED', message: 'Change order has been approved and cannot be rejected' } });

      // Mirror the rejection across the bridge when shared (same gap fix as approve).
      if (result.row.connection_id) {
        const p = buildChangeOrderEventPayload(result.row);
        const ev = await publishIfActive(result.row.connection_id, tenant_id, 'change_order.updated', p);
        if (ev) await notifyCounterparty(result.row.connection_id, tenant_id, 'change_order.updated', p);
      }

      return reply.status(200).send({ change_order: result.row });
    }
  );

  app.delete('/change-orders/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE change_orders SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'change_order.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'change_order', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Change order not found' } });
      return reply.status(204).send();
    }
  );
}
