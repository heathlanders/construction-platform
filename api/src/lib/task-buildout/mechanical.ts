// task-buildout/mechanical.ts — IMC/UMC-based work-step recipes by phase.
// gating_inspection_type aligns to: rough_in, duct_leakage, equipment_set, gas_refrigerant_test, final.

import type { BuildContext, WorkStep } from './types.js';
import { codeRefsFor } from './code-refs.js';

const T: import('../jurisdictions/types.js').Trade = 'mechanical';

function energyCode(ctx: BuildContext): boolean {
  return !!(ctx.facts.flags.has_title24 || ctx.facts.flags.has_hers_verification);
}
function hasGas(ctx: BuildContext): boolean {
  return !!(ctx.facts.flags.has_natural_gas || ctx.facts.flags.has_propane_gas);
}

export function buildMechanical(ctx: BuildContext): WorkStep[] {
  const ct = ctx.resolved.code_type || 'IMC';
  const phase = (ctx.task.phase ?? '').toLowerCase();
  const title = ctx.task.title.toLowerCase();
  const cr = (it: string) => codeRefsFor(T, it, ct, ctx.task.trade_type);

  if (phase === 'rough_in' || phase === 'rough') {
    const steps: WorkStep[] = [{
      step_order: 1, title: 'Rough ductwork & line sets',
      instruction: `Install supply/return ductwork, refrigerant line sets, and flue/vent rough per ${ct} Ch. 6 & 3, with required clearances and support.`,
      code_refs: cr('rough_in'),
      tools: ['duct shears', 'crimpers', 'drill', 'level'],
      materials: ['duct & fittings', 'line set', 'hangers', 'mastic/tape'],
      safety: ['Cut-resistant gloves', 'Fall protection in attics', 'Eye protection'],
      gating_inspection_type: 'rough_in',
      qa_check: 'Clearances to combustibles met; duct supported & sealed at joints.',
    }];
    if (energyCode(ctx)) {
      steps.push({
        step_order: 2, title: 'Seal ducts for leakage test',
        instruction: `Seal all duct joints with mastic and prepare for a duct-leakage test per IECC 403 / Title-24.`,
        code_refs: cr('duct_leakage'),
        tools: ['mastic brush', 'duct blaster'],
        materials: ['mastic', 'UL-181 tape'],
        safety: ['Eye protection'],
        gating_inspection_type: 'duct_leakage',
        qa_check: 'Leakage within the energy-code threshold (CFM) for the system.',
      });
    }
    return steps;
  }

  if (phase === 'equipment' || phase === 'commissioning' || title.includes('equipment') || title.includes('set') || title.includes('furnace') || title.includes('condenser')) {
    const steps: WorkStep[] = [{
      step_order: 1, title: 'Set equipment',
      instruction: `Set and secure the furnace/air handler/condenser with code clearances and access per ${ct} Ch. 3; connect ducts, condensate, and electrical disconnect.`,
      code_refs: cr('equipment_set'),
      tools: ['dolly', 'level', 'drill', 'gauges'],
      materials: ['equipment pad', 'condensate line', 'disconnect', 'fasteners'],
      safety: ['Team lift / mechanical lift', 'LOTO on electrical'],
      gating_inspection_type: 'equipment_set',
      qa_check: 'Service clearance & access maintained; condensate routed to approved point.',
    }];
    if (hasGas(ctx)) {
      steps.push({
        step_order: 2, title: 'Pressure-test gas / refrigerant',
        instruction: 'Pressure-test gas piping and/or evacuate & charge refrigerant; hold for the AHJ test inspection.',
        code_refs: cr('gas_refrigerant_test'),
        tools: ['manifold gauges', 'vacuum pump', 'gas test gauge'],
        materials: ['refrigerant', 'nitrogen'],
        safety: ['No open flame during gas test', 'Refrigerant handling PPE'],
        gating_inspection_type: 'gas_refrigerant_test',
        qa_check: 'Holds test pressure; vacuum pulled to spec before charging.',
      });
    }
    return steps;
  }

  if (phase.startsWith('finishes') || title.includes('final') || title.includes('air balance') || title.includes('startup')) {
    return [{
      step_order: 1, title: 'Start up & verify',
      instruction: `Start the system, verify airflow/temperature split, controls, and combustion safety per ${ct} Ch. 5; balance registers.`,
      code_refs: cr('final'),
      tools: ['manometer', 'thermometer', 'combustion analyzer'],
      materials: ['filters', 'register dampers'],
      safety: ['CO monitoring during combustion check'],
      gating_inspection_type: 'final',
      qa_check: 'Temp split in range; combustion safe; thermostat controls all stages.',
    }];
  }

  return [{
    step_order: 1, title: ctx.task.title,
    instruction: ctx.task.description?.trim() || `Complete the mechanical work for "${ctx.task.title}" per ${ct} and the approved drawings.`,
    code_refs: cr('rough_in'),
    tools: ['hand tools'],
    materials: [],
    safety: ['Eye protection'],
    qa_check: 'Work matches the approved mechanical drawings.',
  }];
}
