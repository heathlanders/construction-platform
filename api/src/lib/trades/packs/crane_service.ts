// Trade Knowledge Pack — crane_service (Crane Service). Wave 18 — NEW-TRADE pattern (no hand recipe).
// Dossier: docs/trade-packs/dossiers/crane_service.md. permit_trade null → no gating inspections and no
// code refs; hold points live in inspection_checklists (ground_conditions_check, power_line_assessment,
// pre_lift_check, critical_lift_plan_review).
// Sources: 29 CFR 1926 Subpart CC (rule text read on eCFR 2026-10-08: .1402 ground conditions, .1404(q)
// outriggers, .1408 power lines up to 350 kV, .1412/.1413 inspections, .1417 operation, .1419 signals,
// .1423 fall protection, .1424 work area control, .1425 keeping clear of the load, .1427 operator
// certification, .1428 signal person qualification, .1431 hoisting personnel, .1432 multiple-crane lifts);
// Subpart H 1926.251 rigging. Table A voltage/clearance values are NOT copied — the pack points to the rule.
// ASME B30.5 and NCCCO are named only (proprietary / certifying body). EQUIP-CRANE (day rate with operator)
// already exists in the catalog; the hourly G-CRANE-HYD-HR is an alternative to it, never both.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string, ...extra: string[]) => ({ src: [`ecfr-1926-${sub}`, ...extra], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const CRANE_RE = '\\bcranes?\\b';
const CRITICAL_RE = '\\b(?:critical|tandem|multi(?:ple)?[- ]crane|dual[- ]crane|two[- ]crane|engineered)\\s+(?:crane\\s+)?(?:lifts?|picks?)\\b';

export default definePack({
  key: 'crane_service',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Supplies a mobile crane with a certified operator to hoist steel, trusses, equipment and materials — preparing the setup ground, keeping clear of power lines, barricading the swing radius, rigging and signaling each lift, and planning critical and multi-crane lifts in advance.',
    summary_es: 'Suministra una grúa móvil con operador certificado para izar acero, armaduras, equipos y materiales — prepara el terreno de instalación, mantiene distancia de las líneas eléctricas, acordona el radio de giro, aparejado y señales en cada izaje, y planifica con anticipación los izajes críticos y con varias grúas.',
    glossary: [
      { term: 'Load chart', term_es: 'Tabla de carga', def: 'The manufacturer’s chart in the cab giving how much the crane can lift at each boom length and radius.', def_es: 'La tabla del fabricante en la cabina que indica cuánto puede levantar la grúa en cada largo de pluma y radio.' },
      { term: 'Radius', term_es: 'Radio', def: 'Horizontal distance from the crane’s center of rotation to the hook; capacity drops as it grows.', def_es: 'Distancia horizontal del centro de giro de la grúa al gancho; la capacidad baja cuando aumenta.' },
      { term: 'Outrigger', term_es: 'Estabilizador', def: 'Leg extended from the crane carrier to the ground so the crane stays level and stable during the lift.', def_es: 'Pata que sale del chasis de la grúa al suelo para que se mantenga nivelada y estable durante el izaje.' },
      { term: 'Crane mat', term_es: 'Tapete de grúa', def: 'Heavy timber or composite mat placed under outrigger pads or tracks to spread the load on the ground.', def_es: 'Tapete pesado de madera o compuesto colocado bajo las almohadillas o las orugas para repartir la carga en el suelo.' },
      { term: 'Swing radius', term_es: 'Radio de giro', def: 'The area the rotating upper works and counterweight sweep; people can be struck or crushed there.', def_es: 'El área que barren la parte giratoria y el contrapeso; ahí se puede golpear o aplastar a una persona.' },
      { term: 'Signal person', term_es: 'Señalero', def: 'Qualified worker who directs the operator by standard hand signals or radio when the operator cannot see the load.', def_es: 'Trabajador calificado que dirige al operador con señales de mano estándar o radio cuando el operador no ve la carga.' },
      { term: 'Rigger', term_es: 'Aparejador', def: 'Qualified worker who selects, inspects and attaches slings and hardware to the load.', def_es: 'Trabajador calificado que escoge, inspecciona y conecta eslingas y accesorios a la carga.' },
      { term: 'Tag line', term_es: 'Cuerda guía', def: 'Rope tied to the load so a worker on the ground can stop it spinning or swinging.', def_es: 'Cuerda amarrada a la carga para que un trabajador en el suelo evite que gire o se balancee.' },
      { term: 'Critical lift', term_es: 'Izaje crítico', def: 'A lift with extra risk — near capacity, over people or occupied space, near power lines, or with more than one crane — that gets a written plan.', def_es: 'Un izaje con mayor riesgo — cerca de la capacidad, sobre personas o espacios ocupados, cerca de líneas eléctricas o con más de una grúa — que lleva un plan escrito.' },
      { term: 'Lift director', term_es: 'Director del izaje', def: 'Competent and qualified person who runs a multi-crane lift and reviews the plan with the crew.', def_es: 'Persona competente y calificada que dirige un izaje con varias grúas y revisa el plan con la cuadrilla.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'crane_setup_and_lift',
      example_title: 'Crane service — set roof trusses and RTU',
      when: { title_re: CRANE_RE },
      steps: [
        {
          title: 'Plan the crane setup and access',
          instruction: 'Walk the site with the crane company before crane day. Give them the heaviest load weight, the farthest pick and set radius, and the setup spot. Choose a spot that is firm, drained and graded — away from excavations, fresh backfill, tanks, septic and buried utilities — and tell the operator about any voids or utilities shown on the site drawings. Plan the truck route in, where the delivery trucks will stand, and where the barricade will go.',
          detail: 'The general contractor (controlling entity) is responsible for providing the ground preparation; the crane company confirms it meets the manufacturer’s support and level requirements.',
          tools: ['tape measure', 'site plan', 'marking paint or flags'],
          materials: ['gravel or crushed stone for soft spots'],
          safety_ids: ['ground_failure', 'power_line', 'overload'],
          qa_ids: ['load_weight_known', 'ground_prepared'],
        },
        {
          title: 'Check for power lines and mark the work zone',
          instruction: 'Look up and find every overhead line within the crane’s maximum working radius, 360° around the setup. If any part of the boom, load line or load could get within 20 ft of a line, choose one option before work starts: have the utility de-energize and visibly ground it, keep everything 20 ft away, or keep the minimum approach distance for that voltage from Table A in 29 CFR 1926.1408. Hold a planning meeting, put up a flagged warning line in the operator’s view, use non-conductive tag lines, and add a dedicated spotter or proximity alarm.',
          detail: 'Treat every line as energized until the utility confirms otherwise in writing.',
          tools: ['range finder or measuring wheel', 'radios'],
          materials: ['flagged warning line or barricade', 'non-conductive tag lines'],
          safety_ids: ['power_line'],
          qa_ids: ['power_line_option_chosen'],
        },
        {
          title: 'Set up the crane and barricade the swing radius',
          instruction: 'The operator sets the crane on mats or cribbing, extends the outriggers fully (or as the load chart allows), and levels the crane. Barricade the area the counterweight and upper works swing through with a control line or rail, and keep everyone out of it. The competent person does the shift inspection of the crane and wire rope before the first lift and confirms the load chart and manual are in the cab.',
          tools: ['level', 'cones and caution tape'],
          materials: ['crane mats or outrigger cribbing', 'swing-radius barricade'],
          safety_ids: ['ground_failure', 'outrigger_set', 'swing_radius', 'wind'],
          qa_ids: ['outriggers_on_mats', 'swing_radius_barricaded', 'shift_inspection_done', 'operator_certified'],
        },
        {
          title: 'Rig and inspect the load',
          instruction: 'The rigger picks slings and hardware rated for the load, checks every tag is legible, and inspects them for cuts, kinks, crushing or heat damage before use. Rig so the load cannot slip or shift, use hooks with closed latches, and tie on tag lines. Confirm the load weight plus rigging is within the chart at the planned radius.',
          tools: ['tag lines', 'sling chart'],
          materials: ['slings, shackles and spreader bar rated for the load'],
          safety_ids: ['rigging_failure', 'overload', 'struck_by_load'],
          qa_ids: ['rigging_inspected', 'load_within_chart'],
        },
        {
          title: 'Make the lift with a signal person',
          instruction: 'Agree on one signal person who uses the standard hand signals or a dedicated radio channel whenever the operator cannot see the load or the set point. Lift a few inches first, check the rigging and balance, then fly the load on the route that keeps it away from people. Nobody stands under the load — only the workers hooking, guiding or making the first connection may be in the fall zone. Anyone may call stop, and the operator obeys it. Stop work if wind, lightning or ice make the lift unsafe.',
          detail: 'Never use the crane to drag or side-pull a load, and never leave the controls with a load hanging.',
          tools: ['radios', 'tag lines', 'anemometer or forecast'],
          materials: [],
          safety_ids: ['signals', 'struck_by_load', 'wind', 'overload'],
          qa_ids: ['signal_person_qualified', 'test_lift_done', 'no_one_under_load'],
        },
        {
          title: 'Land the load and demobilize',
          instruction: 'Land the load on blocking, make it secure before unhooking, and keep tag lines in hand until it is set. Lower the boom before traveling under or near power lines. Pull the mats, remove the barricade, and note any ground settlement or damage for the general contractor.',
          tools: ['blocking', 'tag lines'],
          materials: ['dunnage or timber blocking'],
          safety_ids: ['struck_by_load', 'power_line', 'crane_access_fall'],
          qa_ids: ['no_one_under_load'],
        },
      ],
    },
    {
      id: 'critical_lift_planning',
      example_title: 'Tandem lift of precast beam — critical lift plan',
      priority: 10,
      when: { title_re: CRITICAL_RE },
      steps: [
        {
          title: 'Decide whether the lift is critical',
          instruction: 'Treat the lift as critical and write a plan when it is near the crane’s capacity, uses more than one crane, lifts over people or an occupied building, works near power lines, hoists people, or the load is unusual or expensive. A lift with more than one crane always needs a plan by a qualified person before work starts.',
          tools: ['load weight documents', 'site plan'],
          materials: [],
          safety_ids: ['overload', 'tandem_lift'],
          qa_ids: ['load_weight_known'],
        },
        {
          title: 'Write the lift plan',
          instruction: 'The qualified person (with an engineer where needed) writes the plan: load weight with rigging, center of gravity, crane positions and configuration, radius and percent of chart at every step, ground bearing and mats, rigging drawing, power-line clearance, swing barricade, signal method, weather limits and who does what. For a multi-crane lift, show how the load share stays within each crane’s chart as the load moves.',
          tools: ['crane load charts', 'lift-planning software or drawings'],
          materials: [],
          safety_ids: ['tandem_lift', 'ground_failure', 'power_line'],
          qa_ids: ['lift_plan_written', 'ground_bearing_checked'],
        },
        {
          title: 'Hold the pre-lift meeting',
          instruction: 'The lift director reviews the plan with every worker involved — operators, riggers, signal person, spotters. Confirm operator certifications, signal person qualification, radio channel, stop-work authority and the exclusion zone. Walk the load path.',
          tools: ['radios', 'lift plan copy'],
          materials: [],
          safety_ids: ['signals', 'tandem_lift'],
          qa_ids: ['pre_lift_meeting_held', 'operator_certified', 'signal_person_qualified'],
        },
        {
          title: 'Run the lift under the lift director',
          instruction: 'Clear the exclusion zone, make a test lift of a few inches, and check each crane’s load reading against the plan. Move slowly and together on the director’s signals only. Stop and re-plan if any reading, wind, or ground movement goes outside the plan.',
          tools: ['radios', 'tag lines', 'anemometer'],
          materials: [],
          safety_ids: ['tandem_lift', 'struck_by_load', 'wind'],
          qa_ids: ['test_lift_done', 'no_one_under_load'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: `${CRANE_RE}|${CRITICAL_RE}` }, type: 'crane', reason: 'Mobile crane with certified operator to hoist and set the load' },
  ],
  hazards: [
    { id: 'power_line', hazard: 'Electrocution when the boom, load line, rigging or load contacts or arcs to an overhead power line', hazard_es: PENDING_ES, controls: ['Identify the work zone 360° around the crane before operating', 'If any part could get within 20 ft of a line: de-energize and ground, hold 20 ft, or hold the Table A distance for that voltage', 'Planning meeting, flagged warning line in the operator’s view, non-conductive tag lines, and a dedicated spotter or proximity alarm'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc', 'crane_service-osha-topic') },
    { id: 'ground_failure', hazard: 'Crane tips over when the ground under outriggers or tracks settles, is soft, or collapses into a void or trench', hazard_es: PENDING_ES, controls: ['Set up only on firm, drained and graded ground, with mats or cribbing as needed', 'Controlling contractor provides ground preparation and tells the operator about known voids, tanks and utilities', 'Keep back from excavations and fresh backfill'], controls_es: PENDING_ES, osha_ref: '1926.1402(b)', severity: 4, prov: osha('cc') },
    { id: 'outrigger_set', hazard: 'Crane instability from outriggers not fully extended, not on pads, or not set as the load chart requires', hazard_es: PENDING_ES, controls: ['Extend outriggers fully, or only as the manufacturer’s procedures allow for the chart in use', 'Set every outrigger float on a pad or mat; level the crane'], controls_es: PENDING_ES, osha_ref: '1926.1404(q)', severity: 4, prov: osha('cc') },
    { id: 'overload', hazard: 'Crane overturn or structural failure from lifting more than the rated capacity at the radius', hazard_es: PENDING_ES, controls: ['Know the load weight plus rigging before the lift', 'Check capacity at the actual radius on the load chart in the cab', 'Never pressure the operator to exceed the chart; never drag or side-pull loads'], controls_es: PENDING_ES, osha_ref: '1926.1417(o)', severity: 4, prov: osha('cc') },
    { id: 'swing_radius', hazard: 'Struck by, or crushed against an object by, the rotating upper works or counterweight', hazard_es: PENDING_ES, controls: ['Barricade the swing radius with a control line, warning line or rail', 'Train workers to recognize the swing and crush zone', 'Signal the operator and wait for the swing to stop before entering'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)', severity: 4, prov: osha('cc') },
    { id: 'struck_by_load', hazard: 'Struck or crushed by a suspended, swinging or dropped load', hazard_es: PENDING_ES, controls: ['No one in the fall zone except workers hooking, guiding or making the first connection', 'Use hoisting routes away from people; control the load with tag lines', 'Self-closing hook latches; rig so the load cannot shift'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'safety-toe boots', 'high-visibility vest'], prov: osha('cc') },
    { id: 'rigging_failure', hazard: 'Dropped load from a damaged, untagged or overloaded sling or hardware', hazard_es: PENDING_ES, controls: ['Inspect rigging before each shift and remove defective gear from service', 'Use only rigging with legible rated-load tags, within its rated load'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, ppe: ['gloves'], prov: osha('h') },
    { id: 'signals', hazard: 'Unintended crane movement from missed, unclear or conflicting signals', hazard_es: PENDING_ES, controls: ['Provide a qualified signal person when the operator cannot see the load or set point', 'Use the standard hand signals or a dedicated radio channel', 'Operator obeys a stop signal from anyone'], controls_es: PENDING_ES, osha_ref: '1926.1419(a)', severity: 3, prov: osha('cc') },
    { id: 'wind', hazard: 'Loss of load control or reduced crane capacity in wind, ice, snow or lightning', hazard_es: PENDING_ES, controls: ['Competent person adjusts or stops operations for wind, ice and snow', 'Follow the manufacturer’s wind limits; stop and secure the boom for lightning'], controls_es: PENDING_ES, osha_ref: '1926.1417(n)', severity: 3, prov: osha('cc') },
    { id: 'tandem_lift', hazard: 'Overload or dropped load when two cranes share a load and the share shifts during the move', hazard_es: PENDING_ES, controls: ['Plan every multi-crane lift by a qualified person, with engineering help as needed', 'A lift director runs it and reviews the plan with all workers first'], controls_es: PENDING_ES, osha_ref: '1926.1432(a)', severity: 4, prov: osha('cc') },
    { id: 'crane_access_fall', hazard: 'Fall while climbing onto the crane, walking the boom, or during assembly and disassembly', hazard_es: PENDING_ES, controls: ['Use the crane’s steps, handholds and walkways', 'Use fall protection where Subpart CC requires it during assembly, disassembly and boom work'], controls_es: PENDING_ES, osha_ref: '1926.1423', severity: 3, ppe: ['harness when required'], prov: osha('cc') },
    { id: 'hoisting_personnel', hazard: 'Fall or crush when workers ride a crane-suspended platform', hazard_es: PENDING_ES, controls: ['Hoist people only when a ladder, scaffold, aerial lift or personnel hoist would be more dangerous or is not possible', 'Follow all personnel-platform requirements, including trial lift and pre-lift meeting'], controls_es: PENDING_ES, osha_ref: '1926.1431(a)', severity: 4, ppe: ['personal fall arrest'], prov: osha('cc') },
  ],
  qa_checklist: [
    { id: 'load_weight_known', item: 'Heaviest load weight, rigging weight, pick and set radius are written down and given to the crane company before crane day.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'ground_prepared', phase: 'site_prep', item: 'Setup area firm, drained and graded, clear of excavations and backfill, matted as needed; known voids, tanks and buried utilities shown to the operator.', item_es: PENDING_ES, safety: true, prov: osha('cc', 'crane_service-osha-topic') },
    { id: 'power_line_option_chosen', item: 'Overhead lines in the work zone identified and the option (de-energize, 20 ft, or Table A distance) recorded before boom-up; warning line, non-conductive tag lines and spotter or alarm in place.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'outriggers_on_mats', item: 'Outriggers extended as the load chart requires, every float on a pad or mat, crane level within the manufacturer’s tolerance.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'swing_radius_barricaded', item: 'Counterweight swing area barricaded with a control line, warning line or rail and kept clear.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'shift_inspection_done', item: 'Competent person’s shift inspection of the crane and wire rope is done, and the annual inspection is current; load chart and manual are in the cab.', item_es: { status: 'translated', text: 'La inspección de turno de la grúa y del cable por la persona competente está hecha y la inspección anual está vigente; la tabla de carga y el manual están en la cabina.' }, prov: osha('cc') },
    { id: 'operator_certified', item: 'Operator holds a current crane operator certification for the crane type and has been evaluated by the employer; card on site.', item_es: { status: 'translated', text: 'El operador tiene certificación vigente de operador de grúa para el tipo de grúa y fue evaluado por el empleador; credencial en el sitio.' }, prov: osha('cc', 'crane_service-osha-topic') },
    { id: 'signal_person_qualified', item: 'Signal person has documentation of qualification (third-party or employer evaluator) before giving any signals.', item_es: { status: 'translated', text: 'El señalero tiene constancia de calificación (evaluador externo o del empleador) antes de dar cualquier señal.' }, prov: osha('cc') },
    { id: 'rigging_inspected', item: 'Slings, shackles and hooks inspected that shift, tags legible, nothing damaged; defective gear tagged out and removed.', item_es: PENDING_ES, safety: true, prov: osha('h') },
    { id: 'load_within_chart', item: 'Load plus rigging is within the load chart at the planned radius and boom configuration.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'test_lift_done', item: 'Load lifted a few inches and held to check rigging, balance and brakes before the full lift.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'no_one_under_load', item: 'No one stood under the load; only workers hooking, guiding or connecting were in the fall zone.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'lift_plan_written', item: 'Critical or multi-crane lift has a written plan by a qualified person (engineer where needed) showing weight, radius, percent of chart, crane positions and rigging.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'ground_bearing_checked', item: 'Ground bearing under each crane checked against outrigger or track loads in the lift plan; mats sized to match.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'pre_lift_meeting_held', item: 'Lift director reviewed the plan with every worker on the lift before it started; attendance recorded.', item_es: { status: 'translated', text: 'El director del izaje revisó el plan con todos los trabajadores del izaje antes de empezar; asistencia registrada.' }, prov: osha('cc') },
  ],
  inspection_checklists: {
    ground_conditions_check: [
      { item: 'Setup ground firm, drained and graded; mats or cribbing in place as needed', item_es: PENDING_ES, ref: '29 CFR 1926.1402(b)' },
      { item: 'Known voids, tanks and utilities under the setup area communicated to the operator', item_es: PENDING_ES, ref: '29 CFR 1926.1402(c)(2)' },
      { item: 'Crane clear of excavation edges and fresh backfill', item_es: PENDING_ES },
    ],
    power_line_assessment: [
      { item: 'Work zone identified (demarcated or 360° to maximum working radius)', item_es: PENDING_ES, ref: '29 CFR 1926.1408(a)(1)' },
      { item: 'Option recorded: de-energized and grounded, 20 ft clearance, or Table A minimum approach distance', item_es: PENDING_ES, ref: '29 CFR 1926.1408(a)(2)' },
      { item: 'Planning meeting held; warning line up; non-conductive tag lines; spotter or proximity alarm in place', item_es: PENDING_ES, ref: '29 CFR 1926.1408(b)' },
    ],
    pre_lift_check: [
      { item: 'Shift inspection of crane and wire rope complete; load chart and manual in the cab', item_es: PENDING_ES, ref: '29 CFR 1926.1412(d)' },
      { item: 'Operator certification and signal person qualification confirmed', item_es: { status: 'translated', text: 'Certificación del operador y calificación del señalero confirmadas' }, ref: '29 CFR 1926.1427, 1926.1428' },
      { item: 'Outriggers set per load chart; swing radius barricaded', item_es: PENDING_ES, ref: '29 CFR 1926.1424(a)' },
      { item: 'Load weight within chart at radius; rigging inspected and tagged', item_es: PENDING_ES, ref: '29 CFR 1926.1417(o)' },
      { item: 'Wind, ice and lightning checked against the manufacturer’s limits', item_es: PENDING_ES, ref: '29 CFR 1926.1417(n)' },
    ],
    critical_lift_plan_review: [
      { item: 'Written lift plan by a qualified person; engineer involved where needed', item_es: PENDING_ES, ref: '29 CFR 1926.1432(a)' },
      { item: 'Lift director named; plan reviewed with all workers in a pre-lift meeting', item_es: PENDING_ES, ref: '29 CFR 1926.1432(b)' },
      { item: 'Each crane’s share of the load within its chart through the whole move', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'G-CRANE-HYD-HR', name: 'Hydraulic truck crane (about 40–60 ton) with certified operator, per hour', name_es: 'Grúa hidráulica sobre camión (unas 40–60 toneladas) con operador certificado, por hora', unit: 'HR', csi: '01 54 19',
      description: 'Hourly crane rental with operator for short picks. Alternative to the EQUIP-CRANE day rate — price one or the other, not both. Mobilization is separate (G-CRANE-MOB-EA).',
      material_cost_cents: { v: 0, prov: est('rental, no materials') }, labor_hours_per_unit: { v: 0, prov: est('operator included in the rental rate') },
      equipment_cost_cents: { v: 22500, prov: est('typical hourly rate with operator for a 40–60 ton hydraulic crane, national baseline 2026; most companies bill a 4-hour minimum') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-CRANE-MOB-EA', name: 'Crane mobilization, travel, setup and teardown, per move-in', name_es: 'Movilización de grúa, traslado, instalación y desmontaje, por llegada', unit: 'EA', csi: '01 54 19',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 1, prov: est('contractor laborer: prepare and cone the setup area, meet the crane') },
      equipment_cost_cents: { v: 90000, prov: est('travel/setup charge for a mid-size hydraulic crane within a local zone, 2026; counterweight trucks and permits extra') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-CRANE-MATS-DAY', name: 'Crane mats or outrigger pads, rental with placement, per day', name_es: 'Tapetes de grúa o almohadillas de estabilizadores, renta con colocación, por día', unit: 'DAY', csi: '01 54 19',
      material_cost_cents: { v: 0, prov: est('rental') }, labor_hours_per_unit: { v: 1, prov: est('place and pull mats with a loader or the crane') },
      equipment_cost_cents: { v: 25000, prov: est('set of timber or composite crane mats, rental per day incl. delivery share, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-CRANE-RIGGER-DAY', name: 'Qualified rigger / signal person, per day', name_es: 'Aparejador / señalero calificado, por día', unit: 'DAY', csi: '01 54 19',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 8, prov: est('one qualified rigger or signal person for a full day; priced at the estimate labor rate') },
      equipment_cost_cents: { v: 0, prov: est('slings and hardware usually supplied with the crane') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-CRANE-LIFTPLAN-EA', name: 'Engineered critical or multi-crane lift plan, per lift', name_es: 'Plan de izaje crítico o con varias grúas, elaborado por ingeniería, por izaje', unit: 'EA', csi: '01 54 19',
      description: 'Lift-planning fee from the crane company or an engineer (drawings, ground bearing, load share). Carried as equipment cost so it is not taxed as material.',
      material_cost_cents: { v: 0, prov: est('service, no materials') }, labor_hours_per_unit: { v: 2, prov: est('contractor PM/superintendent time to supply data and attend the pre-lift meeting') },
      equipment_cost_cents: { v: 150000, prov: est('typical engineered lift plan fee for a single critical or tandem lift, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
  ],
  quantity_rules: [
    { code: 'G-CRANE-MOB-EA', assumption: 'One crane move-in to set trusses or post-frame members shown on the plans — add one per separate crane day', when: { facts_any: ['engineered_trusses', 'post_frame_columns', 'roof_purlins'] }, qty: { basis: 'const' } },
    { code: 'G-CRANE-RIGGER-DAY', assumption: 'One qualified rigger/signal person for the crane day', when: { facts_any: ['engineered_trusses', 'post_frame_columns'] }, qty: { basis: 'const' } },
    { code: 'G-CRANE-MATS-DAY', assumption: 'Crane mats for two crane days on a commercial or industrial job — adjust to the lift schedule', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-CRANE-LIFTPLAN-EA', assumption: 'One engineered lift plan for the heaviest pick (rooftop equipment or steel) on a commercial or industrial job', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'concrete'], note: 'The crane sets up after the access road and setup pad are prepared and foundations are ready to receive the load.' },
  ],
});
