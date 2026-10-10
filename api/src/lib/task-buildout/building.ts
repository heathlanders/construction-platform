// task-buildout/building.ts — ICC (IRC/IBC) work-step recipes. The "building" permit trade covers
// foundation/concrete, framing, sheathing, roofing, insulation, and general envelope work, so this
// module branches on the task's phase + trade_type + extracted components.
// gating_inspection_type aligns to: footing, foundation, framing, sheathing, roof_dry_in, insulation, final.

import type { BuildContext, WorkStep } from './types.js';
import { codeRefsFor } from './code-refs.js';

const T: import('../jurisdictions/types.js').Trade = 'building';

function has(ctx: BuildContext, ...keys: string[]): boolean {
  return keys.some((k) => ctx.facts.components.includes(k));
}

export function buildBuilding(ctx: BuildContext): WorkStep[] {
  const ct = ctx.resolved.code_type || 'IRC';
  const phase = (ctx.task.phase ?? '').toLowerCase();
  const trade = (ctx.task.trade_type ?? '').toLowerCase();
  const title = ctx.task.title.toLowerCase();
  const cr = (it: string) => codeRefsFor(T, it, ct, ctx.task.trade_type);

  // ── Trade-specific branches (T-64 taxonomy keys) — before the phase branches, so an
  //    asphalt task in the 'sitework' phase gets asphalt steps, not generic site work. ──

  // Masonry (brick / block / stone / veneer)
  if (trade === 'masonry' || title.includes('masonry') || title.includes('cmu') || title.includes('brick veneer')) {
    return [
      {
        step_order: 1, title: 'Lay masonry units',
        instruction: `Lay units to the bond pattern with joint reinforcement and grouted cells/rebar at the spacing on the structural plan per ${ct} R606; keep courses level and plumb.`,
        code_refs: [{ code_type: ct, section: 'R606', note: 'General masonry construction' }],
        tools: ['trowels', 'levels', 'line blocks', 'mixer'],
        materials: ['CMU/brick/stone', 'mortar', 'joint reinforcement', 'rebar/grout'],
        safety: ['Silica dust control when cutting', 'Scaffold safety', 'Team lift'],
        qa_check: 'Bond pattern, reinforcement spacing, and grouted cells match the structural plan.',
      },
      {
        step_order: 2, title: 'Flash, anchor & weep veneer',
        instruction: `Install through-wall flashing and weeps at supports/openings, tie veneer with anchors at code spacing, and keep the drainage cavity clear per ${ct} R703.8.`,
        code_refs: [{ code_type: ct, section: 'R703.8', note: 'Anchored masonry veneer' }],
        tools: ['tin snips', 'drill', 'jointer'],
        materials: ['through-wall flashing', 'weep vents', 'veneer anchors'],
        safety: ['Scaffold safety', 'Eye protection'],
        qa_check: 'Flashing laps sealed and weeps open at every flashing course; anchor spacing per code.',
      },
    ];
  }

  // Asphalt paving / concrete flatwork (site paving — no building-inspection gate)
  if (
    trade === 'asphalt_paving' || trade === 'concrete_flatwork' ||
    title.includes('asphalt') || title.includes('paving') || title.includes('driveway') || title.includes('sidewalk')
  ) {
    const isAsphalt = trade === 'asphalt_paving' || title.includes('asphalt');
    return [
      {
        step_order: 1, title: 'Prep subgrade & base',
        instruction: 'Fine-grade the subgrade to plan elevations, place and compact base aggregate in lifts, and proof-roll — repair any soft spots before paving.',
        code_refs: [],
        tools: ['grader / skid steer', 'plate compactor / roller', 'laser level'],
        materials: ['base aggregate'],
        safety: ['Spotter for equipment', 'High-visibility vest'],
        qa_check: 'Base thickness/compaction per spec; grades drain to plan (no birdbaths).',
      },
      isAsphalt
        ? {
            step_order: 2, title: 'Pave & compact asphalt',
            instruction: 'Place hot-mix at the specified lift thickness, maintain mat temperature, and compact to density behind the paver; seal joints at cold seams.',
            code_refs: [],
            tools: ['paver', 'rollers', 'lutes', 'infrared thermometer'],
            materials: ['hot-mix asphalt', 'tack coat'],
            safety: ['Hot-material PPE', 'Traffic control', 'Burn awareness'],
            qa_check: 'Mat thickness + compaction per spec; smooth transitions at structures/butt joints.',
          }
        : {
            step_order: 2, title: 'Form, pour & finish flatwork',
            instruction: 'Set forms to grade, place reinforcement/mesh, pour and screed, finish (broom unless specified otherwise), then saw-cut/tool control joints on time and cure.',
            code_refs: [],
            tools: ['screed', 'bull float', 'edgers/groovers', 'concrete saw'],
            materials: ['concrete', 'mesh/rebar', 'expansion joint', 'cure compound'],
            safety: ['Concrete PPE (gloves/boots)', 'Silica dust control at saw-cutting'],
            qa_check: 'Slopes/thickness per plan (ADA where applicable); joints cut before shrinkage cracking.',
          },
    ];
  }

  // Siding / stucco / EIFS (cladding over a continuous WRB)
  if (trade === 'siding' || trade === 'stucco_eifs' || title.includes('siding') || title.includes('stucco') || title.includes('eifs')) {
    const cladding = trade === 'stucco_eifs' || title.includes('stucco') || title.includes('eifs') ? 'stucco/EIFS' : 'siding';
    return [
      {
        step_order: 1, title: 'Install WRB & flashing',
        instruction: `Install the water-resistive barrier shingle-lapped, integrate window/door head and pan flashings, and kick-out flashings at roof-wall intersections per ${ct} R703.`,
        code_refs: [{ code_type: ct, section: 'R703', note: 'Exterior covering — WRB & flashing' }],
        tools: ['cap stapler', 'utility knife', 'tin snips'],
        materials: ['WRB/house wrap', 'flashing tape', 'kick-out & head flashings'],
        safety: ['Ladder/scaffold safety', 'Fall protection'],
        qa_check: 'WRB laps shed water; every opening flashed; kick-outs installed — verify before covering.',
      },
      {
        step_order: 2, title: `Install ${cladding}`,
        instruction: `Install ${cladding} to the manufacturer's fastening/clearance requirements (ground and roof clearances, gaps at trim), maintaining course alignment.`,
        code_refs: [{ code_type: ct, section: 'R703', note: 'Cladding attachment' }],
        tools: ['siding nailer / trowels', 'levels', 'story pole'],
        materials: [`${cladding} materials`, 'fasteners/lath', 'trim & sealant'],
        safety: ['Fall protection', 'Silica dust control (fiber cement cutting)'],
        gating_inspection_type: 'final',
        qa_check: 'Clearances + fastening per manufacturer (warranty); courses straight; penetrations sealed.',
      },
    ];
  }

  // Drywall / plaster (no ICC inspection gate in the base sequence; AHJ additions still merge)
  if (phase === 'drywall' || trade === 'drywall' || trade === 'plaster' || title.includes('drywall') || title.includes('gypsum')) {
    return [
      {
        step_order: 1, title: 'Hang gypsum board',
        instruction: `Hang board with the specified type/thickness in each area (moisture/type-X where required), fastening to schedule per ${ct} R702; stagger joints and support all edges.`,
        code_refs: [{ code_type: ct, section: 'R702', note: 'Interior covering — gypsum board' }],
        tools: ['screw gun', 'drywall saw/router', 'lift'],
        materials: ['gypsum board (incl. type-X / moisture-resistant where required)', 'drywall screws', 'adhesive'],
        safety: ['Team lift / panel lift', 'Eye protection'],
        qa_check: 'Board types match room schedule (type-X at garage/ceilings where required); fastener pattern per spec.',
      },
      {
        step_order: 2, title: 'Tape & finish',
        instruction: 'Tape joints, apply successive coats feathered wider, and sand to the specified finish level; texture where scheduled.',
        code_refs: [],
        tools: ['taping knives', 'mud pan', 'pole sander'],
        materials: ['joint tape', 'joint compound', 'corner bead'],
        safety: ['Dust mask when sanding', 'Ventilation'],
        qa_check: 'Finish level met (no visible joints under raking light at level 4+); corners straight.',
      },
    ];
  }

  // ── Site prep / sitework (NOT building-inspection-gated; no framing code refs) ──
  if (
    phase === 'site_prep' || phase === 'sitework' || trade === 'civil' || trade === 'sitework' ||
    title.includes('excavat') || title.includes('grading') || title.includes('clearing') ||
    title.includes('erosion') || title.includes('utilit') || title.includes('site work')
  ) {
    return [{
      step_order: 1, title: ctx.task.title,
      instruction: ctx.task.description?.trim() ||
        `Complete "${ctx.task.title}" to the site/grading plan: maintain positive drainage away from the building and keep erosion controls in place.`,
      code_refs: [], // site work is not gated by a building inspection — no model-code section applies
      tools: ['excavator / skid steer', 'laser level', 'compactor'],
      materials: ['silt fence / erosion control', 'aggregate / fill'],
      safety: ['Trench/excavation protection (OSHA 1926 Subpart P)', 'Spotter for equipment', 'Locate utilities before digging'],
      qa_check: 'Grades to plan; positive drainage away from structure; erosion controls installed.',
    }];
  }

  // ── Foundation / concrete ──
  if (phase === 'foundation' || trade === 'concrete' || title.includes('footing') || title.includes('foundation') || title.includes('slab')) {
    return [
      {
        step_order: 1, title: 'Form & reinforce footings',
        instruction: `Excavate to bearing, set forms to grade, and place reinforcement with required cover per ${ct} R403; verify setbacks before the footing inspection.`,
        code_refs: cr('footing'),
        tools: ['laser level', 'rebar cutter/bender', 'shovel'],
        materials: ['form boards', 'rebar', 'chairs/dobies', 'tie wire'],
        safety: ['Trench/excavation protection', 'Silica dust control'],
        gating_inspection_type: 'footing',
        qa_check: 'Footing depth & width per plan; rebar cover & setbacks correct — passed before pour.',
      },
      {
        step_order: 2, title: 'Form walls/slab & set embeds',
        instruction: `Form foundation walls/slab, place vapor barrier, set anchor bolts/hold-downs at spacing, and dampproof per ${ct} R404/R406.`,
        code_refs: cr('foundation'),
        tools: ['drill', 'level', 'screed'],
        materials: ['anchor bolts', 'hold-downs', 'vapor barrier', 'waterproofing'],
        safety: ['Concrete PPE (gloves/boots)', 'Pump-line awareness during pour'],
        gating_inspection_type: 'foundation',
        qa_check: 'Anchor bolt spacing/embedment per plan; vapor barrier intact; passed before backfill/cover.',
      },
    ];
  }

  // ── Framing / sheathing ──
  if (phase === 'framing' || trade === 'framing' || trade === 'structural' || title.includes('fram') || title.includes('sheath')) {
    const trussNote = has(ctx, 'engineered_trusses') ? 'engineered trusses' : has(ctx, 'i_joists') ? 'I-joists' : 'framing members';
    const beamNote = has(ctx, 'lvl_beam') ? ' Install LVL/engineered beams per the layout and hanger schedule.' : '';
    return [
      {
        step_order: 1, title: 'Frame structure',
        instruction: `Lay out and frame walls, floors, and roof using ${trussNote} at the spans/spacing on the plans per ${ct} R602/R802.${beamNote}`,
        code_refs: cr('framing'),
        tools: ['framing nailer', 'circular saw', 'level', 'speed square'],
        materials: ['lumber / trusses', 'joist hangers', 'framing connectors', 'nails'],
        safety: ['Fall protection above 6 ft', 'Hearing/eye protection', 'Hoisting plan for trusses'],
        gating_inspection_type: 'framing',
        qa_check: 'Member sizes/spans & connectors match plan; openings headered; no rough-in concealed yet.',
      },
      {
        step_order: 2, title: 'Sheath & nail braced walls',
        instruction: `Install wall/roof sheathing and nail braced-wall panels to the schedule per ${ct} R602.10 (edge/field nailing).`,
        code_refs: cr('sheathing'),
        tools: ['framing nailer', 'chalk line'],
        materials: ['sheathing panels', 'sheathing nails', 'clips'],
        safety: ['Fall protection', 'Eye protection'],
        gating_inspection_type: 'sheathing',
        qa_check: 'Edge/field nailing spacing per shear schedule; panel gaps per manufacturer.',
      },
    ];
  }

  // ── Roofing ──
  if (phase === 'roofing' || trade === 'roofing' || title.includes('roof')) {
    const cover = has(ctx, 'metal_roofing') ? 'metal roofing' : 'the specified roof covering';
    return [
      {
        step_order: 1, title: 'Dry-in the roof',
        instruction: `Install underlayment and flashing (valleys, penetrations, edge metal) per ${ct} R905 before the dry-in inspection.`,
        code_refs: cr('roof_dry_in'),
        tools: ['roofing nailer', 'utility knife', 'tin snips'],
        materials: ['underlayment', 'ice-and-water shield', 'drip edge', 'flashing'],
        safety: ['Fall protection / harness', 'Roof-edge warning lines'],
        gating_inspection_type: 'roof_dry_in',
        qa_check: 'Underlayment lapped per spec; all penetrations & valleys flashed — passed before cover.',
      },
      {
        step_order: 2, title: `Install ${cover}`,
        instruction: `Install ${cover} to the manufacturer's pattern and fastening schedule; finish ridges/hips and seal penetrations.`,
        code_refs: cr('roof_dry_in'),
        tools: ['roofing nailer', 'seamer (metal)'],
        materials: ['roof covering', 'fasteners', 'ridge/hip caps', 'sealant'],
        safety: ['Fall protection', 'Heat/hydration on hot roofs'],
        gating_inspection_type: 'final',
        qa_check: 'Fastening pattern per manufacturer (warranty); no exposed fasteners where prohibited.',
      },
    ];
  }

  // ── Insulation ──
  if (phase === 'insulation' || trade === 'insulation' || title.includes('insulat')) {
    const ins = has(ctx, 'batt_insulation') ? 'batt' : 'the specified';
    return [{
      step_order: 1, title: 'Install insulation & air seal',
      instruction: `Air-seal penetrations, then install ${ins} insulation to the required R-values and install vapor retarder per ${ct} N1102 before the insulation inspection.`,
      code_refs: cr('insulation'),
      tools: ['staple gun', 'utility knife', 'caulk/foam gun'],
      materials: ['insulation', 'air-sealing foam/caulk', 'vapor retarder'],
      safety: ['Respirator & long sleeves', 'Eye protection'],
      gating_inspection_type: 'insulation',
      qa_check: 'R-values meet plan; no gaps/compression; penetrations sealed — passed before drywall.',
    }];
  }

  // ── Finishes / closeout ──
  if (phase.startsWith('finishes') || phase === 'commissioning' || phase === 'punch' || title.includes('final')) {
    return [{
      step_order: 1, title: 'Closeout & life-safety verify',
      instruction: `Complete finishes and verify egress, guards/handrails, and smoke/CO alarms per ${ct} R310/R312 ahead of the building final / CO.`,
      code_refs: cr('final'),
      tools: ['hand tools', 'tape measure'],
      materials: ['hardware', 'smoke/CO alarms'],
      safety: ['Eye protection'],
      gating_inspection_type: 'final',
      qa_check: 'Egress openings meet size; guards/handrails to height; alarms installed & interconnected.',
    }];
  }

  return [{
    step_order: 1, title: ctx.task.title,
    instruction: ctx.task.description?.trim() || `Complete "${ctx.task.title}" per ${ct} and the approved drawings.`,
    code_refs: [], // unknown building phase — don't assert a misleading (e.g. framing) code section
    tools: ['hand tools'],
    materials: [],
    safety: ['Eye protection'],
    qa_check: 'Work matches the approved drawings.',
  }];
}
