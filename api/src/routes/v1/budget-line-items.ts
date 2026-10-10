// routes/v1/budget-line-items.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  cost_code_id: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  budget_cents: z.number().int().min(0).default(0),
  actual_cents: z.number().int().min(0).default(0),
  committed_amount_cents: z.number().int().min(0).default(0),
  projected_final_cents: z.number().int().min(0).default(0),
  contract_id: z.string().uuid().optional(),
  // vendor_bid_id is set by the award action — not user-settable here
});
const UpdateSchema = z.object({
  cost_code_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1).max(500).optional(),
  budget_cents: z.number().int().min(0).optional(),
  actual_cents: z.number().int().min(0).optional(),
  committed_amount_cents: z.number().int().min(0).optional(),
  projected_final_cents: z.number().int().min(0).optional(),
  contract_id: z.string().uuid().optional().nullable(),
  version: z.number().int().min(1),
});
const ListQ = z.object({ project_id: z.string().uuid(), cursor: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','ACCOUNTANT'] as const;

export async function budgetLineItemRoutes(app: FastifyInstance): Promise<void> {
  app.post('/budget-line-items', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: body.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) } });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, cost_code_id, description, budget_cents, actual_cents, committed_amount_cents, projected_final_cents, contract_id } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO budget_line_items
             (tenant_id, project_id, cost_code_id, description, budget_cents, actual_cents,
              committed_amount_cents, projected_final_cents, contract_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [tenant_id, project_id, cost_code_id ?? null, description, budget_cents, actual_cents,
           committed_amount_cents, projected_final_cents, contract_id ?? null, user_id]
        );
        await writeAuditEntry(client, { tenantId:tenant_id,category:'data',action:'budget_line_item.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'budget_line_item',resourceId:rows[0].id,payload:{project_id,description,budget_cents},ipAddress:req.ip });
        return rows[0];
      });
      return reply.status(201).send({ budget_line_item: item });
    }
  );
  app.get('/budget-line-items', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'project_id required' } });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit+1,project_id]; const conds = ['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (cursor) { conds.push(`(created_at,id)<(SELECT created_at,id FROM budget_line_items WHERE id=$${idx++})`); params.push(cursor); }
        const { rows } = await client.query(`SELECT * FROM budget_line_items WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ budget_line_items:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/budget-line-items/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id:string }; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM budget_line_items WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Budget line item not found'} });
      return reply.status(200).send({ budget_line_item:item });
    }
  );
  app.patch('/budget-line-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id:string };
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { cost_code_id,description,budget_cents,actual_cents,committed_amount_cents,projected_final_cents,contract_id,version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (cost_code_id!==undefined){params.push(cost_code_id);sets.push(`cost_code_id=$${idx++}`);}
        if (description!==undefined){params.push(description);sets.push(`description=$${idx++}`);}
        if (budget_cents!==undefined){params.push(budget_cents);sets.push(`budget_cents=$${idx++}`);}
        if (actual_cents!==undefined){params.push(actual_cents);sets.push(`actual_cents=$${idx++}`);}
        if (committed_amount_cents!==undefined){params.push(committed_amount_cents);sets.push(`committed_amount_cents=$${idx++}`);}
        if (projected_final_cents!==undefined){params.push(projected_final_cents);sets.push(`projected_final_cents=$${idx++}`);}
        if (contract_id!==undefined){params.push(contract_id);sets.push(`contract_id=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE budget_line_items SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'budget_line_item.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'budget_line_item',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM budget_line_items WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Budget line item not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict — fetch the latest and retry'}});
      return reply.status(200).send({ budget_line_item:result.row });
    }
  );
  app.delete('/budget-line-items/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id:string }; const { tenant_id,user_id,email,role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE budget_line_items SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'budget_line_item.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'budget_line_item',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Budget line item not found'}});
      return reply.status(204).send();
    }
  );
}
