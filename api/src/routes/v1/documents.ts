// routes/v1/documents.ts — Document metadata (storage_path is live path, never direct URL)
// Actual file upload/download uses pre-signed URLs via /files/upload and /files/download
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { generateDownloadUrl, isTenantLivePath } from '../../lib/storage.js';

const DOC_TYPES = ['rfi','submittal','plan','spec','contract','report','other'] as const;
const DOC_STATUSES = ['draft','active','superseded','void'] as const;
const CreateSchema = z.object({ project_id:z.string().uuid(), doc_type:z.enum(DOC_TYPES), title:z.string().min(1).max(500), storage_path:z.string().max(1000), file_size_bytes:z.number().int().positive().optional(), status:z.enum(DOC_STATUSES).default('active') });
const UpdateSchema = z.object({ title:z.string().min(1).max(500).optional(), status:z.enum(DOC_STATUSES).optional(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), doc_type:z.enum(DOC_TYPES).optional(), status:z.enum(DOC_STATUSES).optional(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','ESTIMATOR','FOREMAN'] as const;

export async function documentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/documents', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, doc_type, title, storage_path, file_size_bytes, status } = body.data;
      if (!isTenantLivePath(tenant_id, storage_path)) return reply.status(422).send({ error:{ code:'INVALID_STORAGE_PATH', message:'Storage path must be a live file owned by your organization', field:'storage_path' } });
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO documents (tenant_id,project_id,doc_type,title,storage_path,file_size_bytes,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[tenant_id,project_id,doc_type,title,storage_path,file_size_bytes??null,status,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'document.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'document',resourceId:rows[0].id,payload:{project_id,doc_type,title},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ document:item });
    }
  );
  app.get('/documents', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, doc_type, status, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (doc_type){conds.push(`doc_type=$${idx++}`);params.push(doc_type);}
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM documents WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM documents WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ documents:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/documents/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM documents WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Document not found'} });
      return reply.status(200).send({ document:item });
    }
  );
  // GET /documents/:id/download — returns 15-minute pre-signed URL (T-05)
  app.get('/documents/:id/download', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT id,storage_path FROM documents WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Document not found'} });
      // Defense in depth: rows written before path validation existed may hold a foreign key.
      if (!isTenantLivePath(tenant_id, item.storage_path)) return reply.status(403).send({ error:{code:'FORBIDDEN',message:'File does not belong to your organization'} });
      const url = await generateDownloadUrl(item.storage_path);
      return reply.status(200).send({ download_url:url, expires_in_seconds:900 });
    }
  );
  app.patch('/documents/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { title, status, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (title!==undefined){params.push(title);sets.push(`title=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE documents SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'document.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'document',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM documents WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Document not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ document:result.row });
    }
  );
  app.delete('/documents/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE documents SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'document.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'document',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Document not found'}});
      return reply.status(204).send();
    }
  );
}
