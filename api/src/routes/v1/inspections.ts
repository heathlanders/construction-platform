// routes/v1/inspections.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ project_id:z.string().uuid(), title:z.string().min(1).max(500), inspection_date:z.string().datetime().optional(), status:z.enum(['scheduled','passed','failed','requires_action']).default('scheduled'), notes:z.string().optional(), permit_id:z.string().uuid().optional(), trade_type:z.string().max(50).optional(), inspection_type:z.string().max(50).optional(), sequence_order:z.number().int().min(1).optional(), inspector_name:z.string().max(200).optional() });
const UpdateSchema = z.object({ title:z.string().min(1).max(500).optional(), inspection_date:z.string().datetime().optional().nullable(), status:z.enum(['scheduled','passed','failed','requires_action']).optional(), notes:z.string().optional().nullable(), version:z.number().int().min(1), inspector_name:z.string().max(200).optional().nullable(), correction_notice:z.string().optional().nullable(), result:z.enum(['pass','fail','partial']).optional().nullable() });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(['scheduled','passed','failed','requires_action']).optional(), permit_id:z.string().uuid().optional(), trade_type:z.string().max(50).optional() });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN','SAFETY_OFFICER'] as const;

export async function inspectionRoutes(app: FastifyInstance): Promise<void> {
  app.post('/inspections', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, inspection_date, status, notes, permit_id, trade_type, inspection_type, sequence_order, inspector_name } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        // Validate permit_id belongs to same tenant if provided
        if (permit_id) {
          const { rows: pr } = await client.query(`SELECT id FROM permits WHERE id=$1 AND deleted_at IS NULL`,[permit_id]);
          if (pr.length===0) return null;
        }
        const { rows } = await client.query(`INSERT INTO inspections (tenant_id,project_id,title,inspection_date,status,notes,permit_id,trade_type,inspection_type,sequence_order,inspector_name,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[tenant_id,project_id,title,inspection_date??null,status,notes??null,permit_id??null,trade_type??null,inspection_type??null,sequence_order??null,inspector_name??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'inspection.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'inspection',resourceId:rows[0].id,payload:{project_id,title,status},ipAddress:req.ip});
        return rows[0];
      });
      if (!item) return reply.status(422).send({error:{code:'INVALID_PERMIT',message:'Permit not found or does not belong to this tenant'}});
      return reply.status(201).send({ inspection:item });
    }
  );
  app.get('/inspections', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit, status, permit_id, trade_type } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (permit_id){conds.push(`permit_id=$${idx++}`);params.push(permit_id);}
        if (trade_type==='general'){conds.push('trade_type IS NULL');}
        else if (trade_type){conds.push(`trade_type=$${idx++}`);params.push(trade_type);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM inspections WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM inspections WHERE ${conds.join(' AND ')} ORDER BY sequence_order ASC NULLS LAST,inspection_date DESC NULLS LAST,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ inspections:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/inspections/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM inspections WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Inspection not found'} });
      return reply.status(200).send({ inspection:item });
    }
  );
  app.patch('/inspections/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { title, inspection_date, status, notes, version, inspector_name, correction_notice, result: ahj_result } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (title!==undefined){params.push(title);sets.push(`title=$${idx++}`);}
        if (inspection_date!==undefined){params.push(inspection_date);sets.push(`inspection_date=$${idx++}`);}
        if (notes!==undefined){params.push(notes);sets.push(`notes=$${idx++}`);}
        if (inspector_name!==undefined){params.push(inspector_name);sets.push(`inspector_name=$${idx++}`);}
        if (correction_notice!==undefined){params.push(correction_notice);sets.push(`correction_notice=$${idx++}`);}
        if (ahj_result!==undefined){
          params.push(ahj_result);sets.push(`result=$${idx++}`);
          // Sync status from AHJ result
          const syncStatus = ahj_result==='pass'?'passed':ahj_result==='fail'?'failed':ahj_result==='partial'?'requires_action':null;
          if (syncStatus&&status===undefined){params.push(syncStatus);sets.push(`status=$${idx++}`);}
        }
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE inspections SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'inspection.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'inspection',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM inspections WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Inspection not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ inspection:result.row });
    }
  );
  app.delete('/inspections/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE inspections SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'inspection.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'inspection',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Inspection not found'}});
      return reply.status(204).send();
    }
  );
}
