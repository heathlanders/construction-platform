// Trade Knowledge Pack — fencing (Fencing & Gates). Wave 04 — NEW-TRADE pattern (no hand recipe).
// Dossier: docs/trade-packs/dossiers/fencing.md. Sources: UFGS 32 31 13 (chain link, Part 3),
// CPSC Pub. 362 Safety Barrier Guidelines for Residential Pools (public domain), manufacturer wood-fence
// installation guidelines, American Fence Association (reference), 29 CFR 1926 (C, E, I, K, O, P),
// ISPSC 305 / IRC R326.1 / IRC Appendix G AG105 (reference only).
// Most fences under the local height limit need no AHJ inspection — only pool barriers gate on `final`;
// everything else lives in descriptive inspection_checklists keys.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['fencing-ufgs-323113'], confidence: 'verified' as const, last_verified: D };
const cpsc = { src: ['fencing-cpsc-362'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['fencing-mh-postmaster'], confidence: 'derived' as const, last_verified: D, note: 'Common to published fence-post installation guidelines — follow the instructions for the system installed.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const pool = { src: ['fencing-cpsc-362', 'icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

// Blueprint callout: a NEW fence on the site plan. Excludes silt / construction fence and EXISTING fences.
const FENCE_WORDS = "(?:(?:WOOD|VINYL|PVC|CEDAR|PRIVACY|PICKET|CHAIN[- ]?LINK|ORNAMENTAL|ALUMINUM|STEEL|BOARD|SHADOWBOX|POOL|BARRIER|SPLIT[- ]RAIL)\\s+){0,3}";
const FENCE_RE = `(?<!EXISTING\\s{1,3})(?<!EX\\.\\s{0,2})\\b(?:NEW|PROPOSED|PRIVACY|POOL)\\s+(?:\\d+['\\x22]\\s*(?:HIGH\\s+|H\\s+|TALL\\s+)?)?${FENCE_WORDS}FENCE\\b|(?<!EXISTING\\s{1,3})\\b\\d+['\\x22]\\s*(?:HIGH\\s+|H\\s+|TALL\\s+)?${FENCE_WORDS}FENCE\\b`;

export default definePack({
  key: 'fencing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Builds residential and light-commercial fences and gates — wood and vinyl privacy, chain link and ornamental metal — plus pool barriers with self-closing, self-latching gates: property-line and utility checks, layout, posts set in concrete, rails / fabric / panels, and gate hardware.',
    summary_es: 'Construye cercas y portones residenciales y comerciales ligeros — de privacidad de madera y vinilo, malla ciclónica y metal ornamental — además de barreras de piscina con portones de cierre y cerrojo automáticos: revisión de linderos y servicios enterrados, trazo, postes en concreto, rieles / malla / paneles y herrajes de portón.',
    glossary: [
      { term: 'Terminal post', term_es: 'Poste terminal', def: 'End, corner or gate post — set first, heavier and braced, the line is pulled between them.', def_es: 'Poste de extremo, esquina o portón — se coloca primero, es más pesado y va arriostrado; la línea se tensa entre ellos.' },
      { term: 'Line post', term_es: 'Poste de línea', def: 'Intermediate post between terminal posts, spaced to the rail or panel length.', def_es: 'Poste intermedio entre postes terminales, separado según el largo del riel o panel.' },
      { term: 'Rail', term_es: 'Riel', def: 'Horizontal member between posts that the pickets or boards fasten to.', def_es: 'Pieza horizontal entre postes a la que se fijan las tablas o piquetes.' },
      { term: 'Picket', term_es: 'Piquete', def: 'Vertical board or bar that fills the fence between rails.', def_es: 'Tabla o barra vertical que rellena la cerca entre los rieles.' },
      { term: 'Chain link fabric', term_es: 'Malla ciclónica', def: 'Woven steel wire mesh stretched between terminal posts.', def_es: 'Malla de alambre de acero tejido que se tensa entre postes terminales.' },
      { term: 'Tension (stretcher) bar', term_es: 'Barra tensora', def: 'Flat bar woven through the end of chain link fabric and banded to the terminal post.', def_es: 'Barra plana que se entreteje en el extremo de la malla y se sujeta con abrazaderas al poste terminal.' },
      { term: 'Brace (truss) assembly', term_es: 'Conjunto de arriostramiento', def: 'Horizontal brace plus diagonal rod that keeps a terminal post plumb under fabric tension.', def_es: 'Riostra horizontal con varilla diagonal que mantiene aplomado el poste terminal bajo la tensión de la malla.' },
      { term: 'Self-closing, self-latching gate', term_es: 'Portón de cierre y cerrojo automáticos', def: 'Gate that swings shut and latches by itself — required on pool barriers.', def_es: 'Portón que se cierra y traba solo — obligatorio en barreras de piscina.' },
      { term: 'Pool barrier', term_es: 'Barrera de piscina', def: 'Fence, wall or combination that keeps young children from reaching a pool or spa unsupervised.', def_es: 'Cerca, muro o combinación que impide que niños pequeños lleguen solos a una piscina o spa.' },
      { term: 'Finish ("good") side', term_es: 'Cara de acabado', def: 'The side of the fence without exposed posts and rails; many towns require it to face the neighbor or street.', def_es: 'El lado de la cerca sin postes ni rieles a la vista; muchos municipios exigen que mire al vecino o a la calle.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'privacy_fence',
      example_title: 'Install 6 ft wood privacy fence & gates',
      when: { title_re: '\\bfenc(?:e|es|ing)\\b' },
      steps: [
        {
          title: 'Verify property line, approvals and utilities',
          instruction: 'Confirm the fence line from the survey or found property pins — never from the neighbor\'s fence. Check the local height, setback, corner-sight and finish-side rules, the permit if one is needed, and HOA approval. Get a utility locate ticket and keep every post off the marks.',
          tools: ['tape measure', 'survey / plat copy', 'marking paint', 'flags'],
          materials: [],
          safety_ids: ['utility_strike', 'overhead_lines'],
          qa_ids: ['property_line_verified', 'locate_ticket', 'zoning_hoa_approved'],
        },
        {
          title: 'Stake the layout and string the line',
          instruction: 'Stake corner, end and gate posts first, then pull a string between them. Space line posts to the rail or panel length, put short sections at corners or the house, and set gate openings to the gate width plus hardware clearance.',
          tools: ['stakes', 'mason string', 'tape measure', 'line level'],
          materials: [],
          safety_ids: ['hand_tool_strike'],
          qa_ids: ['property_line_verified', 'plumb_and_line'],
        },
        {
          title: 'Dig holes and set posts in concrete',
          instruction: 'Dig post holes to the depth and diameter the fence system calls for — deeper for corner and gate posts, below frost where posts can heave. Set terminal posts first, plumb and to height, brace them, then fill in one continuous pour and dome the top to shed water. Set line posts to the string once the terminals have hardened.',
          detail: 'Hand-dig within the tolerance zone of marked utilities. Two people on a two-person auger; stop the auger before clearing a jam or a root.',
          tools: ['power auger or post-hole digger', 'digging bar', 'level / post level', 'wheelbarrow', 'shovel'],
          materials: ['posts (pressure-treated, vinyl or steel)', 'concrete mix', 'gravel for drainage', 'temporary bracing'],
          safety_ids: ['utility_strike', 'equipment_lines', 'auger_torque', 'concrete_burn', 'heavy_lift', 'eye_flying'],
          qa_ids: ['post_depth_frost', 'concrete_domed', 'plumb_and_line'],
        },
        {
          title: 'Install rails and pickets or panels',
          instruction: 'After the concrete cures, fasten the rails at the planned heights with corrosion-resistant fasteners, then the pickets or panels. Keep a clear gap above grade so boards don\'t sit in soil, keep the top line straight or evenly stepped on slopes, and put the finish side the way the plans or local rules require.',
          tools: ['circular saw', 'drill/driver', 'nail gun', 'level', 'string line'],
          materials: ['rails', 'pickets / boards or vinyl panels', 'galvanized or stainless screws / nails', 'post caps'],
          safety_ids: ['power_tool', 'nailer', 'eye_flying', 'cord_shock'],
          qa_ids: ['ground_clearance', 'finish_side_out'],
        },
        {
          title: 'Hang gates and walk the job',
          instruction: 'Hang each gate on its gate post with heavy hinges, level and square, with an even gap at the latch and clear swing over the ground. Set the latch and any drop rod, check it closes and latches every time, clean up spoils and offcuts, and walk the line with the owner.',
          tools: ['level', 'drill/driver', 'shims'],
          materials: ['gate kit or frame', 'heavy-duty hinges', 'latch', 'drop rod / cane bolt for double gates', 'anti-sag kit'],
          safety_ids: ['heavy_lift', 'power_tool'],
          qa_ids: ['gate_swing_latch'],
        },
      ],
    },
    {
      id: 'chain_link_fence',
      example_title: 'Install 4 ft chain link fence with walk gate',
      when: { title_re: 'chain[- ]?link|cyclone' },
      priority: 10,
      steps: [
        {
          title: 'Verify the line, approvals and utilities',
          instruction: 'Confirm the line from the survey or found pins, check height and setback rules and any permit or HOA approval, and get a utility locate ticket. Clear brush along the line and make sure final grading is done before posts go in.',
          tools: ['tape measure', 'survey / plat copy', 'marking paint'],
          materials: [],
          safety_ids: ['utility_strike', 'overhead_lines'],
          qa_ids: ['property_line_verified', 'locate_ticket', 'zoning_hoa_approved'],
        },
        {
          title: 'Set terminal posts in concrete',
          instruction: 'Set end, corner, pull and gate posts first, plumb and to height, in concrete footings domed to shed water. Add pull posts at changes in direction or abrupt grade changes. Let the concrete gain strength before any fabric is stretched against these posts.',
          tools: ['power auger or post-hole digger', 'post level', 'digging bar'],
          materials: ['terminal posts', 'concrete mix', 'post caps'],
          safety_ids: ['utility_strike', 'auger_torque', 'concrete_burn', 'heavy_lift'],
          qa_ids: ['post_depth_frost', 'concrete_domed'],
        },
        {
          title: 'Set line posts, top rail and bracing',
          instruction: 'Set line posts to the string at no more than the specified spacing. Run the top rail continuously through the post caps with couplings, install brace assemblies at terminal posts, and run the bottom tension wire before the fabric.',
          tools: ['post level', 'pipe cutter', 'wrenches', 'string line'],
          materials: ['line posts', 'top rail + sleeves', 'brace rails + truss rods', 'tension wire', 'tension bands + bolts'],
          safety_ids: ['heavy_lift', 'power_tool', 'eye_flying'],
          qa_ids: ['terminal_bracing', 'plumb_and_line'],
        },
        {
          title: 'Stretch and tie the fabric, hang gates',
          instruction: 'Weave a tension bar into the fabric end, band it to the first terminal, and stretch the fabric with a come-along until it stays taut when released. Tie to line posts, top rail and tension wire, twist tie ends and bend them in. Hang gates plumb and level with full swing and a working latch.',
          tools: ['fence stretcher / come-along', 'fence pliers', 'wrenches'],
          materials: ['chain link fabric', 'tension bars', 'tie wires / hog rings', 'gate frame + hinges + latch'],
          safety_ids: ['wire_cut', 'hand_tool_strike', 'eye_flying'],
          qa_ids: ['fabric_taut', 'gate_swing_latch'],
        },
      ],
    },
    {
      id: 'pool_barrier_fence',
      example_title: 'Install pool barrier fence & self-closing gate',
      when: { title_re: '\\bpool\\b[^.]*\\b(?:fenc(?:e|es|ing)|barrier|gates?)\\b|\\b(?:fenc(?:e|es|ing)|barrier|gates?)\\b[^.]*\\b(?:pool|spa)\\b' },
      priority: 20,
      steps: [
        {
          title: 'Plan the barrier, verify line and utilities',
          instruction: 'Lay out the barrier so it fully encloses the pool or spa, using the approved plan. Keep climbable things — AC units, planters, benches, pool equipment — away from the outside of the barrier. Confirm the property line, the permit and a utility locate before digging.',
          tools: ['tape measure', 'approved site plan', 'marking paint'],
          materials: [],
          safety_ids: ['utility_strike', 'overhead_lines'],
          qa_ids: ['property_line_verified', 'locate_ticket', 'pool_no_climb_aids'],
        },
        {
          title: 'Set posts and build the barrier',
          instruction: 'Set posts in concrete, plumb and in line, then install pool-rated panels or pickets. Hold the barrier height measured on the outside, keep the bottom gap small, and keep every opening too small for a child to pass. Horizontal rails that a child could climb go on the pool side.',
          tools: ['power auger or post-hole digger', 'post level', 'drill/driver', 'tape measure'],
          materials: ['pool-code ornamental, vinyl or mesh panels', 'posts', 'concrete mix', 'stainless or coated fasteners'],
          safety_ids: ['utility_strike', 'auger_torque', 'concrete_burn', 'heavy_lift', 'power_tool'],
          qa_ids: ['post_depth_frost', 'plumb_and_line', 'pool_gaps'],
          code_refs: [{ section: '305.2', note: 'Outdoor pool barriers — height, bottom clearance and openings', code_type: 'ISPSC' }],
        },
        {
          title: 'Install the self-closing, self-latching gate',
          instruction: 'Hang every pedestrian gate to open outward, away from the pool, with self-closing hinges and a self-latching latch that can take a lock. Mount a low latch release on the pool side near the top of the gate, and shield the area around the latch so a child can\'t reach through. Test that the gate closes and latches from any open position.',
          tools: ['drill/driver', 'level', 'tape measure'],
          materials: ['pool gate', 'self-closing hinges', 'self-latching pool latch', 'latch shield / mesh'],
          safety_ids: ['power_tool', 'heavy_lift'],
          qa_ids: ['pool_gate_self_close'],
          code_refs: [{ section: '305.3', note: 'Pool gates — open outward, self-closing, self-latching', code_type: 'ISPSC' }],
        },
        {
          title: 'Close the house side and call final',
          instruction: 'Where a house wall is part of the barrier, confirm the doors and low windows into the pool area have the alarms or self-closing devices the approved plan shows — that work may belong to another trade. Walk the barrier with the PM, then call the AHJ final before the pool is filled or used.',
          tools: ['tape measure', '4 in. test gauge'],
          materials: [],
          safety_ids: ['hand_tool_strike'],
          qa_ids: ['pool_house_wall', 'pool_gate_self_close'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '305.4', note: 'House wall as part of the barrier — door and window protection', code_type: 'ISPSC' },
            { section: 'R326.1', code_type: 'IRC', note: 'Pools and spas — designed and built to the pool code' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    final: [
      { section: 'R326.1', code_type: 'IRC', note: 'Pools, spas and hot tubs — follow the swimming pool and spa code', prov: icc },
      { section: '305.2', note: 'Outdoor pool barriers — height, clearances, openings, climbability', code_type: 'ISPSC', prov: icc },
      { section: '305.3', note: 'Pool barrier gates — swing, self-closing, self-latching, latch release', code_type: 'ISPSC', prov: icc },
      { section: '305.4', note: 'Dwelling wall as part of the barrier', code_type: 'ISPSC', prov: icc },
      { section: 'AG105', code_type: 'IRC', note: 'Older IRC editions — pool barrier requirements in Appendix G', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: '\\bfenc(?:e|es|ing)\\b|\\bbarrier\\b' }, type: 'skid_steer', reason: 'Auger attachment to drill many post holes on long runs or hard soil', optional: true },
    { when: { title_re: 'remov|replac|tear[- ]?out|demo' }, type: 'dump_truck', reason: 'Haul old fence, footings and spoils', optional: true },
    { when: { title_re: '\\bfenc(?:e|es|ing)\\b' }, type: 'air_compressor', reason: 'Pneumatic nailer for pickets and rails on wood fences', optional: true },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Striking buried gas, electric or communication lines while digging post holes', hazard_es: PENDING_ES, controls: ['Get a utility locate before digging and keep the ticket on site', 'Hand-dig within the tolerance zone of marked lines; never auger through a mark'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'overhead_lines', hazard: 'Contact with overhead power or service drops while handling long posts, rails or equipment', hazard_es: PENDING_ES, controls: ['Look up before standing posts or moving rails', 'Keep tools, materials and people clear of energized lines; call the utility if work must get close'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'equipment_lines', hazard: 'Skid steer or auger mast contacting overhead power lines', hazard_es: PENDING_ES, controls: ['Keep the required clearance from power lines when operating or moving equipment', 'Use a spotter near any overhead line'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(6)', severity: 4, prov: osha('o') },
    { id: 'auger_torque', hazard: 'Power auger kickback or twisting when the bit binds on rock or roots', hazard_es: PENDING_ES, controls: ['Only trained workers run the auger; two people on two-person units', 'Brace stance, keep the anti-kickback bar against your body side, and stop before clearing the bit'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(4)', severity: 3, prov: osha('c') },
    { id: 'concrete_burn', hazard: 'Skin and eye burns from wet concrete and cement dust', hazard_es: PENDING_ES, controls: ['Wear gloves, long sleeves and eye protection when mixing and placing', 'Wash concrete off skin right away; don\'t kneel in wet concrete'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(3)', severity: 2, ppe: ['alkali-resistant gloves', 'safety glasses'], prov: osha('c') },
    { id: 'power_tool', hazard: 'Saw cuts and kickback cutting posts, rails and pickets', hazard_es: PENDING_ES, controls: ['Keep blade guards in place', 'Support and clamp the work; unplug or pull the battery to change blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic nailers', hazard_es: PENDING_ES, controls: ['Keep the trigger safety working; never point the tool at anyone', 'Disconnect air before clearing jams'], controls_es: PENDING_ES, osha_ref: '1926.302(b)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'hand_tool_strike', hazard: 'Struck by a digging bar, post driver or mushroomed hand tool', hazard_es: PENDING_ES, controls: ['Inspect hand tools and replace damaged ones', 'Keep others clear of a swinging bar or driver'], controls_es: PENDING_ES, osha_ref: '1926.301(a)', severity: 2, prov: osha('i') },
    { id: 'heavy_lift', hazard: 'Back strain or crush injury lifting posts, bags of concrete, panels and gates', hazard_es: PENDING_ES, controls: ['Two-person lift for gates, long posts and full panels', 'Plan the carry path and set-down spot before lifting'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 2, prov: osha('c') },
    { id: 'wire_cut', hazard: 'Cuts and punctures from chain link fabric ends, tie wire and stretched wire releasing', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves handling fabric and wire', 'Stand clear of the line while stretching; release tension slowly'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from flying chips, soil and wire ends', hazard_es: PENDING_ES, controls: ['Wear safety glasses while augering, cutting and tying'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'cord_shock', hazard: 'Electric shock from cords and tools outdoors', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily; remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'property_line_verified', phase: 'sitework', item: 'Fence line taken from a survey or found property pins (not an old fence) and kept inside the owner\'s line and setbacks.', item_es: tr('Línea de la cerca tomada de un levantamiento o mojones encontrados (no de una cerca vieja) y dentro del lindero y retiros del propietario.'), prov: mfr },
    { id: 'locate_ticket', phase: 'sitework', item: 'Utility locate ticket valid and marks visible before any hole is dug; no post set on a mark.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'zoning_hoa_approved', item: 'Fence height, location, corner sight lines and finish-side direction checked against local zoning; permit and HOA approval on file where required.', item_es: tr('Altura, ubicación, visibilidad en esquinas y orientación de la cara de acabado revisadas contra la zonificación local; permiso y aprobación de la asociación (HOA) archivados donde se requieran.'), prov: mfr },
    { id: 'post_depth_frost', phase: 'sitework', item: 'Posts set to the depth the fence system specifies (deeper for gate and corner posts), below local frost depth where heave is a risk, with a few inches of concrete or gravel under the post.', item_es: tr('Postes a la profundidad que indica el sistema de cerca (más profundos los de portón y esquina), bajo la profundidad de helada local donde haya riesgo de levantamiento, con unas pulgadas de concreto o grava bajo el poste.'), prov: { src: ['fencing-ufgs-323113', 'fencing-mh-postmaster'], confidence: 'derived', last_verified: D, note: 'UFGS sets chain link posts at least 36 in. below grade in firm soil; residential wood systems vary — follow the system instructions and local frost depth.' } },
    { id: 'concrete_domed', item: 'Footings placed in one continuous pour, domed to shed water, and cured (UFGS: at least 7 days) before fabric, tension wire or gates load the posts.', item_es: tr('Cimientos colados en una sola pasada, abombados para alejar el agua y curados (UFGS: al menos 7 días) antes de cargar los postes con malla, alambre tensor o portones.'), prov: { src: ['fencing-ufgs-323113', 'fencing-mh-postmaster'], confidence: 'verified', last_verified: D } },
    { id: 'plumb_and_line', item: 'Posts plumb within about 1/4 in. and the fence true to line within about 1/2 in. between posts; top line straight or evenly stepped on slopes.', item_es: tr('Postes aplomados dentro de ~1/4 pulg. y la cerca alineada dentro de ~1/2 pulg. entre postes; línea superior recta o escalonada de forma pareja en pendientes.'), prov: ufgs },
    { id: 'terminal_bracing', item: 'Chain link line posts no more than 10 ft apart; brace assemblies at end and gate posts and both sides of corner and pull posts, plumb with the rod tensioned.', item_es: tr('Postes de línea de malla a no más de 10 pies; arriostramientos en postes de extremo y portón y a ambos lados de esquina y tensión, aplomados con la varilla tensada.'), prov: ufgs },
    { id: 'fabric_taut', item: 'Chain link fabric stays taut after the stretcher is released, tied to posts, rail and tension wire; tie ends twisted two full turns and bent in, no sharp ends.', item_es: tr('La malla permanece tensa al soltar el tensor, amarrada a postes, riel y alambre tensor; puntas de amarre con dos vueltas completas y dobladas, sin puntas filosas.'), prov: ufgs },
    { id: 'ground_clearance', item: 'Pickets or boards held a small gap above grade so wood isn\'t buried; fasteners and hardware in treated lumber hot-dip galvanized or stainless.', item_es: tr('Tablas o piquetes con una pequeña separación sobre el terreno para que la madera no quede enterrada; sujetadores y herrajes en madera tratada galvanizados en caliente o inoxidables.'), prov: mfr },
    { id: 'finish_side_out', item: 'Finish (good) side faces the direction required by local ordinance, HOA or the owner\'s contract.', item_es: tr('La cara de acabado mira hacia donde lo exige la ordenanza local, la asociación (HOA) o el contrato del propietario.'), prov: { src: ['fencing-afa'], confidence: 'derived', last_verified: D, note: 'Common local-ordinance rule; varies by town — check before building.' } },
    { id: 'gate_swing_latch', item: 'Each gate plumb and level, swings fully without dragging, closes with an even latch gap and latches every time; double gates have a working drop rod.', item_es: tr('Cada portón aplomado y nivelado, abre por completo sin arrastrar, cierra con separación pareja en el cerrojo y traba siempre; los portones dobles tienen pasador de piso funcionando.'), prov: ufgs },
    { id: 'pool_gaps', phase: 'sitework', item: 'Pool barrier height (measured on the side away from the pool; CPSC: at least 48 in.) meets the adopted code; openings won\'t pass a 4 in. sphere; bottom gap, mesh and cutouts within code limits; climbable rails on the pool side.', item_es: PENDING_ES, safety: true, prov: pool },
    { id: 'pool_no_climb_aids', item: 'No permanent equipment, planters, benches or structures within reach on the outside of the pool barrier that a child could use to climb it.', item_es: PENDING_ES, safety: true, prov: pool },
    { id: 'pool_gate_self_close', item: 'Every pool gate opens outward, self-closes from any position and self-latches; a low latch release sits on the pool side ≥3 in. below the top, with no opening over 1/2 in. within 18 in. of it.', item_es: PENDING_ES, safety: true, prov: pool },
    { id: 'pool_house_wall', item: 'Where the house wall is part of the barrier, doors and low operable windows into the pool area have the alarms or self-closing devices shown on the approved plan.', item_es: PENDING_ES, safety: true, prov: pool },
  ],
  inspection_checklists: {
    layout_property_line_check: [
      { item: 'Survey or pins located and fence line staked inside the property and setbacks', item_es: tr('Levantamiento o mojones ubicados y línea de la cerca estacada dentro del predio y los retiros') },
      { item: 'Utility locate ticket valid and marks visible', item_es: PENDING_ES, ref: '29 CFR 1926.651(b)(1)' },
      { item: 'Permit (if required) and HOA approval on site; height and finish side match the approval', item_es: tr('Permiso (si se requiere) y aprobación de la asociación (HOA) en sitio; altura y cara de acabado conforme a la aprobación') },
    ],
    final: [
      { item: 'Pool barrier fully encloses the pool; height and openings checked with a tape and 4 in. gauge', item_es: PENDING_ES, ref: 'ISPSC 305.2' },
      { item: 'Every pool gate opens outward, self-closes and self-latches from any position; latch release height and shielding correct', item_es: PENDING_ES, ref: 'ISPSC 305.3' },
      { item: 'House doors and low windows into the pool area protected as shown on the approved plan', item_es: PENDING_ES, ref: 'ISPSC 305.4' },
      { item: 'No climbable objects next to the outside of the barrier', item_es: PENDING_ES, ref: 'ISPSC 305.2' },
    ],
    final_walkthrough: [
      { item: 'Posts plumb, line straight, rails and pickets/panels tight, no sharp tie ends', item_es: tr('Postes aplomados, línea recta, rieles y tablas/paneles firmes, sin puntas de amarre filosas') },
      { item: 'All gates swing freely, close evenly and latch', item_es: tr('Todos los portones abren libremente, cierran parejo y traban') },
      { item: 'Spoils, offcuts and old fence material hauled off; lawn and beds repaired', item_es: tr('Tierra sobrante, recortes y material de la cerca vieja retirados; césped y jardineras reparados') },
    ],
  },
  assemblies: [
    { code: 'B-FNC-GATE-WALK-EA', name: 'Walk gate, ≈4 ft wide, wood or vinyl, with heavy hinges, latch and anti-sag kit', name_es: 'Portón peatonal de ≈4 pies, madera o vinilo, con bisagras reforzadas, cerrojo y kit antipandeo', unit: 'EA', csi: '32 31 29',
      description: 'Gate leaf + hardware; the gate posts are part of the fence run (B-FENCE-LF).',
      material_cost_cents: { v: 22000, prov: est('framed gate leaf + heavy strap hinges + gravity/thumb latch + anti-sag kit, national baseline 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('build or assemble leaf, hang, level, set latch') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('ordered/built to opening') } },
    { code: 'B-FNC-GATE-DBL-EA', name: 'Double drive gate, ≈10–12 ft opening, with hinges, latch and drop rod', name_es: 'Portón doble vehicular, vano de ≈10–12 pies, con bisagras, cerrojo y pasador de piso', unit: 'EA', csi: '32 31 29',
      material_cost_cents: { v: 65000, prov: est('two framed leaves (steel-frame or braced wood) + heavy hinges + latch + cane bolt, national baseline 2026') }, labor_hours_per_unit: { v: 5, prov: est('assemble two leaves, hang, align, set drop rod and keeper') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('ordered/built to opening') } },
    { code: 'B-FNC-POOLGATE-HW-EA', name: 'Pool-code gate hardware: self-closing hinges + self-latching latch with shield, per gate', name_es: 'Herrajes de portón para piscina: bisagras de cierre automático + cerrojo automático con protector, por portón', unit: 'EA', csi: '32 31 19',
      description: 'Upgrade on top of a walk gate (B-FNC-GATE-WALK-EA) on a pool barrier.',
      material_cost_cents: { v: 15000, prov: est('spring/self-closing hinge pair + magnetic self-latching pool latch + latch shield, national baseline 2026') }, labor_hours_per_unit: { v: 1, prov: est('mount, adjust closing speed, test latch from all positions') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('hardware kit') } },
    { code: 'B-FNC-CHAINLINK-LF', name: 'Chain link fence, 4 ft galvanized, top rail, posts set in concrete', name_es: 'Cerca de malla ciclónica galvanizada de 4 pies, con riel superior y postes en concreto', unit: 'LF', csi: '32 31 13',
      material_cost_cents: { v: 1500, prov: est('residential galvanized fabric + line/terminal post share + top rail + fittings + concrete, national baseline 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('posts, rail, tension wire, stretch and tie') },
      equipment_cost_cents: { v: 50, prov: est('auger + stretcher share') }, waste_pct: { v: 5, prov: est('fabric and rail cut-offs') } },
    { code: 'B-FNC-ALUM-LF', name: 'Ornamental aluminum fence, ≈54 in. pool-code panels, posts set in concrete', name_es: 'Cerca ornamental de aluminio, paneles de ≈54 pulg. aptos para piscina, postes en concreto', unit: 'LF', csi: '32 31 19',
      material_cost_cents: { v: 4000, prov: est('pool-code residential aluminum panel + post share + brackets + concrete, national baseline 2026') }, labor_hours_per_unit: { v: 0.2, prov: est('set posts, rack panels to grade, bracket') },
      equipment_cost_cents: { v: 50, prov: est('auger share') }, waste_pct: { v: 3, prov: est('panel cut at ends') } },
    { code: 'B-FNC-REMOVE-LF', name: 'Remove and haul existing fence including post footings', name_es: 'Retiro y acarreo de cerca existente incluyendo cimientos de postes', unit: 'LF', csi: '02 41 13',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 0.1, prov: est('strip boards/fabric, pull or break out post footings, load') },
      equipment_cost_cents: { v: 200, prov: est('haul + disposal share per LF') }, waste_pct: { v: 0, prov: est('no material') } },
  ],
  quantity_rules: [
    { code: 'B-FENCE-LF', assumption: 'New fence called out on the site plan — assume ≈150 LF of wood privacy fence (existing catalog assembly) until measured', when: { facts_any: ['fence_callout'] }, qty: { basis: { component: 'fence_callout' }, mul: 150 } },
    { code: 'B-FNC-GATE-WALK-EA', assumption: 'One walk gate per fenced yard until the plan count is confirmed', when: { facts_any: ['fence_callout'] }, qty: { basis: { component: 'fence_callout' } } },
  ],
  components: [
    { token: 'fence_callout', re: FENCE_RE, example: "NEW 6' WOOD PRIVACY FENCE", vision_hint: 'new fence line drawn on the site plan',
      task: { title: 'Install fence & gates — layout, posts, rails/panels, gates', phase: 'sitework', csi: '32 31 00', days: 3 } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'concrete_flatwork'], before_phase: 'punch', note: 'Fence goes in after final grading and flatwork so posts sit at finished grade and equipment can still reach the yard.' },
    { after_trades: ['pools_spas'], note: 'A pool barrier must be complete and pass its final before the pool is filled or used.' },
  ],
});
