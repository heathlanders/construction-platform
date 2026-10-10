// Trade Knowledge Pack — structural_steel (Structural Steel Erection). Wave 11 — NEW-TRADE pattern (no
// hand recipe; template tasks 'Structural steel erection' (commercial), 'Primary structural steel
// erection (columns & frames)' and 'Secondary steel, purlins, girts & bracing' (industrial)).
// Dossier: docs/trade-packs/dossiers/structural_steel.md. Sources: UFGS 05 12 00 Part 3, 29 CFR 1926
// Subpart R (§1926.752–.761) + Subpart CC, RCSC 2020 bolting spec and AISC 303-22 (association, paraphrased),
// ICC IBC (reference only). Metal decking, field welding, misc metals and metal buildings (pemb) are
// separate packs — this one stops at the bolted/braced frame.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['structural_steel-ufgs-05-12-00'], confidence: 'verified' as const, last_verified: D };
const rcsc = { src: ['structural_steel-ufgs-05-12-00', 'structural_steel-rcsc-2020'], confidence: 'verified' as const, last_verified: D };
const aisc = { src: ['structural_steel-aisc-303', 'structural_steel-ufgs-05-12-00'], confidence: 'derived' as const, last_verified: D, note: 'UFGS 05 12 00 §3.1 requires erection per AISC 303; responsibility split paraphrased from AISC 303-22.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'structural_steel',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Erects fabricated structural steel — anchor rod survey, columns, beams, girders and bracing set by crane from the erection drawings, plumbed and held with temporary bracing, then bolted up (snug-tight or pretensioned), grouted and touched up for the framing and special inspections.',
    summary_es: 'Monta acero estructural fabricado — levantamiento de pernos de anclaje, columnas, vigas, trabes y arriostramiento colocados con grúa según los planos de montaje, aplomados y sostenidos con arriostramiento temporal, luego atornillados (ajuste firme o pretensado), con mortero y retoque de pintura para las inspecciones de estructura y especiales.',
    glossary: [
      { term: 'Erection drawings', term_es: 'Planos de montaje', def: 'Fabricator drawings that show every piece mark, where it goes and how each connection is bolted or welded.', def_es: 'Planos del fabricante que muestran cada marca de pieza, dónde va y cómo se atornilla o suelda cada conexión.' },
      { term: 'Anchor rod (anchor bolt)', term_es: 'Varilla de anclaje (perno de anclaje)', def: 'Threaded rod cast in the footing or pier that holds a column base plate down.', def_es: 'Varilla roscada colada en la zapata o pedestal que sujeta la placa base de una columna.' },
      { term: 'Connector', term_es: 'Conector (montador de conexión)', def: 'Trained ironworker who makes the first connection of a member as the crane sets it.', def_es: 'Herrero capacitado que hace la primera conexión de una pieza mientras la grúa la coloca.' },
      { term: 'Shake-out', term_es: 'Distribución del acero', def: 'Unloading and laying out steel by piece mark near where it will be erected.', def_es: 'Descargar y acomodar el acero por marca de pieza cerca de donde se va a montar.' },
      { term: 'Snug-tight', term_es: 'Ajuste firme', def: 'Bolted joint with the plies in firm contact — a few hits of an impact wrench or full effort on a spud wrench.', def_es: 'Unión atornillada con las placas en contacto firme — unos golpes de llave de impacto o el esfuerzo completo con llave de cola.' },
      { term: 'Pretensioned bolt', term_es: 'Perno pretensado', def: 'High-strength bolt tightened past snug to a required clamping force by turn-of-nut, tension-control bolt, DTI or calibrated wrench.', def_es: 'Perno de alta resistencia apretado más allá del ajuste firme a una fuerza de sujeción requerida por giro de tuerca, perno de control de tensión, indicador de tensión o llave calibrada.' },
      { term: 'DTI (direct tension indicator)', term_es: 'Indicador de tensión directa (DTI)', def: 'Washer with bumps that flatten as the bolt tightens; a feeler gauge checks the remaining gap.', def_es: 'Arandela con protuberancias que se aplanan al apretar el perno; se revisa el espacio restante con una galga.' },
      { term: 'Plumbing-up', term_es: 'Aplomado', def: 'Adjusting columns and frames to vertical with cables and turnbuckles before final bolt-up.', def_es: 'Ajustar columnas y marcos a la vertical con cables y tensores antes del apriete final.' },
      { term: 'Nonshrink grout', term_es: 'Mortero sin contracción', def: 'Cement grout packed under base plates after the column is set so the plate bears fully on the foundation.', def_es: 'Mortero de cemento que se compacta bajo la placa base después de colocar la columna para que apoye completamente.' },
      { term: 'Special inspection', term_es: 'Inspección especial', def: 'Third-party inspection of bolting and welding required by the building code on many commercial steel frames.', def_es: 'Inspección por un tercero de atornillado y soldadura que exige el código en muchas estructuras comerciales de acero.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'primary_erection',
      example_title: 'Structural steel erection',
      when: { title_re: 'structural\\s+steel|primary\\s+steel|steel\\s+(?:columns?|beams?|girders?|frames?)|columns?\\s*&\\s*frames' },
      steps: [
        {
          title: 'Survey anchor rods and get written notices',
          instruction: 'Survey every anchor rod group for location, spacing, projection and plumb against the anchor rod plan and record the as-built. Before any steel goes up, get written notice from the controlling contractor that the footing and pier concrete reached 75% of design strength (or enough for erection loads) and that any rod repair was approved by the engineer of record. Every column needs at least four rods.',
          detail: 'Never bend, cut, re-weld or enlarge a rod or base-plate hole on your own — report it and wait for the engineer’s fix.',
          tools: ['transit or total station', 'tape measure', 'anchor rod plan', 'string lines'],
          materials: [],
          safety_ids: ['green_concrete', 'column_stability'],
          qa_ids: ['anchor_survey', 'concrete_strength_notice', 'four_anchor_rods', 'anchor_mod_approval'],
        },
        {
          title: 'Prepare the site, crane and lift plan',
          instruction: 'Confirm firm, drained, graded access and laydown for trucks and the crane. With the operator, check the crane setup ground, power-line distances and swing radius, and barricade the swing area. Pre-plan load routes so nobody but connectors and riggers is under a load; plan any multiple (christmas-tree) lifts. Shake out steel by piece mark on dunnage off the ground.',
          tools: ['erection drawings', 'lift plan', 'tag lines', 'rigging with rating tags'],
          materials: ['dunnage / cribbing', 'crane mats'],
          safety_ids: ['swing_radius', 'power_line', 'suspended_load', 'multiple_lift'],
          qa_ids: ['steel_storage'],
        },
        {
          title: 'Set columns and plumb with temporary bracing',
          instruction: 'Set base plates on leveling nuts, shim packs or pre-grouted plates as detailed and run the nuts down. A competent person decides whether each column needs guying or bracing before the crane lets go — if so, install it. Keep the frame stable at every stage; work out from the first braced bay.',
          tools: ['crane', 'spud wrench', 'level', 'cable guys and turnbuckles'],
          materials: ['shim packs', 'anchor rod nuts and washers', 'temporary guy cables'],
          safety_ids: ['column_stability', 'structure_stability', 'connector_fall', 'suspended_load'],
          qa_ids: ['temp_bracing'],
        },
        {
          title: 'Connect beams, girders and bracing',
          instruction: 'Connectors make the first connection from a safe position. Do not release the hoist line until each beam end has at least two bolts per connection drawn up wrench-tight (one bolt per end for diagonal bracing). At double connections through a column or beam web, keep one wrench-tight bolt on the first member unless a seat carries it. Secure loose bolts and tools aloft.',
          detail: 'Connectors between 15 and 30 ft wear tie-off-ready fall gear; above 30 ft or two stories they must be protected.',
          tools: ['crane', 'spud wrench', 'drift pins', 'impact wrench', 'bolt bag'],
          materials: ['erection bolts, nuts and washers'],
          safety_ids: ['release_bolts', 'double_connection', 'connector_fall', 'falling_objects', 'suspended_load'],
          qa_ids: ['two_bolts_release', 'no_torch_holes'],
        },
        {
          title: 'Plumb, bolt up, grout and touch up',
          instruction: 'Plumb and align the frame within tolerance, then make permanent connections. Snug-tight joints: bolts in every hole, compact from the most rigid part out. Pretensioned or slip-critical joints: verify bolt assemblies first, snug the whole pattern, then pretension by the specified method working out to free edges. Grout full bearing under base plates with nonshrink grout, prime field bolts and abrasions, and leave the frame open for the framing and special inspection.',
          tools: ['impact wrench', 'calibrated wrench or turn-of-nut marks', 'DTI feeler gauge', 'grout forms', 'wire brush'],
          materials: ['high-strength bolt assemblies', 'DTI washers (if specified)', 'nonshrink grout', 'touch-up primer'],
          safety_ids: ['edge_fall', 'structure_stability', 'falling_objects'],
          qa_ids: ['preinstall_verification', 'snug_tight', 'pretension_sequence', 'dti_gap', 'bolt_storage', 'grout_full_bearing', 'field_prime'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '2205', code_type: 'IBC', note: 'Structural steel — design, fabrication and erection per AISC 360' },
            { section: '2204', code_type: 'IBC', note: 'Connections — welding and high-strength bolting requirements' },
            { section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel bolting and welding where required' },
          ],
        },
      ],
    },
    {
      id: 'secondary_steel',
      example_title: 'Secondary steel, purlins, girts & bracing',
      priority: 10,
      when: { title_re: 'secondary\\s+steel|purlins?|girts?|\\bbracing\\b|\\bbridging\\b' },
      steps: [
        {
          title: 'Check the primary frame before loading it',
          instruction: 'Confirm the primary frame is plumbed and its connections are complete enough to carry secondary members, and that plumbing-up cables are in place before bundles of purlins, joists or decking are landed. Leave plumbing-up equipment until a competent person approves removal.',
          tools: ['erection drawings', 'plumb laser'],
          materials: [],
          safety_ids: ['structure_stability'],
          qa_ids: ['temp_bracing'],
        },
        {
          title: 'Hoist and land secondary members',
          instruction: 'Rig girts, purlins, struts and bracing at their center of gravity with tag lines. Multiple lifts: rated multiple-lift rigging, no more than five members, set from the bottom up, members at least 7 ft apart. Land bundles only on framing that can carry them.',
          tools: ['crane or telehandler', 'multiple-lift rigging assembly', 'tag lines'],
          materials: [],
          safety_ids: ['multiple_lift', 'suspended_load', 'swing_radius'],
        },
        {
          title: 'Install girts, purlins, sag rods and bracing',
          instruction: 'Bolt secondary members with the lap and bolt pattern on the drawings; at shared holes keep one wrench-tight bolt on the first member. Install sag rods, flange braces and permanent diagonal bracing, then tighten bracing until straight without bowing the frame.',
          tools: ['boom lift', 'impact wrench', 'spud wrench', 'tape measure'],
          materials: ['purlins and girts', 'sag rods', 'flange braces', 'rod or angle bracing', 'bolts, nuts and washers'],
          safety_ids: ['double_connection', 'edge_fall', 'falling_objects'],
          qa_ids: ['no_torch_holes', 'snug_tight'],
        },
        {
          title: 'Final check and touch-up for inspection',
          instruction: 'Walk every bay for missing bolts, braces and sag rods, release temporary bracing only once permanent bracing is complete and approved, prime field bolts and abrasions, and leave the work open for the framing inspection.',
          tools: ['impact wrench', 'wire brush', 'erection drawings'],
          materials: ['touch-up primer'],
          safety_ids: ['edge_fall', 'structure_stability'],
          qa_ids: ['field_prime'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '2205', code_type: 'IBC', note: 'Structural steel — design, fabrication and erection per AISC 360' },
            { section: '2210', code_type: 'IBC', note: 'Cold-formed steel members such as purlins and girts' },
            { section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel bolting and welding where required' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: '2205', code_type: 'IBC', note: 'Structural steel — design, fabrication and erection per AISC 360', prov: icc },
      { section: '2204', code_type: 'IBC', note: 'Connections — welding and high-strength bolting requirements', prov: icc },
      { section: '2210', code_type: 'IBC', note: 'Cold-formed steel members such as purlins and girts', prov: icc },
      { section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel bolting and welding where required', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'structural\\s+steel|primary\\s+steel|columns?|frames?|girders?|beams?' }, type: 'crane', reason: 'Set columns, beams and girders from the lift plan' },
    { when: { title_re: 'structural\\s+steel|steel|purlins?|girts?|bracing' }, type: 'boom_lift', reason: 'Reach connections for bolt-up, bracing and touch-up at height' },
    { when: { title_re: 'secondary\\s+steel|purlins?|girts?' }, type: 'telehandler', reason: 'Unload and lift bundles of light secondary members', optional: true },
    { when: { title_re: 'structural\\s+steel|primary\\s+steel|columns?' }, type: 'welder', reason: 'Field-welded connections where detailed (by a qualified welder)', optional: true },
  ],
  hazards: [
    { id: 'connector_fall', hazard: 'Connector falls while making initial connections at height', hazard_es: PENDING_ES, controls: ['Only connector-trained ironworkers make initial connections', 'Between 15 and 30 ft wear fall arrest, positioning or restraint gear ready to tie off', 'Above 30 ft or two stories, tie off or use other fall protection'], controls_es: PENDING_ES, osha_ref: '1926.760(b)(1)', severity: 4, ppe: ['full-body harness', 'self-retracting lifeline'], prov: osha('r') },
    { id: 'edge_fall', hazard: 'Fall from an unprotected edge more than 15 ft up during bolt-up or bracing', hazard_es: PENDING_ES, controls: ['Guardrails, safety nets, fall arrest, positioning or restraint systems above 15 ft', 'Anchor only to points a qualified person approved'], controls_es: PENDING_ES, osha_ref: '1926.760(a)(1)', severity: 4, ppe: ['full-body harness'], prov: osha('r') },
    { id: 'green_concrete', hazard: 'Anchor rods pull out or footings fail under erection loads', hazard_es: PENDING_ES, controls: ['Do not erect until written notice says concrete reached 75% of design strength or enough for erection loads', 'Get written notice of any anchor rod repair before that column is set'], controls_es: PENDING_ES, osha_ref: '1926.752(b)', severity: 4, prov: osha('r') },
    { id: 'column_stability', hazard: 'Column topples after the crane releases it', hazard_es: PENDING_ES, controls: ['Anchor every column with at least four rods', 'Set columns on level floors, leveling plates, leveling nuts or shim packs', 'A competent person decides on guying or bracing and it is installed before release'], controls_es: PENDING_ES, osha_ref: '1926.755(a)(1)', severity: 4, prov: osha('r') },
    { id: 'structure_stability', hazard: 'Partially erected frame collapses or racks in wind or under stacked material', hazard_es: PENDING_ES, controls: ['Keep the structure stable at all times during erection', 'Install plumbing-up equipment before landing joists, decking or bridging bundles', 'Remove plumbing-up equipment only with competent-person approval'], controls_es: PENDING_ES, osha_ref: '1926.754(a)', severity: 4, prov: osha('r') },
    { id: 'release_bolts', hazard: 'Beam falls when released from the hoist line before it is bolted', hazard_es: PENDING_ES, controls: ['At least two bolts per connection, wrench-tight, before releasing solid-web members', 'A competent person decides if cantilevers need more bolts'], controls_es: PENDING_ES, osha_ref: '1926.756(a)(1)', severity: 4, prov: osha('r') },
    { id: 'double_connection', hazard: 'First member drops when shared bolts are pulled for a double connection', hazard_es: PENDING_ES, controls: ['Keep at least one bolt with its wrench-tight nut on the first member unless a seat or equivalent device supports it'], controls_es: PENDING_ES, osha_ref: '1926.756(c)(1)', severity: 4, prov: osha('r') },
    { id: 'suspended_load', hazard: 'Struck by a swinging or dropped steel member', hazard_es: PENDING_ES, controls: ['Pre-plan load routes so only connectors and riggers work under a load', 'Self-closing hook latches; every load rigged by a qualified rigger', 'Rigging inspected by a qualified rigger before each shift'], controls_es: PENDING_ES, osha_ref: '1926.753(d)(1)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: osha('r') },
    { id: 'multiple_lift', hazard: 'Members fall from an improperly rigged multiple (christmas-tree) lift', hazard_es: PENDING_ES, controls: ['Use a rated multiple-lift rigging assembly, beams only, no more than five members', 'Rig at the center of gravity, top down, at least 7 ft apart; set from the bottom up', 'Only workers trained in multiple-lift procedures'], controls_es: PENDING_ES, osha_ref: '1926.753(e)(1)', severity: 4, prov: osha('r') },
    { id: 'swing_radius', hazard: 'Struck or crushed by the crane’s rotating superstructure', hazard_es: PENDING_ES, controls: ['Barricade the swing radius with control lines or railings', 'Train workers near the crane to recognize the swing hazard area'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)(2)', severity: 4, prov: osha('cc') },
    { id: 'power_line', hazard: 'Crane boom, load line or load contacts overhead power lines', hazard_es: PENDING_ES, controls: ['Identify the work zone and check whether the crane could get within 20 ft of a line', 'De-energize and ground, keep the clearance, or use the required spotter and controls'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'falling_objects', hazard: 'Bolts, drift pins or tools falling from the steel', hazard_es: PENDING_ES, controls: ['Secure tools, bolts and materials not in use aloft', 'Bar other trades from below erection unless overhead protection is provided'], controls_es: PENDING_ES, osha_ref: '1926.759(a)', severity: 3, ppe: ['hard hat'], prov: osha('r') },
  ],
  qa_checklist: [
    { id: 'anchor_survey', phase: 'foundation', item: 'Every anchor rod group surveyed for location, spacing, projection and plumb before erection; as-built recorded and deviations sent to the engineer of record.', item_es: { status: 'translated', text: 'Cada grupo de pernos de anclaje revisado en ubicación, separación, saliente y plomo antes del montaje; levantamiento registrado y desviaciones enviadas al ingeniero responsable.' }, prov: aisc },
    { id: 'concrete_strength_notice', item: 'Written notice on file that footing and pier concrete reached 75% of design strength (or enough for erection loads) before steel is set.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'four_anchor_rods', item: 'Every column anchored with at least four anchor rods.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'anchor_mod_approval', item: 'No anchor rod repaired, replaced or field-modified without engineer-of-record approval, and written notice given to the erector before that column is set.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'steel_storage', item: 'Steel stored on dunnage off the ground, sorted by piece mark, in a firm drained laydown area.', item_es: { status: 'translated', text: 'Acero almacenado sobre durmientes sin tocar el suelo, ordenado por marca de pieza, en un área de acopio firme y drenada.' }, prov: ufgs },
    { id: 'temp_bracing', item: 'Temporary guys or bracing in place until permanent bracing, connections and floors make the frame self-supporting; removed only with competent-person approval.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-r', 'structural_steel-aisc-303'], confidence: 'verified', last_verified: D } },
    { id: 'two_bolts_release', item: 'Each beam end has at least two wrench-tight bolts per connection (one for diagonal bracing) before the hoist line is released.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'no_torch_holes', item: 'No holes cut or enlarged by burning and no field gas cutting of main members without written engineer approval.', item_es: { status: 'translated', text: 'Ningún agujero cortado o agrandado con soplete y ningún corte con gas en elementos principales sin aprobación escrita del ingeniero.' }, prov: ufgs },
    { id: 'preinstall_verification', item: 'Before bolting starts, sample bolt-nut-washer assemblies from each lot tested in a tension device to confirm they reach the required pretension.', item_es: { status: 'translated', text: 'Antes de empezar el atornillado, se prueban muestras de conjuntos perno-tuerca-arandela de cada lote en un medidor de tensión para confirmar la pretensión requerida.' }, prov: rcsc },
    { id: 'snug_tight', item: 'Snug-tight joints: bolts in every hole, plies in firm contact, compacted from the most rigid part of the joint outward.', item_es: { status: 'translated', text: 'Uniones de ajuste firme: pernos en todos los agujeros, placas en contacto firme, apretadas desde la parte más rígida de la unión hacia afuera.' }, prov: rcsc },
    { id: 'pretension_sequence', item: 'Pretensioned joints: whole pattern snugged first, then pretensioned by the specified method working from the most rigid part to free edges.', item_es: { status: 'translated', text: 'Uniones pretensadas: todo el patrón con ajuste firme primero, luego pretensado con el método especificado desde la parte más rígida hacia los bordes libres.' }, prov: rcsc },
    { id: 'dti_gap', item: 'Where DTIs are used, gaps checked with a feeler gauge and meet the DTI specification after tightening.', item_es: { status: 'translated', text: 'Donde se usan indicadores DTI, los espacios se revisan con galga y cumplen la especificación del DTI después del apriete.' }, prov: ufgs },
    { id: 'bolt_storage', item: 'Bolts, nuts and washers kept clean and lubricated in closed containers; unused fasteners returned to protected storage at end of shift.', item_es: { status: 'translated', text: 'Pernos, tuercas y arandelas limpios y lubricados en recipientes cerrados; los no usados se regresan a almacenamiento protegido al final del turno.' }, prov: ufgs },
    { id: 'grout_full_bearing', item: 'After final positioning, nonshrink grout gives full bearing under every base and bearing plate; anchor rods not tightened with impact wrenches.', item_es: { status: 'translated', text: 'Después del posicionamiento final, el mortero sin contracción da apoyo completo bajo cada placa base y de apoyo; los pernos de anclaje no se aprietan con llave de impacto.' }, prov: ufgs },
    { id: 'field_prime', item: 'Field bolt heads, nuts, field welds and shop-coat abrasions cleaned and primed with paint matching the shop coat.', item_es: { status: 'translated', text: 'Cabezas de pernos, tuercas, soldaduras de campo y raspaduras de la pintura de taller limpiadas e imprimadas con pintura igual a la de taller.' }, prov: ufgs },
  ],
  inspection_checklists: {
    foundation: [
      { item: 'Anchor rod as-built survey on file; any deviation resolved by the engineer of record before erection', item_es: PENDING_ES },
      { item: 'Written concrete strength notice given to the steel erector', item_es: PENDING_ES },
    ],
    framing: [
      { item: 'Approved erection drawings on site; members match piece marks and sizes', item_es: PENDING_ES, ref: '2205' },
      { item: 'Bolting complete to the specified joint type; pre-installation verification and DTI records available', item_es: PENDING_ES, ref: '2204' },
      { item: 'Permanent bracing installed; base plates fully grouted', item_es: PENDING_ES },
      { item: 'Structural steel special inspection reports complete where required', item_es: PENDING_ES, ref: '1705.2' },
    ],
  },
  assemblies: [
    { code: 'B-STL-FAB-TON', name: 'Fabricated structural steel supply, delivered (shapes, plates, connection material), per ton', name_es: 'Suministro de acero estructural fabricado, entregado (perfiles, placas, material de conexión), por tonelada', unit: 'TON', csi: '05 12 00',
      description: 'Supply only. Erection is B-STL-ERECT-TON.',
      material_cost_cents: { v: 400000, prov: est('typical 2026 delivered price for fabricated low-rise wide-flange framing, wide regional and mill-price swing — tune per fabricator quote') }, labor_hours_per_unit: { v: 0, prov: est('supply only') },
      equipment_cost_cents: { v: 0, prov: est('supply only') }, waste_pct: { v: 0, prov: est('fabricated to length') } },
    { code: 'B-STL-ERECT-TON', name: 'Erect structural steel — set, plumb, bolt up and grout, per ton', name_es: 'Montaje de acero estructural — colocar, aplomar, atornillar y colocar mortero, por tonelada', unit: 'TON', csi: '05 12 00',
      material_cost_cents: { v: 3000, prov: est('erection bolts overage, shims and nonshrink grout per ton') }, labor_hours_per_unit: { v: 10, prov: est('low-rise bolted frame, ironworker crew of ~5 setting roughly 4 tons per day') },
      equipment_cost_cents: { v: 25000, prov: est('crane and boom-lift days spread per ton on a mid-size low-rise job') }, waste_pct: { v: 0, prov: est('materials are incidental') } },
    { code: 'B-STL-ANCHOR-SURVEY-EA', name: 'Anchor rod group as-built survey before erection, per column', name_es: 'Levantamiento de grupo de pernos de anclaje antes del montaje, por columna', unit: 'EA', csi: '05 12 00',
      material_cost_cents: { v: 0, prov: est('survey only') }, labor_hours_per_unit: { v: 0.5, prov: est('instrument shots and record per rod group') },
      equipment_cost_cents: { v: 500, prov: est('total station / transit time per column') }, waste_pct: { v: 0, prov: est('counted per column') } },
    { code: 'B-STL-TEMP-BRACE-TON', name: 'Temporary bracing and guying allowance (cables, turnbuckles, install and remove), per ton', name_es: 'Partida de arriostramiento y atirantado temporal (cables, tensores, instalar y retirar), por tonelada', unit: 'TON', csi: '05 12 00',
      material_cost_cents: { v: 1500, prov: est('reusable cable, clips and turnbuckles amortized per ton') }, labor_hours_per_unit: { v: 0.75, prov: est('set and later strip guys/bracing') },
      equipment_cost_cents: { v: 0, prov: est('uses the erection crane and lifts') }, waste_pct: { v: 0, prov: est('reusable') } },
    { code: 'B-STL-TOUCHUP-TON', name: 'Field touch-up priming of bolts, welds and abrasions, per ton', name_es: 'Retoque de imprimación en campo de pernos, soldaduras y raspaduras, por tonelada', unit: 'TON', csi: '05 12 00',
      material_cost_cents: { v: 800, prov: est('shop-coat-matching primer and brushes per ton') }, labor_hours_per_unit: { v: 0.5, prov: est('clean and prime field connections') },
      equipment_cost_cents: { v: 0, prov: est('hand tools, lift time in erection') }, waste_pct: { v: 10, prov: est('paint loss') } },
    { code: 'B-STL-HSBOLT-EA', name: 'High-strength bolt assembly installed and pretensioned (with DTI), each', name_es: 'Conjunto de perno de alta resistencia instalado y pretensado (con DTI), cada uno', unit: 'EA', csi: '05 12 00',
      description: 'Use for pretensioned/slip-critical joints counted from the connection schedule; snug-tight bolts are in B-STL-ERECT-TON.',
      material_cost_cents: { v: 600, prov: est('3/4 in. heavy hex structural bolt, nut, hardened washer and DTI, 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('install, snug and pretension in a production pattern') },
      equipment_cost_cents: { v: 0, prov: est('impact wrench in crew tools') }, waste_pct: { v: 3, prov: est('dropped and rejected assemblies') } },
  ],
  quantity_rules: [
    { code: 'B-STL-FAB-TON', assumption: 'Steel tonnage estimated at ~9 lb per SF of scheduled floor area (low-rise frame) — replace with the fabricator take-off', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0045, round: 'ceil' } },
    { code: 'B-STL-ERECT-TON', assumption: 'Erection tonnage at ~9 lb per SF of scheduled floor area — replace with the fabricator take-off', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0045, round: 'ceil' } },
    { code: 'B-STL-TEMP-BRACE-TON', assumption: 'Temporary bracing allowance on the estimated erection tonnage', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0045, round: 'ceil' } },
    { code: 'B-STL-TOUCHUP-TON', assumption: 'Field touch-up on the estimated erection tonnage', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.0045, round: 'ceil' } },
    { code: 'B-STL-ANCHOR-SURVEY-EA', assumption: 'Column count estimated at one per ~900 SF of floor (30 x 30 ft bays) — use the anchor rod plan count', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.00111, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['concrete', 'rebar'], note: 'Steel erection starts only after footings and piers are poured, anchor rods surveyed and written concrete-strength notice given.' },
  ],
});
