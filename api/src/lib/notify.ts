// lib/notify.ts — createNotification helper
// Inserts a notification, increments Redis unread badge count, and dispatches push job
// Locked decisions: T-38, T-40, T-41
//
// Usage (inside withTenantContext):
//   await createNotification(client, tenantId, { userId, title, body, category, data });

import type { PoolClient } from 'pg';
import { redis } from './redis.js';
import { sendJob } from './queue.js';

type NotificationCategory = 'safety' | 'financial' | 'project' | 'system' | 'cross_tenant';

interface NotificationOpts {
  userId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  data?: Record<string, unknown>;
}

// Unread count key — matches the key in notifications.ts
function unreadKey(userId: string): string {
  return `notifications:unread:${userId}`;
}

/**
 * Create a notification and trigger the full delivery chain:
 * 1. INSERT into notifications table (append-only — no updated_at, deleted_at)
 * 2. Increment Redis unread badge count (T-41)
 * 3. Enqueue push.notification job → push-worker handles APNs/FCM delivery (T-38)
 *
 * Must be called inside withTenantContext (receives the PoolClient).
 */
export async function createNotification(
  client: PoolClient,
  tenantId: string,
  opts: NotificationOpts,
): Promise<string> {
  const { userId, title, body, category, data } = opts;

  // 1. Insert notification
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [tenantId, userId, title, body, category, JSON.stringify(data ?? {})],
  );

  const notificationId = rows[0].id;

  // 2. Increment Redis unread count with 24hr TTL refresh (T-41)
  await redis.incr(unreadKey(userId));
  await redis.expire(unreadKey(userId), 86400);

  // 3. Enqueue push delivery (T-38) — fire-and-forget, non-blocking
  await sendJob('push.notification', tenantId, {
    notification_id: notificationId,
    user_id: userId,
    title,
    body,
    category,
    data,
  });

  // 4. Enqueue SMS delivery (T-38) — sms-worker checks opt-in before sending
  await sendJob('sms.notification', tenantId, {
    notification_id: notificationId,
    user_id: userId,
    title,
    body,
    category,
  });

  return notificationId;
}
