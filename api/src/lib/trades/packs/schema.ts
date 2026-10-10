// trades/packs/schema.ts — Trade Knowledge Pack schema (Doc 23, proposed T-66).
//
// A pack is PURE DATA describing one taxonomy trade: field work steps, code refs, hazards, QA,
// inspection checklists, cost assemblies, quantity rules and blueprint callouts — every fact with
// provenance. Engines read packs through ./runtime.ts. Packs import only this file + ./sources.ts.
// Guards (./guards.ts) enforce the cross-file rules zod can't express.

import { z } from 'zod';
import { EQUIPMENT } from '../../task-buildout/equipment-vocab.js';
import { PHASE_ORDER } from '../../blueprint-templates/types.js';

const PHASES = PHASE_ORDER as unknown as [string, ...string[]];
const EQUIPMENT_TYPES = Object.keys(EQUIPMENT) as [string, ...string[]];
// pole_barn is a PLAN building type (blueprint templates) — the codes engine maps it to residential_sf,
// so step matching uses BuildContext.planBuildingType and estimating uses estimates.building_type.
const BUILDING_TYPES = ['residential_sf', 'residential_mf', 'commercial', 'industrial', 'pole_barn'] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ConfidenceSchema = z.enum(['verified', 'derived', 'estimate']);

export const ProvSchema = z.object({
  src: z.array(z.string().min(1)).min(1),
  confidence: ConfidenceSchema,
  last_verified: z.string().regex(DATE),
  note: z.string().max(300).optional(),
}).strict();

const sourced = <T extends z.ZodTypeAny>(v: T) => z.object({ v, prov: ProvSchema }).strict();

/**
 * Spanish text. `human_translated` = done by a professional translator (required for safety content,
 * T-08). `translated` = written by the pack author — allowed ONLY for non-safety text (guards enforce).
 * `pending_human_translation` = safety text still waiting for a translator.
 */
export const I18nTextSchema = z.union([
  z.object({ status: z.literal('human_translated'), text: z.string().min(1) }).strict(),
  z.object({ status: z.literal('translated'), text: z.string().min(1) }).strict(),
  z.object({ status: z.literal('pending_human_translation') }).strict(),
]);

export const MatchSchema = z.object({
  phase: z.array(z.enum(PHASES)).optional(),
  title_re: z.string().min(1).optional(),       // case-insensitive, tested against title + description
  facts_any: z.array(z.string()).optional(),     // component tokens or flag names
  building_types: z.array(z.enum(BUILDING_TYPES)).optional(),
}).strict();

export const StepTplSchema = z.object({
  title: z.string().min(1).max(80),
  instruction: z.string().min(1).max(600),
  detail: z.string().max(600).optional(),
  /** code_type overrides the trade family's code (e.g. 'IECC', 'NFPA 70', 'WI NR 812') for this ref. */
  code_refs: z.array(z.object({ section: z.string().min(1).max(30), note: z.string().max(120), code_type: z.string().min(2).max(20).optional() }).strict()).optional(),
  tools: z.array(z.string().min(1)),
  materials: z.array(z.string().min(1)),
  safety_ids: z.array(z.string().min(1)),
  qa_ids: z.array(z.string().min(1)).optional(),
  gating_inspection_type: z.string().min(1).optional(),
}).strict();

export const RecipeSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  when: MatchSchema,
  priority: z.number().int().optional(),
  supersedes_hand: z.boolean().optional(),
  supersedes_reason: z.string().optional(),
  /** A realistic task title this recipe should match — exercised by pack:smoke and guards. */
  example_title: z.string().min(1).max(120).optional(),
  steps: z.array(StepTplSchema).min(1).max(10),
}).strict();

export const HazardSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  hazard: z.string().min(1).max(160),
  hazard_es: I18nTextSchema,
  controls: z.array(z.string().min(1).max(200)).min(1),
  controls_es: I18nTextSchema,
  osha_ref: z.string().min(1).max(40),           // e.g. '1926.501(b)(1)'
  severity: z.number().int().min(1).max(4),      // 1 low · 2 medium · 3 high · 4 critical
  ppe: z.array(z.string()).optional(),
  prov: ProvSchema,
}).strict();

export const QaItemSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  phase: z.enum(PHASES).optional(),
  item: z.string().min(1).max(240),
  item_es: I18nTextSchema,
  safety: z.boolean().optional(),                // safety-related QA → ES needs human translation
  prov: ProvSchema,
}).strict();

export const CheckItemSchema = z.object({
  item: z.string().min(1).max(240),
  item_es: I18nTextSchema,
  ref: z.string().max(60).optional(),
}).strict();

export const PackAssemblySchema = z.object({
  code: z.string().regex(/^(E|P|M|B|G|HC)-[A-Z0-9-]+$/),
  name: z.string().min(1).max(120),
  name_es: z.string().min(1).max(120),
  description: z.string().max(300).optional(),
  unit: z.string().min(1).max(8),
  csi: z.string().min(1).max(20),
  material_cost_cents: sourced(z.number().int().min(0)),
  labor_hours_per_unit: sourced(z.number().min(0)),
  equipment_cost_cents: sourced(z.number().int().min(0)),
  waste_pct: sourced(z.number().min(0).max(100)),
}).strict();

const QtyBasisSchema = z.union([
  z.enum(['rooms', 'windows', 'doors', 'panels', 'area_sf_sum', 'const']),
  z.object({ fixture: z.string().min(1) }).strict(),
  z.object({ component: z.string().min(1) }).strict(),
]);

export const QtyRuleSchema = z.object({
  code: z.string().min(1),
  assumption: z.string().min(1).max(200),
  when: MatchSchema.optional(),
  qty: z.object({
    basis: QtyBasisSchema,
    mul: z.number().optional(),
    add: z.number().optional(),
    round: z.enum(['ceil', 'round']).optional(),
  }).strict(),
}).strict();

export const ComponentSchema = z.object({
  token: z.string().regex(/^[a-z][a-z0-9_]*$/),
  re: z.string().min(1),
  example: z.string().min(1),                    // a real callout string the regex must match
  vision_hint: z.string().max(80).optional(),    // present → token also offered to the vision model
  task: z.object({
    title: z.string().min(1).max(120),
    phase: z.enum(PHASES),
    csi: z.string().min(1),
    days: z.number().positive(),
  }).strict(),
}).strict();

export const EquipmentRuleSchema = z.object({
  when: MatchSchema,
  /** Optional regex tested against the STEP title only (case-insensitive) — scopes equipment to one step
   *  (e.g. a forklift only on "Receive and stage"); `when.title_re` sees task + step text together. */
  step_re: z.string().min(1).optional(),
  type: z.enum(EQUIPMENT_TYPES),
  reason: z.string().min(1).max(160),
  optional: z.boolean().optional(),
}).strict();

export const TradePackSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  schema_version: z.literal(1),
  pack_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.enum(['stub', 'draft', 'reviewed']),
  identity: z.object({
    summary: z.string().min(1).max(400),
    summary_es: z.string().min(1).max(400),
    glossary: z.array(z.object({
      term: z.string().min(1), term_es: z.string().min(1),
      def: z.string().min(1).max(240), def_es: z.string().max(240).optional(),
    }).strict()),
  }).strict(),
  est_bucket: z.enum(['electrical', 'plumbing', 'mechanical', 'building', 'general']).optional(),
  recipes: z.array(RecipeSchema),
  code_refs: z.record(z.array(z.object({ section: z.string().min(1).max(30), note: z.string().max(120), code_type: z.string().min(2).max(20).optional(), prov: ProvSchema }).strict())).optional(),
  equipment: z.array(EquipmentRuleSchema).optional(),
  assemblies: z.array(PackAssemblySchema).optional(),
  quantity_rules: z.array(QtyRuleSchema).optional(),
  components: z.array(ComponentSchema).optional(),
  qa_checklist: z.array(QaItemSchema).optional(),
  hazards: z.array(HazardSchema).optional(),
  inspection_checklists: z.record(z.array(CheckItemSchema)).optional(),
  dependency_hints: z.array(z.object({
    after_trades: z.array(z.string()).optional(),
    before_phase: z.enum(PHASES).optional(),
    note: z.string().min(1).max(200),
  }).strict()).optional(),
  intake_hook: z.object({ module_id: z.string().optional() }).strict().optional(),
}).strict();

export type TradePack = z.infer<typeof TradePackSchema>;
export type PackMatch = z.infer<typeof MatchSchema>;
export type PackRecipe = z.infer<typeof RecipeSchema>;
export type PackStepTpl = z.infer<typeof StepTplSchema>;
export type PackHazard = z.infer<typeof HazardSchema>;
export type PackAssembly = z.infer<typeof PackAssemblySchema>;
export type PackQtyRule = z.infer<typeof QtyRuleSchema>;
export type PackComponent = z.infer<typeof ComponentSchema>;
export type I18nText = z.infer<typeof I18nTextSchema>;
export type Prov = z.infer<typeof ProvSchema>;

/** Identity helper — gives pack authors full type-checking. Validation happens in guards/tests. */
export function definePack(pack: TradePack): TradePack {
  return pack;
}

export const PENDING_ES = { status: 'pending_human_translation' } as const;
