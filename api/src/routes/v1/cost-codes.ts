// routes/v1/cost-codes.ts — Cost code library (tenant-scoped, no project_id)
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ code:z.string().min(1).max(20), name:z.string().min(1).max(255), category:z.string().max(100).optional() });
const UpdateSchema = z.object({ code:z.string().min(1).max(20).optional(), name:z.string().min(1).max(255).optional(), category:z.string().max(100).optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(50), category:z.string().optional() });
const W = ['OWNER','PROJECT_MANAGER','ESTIMATOR','ACCOUNTANT'] as const;

export async function costCodeRoutes(app: FastifyInstance): Promise<void> {
  app.post('/cost-codes', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { code, name, category } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        let rows;
        try {
          const r = await client.query(`INSERT INTO cost_codes (tenant_id,code,name,category,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,[tenant_id,code,name,category??null,user_id]);
          rows = r.rows;
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'constraint' in err) throw Object.assign(new Error('Cost code already exists'), { statusCode:409, code:'COST_CODE_ALREADY_EXISTS' });
          throw err;
        }
        await writeAuditEntry(client, {tenantId:tenant_id,category:'data',action:'cost_code.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'cost_code',resourceId:rows[0].id,payload:{code,name},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ cost_code: item });
    }
  );
  app.get('/cost-codes', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Invalid query'} });
      const { tenant_id } = req.jwt; const { cursor, limit, category } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1]; const conds=['deleted_at IS NULL']; let idx=2;
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM cost_codes WHERE id=$${idx++})`);params.push(cursor);}
        if (category){conds.push(`category=$${idx++}`);params.push(category);}
        const { rows } = await client.query(`SELECT * FROM cost_codes WHERE ${conds.join(' AND ')} ORDER BY code ASC,id ASC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ cost_codes:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/cost-codes/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM cost_codes WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Cost code not found'} });
      return reply.status(200).send({ cost_code:item });
    }
  );
  app.patch('/cost-codes/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { code, name, category, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (code!==undefined){params.push(code);sets.push(`code=$${idx++}`);}
        if (name!==undefined){params.push(name);sets.push(`name=$${idx++}`);}
        if (category!==undefined){params.push(category);sets.push(`category=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE cost_codes SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'cost_code.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'cost_code',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM cost_codes WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Cost code not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ cost_code:result.row });
    }
  );
  app.delete('/cost-codes/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE cost_codes SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'cost_code.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'cost_code',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Cost code not found'}});
      return reply.status(204).send();
    }
  );
}
