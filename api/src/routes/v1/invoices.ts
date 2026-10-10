// routes/v1/invoices.ts — Invoice CRUD
// Locked decisions: T-01, T-02, T-03, T-06, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import {
  validateConnectionMembership,
  publishIfActive,
  buildInvoiceEventPayload,
  notifyCounterparty,
} from '../../lib/cross-tenant/bridge.js';

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  amount_cents: z.number().int().min(0),
  status: z.enum(['draft','sent','paid','void']).default('draft'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  contract_id: z.string().uuid().optional(),
  retainage_held_cents: z.number().int().min(0).default(0),
  retainage_released_cents: z.number().int().min(0).default(0),
  connection_id: z.string().uuid().optional(), // bill the GC over the bridge (sub-side only)
});

const UpdateSchema = z.object({
  amount_cents: z.number().int().min(0).optional(),
  status: z.enum(['draft','sent','paid','void']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  contract_id: z.string().uuid().optional().nullable(),
  retainage_held_cents: z.number().int().min(0).optional(),
  retainage_released_cents: z.number().int().min(0).optional(),
  version: z.number().int().min(0),
});

const ListQuerySchema = z.object({
  project_id: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft','sent','paid','void']).optional(),
});

const WRITE_ROLES = ['OWNER','PROJECT_MANAGER','ACCOUNTANT'] as const;

export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/invoices', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, amount_cents, status, due_date, contract_id, retainage_held_cents, retainage_released_cents, connection_id } = body.data;

      // Cross-tenant billing (T-45): direction is REVERSED vs rfis/COs — the SUB bills the GC,
      // so a connection-linked invoice may only be created by the SUB side of an ACTIVE
      // connection. Validated before the write so a bad connection_id never persists.
      if (connection_id !== undefined) {
        const conn = await validateConnectionMembership(connection_id, tenant_id);
        if (!conn || conn.sub_tenant_id !== tenant_id) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not the Sub of this connection' } });
        }
        if (conn.status !== 'active') {
          return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Connection must be active to share an invoice' } });
        }
      }

      const invoice = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO invoices
             (tenant_id, project_id, amount_cents, status, due_date,
              contract_id, retainage_held_cents, retainage_released_cents, connection_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [tenant_id, project_id, amount_cents, status, due_date ?? null,
           contract_id ?? null, retainage_held_cents, retainage_released_cents, connection_id ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'invoice.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'invoice', resourceId: rows[0].id, payload: { project_id, amount_cents, status }, ipAddress: req.ip });
        return rows[0];
      });

      // Mirror AFTER commit — whitelisted payload only. Only a SUBMITTED (status='sent')
      // invoice crosses the bridge; drafts stay internal until the sub submits.
      if (connection_id !== undefined && invoice.status === 'sent') {
        const p = buildInvoiceEventPayload(invoice);
        const ev = await publishIfActive(connection_id, tenant_id, 'invoice.submitted', p);
        if (ev) await notifyCounterparty(connection_id, tenant_id, 'invoice.submitted', p);
      }

      return reply.status(201).send({ invoice });
    }
  );

  app.get('/invoices', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const query = ListQuerySchema.safeParse(req.query);
      if (!query.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query', fields: query.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id } = req.jwt;
      const { project_id, cursor, limit, status } = query.data;

      const invoices = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, project_id];
        const conditions = ['deleted_at IS NULL', 'project_id = $2'];
        let idx = 3;
        if (cursor) { conditions.push(`(created_at, id) < (SELECT created_at, id FROM invoices WHERE id = $${idx++})`); params.push(cursor); }
        if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
        const { rows } = await client.query(`SELECT * FROM invoices WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT $1`, params);
        return rows;
      });

      const hasMore = invoices.length > limit;
      const items = hasMore ? invoices.slice(0, limit) : invoices;
      return reply.status(200).send({ invoices: items, pagination: { has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].id : null } });
    }
  );

  app.get('/invoices/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;
      const invoice = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`SELECT * FROM invoices WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return rows[0] ?? null;
      });
      if (!invoice) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return reply.status(200).send({ invoice });
    }
  );

  app.patch('/invoices/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { amount_cents, status, due_date, contract_id, retainage_held_cents, retainage_released_cents, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        // Prior status is needed to detect the draft→sent submit transition for the bridge mirror.
        const { rows: prevRows } = await client.query(`SELECT status FROM invoices WHERE id = $1 AND deleted_at IS NULL`, [id]);
        const prevStatus: string | null = prevRows[0]?.status ?? null;
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (amount_cents !== undefined) { params.push(amount_cents); sets.push(`amount_cents = $${idx++}`); }
        if (status !== undefined) { params.push(status); sets.push(`status = $${idx++}`); }
        if (due_date !== undefined) { params.push(due_date); sets.push(`due_date = $${idx++}`); }
        if (contract_id !== undefined) { params.push(contract_id); sets.push(`contract_id = $${idx++}`); }
        if (retainage_held_cents !== undefined) { params.push(retainage_held_cents); sets.push(`retainage_held_cents = $${idx++}`); }
        if (retainage_released_cents !== undefined) { params.push(retainage_released_cents); sets.push(`retainage_released_cents = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(`UPDATE invoices SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'invoice.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'invoice', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok', prevStatus };
        }
        const { rows: check } = await client.query(`SELECT id FROM invoices WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict', prevStatus };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });

      // Bridge mirror: `invoice.submitted` on the submit transition (→ sent) or on an
      // amount/due-date amendment while already submitted. Sub marking its own row
      // paid/void publishes nothing — invoice.paid originates from the GC response route.
      // Retainage-only PATCHes never publish (not in the whitelist).
      const row = result.row;
      if (row.connection_id) {
        const becameSent = result.prevStatus !== 'sent' && row.status === 'sent';
        const amendedWhileSent = result.prevStatus === 'sent' && row.status === 'sent'
          && (amount_cents !== undefined || due_date !== undefined);
        if (becameSent || amendedWhileSent) {
          const p = buildInvoiceEventPayload(row);
          const ev = await publishIfActive(row.connection_id, tenant_id, 'invoice.submitted', p);
          if (ev) await notifyCounterparty(row.connection_id, tenant_id, 'invoice.submitted', p);
        }
      }
      return reply.status(200).send({ invoice: result.row });
    }
  );

  app.delete('/invoices/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE invoices SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'invoice.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'invoice', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return reply.status(204).send();
    }
  );
}
