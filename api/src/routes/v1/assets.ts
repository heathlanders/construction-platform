// routes/v1/assets.ts — Company Asset Registry (core CRUD + aggregates)
// Locked decisions: T-56 (Business+ tier gate), T-58 (chain of custody), T-12 (optimistic locking)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { assertTier, TierEnforcementError } from '../../services/tier-enforcement.js';

async function guardTier(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const { tenant_id } = (request as any).jwt;
  try {
    await assertTier(tenant_id, 'BUSINESS');
    return tenant_id;
  } catch (e) {
    if (e instanceof TierEnforcementError) {
      reply.status(402).send({ error: { code: e.code, message: e.message, upgrade_to: e.upgradeToTier } });
      return null;
    }
    throw e;
  }
}

const ASSET_CATEGORIES = ['vehicle','heavy_equipment','trailer','attachment','power_tool','hand_tool','safety_equipment','technology','other'] as const;
const ASSET_STATUSES = ['active','in_repair','out_of_service','decommissioned','sold','stolen','lost','reserved'] as const;
const OWNERSHIP_TYPES = ['owned','rented','leased','borrowed'] as const;
const METER_TYPES = ['odometer','hours','none'] as const;
const METER_SOURCES = ['manual','service','inspection','telematics','fuel_log'] as const;

const CreateSchema = z.object({
  name: z.string().min(1),
  asset_category: z.enum(ASSET_CATEGORIES),
  ownership_type: z.enum(OWNERSHIP_TYPES),
  asset_number: z.string().optional(),
  asset_type: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  serial_number: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  status: z.enum(ASSET_STATUSES).default('active'),
  condition: z.enum(['excellent','good','fair','poor']).optional().nullable(),
  purchase_date: z.string().date().optional().nullable(),
  purchase_price_cents: z.number().int().min(0).optional().nullable(),
  purchase_vendor_id: z.string().uuid().optional().nullable(),
  home_location: z.string().optional().nullable(),
  meter_type: z.enum(METER_TYPES).default('none'),
  requires_operator_cert: z.boolean().default(false),
  required_cert_type: z.string().optional().nullable(),
  dot_regulated: z.boolean().default(false),
  dot_unit_number: z.string().optional().nullable(),
  osha_inspection_required: z.boolean().default(false),
  osha_inspection_frequency_days: z.number().int().positive().optional().nullable(),
  group_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const UpdateSchema = z.object({
  version: z.number().int().positive(),
  name: z.string().min(1).optional(),
  asset_category: z.enum(ASSET_CATEGORIES).optional(),
  ownership_type: z.enum(OWNERSHIP_TYPES).optional(),
  asset_number: z.string().optional().nullable(),
  asset_type: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  serial_number: z.string().optional().nullable(),
  vin: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  status: z.enum(ASSET_STATUSES).optional(),
  condition: z.enum(['excellent','good','fair','poor']).optional().nullable(),
  purchase_date: z.string().date().optional().nullable(),
  purchase_price_cents: z.number().int().min(0).optional().nullable(),
  purchase_vendor_id: z.string().uuid().optional().nullable(),
  home_location: z.string().optional().nullable(),
  meter_type: z.enum(METER_TYPES).optional(),
  requires_operator_cert: z.boolean().optional(),
  required_cert_type: z.string().optional().nullable(),
  dot_regulated: z.boolean().optional(),
  dot_unit_number: z.string().optional().nullable(),
  osha_inspection_required: z.boolean().optional(),
  osha_inspection_frequency_days: z.number().int().optional().nullable(),
  group_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const MeterReadingSchema = z.object({
  reading_date: z.string().date(),
  reading_value: z.number().positive(),
  source: z.enum(METER_SOURCES),
  notes: z.string().optional().nullable(),
});

const ListQuerySchema = z.object({
  category: z.enum(ASSET_CATEGORIES).optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  group_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  overdue_maintenance: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function assetRoutes(app: FastifyInstance): Promise<void> {

  // ── Static routes FIRST (Fastify radix tree requires this) ────────────────

  // GET /assets/dashboard
  app.get('/assets/dashboard', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const [summary, checkouts, warranties, insurance, registrations, maintenance] = await Promise.all([
          client.query(`SELECT
            COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_count,
            COUNT(*) FILTER (WHERE status = 'out_of_service' AND deleted_at IS NULL) AS oos_count,
            COUNT(*) FILTER (WHERE asset_category IN ('power_tool','hand_tool') AND deleted_at IS NULL) AS tool_count
            FROM company_assets WHERE tenant_id = current_setting('app.current_tenant_id')::uuid`),
          client.query(`SELECT COUNT(*) AS n FROM asset_checkouts WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND checked_in_at IS NULL`),
          client.query(`SELECT COUNT(*) AS n FROM asset_warranties WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND deleted_at IS NULL AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'`),
          client.query(`SELECT COUNT(*) AS n FROM asset_insurance_policies WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND deleted_at IS NULL AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'`),
          client.query(`SELECT COUNT(*) AS n FROM asset_registrations WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND deleted_at IS NULL AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'`),
          client.query(`SELECT COUNT(*) AS n FROM asset_maintenance_schedules WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND deleted_at IS NULL AND is_active = TRUE AND next_due_date < NOW()`),
        ]);
        const s = summary.rows[0];
        return reply.send({
          total_count: parseInt(s.total_count, 10),
          oos_count: parseInt(s.oos_count, 10),
          tool_count: parseInt(s.tool_count, 10),
          active_checkouts: parseInt(checkouts.rows[0].n, 10),
          expiring_soon: {
            warranties: parseInt(warranties.rows[0].n, 10),
            insurance_policies: parseInt(insurance.rows[0].n, 10),
            registrations: parseInt(registrations.rows[0].n, 10),
          },
          overdue_maintenance_count: parseInt(maintenance.rows[0].n, 10),
        });
      });
    },
  );

  // GET /assets/expiring
  app.get('/assets/expiring', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const days = Math.max(1, parseInt((req.query as any).days ?? '30', 10));
      return withTenantContext(tenant_id, async (client) => {
        const [w, ip, r, rd] = await Promise.all([
          client.query(`SELECT aw.*, ca.name AS asset_name, ca.asset_number FROM asset_warranties aw JOIN company_assets ca ON ca.id = aw.asset_id WHERE aw.tenant_id = current_setting('app.current_tenant_id')::uuid AND aw.deleted_at IS NULL AND aw.expiry_date BETWEEN NOW() AND NOW() + ($1 || ' days')::INTERVAL ORDER BY aw.expiry_date`, [days]),
          client.query(`SELECT * FROM asset_insurance_policies WHERE tenant_id = current_setting('app.current_tenant_id')::uuid AND deleted_at IS NULL AND expiry_date BETWEEN NOW() AND NOW() + ($1 || ' days')::INTERVAL ORDER BY expiry_date`, [days]),
          client.query(`SELECT ar.*, ca.name AS asset_name, ca.asset_number FROM asset_registrations ar JOIN company_assets ca ON ca.id = ar.asset_id WHERE ar.tenant_id = current_setting('app.current_tenant_id')::uuid AND ar.deleted_at IS NULL AND ar.expiry_date BETWEEN NOW() AND NOW() + ($1 || ' days')::INTERVAL ORDER BY ar.expiry_date`, [days]),
          client.query(`SELECT ard.*, ca.name AS asset_name, ca.asset_number FROM asset_rental_details ard JOIN company_assets ca ON ca.id = ard.asset_id WHERE ard.tenant_id = current_setting('app.current_tenant_id')::uuid AND ard.deleted_at IS NULL AND ard.rental_end_date BETWEEN NOW() AND NOW() + ($1 || ' days')::INTERVAL ORDER BY ard.rental_end_date`, [days]),
        ]);
        return reply.send({ days, warranties: w.rows, insurance_policies: ip.rows, registrations: r.rows, rental_details: rd.rows });
      });
    },
  );

  // GET /assets/maintenance-due
  app.get('/assets/maintenance-due', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`
          SELECT ams.*, ca.name AS asset_name, ca.asset_number, ca.asset_category, ca.status AS asset_status,
            (ams.next_due_date < NOW()) AS is_overdue
          FROM asset_maintenance_schedules ams
          JOIN company_assets ca ON ca.id = ams.asset_id
          WHERE ams.tenant_id = current_setting('app.current_tenant_id')::uuid
            AND ams.deleted_at IS NULL AND ca.deleted_at IS NULL
            AND ams.is_active = TRUE AND ams.next_due_date <= NOW() + INTERVAL '14 days'
          ORDER BY ams.next_due_date ASC`);
        return reply.send({ items: res.rows });
      });
    },
  );

  // GET /assets/checked-out
  app.get('/assets/checked-out', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`
          SELECT ac.*, ca.name AS asset_name, ca.asset_number, ca.asset_category,
            u.first_name, u.last_name, u.email AS user_email, p.name AS project_name,
            (ac.expected_return_at IS NOT NULL AND ac.expected_return_at < NOW()) AS is_overdue
          FROM asset_checkouts ac
          JOIN company_assets ca ON ca.id = ac.asset_id
          JOIN users u ON u.id = ac.checked_out_by
          LEFT JOIN projects p ON p.id = ac.project_id
          WHERE ac.tenant_id = current_setting('app.current_tenant_id')::uuid AND ac.checked_in_at IS NULL
          ORDER BY ac.checked_out_at DESC`);
        return reply.send({ items: res.rows });
      });
    },
  );

  // GET /assets
  app.get('/assets', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const q = ListQuerySchema.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: q.error.issues[0]?.message } });
      const { category, status, group_id, project_id, overdue_maintenance, cursor, limit } = q.data;
      return withTenantContext(tenant_id, async (client) => {
        const wheres: string[] = ['ca.deleted_at IS NULL'];
        const params: unknown[] = [];
        let i = 1;
        if (category) { wheres.push(`ca.asset_category = $${i++}`); params.push(category); }
        if (status)   { wheres.push(`ca.status = $${i++}`); params.push(status); }
        if (group_id) { wheres.push(`ca.group_id = $${i++}`); params.push(group_id); }
        if (project_id) {
          wheres.push(`EXISTS (SELECT 1 FROM asset_project_assignments apa WHERE apa.asset_id = ca.id AND apa.project_id = $${i++} AND apa.returned_at IS NULL)`);
          params.push(project_id);
        }
        if (overdue_maintenance === 'true') {
          wheres.push(`EXISTS (SELECT 1 FROM asset_maintenance_schedules ams WHERE ams.asset_id = ca.id AND ams.deleted_at IS NULL AND ams.is_active = TRUE AND ams.next_due_date < NOW())`);
        }
        if (cursor) { wheres.push(`ca.id > $${i++}`); params.push(cursor); }
        params.push(limit);
        const res = await client.query(
          `SELECT ca.* FROM company_assets ca WHERE ${wheres.join(' AND ')} ORDER BY ca.id ASC LIMIT $${i}`,
          params,
        );
        return reply.send({ items: res.rows, next_cursor: res.rows.length === limit ? res.rows[res.rows.length - 1].id : null });
      });
    },
  );

  // POST /assets
  app.post('/assets', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        let assetNumber = d.asset_number;
        if (!assetNumber) {
          const cnt = await client.query(`SELECT COUNT(*) AS n FROM company_assets WHERE tenant_id = current_setting('app.current_tenant_id')::uuid`);
          assetNumber = `AST-${(parseInt(cnt.rows[0].n, 10) + 1).toString().padStart(4, '0')}`;
        }
        const res = await client.query(`
          INSERT INTO company_assets (tenant_id, asset_number, name, asset_category, ownership_type,
            asset_type, make, model, year, serial_number, vin, color, status, condition,
            purchase_date, purchase_price_cents, purchase_vendor_id, home_location, meter_type,
            requires_operator_cert, required_cert_type, dot_regulated, dot_unit_number,
            osha_inspection_required, osha_inspection_frequency_days, group_id, notes, created_by)
          VALUES (current_setting('app.current_tenant_id')::uuid, $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                  $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
          RETURNING *`,
          [assetNumber, d.name, d.asset_category, d.ownership_type, d.asset_type ?? null,
           d.make ?? null, d.model ?? null, d.year ?? null, d.serial_number ?? null, d.vin ?? null,
           d.color ?? null, d.status, d.condition ?? null, d.purchase_date ?? null,
           d.purchase_price_cents ?? null, d.purchase_vendor_id ?? null, d.home_location ?? null,
           d.meter_type, d.requires_operator_cert, d.required_cert_type ?? null,
           d.dot_regulated, d.dot_unit_number ?? null, d.osha_inspection_required,
           d.osha_inspection_frequency_days ?? null, d.group_id ?? null, d.notes ?? null, user_id],
        );
        const asset = res.rows[0];
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'company_asset', resourceId: asset.id, payload: { asset_number: asset.asset_number, name: asset.name, asset_category: asset.asset_category }, ipAddress: (req as any).ip });
        return reply.status(201).send(asset);
      });
    },
  );

  // GET /assets/:id
  app.get('/assets/:id', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'FIELD_TECH')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `SELECT ca.*, ag.name AS group_name FROM company_assets ca LEFT JOIN asset_groups ag ON ag.id = ca.group_id WHERE ca.id = $1 AND ca.deleted_at IS NULL`,
          [req.params.id],
        );
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  // PATCH /assets/:id
  app.patch('/assets/:id', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT * FROM company_assets WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        const sets: string[] = [];
        const params: unknown[] = [];
        let i = 1;
        const cols = ['name','asset_category','ownership_type','asset_number','asset_type','make','model','year','serial_number','vin','color','status','condition','purchase_date','purchase_price_cents','purchase_vendor_id','home_location','meter_type','requires_operator_cert','required_cert_type','dot_regulated','dot_unit_number','osha_inspection_required','osha_inspection_frequency_days','group_id','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        if (sets.length === 0) return reply.status(400).send({ error: { code: 'NO_FIELDS', message: 'No fields to update' } });
        sets.push(`updated_at = NOW()`, `version = version + 1`);
        params.push(req.params.id, version);
        const res = await client.query(
          `UPDATE company_assets SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`,
          params,
        );
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Asset was modified by another user. Refresh and try again.' } });
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.updated', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'company_asset', resourceId: req.params.id, payload: { before: existing.rows[0], after: res.rows[0] }, ipAddress: (req as any).ip });
        return reply.send(res.rows[0]);
      });
    },
  );

  // DELETE /assets/:id
  app.delete('/assets/:id', { preHandler: [authenticate, requireRole('OWNER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT * FROM company_assets WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        const asset = existing.rows[0];
        if (!['decommissioned','sold'].includes(asset.status)) {
          return reply.status(422).send({ error: { code: 'INVALID_STATUS_FOR_DELETION', message: `Asset must be 'decommissioned' or 'sold' before deletion. Current: '${asset.status}'.` } });
        }
        await client.query(`UPDATE company_assets SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [req.params.id]);
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'company_asset', resourceId: req.params.id, payload: { asset_number: asset.asset_number, name: asset.name }, ipAddress: (req as any).ip });
        return reply.status(204).send();
      });
    },
  );

  // POST /assets/:id/meter-reading
  app.post('/assets/:id/meter-reading', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN', 'FIELD_TECH')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = MeterReadingSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const assetRes = await client.query(`SELECT id, meter_type, current_meter_reading FROM company_assets WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
        if (assetRes.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        if (assetRes.rows[0].meter_type === 'none') return reply.status(422).send({ error: { code: 'NO_METER', message: 'This asset does not have a meter configured.' } });
        const row = await client.query(`INSERT INTO asset_meter_readings (tenant_id, asset_id, reading_date, reading_value, source, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid, $1,$2,$3,$4,$5,$6) RETURNING *`, [req.params.id, d.reading_date, d.reading_value, d.source, d.notes ?? null, user_id]);
        const current = parseFloat(assetRes.rows[0].current_meter_reading ?? '0');
        if (d.reading_value > current) {
          await client.query(`UPDATE company_assets SET current_meter_reading = $1, updated_at = NOW() WHERE id = $2`, [d.reading_value, req.params.id]);
        }
        return reply.status(201).send(row.rows[0]);
      });
    },
  );

  // GET /assets/:id/utilization
  app.get('/assets/:id/utilization', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT id FROM company_assets WHERE id = $1 AND deleted_at IS NULL`, [req.params.id]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        // Full utilization breakdown (service costs + fuel per project) is v1.1
        return reply.send({ asset_id: req.params.id, utilization_by_project: [] });
      });
    },
  );
}
