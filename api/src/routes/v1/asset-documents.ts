// routes/v1/asset-documents.ts — Asset documents (titles, manuals, certs)
// Locked decisions: T-56 (Business+ gate), T-05 (pre-signed URLs), T-27-T-30 (upload security)
// Documents are uploaded via pre-signed URL pattern — quarantine first, then live

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { isTenantLivePath } from '../../lib/storage.js';
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

const DocumentCreateSchema = z.object({
  document_type: z.enum(['title', 'registration', 'insurance_cert', 'manual', 'warranty_cert', 'inspection_report', 'purchase_receipt', 'other']),
  file_name: z.string().min(1),
  // storage_path is set after file passes quarantine — caller provides it after upload completes
  storage_path: z.string().min(1),
  file_size_bytes: z.number().int().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function assetDocumentRoutes(app: FastifyInstance): Promise<void> {

  app.get('/assets/:id/documents', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`SELECT id, document_type, file_name, file_size_bytes, notes, created_at, created_by FROM asset_documents WHERE asset_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`, [req.params.id]);
        // Return metadata only — no storage_path exposed directly (T-05)
        return reply.send({ items: res.rows });
      });
    },
  );

  app.post('/assets/:id/documents', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER', 'FOREMAN')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const body = DocumentCreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: body.error.issues[0]?.message } });
      const { user_id, email, role } = (req as any).jwt;
      const d = body.data;
      if (!isTenantLivePath(tenant_id, d.storage_path)) return reply.status(422).send({ error:{ code:'INVALID_STORAGE_PATH', message:'Storage path must be a live file owned by your organization', field:'storage_path' } });
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(
          `INSERT INTO asset_documents (tenant_id, asset_id, document_type, file_name, storage_path, file_size_bytes, notes, created_by) VALUES (current_setting('app.current_tenant_id')::uuid,$1,$2,$3,$4,$5,$6,$7) RETURNING id, document_type, file_name, file_size_bytes, notes, created_at`,
          [req.params.id, d.document_type, d.file_name, d.storage_path, d.file_size_bytes ?? null, d.notes ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.document_uploaded', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_document', resourceId: res.rows[0].id, payload: { asset_id: req.params.id, document_type: d.document_type, file_name: d.file_name }, ipAddress: (req as any).ip });
        return reply.status(201).send(res.rows[0]);
      });
    },
  );

  app.delete('/assets/:id/documents/:docid', { preHandler: [authenticate, requireRole('OWNER', 'PROJECT_MANAGER')] },
    async (req: any, reply: FastifyReply) => {
      const tenant_id = await guardTier(req, reply);
      if (!tenant_id) return;
      const { user_id, email, role } = (req as any).jwt;
      return withTenantContext(tenant_id, async (client) => {
        const res = await client.query(`UPDATE asset_documents SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND asset_id = $2 AND deleted_at IS NULL RETURNING id, storage_path`, [req.params.docid, req.params.id]);
        if (res.rows.length === 0) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
        await writeAuditEntry(client, { tenantId: tenant_id, category: 'data', action: 'asset.document_deleted', actorId: user_id, actorEmail: email, actorRole: role, resourceType: 'asset_document', resourceId: req.params.docid, payload: { asset_id: req.params.id }, ipAddress: (req as any).ip });
        return reply.status(204).send();
      });
    },
  );
}
