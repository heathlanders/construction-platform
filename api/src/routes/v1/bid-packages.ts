// routes/v1/bid-packages.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ project_id:z.string().uuid(), title:z.string().min(1).max(500), status:z.enum(['draft','open','closed','awarded']).default('draft'), due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), schedule_task_id:z.string().uuid().optional() });
const UpdateSchema = z.object({ title:z.string().min(1).max(500).optional(), status:z.enum(['draft','open','closed','awarded']).optional(), due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), schedule_task_id:z.string().uuid().optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(['draft','open','closed','awarded']).optional() });
const W = ['OWNER','PROJECT_MANAGER','ESTIMATOR'] as const;

export async function bidPackageRoutes(app: FastifyInstance): Promise<void> {
  app.post('/bid-packages', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, status, due_date, schedule_task_id } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO bid_packages (tenant_id,project_id,title,status,due_date,schedule_task_id,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[tenant_id,project_id,title,status,due_date??null,schedule_task_id??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'bid_package.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'bid_package',resourceId:rows[0].id,payload:{project_id,title},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ bid_package:item });
    }
  );
  app.get('/bid-packages', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit, status } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM bid_packages WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM bid_packages WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ bid_packages:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/bid-packages/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM bid_packages WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Bid package not found'} });
      return reply.status(200).send({ bid_package:item });
    }
  );
  app.patch('/bid-packages/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { title, status, due_date, schedule_task_id, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (title!==undefined){params.push(title);sets.push(`title=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        if (due_date!==undefined){params.push(due_date);sets.push(`due_date=$${idx++}`);}
        if (schedule_task_id!==undefined){params.push(schedule_task_id);sets.push(`schedule_task_id=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE bid_packages SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'bid_package.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'bid_package',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM bid_packages WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Bid package not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ bid_package:result.row });
    }
  );
  app.delete('/bid-packages/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE bid_packages SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'bid_package.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'bid_package',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Bid package not found'}});
      return reply.status(204).send();
    }
  );
}
