// Trade Knowledge Pack — geotech (Geotechnical Engineering / Soils). Wave 21 — SERVICES pattern
// (permit_trade null → no gates, no code_refs, no assemblies/quantities/components). Dossier:
// docs/trade-packs/dossiers/geotech.md. Sources: FHWA GEC 5 Geotechnical Site Characterization
// (NHI-16-072); ASTM D1586 / D2487 (reference only); IBC Ch. 18 §1803 (reference only, prose);
// Wis. Admin. Code SPS 321.16 frost protection (prose); 29 CFR 1926.600(a)(6), 1926.300(b)(2),
// 1926.651(b), 1926.651(j)/(k), 1926.652(a)(1), 1926.201(a), 1926.101(a).
//
// Template note: the building-type templates carry "Survey, ... & geotechnical investigation" tasks with
// trade_type 'surveying' — those belong to the surveying pack. The recipe title_re below refuses any
// title containing "survey" so it can never claim them even if a task is re-tagged.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const gec5 = { src: ['geotech-fhwa-gec5'], confidence: 'verified' as const, last_verified: D };
const gec5d = (note?: string) => ({ src: ['geotech-fhwa-gec5'], confidence: 'derived' as const, last_verified: D, ...(note ? { note } : {}) });
const spt = { src: ['geotech-astm-d1586', 'geotech-fhwa-gec5'], confidence: 'derived' as const, last_verified: D, note: 'ASTM D1586 cited by number only; content paraphrased from GEC 5.' };
const uscs = { src: ['geotech-astm-d2487', 'geotech-fhwa-gec5'], confidence: 'derived' as const, last_verified: D, note: 'ASTM D2487 cited by number only.' };
const ibc = { src: ['icc-pa', 'geotech-fhwa-gec5'], confidence: 'derived' as const, last_verified: D, note: 'IBC 1803 (geotechnical investigations) referenced by section only; wording is our paraphrase.' };
const frost = { src: ['patio_covers_awnings-wi-sps321', 'icc-pa'], confidence: 'derived' as const, last_verified: D, note: 'WI UDC SPS 321.16 frost protection; IBC 1809.5 / IRC R403.1.4 referenced by section only.' };

export default definePack({
  key: 'geotech',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Explores and tests the ground before design — soil borings with SPT sampling, test pits, groundwater readings and lab tests — and issues a sealed geotechnical report (bearing capacity, settlement, frost depth, groundwater, earthwork and foundation recommendations). During construction it observes subgrade and footing excavations and issues bearing verification letters.',
    summary_es: 'Explora y ensaya el terreno antes del diseño (sondeos con SPT, calicatas, nivel freático y laboratorio) y emite un informe geotécnico sellado (capacidad portante, asentamientos, congelamiento, agua subterránea, recomendaciones de tierras y cimentaciones). En obra observa la subrasante y las zapatas y emite cartas de verificación de capacidad portante.',
    glossary: [
      { term: 'Soil boring', term_es: 'Perforación de suelo (sondeo)', def: 'A drilled hole (usually hollow-stem auger) advanced to sample and log soil and rock layers at a planned location and depth.', def_es: 'Agujero perforado (normalmente con barrena de vástago hueco) para muestrear y registrar las capas de suelo y roca en un punto y profundidad planificados.' },
      { term: 'Boring log', term_es: 'Registro de perforación', def: 'Record of one boring: depths, soil descriptions and classification, sample numbers, blow counts, groundwater observations and drilling notes.', def_es: 'Registro de una perforación: profundidades, descripción y clasificación del suelo, muestras, número de golpes, observaciones de agua y notas de perforación.' },
      { term: 'Standard Penetration Test (SPT, N-value)', term_es: 'Ensayo de penetración estándar (SPT, valor N)', def: 'Blows of a standard drop hammer needed to drive a split-spoon sampler 12 in. after seating; an index of density/consistency, corrected to N60 for hammer efficiency.', def_es: 'Golpes de un martillo estándar para hincar un muestreador partido 12 pulg. tras el asiento; índice de densidad o consistencia, corregido a N60 por eficiencia del martillo.' },
      { term: 'Test pit', term_es: 'Calicata', def: 'A shallow excavation dug with a backhoe or excavator to view and sample soil in place, find fill or old foundations, and check digging conditions.', def_es: 'Excavación poco profunda hecha con retroexcavadora para ver y muestrear el suelo en sitio, detectar rellenos o cimientos antiguos y evaluar la excavabilidad.' },
      { term: 'Allowable bearing pressure', term_es: 'Presión portante admisible', def: 'Soil pressure (psf) the geotechnical report recommends for sizing footings, with the settlement it expects at that pressure.', def_es: 'Presión sobre el suelo (psf) que recomienda el informe geotécnico para dimensionar zapatas, con el asentamiento esperado a esa presión.' },
      { term: 'Unified Soil Classification System (USCS)', term_es: 'Sistema Unificado de Clasificación de Suelos (SUCS)', def: 'Two-letter soil groups (e.g. CL lean clay, SP poorly graded sand) assigned from gradation and plasticity tests.', def_es: 'Grupos de suelo de dos letras (p. ej. CL arcilla magra, SP arena mal graduada) asignados por granulometría y plasticidad.' },
      { term: 'Frost depth', term_es: 'Profundidad de congelamiento', def: 'Depth to which ground freezes; footings bear below it (or are frost-protected) so frost heave cannot lift them.', def_es: 'Profundidad a la que se congela el suelo; las zapatas se apoyan por debajo (o se protegen) para que la helada no las levante.' },
      { term: 'Piezometer / monitoring well', term_es: 'Piezómetro / pozo de monitoreo', def: 'Screened pipe left in a borehole to read the stabilized groundwater level over days or seasons, not just at drilling time.', def_es: 'Tubo ranurado dejado en una perforación para medir el nivel freático estabilizado durante días o estaciones, no solo al perforar.' },
      { term: 'Bearing verification (footing observation)', term_es: 'Verificación de capacidad portante (observación de zapatas)', def: 'Field check by the geotech of exposed footing subgrade (probing, DCP or hand auger) against the report, documented in a letter or field report.', def_es: 'Comprobación en campo por el geotécnico del fondo de zapata expuesto (sondeo manual, DCP o barrena) contra el informe, documentada en carta o reporte.' },
      { term: 'Proof roll', term_es: 'Prueba de rodillo (proof roll)', def: 'Driving a loaded truck or roller over a building pad or pavement subgrade while the geotech watches for rutting or pumping that marks soft areas.', def_es: 'Pasar un camión cargado o rodillo sobre la plataforma o subrasante mientras el geotécnico observa ahuellamiento o bombeo que indica zonas blandas.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'geotech_investigation',
      when: { title_re: '^(?!.*survey).*(geotech|soil (boring|investigation|report|test)|subsurface (exploration|investigation)|test pits?|borings?)' },
      example_title: 'Geotechnical investigation — soil borings & report',
      steps: [
        {
          title: 'Desk study and exploration plan',
          instruction: 'Collect the site plan, building footprint and loads, geologic and soil-survey maps, utility maps and any prior borings. Lay out boring and test-pit locations and depths on the plan to cover the footprint, pavements and stormwater areas, and note access, traffic control and utility clearance needs.',
          tools: ['site plan', 'soil survey / geologic maps', 'boring location plan'],
          materials: [],
          safety_ids: [],
          qa_ids: ['qa_boring_layout'],
        },
        {
          title: 'Locate utilities and stake boring locations',
          instruction: 'Place the one-call (811 / Digger\'s Hotline) ticket and wait for marks, clear private utilities on the owner\'s side, then stake each boring and test pit. Measure overhead line voltage and clearance before the rig moves in; relocate any boring that cannot keep the required distance.',
          tools: ['stakes and paint', 'tape or GPS', 'utility locate ticket'],
          materials: ['marking paint', 'lath stakes'],
          safety_ids: ['buried_utility_strike', 'drill_rig_power_line'],
        },
        {
          title: 'Drill borings and take SPT samples',
          instruction: 'Advance each boring with hollow-stem augers to the planned depth, take split-spoon samples at the planned intervals, and record blows per 6 in. Log soil descriptions, color, moisture, sample recovery, auger depth and any drilling changes (loss of circulation, sudden softening, obstructions, refusal).',
          detail: 'SPT per ASTM D1586 (by reference). Record the hammer type so N can be corrected for energy (N60).',
          tools: ['truck- or ATV-mounted drill rig', 'hollow-stem augers', 'split-spoon sampler', 'SPT hammer', 'field log sheets'],
          materials: ['sample jars / bags', 'labels'],
          safety_ids: ['rotating_auger', 'drill_rig_power_line', 'rig_noise', 'roadway_traffic'],
          qa_ids: ['qa_boring_logs', 'qa_spt_n60'],
        },
        {
          title: 'Dig and log test pits',
          instruction: 'Dig test pits with a backhoe where fill, old foundations or digging conditions need to be seen. Log and sample from the surface or the bucket; nobody enters a pit 5 ft or deeper unless it is sloped, shored or shielded. Backfill and compact each pit before leaving.',
          tools: ['backhoe or excavator', 'tape', 'hand auger', 'camera'],
          materials: ['sample bags'],
          safety_ids: ['test_pit_cave_in', 'buried_utility_strike'],
          qa_ids: ['qa_test_pit_logs'],
        },
        {
          title: 'Read groundwater and close the boreholes',
          instruction: 'Record the water level at the end of drilling, after the augers are pulled and again after 24 h where the hole stays open; note caved depth. Install a piezometer where the design needs a stabilized water table. Backfill or grout each borehole per state rules and patch pavement.',
          tools: ['water level tape', 'piezometer kit'],
          materials: ['bentonite chips or grout', 'cold patch'],
          safety_ids: [],
          qa_ids: ['qa_groundwater'],
        },
        {
          title: 'Lab testing and soil classification',
          instruction: 'Assign tests to representative samples — moisture content, Atterberg limits, gradation, unit weight, unconfined strength or consolidation as the design needs — and classify each layer by USCS. Discard disturbed or unrepresentative samples instead of testing them.',
          tools: ['soils laboratory'],
          materials: [],
          safety_ids: [],
          qa_ids: ['qa_lab_results'],
        },
        {
          title: 'Issue the geotechnical report',
          instruction: 'Issue a sealed report with the boring location plan, final boring and test-pit logs, lab results, groundwater observations and recommendations: allowable bearing pressure and settlement, frost depth, seismic site class, subgrade preparation, fill and compaction, pavement subgrade, dewatering and lateral earth pressures.',
          tools: ['report template'],
          materials: [],
          safety_ids: [],
          qa_ids: ['qa_report_recommendations', 'qa_bearing_frost', 'qa_groundwater'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'test pits?|geotech' }, step_re: 'test pit', type: 'backhoe', reason: 'Dig test pits to view and sample soil in place', optional: true },
  ],
  qa_checklist: [
    { id: 'qa_boring_layout', phase: 'site_prep', item: 'Boring/test-pit plan covers the building footprint (corners and heavy-load areas), pavements and stormwater areas, with depths below the expected influence zone of the footings.', item_es: { status: 'translated', text: 'El plano de perforaciones y calicatas cubre la huella del edificio (esquinas y zonas de carga alta), pavimentos y áreas pluviales, con profundidades por debajo de la zona de influencia de las zapatas.' }, prov: ibc },
    { id: 'qa_boring_logs', phase: 'site_prep', item: 'Final boring logs show depth, USCS classification, description, sample numbers, blows per 6 in., auger/casing depth and drilling observations for every boring on the plan.', item_es: { status: 'translated', text: 'Los registros finales muestran profundidad, clasificación SUCS, descripción, número de muestra, golpes cada 6 pulg., profundidad de barrena y observaciones de perforación para cada sondeo del plano.' }, prov: uscs },
    { id: 'qa_spt_n60', phase: 'site_prep', item: 'Hammer type and energy are stated so SPT N values are corrected to N60 before they are used in design.', item_es: { status: 'translated', text: 'Se indica el tipo y energía del martillo para corregir los valores N del SPT a N60 antes de usarlos en el diseño.' }, prov: spt },
    { id: 'qa_test_pit_logs', phase: 'site_prep', item: 'Test-pit logs record depth, soils, fill or debris, old foundations, water seepage and caving, with photos keyed to the pit number.', item_es: { status: 'translated', text: 'Los registros de calicatas anotan profundidad, suelos, relleno o escombros, cimientos antiguos, filtraciones y derrumbes, con fotos vinculadas al número de calicata.' }, prov: gec5d() },
    { id: 'qa_groundwater', phase: 'site_prep', item: 'Groundwater readings are reported with timing (end of drilling, after auger removal, 24 h) and caved depth, and the report states whether a stabilized level from a piezometer is available.', item_es: { status: 'translated', text: 'Las lecturas de agua subterránea se informan con su momento (fin de perforación, tras retirar la barrena, 24 h) y la profundidad de derrumbe, y el informe indica si hay un nivel estabilizado con piezómetro.' }, prov: gec5 },
    { id: 'qa_lab_results', phase: 'site_prep', item: 'Lab results (moisture, Atterberg limits, gradation, strength or consolidation) are tabulated against sample number and depth and match the classification on the logs.', item_es: { status: 'translated', text: 'Los resultados de laboratorio (humedad, límites de Atterberg, granulometría, resistencia o consolidación) se tabulan por muestra y profundidad y coinciden con la clasificación de los registros.' }, prov: gec5 },
    { id: 'qa_report_recommendations', phase: 'site_prep', item: 'Report is sealed by a licensed engineer and gives recommendations the designers can use: foundation type, subgrade preparation, fill and compaction criteria, pavement subgrade and seismic site class.', item_es: { status: 'translated', text: 'El informe está sellado por un ingeniero colegiado y da recomendaciones utilizables: tipo de cimentación, preparación de subrasante, criterios de relleno y compactación, subrasante de pavimentos y clase de sitio sísmico.' }, prov: ibc },
    { id: 'qa_bearing_frost', phase: 'site_prep', item: 'Report states allowable bearing pressure with expected total and differential settlement, and the minimum footing depth for frost (48 in. under the WI UDC unless the local frost depth is deeper).', item_es: { status: 'translated', text: 'El informe indica la presión portante admisible con asentamiento total y diferencial esperado, y la profundidad mínima de zapata por congelamiento (48 pulg. según el UDC de WI salvo que la local sea mayor).' }, prov: frost },
    { id: 'qa_bearing_verification_letter', phase: 'foundation', item: 'Each footing excavation is observed before concrete and a field report or letter confirms the subgrade meets the report bearing pressure, or lists the over-excavation and replacement required.', item_es: { status: 'translated', text: 'Cada excavación de zapata se observa antes del concreto y un reporte o carta confirma que la subrasante cumple la presión portante del informe, o indica la sobreexcavación y reemplazo necesarios.' }, prov: ibc },
    { id: 'qa_proof_roll', phase: 'site_prep', item: 'Building pad and pavement subgrade are proof-rolled with the geotech present; soft or pumping areas are mapped, corrected and re-rolled before fill or base is placed.', item_es: { status: 'translated', text: 'La plataforma y la subrasante de pavimentos se prueban con rodillo en presencia del geotécnico; las zonas blandas se marcan, corrigen y vuelven a probar antes de colocar relleno o base.' }, prov: gec5d('Proof rolling as a subgrade-acceptance practice; paraphrased.') },
  ],
  hazards: [
    { id: 'drill_rig_power_line', hazard: 'Raised drill mast contacting or arcing to overhead power lines while drilling or moving between borings', hazard_es: PENDING_ES, controls: ['Keep at least 10 ft from lines rated 50 kV or below (more for higher voltage) unless the line is de-energized and grounded', 'Lower the mast before moving the rig', 'Assign a spotter when working near lines'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(6)', severity: 4, prov: osha('o') },
    { id: 'rotating_auger', hazard: 'Entanglement in rotating augers, drive head or cathead rope', hazard_es: PENDING_ES, controls: ['Guard exposed rotating parts', 'No loose clothing, gloves near rotating flights, or jewelry', 'Test the emergency kill switch daily and stop rotation before cleaning augers'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 4, prov: osha('i') },
    { id: 'buried_utility_strike', hazard: 'Auger or backhoe striking a buried electric, gas or water line', hazard_es: PENDING_ES, controls: ['Call 811 and wait for marks before drilling or digging', 'Clear private utilities', 'Hand-dig or vacuum near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'test_pit_cave_in', hazard: 'Cave-in of a test pit wall onto a person entering to log or sample', hazard_es: PENDING_ES, controls: ['Log and sample from the surface or the bucket', 'No entry at 5 ft or deeper without sloping, shoring or a shield', 'Keep spoil at least 2 ft back from the edge'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'rig_noise', hazard: 'Hearing damage from the drill engine and SPT hammer', hazard_es: PENDING_ES, controls: ['Wear hearing protection at the rig', 'Limit time next to the hammer'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('e') },
    { id: 'roadway_traffic', hazard: 'Being struck by traffic while drilling borings in or next to a roadway or parking lot', hazard_es: PENDING_ES, controls: ['Set up a work-zone traffic control plan', 'Use flaggers trained to the MUTCD where traffic must be controlled', 'Wear high-visibility garments'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 3, ppe: ['high-visibility vest'], prov: osha('g') },
  ],
  inspection_checklists: {
    footing_bearing_verification: [
      { item: 'Footing bottoms are on undisturbed native soil or approved compacted fill, free of loose soil, frost, water and organics.', item_es: { status: 'translated', text: 'El fondo de las zapatas está sobre suelo natural sin alterar o relleno compactado aprobado, sin suelo suelto, helada, agua ni materia orgánica.' }, ref: 'IBC 1803 (ref)' },
      { item: 'Soil exposed matches the boring logs; probe, hand auger or DCP results meet the report bearing pressure.', item_es: { status: 'translated', text: 'El suelo expuesto coincide con los registros; el sondeo manual, barrena o DCP cumplen la presión portante del informe.' }, ref: 'Geotech report' },
      { item: 'Footing depth meets the frost depth stated in the report.', item_es: { status: 'translated', text: 'La profundidad de la zapata cumple la profundidad de congelamiento del informe.' }, ref: 'WI SPS 321.16' },
      { item: 'Soft areas over-excavated and replaced as directed; observation documented in a field report or letter.', item_es: { status: 'translated', text: 'Las zonas blandas se sobreexcavaron y reemplazaron según lo indicado; la observación consta en un reporte o carta.' } },
    ],
  },
  dependency_hints: [
    { before_phase: 'foundation', note: 'The geotechnical report must be issued before foundation design is final, and footing bearing verification happens before each footing pour.' },
  ],
});
