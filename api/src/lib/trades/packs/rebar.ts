// Trade Knowledge Pack — rebar (Reinforcing Steel (Rebar)). Wave 08 — NEW-TRADE pattern (not in
// HAND_RECIPE_KEYS; the 'Rebar & anchor bolt placement' template task used to fall to the generic
// foundation branch of task-buildout/building.ts). Dossier: docs/trade-packs/dossiers/rebar.md.
// Sources: Wisconsin DFD master spec 03 20 00 (public), 29 CFR 1926 Subparts Q/M/H/CC/J/P/E/I,
// IRC R403/R404/R506 + IBC 1705.3 and ACI 318 (reference only), CRSI field-inspection guide (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const wi = { src: ['rebar-wi-dfd-032000'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const aci = { src: ['rebar-aci-318'], confidence: 'verified' as const, last_verified: D };
const crsi = { src: ['rebar-crsi-field-inspection', 'rebar-wi-dfd-032000'], confidence: 'derived' as const, last_verified: D, note: 'Common field-inspection practice; the CRSI guide is reference only.' };

export default definePack({
  key: 'rebar',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Places and ties the reinforcing steel in footings, foundation walls, slabs and piers — bars, dowels and welded wire on chairs and dobies at the right cover and laps — and sets anchor bolts and cast-in hold-downs to template so the structure is ready for the pre-pour inspection.',
    summary_es: 'Coloca y amarra el acero de refuerzo en zapatas, muros de cimentación, losas y pilas — varillas, anclajes de espera y malla electrosoldada sobre silletas y calzas con el recubrimiento y traslapes correctos — y fija pernos de anclaje y sujetadores embebidos con plantilla para dejar la obra lista para la inspección previa al colado.',
    glossary: [
      { term: 'Placing drawing', term_es: 'Plano de colocación', def: 'Shop drawing showing every bar mark, size, length, spacing and lap location.', def_es: 'Plano de taller que muestra cada marca de varilla, diámetro, largo, separación y ubicación de traslapes.' },
      { term: 'Bar mark', term_es: 'Marca de varilla', def: 'Tag code on a bundle that ties the bars to the bar list and placing drawing.', def_es: 'Código de la etiqueta del paquete que liga las varillas con la lista y el plano de colocación.' },
      { term: 'Concrete cover', term_es: 'Recubrimiento de concreto', def: 'Distance from the face of the bar to the outside of the concrete; protects the steel from rust and fire.', def_es: 'Distancia de la cara de la varilla al exterior del concreto; protege el acero de la corrosión y el fuego.' },
      { term: 'Chair', term_es: 'Silleta', def: 'Wire or plastic support that holds bars or mesh up at the right height.', def_es: 'Soporte de alambre o plástico que mantiene varillas o malla a la altura correcta.' },
      { term: 'Dobie', term_es: 'Calza de concreto (dobie)', def: 'Small precast concrete block, often with tie wires, used as a bar support on soil.', def_es: 'Bloque pequeño de concreto prefabricado, a menudo con alambres, usado como soporte de varilla sobre el suelo.' },
      { term: 'Lap splice', term_es: 'Traslape', def: 'Two bars overlapped and tied so force passes from one to the other.', def_es: 'Dos varillas sobrepuestas y amarradas para que la fuerza pase de una a otra.' },
      { term: 'Dowel', term_es: 'Varilla de espera (anclaje)', def: 'Bar left sticking out of one pour to tie it to the next, like footing to wall.', def_es: 'Varilla que sobresale de un colado para unirlo con el siguiente, como de zapata a muro.' },
      { term: 'Anchor bolt', term_es: 'Perno de anclaje', def: 'Bolt cast into the foundation that holds the wood sill plate or a column base down.', def_es: 'Perno colado en la cimentación que sujeta la solera de madera o la base de una columna.' },
      { term: 'Welded wire reinforcement (WWR)', term_es: 'Malla electrosoldada', def: 'Sheets or rolls of steel wire welded in a grid, used mostly in slabs.', def_es: 'Hojas o rollos de alambre de acero soldado en cuadrícula, usados sobre todo en losas.' },
      { term: 'Rebar cap', term_es: 'Capuchón de varilla', def: 'Protective cover placed over exposed bar ends so nobody can be impaled.', def_es: 'Cubierta protectora sobre las puntas expuestas de varilla para evitar empalamientos.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'foundation_rebar_anchor_bolts',
      example_title: 'Rebar & anchor bolt placement',
      when: { title_re: '\\b(?:rebar|reinforc\\w*|re-?bar|dowels?|anchor\\s+bolts?|wire\\s+mesh|welded\\s+wire)\\b' },
      steps: [
        {
          title: 'Review placing drawings and the bar list',
          instruction: 'Walk the excavation and forms with the placing drawings, bar list and structural details. Confirm footing sizes, wall heights, bar sizes, spacing, lap lengths, dowel and anchor-bolt layout and any seismic detailing for this ${bt} job. Raise conflicts with embeds, sleeves or plumbing as an RFI before tying.',
          tools: ['tape measure', 'placing drawings', 'marker / paint'],
          materials: [],
          safety_ids: ['cave_in', 'impalement'],
          qa_ids: ['drawings_match'],
        },
        {
          title: 'Receive, check tags and store the steel',
          instruction: 'Check each bundle tag against the bar list (size, mark, count, grade marks rolled on the bar). Land bundles on dunnage off the soil, sorted by mark, and block stacks so they cannot roll. Rig with inspected slings and keep everyone out from under the load.',
          detail: 'Coated bar (epoxy or galvanized): lift with padded slings, do not drag, and cover epoxy-coated bar if it will sit outdoors for weeks.',
          tools: ['tag line', 'slings', 'dunnage'],
          materials: ['timber dunnage'],
          safety_ids: ['hoisted_load', 'rigging', 'stack_roll'],
          qa_ids: ['tags_grade'],
        },
        {
          title: 'Place and tie the footing steel',
          instruction: 'Set bottom bars on dobies or chairs so the cover against soil is held — never on rocks, brick or wood scraps. Tie at intersections and laps, lap bars the length shown and stagger laps where detailed, bend corner bars around, and keep ties pointed into the concrete. Cap every exposed bar end the same day.',
          tools: ['rebar tier or pigtail', 'bolt cutters', 'rebar cutter / bender', 'tape measure'],
          materials: ['reinforcing bars per bar list', 'concrete dobies or chairs', 'tie wire', 'rebar caps'],
          safety_ids: ['impalement', 'hand_cuts', 'cutter', 'eye_flying', 'cave_in'],
          qa_ids: ['clean_bar', 'supports_cover', 'laps_staggered', 'ties_secure', 'caps_installed'],
          gating_inspection_type: 'footing',
          code_refs: [
            { section: 'R403.1', code_type: 'IRC', note: 'Footings — size and placement on undisturbed or compacted soil' },
            { section: 'R403.1.3', code_type: 'IRC', note: 'Footing and stem wall reinforcing in high seismic design categories' },
            { section: '20.5.1.3', code_type: 'ACI 318', note: 'Specified concrete cover over reinforcement' },
          ],
        },
        {
          title: 'Place wall, pier and slab steel with dowels',
          instruction: 'Set footing-to-wall dowels at the spacing shown. Stand wall verticals and horizontals, tie them to the dowels and brace tall curtains so they cannot tip. For slabs, chair bars or mesh at the depth shown — lap mesh at least one wire spacing plus 2 in. — and keep chairs from tearing the vapor retarder. Keep the clear space between bars so concrete can flow around them.',
          tools: ['rebar tier or pigtail', 'rebar cutter / bender', 'tape measure', 'level'],
          materials: ['reinforcing bars', 'dowel bars', 'welded wire reinforcement where specified', 'slab chairs with sand plates', 'tie wire', 'rebar caps'],
          safety_ids: ['cage_collapse', 'mesh_recoil', 'fall_rebar_face', 'impalement', 'hand_cuts'],
          qa_ids: ['spacing_clearance', 'dowels_set', 'mesh_lapped_raised', 'vapor_retarder_intact', 'verticals_braced'],
        },
        {
          title: 'Set anchor bolts and hold-downs; pre-pour check',
          instruction: 'Set anchor bolts and cast-in hold-downs from a template or string line at the spacing, end distance and embedment the plans show, plumb and at the right projection. Walk every pour with the placing drawings — sizes, counts, laps, cover, embeds — fix what is off, then call for the inspection. Do not let the pour start before sign-off.',
          tools: ['anchor-bolt template', 'string line', 'tape measure', 'level'],
          materials: ['anchor bolts with nuts and washers', 'cast-in hold-down straps per plan', 'bolt templates'],
          safety_ids: ['impalement', 'cage_collapse'],
          qa_ids: ['anchor_bolts_set', 'inspection_before_pour'],
          gating_inspection_type: 'foundation',
          code_refs: [
            { section: 'R403.1.6', code_type: 'IRC', note: 'Foundation anchorage — anchor bolt spacing, embedment and end distance' },
            { section: 'R404.1.3', code_type: 'IRC', note: 'Concrete foundation walls — reinforcement per design or prescriptive tables' },
            { section: 'R506.2.4', code_type: 'IRC', note: 'Slab-on-ground reinforcement held in place during the pour' },
            { section: '25.5', code_type: 'ACI 318', note: 'Splices — lap lengths and staggering' },
          ],
        },
      ],
    },
    {
      id: 'drill_epoxy_dowels',
      example_title: 'Drill and epoxy rebar dowels into existing slab',
      priority: 10,
      when: { title_re: '\\b(?:epoxy|adhesive|drill(?:ed)?)\\b[^.]*\\b(?:dowels?|rebar|anchors?)\\b|\\b(?:dowels?|rebar)\\b[^.]*\\b(?:epoxy|adhesive|drill(?:ed)?)\\b' },
      steps: [
        {
          title: 'Locate existing steel and lay out holes',
          instruction: 'Mark dowel locations from the drawings. Scan or probe for existing bars, tendons and conduits before drilling; shift holes rather than cutting existing steel unless the engineer approves.',
          tools: ['tape measure', 'marker', 'concrete scanner'],
          materials: [],
          safety_ids: ['eye_flying'],
          qa_ids: ['drawings_match'],
        },
        {
          title: 'Drill and clean the holes',
          instruction: 'Drill to the diameter and depth the adhesive maker lists for the bar size, using dust extraction. Clean each hole with the brush-and-blow sequence in the instructions — dust left in the hole is the main cause of failed dowels.',
          tools: ['rotary hammer with dust extraction', 'hole brushes', 'air blower'],
          materials: [],
          safety_ids: ['silica', 'eye_flying', 'cutter'],
          qa_ids: ['hole_cleaned'],
        },
        {
          title: 'Inject adhesive and set the dowels',
          instruction: 'Inject adhesive from the bottom of the hole up, then twist the clean bar in to full depth. Do not disturb or load the bar until the cure time for the concrete temperature has passed. Cap the projecting ends.',
          tools: ['adhesive dispenser', 'mixing nozzles'],
          materials: ['adhesive anchoring system listed for rebar', 'dowel bars', 'rebar caps'],
          safety_ids: ['eye_flying', 'impalement'],
          qa_ids: ['caps_installed'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction, including post-installed anchors' }],
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: 'R403.1', code_type: 'IRC', note: 'Footings — general requirements', prov: icc },
      { section: 'R403.1.3', code_type: 'IRC', note: 'Footing and stem wall reinforcing in high seismic design categories', prov: icc },
      { section: '20.5.1.3', code_type: 'ACI 318', note: 'Specified concrete cover over reinforcement', prov: aci },
      { section: '26.6.2', code_type: 'ACI 318', note: 'Placement of reinforcement — supported and secured before the pour', prov: aci },
    ],
    foundation: [
      { section: 'R403.1.6', code_type: 'IRC', note: 'Foundation anchorage — anchor bolts to the sill plate', prov: icc },
      { section: 'R404.1.3', code_type: 'IRC', note: 'Concrete foundation walls — reinforcement', prov: icc },
      { section: 'R506.2.4', code_type: 'IRC', note: 'Slab-on-ground reinforcement support', prov: icc },
      { section: '25.5', code_type: 'ACI 318', note: 'Splices of reinforcement', prov: aci },
      { section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction (commercial)', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: '\\b(?:rebar|reinforc\\w*)\\b', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'telehandler', reason: 'Unload and distribute rebar bundles along the footings', optional: true },
    { when: { title_re: '\\b(?:rebar|reinforc\\w*)\\b', building_types: ['commercial', 'industrial'] }, type: 'crane', reason: 'Fly prefabricated column and pier cages into place', optional: true },
  ],
  hazards: [
    { id: 'impalement', hazard: 'Impalement on protruding rebar ends and dowels', hazard_es: PENDING_ES, controls: ['Guard every protruding bar end that someone could fall onto or into — caps rated for impalement, troughs or bending the bars over', 'Cap new verticals and dowels the same shift they are set'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 4, prov: osha('q') },
    { id: 'cage_collapse', hazard: 'Wall, pier or column steel tipping over or collapsing', hazard_es: PENDING_ES, controls: ['Brace or guy vertical steel for walls, piers and columns until forms or concrete hold it', 'Stay clear of unbraced curtains in wind'], controls_es: PENDING_ES, osha_ref: '1926.703(d)(1)', severity: 4, prov: osha('q') },
    { id: 'mesh_recoil', hazard: 'Unrolled wire mesh springing back', hazard_es: PENDING_ES, controls: ['Secure each end of the roll or turn the roll over before cutting the bands', 'Keep your face and body out of the recoil path'], controls_es: PENDING_ES, osha_ref: '1926.703(d)(2)', severity: 3, ppe: ['safety glasses', 'gloves'], prov: osha('q') },
    { id: 'fall_rebar_face', hazard: 'Fall while climbing or working on the face of wall steel', hazard_es: PENDING_ES, controls: ['At 6 ft or more use personal fall arrest, a safety net or a positioning device system', 'Do not climb bars without a tie-off; use a ladder or lift for access'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(5)', severity: 4, ppe: ['harness with positioning lanyard'], prov: osha('m') },
    { id: 'hoisted_load', hazard: 'Struck by a swinging or dropped rebar bundle during crane or telehandler lifts', hazard_es: PENDING_ES, controls: ['Only the crew hooking, unhooking or guiding the load stays in the fall zone', 'Use tag lines; never stand under a suspended bundle'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: osha('cc') },
    { id: 'rigging', hazard: 'Sling or choker failure lifting bundles', hazard_es: PENDING_ES, controls: ['Inspect slings and hardware before each shift; tag out damaged rigging', 'Double-wrap or choke bundles so bars cannot slide out'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 3, prov: osha('h') },
    { id: 'stack_roll', hazard: 'Stored bundles rolling or sliding onto feet and legs', hazard_es: PENDING_ES, controls: ['Store on level dunnage, blocked or racked so bars cannot roll', 'Keep stacks low and sorted so nobody climbs them'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, ppe: ['safety-toe boots'], prov: osha('h') },
    { id: 'hand_cuts', hazard: 'Cuts and punctures from tie wire, bar ends and sharp mesh', hazard_es: PENDING_ES, controls: ['Wear work gloves for tying and handling', 'Bend tie tails into the concrete side, not toward walkways'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['work gloves', 'long sleeves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from wire ends, cutter chips and drilling dust', hazard_es: PENDING_ES, controls: ['Wear safety glasses while tying, cutting and drilling'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'cutter', hazard: 'Hand or crush injury from portable rebar cutters, benders and saws', hazard_es: PENDING_ES, controls: ['Keep guards in place and hands clear of the jaws and bending pins', 'Support long bars so they do not whip when cut'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'gloves'], prov: osha('i') },
    { id: 'cave_in', hazard: 'Cave-in while tying steel in deep footing or grade-beam trenches', hazard_es: PENDING_ES, controls: ['Slope, bench, shore or shield excavations 5 ft or deeper before entering', 'Keep bundles and spoil back from the trench edge'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'silica', hazard: 'Silica dust from drilling dowel holes in cured concrete', hazard_es: PENDING_ES, controls: ['Use a rotary hammer with an integrated dust collector or vacuum shroud', 'Follow the Table 1 controls for drilling'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when Table 1 requires'], prov: osha('z') },
  ],
  qa_checklist: [
    { id: 'drawings_match', item: 'Bar sizes, counts, spacing, laps, dowels and embeds match the approved placing drawings and structural details; conflicts resolved by RFI.', item_es: { status: 'translated', text: 'Diámetros, cantidades, separación, traslapes, varillas de espera y piezas embebidas coinciden con los planos de colocación y detalles estructurales aprobados; conflictos resueltos por RFI.' }, prov: crsi },
    { id: 'tags_grade', item: 'Bundle tags match the bar list and the rolled-on grade marks match the specified grade.', item_es: { status: 'translated', text: 'Las etiquetas de los paquetes coinciden con la lista y las marcas de grado laminadas en la varilla coinciden con el grado especificado.' }, prov: crsi },
    { id: 'clean_bar', item: 'Bars free of mud, ice, oil and loose rust or scale that would weaken bond.', item_es: { status: 'translated', text: 'Varillas sin lodo, hielo, aceite ni óxido o escama suelta que reduzca la adherencia.' }, prov: wi },
    { id: 'supports_cover', item: 'Bars sit on proper chairs or dobies at the specified cover — no rocks, brick or wood used as supports.', item_es: { status: 'translated', text: 'Las varillas descansan en silletas o calzas adecuadas con el recubrimiento especificado — sin piedras, ladrillos ni madera como soporte.' }, prov: wi },
    { id: 'laps_staggered', item: 'Lap splices are the length shown and staggered where the drawings require.', item_es: { status: 'translated', text: 'Los traslapes tienen la longitud indicada y están escalonados donde los planos lo piden.' }, prov: wi },
    { id: 'ties_secure', item: 'Steel tied tight enough not to move during the pour; tie-wire ends point into the concrete.', item_es: { status: 'translated', text: 'Acero amarrado firme para que no se mueva en el colado; las puntas del alambre apuntan hacia el concreto.' }, prov: wi },
    { id: 'spacing_clearance', item: 'Clear space between bars at least the bar diameter and 1 in., so concrete flows around every bar.', item_es: { status: 'translated', text: 'Espacio libre entre varillas de al menos un diámetro de varilla y 1 pulg., para que el concreto rodee cada varilla.' }, prov: wi },
    { id: 'dowels_set', item: 'Footing-to-wall dowels and slab dowels present at the spacing, projection and position shown.', item_es: { status: 'translated', text: 'Varillas de espera de zapata a muro y de losa colocadas con la separación, proyección y posición indicadas.' }, prov: wi },
    { id: 'mesh_lapped_raised', item: 'Welded wire lapped at least one wire spacing plus 2 in., laps offset, and supported at the specified depth — not walked into the subgrade.', item_es: { status: 'translated', text: 'Malla electrosoldada traslapada al menos una separación de alambre más 2 pulg., traslapes desfasados y soportada a la profundidad especificada — no pisada hasta la subrasante.' }, prov: wi },
    { id: 'vapor_retarder_intact', item: 'Vapor retarder under the slab not punctured by chairs or bars; any damage taped before the pour.', item_es: { status: 'translated', text: 'La barrera de vapor bajo la losa sin perforaciones por silletas o varillas; cualquier daño encintado antes del colado.' }, prov: wi },
    { id: 'anchor_bolts_set', item: 'Anchor bolts and hold-downs at the plan spacing, end distance and embedment, plumb, with top elevation within about 1/2 in. of plan.', item_es: { status: 'translated', text: 'Pernos de anclaje y sujetadores con la separación, distancia al extremo y empotramiento del plano, a plomo y con elevación superior dentro de ~1/2 pulg. del plano.' }, prov: wi },
    { id: 'inspection_before_pour', item: 'Reinforcement placement inspected and approved (building inspector and, on commercial jobs, special inspector) before concrete is ordered.', item_es: { status: 'translated', text: 'Colocación del refuerzo inspeccionada y aprobada (inspector municipal y, en obras comerciales, inspector especial) antes de pedir el concreto.' }, prov: wi },
    { id: 'hole_cleaned', item: 'Dowel holes drilled to the adhesive maker’s diameter and depth and cleaned with the full brush-and-blow sequence.', item_es: { status: 'translated', text: 'Barrenos para varillas perforados al diámetro y profundidad del fabricante del adhesivo y limpiados con toda la secuencia de cepillo y soplado.' }, prov: { src: ['rebar-wi-dfd-032000'], confidence: 'derived', last_verified: D, note: 'Adhesive-anchor installation practice; follow the listed adhesive’s instructions.' } },
    { id: 'caps_installed', item: 'Every protruding bar end and dowel that a worker could fall onto is capped or guarded.', item_es: PENDING_ES, safety: true, prov: osha('q') },
    { id: 'verticals_braced', item: 'Wall, pier and column steel braced against tipping until forms or concrete support it.', item_es: PENDING_ES, safety: true, prov: osha('q') },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Bottom bars supported at the specified cover over soil; no bars lying on the ground', item_es: PENDING_ES, ref: 'ACI 318 20.5.1.3' },
      { item: 'Bar sizes, count, spacing and corner bars match the plans', item_es: PENDING_ES, ref: 'R403.1' },
      { item: 'Laps at the lengths shown; dowels for the wall in place', item_es: PENDING_ES },
      { item: 'Excavation clean, no standing water or frost; bar ends capped', item_es: PENDING_ES },
    ],
    foundation: [
      { item: 'Wall steel tied, braced and held at the specified cover from both faces', item_es: PENDING_ES, ref: 'R404.1.3' },
      { item: 'Anchor bolts and hold-downs at plan spacing, end distance and embedment', item_es: PENDING_ES, ref: 'R403.1.6' },
      { item: 'Slab reinforcement chaired at the specified depth over an intact vapor retarder', item_es: PENDING_ES, ref: 'R506.2.4' },
      { item: 'Special-inspection report for reinforcement placement on file (commercial)', item_es: PENDING_ES, ref: 'IBC 1705.3' },
    ],
  },
  assemblies: [
    { code: 'B-RBR-ANCHOR-EA', name: 'Anchor bolt 1/2 in. × 10 in. with nut and washer, set to template', name_es: 'Perno de anclaje 1/2 × 10 pulg. con tuerca y rondana, colocado con plantilla', unit: 'EA', csi: '03 15 19',
      material_cost_cents: { v: 250, prov: est('Galvanized 1/2 in. J/L-bolt + nut + washer, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('Layout and set to template or string line') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 3, prov: est('lost and bent bolts') } },
    { code: 'B-RBR-DOWEL-EA', name: 'Bent #4 dowel bar, footing to wall, tied in place', name_es: 'Varilla de espera #4 doblada, de zapata a muro, amarrada', unit: 'EA', csi: '03 21 00',
      description: 'About 3 ft of #4 with a hook; the continuous footing/wall bars are B-REBAR-LF.',
      material_cost_cents: { v: 300, prov: est('≈3 LF #4 bar shop-bent, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('position and tie one dowel') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 3, prov: est('miscut / extra dowels') } },
    { code: 'B-RBR-SLAB-GRID-SF', name: 'Slab rebar grid #4 @ 18 in. each way, chaired and tied', name_es: 'Parrilla de varilla #4 @ 18 pulg. en ambos sentidos para losa, sobre silletas y amarrada', unit: 'SF', csi: '03 21 00',
      material_cost_cents: { v: 120, prov: est('≈1.35 LF #4 per SF + chairs and tie wire, national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('lay out, chair and tie a two-way grid') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 7, prov: est('laps and offcuts') } },
    { code: 'B-RBR-EPOXY-DOWEL-EA', name: 'Drill-and-epoxy #4 dowel into existing concrete, 6 in. embed', name_es: 'Varilla #4 perforada y anclada con epóxico en concreto existente, 6 pulg. de empotramiento', unit: 'EA', csi: '03 21 00',
      material_cost_cents: { v: 600, prov: est('Adhesive share + #4 bar + nozzle, national baseline 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('scan, drill, clean, inject and set one dowel') },
      equipment_cost_cents: { v: 100, prov: est('rotary hammer with dust extraction, day share') }, waste_pct: { v: 10, prov: est('adhesive purge and partial cartridges') } },
  ],
  quantity_rules: [
    { code: 'B-REBAR-LF', assumption: 'Footings on the plans — assume ≈160 LF of perimeter footing × 2 continuous bars + 10% laps (existing catalog assembly); confirm from the bar list', when: { facts_any: ['concrete_footing'], building_types: ['residential_sf'] }, qty: { basis: { component: 'concrete_footing' }, mul: 352 } },
    { code: 'B-RBR-ANCHOR-EA', assumption: 'Anchor bolts on the plans — ≈160 LF sill at about 6 ft spacing plus bolts near each plate end ≈ 32 bolts; confirm the plan spacing', when: { facts_any: ['anchor_bolts'], building_types: ['residential_sf'] }, qty: { basis: { component: 'anchor_bolts' }, mul: 32 } },
    { code: 'B-RBR-DOWEL-EA', assumption: 'Poured foundation walls on the plans — footing-to-wall dowels about every 4 ft on ≈160 LF; delete if the plans show no dowels', when: { facts_any: ['foundation_wall'], building_types: ['residential_sf'] }, qty: { basis: { component: 'foundation_wall' }, mul: 40 } },
    { code: 'B-RBR-SLAB-GRID-SF', assumption: 'Commercial/industrial slab-on-grade — rebar grid over the plan floor area; replace with mesh or fiber if the slab spec differs', when: { facts_any: ['slab_on_grade'], building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'formwork'], before_phase: 'framing', note: 'Steel goes in after the footing excavation and wall forms (one side) are set, and is inspected before concrete is poured.' },
  ],
});
