// api/src/index.ts — Fastify server entry point
// All routes use /v1/ prefix (T-11)
// See: api/CLAUDE.md

import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

// ─── Sentry — init before everything else (Workstream F) ─────────────────────
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}

import { registerErrorHandler } from './plugins/error-handler.js';
import { registerPortalGate } from './middleware/portal-gate.js';
import { stopQueue, getQueue } from './lib/queue.js';
import { pgPool } from './lib/db.js';
import { redis } from './lib/redis.js';
import { startWorkers } from './workers/stripe-worker.js';
import { startFieldCostWorker } from './workers/field-cost-worker.js';
import { startLaborSummaryScanWorker } from './workers/cross-tenant-labor-worker.js';
import { startStudioRenderWorker } from './workers/studio-worker.js';
import { handleTimePunchAutoClockoutScan } from './workers/time-punch-worker.js';
import { startWarrantyScanWorker } from './workers/warranty-worker.js';
import { loadReferenceCache } from './lib/jurisdictions/reference-store.js';

// Auth
import { authRoutes } from './routes/v1/auth.js';
// User management
import { userRoutes } from './routes/v1/users.js';
// Projects
import { projectRoutes } from './routes/v1/projects.js';
// Financial
import { invoiceRoutes } from './routes/v1/invoices.js';
import { changeOrderRoutes } from './routes/v1/change-orders.js';
import { budgetLineItemRoutes } from './routes/v1/budget-line-items.js';
import { costCodeRoutes } from './routes/v1/cost-codes.js';
// Documents
import { documentRoutes } from './routes/v1/documents.js';
import { rfiRoutes } from './routes/v1/rfis.js';
import { submittalRoutes } from './routes/v1/submittals.js';
// Field operations
import { dailyReportRoutes } from './routes/v1/daily-reports.js';
import { timeEntryRoutes } from './routes/v1/time-entries.js';
import { punchListItemRoutes } from './routes/v1/punch-list-items.js';
import { inspectionRoutes } from './routes/v1/inspections.js';
// Safety
import { safetyIncidentRoutes } from './routes/v1/safety-incidents.js';
import { jsaRecordRoutes } from './routes/v1/jsa-records.js';
import { safetyCertificationRoutes } from './routes/v1/safety-certifications.js';
// Estimating
import { bidPackageRoutes } from './routes/v1/bid-packages.js';
import { takeoffItemRoutes } from './routes/v1/takeoff-items.js';
import { markupRoutes } from './routes/v1/markups.js';
import { estimateRoutes } from './routes/v1/estimates.js';
import { estimateAssemblyRoutes } from './routes/v1/estimate-assemblies.js';
import { vendorRoutes } from './routes/v1/vendors.js';
import { vendorBidRoutes } from './routes/v1/vendor-bids.js';
// Contracts & Schedule
import { contractRoutes } from './routes/v1/contracts.js';
import { scheduleTaskRoutes } from './routes/v1/schedule-tasks.js';
import { taskDependencyRoutes } from './routes/v1/task-dependencies.js';
import { crewAssignmentRoutes } from './routes/v1/crew-assignments.js';
import { milestoneRoutes } from './routes/v1/milestones.js';
import { dashboardRoutes } from './routes/v1/dashboard.js';
import { timecardRoutes } from './routes/v1/timecards.js';
import { reportsRoutes } from './routes/v1/reports.js';
// Enterprise
import { apiKeyRoutes } from './routes/v1/api-keys.js';
// Trade modules
import { electricalPanelRoutes } from './routes/v1/electrical-panels.js';
import { electricalCircuitRoutes } from './routes/v1/electrical-circuits.js';
import { plumbingSystemRoutes } from './routes/v1/plumbing-systems.js';
import { plumbingFixtureRoutes } from './routes/v1/plumbing-fixtures.js';
import { concretePourRoutes } from './routes/v1/concrete-pours.js';
import { concreteTestRecordRoutes } from './routes/v1/concrete-test-records.js';
import { framingInspectionRoutes } from './routes/v1/framing-inspections.js';
import { hvacEquipmentRoutes } from './routes/v1/hvac-equipment.js';
import { roofingSystemRoutes } from './routes/v1/roofing-systems.js';
import { roofingQaRecordRoutes } from './routes/v1/roofing-qa-records.js';
import { framingCorrectionItemRoutes } from './routes/v1/framing-correction-items.js';
// Platform services
import { fileRoutes } from './routes/v1/files.js';
import { notificationRoutes } from './routes/v1/notifications.js';
import { billingRoutes } from './routes/v1/billing.js';
import { syncRoutes } from './routes/v1/sync.js';
import { connectionRoutes } from './routes/v1/connections.js';
import { subPortalRoutes } from './routes/v1/sub-portal.js';
import { clientPortalRoutes } from './routes/v1/client-portal.js';
import { clientStudioRoutes } from './routes/v1/client-studio.js';
import { studioRoutes } from './routes/v1/studio.js';
import { pusherAuthRoutes } from './routes/v1/pusher-auth.js';
// Integrations (OAuth flows)
import { quickbooksIntegrationRoutes } from './routes/v1/integrations/quickbooks.js';
import { gustoRoutes } from './routes/v1/integrations/gusto.js';
import { adpRoutes } from './routes/v1/integrations/adp.js';
// Payroll
import { payrollRoutes } from './routes/v1/payroll.js';
import { payrollSettingsRoutes } from './routes/v1/payroll-settings.js';
// Webhooks
import { stripeWebhookRoutes } from './routes/v1/webhooks/stripe.js';
import { quickbooksWebhookRoutes } from './routes/v1/webhooks/quickbooks.js';
import { docusignWebhookRoutes } from './routes/v1/webhooks/docusign.js';
// Super admin
import { adminRoutes } from './routes/v1/admin.js';
import { portalMigrationRoutes } from './routes/v1/portal-migrations.js';
import { adminJurisdictionRoutes } from './routes/v1/admin-jurisdictions.js';
import { auditLogRoutes } from './routes/v1/audit-log.js';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
});

// ─── Structured request logging (pino) — tenant_id + route + duration ────────

app.addHook('onResponse', (req, reply, done) => {
  const tenantId = (req as any).jwt?.tenant_id ?? 'unauthenticated';
  app.log.info({
    method: req.method,
    url: req.url,
    status: reply.statusCode,
    duration_ms: Math.round(reply.elapsedTime),
    tenant_id: tenantId,
    request_id: req.id,
  }, 'request');
  done();
});

// ─── Security plugins ─────────────────────────────────────────────────────────

await app.register(helmet);

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  credentials: true,
});

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  timeWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
});

// ─── Global error handler (must be registered before routes) ─────────────────

registerErrorHandler(app);

// ─── Portal containment gate (P-04 + client/homeowner) ────────────────────────
// Portal users live INSIDE a builder tenant, so tenant RLS alone would expose the whole
// tenant on any general route. Each portal role is confined to an allow-list.
registerPortalGate(app);

// ─── Health check — no auth required ─────────────────────────────────────────

app.get('/health', async () => {
  const start = Date.now();
  const checks: Record<string, string> = {};

  // DB connectivity
  try {
    await pgPool.query('SELECT 1');
    checks.db = 'ok';
  } catch {
    checks.db = 'error';
  }

  // Redis connectivity
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  // pg-boss queue depth (failed jobs)
  try {
    const boss = await getQueue();
    const stats = await pgPool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM pgboss.job WHERE state = 'failed'`
    );
    checks.dlq_depth = stats.rows[0]?.count ?? '0';
  } catch {
    checks.dlq_depth = 'unknown';
  }

  const allOk = checks.db === 'ok' && checks.redis === 'ok';
  return {
    status: allOk ? 'ok' : 'degraded',
    version: process.env.npm_package_version ?? '0.1.0',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    response_ms: Date.now() - start,
    checks,
  };
});

// ─── V1 routes ───────────────────────────────────────────────────────────────

const V1 = { prefix: '/v1' };

// Auth & users
await app.register(authRoutes, V1);
await app.register(userRoutes, V1);

// Core
await app.register(projectRoutes, V1);

// Financial
await app.register(invoiceRoutes, V1);
await app.register(changeOrderRoutes, V1);
await app.register(budgetLineItemRoutes, V1);
await app.register(costCodeRoutes, V1);

// Documents
await app.register(documentRoutes, V1);
await app.register(rfiRoutes, V1);
await app.register(submittalRoutes, V1);

// Field operations
await app.register(dailyReportRoutes, V1);
await app.register(timeEntryRoutes, V1);
await app.register(punchListItemRoutes, V1);
await app.register(inspectionRoutes, V1);

// Safety
await app.register(safetyIncidentRoutes, V1);
await app.register(jsaRecordRoutes, V1);
await app.register(safetyCertificationRoutes, V1);

// Estimating
await app.register(bidPackageRoutes, V1);
await app.register(takeoffItemRoutes, V1);
await app.register(markupRoutes, V1);
await app.register(estimateRoutes, V1);
await app.register(estimateAssemblyRoutes, V1);
await app.register(vendorRoutes, V1);
await app.register(vendorBidRoutes, V1);

// Dashboard
await app.register(dashboardRoutes, V1);

// Timecards
await app.register(timecardRoutes, V1);

// Reports
await app.register(reportsRoutes, V1);

// Contracts & Schedule
await app.register(contractRoutes, V1);
await app.register(scheduleTaskRoutes, V1);
await app.register(taskDependencyRoutes, V1);
await app.register(crewAssignmentRoutes, V1);
await app.register(milestoneRoutes, V1);

// Enterprise
await app.register(apiKeyRoutes, V1);

// Trade modules
await app.register(electricalPanelRoutes, V1);
await app.register(electricalCircuitRoutes, V1);
await app.register(plumbingSystemRoutes, V1);
await app.register(plumbingFixtureRoutes, V1);
await app.register(concretePourRoutes, V1);
await app.register(concreteTestRecordRoutes, V1);
await app.register(framingInspectionRoutes, V1);
await app.register(hvacEquipmentRoutes, V1);
await app.register(roofingSystemRoutes, V1);
await app.register(roofingQaRecordRoutes, V1);
await app.register(framingCorrectionItemRoutes, V1);

// Platform services
await app.register(fileRoutes, V1);
await app.register(notificationRoutes, V1);
await app.register(billingRoutes, V1);
await app.register(syncRoutes, V1);
await app.register(connectionRoutes, V1);
await app.register(subPortalRoutes, V1);
await app.register(clientPortalRoutes, V1);
await app.register(clientStudioRoutes, V1);
await app.register(studioRoutes, V1);
await app.register(pusherAuthRoutes, V1);

// Integrations (OAuth flows)
await app.register(quickbooksIntegrationRoutes, V1);
await app.register(gustoRoutes, V1);
await app.register(adpRoutes, V1);

// Payroll
await app.register(payrollRoutes, V1);
await app.register(payrollSettingsRoutes, V1);

// Org settings & Clock In/Out
import { settingsOrgRoutes } from './routes/v1/settings-org.js';
import { timePunchRoutes } from './routes/v1/time-punches.js';
await app.register(settingsOrgRoutes, V1);
await app.register(timePunchRoutes, V1);

// Webhooks
await app.register(stripeWebhookRoutes, V1);
await app.register(quickbooksWebhookRoutes, V1);
await app.register(docusignWebhookRoutes, V1);

// Blueprint Intelligence
import { blueprintRoutes } from './routes/v1/blueprints.js';
await app.register(blueprintRoutes, V1);

// Trade permits & code reference (trade-aware: electrical + plumbing)
import { permitRoutes } from './routes/v1/permits.js';
import { electricalCodeRoutes } from './routes/v1/electrical-codes.js';
import { plumbingCodeRoutes } from './routes/v1/plumbing-codes.js';
import { mechanicalCodeRoutes } from './routes/v1/mechanical-codes.js';
import { buildingCodeRoutes } from './routes/v1/building-codes.js';
import { jurisdictionRoutes } from './routes/v1/jurisdictions.js';
import { tradeRoutes } from './routes/v1/trades.js';
await app.register(permitRoutes, V1);
await app.register(electricalCodeRoutes, V1);
await app.register(plumbingCodeRoutes, V1);
await app.register(mechanicalCodeRoutes, V1);
await app.register(buildingCodeRoutes, V1);
await app.register(jurisdictionRoutes, V1);
await app.register(tradeRoutes, V1);

// Asset Management (Business+ — T-56)
// IMPORTANT: assetFuelRoutes registers /assets/fuel-summary (static); must come before assetRoutes /:id
import { assetFuelRoutes } from './routes/v1/asset-fuel.js';
import { assetRoutes } from './routes/v1/assets.js';
import { assetGroupRoutes } from './routes/v1/asset-groups.js';
import { assetAssignmentRoutes } from './routes/v1/asset-assignments.js';
import { assetServiceRoutes } from './routes/v1/asset-service.js';
import { assetInspectionRoutes } from './routes/v1/asset-inspections.js';
import { assetWarrantyRoutes } from './routes/v1/asset-warranties.js';
import { assetInsuranceRoutes } from './routes/v1/asset-insurance.js';
import { assetComplianceRoutes } from './routes/v1/asset-compliance.js';
import { assetDepreciationRoutes } from './routes/v1/asset-depreciation.js';
import { assetDamageRoutes } from './routes/v1/asset-damage.js';
import { assetDocumentRoutes } from './routes/v1/asset-documents.js';
// Map layers (Doc 20 Phase 5): /assets/map is static — must register before assetRoutes /:id
import { mapLayerRoutes } from './routes/v1/map-layers.js';
await app.register(mapLayerRoutes, V1);
await app.register(assetFuelRoutes, V1);
await app.register(assetRoutes, V1);
await app.register(assetGroupRoutes, V1);
await app.register(assetAssignmentRoutes, V1);
await app.register(assetServiceRoutes, V1);
await app.register(assetInspectionRoutes, V1);
await app.register(assetWarrantyRoutes, V1);
await app.register(assetInsuranceRoutes, V1);
await app.register(assetComplianceRoutes, V1);
await app.register(assetDepreciationRoutes, V1);
await app.register(assetDamageRoutes, V1);
await app.register(assetDocumentRoutes, V1);

// Builder Warranties (Business+ — same tier gate as Asset Management)
import { warrantyCoverageTemplateRoutes } from './routes/v1/warranty-coverage-templates.js';
import { builderWarrantyRoutes } from './routes/v1/builder-warranties.js';
import { warrantyClaimRoutes } from './routes/v1/warranty-claims.js';
import { warrantyInsuranceRoutes } from './routes/v1/warranty-insurance.js';
import { homeownerAuthRoutes } from './routes/v1/homeowner-auth.js';
import { homeownerWarrantyRoutes } from './routes/v1/homeowner-warranty.js';
await app.register(warrantyCoverageTemplateRoutes, V1);
await app.register(builderWarrantyRoutes, V1);
await app.register(warrantyClaimRoutes, V1);
await app.register(warrantyInsuranceRoutes, V1);
await app.register(homeownerAuthRoutes, V1);
await app.register(homeownerWarrantyRoutes, V1);

// Super admin (platform-level — uses its own requireSuperAdmin guard, not tenant JWT)
await app.register(adminRoutes, V1);
await app.register(portalMigrationRoutes, V1);
await app.register(adminJurisdictionRoutes, V1);
await app.register(auditLogRoutes, V1);

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const shutdown = async () => {
  await stopQueue();
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ─── Start ────────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    // Load the jurisdiction/codes reference cache (code_editions + jurisdiction_layers) before
    // serving traffic — resolveJurisdiction() reads it synchronously (Doc 16 Phase 2).
    await loadReferenceCache();

    await app.listen({
      port: Number(process.env.PORT ?? 3000),
      host: '0.0.0.0',
    });
    // Start background job workers after server is listening
    await startWorkers();
    await startFieldCostWorker();
    await startLaborSummaryScanWorker();
    await startStudioRenderWorker(); // dedicated queue — long image-provider calls

    // Schedule nightly budget variance scan (6am UTC, idempotent — pg-boss dedupes)
    const boss = await getQueue();
    await boss.schedule('reconciliation.budget_variance_scan', '0 6 * * *', {});

    // Schedule midnight auto-clockout scan (23:55 UTC — closes all open punches)
    await boss.schedule('time_punches.auto_clockout_scan', '55 23 * * *', {});
    // ⚠️ Scheduled queues need their OWN boss.work consumer — the 'jobs' switch never
    // receives them (its auto_clockout_scan case was dead code; jobs sat in `created`
    // since the cron shipped). Registered here next to the schedule so it can't drift.
    await boss.work('time_punches.auto_clockout_scan', async () => {
      await handleTimePunchAutoClockoutScan({});
    });

    // Nightly cross-tenant labor summary scan (00:30 UTC — yesterday's entries, after
    // the 23:55 auto-clockout closes punches). Consumer registered in
    // startLaborSummaryScanWorker() (dedicated queue, same rule as above).
    await boss.schedule('cross_tenant.labor_summary_scan', '30 0 * * *', {});

    // Warranty expiry (07:00 UTC daily — coverage + insurance alerts). The old schedule
    // targeted `warranty.daily_expiry_check` directly — no consumer, no tenant_id → never
    // fired. Unschedule it (the stale pgboss.schedule row persists otherwise) and route
    // through a scan queue with its own consumer (same rule as auto_clockout above).
    await boss.unschedule('warranty.daily_expiry_check').catch(() => {}); // no-op on fresh envs
    await boss.schedule('warranty.daily_expiry_scan', '0 7 * * *', {});
    await startWarrantyScanWorker();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
