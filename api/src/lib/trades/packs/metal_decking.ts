// Trade Knowledge Pack — metal_decking (Metal Decking). Wave 11 — NEW-TRADE pattern (no hand recipe).
// Dossier: docs/trade-packs/dossiers/metal_decking.md. Sources: UFGS 05 30 00 Steel Decks (Part 3
// Execution + 3.9 field QC), 29 CFR 1926 Subpart R (§1926.753(d), .754(c) and (e), .757(e)(4), .760),
// Subparts J, I, E; SDI standards and AWS D1.1/D1.3 and ICC IBC (reference only).
// Assembly prefix B-MDK- (B-DECK- belongs to residential wood decks).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['metal_decking-ufgs-05-30-00'], confidence: 'verified' as const, last_verified: D };
const ufgsRef = { src: ['metal_decking-ufgs-05-30-00', 'metal_decking-sdi'], confidence: 'derived' as const, last_verified: D, note: 'UFGS 05 30 00 Part 3 defers attachment size/spacing to the drawings and the SDI standards — follow the deck attachment schedule for the job.' };
const studs = { src: ['metal_decking-ufgs-05-30-00', 'metal_decking-aws'], confidence: 'derived' as const, last_verified: D, note: 'UFGS 05 30 00 §3.9.1 paraphrased; full stud-welding procedure is in AWS D1.1 (reference only).' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

const DECK_RE = '\\b(?:metal|steel|composite|floor|roof|form)\\s+deck(?:ing|s)?\\b|\\bshear\\s+(?:stud|connect)|\\bpour\\s*stop';

export default definePack({
  key: 'metal_decking',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Lands, spreads and attaches steel roof deck and composite floor deck on structural steel and joists — controlled decking zone, puddle welds / screws / power-actuated fasteners to the attachment pattern, sidelap fastening, pour stop and closures, deck openings and covers, through-deck shear stud welding with bend tests, touch-up and the pre-pour deck inspection.',
    summary_es: 'Coloca y fija lámina de techo de acero y lámina colaborante sobre acero y viguetas — zona de colocación controlada, soldaduras de tapón, tornillos o clavos de pólvora según el patrón, traslapes laterales, frentes de colado y cierres, aberturas y tapas, conectores de cortante con prueba de doblez, retoques e inspección previa al colado.',
    glossary: [
      { term: 'Composite floor deck', term_es: 'Lámina colaborante (losacero)', def: 'Ribbed steel deck that acts as the form for the concrete slab and, once the concrete cures, works together with it as the floor.', def_es: 'Lámina de acero acanalada que sirve de cimbra para la losa y, cuando el concreto fragua, trabaja junto con él como entrepiso.' },
      { term: 'Roof deck', term_es: 'Lámina de techo (cubierta de acero)', def: 'Ribbed steel deck spanning between joists or beams that carries the roof insulation and membrane and braces the roof as a diaphragm.', def_es: 'Lámina de acero acanalada entre viguetas o vigas que soporta el aislamiento y la membrana del techo y arriostra el techo como diafragma.' },
      { term: 'Puddle weld (arc spot weld)', term_es: 'Soldadura de tapón (punto de arco)', def: 'Round weld burned through the deck into the steel below to hold the sheet down.', def_es: 'Soldadura redonda que atraviesa la lámina hasta el acero de abajo para sujetarla.' },
      { term: 'Sidelap', term_es: 'Traslape lateral', def: 'Edge where two deck sheets overlap side by side; it is screwed, welded or crimped together at a set spacing.', def_es: 'Borde donde dos láminas se traslapan lado a lado; se une con tornillos, soldadura o engargolado a una separación fija.' },
      { term: 'Shear stud (headed stud)', term_es: 'Conector de cortante (perno con cabeza)', def: 'Steel stud welded through the deck onto the beam so the concrete slab and the beam act together.', def_es: 'Perno de acero soldado a través de la lámina sobre la viga para que la losa y la viga trabajen juntas.' },
      { term: 'Pour stop', term_es: 'Frente de colado (tapa de borde)', def: 'Bent steel edge form fastened along the slab edge and openings that holds the wet concrete to the right edge and thickness.', def_es: 'Cimbra de borde de acero doblado fijada en el borde de la losa y las aberturas que contiene el concreto fresco al borde y espesor correctos.' },
      { term: 'Controlled decking zone (CDZ)', term_es: 'Zona de colocación controlada (CDZ)', def: 'Marked area at the leading edge, between 15 and 30 ft up, where trained deckers place deck before full fall protection is set.', def_es: 'Área marcada en el borde de avance, entre 15 y 30 pies de altura, donde personal capacitado coloca lámina antes de instalar toda la protección contra caídas.' },
      { term: 'Leading edge', term_es: 'Borde de avance', def: 'The open, moving edge of the deck as new sheets are laid.', def_es: 'El borde abierto que avanza conforme se colocan láminas nuevas.' },
      { term: 'Bend test', term_es: 'Prueba de doblez', def: 'Bending a welded stud with a hammer or pipe to prove the weld holds without cracking.', def_es: 'Doblar un perno soldado con martillo o tubo para comprobar que la soldadura resiste sin agrietarse.' },
      { term: 'Weld washer', term_es: 'Arandela de soldadura', def: 'Thin steel washer used under a puddle weld on light-gauge deck so the weld does not burn through.', def_es: 'Arandela delgada de acero bajo la soldadura de tapón en lámina delgada para que la soldadura no la perfore.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'composite_deck_shear_studs',
      example_title: 'Metal deck & shear connections',
      when: { title_re: DECK_RE },
      steps: [
        {
          title: 'Check the steel and land the deck bundles',
          instruction: 'Confirm the steel below is plumbed, bolted and released by the erector, and joists have bridging installed and ends attached. Land bundles only where the framing fully supports them so they can be unbanded without shifting; never hoist by the bundle straps unless they are rated for it, and secure loose items on top. Keep everyone out from under the load path.',
          detail: 'Bundles on joists before all bridging is in need a qualified person’s OK in the site-specific erection plan, at least three joists attached at both ends, one row of bridging anchored and a bundle weight within the OSHA limit.',
          tools: ['tag lines', 'rigging', 'radio'],
          materials: ['deck bundles per deck layout drawing', 'dunnage'],
          safety_ids: ['suspended_load', 'bundle_landing'],
          qa_ids: ['bundles_landed_supported'],
        },
        {
          title: 'Spread, align and safety-attach the sheets',
          instruction: 'Mark the CDZ and let only trained deckers inside. Lay sheets square to the supports per the deck layout drawing, ends over supports only, over three or more spans where possible, lapped or butted as shown (butt the ends where studs go through the deck). Put at least two safety attachments in each sheet as you go, working back from the leading edge. Secure all deck against wind before the end of every shift.',
          tools: ['deck clamps or weights', 'chalk line', 'tape measure', 'screw gun'],
          materials: ['deck sheets', 'self-drilling screws or tack welds for safety attachment'],
          safety_ids: ['fall_leading_edge', 'cdz', 'deck_displacement', 'cut_edge'],
          qa_ids: ['ends_over_supports', 'three_span', 'secured_end_of_shift'],
        },
        {
          title: 'Make the permanent deck and sidelap attachments',
          instruction: 'Outside the CDZ, clamp or weight each sheet tight to the steel and fasten it with the puddle welds, screws or power-actuated pins the deck attachment schedule calls for — size, spacing and pattern at supports, edges and sidelaps. Use weld washers only where the drawings call for them. Chip and wire-brush each weld; replace any sheet with burned holes.',
          detail: 'Welders must be qualified to AWS D1.3 for sheet steel. A PAF tool operator must be trained on that tool and test it each day.',
          tools: ['stick welder', 'chipping hammer', 'wire brush', 'power-actuated tool', 'screw gun'],
          materials: ['welding rod per WPS', 'weld washers where specified', 'deck fasteners per schedule', 'sidelap screws'],
          safety_ids: ['weld_shock', 'arc_eye', 'weld_fire', 'paf'],
          qa_ids: ['attach_pattern', 'weld_quality', 'sidelaps'],
          code_refs: [{ section: '2210', code_type: 'IBC', note: 'Cold-formed steel, incl. steel floor and roof deck per the SDI standards' }],
        },
        {
          title: 'Set pour stop, closures and deck at openings',
          instruction: 'Fasten pour stop at slab edges and around openings to the gauge and height on the drawings, plus end and column closures; fill gaps at columns with wire mesh or plywood. Deck over floor and roof openings and do not cut a hole until it is about to be filled — otherwise cover it right away with a secured cover marked HOLE or COVER. Install perimeter safety cables as soon as each floor is decked.',
          tools: ['screw gun', 'stick welder', 'snips', 'plasma cutter or saw'],
          materials: ['pour stop / edge form', 'end and column closures', 'opening reinforcement angles per drawings', 'plywood cover stock', 'perimeter safety cable'],
          safety_ids: ['hole_opening', 'fall_leading_edge', 'cut_edge'],
          qa_ids: ['pour_stop', 'openings_covered', 'perimeter_cables'],
        },
        {
          title: 'Weld shear studs and bend-test them',
          instruction: 'After the deck is attached and outside any CDZ, lay out studs per the beam schedule and weld them through the deck onto clean, dry flanges. Weld and bend-test the first studs on each gun setup before production. Check every stud for a full 360° flash; bend-test any stud without full flash or with a repair, and test more if one breaks.',
          detail: 'Studs are never welded before the deck is down — they are a trip hazard on the beam top flange. Stud welders draw high current: run leads clear of walkways and water.',
          tools: ['stud welding gun and power source', 'generator', 'chalk line', 'hammer or bending pipe'],
          materials: ['headed shear studs + ferrules per schedule'],
          safety_ids: ['trip_studs', 'weld_shock', 'arc_eye', 'weld_fire'],
          qa_ids: ['stud_layout', 'stud_flash_bend'],
        },
        {
          title: 'Touch up and pass the pre-pour deck inspection',
          instruction: 'Wire-brush and touch up weld scars and burns. Walk the deck for damaged or permanently deflected sheets and replace them; set shoring where the drawings require it. Hold the concrete until the deck welds, fasteners and shear studs have been inspected and accepted.',
          tools: ['wire brush', 'touch-up paint brush'],
          materials: ['galvanizing repair paint or primer touch-up'],
          safety_ids: ['fall_leading_edge', 'trip_studs'],
          qa_ids: ['touch_up', 'no_damage_deflection'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '1705.2', code_type: 'IBC', note: 'Special inspection of steel construction' },
            { section: '1705.2.2', code_type: 'IBC', note: 'Special inspection of cold-formed steel deck per SDI QA/QC' },
          ],
        },
      ],
    },
    {
      id: 'roof_deck',
      example_title: 'Install metal roof deck',
      when: { title_re: '\\broof\\s+deck(?:ing)?\\b' },
      priority: 10,
      steps: [
        {
          title: 'Land the bundles and spread the roof deck',
          instruction: 'Land bundles only on framing that fully supports them, with joist bridging installed and ends attached. Mark the CDZ, then lay sheets square to the joists, ends over supports and lapped as shown, with at least two safety attachments per sheet. Secure all deck before the end of each shift or when wind picks up.',
          tools: ['tag lines', 'deck clamps or weights', 'chalk line', 'screw gun'],
          materials: ['roof deck sheets', 'safety-attachment screws'],
          safety_ids: ['suspended_load', 'bundle_landing', 'fall_leading_edge', 'cdz', 'deck_displacement'],
          qa_ids: ['bundles_landed_supported', 'ends_over_supports', 'secured_end_of_shift'],
        },
        {
          title: 'Attach to the supports and stitch the sidelaps',
          instruction: 'Fasten the deck to every support and stitch the sidelaps exactly to the attachment pattern on the drawings — the pattern is what makes the roof a diaphragm and holds it down in wind. Clamp for firm contact while welding; chip and brush every weld.',
          tools: ['stick welder', 'power-actuated tool', 'screw gun', 'chipping hammer'],
          materials: ['deck fasteners per schedule', 'sidelap screws', 'welding rod per WPS'],
          safety_ids: ['weld_shock', 'arc_eye', 'weld_fire', 'paf'],
          qa_ids: ['attach_pattern', 'weld_quality', 'sidelaps'],
          code_refs: [{ section: '2210', code_type: 'IBC', note: 'Cold-formed steel, incl. steel roof deck per the SDI standards' }],
        },
        {
          title: 'Frame openings, set sump pans and closures',
          instruction: 'Reinforce openings for curbs and drains with the plates or angles the drawings show; weld sump pans over roof drain openings and cut the drain hole. Do not cut an opening until its curb or unit goes in — cover it with a secured, marked cover until then. Install closures at open rib ends.',
          tools: ['plasma cutter or saw', 'stick welder', 'snips'],
          materials: ['sump pans', 'opening reinforcement plates or angles', 'rib closures', 'plywood cover stock'],
          safety_ids: ['hole_opening', 'cut_edge'],
          qa_ids: ['openings_covered'],
        },
        {
          title: 'Touch up, check flatness and release to roofing',
          instruction: 'Touch up weld scars and rust spots top and bottom. Lay a straightedge across three adjacent top flanges to find distortion and fix or replace bad sheets before insulation goes down. Hold roofing until the deck attachment has been inspected.',
          tools: ['straightedge', 'wire brush', 'touch-up brush'],
          materials: ['galvanizing repair paint or primer touch-up'],
          safety_ids: ['fall_leading_edge'],
          qa_ids: ['touch_up', 'roof_flatness'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: '1705.2.2', code_type: 'IBC', note: 'Special inspection of cold-formed steel deck per SDI QA/QC' }],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '2210', code_type: 'IBC', note: 'Cold-formed steel, incl. steel floor and roof deck per the SDI standards', prov: icc },
      { section: '1705.2', code_type: 'IBC', note: 'Special inspection of steel construction, incl. shear connectors', prov: icc },
      { section: '1705.2.2', code_type: 'IBC', note: 'Special inspection of cold-formed steel deck per SDI QA/QC', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: DECK_RE, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'crane', reason: 'Hoist and land deck bundles on the framing at each level' },
    { when: { title_re: DECK_RE }, type: 'welder', reason: 'Puddle welds, sidelap welds, pour stop and sump pans' },
    { when: { title_re: '\\bshear\\s+(?:stud|connect)|\\bcomposite\\b' }, type: 'generator', reason: 'High-amperage power source for the stud welding gun', optional: true },
    { when: { title_re: DECK_RE, building_types: ['commercial', 'industrial'] }, type: 'boom_lift', reason: 'Reach the deck underside for touch-up and inspection', optional: true },
  ],
  hazards: [
    { id: 'fall_leading_edge', hazard: 'Fall from the deck edge or leading edge more than 15 ft up', hazard_es: PENDING_ES, controls: ['Guardrail, safety net, personal fall arrest, positioning or restraint above 15 ft', 'Install perimeter safety cables as soon as each floor is decked'], controls_es: PENDING_ES, osha_ref: '1926.760(a)(1)', severity: 4, ppe: ['full-body harness + lanyard'], prov: osha('r') },
    { id: 'cdz', hazard: 'Fall or deck slide inside the controlled decking zone', hazard_es: PENDING_ES, controls: ['Mark the CDZ with control lines; only trained leading-edge deckers inside', 'Keep unsecured deck to 3,000 SF or less and put at least two safety attachments in each sheet', 'No final attachments or shear studs inside the CDZ'], controls_es: PENDING_ES, osha_ref: '1926.760(c)(5)', severity: 4, prov: osha('r') },
    { id: 'hole_opening', hazard: 'Fall through a roof or floor opening or a gap around a column', hazard_es: PENDING_ES, controls: ['Deck over openings; cut only right before the unit fills it, or cover it at once', 'Covers hold twice the load, are secured and marked HOLE or COVER', 'Fill column gaps with wire mesh or exterior plywood'], controls_es: PENDING_ES, osha_ref: '1926.754(e)(3)(i)', severity: 4, prov: osha('r') },
    { id: 'deck_displacement', hazard: 'Loose sheets sliding or blowing off the frame with a worker on them', hazard_es: PENDING_ES, controls: ['Lay deck tight and secure it as placed', 'Secure all deck at the end of each shift and when wind picks up', 'Never walk or stack material on unanchored sheets'], controls_es: PENDING_ES, osha_ref: '1926.754(e)(5)(i)', severity: 4, prov: osha('r') },
    { id: 'bundle_landing', hazard: 'Joist or framing overload or bundle tipping when deck bundles are landed', hazard_es: PENDING_ES, controls: ['Land bundles on joists only with bridging installed and ends attached, or per the qualified person’s erection plan', 'Land on enough framing to unband without shifting'], controls_es: PENDING_ES, osha_ref: '1926.757(e)(4)', severity: 4, prov: osha('r') },
    { id: 'suspended_load', hazard: 'Struck by a deck bundle while it is hoisted or landed', hazard_es: PENDING_ES, controls: ['Pre-plan routes so nobody works under the load except to hook, unhook or connect', 'Qualified rigger; self-closing hook latches; tag lines'], controls_es: PENDING_ES, osha_ref: '1926.753(d)(1)', severity: 4, ppe: ['hard hat'], prov: osha('r') },
    { id: 'trip_studs', hazard: 'Tripping over shear studs on beam top flanges', hazard_es: PENDING_ES, controls: ['Weld studs only after the deck is down, using the deck as the platform', 'Keep walkways clear of welding leads'], controls_es: PENDING_ES, osha_ref: '1926.754(c)(1)', severity: 3, prov: osha('r') },
    { id: 'weld_shock', hazard: 'Electric shock from welding and stud-welding leads and holders', hazard_es: PENDING_ES, controls: ['Open the power switch when stopping or moving the machine', 'Remove electrodes from unattended holders; never dip a hot holder in water', 'Replace damaged cables'], controls_es: PENDING_ES, osha_ref: '1926.351(d)(3)', severity: 3, ppe: ['dry welding gloves'], prov: osha('j') },
    { id: 'arc_eye', hazard: 'Arc flash burns to the eyes and skin while welding', hazard_es: PENDING_ES, controls: ['Welding helmet or goggles with the right filter shade', 'Screen nearby workers from the arc'], controls_es: PENDING_ES, osha_ref: '1926.353(e)(2)', severity: 2, ppe: ['welding helmet', 'FR long sleeves', 'welding gloves'], prov: osha('j') },
    { id: 'weld_fire', hazard: 'Fire from sparks and slag falling through the deck or onto stored material', hazard_es: PENDING_ES, controls: ['Move or protect combustibles below and around the work', 'Fire extinguisher at hand; fire watch where sparks drop to lower floors'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, prov: osha('j') },
    { id: 'paf', hazard: 'Struck by a fastener or tool misfire with a powder-actuated tool', hazard_es: PENDING_ES, controls: ['Only workers trained on that tool may use it', 'Test the tool each day before loading; load just before firing; never point it at anyone'], controls_es: PENDING_ES, osha_ref: '1926.302(e)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'cut_edge', hazard: 'Cuts from sharp deck edges and cut-offs', hazard_es: PENDING_ES, controls: ['Cut-resistant gloves and sleeves when handling sheets', 'Pick up cut-offs as you go'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'bundles_landed_supported', item: 'Bundles landed on fully supported framing, joist bridging installed and ends attached (or per the qualified person’s plan), nothing loose on top.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'ends_over_supports', item: 'Every deck end bears on a support, lapped or butted as shown; butted where studs are welded through.', item_es: { status: 'translated', text: 'Cada extremo de lámina apoya sobre un soporte, traslapado o a tope según planos; a tope donde se sueldan pernos a través de la lámina.' }, prov: ufgs },
    { id: 'three_span', item: 'Sheets run square to supports and over three or more supports where the layout allows.', item_es: { status: 'translated', text: 'Láminas a escuadra con los soportes y sobre tres o más apoyos cuando el despiece lo permite.' }, prov: ufgs },
    { id: 'attach_pattern', item: 'Support, edge and sidelap fastener type, size, spacing and pattern match the deck attachment schedule on the drawings.', item_es: { status: 'translated', text: 'Tipo, tamaño, separación y patrón de fijación en apoyos, bordes y traslapes según la tabla de fijación de los planos.' }, prov: ufgsRef },
    { id: 'weld_quality', item: 'Puddle welds sized as specified, fused into the steel, chipped and brushed; no burned-through holes; weld washers only where specified.', item_es: { status: 'translated', text: 'Soldaduras de tapón del tamaño especificado, fundidas en el acero, limpias con piqueta y cepillo; sin perforaciones; arandelas solo donde se especifican.' }, prov: ufgsRef },
    { id: 'sidelaps', item: 'Sidelaps fastened at the specified spacing along every lap.', item_es: { status: 'translated', text: 'Traslapes laterales fijados a la separación especificada en todo su largo.' }, prov: ufgs },
    { id: 'secured_end_of_shift', item: 'All placed deck secured against wind at the end of each shift; no unsecured sheets used as a work or storage platform.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-r', 'metal_decking-ufgs-05-30-00'], confidence: 'verified', last_verified: D } },
    { id: 'openings_covered', item: 'Openings decked over or covered; covers secured, marked HOLE or COVER and strong enough for twice the load; column gaps filled.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'perimeter_cables', item: 'Perimeter safety cables installed on each decked floor of a multi-story frame.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'pour_stop', item: 'Pour stop and edge closures at the gauge and height shown, fastened to hold the wet concrete at slab edges and openings.', item_es: { status: 'translated', text: 'Frentes de colado y cierres de borde del calibre y altura indicados, fijados para contener el concreto fresco en bordes y aberturas.' }, prov: ufgs },
    { id: 'stud_layout', item: 'Shear stud size, count and spacing on each beam match the beam schedule; studs welded to clean, dry flanges.', item_es: { status: 'translated', text: 'Tamaño, cantidad y separación de conectores en cada viga según la tabla de vigas; pernos soldados sobre patines limpios y secos.' }, prov: studs },
    { id: 'stud_flash_bend', item: 'Every stud shows a full 360° flash; studs without it or with repairs pass a bend test; first studs per setup tested before production.', item_es: { status: 'translated', text: 'Cada perno muestra un cordón completo de 360°; los que no lo tienen o fueron reparados pasan prueba de doblez; los primeros de cada ajuste se prueban antes de producir.' }, prov: studs },
    { id: 'touch_up', item: 'Weld scars, burns and rust spots wire-brushed and touched up top and bottom.', item_es: { status: 'translated', text: 'Marcas de soldadura, quemaduras y óxido cepillados y retocados por arriba y por abajo.' }, prov: ufgs },
    { id: 'no_damage_deflection', item: 'No damaged or permanently deflected sheets before concrete; shoring in place where the drawings require it.', item_es: { status: 'translated', text: 'Ninguna lámina dañada o deformada permanentemente antes del colado; apuntalamiento colocado donde lo piden los planos.' }, prov: ufgs },
    { id: 'roof_flatness', item: 'Roof deck checked with a straightedge across three adjacent top flanges; distortion beyond tolerance fixed before insulation.', item_es: { status: 'translated', text: 'Lámina de techo revisada con regla sobre tres crestas contiguas; la deformación fuera de tolerancia se corrige antes del aislamiento.' }, prov: ufgs },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Deck attachment (welds / fasteners / sidelaps) matches the attachment schedule; special inspector’s deck report on file', item_es: PENDING_ES, ref: '1705.2.2' },
      { item: 'Shear studs: count and spacing per beam schedule, full flash, bend tests recorded', item_es: PENDING_ES, ref: '1705.2' },
      { item: 'Pour stop, closures and opening reinforcement installed before the concrete pour', item_es: PENDING_ES },
      { item: 'Openings covered and marked; perimeter cables in place', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-MDK-ROOF-SF', name: 'Steel roof deck, 1-1/2 in. wide-rib galvanized, 20–22 ga, supply + install', name_es: 'Lámina de techo de acero, nervadura ancha 1-1/2 pulg., galvanizada cal. 20–22, suministro e instalación', unit: 'SF', csi: '05 31 23',
      description: 'Deck, puddle welds or fasteners, sidelap stitching and touch-up; excludes roof insulation and membrane.',
      material_cost_cents: { v: 275, prov: est('Galvanized 1.5 in. B-deck 20–22 ga + fasteners, national baseline 2026') }, labor_hours_per_unit: { v: 0.018, prov: est('Spread, attach and stitch on open framing') },
      equipment_cost_cents: { v: 12, prov: est('Crane/hoisting share + welder per SF') }, waste_pct: { v: 5, prov: est('Cut-offs at edges and openings') } },
    { code: 'B-MDK-FLOOR-SF', name: 'Composite steel floor deck, 2–3 in., 20 ga galvanized, supply + install', name_es: 'Lámina colaborante de acero de entrepiso, 2–3 pulg., galvanizada cal. 20, suministro e instalación', unit: 'SF', csi: '05 31 13',
      description: 'Deck, attachment and sidelaps; pour stop, studs and concrete fill are separate lines.',
      material_cost_cents: { v: 350, prov: est('2–3 in. composite deck 20 ga galvanized + fasteners, national baseline 2026') }, labor_hours_per_unit: { v: 0.022, prov: est('Spread, attach and stitch on beams') },
      equipment_cost_cents: { v: 15, prov: est('Crane/hoisting share + welder per SF') }, waste_pct: { v: 5, prov: est('Cut-offs at edges, columns and openings') } },
    { code: 'B-MDK-STUD-EA', name: 'Headed shear stud 3/4 in., welded through deck, with ferrule and testing', name_es: 'Conector de cortante con cabeza 3/4 pulg., soldado a través de la lámina, con férula y pruebas', unit: 'EA', csi: '05 05 19',
      material_cost_cents: { v: 160, prov: est('3/4 in. headed stud + ferrule, national baseline 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('Layout, weld, knock ferrule, inspect; production stud welding') },
      equipment_cost_cents: { v: 40, prov: est('Stud welder + generator share per stud') }, waste_pct: { v: 3, prov: est('Test studs and rejects') } },
    { code: 'B-MDK-POURSTOP-LF', name: 'Pour stop / slab edge form, galvanized bent plate, installed', name_es: 'Frente de colado / cimbra de borde de losa, placa doblada galvanizada, instalado', unit: 'LF', csi: '05 31 13',
      material_cost_cents: { v: 450, prov: est('14–10 ga galvanized bent pour stop, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('Fit, weld or screw at slab edge') },
      equipment_cost_cents: { v: 0, prov: est('Welder included in deck lines') }, waste_pct: { v: 5, prov: est('Corners and splices') } },
    { code: 'B-MDK-OPENING-EA', name: 'Deck opening — layout, cut, reinforcement angles and temporary marked cover', name_es: 'Abertura en lámina — trazo, corte, ángulos de refuerzo y tapa provisional marcada', unit: 'EA', csi: '05 31 00',
      description: 'Typical 12–48 in. roof or floor opening for a curb, drain or penetration.',
      material_cost_cents: { v: 6500, prov: est('Steel angles/plate + plywood cover + marking paint, 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('Lay out, cut, weld reinforcement, set cover') },
      equipment_cost_cents: { v: 0, prov: est('Hand and welding tools in deck lines') }, waste_pct: { v: 5, prov: est('Angle cut-offs') } },
  ],
  quantity_rules: [
    { code: 'B-MDK-ROOF-SF', assumption: 'Single-story industrial: roof deck ≈ 1.05 × scheduled floor area (overhang/edges) — verify against the roof plan', when: { building_types: ['industrial'] }, qty: { basis: 'area_sf_sum', mul: 1.05, round: 'ceil' } },
    { code: 'B-MDK-ROOF-SF', assumption: 'Commercial assumed two stories: roof deck ≈ half the scheduled floor area × 1.05 — verify against the roof plan', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.525, round: 'ceil' } },
    { code: 'B-MDK-FLOOR-SF', assumption: 'Commercial assumed two stories: upper floor on composite deck ≈ half the scheduled floor area (ground floor is slab-on-grade) — adjust for actual stories', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.5, round: 'ceil' } },
    { code: 'B-MDK-STUD-EA', assumption: 'Shear studs ≈ 1 per 4 SF of composite floor deck (half the floor area) — replace with the beam-schedule count', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.125, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['structural_steel'], before_phase: 'roofing', note: 'Deck follows plumbed, bolted steel and joist bridging; roof deck goes before roofing and floor deck before the concrete topping.' },
  ],
});
