// routes/v1/jsa-records.ts — Job Safety Analysis records (T-13 Tier 3)
// attendees and hazards stored as JSONB arrays
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const AttendeeSchema = z.object({ user_id:z.string().uuid().optional(), name:z.string().min(1), signature_at:z.string().datetime().optional() });
// Hazards may come from a Trade Knowledge Pack suggestion (GET /v1/trades/hazards): keep its provenance
// (osha_ref, hazard_id, pack_version) so the record shows where the hazard text came from.
const HazardSchema = z.object({
  description:z.string().min(1), controls:z.string().optional(), severity:z.enum(['low','medium','high','critical']).optional(),
  osha_ref:z.string().max(40).optional(), hazard_id:z.string().max(80).optional(), pack_version:z.string().max(20).optional(),
  source:z.enum(['pack','manual']).optional(), ppe:z.array(z.string().max(60)).max(12).optional(),
});
const CreateSchema = z.object({ project_id:z.string().uuid(), title:z.string().min(1).max(500), conducted_at:z.string().datetime(), attendees:z.array(AttendeeSchema).optional().default([]), hazards:z.array(HazardSchema).optional().default([]) });
const UpdateSchema = z.object({ title:z.string().min(1).max(500).optional(), conducted_at:z.string().datetime().optional(), attendees:z.array(AttendeeSchema).optional(), hazards:z.array(HazardSchema).optional(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','SAFETY_OFFICER','FOREMAN'] as const;

export async function jsaRecordRoutes(app: FastifyInstance): Promise<void> {
  app.post('/jsa-records', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, conducted_at, attendees, hazards } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO jsa_records (tenant_id,project_id,title,conducted_at,attendees,hazards,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[tenant_id,project_id,title,conducted_at,JSON.stringify(attendees),JSON.stringify(hazards),user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'jsa_record.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'jsa_record',resourceId:rows[0].id,payload:{project_id,title,conducted_at},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ jsa_record:item });
    }
  );
  app.get('/jsa-records', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM jsa_records WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM jsa_records WHERE ${conds.join(' AND ')} ORDER BY conducted_at DESC,created_at DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ jsa_records:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/jsa-records/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM jsa_records WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'JSA record not found'} });
      return reply.status(200).send({ jsa_record:item });
    }
  );
  app.patch('/jsa-records/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { title, conducted_at, attendees, hazards, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (title!==undefined){params.push(title);sets.push(`title=$${idx++}`);}
        if (conducted_at!==undefined){params.push(conducted_at);sets.push(`conducted_at=$${idx++}`);}
        if (attendees!==undefined){params.push(JSON.stringify(attendees));sets.push(`attendees=$${idx++}`);}
        if (hazards!==undefined){params.push(JSON.stringify(hazards));sets.push(`hazards=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE jsa_records SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'jsa_record.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'jsa_record',resourceId:id,payload:{title,conducted_at},ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM jsa_records WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'JSA record not found'}});
      // T-13 Tier 3: safety-critical conflict
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict. This safety record is blocked — a Safety Officer must review and resolve before changes can be saved.'}});
      return reply.status(200).send({ jsa_record:result.row });
    }
  );
  app.delete('/jsa-records/:id', { preHandler: [authenticate, requireRole('OWNER','PROJECT_MANAGER','SAFETY_OFFICER')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE jsa_records SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'jsa_record.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'jsa_record',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'JSA record not found'}});
      return reply.status(204).send();
    }
  );
}
