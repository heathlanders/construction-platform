// estimating/quantities.ts — deterministic quantity seeding from blueprint facts.
//
// Best-effort per-trade heuristics that turn extracted BlueprintFacts (panels, fixture types, rooms)
// into assembly quantities the estimator then confirms/edits. Every emitted quantity carries an
// assumption string (defensibility). Only codes present in `available` are emitted, so a tenant that
// deleted/renamed a system assembly simply gets fewer seeded lines (never a dangling code). Facts are
// thin in the text-extraction path — seeding is a head-start, not a guaranteed full takeoff.

import type { BlueprintFacts } from '../task-buildout/types.js';
import type { EstTrade, QuantityInput } from './types.js';
import { packFor, evalQty, factPresent } from '../trades/packs/runtime.js';
import { estTradeFor } from './trade-bucket.js';

function has(available: Set<string>, code: string): boolean {
  return available.has(code);
}
function push(out: QuantityInput[], available: Set<string>, trade: string, code: string, quantity: number, assumption: string): void {
  if (quantity > 0 && has(available, code)) out.push({ assembly_code: code, trade, quantity, assumptions: [assumption] });
}

function seedElectrical(facts: BlueprintFacts, available: Set<string>): QuantityInput[] {
  const out: QuantityInput[] = [];
  // Panels + service from extracted panel amperages.
  for (const p of facts.panels) {
    const amp = p.amperage ?? 0;
    const code = amp >= 200 ? 'E-PANEL-200' : 'E-PANEL-100';
    push(out, available, 'electrical', code, 1, `Panel ${amp ? `${amp}A ` : ''}from blueprint`);
  }
  if (facts.panels.length > 0) push(out, available, 'electrical', 'E-SERVICE-200', 1, 'Service entrance implied by panel schedule');

  const rooms = facts.rooms.length;
  if (rooms > 0) {
    const fixtureTypes = new Set(facts.fixtures.map((f) => f.type));
    push(out, available, 'electrical', 'E-RECEP-DUP', rooms * 6, `≈6 receptacles/room × ${rooms} rooms`);
    push(out, available, 'electrical', 'E-SWITCH-1P', rooms * 2, `≈2 switches/room × ${rooms} rooms`);
    const recessed = fixtureTypes.has('recessed_light');
    push(out, available, 'electrical', recessed ? 'E-LIGHT-REC' : 'E-LIGHT-FIX', rooms * (recessed ? 4 : 1),
      recessed ? `≈4 recessed lights/room × ${rooms} rooms` : `≈1 fixture/room × ${rooms} rooms`);
    if (fixtureTypes.has('smoke_detector') || fixtureTypes.has('co_alarm')) {
      push(out, available, 'electrical', 'E-SMOKE-CO', rooms, `≈1 smoke/CO device/room × ${rooms} rooms`);
    }
    push(out, available, 'electrical', 'E-CIRCUIT-20', Math.round(rooms * 1.5), `≈1.5 branch circuits/room × ${rooms} rooms`);
  }
  return out;
}

// Fixture tokens that indicate a plumbing fixture (from FIXTURE_TOKENS in parse-sheets.ts).
const PLUMB_FIXTURE_CODE: Record<string, string> = {
  water_heater: 'P-FIX-WH',
  garbage_disposal: 'P-FIX-KSINK',
};

function seedPlumbing(facts: BlueprintFacts, available: Set<string>): QuantityInput[] {
  const out: QuantityInput[] = [];
  let fixtureCount = 0;
  for (const f of facts.fixtures) {
    const code = PLUMB_FIXTURE_CODE[f.type];
    if (!code) continue;
    const qty = f.count ?? 1;
    push(out, available, 'plumbing', code, qty, `${f.type.replace(/_/g, ' ')} from blueprint fixture legend`);
    fixtureCount += qty;
  }
  // Rough-in per plumbing fixture.
  if (fixtureCount > 0) {
    push(out, available, 'plumbing', 'P-DWV-ROUGH', fixtureCount, `DWV rough per fixture (${fixtureCount})`);
    push(out, available, 'plumbing', 'P-SUPPLY-ROUGH', fixtureCount, `Supply rough per fixture (${fixtureCount})`);
  }
  if (facts.flags.has_natural_gas || facts.flags.has_propane_gas) {
    push(out, available, 'plumbing', 'P-GAS-LINE', 1, 'Gas line implied by gas flag on plans');
  }
  return out;
}

function seedMechanical(facts: BlueprintFacts, available: Set<string>): QuantityInput[] {
  const out: QuantityInput[] = [];
  const fixtureTypes = new Set(facts.fixtures.map((f) => f.type));
  if (fixtureTypes.has('fau')) {
    push(out, available, 'mechanical', 'M-FURNACE', 1, 'FAU on plans');
    push(out, available, 'mechanical', 'M-CONDENSER', 1, 'Cooling implied by FAU');
  }
  const rooms = facts.rooms.length;
  if (rooms > 0) push(out, available, 'mechanical', 'M-REGISTER', rooms * 2, `≈2 registers/room × ${rooms} rooms`);
  return out;
}

function seedBuilding(facts: BlueprintFacts, available: Set<string>): QuantityInput[] {
  const out: QuantityInput[] = [];
  // Openings from the window/door schedules (extracted counts).
  push(out, available, 'building', 'B-WINDOW', facts.window_count, `${facts.window_count} windows from schedule`);
  if (facts.door_count > 0) {
    const ext = Math.max(1, Math.round(facts.door_count * 0.25));
    const int = Math.max(0, facts.door_count - ext);
    push(out, available, 'building', 'B-DOOR-EXT', ext, `≈25% of ${facts.door_count} doors exterior`);
    push(out, available, 'building', 'B-DOOR-INT', int, `≈75% of ${facts.door_count} doors interior`);
  }
  // Envelope quantities from summed room floor area (when the plans carried areas).
  const area = Math.round(facts.rooms.reduce((s, r) => s + (r.area_sf ?? 0), 0));
  if (area > 0) {
    push(out, available, 'building', 'B-FRAME-SF', area, `${area} SF framed floor area`);
    push(out, available, 'building', 'B-INSUL-SF', area, `${area} SF conditioned area`);
    push(out, available, 'building', 'B-DRYWALL-SF', Math.round(area * 3.2), `≈3.2 SF wall+ceiling drywall per SF floor × ${area} SF`);
    // T-64 taxonomy-trade quantities (Doc 21) — component-gated so we only price scope on the plans.
    const comps = new Set(facts.components);
    if (!comps.has('metal_roofing')) {
      push(out, available, 'building', 'B-ROOF-SHINGLE-SQ', Math.ceil((area * 1.15) / 100),
        `≈1.15 SF roof per SF floor × ${area} SF ÷ 100 (shingle squares; no metal-roof callout)`);
    }
    if (comps.has('slab_on_grade')) {
      push(out, available, 'building', 'B-CONCRETE-CY', Math.ceil(area * (4 / 12) / 27),
        `4" slab over ${area} SF (slab-on-grade callout)`);
    }
    if (comps.has('vinyl_siding') || comps.has('metal_siding') || comps.has('house_wrap')) {
      push(out, available, 'building', 'B-SIDING-SF', Math.round(area * 1.1),
        `≈1.1 SF exterior wall per SF floor × ${area} SF (siding/WRB callout)`);
    }
    if (comps.has('masonry_veneer')) {
      push(out, available, 'building', 'B-BRICK-VENEER-SF', Math.round(area * 0.4),
        `≈0.4 SF veneer per SF floor × ${area} SF (masonry veneer callout — verify elevations)`);
    }
    if (comps.has('stucco_finish')) {
      push(out, available, 'building', 'B-STUCCO-SF', Math.round(area * 1.1),
        `≈1.1 SF exterior wall per SF floor × ${area} SF (stucco/EIFS callout)`);
    }
  }
  return out;
}

// T-64 (Doc 21): general-bucket interior-finish quantities. Conservative — only floor-area-driven
// scope every job has (paint + final clean) plus component-gated tile/cabinets. The estimator
// confirms/edits; every line carries its assumption.
function seedGeneral(facts: BlueprintFacts, available: Set<string>): QuantityInput[] {
  const out: QuantityInput[] = [];
  const area = Math.round(facts.rooms.reduce((s, r) => s + (r.area_sf ?? 0), 0));
  if (area <= 0) return out;
  const comps = new Set(facts.components);
  push(out, available, 'general', 'G-PAINT-SF', Math.round(area * 3.2),
    `≈3.2 SF paintable wall+ceiling per SF floor × ${area} SF`);
  push(out, available, 'general', 'G-CLEAN-SF', area, `${area} SF final clean`);
  if (comps.has('ceramic_tile')) {
    push(out, available, 'general', 'G-TILE-FLOOR-SF', Math.round(area * 0.15),
      `≈15% of ${area} SF floor tiled (tile callout — verify finish schedule)`);
  }
  if (comps.has('cabinetry')) {
    push(out, available, 'general', 'G-CAB-BASE-LF', 20, 'Kitchen base run ≈20 LF (cabinet callout — verify elevations)');
    push(out, available, 'general', 'G-CAB-UPPER-LF', 16, 'Kitchen upper run ≈16 LF (cabinet callout — verify elevations)');
  }
  return out;
}

/**
 * Seed assembly-mode quantities for a trade from blueprint facts.
 * `available` = the set of assembly codes present in the (tenant-merged) catalog for that trade.
 */
export function seedQuantities(trade: EstTrade, facts: BlueprintFacts, available: Set<string>): QuantityInput[] {
  switch (trade) {
    case 'electrical': return seedElectrical(facts, available);
    case 'plumbing': return seedPlumbing(facts, available);
    case 'mechanical': return seedMechanical(facts, available);
    case 'building': return seedBuilding(facts, available);
    case 'general': return seedGeneral(facts, available);
    default: return [];
  }
}

/** Canonical equipment `type` (task_steps.equipment[].type) → its EQUIP-{TYPE} catalog code. */
export function equipmentCode(type: string): string {
  return `EQUIP-${type.toUpperCase()}`;
}

/**
 * Equipment mode: one DAY line per distinct equipment type the project's task steps recommend.
 * `projectEquipment` = aggregated [{type, days}] (days ≈ tasks needing it). Only emits codes present
 * in the catalog (`available`, the 'general' EQUIP-* rows). Every line carries a defensible assumption.
 */
export function seedEquipmentQuantities(
  projectEquipment: { type: string; days: number }[],
  available: Set<string>,
): QuantityInput[] {
  const out: QuantityInput[] = [];
  for (const e of projectEquipment) {
    const code = equipmentCode(e.type);
    push(out, available, 'general', code, e.days,
      `${e.type.replace(/_/g, ' ')} — ≈${e.days} day(s) from tasks that require it`);
  }
  return out;
}

/**
 * Parametric mode: one line per requested trade = building_sf × that trade's PARAM-{TRADE} $/SF.
 * `available` = catalog codes present. Emits nothing when building_sf ≤ 0.
 */
export function seedParametricQuantities(buildingSf: number, trades: EstTrade[], available: Set<string>): QuantityInput[] {
  if (buildingSf <= 0) return [];
  const out: QuantityInput[] = [];
  for (const trade of trades) {
    const code = `PARAM-${trade.toUpperCase()}`;
    push(out, available, trade, code, buildingSf, `${buildingSf} SF × ${trade} $/SF (parametric)`);
  }
  return out;
}

/**
 * Trade Knowledge Pack quantity rules (Doc 23 §5) for the given taxonomy trade keys — typically the
 * distinct trades on the project's schedule. Only buckets in `buckets` and codes present in `available`
 * are emitted; codes already in `existing` are skipped (the hand seeders win). Each assumption is
 * prefixed `[pack <key>@<version> · <confidence>]` so the estimate shows where the number came from.
 */
export function seedFromPacks(
  tradeKeys: readonly string[],
  facts: BlueprintFacts,
  available: Set<string>,
  buckets: readonly EstTrade[],
  existing: ReadonlySet<string> = new Set(),
  buildingType: string | null = null,
): QuantityInput[] {
  const out: QuantityInput[] = [];
  const emitted = new Set(existing);
  for (const key of [...new Set(tradeKeys)].sort()) {
    const pack = packFor(key);
    if (!pack?.quantity_rules?.length) continue;
    const bucket = estTradeFor(pack.key);
    if (!buckets.includes(bucket)) continue;
    const conf = new Map((pack.assemblies ?? []).map((a) => [a.code, a.material_cost_cents.prov.confidence]));
    for (const rule of pack.quantity_rules) {
      if (emitted.has(rule.code) || !available.has(rule.code)) continue;
      const need = rule.when?.facts_any;
      if (need?.length && !need.some((f) => factPresent(facts, f))) continue;
      const bts = rule.when?.building_types as readonly string[] | undefined;
      if (bts?.length && !(buildingType && bts.includes(buildingType))) continue;
      const q = evalQty(rule, facts);
      if (q <= 0) continue;
      const tag = `[pack ${pack.key}@${pack.pack_version}${conf.get(rule.code) ? ` · ${conf.get(rule.code)}` : ''}]`;
      push(out, available, bucket, rule.code, q, `${tag} ${rule.assumption}`);
      emitted.add(rule.code);
    }
  }
  return out;
}
