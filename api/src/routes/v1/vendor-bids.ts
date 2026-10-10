// routes/v1/vendor-bids.ts — Vendor bid lifecycle (invite/submit/award/decline)
// Nested under bid-packages for invite/list; top-level for single bid operations
// Locked decisions: T-01, T-02, T-03, T-12, A-03

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const InviteSchema = z.object({
  vendor_id: z.string().uuid(),
  notes: z.string().optional(),
});

const UpdateSchema = z.object({
  notes: z.string().optional().nullable(),
  total_amount_cents: z.number().int().min(0).optional(),
  version: z.number().int().min(1),
});

const LineItemSchema = z.object({
  takeoff_item_id: z.string().uuid().optional(),
  unit_cost_cents: z.number().int().min(0).default(0),
  total_cost_cents: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

const WRITE_ROLES = ['OWNER', 'PROJECT_MANAGER', 'ESTIMATOR'] as const;

export async function vendorBidRoutes(app: FastifyInstance): Promise<void> {
  // Invite vendor to bid on a bid package
  app.post('/bid-packages/:bid_package_id/bids', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { bid_package_id } = req.params as { bid_package_id: string };
      const body = InviteSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { vendor_id, notes } = body.data;

      const bid = await withTenantContext(tenant_id, async (client) => {
        // Verify bid package exists in this tenant
        const { rows: pkg } = await client.query(`SELECT id FROM bid_packages WHERE id = $1 AND deleted_at IS NULL`, [bid_package_id]);
        if (pkg.length === 0) return null;

        const { rows } = await client.query(
          `INSERT INTO vendor_bids (tenant_id, bid_package_id, vendor_id, status, notes, created_by)
           VALUES ($1,$2,$3,'invited',$4,$5) RETURNING *`,
          [tenant_id, bid_package_id, vendor_id, notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor_bid.invited', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor_bid', resourceId: rows[0].id, payload: { bid_package_id, vendor_id }, ipAddress: req.ip });
        return rows[0];
      });

      if (!bid) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Bid package not found' } });
      return reply.status(201).send({ vendor_bid: bid });
    }
  );

  // List bids for a bid package
  app.get('/bid-packages/:bid_package_id/bids', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { bid_package_id } = req.params as { bid_package_id: string };
      const { tenant_id } = req.jwt;

      const bids = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT * FROM vendor_bids WHERE bid_package_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
          [bid_package_id]
        );
        return rows;
      });
      return reply.status(200).send({ vendor_bids: bids });
    }
  );

  // Get single bid with line items
  app.get('/vendor-bids/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: bids } = await client.query(`SELECT * FROM vendor_bids WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (bids.length === 0) return null;
        const { rows: lineItems } = await client.query(
          `SELECT * FROM vendor_bid_line_items WHERE vendor_bid_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
          [id]
        );
        return { ...bids[0], line_items: lineItems };
      });

      if (!result) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor bid not found' } });
      return reply.status(200).send({ vendor_bid: result });
    }
  );

  // Update bid notes / total amount
  app.patch('/vendor-bids/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { notes, total_amount_cents, version } = body.data;

      const result = await withTenantContext(tenant_id, async (client) => {
        const sets = ['version = version + 1', 'updated_at = NOW()'];
        const params: unknown[] = [];
        let idx = 1;
        if (notes !== undefined) { params.push(notes); sets.push(`notes = $${idx++}`); }
        if (total_amount_cents !== undefined) { params.push(total_amount_cents); sets.push(`total_amount_cents = $${idx++}`); }
        params.push(id, version);
        const { rows } = await client.query(`UPDATE vendor_bids SET ${sets.join(', ')} WHERE id = $${idx} AND version = $${idx + 1} AND deleted_at IS NULL RETURNING *`, params);
        if (rows.length > 0) {
          await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor_bid.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor_bid', resourceId: id, payload: body.data, ipAddress: req.ip });
          return { row: rows[0], status: 'ok' };
        }
        const { rows: check } = await client.query(`SELECT id FROM vendor_bids WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return { row: null, status: check.length === 0 ? 'not_found' : 'conflict' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor bid not found' } });
      if (result.status === 'conflict') return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Version conflict — fetch the latest and retry' } });
      return reply.status(200).send({ vendor_bid: result.row });
    }
  );

  // Mark bid as submitted
  app.post('/vendor-bids/:id/submit', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: curr } = await client.query(`SELECT status FROM vendor_bids WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (curr.length === 0) return { row: null, status: 'not_found' };
        if (curr[0].status === 'submitted') return { row: null, status: 'already_submitted' };
        if (curr[0].status === 'awarded') return { row: null, status: 'already_awarded' };

        const { rows } = await client.query(
          `UPDATE vendor_bids SET status = 'submitted', submitted_at = NOW(), version = version + 1, updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
          [id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor_bid.submitted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor_bid', resourceId: id, payload: {}, ipAddress: req.ip });
        return { row: rows[0], status: 'ok' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor bid not found' } });
      if (result.status === 'already_submitted') return reply.status(409).send({ error: { code: 'ALREADY_SUBMITTED', message: 'Bid has already been submitted' } });
      if (result.status === 'already_awarded') return reply.status(409).send({ error: { code: 'ALREADY_AWARDED', message: 'Bid has already been awarded' } });
      return reply.status(200).send({ vendor_bid: result.row });
    }
  );

  // Award a bid — marks winner, declines all others for same package
  app.post('/vendor-bids/:id/award', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;

      const result = await withTenantContext(tenant_id, async (client) => {
        const { rows: curr } = await client.query(`SELECT id, bid_package_id, total_amount_cents, status FROM vendor_bids WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (curr.length === 0) return { row: null, status: 'not_found' };
        if (curr[0].status === 'awarded') return { row: curr[0], status: 'already_awarded' };
        if (curr[0].status === 'declined') return { row: null, status: 'bid_declined' };

        const bid_package_id = curr[0].bid_package_id;

        // Award this bid
        const { rows: awarded } = await client.query(
          `UPDATE vendor_bids SET status = 'awarded', version = version + 1, updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
          [id]
        );

        // Decline all other bids for same package
        await client.query(
          `UPDATE vendor_bids SET status = 'declined', version = version + 1, updated_at = NOW()
           WHERE bid_package_id = $1 AND id != $2 AND deleted_at IS NULL AND status NOT IN ('declined', 'awarded')`,
          [bid_package_id, id]
        );

        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor_bid.awarded', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor_bid', resourceId: id, payload: { bid_package_id, total_amount_cents: curr[0].total_amount_cents }, ipAddress: req.ip });
        return { row: awarded[0], status: 'ok' };
      });

      if (result.status === 'not_found') return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor bid not found' } });
      if (result.status === 'already_awarded') return reply.status(409).send({ error: { code: 'ALREADY_AWARDED', message: 'Bid is already awarded' } });
      if (result.status === 'bid_declined') return reply.status(409).send({ error: { code: 'BID_DECLINED', message: 'Cannot award a declined bid' } });
      return reply.status(200).send({ vendor_bid: result.row });
    }
  );

  // Add a line item to a bid
  app.post('/vendor-bids/:id/line-items', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const body = LineItemSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { takeoff_item_id, unit_cost_cents, total_cost_cents, notes } = body.data;

      const lineItem = await withTenantContext(tenant_id, async (client) => {
        const { rows: bid } = await client.query(`SELECT id FROM vendor_bids WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (bid.length === 0) return null;
        const { rows } = await client.query(
          `INSERT INTO vendor_bid_line_items
             (tenant_id, vendor_bid_id, takeoff_item_id, unit_cost_cents, total_cost_cents, notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [tenant_id, id, takeoff_item_id ?? null, unit_cost_cents, total_cost_cents, notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor_bid_line_item.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor_bid_line_item', resourceId: rows[0].id, payload: { vendor_bid_id: id, unit_cost_cents, total_cost_cents }, ipAddress: req.ip });
        return rows[0];
      });

      if (!lineItem) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor bid not found' } });
      return reply.status(201).send({ vendor_bid_line_item: lineItem });
    }
  );

  // Soft-delete a bid (sets status to declined)
  app.delete('/vendor-bids/:id', { preHandler: [authenticate, requireRole(...WRITE_ROLES)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE vendor_bids SET deleted_at = NOW(), status = 'declined' WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (rows.length > 0) await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'vendor_bid.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'vendor_bid', resourceId: id, payload: {}, ipAddress: req.ip });
        return rows[0] ?? null;
      });
      if (!deleted) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Vendor bid not found' } });
      return reply.status(204).send();
    }
  );
}
