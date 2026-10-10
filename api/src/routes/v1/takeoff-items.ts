// routes/v1/takeoff-items.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ project_id:z.string().uuid(), bid_package_id:z.string().uuid().optional(), description:z.string().min(1), quantity:z.number().min(0), unit:z.string().max(20).optional(), unit_cost_cents:z.number().int().min(0).default(0) });
const UpdateSchema = z.object({ description:z.string().min(1).optional(), quantity:z.number().min(0).optional(), unit:z.string().max(20).optional().nullable(), unit_cost_cents:z.number().int().min(0).optional(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), bid_package_id:z.string().uuid().optional(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','ESTIMATOR'] as const;

export async function takeoffItemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/takeoff-items', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, bid_package_id, description, quantity, unit, unit_cost_cents } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO takeoff_items (tenant_id,project_id,bid_package_id,description,quantity,unit,unit_cost_cents,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[tenant_id,project_id,bid_package_id??null,description,quantity,unit??null,unit_cost_cents,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'takeoff_item.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'takeoff_item',resourceId:rows[0].id,payload:{project_id,bid_package_id,description},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ takeoff_item:item });
    }
  );
  app.get('/takeoff-items', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, bid_package_id, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (bid_package_id){conds.push(`bid_package_id=$${idx++}`);params.push(bid_package_id);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM takeoff_items WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM takeoff_items WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ takeoff_items:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/takeoff-items/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM takeoff_items WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Takeoff item not found'} });
      return reply.status(200).send({ takeoff_item:item });
    }
  );
  app.patch('/takeoff-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { description, quantity, unit, unit_cost_cents, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (description!==undefined){params.push(description);sets.push(`description=$${idx++}`);}
        if (quantity!==undefined){params.push(quantity);sets.push(`quantity=$${idx++}`);}
        if (unit!==undefined){params.push(unit);sets.push(`unit=$${idx++}`);}
        if (unit_cost_cents!==undefined){params.push(unit_cost_cents);sets.push(`unit_cost_cents=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE takeoff_items SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'takeoff_item.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'takeoff_item',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM takeoff_items WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Takeoff item not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ takeoff_item:result.row });
    }
  );
  app.delete('/takeoff-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE takeoff_items SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'takeoff_item.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'takeoff_item',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Takeoff item not found'}});
      return reply.status(204).send();
    }
  );
}
