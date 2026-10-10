// routes/v1/submittals.ts — Submittal CRUD (number auto-assigned per project)
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import {
  validateConnectionMembership,
  publishIfActive,
  buildSubmittalEventPayload,
  notifyCounterparty,
} from '../../lib/cross-tenant/bridge.js';

const STATUSES = ['draft','submitted','under_review','approved','approved_as_noted','rejected','resubmit'] as const;
const CreateSchema = z.object({ project_id:z.string().uuid(), title:z.string().min(1).max(500), status:z.enum(STATUSES).default('draft'), spec_section:z.string().max(20).optional(), connection_id:z.string().uuid().optional() });
const UpdateSchema = z.object({ title:z.string().min(1).max(500).optional(), status:z.enum(STATUSES).optional(), spec_section:z.string().max(20).optional().nullable(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(STATUSES).optional() });
const W = ['OWNER','PROJECT_MANAGER','ESTIMATOR'] as const;

export async function submittalRoutes(app: FastifyInstance): Promise<void> {
  app.post('/submittals', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, title, status, spec_section, connection_id } = body.data;

      if (connection_id !== undefined) {
        const conn = await validateConnectionMembership(connection_id, tenant_id);
        if (!conn || conn.gc_tenant_id !== tenant_id) return reply.status(403).send({ error:{code:'FORBIDDEN',message:'Not the GC of this connection'} });
        if (conn.status !== 'active') return reply.status(409).send({ error:{code:'CONNECTION_NOT_ACTIVE',message:'Connection must be active to share a submittal'} });
      }

      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows: numRows } = await client.query(`SELECT COALESCE(MAX(number),0)+1 AS next FROM submittals WHERE project_id=$1 AND tenant_id=$2`,[project_id,tenant_id]);
        const { rows } = await client.query(`INSERT INTO submittals (tenant_id,project_id,number,title,status,spec_section,connection_id,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[tenant_id,project_id,numRows[0].next,title,status,spec_section??null,connection_id??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'submittal.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'submittal',resourceId:rows[0].id,payload:{project_id,number:numRows[0].next,title},ipAddress:req.ip});
        return rows[0];
      });

      if (connection_id !== undefined) {
        const p = buildSubmittalEventPayload(item);
        const ev = await publishIfActive(connection_id, tenant_id, 'submittal.created', p);
        if (ev) await notifyCounterparty(connection_id, tenant_id, 'submittal.created', p);
      }

      return reply.status(201).send({ submittal:item });
    }
  );
  app.get('/submittals', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit, status } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM submittals WHERE id=$${idx++})`);params.push(cursor);}
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        const { rows } = await client.query(`SELECT * FROM submittals WHERE ${conds.join(' AND ')} ORDER BY number ASC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ submittals:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/submittals/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM submittals WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Submittal not found'} });
      return reply.status(200).send({ submittal:item });
    }
  );
  app.patch('/submittals/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { title, status, spec_section, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (title!==undefined){params.push(title);sets.push(`title=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        if (spec_section!==undefined){params.push(spec_section);sets.push(`spec_section=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE submittals SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'submittal.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'submittal',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM submittals WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Submittal not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      if(result.row.connection_id){const p=buildSubmittalEventPayload(result.row);const ev=await publishIfActive(result.row.connection_id,tenant_id,'submittal.updated',p);if(ev)await notifyCounterparty(result.row.connection_id,tenant_id,'submittal.updated',p);}
      return reply.status(200).send({ submittal:result.row });
    }
  );
  app.delete('/submittals/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE submittals SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'submittal.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'submittal',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Submittal not found'}});
      return reply.status(204).send();
    }
  );
}
