// workers/sms-worker.ts — delivers SMS notifications via Twilio
// Locked decisions: T-38, T-40
// T-38 delivery chain: in-app WebSocket → push → email → SMS (SMS is last resort)
// SMS requires EXPLICIT user opt-in (T-40) — no preference row = NOT opted in
// Unlike push (default-on), SMS default is off even for safety category

import { withTenantContext } from '../lib/tenant-context.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import type { PoolClient } from 'pg';

// ---------------------------------------------------------------------------
// Twilio stub (T-38)
// ---------------------------------------------------------------------------

async function sendSms(
  to: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  // T-38: Twilio SMS delivery stub — integrate twilio Node.js SDK at build time.
  //
  // Production implementation:
  //   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  //   await client.messages.create({
  //     from: process.env.TWILIO_PHONE_NUMBER,
  //     to,
  //     body,
  //   });
  //
  // Error handling: invalid phone number → log + skip (phone is user data, not a deactivatable token)
  // Rate limits: Twilio returns 429 — implement backoff in production
  console.info(
    { to: to.slice(0, 4) + '****', bodyLen: body.length },
    'sms.twilio stub — skipping in dev',
  );
  return { success: true };
}

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

interface SmsPayload {
  notification_id: string;
  user_id: string;
  title: string;
  body: string;
  category?: string;
}

// ---------------------------------------------------------------------------
// handleSmsNotification
// ---------------------------------------------------------------------------

export async function handleSmsNotification(
  tenantId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const {
    notification_id,
    user_id,
    title,
    body,
    category = 'system',
  } = payload as unknown as SmsPayload;

  await withTenantContext(tenantId, async (client: PoolClient) => {
    // 1. Look up user's phone number
    const userResult = await client.query<{ phone: string | null }>(
      `SELECT phone FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [user_id, tenantId],
    );

    if (userResult.rowCount === 0) {
      console.info({ user_id, tenantId }, 'sms-worker: user not found — skipping');
      return;
    }

    const phone = userResult.rows[0].phone;
    if (!phone) {
      console.info({ user_id }, 'sms-worker: user has no phone number — skipping');
      return;
    }

    // 2. Check SMS opt-in preference (T-40)
    // SMS requires EXPLICIT opt-in — no preference row means NOT opted in
    // This is different from push (default-on) and different from safety override
    const prefResult = await client.query<{ enabled: boolean }>(
      `SELECT enabled FROM notification_preferences
       WHERE user_id = $1
         AND tenant_id = $2
         AND category = $3
         AND channel = 'sms'`,
      [user_id, tenantId, category],
    );

    if (prefResult.rowCount === 0) {
      // No row = not opted in — skip (SMS is opt-in only, even for safety)
      console.info({ user_id, category }, 'sms-worker: no SMS opt-in — skipping');
      return;
    }

    if (!prefResult.rows[0].enabled) {
      console.info({ user_id, category }, 'sms-worker: SMS disabled by preference — skipping');
      return;
    }

    // 3. Send SMS — concatenate title + body for SMS format
    const smsBody = `${title}: ${body}`;
    const result = await sendSms(phone, smsBody);

    // 4. Audit delivery attempt
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: 'sms.notification_delivered',
      actorId: undefined,
      actorEmail: 'system',
      actorRole: 'system',
      resourceType: 'notification',
      resourceId: notification_id,
      payload: {
        user_id,
        notification_category: category,
        success: result.success,
        error: result.error,
      },
      ipAddress: undefined,
    });

    if (result.success) {
      console.info({ notification_id, user_id }, 'sms-worker: SMS delivered');
    } else {
      console.warn({ notification_id, user_id, error: result.error }, 'sms-worker: SMS failed');
    }
  });
}
