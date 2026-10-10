// task-buildout/equipment-rules.ts — deterministic equipment recommendation for a work step.
//
// Pure, no I/O, no AI (mirrors the recipe modules). Keyed on the same signals the recipes use:
// permit trade + task phase/trade/title + step title + BlueprintFacts + building type (for scale).
// Returns the heavy equipment / power tools a crew needs to do the step EFFICIENTLY. Advisory only.

import type { BuildContext, EquipmentNeed } from './types.js';
import { need, type EquipmentType } from './equipment-vocab.js';

function has(ctx: BuildContext, ...keys: string[]): boolean {
  return keys.some((k) => ctx.facts.components.includes(k));
}

// Commercial / multi-family / industrial imply taller work + heavier sets than a single-family house.
function isLargeScale(ctx: BuildContext): boolean {
  return ctx.buildingType === 'commercial' || ctx.buildingType === 'industrial' || ctx.buildingType === 'residential_mf';
}

function dedupe(list: EquipmentNeed[]): EquipmentNeed[] {
  const seen = new Set<string>();
  const out: EquipmentNeed[] = [];
  for (const e of list) {
    if (seen.has(e.type)) continue;
    seen.add(e.type);
    out.push(e);
  }
  return out;
}

/**
 * Equipment needed for one step. `permitTrade` = tradeToPermitTrade(task.trade_type) (never null here —
 * index.ts short-circuits no-trade tasks). Returns [] when the step needs no special equipment.
 */
export function equipmentFor(permitTrade: string, ctx: BuildContext, stepTitle: string): EquipmentNeed[] {
  const phase = (ctx.task.phase ?? '').toLowerCase();
  const trade = (ctx.task.trade_type ?? '').toLowerCase();
  const t = `${ctx.task.title} ${stepTitle}`.toLowerCase();
  const large = isLargeScale(ctx);
  const out: EquipmentNeed[] = [];
  const add = (type: EquipmentType, reason: string, optional = false) => out.push(need(type, reason, optional));

  switch (permitTrade) {
    case 'building': {
      // Site prep / sitework / earthwork
      if (
        phase === 'site_prep' || phase === 'sitework' || trade === 'civil' || trade === 'sitework' ||
        /excavat|grading|clearing|erosion|site work|earthwork|backfill/.test(t)
      ) {
        add('excavator', 'Bulk excavation, grading and cut/fill to the site plan');
        add('skid_steer', 'Move material and fine-grade around the pad', true);
        add('compactor', 'Compact fill/subgrade in lifts');
        if (/utilit|trench|sewer|water service/.test(t)) add('trencher', 'Trench utility runs to depth');
        add('dump_truck', 'Haul spoil / import fill', true);
        break;
      }
      // Foundation / concrete
      if (phase === 'foundation' || trade === 'concrete' || /footing|foundation|slab|pour/.test(t)) {
        if (/footing|foundation|excavat/.test(t)) add('excavator', 'Dig footings/foundation to bearing');
        if (large || /concrete pump|mat slab|large pour|elevated (deck|slab)/.test(t)) {
          add('concrete_pump', 'Place concrete where a chute cannot reach');
        }
        if (/slab|flatwork|finish/.test(t)) add('power_trowel', 'Machine-finish the slab surface');
        break;
      }
      // Framing / sheathing
      if (phase === 'framing' || trade === 'framing' || trade === 'structural' || /fram|sheath/.test(t)) {
        if (has(ctx, 'engineered_trusses') || has(ctx, 'lvl_beam') || large) {
          add('crane', 'Set trusses / engineered beams safely');
          add('telehandler', 'Hoist and place framing packages', true);
        } else {
          add('forklift', 'Hoist lumber/truss packages to the deck', true);
        }
        if (large) add('scissor_lift', 'Reach elevated wall/roof framing');
        break;
      }
      // Roofing
      if (phase === 'roofing' || trade === 'roofing' || /roof/.test(t)) {
        add('material_hoist', 'Load roofing material to the roof');
        if (has(ctx, 'engineered_trusses') || large) add('boom_lift', 'Reach roof edge/height safely', true);
        break;
      }
      // Insulation / drywall / finishes at height
      if (phase === 'insulation' || phase === 'drywall' || phase.startsWith('finishes')) {
        if (large) add('scissor_lift', 'Reach high walls/ceilings', true);
        break;
      }
      break;
    }

    case 'electrical': {
      // Overhead rough-in / feeders in tall spaces
      if (phase === 'rough_in' || /rough|feeder|conduit|tray|lighting/.test(t)) {
        if (large) add('scissor_lift', 'Reach ceiling-height conduit/tray and fixtures', true);
      }
      if (/temporary power|temp power|service/.test(t)) add('generator', 'Temporary jobsite power', true);
      break;
    }

    case 'plumbing': {
      if (phase === 'foundation' || /underground|under-slab|sewer|water service|excavat/.test(t)) {
        add('excavator', 'Excavate under-slab / sewer & water runs');
        add('trencher', 'Trench service laterals', true);
      }
      if ((phase === 'rough_in' || /rough|riser|stack/.test(t)) && large) {
        add('scissor_lift', 'Reach overhead waste/vent and risers', true);
      }
      break;
    }

    case 'mechanical': {
      // Rooftop / heavy equipment set
      if (/rtu|rooftop|equipment set|ahu|air handler|condenser|unit set/.test(t) || (phase === 'rough_in' && large && /roof/.test(t))) {
        add('crane', 'Set rooftop/heavy HVAC equipment');
        add('telehandler', 'Move and stage equipment', true);
      }
      if ((phase === 'rough_in' || /duct/.test(t)) && large) {
        add('scissor_lift', 'Install overhead ductwork at ceiling height', true);
      }
      break;
    }
  }

  return dedupe(out);
}
