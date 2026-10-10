// routes/v1/safety-certifications.ts — Worker safety certifications
// supports expires_before filter for expiry alert queries
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { isTenantLivePath } from '../../lib/storage.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ user_id:z.string().uuid(), cert_type:z.string().min(1).max(100), issued_at:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), expires_at:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), document_path:z.string().max(500).optional() });
const UpdateSchema = z.object({ cert_type:z.string().min(1).max(100).optional(), issued_at:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), expires_at:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), document_path:z.string().max(500).optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ user_id:z.string().uuid().optional(), expires_before:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','SAFETY_OFFICER'] as const;

export async function safetyCertificationRoutes(app: FastifyInstance): Promise<void> {
  app.post('/safety-certifications', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id: actorId, email, role } = req.jwt;
      const { user_id, cert_type, issued_at, expires_at, document_path } = body.data;
      if (document_path && !isTenantLivePath(tenant_id, document_path)) return reply.status(422).send({ error:{ code:'INVALID_STORAGE_PATH', message:'Storage path must be a live file owned by your organization', field:'document_path' } });
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO safety_certifications (tenant_id,user_id,cert_type,issued_at,expires_at,document_path,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[tenant_id,user_id,cert_type,issued_at??null,expires_at??null,document_path??null,actorId]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'safety_certification.created',actorId,actorEmail:email,actorRole:role,resourceType:'safety_certification',resourceId:rows[0].id,payload:{user_id,cert_type},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ safety_certification:item });
    }
  );
  app.get('/safety-certifications', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Invalid query'} });
      const { tenant_id } = req.jwt; const { user_id, expires_before, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1]; const conds=['deleted_at IS NULL']; let idx=2;
        if (user_id){conds.push(`user_id=$${idx++}`);params.push(user_id);}
        if (expires_before){conds.push(`expires_at<=$${idx++}`);params.push(expires_before);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM safety_certifications WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM safety_certifications WHERE ${conds.join(' AND ')} ORDER BY expires_at ASC NULLS LAST,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ safety_certifications:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/safety-certifications/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM safety_certifications WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Safety certification not found'} });
      return reply.status(200).send({ safety_certification:item });
    }
  );
  app.patch('/safety-certifications/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { cert_type, issued_at, expires_at, document_path, version } = body.data;
      if (document_path && !isTenantLivePath(tenant_id, document_path)) return reply.status(422).send({ error:{ code:'INVALID_STORAGE_PATH', message:'Storage path must be a live file owned by your organization', field:'document_path' } });
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (cert_type!==undefined){params.push(cert_type);sets.push(`cert_type=$${idx++}`);}
        if (issued_at!==undefined){params.push(issued_at);sets.push(`issued_at=$${idx++}`);}
        if (expires_at!==undefined){params.push(expires_at);sets.push(`expires_at=$${idx++}`);}
        if (document_path!==undefined){params.push(document_path);sets.push(`document_path=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE safety_certifications SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'safety_certification.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'safety_certification',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM safety_certifications WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Safety certification not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ safety_certification:result.row });
    }
  );
  app.delete('/safety-certifications/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE safety_certifications SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'safety_certification.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'safety_certification',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Safety certification not found'}});
      return reply.status(204).send();
    }
  );
}
