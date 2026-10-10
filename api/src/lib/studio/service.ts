// studio/service.ts — shared Design Studio DB logic used by the contractor routes, the client routes
// and the render worker. Everything runs on a PoolClient INSIDE withTenantContext (RLS).
//
// DTO rule (invariant 2): `clientScopeDto` exposes the spec, summary, requirements, renders and ONLY
// the range bounds — never lines, totals, catalog costs or markups. `contractorScopeDto` adds those.

import type { PoolClient } from 'pg';
import { z } from 'zod';
import { loadCatalog } from '../../services/estimates.js';
import { generateDownloadUrl } from '../storage.js';
import { resolveJurisdiction } from '../jurisdictions/index.js';
import {
  buildRequirements, commonSteps, getIntakeModule, loadSpec, missingRequired, priceScope, summarizeSpec,
  type CommonValues, type RequirementItem, type ScopePricing, type ScopeSpec, type TradeIntakeModule,
} from '../intake/index.js';
import type { CatalogItem, EstimateParams } from '../estimating/types.js';

// ── Offering settings (contractor-tuned pricing params for client ranges) ───────────────────────

export const offeringSettingsSchema = z.object({
  labor_rate_cents: z.number().int().min(0).max(100_000).default(7_500),
  overhead_pct: z.number().min(0).max(100).default(10),
  profit_pct: z.number().min(0).max(100).default(10),
  tax_pct: z.number().min(0).max(30).default(0),
  contingency_pct: z.number().min(0).max(50).default(5),
  renders_enabled: z.boolean().default(true),
}).strip();
export type OfferingSettings = z.infer<typeof offeringSettingsSchema>;

export function parseSettings(raw: unknown): OfferingSettings {
  const r = offeringSettingsSchema.safeParse(raw ?? {});
  return r.success ? r.data : offeringSettingsSchema.parse({});
}
export const pricingParams = (s: OfferingSettings): EstimateParams => ({
  labor_rate_cents: s.labor_rate_cents, overhead_pct: s.overhead_pct, profit_pct: s.profit_pct,
  tax_pct: s.tax_pct, contingency_pct: s.contingency_pct,
});

export interface OfferingRow { trade_key: string; enabled: boolean; display_order: number; settings: OfferingSettings }

export async function loadOfferings(client: PoolClient): Promise<OfferingRow[]> {
  const { rows } = await client.query(
    `SELECT trade_key, enabled, display_order, settings FROM tenant_trade_offerings
      WHERE deleted_at IS NULL ORDER BY display_order, trade_key`);
  return rows.map((r) => ({ ...r, settings: parseSettings(r.settings) }));
}

export async function offeringFor(client: PoolClient, tradeKey: string): Promise<OfferingRow | null> {
  return (await loadOfferings(client)).find((o) => o.trade_key === tradeKey && o.enabled) ?? null;
}

// ── Rows ────────────────────────────────────────────────────────────────────────────────────────

export interface RequestRow {
  id: string; tenant_id: string; client_user_id: string; project_id: string | null; status: string;
  title: string | null; site: Record<string, unknown>; common_values: CommonValues; common_intake_version: number;
  estimate_id: string | null; range_low_cents: number | null; range_high_cents: number | null;
  submitted_at: string | null; decline_reason: string | null; version: number; created_at: string; updated_at: string;
  proposal_response: 'accepted' | 'changes_requested' | null; proposal_responded_at: string | null; proposal_note: string | null;
}
export interface ScopeRow {
  id: string; request_id: string; trade_key: string; intake_version: number; spec: ScopeSpec;
  ai_suggestions: unknown[]; status: string; measurements_verified: boolean;
  range_low_cents: number | null; range_high_cents: number | null;
  quantities_snapshot: unknown; summary_snapshot: unknown; selected_render_id: string | null; sort_order: number; version: number;
}
export interface RenderRow {
  id: string; scope_id: string; status: string; storage_path: string | null; error: string | null;
  source_file_id: string; created_at: string; prompt?: string; provider?: string;
}

const REQUEST_COLS = `id, tenant_id, client_user_id, project_id, status, title, site, common_values, common_intake_version,
  estimate_id, range_low_cents, range_high_cents, submitted_at, decline_reason, version, created_at, updated_at,
  proposal_response, proposal_responded_at, proposal_note`;
const SCOPE_COLS = `id, request_id, trade_key, intake_version, spec, ai_suggestions, status, measurements_verified,
  range_low_cents, range_high_cents, quantities_snapshot, summary_snapshot, selected_render_id, sort_order, version`;

/** Load a request. When `clientUserId` is given the row must belong to that client (portal scope). */
export async function loadRequest(client: PoolClient, id: string, clientUserId?: string): Promise<RequestRow | null> {
  const params: unknown[] = [id];
  let sql = `SELECT ${REQUEST_COLS} FROM design_requests WHERE id = $1 AND deleted_at IS NULL`;
  if (clientUserId) { sql += ' AND client_user_id = $2'; params.push(clientUserId); }
  const { rows } = await client.query(sql, params);
  return (rows[0] as RequestRow | undefined) ?? null;
}

export async function loadScopes(client: PoolClient, requestId: string): Promise<ScopeRow[]> {
  const { rows } = await client.query(
    `SELECT ${SCOPE_COLS} FROM design_request_scopes WHERE request_id = $1 AND deleted_at IS NULL ORDER BY sort_order, created_at`,
    [requestId]);
  return rows as ScopeRow[];
}

export async function loadScope(client: PoolClient, requestId: string, scopeId: string): Promise<ScopeRow | null> {
  const { rows } = await client.query(
    `SELECT ${SCOPE_COLS} FROM design_request_scopes WHERE id = $1 AND request_id = $2 AND deleted_at IS NULL`, [scopeId, requestId]);
  return (rows[0] as ScopeRow | undefined) ?? null;
}

export async function loadRenders(client: PoolClient, scopeIds: string[]): Promise<RenderRow[]> {
  if (!scopeIds.length) return [];
  const { rows } = await client.query(
    `SELECT id, scope_id, status, storage_path, error, source_file_id, created_at, prompt, provider
       FROM design_renders WHERE scope_id = ANY($1::uuid[]) AND deleted_at IS NULL ORDER BY created_at`, [scopeIds]);
  return rows as RenderRow[];
}

export class StudioError extends Error {
  constructor(public statusCode: number, public code: string, message: string) { super(message); }
}

export function moduleFor(tradeKey: string): TradeIntakeModule {
  const m = getIntakeModule(tradeKey);
  if (!m) throw new StudioError(422, 'TRADE_NOT_SUPPORTED', `No studio intake for trade "${tradeKey}"`);
  return m;
}

/** Current-version spec for a scope row (upgrades drafts in memory). */
export function currentSpec(scope: ScopeRow): { module: TradeIntakeModule; spec: ScopeSpec } {
  const module = moduleFor(scope.trade_key);
  return { module, spec: loadSpec(module, scope.spec).spec };
}

// ── Photos ──────────────────────────────────────────────────────────────────────────────────────

/** File ids referenced by a spec's photo fields. */
export function photoFileIds(module: TradeIntakeModule, spec: ScopeSpec): string[] {
  const ids = module.steps.flatMap((s) => s.fields).filter((f) => f.type === 'photo')
    .flatMap((f) => (Array.isArray(spec.values[f.id]) ? (spec.values[f.id] as string[]) : []));
  return [...new Set(ids)];
}

/** Every id must be a studio image uploaded by this client (any scan state unless `requireReady`). */
export async function assertOwnPhotos(client: PoolClient, ids: string[], uploaderId: string, requireReady = false): Promise<void> {
  if (!ids.length) return;
  const { rows } = await client.query<{ id: string; status: string }>(
    `SELECT id, status FROM files WHERE id = ANY($1::uuid[]) AND created_by = $2 AND category = 'image'
       AND deleted_at IS NULL AND status <> 'rejected'`, [ids, uploaderId]);
  if (rows.length !== ids.length) throw new StudioError(422, 'PHOTO_NOT_FOUND', 'One or more photos were not found');
  if (requireReady && rows.some((r) => r.status !== 'ready')) {
    throw new StudioError(409, 'PHOTO_NOT_READY', 'Photos are still being checked — try again in a moment');
  }
}

/**
 * Presigned URLs for a scope's photos — ONLY studio images the request's client uploaded. The ids come
 * from the spec, which the contractor can also edit, so without this filter a spec could point at any
 * tenant file (a contract, a payroll export) and hand the client a download link for it.
 */
export async function photoUrls(client: PoolClient, ids: string[], clientUserId: string): Promise<{ id: string; status: string; url: string | null }[]> {
  if (!ids.length) return [];
  const { rows } = await client.query<{ id: string; status: string; storage_path: string | null }>(
    `SELECT id, status, storage_path FROM files
      WHERE id = ANY($1::uuid[]) AND created_by = $2 AND category = 'image' AND deleted_at IS NULL`, [ids, clientUserId]);
  return Promise.all(rows.map(async (r) => ({
    id: r.id, status: r.status,
    url: r.status === 'ready' && r.storage_path ? await generateDownloadUrl(r.storage_path).catch(() => null) : null,
  })));
}

// ── Pricing + requirements ──────────────────────────────────────────────────────────────────────

export interface CatalogCache { byCode?: Map<string, CatalogItem> }

export async function priceScopeRow(
  client: PoolClient, scope: ScopeRow, settings: OfferingSettings, cache: CatalogCache = {},
): Promise<{ module: TradeIntakeModule; spec: ScopeSpec; pricing: ScopePricing }> {
  const { module, spec } = currentSpec(scope);
  cache.byCode ??= (await loadCatalog(client)).byCode; // unfiltered: a trade pulls from several buckets
  const pricing = priceScope(module, spec, cache.byCode, pricingParams(settings), { measurementsVerified: scope.measurements_verified });
  return { module, spec, pricing };
}

/** Permit-office contact for the request's site, when the jurisdiction engine knows one. */
export function ahjForSite(site: Record<string, unknown>): { name: string | null; phone: string | null; level: string | null } | null {
  const state = typeof site.state === 'string' ? site.state : null;
  if (!state) return null;
  try {
    const r = resolveJurisdiction({
      state, city: typeof site.city === 'string' ? site.city : null,
      county_fips: typeof site.county_fips === 'string' ? site.county_fips : null,
    } as Parameters<typeof resolveJurisdiction>[0]);
    return r.ahj ? { name: r.ahj.ahj_name, phone: r.ahj.phone ?? null, level: r.ahj.ahj_level } : null;
  } catch {
    return null;
  }
}

export function requirementsFor(module: TradeIntakeModule, spec: ScopeSpec, pricing: ScopePricing, req: RequestRow): RequirementItem[] {
  return buildRequirements(module, spec.values, pricing.derived, { common: req.common_values ?? {}, ahj: ahjForSite(req.site ?? {}) });
}

/** Required common-step answers still missing for a request. */
export function missingCommon(req: RequestRow, modules: TradeIntakeModule[]): string[] {
  const loc = new Set(modules.map((m) => m.location));
  const location = loc.size === 1 ? [...loc][0]! : 'mixed';
  return missingRequired(commonSteps(location), (req.common_values ?? {}) as Record<string, never>);
}

// ── DTOs ────────────────────────────────────────────────────────────────────────────────────────

async function renderDtos(renders: RenderRow[]) {
  return Promise.all(renders.map(async (r) => ({
    id: r.id, status: r.status, created_at: r.created_at,
    url: r.status === 'succeeded' && r.storage_path ? await generateDownloadUrl(r.storage_path).catch(() => null) : null,
  })));
}

async function scopeView(client: PoolClient, req: RequestRow, scope: ScopeRow, renders: RenderRow[], settings: OfferingSettings, cache: CatalogCache) {
  const { module, spec, pricing } = await priceScopeRow(client, scope, settings, cache);
  const frozen = scope.status === 'submitted';
  const dto = {
    id: scope.id,
    trade_key: scope.trade_key,
    status: scope.status,
    values: spec.values,
    provenance: spec.provenance,
    missing: missingRequired(module.steps, spec.values),
    summary: frozen && scope.summary_snapshot ? scope.summary_snapshot : summarizeSpec(module.steps, spec.values),
    range: frozen
      ? (scope.range_low_cents != null ? { low_cents: scope.range_low_cents, high_cents: scope.range_high_cents } : null)
      : (pricing.totals.total_cents > 0 ? { low_cents: pricing.range.low_cents, high_cents: pricing.range.high_cents } : null),
    requirements: requirementsFor(module, spec, pricing, req),
    ai_suggestions: scope.ai_suggestions ?? [],
    photos: await photoUrls(client, photoFileIds(module, spec), req.client_user_id),
    renders: await renderDtos(renders.filter((r) => r.scope_id === scope.id)),
    selected_render_id: scope.selected_render_id,
    version: scope.version,
  };
  return { dto, pricing };
}

/** Client-facing scope — range bounds only (invariant 2). */
export async function clientScopeDto(client: PoolClient, req: RequestRow, scope: ScopeRow, renders: RenderRow[], settings: OfferingSettings, cache: CatalogCache) {
  return (await scopeView(client, req, scope, renders, settings, cache)).dto;
}

/** Contractor-facing scope — adds pricing detail, provenance, prompt. */
export async function contractorScopeDto(client: PoolClient, req: RequestRow, scope: ScopeRow, renders: RenderRow[], settings: OfferingSettings, cache: CatalogCache) {
  const { dto: base, pricing } = await scopeView(client, req, scope, renders, settings, cache);
  return {
    ...base,
    measurements_verified: scope.measurements_verified,
    pricing: { totals: pricing.totals, lines: pricing.lines, range: pricing.range, derived: pricing.derived },
    quantities_snapshot: scope.quantities_snapshot,
    render_prompts: renders.filter((r) => r.scope_id === scope.id).map((r) => ({ id: r.id, prompt: r.prompt, provider: r.provider, error: r.error })),
  };
}

// ── Proposal (P4) ───────────────────────────────────────────────────────────────────────────────

export interface ProposalView {
  estimate_id: string;
  total_cents: number;
  generated_at: string;
  download_url: string | null;
  /** The client's answer to THIS proposal; null when unanswered or answered an older one. */
  response: 'accepted' | 'changes_requested' | null;
  responded_at: string | null;
  note: string | null;
}

/**
 * The proposal a client may see: the request's estimate once the contractor has generated + sent its
 * proposal PDF (status sent/awarded). The total is the contractor's OFFER (it's on the PDF the client
 * already received) — not catalog/markup internals, so invariant 2 holds.
 */
export async function proposalFor(client: PoolClient, req: RequestRow): Promise<ProposalView | null> {
  if (!req.estimate_id) return null;
  const { rows: [e] } = await client.query(
    `SELECT id, total_cents, proposal_path, proposal_generated_at, status FROM estimates WHERE id = $1 AND deleted_at IS NULL`,
    [req.estimate_id]);
  if (!e || !e.proposal_path || !e.proposal_generated_at || !['sent', 'awarded'].includes(e.status)) return null;
  const current = req.proposal_responded_at && new Date(req.proposal_responded_at) >= new Date(e.proposal_generated_at);
  return {
    estimate_id: e.id,
    total_cents: e.total_cents,
    generated_at: e.proposal_generated_at,
    download_url: await generateDownloadUrl(e.proposal_path).catch(() => null),
    response: current ? req.proposal_response : null,
    responded_at: current ? req.proposal_responded_at : null,
    note: current ? req.proposal_note : null,
  };
}

export function clientRequestFields(req: RequestRow) {
  return {
    id: req.id, status: req.status, title: req.title, site: req.site, common_values: req.common_values,
    project_id: req.project_id, submitted_at: req.submitted_at, created_at: req.created_at, version: req.version,
    range: req.range_low_cents != null ? { low_cents: req.range_low_cents, high_cents: req.range_high_cents } : null,
  };
}
