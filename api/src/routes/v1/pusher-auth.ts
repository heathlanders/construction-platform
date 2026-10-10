// routes/v1/pusher-auth.ts — Pusher private-channel authorization (T-15/T-16, A-16).
//
// The ONE security gate for realtime: a tenant may subscribe ONLY to its own
// `private-tenant-{tenant_id}` channel. The requested channel is validated against the JWT
// tenant_id — any mismatch is 403, never authorized (T-16). No public/shared channels exist.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth-plugin.js';
import { authorizeTenantChannel, pusherEnabled, tenantChannel } from '../../lib/pusher.js';

const AuthSchema = z.object({
  socket_id: z.string().min(1),
  channel_name: z.string().min(1),
});

export async function pusherAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post('/pusher/auth', { preHandler: [authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    if (!pusherEnabled()) {
      return reply.status(503).send({ error: { code: 'REALTIME_DISABLED', message: 'Realtime is not configured' } });
    }
    const body = AuthSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(422).send({ error: { code: 'VALIDATION_ERROR', message: 'socket_id and channel_name are required' } });
    }
    const { tenant_id } = req.jwt;
    const auth = authorizeTenantChannel(body.data.socket_id, body.data.channel_name, tenant_id);
    if (!auth) {
      // Channel does not match the caller's own tenant channel (T-16) — never authorize.
      return reply.status(403).send({ error: { code: 'CHANNEL_FORBIDDEN', message: `Only ${tenantChannel(tenant_id)} may be subscribed` } });
    }
    return reply.status(200).send(auth);
  });
}
