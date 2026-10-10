// routes/v1/notifications.ts — In-app notification inbox
// Locked decisions: T-40, T-41
// Append-only table: no updated_at, no deleted_at
// Unread count cached in Redis per user (T-41)
// Safety category notifications cannot be disabled (T-40)

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { withTenantContext } from '../../lib/tenant-context.js';
import { redis } from '../../lib/redis.js';
import { authenticate } from '../../plugins/auth-plugin.js';

const CATEGORIES = ['safety','financial','project','system','cross_tenant'] as const;

const ListQ = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(CATEGORIES).optional(),
  unread_only: z.coerce.boolean().optional(),
});

function unreadKey(userId: string): string {
  return `notifications:unread:${userId}`;
}

export async function notificationRoutes(app: FastifyInstance): Promise<void> {

  // GET /v1/notifications — paginated inbox for the authenticated user
  app.get('/notifications', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const q = ListQ.safeParse(req.query);
      if (!q.success) return reply.status(422).send({ error:{ code:'VALIDATION_ERROR', message:'Invalid query' } });

      const { tenant_id, user_id } = req.jwt;
      const { cursor, limit, category, unread_only } = q.data;

      const items = await withTenantContext(tenant_id, async (client) => {
        const params: unknown[] = [limit + 1, user_id];
        const conds = ['user_id=$2'];
        let idx = 3;

        if (category) { conds.push(`category=$${idx++}`); params.push(category); }
        if (unread_only) { conds.push('read_at IS NULL'); }
        if (cursor) {
          conds.push(`(created_at,id)<(SELECT created_at,id FROM notifications WHERE id=$${idx++})`);
          params.push(cursor);
        }

        const { rows } = await client.query(
          `SELECT * FROM notifications WHERE ${conds.join(' AND ')} ORDER BY created_at DESC,id DESC LIMIT $1`,
          params
        );
        return rows;
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;

      return reply.status(200).send({
        notifications: data,
        pagination: { has_more: hasMore, next_cursor: hasMore ? data[data.length - 1].id : null },
      });
    }
  );

  // GET /v1/notifications/unread-count — fast badge count from Redis (T-41)
  // Falls back to DB query if Redis key is missing
  app.get('/notifications/unread-count', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      const cached = await redis.get(unreadKey(user_id));
      if (cached !== null) {
        return reply.status(200).send({ unread_count: parseInt(cached, 10) });
      }

      // Redis miss — compute from DB and repopulate cache
      const count = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT COUNT(*) as count FROM notifications WHERE user_id=$1 AND read_at IS NULL`,
          [user_id]
        );
        return parseInt(rows[0].count, 10);
      });

      await redis.set(unreadKey(user_id), count, 'EX', 3600); // 1hr TTL

      return reply.status(200).send({ unread_count: count });
    }
  );

  // PATCH /v1/notifications/:id/read — mark a single notification as read
  app.patch('/notifications/:id/read', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { tenant_id, user_id } = req.jwt;

      const updated = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2 AND read_at IS NULL RETURNING id`,
          [id, user_id]
        );
        return rows[0] ?? null;
      });

      if (!updated) {
        // Either not found, belongs to another user, or already read — return 404 either way
        return reply.status(404).send({ error:{ code:'NOT_FOUND', message:'Notification not found' } });
      }

      // Decrement Redis unread count
      await redis.decr(unreadKey(user_id));

      return reply.status(204).send();
    }
  );

  // GET /v1/notifications/preferences — get user's notification preferences (T-40)
  app.get('/notifications/preferences', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      const prefs = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `SELECT category, channel, enabled, quiet_hours_start, quiet_hours_end
           FROM notification_preferences
           WHERE user_id=$1`,
          [user_id]
        );
        return rows;
      });

      return reply.status(200).send({ preferences: prefs });
    }
  );

  // PUT /v1/notifications/preferences — upsert a notification preference (T-40)
  // Safety notifications cannot be disabled (T-40).
  app.put('/notifications/preferences', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const PrefSchema = z.object({
        category: z.enum(CATEGORIES),
        channel: z.enum(['push', 'email', 'sms']),
        enabled: z.boolean(),
        quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM
        quiet_hours_end:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
      });

      const body = PrefSchema.safeParse(req.body);
      if (!body.success) return reply.status(422).send({ error:{ code:'VALIDATION_ERROR', message:'Invalid preference data' } });

      const { tenant_id, user_id } = req.jwt;
      const { category, channel, enabled, quiet_hours_start, quiet_hours_end } = body.data;

      // T-40: safety notifications cannot be disabled
      if (category === 'safety' && !enabled) {
        return reply.status(422).send({ error: { code: 'SAFETY_NOTIFICATIONS_REQUIRED', message: 'Safety notifications cannot be disabled.' } });
      }

      const pref = await withTenantContext(tenant_id, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO notification_preferences (tenant_id, user_id, category, channel, enabled, quiet_hours_start, quiet_hours_end)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (user_id, category, channel)
           DO UPDATE SET enabled=$5, quiet_hours_start=$6, quiet_hours_end=$7
           RETURNING *`,
          [tenant_id, user_id, category, channel, enabled, quiet_hours_start ?? null, quiet_hours_end ?? null]
        );
        return rows[0];
      });

      return reply.status(200).send({ preference: pref });
    }
  );

  // POST /v1/notifications/read-all — mark all unread notifications as read
  app.post('/notifications/read-all', { preHandler: [authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { tenant_id, user_id } = req.jwt;

      const { rowCount } = await withTenantContext(tenant_id, async (client) => {
        return client.query(
          `UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL`,
          [user_id]
        );
      });

      // Reset Redis unread count to 0
      await redis.set(unreadKey(user_id), 0, 'EX', 3600);

      return reply.status(200).send({ marked_read: rowCount ?? 0 });
    }
  );
}
