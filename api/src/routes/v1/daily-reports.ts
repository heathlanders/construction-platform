// routes/v1/daily-reports.ts — One report per day per project
// notes field: append-only, last-write-wins (T-13 Tier 1)
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';
import {
  publishIfActive,
  notifyCounterparty,
  buildDailyReportEventPayload,
} from '../../lib/cross-tenant/bridge.js';

const CreateSchema = z.object({ project_id:z.string().uuid(), report_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weather:z.record(z.unknown()).optional(), notes:z.string().optional() });
const UpdateSchema = z.object({ weather:z.record(z.unknown()).optional(), notes:z.string().optional(), version:z.number().int().min(1) });
const ListQ = z.object({ project_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN','FIELD_TECH'] as const;

export async function dailyReportRoutes(app: FastifyInstance): Promise<void> {
  app.post('/daily-reports', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { project_id, report_date, weather, notes } = body.data;
      const { item, connectionId } = await withTenantContext(tenant_id, async (client) => {
        let rows;
        try {
          const r = await client.query(`INSERT INTO daily_reports (tenant_id,project_id,report_date,weather,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,[tenant_id,project_id,report_date,weather?JSON.stringify(weather):null,notes??null,user_id]);
          rows = r.rows;
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'constraint' in err) throw Object.assign(new Error('A report for this date already exists'), { statusCode:409, code:'DAILY_REPORT_EXISTS' });
          throw err;
        }
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'daily_report.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'daily_report',resourceId:rows[0].id,payload:{project_id,report_date},ipAddress:req.ip});
        // Bridge mirror link: a report on a sub mirror project (projects.connection_id set)
        // auto-mirrors — the §5 daily_reports permission (checked in publishIfActive) is the consent.
        const { rows: proj } = await client.query<{ connection_id: string | null }>(
          `SELECT connection_id FROM projects WHERE id=$1 AND deleted_at IS NULL`, [project_id]);
        return { item: rows[0], connectionId: proj[0]?.connection_id ?? null };
      });

      if (connectionId) {
        const p = buildDailyReportEventPayload(item);
        const ev = await publishIfActive(connectionId, tenant_id, 'daily_report.submitted', p);
        if (ev) await notifyCounterparty(connectionId, tenant_id, 'daily_report.submitted', p);
      }
      return reply.status(201).send({ daily_report:item });
    }
  );
  app.get('/daily-reports', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'project_id required'} });
      const { tenant_id } = req.jwt; const { project_id, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,project_id]; const conds=['deleted_at IS NULL','project_id=$2']; let idx=3;
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM daily_reports WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM daily_reports WHERE ${conds.join(' AND ')} ORDER BY report_date DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ daily_reports:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/daily-reports/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM daily_reports WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Daily report not found'} });
      return reply.status(200).send({ daily_report:item });
    }
  );
  app.patch('/daily-reports/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { weather, notes, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (weather!==undefined){params.push(JSON.stringify(weather));sets.push(`weather=$${idx++}`);}
        // notes: last-write-wins (T-13 Tier 1 — append-only field)
        if (notes!==undefined){params.push(notes);sets.push(`notes=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE daily_reports SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){
          await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'daily_report.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'daily_report',resourceId:id,payload:body.data,ipAddress:req.ip});
          const { rows: proj } = await client.query<{ connection_id: string | null }>(
            `SELECT connection_id FROM projects WHERE id=$1 AND deleted_at IS NULL`, [rows[0].project_id]);
          return{row:rows[0],status:'ok',connectionId:proj[0]?.connection_id ?? null};
        }
        const{rows:c}=await client.query(`SELECT * FROM daily_reports WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:c[0]??null,status:c.length===0?'not_found':'conflict',connectionId:null};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Daily report not found'}});
      // notes are append-only last-write-wins (T-13 Tier 1) — return the current row so the
      // mobile sweep can auto-resolve by re-applying the local write at the server's version.
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'},server_record:result.row});

      // Auto-mirror the update (same gating as create; publishIfActive re-checks active + toggle).
      if (result.connectionId) {
        const p = buildDailyReportEventPayload(result.row);
        const ev = await publishIfActive(result.connectionId, tenant_id, 'daily_report.updated', p);
        if (ev) await notifyCounterparty(result.connectionId, tenant_id, 'daily_report.updated', p);
      }
      return reply.status(200).send({ daily_report:result.row });
    }
  );
  app.delete('/daily-reports/:id', { preHandler: [authenticate, requireRole('OWNER','PROJECT_MANAGER','FOREMAN')] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE daily_reports SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'daily_report.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'daily_report',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Daily report not found'}});
      return reply.status(204).send();
    }
  );
}
