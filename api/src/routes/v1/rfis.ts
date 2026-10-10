// routes/v1/rfis.ts — Request for Information CRUD
// number auto-assigned sequentially per project
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import {
  validateConnectionMembership,
  publishIfActive,
  buildRfiEventPayload,
  notifyCounterparty,
} from '../../lib/cross-tenant/bridge.js';

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  subject: z.string().min(1).max(500),
  status: z.enum(['draft','open','answered','closed']).default('draft'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  assignee_id: z.string().uuid().optional(),
  connection_id: z.string().uuid().optional(), // share with a connected Sub (cross-tenant bridge)
});
const UpdateSchema = z.object({
  subject: z.string().min(1).max(500).optional(),
  status: z.enum(['draft','open','answered','closed']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  version: z.number().int().min(1),
});
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(['draft','open','answered','closed']).optional() });
const W = ['OWNER','PROJECT_MANAGER','ESTIMATOR','FOREMAN'] as const;

export async function rfiRoutes(app: FastifyInstance): Promise<void> {
  app.post('/rfis', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, subject, status, due_date, assignee_id, connection_id } = body.data;

      // Cross-tenant share (T-45): if a connection is named, the caller MUST be the GC side
      // of an ACTIVE connection. Validated before the write so a bad connection_id never persists.
      if (connection_id !== undefined) {
        const conn = await validateConnectionMembership(connection_id, tenant_id);
        if (!conn || conn.gc_tenant_id !== tenant_id) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not the GC of this connection' } });
        }
        if (conn.status !== 'active') {
          return reply.status(409).send({ error: { code: 'CONNECTION_NOT_ACTIVE', message: 'Connection must be active to share an RFI' } });
        }
      }

      const rfi = await withTenantContext(tenant_id, async (client) => {
        // Auto-assign sequential number within project (same transaction — safe under RLS)
        const { rows: numRows } = await client.query(`SELECT COALESCE(MAX(number),0)+1 AS next FROM rfis WHERE project_id=$1 AND tenant_id=$2`,[project_id,tenant_id]);
        const number = numRows[0].next;
        const { rows } = await client.query(`INSERT INTO rfis (tenant_id,project_id,number,subject,status,due_date,assignee_id,connection_id,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[tenant_id,project_id,number,subject,status,due_date??null,assignee_id??null,connection_id??null,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'rfi.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'rfi',resourceId:rows[0].id,payload:{project_id,number,subject},ipAddress:req.ip});
        return rows[0];
      });

      // Mirror to the bridge AFTER the RFI is committed — whitelisted payload only (rules 11–13).
      if (connection_id !== undefined) {
        const p = buildRfiEventPayload(rfi);
        const ev = await publishIfActive(connection_id, tenant_id, 'rfi.created', p);
        if (ev) await notifyCounterparty(connection_id, tenant_id, 'rfi.created', p);
      }

      return reply.status(201).send({ rfi });
    }
  );
  app.get('/rfis', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit, status } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM rfis WHERE id=$${idx++})`);params.push(cursor);}
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        const { rows } = await client.query(`SELECT * FROM rfis WHERE ${conds.join(' AND ')} ORDER BY number ASC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ rfis:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/rfis/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM rfis WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'RFI not found'} });
      return reply.status(200).send({ rfi:item });
    }
  );
  app.patch('/rfis/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { subject, status, due_date, assignee_id, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (subject!==undefined){params.push(subject);sets.push(`subject=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        if (due_date!==undefined){params.push(due_date);sets.push(`due_date=$${idx++}`);}
        if (assignee_id!==undefined){params.push(assignee_id);sets.push(`assignee_id=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE rfis SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'rfi.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'rfi',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM rfis WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'RFI not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      // Re-mirror a shared RFI so the connected Sub sees the GC's status/subject change.
      if(result.row.connection_id){const p=buildRfiEventPayload(result.row);const ev=await publishIfActive(result.row.connection_id,tenant_id,'rfi.updated',p);if(ev)await notifyCounterparty(result.row.connection_id,tenant_id,'rfi.updated',p);}
      return reply.status(200).send({ rfi:result.row });
    }
  );
  app.delete('/rfis/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE rfis SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'rfi.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'rfi',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'RFI not found'}});
      return reply.status(204).send();
    }
  );
}
