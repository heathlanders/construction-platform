// task-buildout/nopermit.ts — work-step recipes for taxonomy trades with NO AHJ permit path
// (permit_trade: null — painting, tile, flooring, cabinetry, striping, cleaning …). These trades
// still deserve laborer work steps; they just carry no code refs and gate no inspection.
// Keyed by the canonical taxonomy key (T-64). Unknown no-permit trades get a generic step.

import { normalizeTradeKey, tradeDef } from '../trades/taxonomy.js';
import type { BuildContext, WorkStep } from './types.js';

const BASE = { code_refs: [] as WorkStep['code_refs'] };

export function buildNoPermit(ctx: BuildContext): WorkStep[] {
  const key = normalizeTradeKey(ctx.task.trade_type);
  const title = ctx.task.title;

  switch (key) {
    case 'painting':
      return [
        {
          ...BASE, step_order: 1, title: 'Prep & prime',
          instruction: 'Protect adjacent finishes, fill/sand defects, caulk gaps, spot-prime patches and full-prime new drywall/bare wood.',
          tools: ['sander', 'caulk gun', 'rollers/brushes', 'drop cloths'],
          materials: ['primer', 'caulk', 'spackle', 'masking tape/plastic'],
          safety: ['Ventilation', 'Respirator for sanding/spraying', 'Ladder safety'],
          qa_check: 'Surfaces smooth and dust-free; patches invisible under raking light before topcoat.',
        },
        {
          ...BASE, step_order: 2, title: 'Apply finish coats',
          instruction: 'Apply the specified finish coats (sheen per room schedule), maintaining a wet edge; cut lines straight; two coats unless spec says otherwise.',
          tools: ['rollers/brushes', 'sprayer (as specified)'],
          materials: ['finish paint per schedule'],
          safety: ['Ventilation', 'Eye protection when spraying'],
          qa_check: 'Uniform coverage, no holidays/laps; color & sheen match approved samples.',
        },
      ];

    case 'tile':
      return [
        {
          ...BASE, step_order: 1, title: 'Prep substrate & waterproof wet areas',
          instruction: 'Verify substrate flat/sound, install backer board or membrane, and waterproof wet areas (showers/tub surrounds) per the membrane manufacturer.',
          tools: ['trowel', 'utility knife', 'level'],
          materials: ['backer board', 'waterproofing membrane', 'seam tape'],
          safety: ['Silica dust control when cutting board', 'Knee protection'],
          qa_check: 'Substrate within flatness tolerance; wet-area waterproofing continuous (flood test where required).',
        },
        {
          ...BASE, step_order: 2, title: 'Set tile & grout',
          instruction: 'Lay out from control lines, set tile with the specified mortar/trowel notch, maintain joint spacing, then grout and seal per spec.',
          tools: ['wet saw', 'notched trowel', 'spacers/leveling clips', 'grout float'],
          materials: ['tile', 'thinset mortar', 'grout', 'sealant'],
          safety: ['Wet-saw eye/hearing protection', 'Silica dust control'],
          qa_check: 'Lippage within tolerance; layout matches approved pattern; grout joints full and uniform.',
        },
      ];

    case 'flooring_carpet':
    case 'flooring_wood':
    case 'flooring_resilient':
    case 'flooring_epoxy':
    case 'terrazzo':
      return [
        {
          ...BASE, step_order: 1, title: 'Prep & acclimate',
          instruction: 'Verify substrate moisture/flatness per the flooring manufacturer, patch and grind high spots, and acclimate material on site per spec.',
          tools: ['moisture meter', 'floor grinder/patch tools'],
          materials: ['floor patch/leveler', 'primer'],
          safety: ['Silica dust control', 'Knee protection'],
          qa_check: 'Moisture readings recorded and within manufacturer limits (warranty condition).',
        },
        {
          ...BASE, step_order: 2, title: 'Install flooring',
          instruction: `Install ${tradeDef(key)?.label ?? 'flooring'} per the manufacturer's pattern/adhesive spec, roll where required, and install transitions/base.`,
          tools: ['flooring cutter/saw', 'trowel/roller', 'tapping block'],
          materials: ['flooring', 'adhesive/underlayment', 'transitions', 'base'],
          safety: ['Adhesive ventilation', 'Knee protection'],
          qa_check: 'Pattern/seams per approved layout; no hollow spots; expansion gaps per spec.',
        },
      ];

    case 'cabinetry':
    case 'millwork':
    case 'countertops':
      return [
        {
          ...BASE, step_order: 1, title: 'Field-verify & layout',
          instruction: 'Field-verify dimensions against shop drawings, find high point of floor and stud locations, and snap level layout lines.',
          tools: ['laser level', 'stud finder', 'tape measure'],
          materials: ['shims'],
          safety: ['Team lift for heavy casework'],
          qa_check: 'Layout matches shop drawings; appliance/fixture openings verified against actual equipment.',
        },
        {
          ...BASE, step_order: 2, title: 'Install & scribe',
          instruction: 'Hang uppers first, set and level bases, screw through cleats into studs, scribe fillers/panels to walls, then fit tops and hardware.',
          tools: ['drill/driver', 'scribe', 'clamps', 'jig for hardware'],
          materials: ['cabinets/casework', 'fasteners', 'fillers', 'hardware'],
          safety: ['Team lift', 'Eye protection'],
          qa_check: 'Faces plumb/level and aligned; doors/drawers operate; reveals uniform.',
        },
      ];

    case 'finish_carpentry':
    case 'doors_hardware':
    case 'window_treatments':
      return [{
        ...BASE, step_order: 1, title,
        instruction: ctx.task.description?.trim() ||
          `Complete "${title}" to the finish schedule: miters tight, fasteners set and filled, hardware adjusted to operate smoothly.`,
        tools: ['miter saw', 'finish nailer', 'level', 'chisels'],
        materials: ['trim/doors/hardware per schedule', 'fasteners', 'shims', 'filler'],
        safety: ['Eye/hearing protection'],
        qa_check: 'Joints tight; reveals uniform; doors latch and swing without binding.',
      }];

    case 'pavement_marking':
      return [{
        ...BASE, step_order: 1, title: 'Lay out & stripe',
        instruction: 'Verify surface is clean/cured, lay out stalls, ADA spaces, aisles, and fire lanes to the site plan, then apply traffic paint at the specified width and mil thickness.',
        tools: ['striping machine', 'chalk line/layout tape', 'stencils'],
        materials: ['traffic paint', 'glass beads (where specified)', 'ADA/arrow stencils'],
        safety: ['Traffic control/cones', 'High-visibility vest'],
        qa_check: 'Stall counts + ADA spaces/signage match the approved site plan; lines crisp and to width.',
      }];

    case 'final_clean':
      return [{
        ...BASE, step_order: 1, title: 'Final clean',
        instruction: 'Top-down clean: remove stickers/protection, clean glass, wipe cabinets/fixtures, scrub floors, and leave surfaces punch-ready.',
        tools: ['vacuums', 'scrapers', 'glass kit'],
        materials: ['cleaning supplies'],
        safety: ['Chemical gloves', 'Ventilation'],
        qa_check: 'No paint/mortar residue, labels, or dust on any finished surface.',
      }];

    case 'landscaping':
      return [{
        ...BASE, step_order: 1, title,
        instruction: ctx.task.description?.trim() ||
          `Complete "${title}" to the landscape plan: finish-grade to drain away from structures, install plantings/hardscape per the plan schedule.`,
        tools: ['skid steer', 'rakes', 'wheelbarrow'],
        materials: ['topsoil', 'plantings/sod/seed', 'mulch/aggregate'],
        safety: ['Locate utilities before digging', 'Hydration/sun protection'],
        qa_check: 'Positive drainage maintained; plantings per plan schedule and spacing.',
      }];

    default:
      // Known no-permit trade without a dedicated recipe (surveying, cleaning services, …) —
      // one generic step so the task still has a field surface.
      return [{
        ...BASE, step_order: 1, title,
        instruction: ctx.task.description?.trim() || `Complete "${title}" per the approved plans and the subcontract scope.`,
        tools: ['hand tools'],
        materials: [],
        safety: ['Eye protection'],
        qa_check: 'Work matches the approved plans/scope.',
      }];
  }
}
