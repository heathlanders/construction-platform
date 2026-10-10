// routes/v1/safety-incidents.ts — T-13 Tier 3: PATCH conflicts block until Safety Officer resolves
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const SEVERITIES = ['near_miss','first_aid','recordable','lost_time','fatality'] as const;
const STATUSES = ['open','under_investigation','closed'] as const;
const CreateSchema = z.object({ project_id:z.string().uuid(), incident_date:z.string().datetime(), description:z.string().min(1), severity:z.enum(SEVERITIES), status:z.enum(STATUSES).default('open') });
const UpdateSchema = z.object({ description:z.string().min(1).optional(), severity:z.enum(SEVERITIES).optional(), status:z.enum(STATUSES).optional(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(STATUSES).optional() });
const W = ['OWNER','PROJECT_MANAGER','SAFETY_OFFICER','FOREMAN'] as const;

export async function safetyIncidentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/safety-incidents', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, incident_date, description, severity, status } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO safety_incidents (tenant_id,project_id,incident_date,description,severity,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[tenant_id,project_id,incident_date,description,severity,status,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'safety_incident.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'safety_incident',resourceId:rows[0].id,payload:{project_id,incident_date,severity},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ safety_incident:item });
    }
  );
  app.get('/safety-incidents', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit, status } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM safety_incidents WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM safety_incidents WHERE ${conds.join(' AND ')} ORDER BY incident_date DESC,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ safety_incidents:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/safety-incidents/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM safety_incidents WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Safety incident not found'} });
      return reply.status(200).send({ safety_incident:item });
    }
  );
  app.patch('/safety-incidents/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { description, severity, status, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (description!==undefined){params.push(description);sets.push(`description=$${idx++}`);}
        if (severity!==undefined){params.push(severity);sets.push(`severity=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE safety_incidents SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'safety_incident.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'safety_incident',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT * FROM safety_incidents WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:c[0]??null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Safety incident not found'}});
      // T-13 Tier 3: safety-critical conflict must be resolved by a Safety Officer before retrying
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict. This safety record is blocked — a Safety Officer must review and resolve before changes can be saved.'},server_record:result.row});
      return reply.status(200).send({ safety_incident:result.row });
    }
  );
  app.delete('/safety-incidents/:id', { preHandler: [authenticate, requireRole('OWNER','PROJECT_MANAGER','SAFETY_OFFICER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE safety_incidents SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'safety_incident.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'safety_incident',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Safety incident not found'}});
      return reply.status(204).send();
    }
  );
}
