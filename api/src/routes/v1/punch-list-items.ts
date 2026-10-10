// routes/v1/punch-list-items.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ project_id:z.string().uuid(), title:z.string().min(1).max(500), description:z.string().optional(), status:z.enum(['open','in_progress','complete']).default('open'), assigned_to:z.string().uuid().optional(), due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });
const UpdateSchema = z.object({ title:z.string().min(1).max(500).optional(), description:z.string().optional().nullable(), status:z.enum(['open','in_progress','complete']).optional(), assigned_to:z.string().uuid().optional().nullable(), due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(['open','in_progress','complete']).optional(), assigned_to:z.string().uuid().optional() });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

export async function punchListItemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/punch-list-items', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, description, status, assigned_to, due_date } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO punch_list_items (tenant_id,project_id,title,description,status,assigned_to,due_date,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[tenant_id,project_id,title,description??null,status,assigned_to??null,due_date??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'punch_list_item.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'punch_list_item',resourceId:rows[0].id,payload:{project_id,title,status},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ punch_list_item:item });
    }
  );
  app.get('/punch-list-items', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit, status, assigned_to } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (assigned_to){conds.push(`assigned_to=$${idx++}`);params.push(assigned_to);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM punch_list_items WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM punch_list_items WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ punch_list_items:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/punch-list-items/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM punch_list_items WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Punch list item not found'} });
      return reply.status(200).send({ punch_list_item:item });
    }
  );
  app.patch('/punch-list-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { title, description, status, assigned_to, due_date, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (title!==undefined){params.push(title);sets.push(`title=$${idx++}`);}
        if (description!==undefined){params.push(description);sets.push(`description=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        if (assigned_to!==undefined){params.push(assigned_to);sets.push(`assigned_to=$${idx++}`);}
        if (due_date!==undefined){params.push(due_date);sets.push(`due_date=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE punch_list_items SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'punch_list_item.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'punch_list_item',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT * FROM punch_list_items WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:c[0]??null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Punch list item not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'},server_record:result.row});
      return reply.status(200).send({ punch_list_item:result.row });
    }
  );
  app.delete('/punch-list-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE punch_list_items SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'punch_list_item.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'punch_list_item',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Punch list item not found'}});
      return reply.status(204).send();
    }
  );
}
