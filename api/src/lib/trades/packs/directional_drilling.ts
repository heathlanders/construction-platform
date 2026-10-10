// Trade Knowledge Pack — directional_drilling (Horizontal Directional Drilling / Boring). Wave 20 —
// NEW-TRADE pattern, heavy_civil, permit_trade null → no gating inspections and no code refs; owner / DOT /
// environmental hold points live in inspection_checklists. Dossier: docs/trade-packs/dossiers/directional_drilling.md.
// Sources: FDOT Standard Specifications FY 2025-26 Sections 555 Directional Bore + 556 Jack and Bore (execution,
// tracking, reamer sizing, fluids, bore path report, auger boring controls); FERC 2019 HDD monitoring / inadvertent
// return guidance + Ohio EPA 2023 HDD contingency plan guidance (frac-out); WisDOT 671 Conduit HDPE Directional
// Bore + WisDOT Average Unit Price List (671.0212 for the small-rig bore cost); 29 CFR 1926 Subparts E, H, I, K, O, P.
// Gravity sewer laterals (CIPP / pipe bursting) are the trenchless_sewer pack (P-TS-*); microtunneling is tunneling.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const fdot = { src: ['directional_drilling-fdot-ss-555-556'], confidence: 'verified' as const, last_verified: D };
const ferc = { src: ['directional_drilling-ferc-hdd-2019'], confidence: 'verified' as const, last_verified: D };
const ohio = { src: ['directional_drilling-ohioepa-hdd-2023'], confidence: 'verified' as const, last_verified: D };
const wis = { src: ['directional_drilling-wisdot-ss-671'], confidence: 'verified' as const, last_verified: D };
const aup = (note: string) => ({ src: ['excavation-wisdot-aup'], confidence: 'derived' as const, last_verified: D, note });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'directional_drilling',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs pipe, conduit and casing under roads, rail, waterways and yards without an open trench — horizontal directional drilling (steered pilot bore, back ream, pullback) and auger jack-and-bore of steel casing — with utility potholing, a tracked bore profile, drilling-fluid and frac-out control, and a bore log / as-built for the owner.',
    summary_es: 'Instala tubería, ducto y camisa bajo calles, vías férreas, cuerpos de agua y patios sin zanja abierta — perforación direccional (piloto guiado, ensanche y jalado) y perforación con barrena e hincado de camisa de acero — con sondeos de servicios, perfil rastreado, control de lodo y retornos, y registro de perforación para el dueño.',
    glossary: [
      { term: 'Pilot bore', term_es: 'Perforación piloto', def: 'First small steered hole drilled along the planned path from the entry pit to the exit point.', def_es: 'Primer agujero pequeño y guiado, perforado por la ruta planeada desde la fosa de entrada hasta el punto de salida.' },
      { term: 'Back ream', term_es: 'Ensanchado (retro-rimado)', def: 'Pulling a larger cutter back through the pilot hole to open it up to the size the pipe needs.', def_es: 'Jalar un cortador más grande de regreso por el agujero piloto para agrandarlo al tamaño que necesita la tubería.' },
      { term: 'Pullback', term_es: 'Jalado de tubería', def: 'Pulling the pipe or conduit string into the reamed hole behind the reamer and swivel.', def_es: 'Jalar la tubería o el ducto dentro del agujero ensanchado detrás del rimador y el destorcedor.' },
      { term: 'Inadvertent return (frac-out)', term_es: 'Retorno inadvertido (fuga de lodo)', def: 'Drilling fluid escaping to the surface, a waterway or a basement somewhere other than the entry or exit pit.', def_es: 'Lodo de perforación que sale a la superficie, a un cuerpo de agua o a un sótano en un lugar distinto a las fosas de entrada o salida.' },
      { term: 'Drilling fluid (mud)', term_es: 'Fluido de perforación (lodo)', def: 'Bentonite clay and water pumped down the drill string to carry cuttings out, hold the hole open and cool the bit.', def_es: 'Bentonita y agua bombeadas por la sarta para sacar los recortes, sostener el agujero y enfriar la broca.' },
      { term: 'Walkover locator / sonde', term_es: 'Localizador de superficie / sonda', def: 'Transmitter behind the bit and the hand receiver that reads its depth, pitch and clock position from above.', def_es: 'Transmisor detrás de la broca y receptor de mano que lee su profundidad, inclinación y posición de reloj desde arriba.' },
      { term: 'Pothole (test hole)', term_es: 'Sondeo (cala de verificación)', def: 'Small hole dug with vacuum excavation to see an existing utility’s exact depth before boring near it.', def_es: 'Pequeño hoyo excavado con aspiradora para ver la profundidad exacta de un servicio antes de perforar cerca de él.' },
      { term: 'Jack and bore (auger boring)', term_es: 'Hincado con barrena (auger boring)', def: 'Steel casing pushed by jacks from a pit while augers inside it cut and carry out the soil.', def_es: 'Camisa de acero empujada con gatos desde una fosa mientras las barrenas dentro de ella cortan y sacan el suelo.' },
      { term: 'Strike alert (electric strike system)', term_es: 'Alarma de contacto eléctrico', def: 'Rig system that sounds an alarm if the drill string touches an energized cable.', def_es: 'Sistema del equipo que suena una alarma si la sarta toca un cable energizado.' },
      { term: 'Bore log / bore path report', term_es: 'Registro de perforación', def: 'Record of depth and position readings along the bore used to draw the as-built profile.', def_es: 'Registro de lecturas de profundidad y posición a lo largo de la perforación usado para dibujar el perfil final.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'hdd_bore',
      example_title: 'Directional bore 2 in. HDPE conduit under highway',
      priority: 10,
      when: { title_re: '\\b(?:directional(?:ly)?[- ](?:bor\\w*|drill\\w*)|hdd|horizontal directional|directional crossing|bore (?:and|&) pull|pull ?back)\\b' },
      steps: [
        {
          title: 'Locate and pothole every utility on the bore path',
          instruction: 'Call 811 and wait for marks along the full bore path plus the entry and exit areas. Vacuum-excavate a pothole at every marked utility the bore crosses or parallels closely, and record its depth and size. Confirm the planned clearance on the bore plan before drilling.',
          tools: ['vacuum excavator', 'probe rod', 'tape measure', 'marking paint'],
          materials: ['bore plan and profile', 'utility locate ticket', 'pothole log forms'],
          safety_ids: ['utility_strike', 'electric_strike', 'backing_equipment'],
          qa_ids: ['locates_potholes', 'bore_plan_approved'],
        },
        {
          title: 'Set up the rig, pits and fluid containment',
          instruction: 'Dig the entry and exit pits big enough to hold the expected fluid returns, with shoring or sloping where workers go in. Anchor the rig at the design entry angle, set the ground mats and strike-alert system, and stage the frac-out kit (pumps, hay bales, silt fence, sandbags, vac truck) at both ends. Mix bentonite with clean water to the planned properties.',
          tools: ['HDD rig with ground mats and strike alert', 'fluid mixing system', 'excavator', 'pH strips and marsh funnel'],
          materials: ['bentonite and approved additives with safety data sheets', 'potable water', 'frac-out containment kit'],
          safety_ids: ['pit_cave_in', 'pit_egress', 'electric_strike', 'power_line_overhead'],
          qa_ids: ['contingency_plan_on_site', 'fluid_properties'],
        },
        {
          title: 'Drill and track the pilot bore',
          instruction: 'Calibrate the locator, then drill the pilot along the plan, taking depth, pitch and position readings at least at every correction and no more than 100 ft apart. Watch fluid pressure and returns at the entry pit the whole time. Stop and correct before the bit drifts outside the allowed clearance from any utility.',
          detail: 'If returns drop off or pressure spikes, stop pumping and walk the bore path for frac-out before continuing.',
          tools: ['walkover locator or wire-line steering tool', 'annular pressure gauge'],
          materials: ['bore log sheet'],
          safety_ids: ['utility_strike', 'electric_strike', 'rotating_string', 'high_pressure_fluid'],
          qa_ids: ['tracking_readings', 'returns_monitored'],
        },
        {
          title: 'Back ream and watch for frac-out',
          instruction: 'Ream in passes sized for the product (no bigger than the spec limit over the pipe OD). Keep the drill pipe in the hole between passes. Monitor fluid rate, pressure and returns, walk the bore line at the frequency in the contingency plan, and contain and report any inadvertent return right away.',
          tools: ['reamer sized for the product', 'trash pump', 'vac truck'],
          materials: ['drilling fluid', 'containment materials'],
          safety_ids: ['rotating_string', 'high_pressure_fluid', 'frac_out'],
          qa_ids: ['reamer_size', 'returns_monitored', 'frac_out_response'],
        },
        {
          title: 'Pull back the product and record the pull',
          instruction: 'Fuse or join the product string on rollers, then pull it in behind the reamer and a swivel the same day the hole is opened. Keep the pull speed steady and log pullback force; do not exceed the pipe’s safe pull load. Pull in the tracer wires or pull tape with the product.',
          detail: 'Stay clear of the string and pulling head while it moves.',
          tools: ['swivel and pulling head', 'pipe rollers', 'fusion machine'],
          materials: ['HDPE pipe or conduit to spec', 'tracer wire or pull tape'],
          safety_ids: ['rotating_string', 'pullback_load', 'backing_equipment'],
          qa_ids: ['pullback_log', 'tracer_continuity'],
        },
        {
          title: 'Clean up, test and turn in the bore log',
          instruction: 'Haul off excess mud and cuttings to an approved place, backfill the pits and restore the site within 48 hours. Test the product as the owner requires (mandrel, pressure or joint test) and check tracer continuity. Give the engineer the bore path report and as-built profile.',
          tools: ['vac truck', 'dump truck', 'proving mandrel or test pump'],
          materials: ['as-built profile', 'disposal tickets'],
          safety_ids: ['pit_cave_in', 'backing_equipment'],
          qa_ids: ['product_test', 'bore_report'],
        },
      ],
    },
    {
      id: 'jack_and_bore',
      example_title: 'Jack and bore 24 in. steel casing under railroad',
      priority: 10,
      when: { title_re: '\\b(?:jack(?:ed|ing)?[- ](?:and|&)[- ]bor\\w*|auger bor\\w*|bored? (?:steel )?casing|casing pipe|bore pit)\\b' },
      steps: [
        {
          title: 'Locate utilities and build the bore pit',
          instruction: 'Get 811 marks and pothole utilities near the crossing. Dig the bore (jacking) pit and receiving pit to the design depth with a protective system, ladder access and spoil kept back from the edge. Plan groundwater control if the boring report shows water.',
          tools: ['excavator', 'trench box or shoring', 'vacuum excavator', 'dewatering pump'],
          materials: ['crossing plan and profile', 'utility locate ticket'],
          safety_ids: ['utility_strike', 'pit_cave_in', 'pit_egress'],
          qa_ids: ['locates_potholes', 'bore_plan_approved'],
        },
        {
          title: 'Set the track at line and grade',
          instruction: 'Set the boring machine track on a firm base at the design line and grade and brace the thrust block. Check the first casing joint with an instrument before starting.',
          tools: ['auger boring machine and track', 'transit or laser', 'water level'],
          materials: ['thrust block timbers or concrete'],
          safety_ids: ['pit_cave_in', 'rotating_string'],
          qa_ids: ['line_grade_checks'],
        },
        {
          title: 'Bore and jack the casing',
          instruction: 'Advance the casing with the cutting head no more than the allowed lead ahead of it (pull it back inside the casing in loose sand). Check line and grade at the set interval, lubricate the outside with bentonite, and log spoil removed against casing advanced to catch voids. Weld each joint full around to the casing thickness.',
          detail: 'Never stand between the jacks and the casing or reach near turning augers.',
          tools: ['auger boring machine', 'welder', 'transit or water level'],
          materials: ['steel casing pipe to spec (at least 6 in. over carrier OD)', 'bentonite lubricant', 'welding rod'],
          safety_ids: ['rotating_string', 'high_pressure_fluid', 'pit_cave_in'],
          qa_ids: ['line_grade_checks', 'spoil_volume_log', 'casing_welds'],
        },
        {
          title: 'Install the carrier and close out',
          instruction: 'Pull the carrier pipe in on spacers, seal the casing ends as specified, and fill or grout any voids the spoil log shows. Backfill the pits, restore the surface and give the engineer the line-and-grade log and as-built.',
          tools: ['excavator', 'grout pump'],
          materials: ['carrier pipe', 'casing spacers', 'end seals', 'void-fill grout'],
          safety_ids: ['pullback_load', 'backing_equipment', 'pit_cave_in'],
          qa_ids: ['spoil_volume_log', 'bore_report'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'directional|hdd|pull ?back|bore (?:and|&) pull' }, step_re: 'pits|clean up', type: 'excavator', reason: 'Dig and backfill the entry and exit pits and handle the product string' },
    { when: { title_re: 'directional|hdd|pull ?back|bore (?:and|&) pull' }, step_re: 'set up the rig', type: 'generator', reason: 'Power the mud mixing and recycling system where no site power is available', optional: true },
    { when: { title_re: 'directional|hdd|pull ?back|bore (?:and|&) pull' }, step_re: 'clean up', type: 'dump_truck', reason: 'Haul spoil and solidified cuttings to an approved disposal site' },
    { when: { title_re: 'jack|auger bor|casing|bore pit' }, step_re: 'bore pit|close out', type: 'excavator', reason: 'Dig the jacking and receiving pits and lower casing joints onto the track' },
    { when: { title_re: 'jack|auger bor|casing|bore pit' }, step_re: 'jack the casing', type: 'welder', reason: 'Full-penetration welds on each steel casing joint' },
    { when: { title_re: 'jack|auger bor|casing|bore pit' }, step_re: 'close out', type: 'dump_truck', reason: 'Haul auger spoil and bring pit backfill', optional: true },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Drill bit, reamer or auger hitting a buried gas, water, sewer or fiber line', hazard_es: PENDING_ES, controls: ['Get 811 locates for the whole bore path and both pits', 'Pothole every utility the bore crosses and confirm its depth before drilling near it', 'Track the bit at every correction and keep the planned clearance', 'If gas is hit, shut down, evacuate upwind and call 911 and the utility'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(3)', severity: 4, prov: osha('p') },
    { id: 'electric_strike', hazard: 'Electrocution when the drill string contacts a buried energized cable and the rig and ground around it become live', hazard_es: PENDING_ES, controls: ['Set equipotential ground mats and the rig ground rod; test the strike-alert system before drilling', 'Crew stays on the mats or in the operator station; nobody steps on or off during a strike alarm', 'On an alarm, stop, keep everyone in place and call the utility to de-energize', 'Have the power owner locate and pothole electric lines before boring'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, ppe: ['electrical-hazard rated boots', 'insulated gloves for rod handling'], prov: osha('k') },
    { id: 'power_line_overhead', hazard: 'Excavator boom, pipe handler or rig mast contacting overhead power lines at the entry or exit site', hazard_es: PENDING_ES, controls: ['Check for overhead lines when laying out pits and pipe string', 'Keep booms and masts the required distance from lines', 'Use a dedicated spotter near lines'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(6)', severity: 4, prov: osha('o') },
    { id: 'pit_cave_in', hazard: 'Cave-in of an entry, exit or jacking pit while workers are inside', hazard_es: PENDING_ES, controls: ['Slope, bench, shore or box any pit a worker enters 5 ft or deeper', 'Competent person inspects pits daily and after rain or vibration', 'Keep spoil, pipe and the rig back from the pit edge'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'pit_egress', hazard: 'Workers trapped in a deep bore pit with no quick way out during a strike or flooding', hazard_es: PENDING_ES, controls: ['Ladder or ramp in every pit 4 ft or deeper within 25 ft of workers', 'Keep the ladder clear of hoses and pipe'], controls_es: PENDING_ES, osha_ref: '1926.651(c)(2)', severity: 3, prov: osha('p') },
    { id: 'rotating_string', hazard: 'Caught in the rotating drill string, wrench/vise jaws, augers or tool joints', hazard_es: PENDING_ES, controls: ['Keep guards and rig interlocks in place and working', 'Nobody near the rod, vise or auger while it turns; make up and break out only from the operator controls', 'Lock out the rig before changing tooling at the bit or reamer'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 4, ppe: ['close-fitting clothing', 'gloves'], prov: osha('i') },
    { id: 'high_pressure_fluid', hazard: 'Injection or whipping injury from high-pressure mud lines and hydraulic hoses', hazard_es: PENDING_ES, controls: ['Use hoses and fittings rated above the pump and hydraulic pressure, with whip checks', 'Bleed off pressure before opening any line or changing a bit', 'Never check for leaks with a hand'], controls_es: PENDING_ES, osha_ref: '1926.302(d)(2)', severity: 3, ppe: ['safety glasses or face shield', 'gloves'], prov: osha('i') },
    { id: 'frac_out', hazard: 'Slip and exposure while containing drilling fluid surfacing in roads, yards or water', hazard_es: PENDING_ES, controls: ['Stage the containment kit before drilling and know the response plan', 'Set traffic control before working an inadvertent return in a roadway', 'Use pumps or a vac truck instead of entering mud-filled holes'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 2, ppe: ['waterproof boots', 'high-visibility vest'], prov: osha('c') },
    { id: 'pullback_load', hazard: 'Pipe string, pulling head or rigging failing under pull load and lashing back', hazard_es: PENDING_ES, controls: ['Use rigging, swivels and pulling heads with marked ratings above the planned pull', 'Keep people out of the line of pull and away from rollers while the string moves', 'Never exceed the rated load of the gear'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(2)', severity: 3, prov: osha('h') },
    { id: 'backing_equipment', hazard: 'Struck by vac trucks, excavators and pipe trucks backing around the drill site', hazard_es: PENDING_ES, controls: ['Working reverse alarms on all equipment', 'Use a spotter where the rear view is blocked', 'High-visibility clothing for everyone on foot'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 3, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'noise', hazard: 'Hearing damage from the rig engine, mud pumps and vac truck', hazard_es: PENDING_ES, controls: ['Wear hearing protection near the rig and pumps', 'Rotate workers away from the loudest equipment'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'bore_plan_approved', item: 'Bore plan and profile (entry/exit points, depth, bend radius, clearance to each utility, product size) approved by the owner or engineer; 48 h notice given before starting', item_es: tr('Plan y perfil de perforación (puntos de entrada/salida, profundidad, radio de curvatura, separación a cada servicio, tamaño del producto) aprobados por el dueño o ingeniero; aviso de 48 h antes de empezar'), prov: fdot },
    { id: 'locates_potholes', item: '811 locate ticket valid for the whole bore path; every crossed utility potholed and its depth recorded on the plan', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'contingency_plan_on_site', item: 'Frac-out (inadvertent return) contingency plan on site; response equipment staged at entry and exit; crew trained on it', item_es: tr('Plan de contingencia de retorno inadvertido en obra; equipo de respuesta en entrada y salida; cuadrilla capacitada'), prov: ferc },
    { id: 'fluid_properties', item: 'Drilling fluid mixed from bentonite and clean water (pH 6 or higher); only approved additives with safety data sheets; weight, viscosity, sand content and pH logged', item_es: tr('Lodo preparado con bentonita y agua limpia (pH 6 o mayor); solo aditivos aprobados con hojas de seguridad; peso, viscosidad, contenido de arena y pH registrados'), prov: fdot },
    { id: 'tracking_readings', item: 'Locator calibrated; depth, pitch, clock and position recorded at every correction and at least every 100 ft (minimum three points)', item_es: tr('Localizador calibrado; profundidad, inclinación, reloj y posición registrados en cada corrección y por lo menos cada 100 pies (mínimo tres puntos)'), prov: fdot },
    { id: 'returns_monitored', item: 'Fluid pressure, flow and returns logged each shift; on significant loss of returns drilling stopped and the bore path walked', item_es: tr('Presión, caudal y retornos de lodo registrados en cada turno; ante pérdida importante de retornos se detuvo la perforación y se recorrió la ruta'), prov: ferc },
    { id: 'frac_out_response', item: 'Any inadvertent return contained, cleaned up and documented (date, time, location, volume, photos) and reported as the permit requires', item_es: tr('Todo retorno inadvertido contenido, limpiado y documentado (fecha, hora, ubicación, volumen, fotos) e informado según el permiso'), prov: ohio },
    { id: 'reamer_size', item: 'Final reamer no larger than spec over product OD (e.g. OD + 4 in. under 8 in.; 1.5 × OD for 8–24 in.; OD + 12 in. over 24 in.)', item_es: tr('Rimador final no mayor que lo especificado sobre el diámetro del producto (p. ej. DE + 4 pulg. bajo 8 pulg.; 1.5 × DE de 8 a 24 pulg.; DE + 12 pulg. sobre 24 pulg.)'), prov: fdot },
    { id: 'pullback_log', item: 'Product pulled in the same day the hole was opened; pullback force logged and kept under the pipe’s safe pull load', item_es: tr('Producto jalado el mismo día en que se abrió el agujero; fuerza de jalado registrada y por debajo de la carga segura de la tubería'), prov: est('Safe pull load comes from the pipe manufacturer; the same-day rule is FDOT 555-4.1') },
    { id: 'tracer_continuity', item: 'Tracer wire or pull tape installed with every duct; tracer extends past both ends and is tested for continuity', item_es: tr('Cable trazador o cinta de jalado instalado con cada ducto; el trazador sobresale en ambos extremos y se probó su continuidad'), prov: wis },
    { id: 'product_test', item: 'Product tested as the owner requires (pressure, mandrel or joint test); excess fluid and spoil hauled to an approved site and pits restored within 48 h', item_es: tr('Producto probado según el dueño (presión, mandril o juntas); lodo y material sobrante llevados a un sitio aprobado y fosas restauradas en 48 h'), prov: fdot },
    { id: 'line_grade_checks', item: 'Jack-and-bore line and grade checked at the set interval; cutting head kept within the allowed lead (≤1/3 casing diameter, ≤8 in. in stable clay)', item_es: tr('Línea y pendiente del hincado revisadas en el intervalo fijado; cabeza de corte dentro del adelanto permitido (≤1/3 del diámetro, ≤8 pulg. en arcilla estable)'), prov: fdot },
    { id: 'spoil_volume_log', item: 'Spoil volume logged against casing advanced; voids it shows (and any failed bore) filled with flowable fill or grout as the engineer directs', item_es: tr('Volumen extraído registrado contra el avance de la camisa; los vacíos que muestre (y toda perforación fallida) rellenos con relleno fluido o lechada según el ingeniero'), prov: fdot },
    { id: 'casing_welds', item: 'Steel casing at least 6 in. larger than the carrier OD; joints welded full around to casing thickness (AWS D1.1)', item_es: tr('Camisa de acero por lo menos 6 pulg. mayor que el diámetro del portador; juntas soldadas en todo el perímetro al espesor de la camisa (AWS D1.1)'), prov: fdot },
    { id: 'bore_report', item: 'Bore path report within 7 days and as-built plan and profile (successful and failed bores, ±1 in. at ends) within 30 days', item_es: tr('Informe de perforación en 7 días y plano y perfil finales (perforaciones exitosas y fallidas, ±1 pulg. en extremos) en 30 días'), prov: fdot },
  ],
  inspection_checklists: {
    utility_potholing_and_locates: [
      { item: 'Locate ticket number and marks cover the full bore path, both pits and the pipe string layout', item_es: tr('Número de ticket de localización y marcas cubren toda la ruta, ambas fosas y el área de la sarta de tubería') },
      { item: 'Each crossed utility exposed by vacuum pothole; depth, size and material recorded on the plan', item_es: tr('Cada servicio cruzado expuesto con sondeo por aspiración; profundidad, tamaño y material anotados en el plano') },
      { item: 'Gas mains 100 psi or more, or 12 in. or larger, exposed for the utility owner to see before crossing', item_es: tr('Gasoductos de 100 psi o más, o de 12 pulg. o mayores, expuestos para que el dueño los vea antes de cruzar'), ref: 'WisDOT 671.3' },
    ],
    bore_plan_and_profile_approval: [
      { item: 'Plan and profile show entry/exit points, design depth, bend radius and clearance to every utility and structure', item_es: tr('El plano y perfil muestran entrada/salida, profundidad de diseño, radio de curvatura y separación a cada servicio y estructura') },
      { item: 'Tracking method, reamer size and drilling fluid mix submitted and accepted', item_es: tr('Método de rastreo, tamaño del rimador y mezcla de lodo presentados y aceptados'), ref: 'FDOT 555-3' },
      { item: 'Engineer notified 48 h ahead and present at the start of drilling', item_es: tr('Ingeniero avisado con 48 h y presente al iniciar la perforación'), ref: 'FDOT 555-3.1' },
    ],
    drilling_fluid_and_frac_out_contingency: [
      { item: 'Contingency plan on site with response contacts and agency notification steps', item_es: tr('Plan de contingencia en obra con contactos de respuesta y pasos de aviso a las autoridades') },
      { item: 'Containment and recovery equipment staged at both ends and between them near sensitive areas', item_es: tr('Equipo de contención y recuperación ubicado en ambos extremos y en medio cerca de zonas sensibles') },
      { item: 'Shift logs show fluid pressure, losses, returns and drill-path walks; any loss or inadvertent return documented and reported', item_es: tr('Registros de turno muestran presión, pérdidas, retornos y recorridos de la ruta; toda pérdida o retorno documentado e informado') },
      { item: 'Fluid and cuttings disposal location approved; disposal tickets kept', item_es: tr('Sitio de disposición de lodo y recortes aprobado; comprobantes guardados') },
    ],
    pullback_tension_log: [
      { item: 'Product string joined and inspected on rollers before pullback; swivel and pulling head rated for the planned load', item_es: tr('Sarta de producto unida e inspeccionada sobre rodillos antes del jalado; destorcedor y cabeza de jalado con capacidad para la carga prevista') },
      { item: 'Pullback force recorded through the pull and below the manufacturer’s safe pull load', item_es: tr('Fuerza de jalado registrada durante todo el jalado y por debajo de la carga segura del fabricante') },
      { item: 'Product inspected at the exit for gouges or damage; test performed if damage is suspected', item_es: tr('Producto revisado en la salida por raspaduras o daños; prueba realizada si se sospecha daño') },
    ],
    as_built_bore_log: [
      { item: 'Bore path report: location, collector, detection method, elevations and offsets at every correction (≤100 ft apart)', item_es: tr('Informe de perforación: ubicación, responsable, método de detección, cotas y desplazamientos en cada corrección (≤100 pies)'), ref: 'FDOT 555-5.1' },
      { item: 'As-built plan and profile shows each installed and failed bore, utilities met, final bore diameter and fluid composition', item_es: tr('Plano y perfil final muestran cada perforación instalada y fallida, servicios encontrados, diámetro final y composición del lodo'), ref: 'FDOT 555-5.2' },
    ],
  },
  assemblies: [
    { code: 'HC-HDD-SM-2IN-LF', name: 'Small-rig directional bore with one 2 in. HDPE duct, per LF', name_es: 'Perforación direccional con equipo pequeño y un ducto HDPE de 2 pulg., por pie lineal', unit: 'LF', csi: '33 05 07.23',
      material_cost_cents: { v: 150, prov: est('2 in. HDPE SDR 11 duct with pull tape ≈$1.50/LF delivered, national baseline 2026') },
      labor_hours_per_unit: { v: 0.07, prov: aup('WisDOT 671.0212 Conduit HDPE Directional Bore 1-Duct 2-Inch avg $22.00/$24.35/$32.13 per LF (FY23/24/25) ≈ $26/LF installed; 3-person crew ≈ 350 LF/day → 0.07 hr/LF.') },
      equipment_cost_cents: { v: 1700, prov: aup('Remainder of the ≈$26/LF WisDOT 671.0212 average: small rig, mixing system and vac trailer ≈$6,000/day ÷ ≈350 LF/day. Pits and potholes priced separately here.') },
      waste_pct: { v: 5, prov: est('Duct tails left at each end and cut-offs') } },
    { code: 'HC-HDD-MD-6IN-LF', name: 'Mid-size rig directional bore with 6 in. HDPE DR 11 pipe (ream + pullback), per LF', name_es: 'Perforación direccional con equipo mediano y tubería HDPE DR 11 de 6 pulg. (ensanche y jalado), por pie lineal', unit: 'LF', csi: '33 05 07.23',
      material_cost_cents: { v: 950, prov: est('6 in. HDPE DR 11 pipe ≈$9.50/LF delivered, national baseline 2026') },
      labor_hours_per_unit: { v: 0.25, prov: est('4-person crew ≈ 130 LF/day of finished bore incl. pilot, one ream pass, fusion and pullback') },
      equipment_cost_cents: { v: 4500, prov: est('Mid-size rig, mud recycler, vac truck and fusion machine ≈$5,800/day ÷ ≈130 LF/day') },
      waste_pct: { v: 5, prov: est('Pipe pulled past the exit and cut off') } },
    { code: 'HC-HDD-JB-24IN-LF', name: 'Auger jack-and-bore of 24 in. steel casing, per LF', name_es: 'Hincado con barrena de camisa de acero de 24 pulg., por pie lineal', unit: 'LF', csi: '33 05 07.13',
      material_cost_cents: { v: 9500, prov: est('24 in. × 0.375 in. wall steel casing ≈$95/LF delivered, national baseline 2026') },
      labor_hours_per_unit: { v: 0.9, prov: est('4-person boring crew ≈ 35 LF/day incl. joint welding and line-and-grade checks; pits priced separately') },
      equipment_cost_cents: { v: 12000, prov: est('Auger boring machine, augers, welder and excavator ≈$4,200/day ÷ ≈35 LF/day') },
      waste_pct: { v: 3, prov: est('Casing cut-offs at the pits') } },
    { code: 'HC-HDD-POTHOLE-EA', name: 'Utility pothole by vacuum excavation to 6 ft, backfill and restore, each', name_es: 'Sondeo de servicio por excavación con aspiración hasta 6 pies, relleno y restauración, cada uno', unit: 'EA', csi: '31 23 16',
      material_cost_cents: { v: 4000, prov: est('Backfill stone and surface patch ≈$40 per hole') },
      labor_hours_per_unit: { v: 2.5, prov: est('2-person vac crew ≈ 1.25 h per hole incl. setup, survey of the exposed line and backfill') },
      equipment_cost_cents: { v: 25000, prov: est('Vacuum excavator ≈$200/hr × 1.25 h; dump fees for spoil not included') },
      waste_pct: { v: 0, prov: est('No consumable waste') } },
    { code: 'HC-HDD-PIT-EA', name: 'Bore entry or exit pit with fluid containment — dig, protect, backfill, restore, each', name_es: 'Fosa de entrada o salida con contención de lodo — excavar, proteger, rellenar y restaurar, cada una', unit: 'EA', csi: '31 23 16',
      material_cost_cents: { v: 15000, prov: est('Backfill, silt fence, plastic sheeting and surface restoration ≈$150 per pit') },
      labor_hours_per_unit: { v: 6, prov: est('2 workers ≈ 3 h per pit to dig, set containment, backfill and compact (≈6 × 10 × 5 ft pit)') },
      equipment_cost_cents: { v: 60000, prov: est('Excavator or backhoe and compactor ≈ half a day; trench box rental not included') },
      waste_pct: { v: 0, prov: est('No consumable waste') } },
    { code: 'HC-HDD-FLUID-DISP-CY', name: 'Drilling fluid and cuttings — vac, haul and dispose at an approved site, per CY', name_es: 'Lodo de perforación y recortes — aspirar, transportar y disponer en sitio aprobado, por yarda cúbica', unit: 'CY', csi: '31 23 23',
      material_cost_cents: { v: 3500, prov: est('Disposal or solidification fee ≈$35/CY; varies widely by state and landfill') },
      labor_hours_per_unit: { v: 0.3, prov: est('Vac truck operator ≈ 25–30 CY handled per day incl. haul') },
      equipment_cost_cents: { v: 4500, prov: est('Vac truck ≈$1,200/day ÷ ≈27 CY/day') },
      waste_pct: { v: 0, prov: est('Quantity is the measured spoil volume') } },
  ],
  dependency_hints: [
    { after_trades: ['utility_locating', 'surveying'], note: 'Utility locates, potholes and the staked bore path come before the rig sets up.' },
    { after_trades: ['traffic_control', 'erosion_control'], note: 'Traffic control and silt fence / frac-out containment in place before drilling in a right-of-way or near water.' },
  ],
});
