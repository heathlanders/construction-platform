// routes/v1/electrical-circuits.ts — Trade module: Electrical
// circuit_number unique per panel (enforced by DB unique index)
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { writeAuditEntry } from '../../lib/audit-log.js';
import { authenticate, requireRole } from '../../plugins/auth-plugin.js';

const CreateSchema = z.object({ panel_id:z.string().uuid(), circuit_number:z.number().int().positive(), description:z.string().optional(), amperage:z.number().int().positive().optional(), status:z.enum(['planned','roughed_in','complete']).default('planned') });
const UpdateSchema = z.object({ description:z.string().optional().nullable(), amperage:z.number().int().positive().optional().nullable(), status:z.enum(['planned','roughed_in','complete']).optional(), version:z.number().int().min(1) });
const ListQ = z.object({ panel_id:z.string().uuid(), cursor:z.string().uuid().optional(), limit:z.coerce.number().int().min(1).max(100).default(20), status:z.enum(['planned','roughed_in','complete']).optional() });
const W = ['OWNER','PROJECT_MANAGER','FOREMAN'] as const;

export async function electricalCircuitRoutes(app: FastifyInstance): Promise<void> {
  app.post('/electrical-circuits', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = CreateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt;
      const { panel_id, circuit_number, description, amperage, status } = body.data;
      try {
        const item = await withTenantContext(tenant_id, async (client) => {
          const { rows } = await client.query(`INSERT INTO electrical_circuits (tenant_id,panel_id,circuit_number,description,amperage,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[tenant_id,panel_id,circuit_number,description??null,amperage??null,status,user_id]);
          await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'electrical_circuit.created',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'electrical_circuit',resourceId:rows[0].id,payload:{panel_id,circuit_number},ipAddress:req.ip});
          return rows[0];
        });
        return reply.status(201).send({ electrical_circuit:item });
      } catch(err:unknown) {
        if((err as {code?:string}).code==='23505')return reply.status(409).send({error:{code:'CIRCUIT_NUMBER_EXISTS',message:`Circuit ${circuit_number} already exists in this panel`}});
        throw err;
      }
    }
  );
  app.get('/electrical-circuits', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'panel_id required'} });
      const { tenant_id } = req.jwt; const { panel_id, cursor, limit, status } = q.data;
      const items = await withTenantContext(tenant_id, async (client) => {
        const params:unknown[]=[limit+1,panel_id]; const conds=['deleted_at IS NULL','panel_id=$2']; let idx=3;
        if (status){conds.push(`status=$${idx++}`);params.push(status);}
        if (cursor){conds.push(`(circuit_number,id)>(SELECT circuit_number,id FROM electrical_circuits WHERE id=$${idx++})`);params.push(cursor);}
        const { rows } = await client.query(`SELECT * FROM electrical_circuits WHERE ${conds.join(' AND ')} ORDER BY circuit_number ASC LIMIT $1`,params); return rows;
      });
      const hasMore=items.length>limit; const data=hasMore?items.slice(0,limit):items;
      return reply.status(200).send({ electrical_circuits:data, pagination:{has_more:hasMore,next_cursor:hasMore?data[data.length-1].id:null} });
    }
  );
  app.get('/electrical-circuits/:id', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id } = req.jwt;
      const item = await withTenantContext(tenant_id, async (client) => { const { rows } = await client.query(`SELECT * FROM electrical_circuits WHERE id=$1 AND deleted_at IS NULL`,[id]); return rows[0]??null; });
      if (!item) return reply.status(404).send({ error:{code:'NOT_FOUND',message:'Electrical circuit not found'} });
      return reply.status(200).send({ electrical_circuit:item });
    }
  );
  app.patch('/electrical-circuits/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string};
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{code:'VALIDATION_ERROR',message:'Validation failed',fields:body.error.errors.map(e=>({field:e.path.join('.'),message:e.message}))} });
      const { tenant_id, user_id, email, role } = req.jwt; const { description, amperage, status, version } = body.data;
      const result = await withTenantContext(tenant_id, async (client) => {
        const sets=['version=version+1','updated_at=NOW()']; const params:unknown[]=[]; let idx=1;
        if (description!==undefined){params.push(description);sets.push(`description=$${idx++}`);}
        if (amperage!==undefined){params.push(amperage);sets.push(`amperage=$${idx++}`);}
        if (status!==undefined){params.push(status);sets.push(`status=$${idx++}`);}
        params.push(id,version);
        const { rows } = await client.query(`UPDATE electrical_circuits SET ${sets.join(',')} WHERE id=$${idx} AND version=$${idx+1} AND deleted_at IS NULL RETURNING *`,params);
        if (rows.length>0){await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'electrical_circuit.updated',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'electrical_circuit',resourceId:id,payload:body.data,ipAddress:req.ip});return{row:rows[0],status:'ok'};}
        const{rows:c}=await client.query(`SELECT id FROM electrical_circuits WHERE id=$1 AND deleted_at IS NULL`,[id]);
        return{row:null,status:c.length===0?'not_found':'conflict'};
      });
      if(result.status==='not_found')return reply.status(404).send({error:{code:'NOT_FOUND',message:'Electrical circuit not found'}});
      if(result.status==='conflict')return reply.status(409).send({error:{code:'VERSION_CONFLICT',message:'Version conflict'}});
      return reply.status(200).send({ electrical_circuit:result.row });
    }
  );
  app.delete('/electrical-circuits/:id', { preHandler: [authenticate, requireRole(...W)] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as {id:string}; const { tenant_id, user_id, email, role } = req.jwt;
      const deleted = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(`UPDATE electrical_circuits SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id`,[id]);
        if(rows.length>0)await writeAuditEntry(client,{tenantId:tenant_id,category:'data',action:'electrical_circuit.deleted',actorId:user_id,actorEmail:email,actorRole:role,resourceType:'electrical_circuit',resourceId:id,payload:{},ipAddress:req.ip});
        return rows[0]??null;
      });
      if(!deleted)return reply.status(404).send({error:{code:'NOT_FOUND',message:'Electrical circuit not found'}});
      return reply.status(204).send();
    }
  );
}
