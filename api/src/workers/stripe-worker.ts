// workers/stripe-worker.ts — pg-boss consumer for Stripe job events
// Processes jobs enqueued by POST /v1/webhooks/stripe
// Locked decisions: T-10, A-14

import { getQueue, JobEnvelope } from '../lib/queue.js';
import { withTenantContext } from '../lib/tenant-context.js';
import { writeAuditEntry } from '../lib/audit-log.js';
import { invalidateSubscriptionCache } from '../services/tier-enforcement.js';
import { pgPool } from '../lib/db.js';
import { createNotification } from '../lib/notify.js';
import {
  handleFieldCostRollup,
  handleScheduleCostProjection,
  handleBudgetCoAdjustment,
  handleBudgetVarianceAlert,
} from './field-cost-worker.js';
import { handleFileScan, handleFileDelete } from './file-scan-worker.js';
import { handleAuditLogExport } from './export-worker.js';
import { handlePushNotification } from './push-worker.js';
import { handleSmsNotification } from './sms-worker.js';
import {
  handlePayrollCsvExport,
  handlePayrollQbPush,
  handlePayrollGustoPush,
  handlePayrollAdpPush,
} from './payroll-worker.js';
import { handleBlueprintAnalyze } from './blueprint-worker.js';
import { dispatchAssetJob } from './asset-worker.js';
import { dispatchWarrantyJob } from './warranty-worker.js';
import {
  handleTimePunchAutoClockoutScan,
  handleTimePunchAutoClockout,
} from './time-punch-worker.js';
import { handleGeocodeProject } from './geocode-worker.js';
import { handleStudioRender } from './studio-worker.js';
import { handleCrossTenantLaborSummary } from './cross-tenant-labor-worker.js';
import { revokeTenantSessions } from '../middleware/auth.js';

type StripeTier = 'starter' | 'professional' | 'business' | 'enterprise';

interface StripeSubscriptionPayload {
  stripe_event_id: string;
  stripe_event_type: string;
  event_data: {
    id?: string;                          // Stripe subscription ID
    customer?: string;                    // Stripe customer ID
    status?: string;                      // Stripe subscription status
    current_period_end?: number;          // Unix timestamp
    metadata?: Record<string, string>;    // contains tenant_id, tier
    items?: { data: Array<{ price: { metadata?: Record<string, string> } }> };
  };
}

interface StripePaymentPayload {
  stripe_event_id: string;
  stripe_event_type: string;
  event_data: {
    subscription?: string;
    customer?: string;
    metadata?: Record<string, string>;
    status?: string;
  };
}

// Map Stripe subscription status → platform status
function mapStripeStatus(stripeStatus: string | undefined): string {
  switch (stripeStatus) {
    case 'active':        return 'active';
    case 'trialing':      return 'trial';
    case 'past_due':      return 'grace_period';
    case 'canceled':
    case 'cancelled':     return 'cancelled';
    case 'unpaid':        return 'suspended';
    default:              return 'active';
  }
}

// ─── Job handlers ─────────────────────────────────────────────────────────────

async function handleSubscriptionUpdated(tenantId: string, payload: StripeSubscriptionPayload): Promise<void> {
  const data = payload.event_data;
  const tier = (data.metadata?.tier ?? 'starter') as StripeTier;
  const status = mapStripeStatus(data.status);
  const periodEnd = data.current_period_end
    ? new Date(data.current_period_end * 1000).toISOString()
    : null;

  // UPSERT into tenant_subscriptions (no RLS — billing is cross-scoped)
  const client = await pgPool.connect();
  try {
    await client.query(
      `INSERT INTO tenant_subscriptions
         (tenant_id, stripe_subscription_id, stripe_customer_id, tier, status, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tenant_id) DO UPDATE SET
         stripe_subscription_id = EXCLUDED.stripe_subscription_id,
         stripe_customer_id     = EXCLUDED.stripe_customer_id,
         tier                   = EXCLUDED.tier,
         status                 = EXCLUDED.status,
         current_period_end     = EXCLUDED.current_period_end,
         updated_at             = NOW()`,
      [tenantId, data.id ?? null, data.customer ?? null, tier, status, periodEnd]
    );

    // Also sync tenant.status
    await client.query(
      `UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, tenantId]
    );
  } finally {
    client.release();
  }

  await invalidateSubscriptionCache(tenantId);
  if (status === 'suspended') await revokeTenantSessions(tenantId);
  console.info({ tenantId, tier, status }, 'stripe.subscription_updated processed');
}

async function handleSubscriptionDeleted(tenantId: string, payload: StripeSubscriptionPayload): Promise<void> {
  const client = await pgPool.connect();
  try {
    await client.query(
      `UPDATE tenant_subscriptions SET status = 'cancelled', updated_at = NOW() WHERE tenant_id = $1`,
      [tenantId]
    );
    await client.query(
      `UPDATE tenants SET status = 'grace_period', updated_at = NOW() WHERE id = $1`,
      [tenantId]
    );
  } finally {
    client.release();
  }

  await invalidateSubscriptionCache(tenantId);
  console.info({ tenantId }, 'stripe.subscription_deleted processed — tenant in grace_period');
}

async function handlePaymentFailed(tenantId: string, payload: StripePaymentPayload): Promise<void> {
  // Write billing audit entry + update subscription status
  await withTenantContext(tenantId, async (client) => {
    await writeAuditEntry(client, {
      tenantId,
      category: 'billing',
      action: 'payment.failed',
      actorId: undefined,
      actorEmail: 'stripe@system',
      actorRole: 'system',
      resourceType: 'subscription',
      resourceId: undefined,
      payload: { stripe_event_id: payload.stripe_event_id },
      ipAddress: undefined,
    });
  });
  console.warn({ tenantId }, 'stripe.payment_failed — billing audit written');
}

async function handlePaymentSucceeded(tenantId: string, payload: StripePaymentPayload): Promise<void> {
  // Ensure status is active after successful payment
  const client = await pgPool.connect();
  try {
    await client.query(
      `UPDATE tenant_subscriptions
       SET status = 'active', updated_at = NOW()
       WHERE tenant_id = $1 AND status IN ('grace_period', 'suspended')`,
      [tenantId]
    );
    await client.query(
      `UPDATE tenants SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND status IN ('grace_period', 'suspended')`,
      [tenantId]
    );
  } finally {
    client.release();
  }

  await invalidateSubscriptionCache(tenantId);
}

// ─── QuickBooks handler ────────────────────────────────────────────────────────

async function handleQuickBooksEntityChanged(tenantId: string, payload: Record<string, unknown>): Promise<void> {
  // tenantId in the envelope is the QB realmId.
  // Resolve actual tenant via tenant_integrations.external_id (migration 0007).
  const client = await pgPool.connect();
  try {
    const result = await client.query<{ tenant_id: string }>(
      `SELECT tenant_id FROM tenant_integrations
       WHERE external_id = $1 AND provider = 'quickbooks' AND deleted_at IS NULL
       LIMIT 1`,
      [tenantId]
    );
    if (result.rows.length === 0) {
      console.warn({ realmId: tenantId }, 'quickbooks: no tenant found for realmId — skipping');
      return;
    }
    const realTenantId = result.rows[0].tenant_id;
    await withTenantContext(realTenantId, async (txClient) => {
      await writeAuditEntry(txClient, {
        tenantId: realTenantId,
        category: 'data',
        action: `quickbooks.${String(payload.entityName ?? 'entity')}.${String(payload.operation ?? 'changed')}`.toLowerCase(),
        actorId: undefined,
        actorEmail: 'quickbooks@system',
        actorRole: 'system',
        resourceType: String(payload.entityName ?? 'unknown'),
        resourceId: undefined,
        payload,
        ipAddress: undefined,
      });
    });
  } finally {
    client.release();
  }
  console.info({ realmId: tenantId, entityName: payload.entityName }, 'quickbooks.entity_changed processed');
}

// ─── DocuSign handler ──────────────────────────────────────────────────────────

async function handleDocuSignEnvelope(tenantId: string, jobType: string, payload: Record<string, unknown>): Promise<void> {
  await withTenantContext(tenantId, async (client) => {
    // Update contract status based on DocuSign envelope event
    if (jobType === 'docusign.envelope_completed') {
      await client.query(
        `UPDATE contracts
         SET status = 'executed', executed_at = NOW(), updated_at = NOW(), version = version + 1
         WHERE docusign_envelope_id = $1 AND deleted_at IS NULL`,
        [payload.envelopeId]
      );
    } else if (jobType === 'docusign.envelope_voided' || jobType === 'docusign.envelope_declined') {
      await client.query(
        `UPDATE contracts
         SET status = 'terminated', updated_at = NOW(), version = version + 1
         WHERE docusign_envelope_id = $1 AND deleted_at IS NULL`,
        [payload.envelopeId]
      );
    }
    await writeAuditEntry(client, {
      tenantId,
      category: 'data',
      action: jobType,
      actorId: undefined,
      actorEmail: 'docusign@system',
      actorRole: 'system',
      resourceType: 'contract',
      resourceId: undefined,
      payload,
      ipAddress: undefined,
    });
  });
  console.info({ tenantId, jobType, envelopeId: payload.envelopeId }, 'docusign envelope event processed');
}

// ─── Cross-tenant handler ──────────────────────────────────────────────────────

async function handleConnectionInviteSent(subTenantId: string, payload: Record<string, unknown>): Promise<void> {
  // Notify all owner/pm users in the sub tenant about the connection invitation
  const { connection_id, gc_tenant_id, project_name, scope_description } = payload as {
    connection_id: string;
    gc_tenant_id: string;
    sub_tenant_id: string;
    project_name?: string | null;
    scope_description?: string | null;
  };

  await withTenantContext(subTenantId, async (client) => {
    // Find all owners and project managers in the sub tenant to notify
    const { rows: users } = await client.query<{ id: string }>(
      `SELECT id FROM users
       WHERE tenant_id = $1
         AND role IN ('owner', 'project_manager')
         AND status = 'active'
         AND deleted_at IS NULL`,
      [subTenantId],
    );

    // Look up GC tenant name for the notification message
    const gcResult = await pgPool.query<{ name: string }>(
      `SELECT name FROM tenants WHERE id = $1`,
      [gc_tenant_id],
    );
    const gcName = gcResult.rows[0]?.name ?? 'A general contractor';

    for (const user of users) {
      await writeAuditEntry(client, {
        tenantId: subTenantId,
        category: 'cross_tenant',
        action: 'connection.invite_received',
        actorId: undefined,
        actorEmail: 'system',
        actorRole: 'system',
        resourceType: 'tenant_connection',
        resourceId: connection_id as string,
        payload: { gc_tenant_id, connection_id },
        ipAddress: undefined,
      });

      // Insert in-app notification for each sub user
      await client.query(
        `INSERT INTO notifications (tenant_id, user_id, title, body, category, data)
         VALUES ($1, $2, $3, $4, 'cross_tenant', $5)`,
        [
          subTenantId,
          user.id,
          'New Connection Invitation',
          `${gcName} has invited you to connect${project_name ? ` on "${project_name}"` : ''}${scope_description ? ` — ${scope_description}` : ''}. Accept to enable cross-company collaboration.`,
          JSON.stringify({ connection_id, gc_tenant_id, type: 'connection_invite' }),
        ],
      );
    }
  });

  console.info({ subTenantId, connection_id, gc_tenant_id }, 'connection.invite_sent: sub users notified');
}

// ─── Cross-tenant shared-event notification (Phase 3) ───────────────────────────
// Enqueued by bridge.notifyCounterparty on every mirror/response. `recipientTenantId` is the
// party that did NOT author the event (T-10 envelope tenant_id). Writes an in-app notification
// (category cross_tenant) to the recipient's OWNER/PM users via createNotification, which fans
// out push/sms — those channel workers apply notification_preferences (T-40). The in-app feed
// itself is always written (T-41). `ref` is the already-whitelisted event payload (no leak).
const CROSS_TENANT_NOTIFY_COPY: Record<string, (r: Record<string, unknown>) => { title: string; body: string }> = {
  'rfi.created':            (r) => ({ title: 'New RFI shared',           body: `RFI #${r.number ?? '?'}: ${r.subject ?? ''}`.trim() }),
  'rfi.updated':            (r) => ({ title: 'Shared RFI updated',       body: `RFI #${r.number ?? '?'}: ${r.subject ?? ''}`.trim() }),
  'rfi.answered':           (r) => ({ title: 'RFI answered',             body: `RFI #${r.number ?? '?'} was answered` }),
  'change_order.created':   (r) => ({ title: 'New change order shared',  body: `${r.title ?? 'Change order'}` }),
  'change_order.updated':   (r) => ({ title: 'Shared change order updated', body: `${r.title ?? 'Change order'}` }),
  'change_order.responded': (r) => ({ title: 'Change order response',    body: `Decision: ${r.decision ?? 'updated'}` }),
  'submittal.created':      (r) => ({ title: 'New submittal shared',     body: `#${r.number ?? '?'}: ${r.title ?? ''}`.trim() }),
  'submittal.updated':      (r) => ({ title: 'Shared submittal updated', body: `#${r.number ?? '?'}: ${r.title ?? ''}`.trim() }),
  'submittal.responded':    (r) => ({ title: 'Submittal response',       body: `Decision: ${r.decision ?? 'updated'}` }),
  'connection.declined':    ()  => ({ title: 'Connection declined',      body: 'Your connection invitation was declined' }),
  'milestone.updated':      (r) => ({ title: 'Shared milestone update',  body: `${r.title ?? 'Milestone'}${r.status ? `: ${r.status}` : ''}` }),
  'schedule.updated':       (r) => ({ title: 'Shared schedule update',   body: `${r.note ?? ''}`.slice(0, 200) }),
  'note.posted':            (r) => ({ title: 'New shared note',          body: `${r.note ?? ''}`.slice(0, 200) }),
  'message.sent':           (r) => ({ title: 'New message',              body: `${r.message ?? ''}`.slice(0, 200) }),
  'invoice.submitted':      (r) => ({ title: 'Invoice submitted',       body: `$${(Number(r.amount_cents ?? 0) / 100).toLocaleString('en-US')}${r.due_date ? ` due ${r.due_date}` : ''}` }),
  'invoice.approved':       ()  => ({ title: 'Invoice approved',        body: 'A submitted invoice was approved' }),
  'invoice.paid':           ()  => ({ title: 'Invoice paid',            body: 'A submitted invoice was marked paid' }),
  'lien_waiver.requested':  (r) => ({ title: 'Lien waiver requested',   body: `${r.waiver_type ?? 'Waiver'}${r.through_date ? ` through ${r.through_date}` : ''}` }),
  'lien_waiver.signed':     ()  => ({ title: 'Lien waiver signed',      body: 'A requested lien waiver was signed' }),
  'daily_report.submitted': (r) => ({ title: 'Daily report shared',         body: `Field report for ${r.report_date ?? ''}`.trim() }),
  'daily_report.updated':   (r) => ({ title: 'Shared daily report updated', body: `Field report for ${r.report_date ?? ''}`.trim() }),
  'labor.summary':          (r) => ({ title: 'Labor summary shared',
    body: `${r.date ?? ''}${r.total_hours != null ? ` — ${r.total_hours} hrs` : ''}${r.worker_count != null ? `, ${r.worker_count} workers` : ''}`.trim() }),
};

export async function handleCrossTenantNotify(recipientTenantId: string, payload: Record<string, unknown>): Promise<void> {
  const { connection_id, source_tenant_id, event_type } = payload as {
    connection_id: string;
    source_tenant_id: string;
    event_type: string;
  };
  const ref = (payload.ref as Record<string, unknown>) ?? {};
  const copy = CROSS_TENANT_NOTIFY_COPY[event_type];
  const { title, body } = copy
    ? copy(ref)
    : { title: 'Shared project update', body: `New ${event_type} on a connected project` };

  await withTenantContext(recipientTenantId, async (client) => {
    const { rows: users } = await client.query<{ id: string }>(
      `SELECT id FROM users
        WHERE tenant_id = $1
          AND role IN ('owner', 'project_manager')
          AND status = 'active'
          AND deleted_at IS NULL`,
      [recipientTenantId],
    );
    for (const user of users) {
      await createNotification(client, recipientTenantId, {
        userId: user.id,
        title,
        body,
        category: 'cross_tenant',
        data: { connection_id, source_tenant_id, event_type, type: 'cross_tenant_event', ...ref },
      });
    }
  });

  console.info({ recipientTenantId, connection_id, event_type }, 'cross_tenant.notify: counterparty notified');
}

// ─── Cross-tenant connection closed (revoked or completed — Doc 07 §8) ──────────
// Envelope tenant = the SUB. Dispositions the sub's bridge-instantiated mirror project by
// reason_code: completed/mutual_agreement (amicable) → 'completed'; terminated_for_cause/
// other/absent → 'on_hold' (non-destructive — an old envelope without reason_code behaves
// exactly as before). Only touches mirrors still 'active' — never stomps a status the sub
// already set themselves. Runs entirely in the sub's own tenant context (A-07).
// Handles BOTH job types: 'connection.revoked' (revoke route) and 'connection.closed' (complete).
export async function handleConnectionClosed(subTenantId: string, payload: Record<string, unknown>): Promise<void> {
  const { connection_id, revoked_by_tenant_id, closed_by_tenant_id, reason_code } = payload as {
    connection_id: string;
    revoked_by_tenant_id?: string;
    closed_by_tenant_id?: string;
    reason_code?: string;
  };
  const byTenantId = closed_by_tenant_id ?? revoked_by_tenant_id ?? null;
  const amicable = reason_code === 'completed' || reason_code === 'mutual_agreement';
  const mirrorStatus = amicable ? 'completed' : 'on_hold';

  await withTenantContext(subTenantId, async (client) => {
    const { rows: projects } = await client.query<{ id: string; name: string }>(
      `UPDATE projects SET status = $2, updated_at = NOW()
        WHERE connection_id = $1 AND status = 'active' AND deleted_at IS NULL
        RETURNING id, name`,
      [connection_id, mirrorStatus],
    );

    const { rows: users } = await client.query<{ id: string }>(
      `SELECT id FROM users
        WHERE tenant_id = $1 AND role IN ('owner', 'project_manager')
          AND status = 'active' AND deleted_at IS NULL`,
      [subTenantId],
    );
    const projNote =
      projects.length > 0
        ? amicable
          ? ` Your linked project "${projects[0].name}" was marked completed.`
          : ` Your linked project "${projects[0].name}" was put on hold.`
        : '';
    const title = reason_code === 'completed' ? 'Connection completed' : 'Connection revoked';
    const body =
      reason_code === 'completed'
        ? `A cross-company connection was completed. Shared history stays readable as a read-only archive.${projNote}`
        : `A cross-company connection was revoked. Shared history stays readable; no new updates will flow.${projNote}`;
    for (const user of users) {
      await createNotification(client, subTenantId, {
        userId: user.id,
        title,
        body,
        category: 'cross_tenant',
        data: { connection_id, closed_by_tenant_id: byTenantId, reason_code: reason_code ?? null, type: 'connection_closed' },
      });
    }
  });

  console.info({ subTenantId, connection_id, reason_code: reason_code ?? null }, 'connection.closed: sub project dispositioned + users notified');
}

// ─── Worker registration ───────────────────────────────────────────────────────

export async function startWorkers(): Promise<void> {
  const boss = await getQueue();

  await boss.work<JobEnvelope>('jobs', async (job) => {
    const envelope = job.data;

    // T-10: dead-letter guard — never process jobs missing tenant_id
    if (!envelope.tenant_id) {
      throw new Error('stripe-worker: missing tenant_id in job envelope — dead-lettering');
    }

    const { job_type, tenant_id, payload } = envelope;

    switch (job_type) {
      case 'stripe.subscription_updated':
        await handleSubscriptionUpdated(tenant_id, payload as unknown as StripeSubscriptionPayload);
        break;
      case 'stripe.subscription_deleted':
        await handleSubscriptionDeleted(tenant_id, payload as unknown as StripeSubscriptionPayload);
        break;
      case 'stripe.payment_failed':
        await handlePaymentFailed(tenant_id, payload as unknown as StripePaymentPayload);
        break;
      case 'stripe.payment_succeeded':
        await handlePaymentSucceeded(tenant_id, payload as unknown as StripePaymentPayload);
        break;
      // ─── Reconciliation job types (handled here to share single queue consumer) ───
      case 'reconciliation.field_cost_rollup':
        await handleFieldCostRollup(tenant_id, payload);
        break;
      case 'reconciliation.schedule_cost_projection':
        await handleScheduleCostProjection(tenant_id, payload);
        break;
      case 'reconciliation.budget_co_adjustment':
        await handleBudgetCoAdjustment(tenant_id, payload);
        break;
      case 'reconciliation.budget_variance_alert':
        await handleBudgetVarianceAlert(tenant_id, payload);
        break;
      // ─── QuickBooks ───
      case 'quickbooks.entity_changed':
        await handleQuickBooksEntityChanged(tenant_id, payload);
        break;
      // ─── DocuSign ─────
      case 'docusign.envelope_completed':
      case 'docusign.envelope_voided':
      case 'docusign.envelope_declined':
      case 'docusign.envelope_sent':
      case 'docusign.event':
        await handleDocuSignEnvelope(tenant_id, job_type, payload);
        break;
      // ─── File scanner ──
      case 'file.scan':
        await handleFileScan(tenant_id, payload);
        break;
      case 'file.delete':
        await handleFileDelete(tenant_id, payload);
        break;
      // ─── Push / SMS ────
      case 'push.notification':
        await handlePushNotification(tenant_id, payload);
        break;
      case 'sms.notification':
        await handleSmsNotification(tenant_id, payload);
        break;
      // ─── Cross-tenant ──
      case 'connection.invite_sent':
        await handleConnectionInviteSent(tenant_id, payload);
        break;
      case 'cross_tenant.notify':
        await handleCrossTenantNotify(tenant_id, payload);
        break;
      case 'connection.revoked':
      case 'connection.closed':
        await handleConnectionClosed(tenant_id, payload);
        break;
      case 'cross_tenant.labor_summary':
        await handleCrossTenantLaborSummary(tenant_id, payload);
        break;
      // ─── Export ────────
      case 'audit_log.export':
        await handleAuditLogExport(tenant_id, payload);
        break;
      // ─── Payroll ───────
      case 'payroll.export_csv':
        await handlePayrollCsvExport(payload, tenant_id);
        break;
      case 'payroll.quickbooks_push':
        await handlePayrollQbPush(payload, tenant_id);
        break;
      case 'payroll.gusto_push':
        await handlePayrollGustoPush(payload, tenant_id);
        break;
      case 'payroll.adp_push':
        await handlePayrollAdpPush(payload, tenant_id);
        break;
      // ─── Blueprint Intelligence ──
      case 'blueprint.analyze':
        await handleBlueprintAnalyze(tenant_id, payload);
        break;
      // ─── Asset Management ──
      case 'asset.daily_expiry_check':
      case 'asset.monthly_depreciation':
      case 'asset.sync_depreciation_to_qb':
      case 'asset.overdue_checkout_alert':
        await dispatchAssetJob(job_type, tenant_id, payload);
        break;
      // ─── Builder Warranties ──
      case 'warranty.daily_expiry_check':
      case 'warranty.sub_notify':
      case 'warranty.homeowner_magic_link':
        await dispatchWarrantyJob(job_type, tenant_id, payload);
        break;
      // ─── Time Punches (Clock In/Out) ──
      case 'time_punches.auto_clockout_scan':
        await handleTimePunchAutoClockoutScan(payload);
        break;
      case 'time_punches.auto_clockout':
        await handleTimePunchAutoClockout(tenant_id, payload);
        break;
      // ─── Project Map geocoding ──
      case 'geocode.project':
        await handleGeocodeProject(tenant_id, payload);
        break;
      // ─── Design Studio ──
      case 'studio.render': // legacy: jobs enqueued on 'jobs' before the dedicated queue (DEDICATED_QUEUES)
        await handleStudioRender(tenant_id, payload);
        break;
      default:
        // Unknown job type — log and skip (don't dead-letter for unknown types)
        console.info({ job_type, tenant_id }, 'stripe-worker: unhandled job_type — skipping');
    }
  });

  console.info('stripe-worker: registered pg-boss worker on "jobs" queue');
}
