// routes/v1/files.ts — Pre-signed upload/download URLs
// Locked decisions: A-06, T-05, T-27, T-28, T-29
// All uploads go to quarantine first — never directly to live storage (T-27)
// Triple validation: extension + content_type match + size limit (T-28)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { generateUploadUrl, generateDownloadUrl, liveProjectPath, liveCompanyPath } from '../../lib/storage.js';
import { assertStorageQuota } from '../../services/tier-enforcement.js';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';
import { checkUpload } from '../../lib/upload-validation.js';

const UploadSchema = z.object({
  filename: z.string().min(1).max(255),
  content_type: z.string().min(1).max(100),
  file_size_bytes: z.number().int().positive(),
  // scope: project file vs company file
  project_id: z.string().uuid().optional(),
  category: z.string().min(1).max(50).default('documents'),
});

const DownloadQuerySchema = z.object({
  path: z.string().min(1).max(1000),
});

export async function fileRoutes(app: FastifyInstance): Promise<void> {

  // POST /v1/files/upload
  // Returns a 5-minute pre-signed PUT URL targeting the quarantine bucket (T-27)
  // and the computed live_path so the caller can create a document record after upload
  app.post('/files/upload', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = UploadSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{ code:'VALIDATION_ERROR', message:'Validation failed', fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message})) } });

      const { tenant_id, user_id, email, role } = req.jwt;
      const { filename, content_type, file_size_bytes, project_id, category } = body.data;

      // Triple validation (T-28) + size limit (T-29) — shared with namespaced uploads ─────────
      const check = checkUpload(filename, content_type, file_size_bytes);
      if (!check.ok) return reply.status(422).send({ error: { code: check.code, message: check.message } });
      const extCategory = check.category;

      // Storage quota check (T-29) ─────────────────────────────────────────────
      await assertStorageQuota(tenant_id, file_size_bytes);

      // Generate quarantine pre-signed URL (T-27) ──────────────────────────────
      const { uploadUrl, quarantinePath } = await generateUploadUrl(tenant_id, filename);

      // Pre-compute the live path so the caller can create a document record
      // after the background scanner moves the file from quarantine to live storage
      const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const livePath = project_id
        ? liveProjectPath(tenant_id, project_id, category, safeFilename)
        : liveCompanyPath(tenant_id, category, safeFilename);

      let fileId: string;
      await withTenantContext(tenant_id, async (client) => {
        // Insert file record (status = scanning) before returning URL (T-27)
        const { rows } = await client.query<{ id: string }>(
          `INSERT INTO files
             (tenant_id, project_id, filename, content_type, file_size_bytes, category,
              quarantine_path, storage_path, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scanning', $9)
           RETURNING id`,
          [tenant_id, project_id ?? null, filename, content_type, file_size_bytes,
           extCategory, quarantinePath, livePath, user_id],
        );
        fileId = rows[0].id;

        await writeAuditEntry(client, { tenantId:tenant_id, category:'data', action:'file.upload_requested', actorId:user_id, actorEmail:email, actorRole:role, resourceType:'file', resourceId:fileId, payload:{ filename, content_type, file_size_bytes, project_id, category }, ipAddress:req.ip });
      });

      // Enqueue scan job — worker will move quarantine → live and update status (T-27)
      await sendJob('file.scan', tenant_id, {
        file_id: fileId!,
        quarantine_path: quarantinePath,
        live_path: livePath,
        filename,
        content_type,
        file_size_bytes,
      });

      return reply.status(200).send({
        file_id: fileId!,
        upload_url: uploadUrl,
        upload_expires_in_seconds: 300,
        quarantine_path: quarantinePath,
        live_path: livePath,
      });
    }
  );

  // GET /v1/files/download?path={storagePath}
  // Returns a 15-minute pre-signed GET URL for any live storage path (T-05)
  // Path must be prefixed with the requesting tenant's ID — prevents cross-tenant access
  app.get('/files/download', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = DownloadQuerySchema.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{ code:'VALIDATION_ERROR', message:'path is required' } });

      const { tenant_id } = req.jwt;
      const { path: storagePath } = q.data;

      // Validate path is scoped to this tenant (T-03 — no cross-tenant file access)
      if (!storagePath.startsWith(`${tenant_id}/`)) {
        return reply.status(403).send({ error:{ code:'FORBIDDEN', message:'File does not belong to your tenant' } });
      }

      // Must be in live storage, not quarantine
      if (!storagePath.includes('/live/')) {
        return reply.status(403).send({ error:{ code:'FORBIDDEN', message:'File is not in live storage — it may still be processing' } });
      }

      const downloadUrl = await generateDownloadUrl(storagePath);

      return reply.status(200).send({
        download_url: downloadUrl,
        expires_in_seconds: 900,
      });
    }
  );

  // GET /v1/files?project_id={uuid}&limit={n}&cursor={cursor}
  // Lists files for the tenant (or scoped to a project)
  // Only returns non-deleted files; includes pre-signed download_url for ready files
  app.get('/files', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = z.object({
        project_id: z.string().uuid().optional(),
        status: z.enum(['scanning', 'ready', 'rejected']).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }).safeParse(req.query);

      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query' } });

      const { tenant_id } = req.jwt;
      const { project_id, status, limit, cursor } = q.data;

      interface FileRow {
        id: string; filename: string; content_type: string;
        file_size_bytes: number; category: string; storage_path: string | null;
        status: string; created_at: string;
      }

      const rows = await withTenantContext(tenant_id, async (client) => {
        let sql = `SELECT id, filename, content_type, file_size_bytes, category, storage_path, status, created_at
                   FROM files
                   WHERE tenant_id = $1 AND deleted_at IS NULL`;
        const params: unknown[] = [tenant_id];
        let pi = 2;

        if (project_id) { sql += ` AND project_id = $${pi++}`; params.push(project_id); }
        if (status)     { sql += ` AND status = $${pi++}`;      params.push(status); }
        if (cursor)     { sql += ` AND (created_at, id) < (SELECT created_at, id FROM files WHERE id = $${pi++})`; params.push(cursor); }

        sql += ` ORDER BY created_at DESC, id DESC LIMIT $${pi}`;
        params.push(limit + 1);

        const { rows: r } = await client.query<FileRow>(sql, params);
        return r;
      });

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;

      // Attach pre-signed download URLs for ready files
      const filesWithUrls = await Promise.all(
        page.map(async (f) => {
          let download_url: string | null = null;
          if (f.status === 'ready' && f.storage_path) {
            try {
              download_url = await generateDownloadUrl(f.storage_path);
            } catch { /* non-fatal */ }
          }
          return { ...f, download_url };
        }),
      );

      return reply.status(200).send({
        files: filesWithUrls,
        pagination: {
          has_more: hasMore,
          next_cursor: hasMore ? page[page.length - 1].id : null,
        },
      });
    }
  );
}
