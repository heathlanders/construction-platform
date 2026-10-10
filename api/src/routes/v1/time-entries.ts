// routes/v1/time-entries.ts — Labor time tracking
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import { sendJob } from '../../lib/queue.js';

const CreateSchema = z.object({ project_id:z.string().uuid().optional().nullable(), user_id:z.string().uuid().optional(), date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), hours_worked:z.number().min(0.25).max(24), cost_code_id:z.string().uuid().optional(), notes:z.string().optional(), budget_line_item_id:z.string().uuid().optional(), hourly_rate_cents:z.number().int().min(0).optional() });
// Roles that may log time FOR ANOTHER user. Field techs may log only for themselves.
const MANAGER_ROLES = ['OWNER','PROJECT_MANAGER','FOREMAN','ACCOUNTANT'];
const UpdateSchema = z.object({ hours_worked:z.number().min(0.25).max(24).optional(), cost_code_id:z.string().uuid().optional().nullable(), notes:z.string().optional().nullable(), budget_line_item_id:z.string().uuid().optional().nullable(), hourly_rate_cents:z.number().int().min(0).optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid().optional(), user_id:z.string().uuid().optional(), date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) }).refine(d=>d.project_id||d.user_id,{message:'project_id or user_id required'});
// FIELD_TECH included so hourly employees can log their own time (self-only, enforced below).
const W = ['OWNER','PROJECT_MANAGER','FOREMAN','ACCOUNTANT','FIELD_TECH'] as const;

export async function timeEntryRoutes(app: FastifyInstance): Promise<void> {
  app.post('/time-entries', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id: actorId, email, role } = req.jwt;
      const { project_id, user_id, date, hours_worked, cost_code_id, notes, budget_line_item_id, hourly_rate_cents } = body.data;
      // Non-managers (field techs) may only log for themselves; managers may log for anyone.
      const isManager = MANAGER_ROLES.includes(role);
      if (!isManager && user_id && user_id !== actorId) {
        return reply.status(403).send({ error:{ code:'FORBIDDEN', message:'You can only log time for yourself.' } });
      }
      const targetUserId = isManager ? (user_id ?? actorId) : actorId;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO time_entries
             (tenant_id,project_id,user_id,date,hours_worked,cost_code_id,notes,
              budget_line_item_id,hourly_rate_cents,created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [tenant_id,project_id??null,targetUserId,date,hours_worked,cost_code_id??null,notes??null,
           budget_line_item_id??null,hourly_rate_cents??null,actorId]
        );
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'time_entry.created',actorId,actorEmail:email,actorRole:role,resourceType:'time_entry',resourceId:rows[0].id,payload:{project_id:project_id??null,user_id:targetUserId,date,hours_worked},ipAddress:req.ip});
        return rows[0];
      });
      // Dispatch field_cost_rollup if time entry is linked to a budget line item
      if (item.budget_line_item_id) {
        await sendJob('reconciliation.field_cost_rollup', tenant_id, {
          budget_line_item_id: item.budget_line_item_id,
          project_id,
        });
      }
      return reply.status(201).send({ time_entry:item });
    }
  );
  app.get('/time-entries', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:q.error.errors[0]?.message??'project_id or user_id required'} });
      const { tenant_id } = req.jwt; const { project_id, user_id, date, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1]; const conds=['deleted_at IS NULL']; let idx=2;
        if (project_id){conds.push(`project_id=$${idx++}`);params.push(project_id);}
        if (user_id){conds.push(`user_id=$${idx++}`);params.push(user_id);}
        if (date){conds.push(`date=$${idx++}`);params.push(date);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM time_entries WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM time_entries WHERE ${conds.join(' AND ')} ORDER BY date DESC,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ time_entries:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/time-entries/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM time_entries WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Time entry not found'} });
      return reply.status(200).send({ time_entry:item });
    }
  );
  app.patch('/time-entries/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { hours_worked, cost_code_id, notes, budget_line_item_id, hourly_rate_cents, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (hours_worked!==undefined){params.push(hours_worked);sets.push(`hours_worked=$${idx++}`);}
        if (cost_code_id!==undefined){params.push(cost_code_id);sets.push(`cost_code_id=$${idx++}`);}
        if (notes!==undefined){params.push(notes);sets.push(`notes=$${idx++}`);}
        if (budget_line_item_id!==undefined){params.push(budget_line_item_id);sets.push(`budget_line_item_id=$${idx++}`);}
        if (hourly_rate_cents!==undefined){params.push(hourly_rate_cents);sets.push(`hourly_rate_cents=$${idx++}`);}
        params.push(id,version);
        // Field techs may only edit their own entries; managers may edit any.
        let ownGuard=''; if(!MANAGER_ROLES.includes(role)){params.push(user_id);ownGuard=` AND user_id=$${idx+2}`;}
        const { rows } = await client.query(`UPDATE time_entries SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL${ownGuard} RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'time_entry.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'time_entry',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT * FROM time_entries WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:c[0]??null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Time entry not found'}});
      // T-13/T-14: return the current server row so the client can render a side-by-side resolve UI.
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'},server_record:result.row});
      // Dispatch field_cost_rollup if hours or rate changed and entry is linked to a budget line item
      if (result.row && (hours_worked !== undefined || hourly_rate_cents !== undefined) && result.row.budget_line_item_id) {
        await sendJob('reconciliation.field_cost_rollup', tenant_id, {
          budget_line_item_id: result.row.budget_line_item_id,
          project_id: result.row.project_id,
        });
      }
      return reply.status(200).send({ time_entry:result.row });
    }
  );
  app.delete('/time-entries/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        // Field techs may only delete their own entries; managers may delete any.
        const own = MANAGER_ROLES.includes(role) ? '' : ' AND user_id=$2';
        const params = own ? [id, user_id] : [id];
        const { rows } = await client.query(`UPDATE time_entries SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL${own} RETURNING id`,params);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'time_entry.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'time_entry',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Time entry not found'}});
      return reply.status(204).send();
    }
  );
}
