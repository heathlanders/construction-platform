// routes/v1/plumbing-fixtures.ts — Trade module: Plumbing
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const FIXTURE_TYPES = ['toilet','sink','shower','bathtub','hose_bib','floor_drain','water_heater','dishwasher','washing_machine','other'] as const;
const STATUSES = ['planned','rough_in','trimmed','complete'] as const;
const CreateSchema = z.object({ system_id:z.string().uuid(), fixture_type:z.enum(FIXTURE_TYPES).optional(), location:z.string().max(500).optional(), status:z.enum(STATUSES).default('planned') });
const UpdateSchema = z.object({ fixture_type:z.enum(FIXTURE_TYPES).optional().nullable(), location:z.string().max(500).optional().nullable(), status:z.enum(STATUSES).optional(), version:z.number().int().min(1) });
const ListQ = z.object({ system_id:z.string().uuid(), status:z.enum(STATUSES).optional(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20) });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

export async function plumbingFixtureRoutes(app: FastifyInstance): Promise<void> {
  app.post('/plumbing-fixtures', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { system_id, fixture_type, location, status } = body.data;
      const item = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`INSERT INTO plumbing_fixtures (tenant_id,system_id,fixture_type,location,status,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,[tenant_id,system_id,fixture_type??null,location??null,status,user_id]);
        await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'plumbing_fixture.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'plumbing_fixture',resourceId:rows[0].id,payload:{system_id,fixture_type,status},ipAddress:req.ip});
        return rows[0];
      });
      return reply.status(201).send({ plumbing_fixture:item });
    }
  );
  app.get('/plumbing-fixtures', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'system_id required'} });
      const { tenant_id } = req.jwt; const { system_id, status, cursor, limit } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,system_id]; const conds=['deleted_at IS NULL','system_id=$2']; let idx=3;
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (cursor){conds.push(`(created_at,id)<(SELECT created_at,id FROM plumbing_fixtures WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM plumbing_fixtures WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ plumbing_fixtures:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/plumbing-fixtures/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM plumbing_fixtures WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Plumbing fixture not found'} });
      return reply.status(200).send({ plumbing_fixture:item });
    }
  );
  app.patch('/plumbing-fixtures/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { fixture_type, location, status, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (fixture_type!==undefined){params.push(fixture_type);sets.push(`fixture_type=$${idx++}`);}
        if (location!==undefined){params.push(location);sets.push(`location=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE plumbing_fixtures SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'plumbing_fixture.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'plumbing_fixture',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM plumbing_fixtures WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Plumbing fixture not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ plumbing_fixture:result.row });
    }
  );
  app.delete('/plumbing-fixtures/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE plumbing_fixtures SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'plumbing_fixture.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'plumbing_fixture',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Plumbing fixture not found'}});
      return reply.status(204).send();
    }
  );
}
