// routes/v1/electrical-panels.ts — Trade module: Electrical
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ project_id:z.string().uuid(), name:z.string().min(1).max(200), amperage:z.number().int().positive().optional(), voltage:z.number().int().positive().optional(), location:z.string().max(500).optional(), notes:z.string().optional() });
const UpdateSchema = z.object({ name:z.string().min(1).max(200).optional(), amperage:z.number().int().positive().optional().nullable(), voltage:z.number().int().positive().optional().nullable(), location:z.string().max(500).optional().nullable(), notes:z.string().optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

export async function electricalPanelRoutes(app: FastifyInstance): Promise<void> {
  app.post('/electrical-panels', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, name, amperage, voltage, location, notes } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO electrical_panels (tenant_id,project_id,name,amperage,voltage,location,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[tenant_id,project_id,name,amperage??null,voltage??null,location??null,notes??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'electrical_panel.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'electrical_panel',resourceId:rows[0].id,payload:{project_id,name},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ electrical_panel:item });
    }
  );
  app.get('/electrical-panels', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM electrical_panels WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM electrical_panels WHERE ${conds.join(' AND ')} ORDER BY name ASC,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ electrical_panels:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/electrical-panels/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM electrical_panels WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Electrical panel not found'} });
      return reply.status(200).send({ electrical_panel:item });
    }
  );
  app.patch('/electrical-panels/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { name, amperage, voltage, location, notes, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (name!==undefined){params.push(name);sets.push(`name=$${idx++}`);}
        if (amperage!==undefined){params.push(amperage);sets.push(`amperage=$${idx++}`);}
        if (voltage!==undefined){params.push(voltage);sets.push(`voltage=$${idx++}`);}
        if (location!==undefined){params.push(location);sets.push(`location=$${idx++}`);}
        if (notes!==undefined){params.push(notes);sets.push(`notes=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE electrical_panels SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'electrical_panel.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'electrical_panel',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM electrical_panels WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Electrical panel not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ electrical_panel:result.row });
    }
  );
  app.delete('/electrical-panels/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE electrical_panels SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'electrical_panel.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'electrical_panel',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Electrical panel not found'}});
      return reply.status(204).send();
    }
  );
}
