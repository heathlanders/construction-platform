// routes/v1/asset-service.ts — Service records + maintenance schedules
// Locked decisions: T-56 (Business+ gate), T-12 (optimistic locking)

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

const SERVICE_TYPES = ['oil_change','tire_rotation','brake_service','filter_replacement','pm_scheduled','pm_unscheduled','repair','recall','inspection','warranty_repair','calibration','other'] as const;

const ServiceRecordCreateSchema = z.object({
  service_type: z.enum(SERVICE_TYPES),
  service_date: z.string().date(),
  meter_reading_at_service: z.number().optional().nullable(),
  description: z.string().min(1),
  vendor_id: z.string().uuid().optional().nullable(),
  technician_name: z.string().optional().nullable(),
  labor_cost_cents: z.number().int().min(0).default(0),
  parts_cost_cents: z.number().int().min(0).default(0),
  total_cost_cents: z.number().int().min(0).default(0),
  invoice_number: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  next_service_due_date: z.string().date().optional().nullable(),
  next_service_due_meter: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const ServiceRecordUpdateSchema = z.object({
  version: z.number().int().positive(),
  service_type: z.enum(SERVICE_TYPES).optional(),
  service_date: z.string().date().optional(),
  meter_reading_at_service: z.number().optional().nullable(),
  description: z.string().min(1).optional(),
  vendor_id: z.string().uuid().optional().nullable(),
  technician_name: z.string().optional().nullable(),
  labor_cost_cents: z.number().int().min(0).optional(),
  parts_cost_cents: z.number().int().min(0).optional(),
  total_cost_cents: z.number().int().min(0).optional(),
  invoice_number: z.string().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  next_service_due_date: z.string().date().optional().nullable(),
  next_service_due_meter: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const MaintenanceScheduleCreateSchema = z.object({
  schedule_name: z.string().min(1),
  service_type: z.enum(SERVICE_TYPES),
  interval_type: z.enum(['calendar_days','meter_units']),
  interval_value: z.number().positive(),
  last_performed_date: z.string().date().optional().nullable(),
  last_performed_meter: z.number().optional().nullable(),
  next_due_date: z.string().date().optional().nullable(),
  next_due_meter: z.number().optional().nullable(),
  alert_days_before: z.number().int().min(0).default(14),
  alert_meter_before: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});

const MaintenanceScheduleUpdateSchema = z.object({
  version: z.number().int().positive(),
  schedule_name: z.string().min(1).optional(),
  service_type: z.enum(SERVICE_TYPES).optional(),
  interval_type: z.enum(['calendar_days','meter_units']).optional(),
  interval_value: z.number().positive().optional(),
  last_performed_date: z.string().date().optional().nullable(),
  last_performed_meter: z.number().optional().nullable(),
  next_due_date: z.string().date().optional().nullable(),
  next_due_meter: z.number().optional().nullable(),
  alert_days_before: z.number().int().min(0).optional(),
  alert_meter_before: z.number().optional().nullable(),
  is_active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function assetServiceRoutes(app: FastifyInstance): Promise<void> {

  // ── Service Records ────────────────────────────────────────────────────────

  app.get('/assets/:id/service-records', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT sr.*, v.name AS vendor_name FROM asset_service_records sr LEFT JOIN vendors v ON v.id = sr.vendor_id WHERE sr.asset_id = $1 AND sr.deleted_at IS NULL ORDER BY sr.service_date DESC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/service-records', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ServiceRecordCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        // Insert service record
        const res = await client.query(`
          INSERT INTO asset_service_records (tenant_id, asset_id, service_type, service_date, meter_reading_at_service, description, vendor_id, technician_name, labor_cost_cents, parts_cost_cents, total_cost_cents, invoice_number, project_id, next_service_due_date, next_service_due_meter, notes, created_by)
          VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
          [req.params.id, d.service_type, d.service_date, d.meter_reading_at_service ?? null, d.description, d.vendor_id ?? null, d.technician_name ?? null, d.labor_cost_cents, d.parts_cost_cents, d.total_cost_cents, d.invoice_number ?? null, d.project_id ?? null, d.next_service_due_date ?? null, d.next_service_due_meter ?? null, d.notes ?? null, user_id],
        );
        const record = res.rows[0];
        // Also log meter reading if provided
        if (d.meter_reading_at_service !== null && d.meter_reading_at_service !== undefined) {
          await client.query(`INSERT INTO asset_meter_readings (tenant_id, asset_id, reading_date, reading_value, source, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,'service',$4)`, [req.params.id, d.service_date, d.meter_reading_at_service, user_id]);
          await client.query(`UPDATE company_assets SET current_meter_reading = $1, updated_at = NOW() WHERE id = $2 AND (current_meter_reading IS NULL OR current_meter_reading < $1)`, [d.meter_reading_at_service, req.params.id]);
        }
        // Update maintenance schedules that match this service_type
        await client.query(`
          UPDATE asset_maintenance_schedules SET
            last_performed_date = $1,
            last_performed_meter = COALESCE($2, last_performed_meter),
            next_due_date = CASE WHEN interval_type = 'calendar_days' THEN $1::date + CAST(interval_value AS INTEGER) ELSE next_due_date END,
            next_due_meter = CASE WHEN interval_type = 'meter_units' AND $2 IS NOT NULL THEN $2 + interval_value ELSE next_due_meter END,
            updated_at = NOW()
          WHERE asset_id = $3 AND service_type = $4 AND is_active = TRUE AND deleted_at IS NULL`,
          [d.service_date, d.meter_reading_at_service ?? null, req.params.id, d.service_type],
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.service_record_created', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_service_record', resourceId: record.id, payload: { asset_id: req.params.id, service_type: d.service_type, service_date: d.service_date }, ipAddress: (req as any).ip });
        return reply.status(201).send(record);
      });
    },
  );

  app.patch('/assets/:id/service-records/:sid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = ServiceRecordUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_service_records WHERE id = $1 AND deleted_at IS NULL`, [req.params.sid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Service record not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['service_type','service_date','meter_reading_at_service','description','vendor_id','technician_name','labor_cost_cents','parts_cost_cents','total_cost_cents','invoice_number','project_id','next_service_due_date','next_service_due_meter','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.sid, version);
        const res = await client.query(`UPDATE asset_service_records SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Service record was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/assets/:id/service-records/:sid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_service_records SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [req.params.sid]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Service record not found' } });
        return reply.status(204).send();
      });
    },
  );

  // ── Maintenance Schedules ──────────────────────────────────────────────────

  app.get('/assets/:id/maintenance-schedules', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT * FROM asset_maintenance_schedules WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY schedule_name ASC`, [req.params.id]);
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/maintenance-schedules', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = MaintenanceScheduleCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id } = (req as any).jwt;
      const d = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`INSERT INTO asset_maintenance_schedules (tenant_id, asset_id, schedule_name, service_type, interval_type, interval_value, last_performed_date, last_performed_meter, next_due_date, next_due_meter, alert_days_before, alert_meter_before, is_active, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [req.params.id, d.schedule_name, d.service_type, d.interval_type, d.interval_value, d.last_performed_date ?? null, d.last_performed_meter ?? null, d.next_due_date ?? null, d.next_due_meter ?? null, d.alert_days_before, d.alert_meter_before ?? null, d.is_active, d.notes ?? null, user_id]);
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.patch('/assets/:id/maintenance-schedules/:mid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = MaintenanceScheduleUpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { version, ...fields } = body.data;
      return withTenantContext(tenant_id, async (client) => {
        const existing = await client.query(`SELECT id FROM asset_maintenance_schedules WHERE id = $1 AND deleted_at IS NULL`, [req.params.mid]);
        if (existing.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Maintenance schedule not found' } });
        const sets: string[] = ['updated_at = NOW()']; const params: unknown[] = []; let i = 1;
        const cols = ['schedule_name','service_type','interval_type','interval_value','last_performed_date','last_performed_meter','next_due_date','next_due_meter','alert_days_before','alert_meter_before','is_active','notes'] as const;
        for (const col of cols) {
          if (col in fields) { sets.push(`${col} = $${i++}`); params.push((fields as any)[col] ?? null); }
        }
        params.push(req.params.mid, version);
        const res = await client.query(`UPDATE asset_maintenance_schedules SET ${sets.join(', ')} WHERE id = $${i++} AND version = $${i++} AND deleted_at IS NULL RETURNING *`, params);
        if (res.rows.length === 0) return reply.status(409).send({ error: { code: 'VERSION_CONFLICT', message: 'Schedule was modified by another user.' } });
        return reply.send(res.rows[0]);
      });
    },
  );

  app.delete('/assets/:id/maintenance-schedules/:mid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_maintenance_schedules SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [req.params.mid]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Maintenance schedule not found' } });
        return reply.status(204).send();
      });
    },
  );
}
