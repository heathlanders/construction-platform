// Trade Knowledge Pack — concrete_pumping (Concrete Pumping). Wave 08 — NEW-TRADE pattern (no hand recipe).
// Dossier: docs/trade-packs/dossiers/concrete_pumping.md. permit_trade null → no gating inspections and no
// code refs; hold points live in inspection_checklists (pump_setup_check, pre_pour_check, cleanout_washout_check).
// Sources: 29 CFR 1926 Subparts Q (702(e) pumping systems, 702(j) lockout, 701(b) rebar), O (600(a)(6) power
// lines, 601(b)(4) backing), P, M, E, D, C; ACPA safety bulletins (association_public, paraphrased); UFGS
// 03 30 00 §3.7.2 Pumping; EPA concrete-washout BMP. NOTE: 29 CFR 1926.1400(c)(1) excludes concrete pumps
// from Subpart CC (cranes), so crane power-line rules (1926.1407–1411) are NOT cited — Subpart O
// 1926.600(a)(6) applies, and ACPA policy (20 ft / 50 ft + dedicated spotter) is stricter.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string, ...extra: string[]) => ({ src: [`ecfr-1926-${sub}`, ...extra], confidence: 'verified' as const, last_verified: D });
const acpa = (...ids: string[]) => ({ src: ids.map((i) => `concrete_pumping-acpa-${i}`), confidence: 'derived' as const, last_verified: D, note: 'Paraphrased from ACPA guidance; the pump manufacturer’s manual governs where it differs.' });
const ufgs = { src: ['ufgs-03-30-00'], confidence: 'verified' as const, last_verified: D };
const epa = { src: ['concrete_pumping-epa-washout'], confidence: 'verified' as const, last_verified: D };
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const PUMP_RE = '\\bpump(?:s|ing|ed)?\\b|\\bplacing\\s+boom\\b';
const LINE_RE = '\\b(?:line|trailer|ground[- ]line|grout|trailer[- ]mounted)\\s+pump\\b';

export default definePack({
  key: 'concrete_pumping',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Places ready-mix concrete with a truck-mounted boom pump or a trailer line pump — planning the setup spot, outriggers and power-line clearance, priming the line, controlling the end hose with agreed signals, and cleaning out with the washwater contained.',
    summary_es: 'Coloca concreto premezclado con bomba de pluma montada en camión o bomba estacionaria de línea en remolque — planifica el lugar de instalación, los estabilizadores y la distancia a líneas eléctricas, ceba la línea, controla la manguera final con señales acordadas y limpia el equipo conteniendo el agua de lavado.',
    glossary: [
      { term: 'Boom pump', term_es: 'Bomba de pluma', def: 'Truck-mounted pump with a folding placing boom that carries the pipeline over the pour.', def_es: 'Bomba montada en camión con una pluma plegable que lleva la tubería sobre el colado.' },
      { term: 'Line pump', term_es: 'Bomba de línea', def: 'Trailer pump that pushes concrete through hose and steel pipe laid on the ground.', def_es: 'Bomba en remolque que empuja el concreto por manguera y tubo de acero tendidos en el suelo.' },
      { term: 'Outrigger', term_es: 'Estabilizador', def: 'Leg that extends from the pump truck to the ground so the boom cannot tip the truck.', def_es: 'Pata que se extiende del camión al suelo para que la pluma no vuelque el camión.' },
      { term: 'Cribbing pad', term_es: 'Almohadilla de apoyo', def: 'Pad or timber stack under each outrigger foot that spreads the load on the ground.', def_es: 'Placa o cama de madera bajo cada pata que reparte la carga en el suelo.' },
      { term: 'End hose (tip hose)', term_es: 'Manguera final', def: 'The flexible rubber hose at the end of the boom or line that the hose handler guides.', def_es: 'La manguera de hule flexible al final de la pluma o línea que guía el manguerero.' },
      { term: 'Hose whip', term_es: 'Latigazo de manguera', def: 'Violent swing of the end hose when trapped air in the line is compressed and suddenly released.', def_es: 'Movimiento violento de la manguera final cuando el aire atrapado en la línea se comprime y se libera de golpe.' },
      { term: 'Priming', term_es: 'Cebado', def: 'Pushing grout or slurry through a dry line first so the concrete flows without blocking.', def_es: 'Pasar lechada por la línea seca primero para que el concreto fluya sin taparse.' },
      { term: 'Hopper', term_es: 'Tolva', def: 'Bin at the back of the pump that the ready-mix truck discharges into; has a grate and a mixing agitator.', def_es: 'Recipiente atrás de la bomba donde descarga el camión revolvedor; tiene rejilla y agitador.' },
      { term: 'Washout', term_es: 'Área de lavado', def: 'Leak-proof container or lined pit that catches the water and leftover concrete from cleaning chutes and the hopper.', def_es: 'Contenedor o fosa forrada a prueba de fugas que recibe el agua y el concreto sobrante al limpiar canaletas y tolva.' },
      { term: 'Shortrigging', term_es: 'Estabilización parcial', def: 'Setting up with outriggers not fully extended; only allowed as the pump manual permits.', def_es: 'Instalar con los estabilizadores sin extender por completo; solo como lo permite el manual de la bomba.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'boom_pump_placement',
      example_title: 'Concrete pump — boom pump for slab pour',
      when: { title_re: PUMP_RE },
      steps: [
        {
          title: 'Plan the pump setup with the operator',
          instruction: 'Before pour day, walk the site with the pump company. Pick a level setup spot on firm, compacted ground — not on fresh backfill, over voids or buried lines, or near an excavation edge. Look up: find every overhead line in the boom’s reach and plan to keep the boom at least 20 ft away (50 ft above 350 kV), with a spotter whose only job is to watch it. Mark the ready-mix truck path, the backing spot, the waste-concrete spot and the washout container.',
          detail: 'If the outriggers cannot fully extend, the operator decides whether the manual allows a short setup — never pressure them to set up.',
          tools: ['tape measure', 'marking paint or cones', 'site plan'],
          materials: ['cones and flags for the power-line danger zone'],
          safety_ids: ['power_line', 'outrigger_tip', 'excavation_edge', 'truck_backing'],
          qa_ids: ['setup_ground_firm', 'power_line_plan', 'truck_route_planned', 'washout_planned'],
        },
        {
          title: 'Set outriggers and check the pump',
          instruction: 'The operator sets every outrigger on cribbing pads (even on pavement), looking under the truck before jacking each leg and keeping everyone clear of the feet. Level the truck. Check wind against the manual’s limit, test the E-stops, and inspect hoses, clamps and pipe for wear. Keep the hopper grate closed.',
          tools: ['level', 'anemometer or forecast'],
          materials: ['outrigger cribbing pads'],
          safety_ids: ['outrigger_tip', 'hopper_caught', 'pipeline_burst'],
          qa_ids: ['outriggers_cribbed', 'estops_tested', 'line_inspected'],
        },
        {
          title: 'Prime the line and start pumping',
          instruction: 'Push grout or slurry through the dry line, then the first concrete. The first strokes are the most likely to whip the end hose: clear everyone from the end-hose area and point the first bony material into the waste spot. Agree hand signals or radio calls, and name one signal person the operator can see.',
          tools: ['radios'],
          materials: ['pump primer or grout slurry'],
          safety_ids: ['hose_whip', 'concrete_burns', 'noise'],
          qa_ids: ['startup_area_clear', 'signals_agreed'],
        },
        {
          title: 'Place concrete with the end hose',
          instruction: 'Hold the end hose at arm’s length, about 2–3 ft above the deck, and walk forward. Never hug, shoulder or kink it, and never stand between the hose and a wall or column. If pumping stops for more than a few minutes, clear the area or swing the boom to the waste spot and get flow back before returning. Watch for segregation and slump loss at the discharge.',
          detail: 'Where the spec calls for it, take test samples at the discharge end as well as at the truck.',
          tools: ['radios', 'shovels', 'vibrator'],
          materials: [],
          safety_ids: ['hose_whip', 'fall_edge', 'rebar_impale', 'concrete_burns'],
          qa_ids: ['hose_handling', 'no_segregation', 'samples_at_discharge', 'rebar_capped'],
        },
        {
          title: 'Clean out and contain the washout',
          instruction: 'Clean the line with a sponge or ball and water at the planned spot; compressed air only by a trained operator, never through rubber hose or short pipe. Release all line pressure before opening any clamp. Bleed the accumulator and lock out the pump before opening the hopper grate. Wash the hopper and chutes into the leak-proof washout container — never onto the ground or into a storm drain.',
          tools: ['cleanout ball or sponge', 'water hose', 'lockout lock and tag'],
          materials: ['washout container or lined washout pit'],
          safety_ids: ['air_cleanout', 'hopper_caught', 'concrete_burns'],
          qa_ids: ['clamps_depressurized', 'washout_contained'],
        },
      ],
    },
    {
      id: 'line_pump_placement',
      example_title: 'Line pump for footing and wall pour',
      priority: 10,
      when: { title_re: LINE_RE },
      steps: [
        {
          title: 'Plan the pump spot and hose route',
          instruction: 'Set the line pump where ready-mix trucks can reach the hopper without backing past workers. Lay out the shortest hose and pipe route to the pour with as few bends as possible, away from excavation edges, and plan where the cleanout and washout will happen.',
          tools: ['tape measure', 'cones'],
          materials: ['pipe supports and blocking'],
          safety_ids: ['truck_backing', 'excavation_edge'],
          qa_ids: ['truck_route_planned', 'washout_planned'],
        },
        {
          title: 'Lay, support and inspect the line',
          instruction: 'Couple the pipe and hose with locked clamps and gaskets, support and anchor steel pipe at bends and on vertical runs, and keep hose free of kinks. Inspect every section for thin walls, soft spots and frayed covers before use. Test the E-stops.',
          tools: ['clamp wrench', 'pipe wall gauge'],
          materials: ['clamps and gaskets', 'pipe supports', 'tie-downs'],
          safety_ids: ['pipeline_burst', 'hopper_caught'],
          qa_ids: ['line_inspected', 'estops_tested'],
        },
        {
          title: 'Prime and place',
          instruction: 'Prime with grout or slurry and waste the first material away from people. Move the end hose by walking forward with it — never drag it backward or stand inside its swing. After any stop, clear the hose area before restarting.',
          tools: ['radios', 'shovels', 'vibrator'],
          materials: ['pump primer or grout slurry'],
          safety_ids: ['hose_whip', 'rebar_impale', 'concrete_burns', 'noise'],
          qa_ids: ['startup_area_clear', 'hose_handling', 'no_segregation'],
        },
        {
          title: 'Break down, clean and contain the washout',
          instruction: 'Push the line out with a ball and water, release pressure before opening clamps, and rinse sections into the washout container. Lock out the pump before reaching into the hopper. Lift concrete-filled pipe with two people.',
          tools: ['cleanout ball', 'water hose', 'lockout lock and tag'],
          materials: ['washout container'],
          safety_ids: ['air_cleanout', 'hopper_caught', 'concrete_burns'],
          qa_ids: ['clamps_depressurized', 'washout_contained'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: PUMP_RE }, type: 'concrete_pump', reason: 'Boom or line pump to place concrete where the ready-mix chute cannot reach' },
  ],
  hazards: [
    { id: 'hose_whip', hazard: 'Struck by a whipping end hose when trapped air in the line is compressed and released', hazard_es: PENDING_ES, controls: ['Keep everyone outside the end-hose movement area at startup and after any stop', 'Prime the line and waste the first material away from people', 'Never kink, hug or shoulder the hose; never stand between hose and a fixed object'], controls_es: PENDING_ES, osha_ref: '1926.702(e)', severity: 4, ppe: ['hard hat', 'safety glasses'], prov: osha('q', 'concrete_pumping-acpa-hose-whip-1', 'concrete_pumping-acpa-hose-whip-2', 'concrete_pumping-acpa-startup') },
    { id: 'pipeline_burst', hazard: 'Burst or separated pipeline, hose or clamp under pumping pressure', hazard_es: PENDING_ES, controls: ['Support discharge pipe for 100 percent overload', 'Inspect pipe wall thickness, hose covers and clamps before each pour; remove worn parts'], controls_es: PENDING_ES, osha_ref: '1926.702(e)(1)', severity: 3, ppe: ['safety glasses'], prov: osha('q', 'concrete_pumping-acpa-hose-handler') },
    { id: 'air_cleanout', hazard: 'Violent discharge of concrete and pipe movement during compressed-air cleanout', hazard_es: PENDING_ES, controls: ['Prefer water and a cleanout ball', 'Air cleanout only by trained people, with fail-safe connectors on air hoses', 'Release all pressure before opening any clamp'], controls_es: PENDING_ES, osha_ref: '1926.702(e)(2)', severity: 4, ppe: ['safety glasses', 'hard hat'], prov: osha('q', 'concrete_pumping-acpa-cleanout') },
    { id: 'power_line', hazard: 'Electrocution when the boom or pipeline contacts or arcs to an overhead power line', hazard_es: PENDING_ES, controls: ['Treat every overhead line as energized until the owner says otherwise', 'Keep the boom at least 10 ft from lines up to 50 kV (OSHA minimum); ACPA policy is 20 ft, 50 ft above 350 kV', 'Use a dedicated spotter when lines are near the boom’s reach — no spotter, no boom'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(6)', severity: 4, prov: osha('o', 'concrete_pumping-acpa-electricity') },
    { id: 'outrigger_tip', hazard: 'Pump truck tips over from poor cribbing, soft or hollow ground, or high wind', hazard_es: PENDING_ES, controls: ['Contractor provides firm, compacted setup ground with no voids or buried lines', 'Set every outrigger on cribbing pads; short-rig only as the manual allows', 'Fold the boom when wind exceeds the manufacturer’s limit'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(2)', severity: 4, prov: osha('c', 'concrete_pumping-acpa-outriggers', 'concrete_pumping-acpa-wind') },
    { id: 'excavation_edge', hazard: 'Pump or ready-mix truck near an open excavation caving the edge or falling in', hazard_es: PENDING_ES, controls: ['Keep the pump, outriggers and trucks back from excavation edges and fresh backfill', 'Never set outriggers on backfill over footings or utility trenches'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 4, prov: osha('p', 'concrete_pumping-acpa-outriggers') },
    { id: 'truck_backing', hazard: 'Struck by a ready-mix truck backing to the pump hopper', hazard_es: PENDING_ES, controls: ['Back trucks only with a working back-up alarm or an observer signaling', 'Keep people out of the backing path and between truck and hopper'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'hopper_caught', hazard: 'Caught in the hopper agitator or concrete valve, or struck by unexpected pump movement', hazard_es: PENDING_ES, controls: ['Never stand on or reach through the hopper grate', 'Bleed the accumulator to zero and lock out and tag the pump before opening the hopper or doing repairs', 'Keep E-stops working and visible; no loose clothing at the back of the pump'], controls_es: PENDING_ES, osha_ref: '1926.702(j)(1)', severity: 4, prov: osha('q', 'concrete_pumping-acpa-hopper') },
    { id: 'fall_edge', hazard: 'Fall from a deck or slab edge while handling the hose', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest at unprotected edges 6 ft or more above a lower level', 'Walk forward with the hose, never backward toward an edge'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m', 'concrete_pumping-acpa-hose-handler') },
    { id: 'rebar_impale', hazard: 'Impalement on protruding rebar while walking the hose through the pour', hazard_es: PENDING_ES, controls: ['Cap or cover protruding vertical bars', 'Plan the hose path to avoid walking over exposed dowels'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 3, prov: osha('q') },
    { id: 'concrete_burns', hazard: 'Alkaline burns and eye injury from wet concrete splash and washwater', hazard_es: PENDING_ES, controls: ['Wear eye protection, waterproof gloves and boots; tuck pants over boot tops', 'Rinse skin and eyes right away after contact'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['safety glasses', 'waterproof gloves', 'rubber boots'], prov: osha('e', 'concrete_pumping-acpa-burns') },
    { id: 'noise', hazard: 'Hearing damage from the pump engine and hopper at the back of the truck', hazard_es: PENDING_ES, controls: ['Wear hearing protection near the running pump', 'Use radios instead of shouting'], controls_es: PENDING_ES, osha_ref: '1926.52', severity: 2, ppe: ['hearing protection'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'setup_ground_firm', phase: 'foundation', item: 'Setup spot is level, firm and compacted, with no fresh backfill, voids or buried lines under the outriggers, and clear of excavation edges.', item_es: PENDING_ES, safety: true, prov: acpa('outriggers') },
    { id: 'power_line_plan', item: 'Every overhead line within the boom’s reach is identified, the danger zone is marked, and a dedicated spotter is assigned before the boom is raised.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-o', 'concrete_pumping-acpa-electricity'], confidence: 'verified', last_verified: D } },
    { id: 'truck_route_planned', item: 'Ready-mix truck route and backing spot to the hopper agreed, with a signaler or working back-up alarms.', item_es: PENDING_ES, safety: true, prov: osha('o') },
    { id: 'washout_planned', item: 'Leak-proof washout container or lined pit placed before the pour, away from storm drains and waterways.', item_es: { status: 'translated', text: 'Contenedor de lavado a prueba de fugas o fosa forrada colocado antes del colado, lejos de drenajes pluviales y cuerpos de agua.' }, prov: epa },
    { id: 'outriggers_cribbed', item: 'Every outrigger fully extended (or short-rigged only as the manual allows) and set on cribbing pads; truck level.', item_es: PENDING_ES, safety: true, prov: acpa('outriggers') },
    { id: 'estops_tested', item: 'E-stops tested and visible before the first truck discharges; hopper grate in place.', item_es: PENDING_ES, safety: true, prov: acpa('hopper') },
    { id: 'line_inspected', item: 'Hoses, pipe and clamps inspected — no soft spots, exposed braid, thin pipe or missing gaskets; steel pipe supported at bends and vertical runs.', item_es: PENDING_ES, safety: true, prov: osha('q', 'concrete_pumping-acpa-hose-handler') },
    { id: 'startup_area_clear', item: 'Everyone out of the end-hose area at startup and after every stop; first bony material wasted at the agreed spot.', item_es: PENDING_ES, safety: true, prov: acpa('startup', 'hose-whip-2') },
    { id: 'signals_agreed', item: 'Hand signals or radio calls agreed in advance, with one signal person in the operator’s view.', item_es: PENDING_ES, safety: true, prov: acpa('hose-handler') },
    { id: 'hose_handling', item: 'End hose handled at arm’s length about 2–3 ft above the deck, walked forward, never kinked or shouldered.', item_es: PENDING_ES, safety: true, prov: acpa('hose-handler') },
    { id: 'no_segregation', item: 'Concrete at the discharge is not segregated, and slump loss through the pump stays within the spec (UFGS allows 2 in.).', item_es: { status: 'translated', text: 'El concreto en la descarga no está segregado y la pérdida de revenimiento por la bomba queda dentro de la especificación (UFGS permite 2 pulg.).' }, prov: ufgs },
    { id: 'samples_at_discharge', item: 'Where the spec requires it, test samples are taken at the discharge end as well as at the truck.', item_es: { status: 'translated', text: 'Cuando la especificación lo exige, se toman muestras de prueba en la descarga además de en el camión.' }, prov: ufgs },
    { id: 'rebar_capped', item: 'Protruding vertical bars along the hose path are capped or covered.', item_es: PENDING_ES, safety: true, prov: osha('q') },
    { id: 'clamps_depressurized', item: 'Line pressure released before any clamp is opened; accumulator bled and pump locked out before the hopper is opened.', item_es: PENDING_ES, safety: true, prov: acpa('cleanout', 'hopper') },
    { id: 'washout_contained', item: 'All hopper, chute and line washwater and solids went into the washout container — none on the ground or in a storm drain; container covered before rain.', item_es: { status: 'translated', text: 'Toda el agua y sólidos de lavado de tolva, canaletas y línea fueron al contenedor de lavado — nada en el suelo ni en drenajes pluviales; contenedor cubierto antes de la lluvia.' }, prov: epa },
  ],
  inspection_checklists: {
    pump_setup_check: [
      { item: 'Setup ground firm and compacted; outriggers on cribbing pads, clear of excavations and backfill', item_es: PENDING_ES, ref: '29 CFR 1926.651(j)(2)' },
      { item: 'Overhead lines identified, danger zone marked, dedicated spotter assigned', item_es: PENDING_ES, ref: '29 CFR 1926.600(a)(6)' },
      { item: 'Wind below the manufacturer’s limit for boom use', item_es: PENDING_ES },
      { item: 'E-stops working; hoses, pipe and clamps inspected; pipe supported', item_es: PENDING_ES, ref: '29 CFR 1926.702(e)' },
    ],
    pre_pour_check: [
      { item: 'Pumping submittal reviewed where required (mix, pump type, pipe size and material, max length and height)', item_es: { status: 'translated', text: 'Submittal de bombeo revisado cuando se exige (mezcla, tipo de bomba, tamaño y material del tubo, longitud y altura máximas)' }, ref: 'UFGS 03 30 00 1.6.3.2' },
      { item: 'Signals agreed and signal person named; truck backing route set', item_es: PENDING_ES, ref: '29 CFR 1926.601(b)(4)' },
      { item: 'Washout container in place away from storm drains', item_es: { status: 'translated', text: 'Contenedor de lavado colocado lejos de drenajes pluviales' } },
    ],
    cleanout_washout_check: [
      { item: 'Line pressure released before clamps opened; pump locked out before hopper opened', item_es: PENDING_ES, ref: '29 CFR 1926.702(j)' },
      { item: 'All washwater and solids contained; nothing to ground or storm drain', item_es: { status: 'translated', text: 'Todo el agua y los sólidos de lavado contenidos; nada al suelo ni a drenajes pluviales' } },
    ],
  },
  assemblies: [
    { code: 'G-PUMP-SETUP-EA', name: 'Concrete pump mobilization, setup and minimum charge, per pour', name_es: 'Movilización, instalación y cargo mínimo de bomba de concreto, por colado', unit: 'EA', csi: '03 30 00',
      description: 'Pump company travel/setup/minimum per pour on a per-CY billing basis. Use with G-PUMP-CY — or price EQUIP-CONCRETE_PUMP day rate instead, not both.',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 1, prov: est('contractor laborer: prep setup area, cones, spotter briefing') },
      equipment_cost_cents: { v: 45000, prov: est('typical boom-pump setup/travel minimum, national baseline 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-PUMP-CY', name: 'Concrete pumping charge, per CY placed', name_es: 'Cargo de bombeo de concreto, por yarda cúbica colocada', unit: 'CY', csi: '03 30 00',
      description: 'Per-yard pumping charge billed with the setup minimum; concrete material and placing/finishing crew are separate.',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 0, prov: est('placing crew carried in the concrete assemblies') },
      equipment_cost_cents: { v: 700, prov: est('typical per-CY boom pump charge, national baseline 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-PUMP-LINE-LF', name: 'Additional pump hose or pipeline beyond the standard run, per LF', name_es: 'Manguera o tubería de bombeo adicional más allá del tramo estándar, por pie lineal', unit: 'LF', csi: '03 30 00',
      material_cost_cents: { v: 0, prov: est('rental, no materials') }, labor_hours_per_unit: { v: 0.02, prov: est('lay out, couple, support and break down') },
      equipment_cost_cents: { v: 300, prov: est('extra hose/pipe charge per LF per pour, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-PUMP-WASHOUT-EA', name: 'Prefabricated concrete washout container, delivery, use and disposal, per pour', name_es: 'Contenedor prefabricado de lavado de concreto, entrega, uso y disposición, por colado', unit: 'EA', csi: '01 57 23',
      material_cost_cents: { v: 0, prov: est('container rental carried as equipment') }, labor_hours_per_unit: { v: 0.5, prov: est('place, cover and inspect the container') },
      equipment_cost_cents: { v: 30000, prov: est('washout container rental + haul-off/disposal per event, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
  ],
  quantity_rules: [
    { code: 'G-PUMP-SETUP-EA', assumption: 'One pump setup for the concrete scope on the plans — adjust to the number of separate pours', when: { facts_any: ['slab_on_grade', 'foundation_wall', 'concrete_footing'] }, qty: { basis: 'const' } },
    { code: 'G-PUMP-CY', assumption: '4 in. slab-on-grade volume over summed room area pumped (commercial/multifamily/industrial); add footings and walls by takeoff', when: { facts_any: ['slab_on_grade'], building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.012346, round: 'ceil' } },
    { code: 'G-PUMP-WASHOUT-EA', assumption: 'One washout container per pump setup', when: { facts_any: ['slab_on_grade', 'foundation_wall', 'concrete_footing'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['formwork', 'rebar'], note: 'Pumping follows formwork and rebar placement (and their pre-pour inspection) for each pour.' },
  ],
});
