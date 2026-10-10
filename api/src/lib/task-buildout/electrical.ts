// task-buildout/electrical.ts — NEC-based work-step recipes by phase.
// gating_inspection_type values align to the electrical inspection sequence
// (temporary_power, rough_in, service, cover, final).

import type { BuildContext, WorkStep } from './types.js';
import { codeRefsFor } from './code-refs.js';

const T: import('../jurisdictions/types.js').Trade = 'electrical';

function panelAmp(ctx: BuildContext): string {
  const a = ctx.facts.panels.find((p) => p.amperage)?.amperage;
  return a ? `${a}A` : 'the specified';
}
function deviceCount(ctx: BuildContext): string {
  const n = ctx.facts.fixtures.reduce((s, f) => s + (f.count ?? 0), 0);
  return n > 0 ? `${n}` : 'all scheduled';
}

export function buildElectrical(ctx: BuildContext): WorkStep[] {
  const ct = ctx.resolved.code_type || 'NEC';
  const phase = (ctx.task.phase ?? '').toLowerCase();
  const title = ctx.task.title.toLowerCase();
  const cr = (it: string) => codeRefsFor(T, it, ct, ctx.task.trade_type);

  // Service / panel work — keyed off phase or title.
  if (title.includes('panel') || title.includes('service') || phase === 'service') {
    return [
      {
        step_order: 1, title: 'Set service equipment',
        instruction: `Mount and level the ${panelAmp(ctx)} main panel and meter base at the approved location; install the service mast/lateral and bond the neutral per ${ct} 230/250.`,
        code_refs: cr('service'),
        tools: ['drill', 'level', 'torque screwdriver', 'wire strippers', 'hammer drill'],
        materials: ['main panel', 'meter base', 'service conductors', 'grounding electrode conductor', 'ground rods'],
        safety: ['Confirm utility de-energized / no back-feed', 'Lockout-tagout', 'Arc-flash PPE for any live work'],
        gating_inspection_type: 'service',
        qa_check: 'Service grounded & bonded once; conductor sizing matches panel rating; working clearances per 110.26.',
      },
      {
        step_order: 2, title: 'Land branch circuits & label',
        instruction: 'Land branch and feeder conductors on correctly-sized breakers, torque to spec, and create a typed panel directory.',
        code_refs: cr('service'),
        tools: ['torque screwdriver', 'label maker'],
        materials: ['breakers', 'panel directory card'],
        safety: ['Verify breakers off before landing', 'Arc-flash PPE'],
        gating_inspection_type: 'service',
        qa_check: 'Every breaker torqued to label spec; directory complete and accurate.',
      },
    ];
  }

  if (phase === 'rough_in' || phase === 'rough') {
    return [
      {
        step_order: 1, title: 'Set boxes & rough openings',
        instruction: `Mount device, fixture, and junction boxes at code heights for ${deviceCount(ctx)} devices; maintain box fill and support per ${ct} 314.`,
        code_refs: cr('rough_in'),
        tools: ['tape measure', 'hammer/screw gun', 'box level', 'stud finder'],
        materials: ['device boxes', 'fixture boxes', 'box supports', 'nail plates'],
        safety: ['Eye protection', 'Watch for existing live circuits in remodels'],
        gating_inspection_type: 'rough_in',
        qa_check: 'Box fill within limits; boxes flush to finished surface; supported within 8" of cable entry.',
      },
      {
        step_order: 2, title: 'Pull & secure conductors',
        instruction: `Run conductors/cable along the framing, secure per ${ct} 300, protect from physical damage with nail plates, and maintain bend radius.`,
        code_refs: cr('rough_in'),
        tools: ['fish tape', 'cable stapler', 'wire strippers'],
        materials: ['NM-B / conductors', 'staples', 'nail plates', 'wire connectors'],
        safety: ['Eye protection', 'Knee pads / fall protection in attics'],
        gating_inspection_type: 'rough_in',
        qa_check: 'Cable secured every 4.5 ft & within 12" of boxes; 6"–8" free conductor at each box.',
      },
      {
        step_order: 3, title: 'Make up grounds & call rough-in',
        instruction: 'Make up equipment-grounding conductors in every box, pigtail devices, then schedule the AHJ rough-in inspection before any wall cover.',
        code_refs: cr('rough_in'),
        tools: ['linesman pliers', 'wire connectors'],
        materials: ['grounding pigtails', 'wire connectors'],
        safety: ['Verify circuits de-energized'],
        gating_inspection_type: 'rough_in',
        qa_check: 'Grounds continuous; no closed walls until rough-in passes.',
      },
    ];
  }

  if (phase === 'insulation' || phase === 'drywall' || phase === 'cover') {
    return [{
      step_order: 1, title: 'Pre-cover verification',
      instruction: 'Verify all rough-in corrections are complete and nothing is concealed before insulation/drywall; obtain cover inspection if the AHJ requires it.',
      code_refs: cr('cover'),
      tools: ['flashlight', 'inspection checklist'],
      materials: [],
      safety: ['Eye protection'],
      gating_inspection_type: 'cover',
      qa_check: 'No open splices; all boxes accessible; rough-in corrections cleared.',
    }];
  }

  if (phase.startsWith('finishes') || phase === 'commissioning' || title.includes('trim') || title.includes('fixture') || title.includes('final')) {
    return [
      {
        step_order: 1, title: 'Trim out devices & fixtures',
        instruction: `Install ${deviceCount(ctx)} devices, plates, and fixtures; terminate, and verify polarity and grounding.`,
        code_refs: cr('final'),
        tools: ['screwdriver', 'receptacle tester', 'voltage tester'],
        materials: ['receptacles', 'switches', 'cover plates', 'fixtures'],
        safety: ['De-energize before terminating', 'Verify with tester before touching'],
        gating_inspection_type: 'final',
        qa_check: 'Correct polarity at every receptacle; no open grounds.',
      },
      {
        step_order: 2, title: 'Verify AFCI / GFCI protection',
        instruction: `Confirm AFCI protection per ${ct} 210.12 and GFCI protection per ${ct} 210.8 at all required locations; test each device.`,
        code_refs: cr('final'),
        tools: ['AFCI/GFCI tester'],
        materials: ['AFCI/GFCI breakers or receptacles'],
        safety: ['Energize circuits one at a time'],
        gating_inspection_type: 'final',
        qa_check: 'Every required AFCI/GFCI trips and resets; panel directory final.',
      },
    ];
  }

  if (phase === 'site_prep' || title.includes('temporary') || title.includes('temp power')) {
    return [{
      step_order: 1, title: 'Set temporary power',
      instruction: `Install a temporary service pole/panel with GFCI protection per ${ct} Art. 590; coordinate the utility set and AHJ temp-power inspection.`,
      code_refs: cr('temporary_power'),
      tools: ['post-hole tools', 'drill', 'level'],
      materials: ['temp pole', 'temp panel', 'GFCI receptacles', 'ground rod'],
      safety: ['Verify no back-feed', 'GFCI on all temp circuits'],
      gating_inspection_type: 'temporary_power',
      qa_check: 'GFCI on all 15/20A temp receptacles; grounded.',
    }];
  }

  // Fallback generic electrical step.
  return [{
    step_order: 1, title: ctx.task.title,
    instruction: ctx.task.description?.trim() || `Complete the electrical work for "${ctx.task.title}" per ${ct} and the approved drawings.`,
    code_refs: cr('rough_in'),
    tools: ['hand tools', 'voltage tester'],
    materials: [],
    safety: ['De-energize before working', 'Verify with tester'],
    qa_check: 'Work matches the approved electrical drawings.',
  }];
}
