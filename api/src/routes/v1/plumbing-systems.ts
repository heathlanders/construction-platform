// routes/v1/plumbing-systems.ts — Trade module: Plumbing
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const SYSTEM_TYPES = ['supply','drain','gas','fire'] as const;
const CreateSchema = z.object({ project_id:z.string().uuid(), name:z.string().min(1).max(200), system_type:z.enum(SYSTEM_TYPES).optional(), notes:z.string().optional() });
const UpdateSchema = z.object({ name:z.string().min(1).max(200).optional(), system_type:z.enum(SYSTEM_TYPES).optional().nullable(), notes:z.string().optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), system_type:z.enum(SYSTEM_TYPES).optional(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

export async function plumbingSystemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/plumbing-systems', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, name, system_type, notes } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO plumbing_systems (tenant_id,project_id,name,system_type,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,[tenant_id,project_id,name,system_type??null,notes??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'plumbing_system.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'plumbing_system',resourceId:rows[0].id,payload:{project_id,name,system_type},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ plumbing_system:item });
    }
  );
  app.get('/plumbing-systems', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, system_type, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (system_type){conds.push(`system_type=$${idx++}`);params.push(system_type);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM plumbing_systems WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM plumbing_systems WHERE ${conds.join(' AND ')} ORDER BY name ASC,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ plumbing_systems:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/plumbing-systems/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM plumbing_systems WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Plumbing system not found'} });
      return reply.status(200).send({ plumbing_system:item });
    }
  );
  app.patch('/plumbing-systems/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { name, system_type, notes, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (name!==undefined){params.push(name);sets.push(`name=$${idx++}`);}
        if (system_type!==undefined){params.push(system_type);sets.push(`system_type=$${idx++}`);}
        if (notes!==undefined){params.push(notes);sets.push(`notes=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE plumbing_systems SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'plumbing_system.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'plumbing_system',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM plumbing_systems WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Plumbing system not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ plumbing_system:result.row });
    }
  );
  app.delete('/plumbing-systems/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE plumbing_systems SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'plumbing_system.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'plumbing_system',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Plumbing system not found'}});
      return reply.status(204).send();
    }
  );
}
