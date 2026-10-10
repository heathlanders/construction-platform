// workers/push-worker.ts — delivers push notifications via APNs and FCM
// Locked decisions: T-38, T-39, T-40, T-41
// Delivery chain: push → in-app WebSocket (handled separately by Pusher layer)
// Token invalidation: immediately deactivate tokens on APNs/FCM error response (T-39)

import { withTenantContext } from '../lib/tenant-context.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import type { PoolClient } from 'pg';

// ─── Push provider stubs (T-38) ───────────────────────────────────────────────

async function sendApns(
  token: string,
  title: string,
  body: string,
  _data: unknown,
): Promise<{ success: boolean; invalidToken?: boolean }> {
  // T-38: APNs delivery stub — integrate @parse/node-apn or apple/apns at build time.
  // On InvalidToken / BadDeviceToken error: return { success: false, invalidToken: true }
  // Per T-39: platform never retries against a known-bad token.
  console.info({ token: token.slice(0, 8) + '...', title }, 'push.apns stub — skipping in dev');
  return { success: true };
}

async function sendFcm(
  token: string,
  title: string,
  body: string,
  _data: unknown,
): Promise<{ success: boolean; invalidToken?: boolean }> {
  // T-38: FCM delivery stub — integrate firebase-admin at build time.
  // On UNREGISTERED / NOT_FOUND error: return { success: false, invalidToken: true }
  // Per T-39: platform never retries against a known-bad token.
  console.info({ token: token.slice(0, 8) + '...', title }, 'push.fcm stub — skipping in dev');
  return { success: true };
}

// ─── Payload type ─────────────────────────────────────────────────────────────

interface PushPayload {
  notification_id: string;
  user_id: string;
  title: string;
  body: string;
  category?: string;
  data?: Record<string, unknown>;
}

interface DeviceRow {
  id: string;
  platform: 'ios' | 'android';
  push_token: string;
}

// ─── handlePushNotification ───────────────────────────────────────────────────

export async function handlePushNotification(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { notification_id, user_id, title, body, category = 'system', data } =
    payload as unknown as PushPayload;

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // 1. Load active device tokens (T-39: only active tokens)
    const devicesResult = await client.query<DeviceRow>(
      `SELECT id, platform, push_token
       FROM user_devices
       WHERE user_id = $1 AND tenant_id = $2 AND active = true AND deleted_at IS NULL`,
      [user_id, tenantId],
    );

    const devices = devicesResult.rows;

    if (devices.length === 0) {
      console.info({ notification_id, user_id }, 'push-worker: no active tokens — skipping');
      return;
    }

    // 2. Check push preference (T-40) — safety category cannot be disabled
    let pushEnabled = true;
    if (category !== 'safety') {
      const prefResult = await client.query<{ enabled: boolean }>(
        `SELECT enabled FROM notification_preferences
         WHERE user_id = $1 AND tenant_id = $2 AND category = $3 AND channel = 'push'`,
        [user_id, tenantId, category],
      );
      if ((prefResult.rowCount ?? 0) > 0) {
        pushEnabled = prefResult.rows[0].enabled;
      }
      // No row = default enabled for push
    }

    if (!pushEnabled) {
      console.info({ notification_id, user_id, category }, 'push-worker: disabled by preference');
      return;
    }

    // 3. Deliver to each device
    let deliveredCount = 0;
    let invalidatedCount = 0;

    for (const device of devices) {
      let result: { success: boolean; invalidToken?: boolean };

      if (device.platform === 'ios') {
        result = await sendApns(device.push_token, title, body, data);
      } else {
        result = await sendFcm(device.push_token, title, body, data);
      }

      if (result.invalidToken) {
        // T-39: immediately deactivate — never retry against known-bad token
        await client.query(
          `UPDATE user_devices SET active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
          [device.id, tenantId],
        );
        invalidatedCount++;
        console.warn({ device_id: device.id, platform: device.platform }, 'push-worker: invalid token deactivated');
      } else if (result.success) {
        deliveredCount++;
      }
    }

    // 4. Audit
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'push.notification_delivered',
      actorId: undefined,
      actorEmail: 'system',
      actorRole: 'system',
      resourceType: 'notification',
      resourceId: notification_id,
      payload: { user_id, notification_category: category, device_count: devices.length, delivered_count: deliveredCount, invalidated_count: invalidatedCount },
      ipAddress: undefined,
    });

    console.info({ notification_id, user_id, deliveredCount, invalidatedCount }, 'push-worker: delivery complete');
  });
}
