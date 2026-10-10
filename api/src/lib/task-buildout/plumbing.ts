// task-buildout/plumbing.ts — IPC/UPC-based work-step recipes by phase.
// gating_inspection_type aligns to: underground, rough_in, water_supply, gas_test, final.

import type { BuildContext, WorkStep } from './types.js';
import { codeRefsFor } from './code-refs.js';

const T: import('../jurisdictions/types.js').Trade = 'plumbing';

function fixtureCount(ctx: BuildContext): string {
  const n = ctx.facts.fixtures.reduce((s, f) => s + (f.count ?? 0), 0);
  return n > 0 ? `${n}` : 'all scheduled';
}
function hasGas(ctx: BuildContext): boolean {
  return !!(ctx.facts.flags.has_natural_gas || ctx.facts.flags.has_propane_gas);
}

export function buildPlumbing(ctx: BuildContext): WorkStep[] {
  const ct = ctx.resolved.code_type || 'IPC';
  const phase = (ctx.task.phase ?? '').toLowerCase();
  const title = ctx.task.title.toLowerCase();
  const cr = (it: string) => codeRefsFor(T, it, ct, ctx.task.trade_type);

  if (phase === 'foundation' || phase === 'site_prep' || title.includes('underground') || title.includes('groundwork')) {
    return [{
      step_order: 1, title: 'Set under-slab DWV',
      instruction: `Lay and grade under-slab drain/waste/vent piping per ${ct} Ch. 7, then fill with water and hold a head test for the AHJ underground inspection before the slab pour.`,
      code_refs: cr('underground'),
      tools: ['pipe cutter', 'level', 'grade laser', 'test balls'],
      materials: ['DWV pipe & fittings', 'solvent cement', 'test tees'],
      safety: ['Trench protection', 'Eye protection'],
      gating_inspection_type: 'underground',
      qa_check: 'Slope ≥ 1/4" per foot on horizontal drains; system holds water test with no drop.',
    }];
  }

  if (phase === 'rough_in' || phase === 'rough') {
    const steps: WorkStep[] = [
      {
        step_order: 1, title: 'Rough DWV & vents',
        instruction: `Run drain, waste, and vent piping for ${fixtureCount(ctx)} fixtures with proper slope and venting per ${ct} Ch. 7 & 9; support per code.`,
        code_refs: cr('rough_in'),
        tools: ['pipe cutter', 'reamer', 'level'],
        materials: ['DWV pipe & fittings', 'pipe hangers', 'solvent cement'],
        safety: ['Eye protection', 'Ventilation when cementing'],
        gating_inspection_type: 'rough_in',
        qa_check: 'DWV holds a 10-ft water/air test; every fixture vented.',
      },
      {
        step_order: 2, title: 'Rough water supply',
        instruction: `Run hot/cold supply to ${fixtureCount(ctx)} fixtures per ${ct} Ch. 6; secure, and cap for pressure test.`,
        code_refs: cr('water_supply'),
        tools: ['PEX/copper tools', 'pressure gauge'],
        materials: ['supply pipe', 'fittings', 'stub-outs', 'test caps'],
        safety: ['Eye protection'],
        gating_inspection_type: 'water_supply',
        qa_check: 'Supply holds required pressure test for the AHJ-specified duration.',
      },
    ];
    if (hasGas(ctx)) {
      steps.push({
        step_order: 3, title: 'Rough fuel-gas piping',
        instruction: `Run and pressure-test fuel-gas piping; hold the test for the AHJ gas inspection.`,
        code_refs: cr('gas_test'),
        tools: ['gas test gauge', 'pipe wrench'],
        materials: ['black iron / CSST', 'pipe dope/tape rated for gas'],
        safety: ['No open flame during test', 'Soap-test joints'],
        gating_inspection_type: 'gas_test',
        qa_check: 'Gas system holds test pressure with no drop.',
      });
    }
    return steps;
  }

  if (phase.startsWith('finishes') || phase === 'commissioning' || title.includes('trim') || title.includes('fixture') || title.includes('final')) {
    return [{
      step_order: 1, title: 'Set fixtures & trim',
      instruction: `Set and connect ${fixtureCount(ctx)} fixtures with proper traps and seals per ${ct} Ch. 4 & 1002; flush and check for leaks.`,
      code_refs: cr('final'),
      tools: ['basin wrench', 'channel locks', 'caulk gun'],
      materials: ['fixtures', 'supply lines', 'P-traps', 'wax rings', 'sealant'],
      safety: ['Lift fixtures safely', 'Eye protection'],
      gating_inspection_type: 'final',
      qa_check: 'Every fixture trapped & vented; no leaks under use; fixtures secured.',
    }];
  }

  return [{
    step_order: 1, title: ctx.task.title,
    instruction: ctx.task.description?.trim() || `Complete the plumbing work for "${ctx.task.title}" per ${ct} and the approved drawings.`,
    code_refs: cr('rough_in'),
    tools: ['hand tools'],
    materials: [],
    safety: ['Eye protection'],
    qa_check: 'Work matches the approved plumbing drawings.',
  }];
}
