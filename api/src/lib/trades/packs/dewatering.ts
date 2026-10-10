// Trade Knowledge Pack — dewatering (Dewatering). Wave 19 — NEW-TRADE pattern (no hand recipe, no
// template tasks). Dossier: docs/trade-packs/dossiers/dewatering.md. Sources: 29 CFR 1926 Subpart P
// (1926.651(e),(g),(h),(i),(k)), 1926.501(b)(7), 1926.404(b), 1926.1203, 1926.152(g), 1926.52;
// WPDES General Permit WI-0049344 (Dewatering Operations) + Form 3400-233; WDNR Technical Standard 1061;
// WDNR high capacity well program (NR 812.09(4)); UFGS 31 23 19 (title only); IBC 1803.5.4 / 1805.1.3 /
// 3307.1 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const ibc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const gp = { src: ['dewatering-wi-dnr-gp-0049344'], confidence: 'verified' as const, last_verified: D };
const ts1061 = { src: ['dewatering-wi-dnr-1061'], confidence: 'verified' as const, last_verified: D };
const subP = { src: ['ecfr-1926-p'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'dewatering',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Keeps excavations dry so footings, foundations and utilities can be built in the dry — sump pits and pumps for open pumping, or wellpoint / deep-well systems that lower the water table before digging. Covers discharge permits and sediment treatment, pump monitoring, settlement watch on neighboring structures, and shutting the system down safely.',
    summary_es: 'Mantiene secas las excavaciones para construir zapatas, cimientos y servicios en seco — fosas de bombeo con bombas para bombeo abierto, o sistemas de puntas filtrantes / pozos profundos que bajan el nivel freático antes de excavar. Incluye permisos de descarga y tratamiento de sedimentos, vigilancia de bombas, control de asentamiento de estructuras vecinas y el apagado seguro del sistema.',
    glossary: [
      { term: 'Water table', term_es: 'Nivel freático', def: 'The depth below ground where the soil is full of water.', def_es: 'La profundidad bajo el terreno donde el suelo está lleno de agua.' },
      { term: 'Drawdown', term_es: 'Abatimiento', def: 'How far pumping lowers the water level below where it started.', def_es: 'Cuánto baja el nivel del agua con el bombeo respecto al nivel inicial.' },
      { term: 'Sump', term_es: 'Fosa de bombeo (sumidero)', def: 'A low pit in the excavation, lined with stone and a perforated pipe, where water collects for the pump.', def_es: 'Un pozo bajo en la excavación, con piedra y tubo perforado, donde se junta el agua para la bomba.' },
      { term: 'Wellpoint', term_es: 'Punta filtrante (wellpoint)', def: 'A short screened pipe jetted into the ground in a line and pulled on by a vacuum pump through a header pipe.', def_es: 'Un tubo corto con rejilla hincado con agua en línea y succionado por una bomba de vacío a través de un tubo colector.' },
      { term: 'Header pipe', term_es: 'Tubo colector', def: 'The pipe running along the wellpoints that collects their water and carries it to the pump.', def_es: 'El tubo que corre junto a las puntas filtrantes, recoge su agua y la lleva a la bomba.' },
      { term: 'Observation well (piezometer)', term_es: 'Pozo de observación (piezómetro)', def: 'A small pipe used only to measure the water level, not to pump.', def_es: 'Un tubo pequeño que solo sirve para medir el nivel del agua, no para bombear.' },
      { term: 'Dewatering filter bag', term_es: 'Bolsa filtrante de desagüe', def: 'A sewn geotextile bag the pump discharges into so sediment stays in the bag.', def_es: 'Una bolsa de geotextil cosida donde descarga la bomba para que el sedimento se quede en la bolsa.' },
      { term: 'Settling tank (weir tank)', term_es: 'Tanque de sedimentación (con vertedero)', def: 'A baffled tank that holds pumped water long enough for soil to settle out before discharge.', def_es: 'Un tanque con deflectores que retiene el agua bombeada para que el suelo se asiente antes de descargar.' },
      { term: 'Transparency tube', term_es: 'Tubo de transparencia', def: 'A clear tube used to check how muddy the discharge water is.', def_es: 'Un tubo transparente para revisar qué tan turbia sale el agua de descarga.' },
      { term: 'Boiling (piping)', term_es: 'Ebullición (sifonamiento)', def: 'Water pushing up through the excavation bottom and carrying soil with it — a sign the bottom is failing.', def_es: 'Agua que sube por el fondo de la excavación arrastrando suelo — señal de que el fondo está fallando.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'sump_open_pumping',
      example_title: 'Dewater foundation excavation',
      when: { title_re: '\\bdewater|\\bsump\\s+pump' },
      steps: [
        {
          title: 'Plan the discharge and get coverage',
          instruction: 'Read the soils report for the water table and soil type. Decide where the water goes: an internally drained area on site first, then a sediment basin, tank or filter bag. Get the discharge permit coverage the state requires before pumping (in Wisconsin, the dewatering general permit unless the construction stormwater permit covers it) and ask the sewer owner before using a storm or sanitary sewer. Check the contaminated-site database for the area.',
          tools: ['site plan', 'soils report'],
          materials: ['dewatering / BMP plan', 'permit coverage letter'],
          safety_ids: ['surface_runoff'],
          qa_ids: ['permit_before_discharge', 'contam_screen'],
        },
        {
          title: 'Dig the sump and set the pump',
          instruction: 'Dig the sump at the low corner outside the footing line and below the bottom of the excavation. Set a perforated riser wrapped in filter fabric in clean stone and hang the pump in it. Run the discharge hose out of the hole, up and away from the edge, to the filter bag or tank. Power electric pumps only from GFCI-protected outlets.',
          tools: ['excavator or backhoe', 'shovel', 'GFCI cord set'],
          materials: ['perforated riser pipe', 'filter fabric', 'clean stone', 'submersible pump', 'discharge hose and clamps'],
          safety_ids: ['struck_load', 'shock_pump', 'cavein_water', 'fall_sump'],
          qa_ids: ['sump_outside_footing', 'gfci_pumps'],
        },
        {
          title: 'Treat and discharge the water',
          instruction: 'Pump into a filter bag on stable ground or into a baffled settling tank, never across bare soil. Start the pump slowly so the bag builds a filter cake. Put a splash pad or stone under every outlet. Check the discharge with a transparency tube; if it is muddy, slow the pump or add treatment before going on.',
          tools: ['transparency tube'],
          materials: ['geotextile dewatering bag (≥100 sq ft)', 'stone or splash pad', 'settling tank if needed'],
          safety_ids: ['engine_exhaust', 'noise'],
          qa_ids: ['bag_on_stable_ground', 'discharge_clear', 'no_sheen'],
        },
        {
          title: 'Keep the footing bottom dry for inspection',
          instruction: 'Hold the water below the bottom of the footing excavation so the bearing soil is firm, not soft or boiling. A competent person inspects the excavation before each shift and after every rain, and checks the pumps are running. Remove softened or disturbed soil before the footing inspection.',
          tools: ['tape measure', 'probe rod'],
          materials: [],
          safety_ids: ['cavein_water', 'pump_failure'],
          qa_ids: ['water_below_bottom', 'no_boiling', 'daily_log'],
          gating_inspection_type: 'footing',
          code_refs: [{ section: '1803.5.4', code_type: 'IBC', note: 'Soils report identifies the ground-water table where it can affect the foundation' }],
        },
        {
          title: 'Shut down and restore',
          instruction: 'Keep pumping until the foundation is backfilled or the engineer releases it. Then pull the pumps, fill the sump with compacted stone or approved fill, dispose of bag sediment where the plan allows, and restore the discharge area. Send any end-of-discharge notice the permit requires.',
          tools: ['excavator or backhoe', 'plate compactor'],
          materials: ['compacted stone or approved fill'],
          safety_ids: ['struck_load', 'fall_sump'],
          qa_ids: ['daily_log'],
        },
      ],
    },
    {
      id: 'wellpoint_deep_well',
      example_title: 'Install wellpoint dewatering system',
      when: { title_re: 'well\\s*points?|deep[-\\s]+wells?|eductor' },
      priority: 10,
      steps: [
        {
          title: 'Confirm the design and approvals',
          instruction: 'Work from the dewatering engineer’s design: point or well spacing, depth, pump size and target drawdown. Total the pumping capacity of every well on the property — in Wisconsin, 70 gpm or more needs high capacity well approval from DNR before the wells are built or run. Get discharge permit coverage and set the treatment train.',
          tools: ['dewatering design drawings'],
          materials: ['high capacity well approval if required', 'discharge permit coverage letter'],
          safety_ids: ['surface_runoff'],
          qa_ids: ['highcap_approval', 'permit_before_discharge', 'contam_screen'],
          code_refs: [{ section: '812.09', code_type: 'WI NR', note: 'Prior DNR approval for a high capacity well system' }],
        },
        {
          title: 'Set monitoring before pumping',
          instruction: 'Install observation wells and settlement points on nearby buildings, walls, utilities and pavement, and record baseline readings and photos before the pumps start.',
          tools: ['level or total station', 'water level meter', 'camera'],
          materials: ['observation well pipe', 'settlement monitoring points'],
          safety_ids: ['adjacent_settlement'],
          qa_ids: ['baseline_readings'],
          code_refs: [{ section: '3307.1', code_type: 'IBC', note: 'Protect adjoining property from damage during construction' }],
        },
        {
          title: 'Install points and header',
          instruction: 'Jet or drill the wellpoints (or wells) to design depth at design spacing, sand-pack them as specified, and connect them to the header with swing joints and valves. Lay the header and discharge line where traffic will not crush them, and fence or cover open well casings.',
          tools: ['jetting pump', 'excavator', 'pipe wrenches'],
          materials: ['wellpoints or well screens', 'filter sand', 'header pipe', 'swing joints and valves'],
          safety_ids: ['struck_load', 'fall_sump', 'noise'],
        },
        {
          title: 'Draw down and verify before digging',
          instruction: 'Start the pumps, send sediment-laden development water through treatment, then read the observation wells until the water is at least the design distance below the planned excavation bottom. Dig only after the drawdown is confirmed. Keep a standby pump or generator on site and check the system every shift.',
          tools: ['water level meter', 'transparency tube'],
          materials: ['standby pump or generator', 'fuel in approved cans'],
          safety_ids: ['pump_failure', 'shock_pump', 'refuel_fire', 'engine_exhaust'],
          qa_ids: ['drawdown_verified', 'standby_power', 'discharge_clear', 'daily_log'],
        },
        {
          title: 'Hold the drawdown through the foundation',
          instruction: 'Keep the water down until the foundation and backfill are heavy enough to resist uplift, as the engineer directs. Read settlement points on the schedule set in the plan and stop to call the engineer if readings pass the alert limit. Then shut down in stages, pull or abandon the wells as required, and file any well-filling reports.',
          tools: ['level or total station', 'water level meter'],
          materials: ['well sealing material where wells are abandoned'],
          safety_ids: ['adjacent_settlement', 'cavein_water'],
          qa_ids: ['settlement_within_limits'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: '1805.1.3', code_type: 'IBC', note: 'Ground-water control below the lowest floor in place of waterproofing' }],
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: '1803.5.4', code_type: 'IBC', note: 'Geotechnical investigation records the ground-water table where it can affect foundations', prov: ibc },
    ],
    foundation: [
      { section: '1805.1.3', code_type: 'IBC', note: 'Ground-water control — lowered water table in lieu of waterproofing', prov: ibc },
      { section: '3307.1', code_type: 'IBC', note: 'Protect adjoining public and private property during construction', prov: ibc },
    ],
  },
  equipment: [
    { when: { title_re: '\\bdewater|\\bsump\\s+pump|well\\s*points?|deep[-\\s]+wells?' }, step_re: 'sump and set|points and header', type: 'excavator', reason: 'Dig sumps and header trenches; set pumps and pipe', optional: true },
    { when: { title_re: '\\bdewater|well\\s*points?|deep[-\\s]+wells?' }, step_re: 'draw down|treat and discharge', type: 'generator', reason: 'Power or standby power for pumps where site power is not available', optional: true },
    { when: { title_re: '\\bdewater|\\bsump\\s+pump' }, step_re: 'shut down', type: 'compactor', reason: 'Compact stone or fill placed back in the sump', optional: true },
  ],
  hazards: [
    { id: 'cavein_water', hazard: 'Cave-in or drowning in an excavation where water is standing or rising', hazard_es: PENDING_ES, controls: ['Nobody works in standing or rising water without a support or shield system, water removal, or a harness and lifeline', 'Competent person inspects before each shift and after every rainstorm'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(1)', severity: 4, prov: osha('p') },
    { id: 'pump_failure', hazard: 'Pump or power failure lets water rise and soften the walls and bottom', hazard_es: PENDING_ES, controls: ['A competent person monitors the water removal equipment and its operation', 'Keep a standby pump or power source; get workers out if water starts rising'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(2)', severity: 4, prov: osha('p') },
    { id: 'surface_runoff', hazard: 'Surface water running into the excavation during heavy rain', hazard_es: PENDING_ES, controls: ['Use diversion ditches or dikes to keep runoff out', 'Re-inspect after heavy rain before re-entry'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(3)', severity: 3, prov: osha('p') },
    { id: 'adjacent_settlement', hazard: 'Lowering the water table settles or undermines nearby buildings, walls and utilities', hazard_es: PENDING_ES, controls: ['Shore, brace or underpin structures whose stability is endangered', 'Read settlement points on schedule and stop pumping changes when readings pass the alert limit'], controls_es: PENDING_ES, osha_ref: '1926.651(i)(1)', severity: 4, prov: osha('p') },
    { id: 'fall_sump', hazard: 'Fall into an open sump, well casing or pit 6 ft or deeper', hazard_es: PENDING_ES, controls: ['Guard, fence, barricade or cover sumps, wells and pits 6 ft or deeper', 'Cap well casings when not being worked'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(7)(ii)', severity: 3, prov: osha('m') },
    { id: 'shock_pump', hazard: 'Electric shock from submersible pumps, cords and wet connections', hazard_es: PENDING_ES, controls: ['GFCI protection or an assured equipment grounding program on every pump circuit', 'Inspect cords daily and keep connections out of the water'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 4, prov: osha('k') },
    { id: 'engine_exhaust', hazard: 'Carbon monoxide from engine-driven pumps or generators in or near the excavation', hazard_es: PENDING_ES, controls: ['Keep engines out of the excavation and downwind of workers', 'Test the atmosphere where exhaust can collect before entry'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)(i)', severity: 3, prov: osha('p') },
    { id: 'confined_sump', hazard: 'Engulfment or bad air entering a deep sump, wet well or manhole', hazard_es: PENDING_ES, controls: ['Competent person evaluates deep sumps and wet wells as confined spaces before work', 'Follow the permit-space program when the space is a permit space'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'struck_load', hazard: 'Struck by an excavator bucket or a pump or pipe being lifted', hazard_es: PENDING_ES, controls: ['Nobody under loads handled by lifting or digging equipment', 'Stay out of the swing radius while sumps are dug and pumps set'], controls_es: PENDING_ES, osha_ref: '1926.651(e)', severity: 3, prov: osha('p') },
    { id: 'refuel_fire', hazard: 'Fire while refueling pumps and generators', hazard_es: PENDING_ES, controls: ['Shut the engine off before refueling', 'Use approved cans and keep an extinguisher at the fueling spot'], controls_es: PENDING_ES, osha_ref: '1926.152(g)(10)', severity: 3, ppe: ['gloves'], prov: osha('f') },
    { id: 'noise', hazard: 'Hearing damage from pumps and generators running all shift', hazard_es: PENDING_ES, controls: ['Place and muffle engines away from work areas', 'Wear hearing protection near running units'], controls_es: PENDING_ES, osha_ref: '1926.52(b)', severity: 2, ppe: ['hearing protection'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'permit_before_discharge', item: 'Discharge permit coverage (or written confirmation that the construction stormwater permit covers it) in hand before pumping starts; sewer owner approval for any sewer discharge.', item_es: { status: 'translated', text: 'Cobertura del permiso de descarga (o confirmación escrita de que la cubre el permiso de aguas pluviales de construcción) antes de bombear; aprobación del dueño del alcantarillado para cualquier descarga al alcantarillado.' }, prov: { src: ['dewatering-wi-dnr-gp-0049344', 'dewatering-wi-dnr-1061'], confidence: 'verified', last_verified: D } },
    { id: 'contam_screen', item: 'Contaminated-site database checked for the area; pumping stops and the state is called if water shows sheen, odor or unusual color.', item_es: { status: 'translated', text: 'Base de datos de sitios contaminados revisada para la zona; se detiene el bombeo y se avisa al estado si el agua muestra brillo aceitoso, olor o color raro.' }, prov: { src: ['dewatering-wi-dnr-gp-0049344', 'dewatering-wi-dnr-1061'], confidence: 'verified', last_verified: D } },
    { id: 'highcap_approval', item: 'Combined capacity of all wells on the property totaled; high capacity well approval obtained before construction or operation when required.', item_es: { status: 'translated', text: 'Capacidad combinada de todos los pozos de la propiedad sumada; aprobación de pozo de alta capacidad obtenida antes de construir u operar cuando se requiera.' }, prov: { src: ['dewatering-wi-dnr-highcap', 'dewatering-wi-dnr-gp-0049344'], confidence: 'verified', last_verified: D } },
    { id: 'sump_outside_footing', item: 'Sumps sit outside the footing line and below the excavation bottom, with a fabric-wrapped perforated riser in clean stone.', item_es: { status: 'translated', text: 'Fosas de bombeo fuera de la línea de zapatas y bajo el fondo de la excavación, con tubo perforado envuelto en geotextil dentro de piedra limpia.' }, prov: est('Common open-pumping practice — keeps the bearing soil under the footing undisturbed.') },
    { id: 'bag_on_stable_ground', item: 'Filter bags and tanks sit on stable ground with energy dissipation at every outlet; no discharge flows across bare soil.', item_es: { status: 'translated', text: 'Bolsas filtrantes y tanques sobre terreno estable con disipador de energía en cada salida; ninguna descarga corre sobre suelo desnudo.' }, prov: ts1061 },
    { id: 'discharge_clear', item: 'Discharge checked daily with a transparency tube; under 5 in. (12.5 cm) of clarity means slow the pump or add treatment.', item_es: { status: 'translated', text: 'Descarga revisada a diario con tubo de transparencia; menos de 5 pulg. (12.5 cm) de claridad significa bajar el bombeo o agregar tratamiento.' }, prov: ts1061 },
    { id: 'no_sheen', item: 'Discharge has no visible oil sheen, floating solids or foam; any additive used has written state approval.', item_es: { status: 'translated', text: 'La descarga no tiene brillo de aceite, sólidos flotantes ni espuma visibles; todo aditivo usado tiene aprobación escrita del estado.' }, prov: gp },
    { id: 'daily_log', item: 'Daily visual inspection log kept (flow, color, odor, solids, sheen, erosion, initials), weekly after the first week of continuous discharge.', item_es: { status: 'translated', text: 'Registro diario de inspección visual (caudal, color, olor, sólidos, brillo, erosión, iniciales), semanal después de la primera semana de descarga continua.' }, prov: { src: ['dewatering-wi-dnr-gp-0049344', 'dewatering-wi-dnr-3400-233'], confidence: 'verified', last_verified: D } },
    { id: 'baseline_readings', item: 'Observation-well and settlement-point baseline readings and photos of neighboring structures recorded before pumping starts.', item_es: { status: 'translated', text: 'Lecturas base de pozos de observación y puntos de asentamiento, y fotos de estructuras vecinas, registradas antes de iniciar el bombeo.' }, prov: est('Standard pre-construction survey practice for dewatering near structures; limits come from the dewatering engineer.') },
    { id: 'water_below_bottom', item: 'Water held below the excavation bottom at footing time; bearing soil firm, not softened or disturbed — disturbed soil removed before the footing inspection.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'Dry, firm bearing is a foundation-quality check and the same water control protects workers under 1926.651(h).' } },
    { id: 'no_boiling', item: 'No boiling, piping or heave at the excavation bottom; if it appears, workers leave the excavation and the engineer is called.', item_es: PENDING_ES, safety: true, prov: subP },
    { id: 'gfci_pumps', item: 'Every electric pump fed through GFCI protection (or an assured grounding program), cords inspected and connections kept dry.', item_es: PENDING_ES, safety: true, prov: osha('k') },
    { id: 'drawdown_verified', item: 'Observation wells show the water at or below the design level under the excavation bottom before digging starts.', item_es: PENDING_ES, safety: true, prov: subP },
    { id: 'standby_power', item: 'Standby pump or power on site and tested, with a plan for who responds if the system stops after hours.', item_es: PENDING_ES, safety: true, prov: subP },
    { id: 'settlement_within_limits', item: 'Settlement readings on neighboring structures taken on schedule and within the engineer’s alert limits; exceedances reported the same day.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'Limits come from the dewatering engineer; 1926.651(i) and IBC 3307.1 set the duty, not the numbers.' } },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Footing excavation dry; water held below the bottom by pumps that are running', item_es: PENDING_ES },
      { item: 'Bearing soil firm and undisturbed — no softened, boiling or pumped-out soil', item_es: PENDING_ES, ref: '1803.5.4' },
      { item: 'Sumps outside the footing lines', item_es: PENDING_ES },
    ],
    foundation: [
      { item: 'Drawdown maintained until walls and backfill resist uplift, per the engineer', item_es: PENDING_ES, ref: '1805.1.3' },
      { item: 'Settlement readings on adjoining structures within alert limits', item_es: PENDING_ES, ref: '3307.1' },
    ],
    discharge_permit_check: [
      { item: 'Permit coverage letter and BMP plan on site', item_es: PENDING_ES },
      { item: 'Daily visual inspection log up to date', item_es: PENDING_ES },
      { item: 'No sheen, foam or visible solids in the discharge; outlets on stable ground', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-DWTR-SUMP-EA', name: 'Dewatering sump — dig, perforated riser in stone, set pump and discharge hose', name_es: 'Fosa de bombeo — excavar, tubo perforado en piedra, colocar bomba y manguera de descarga', unit: 'EA', csi: '31 23 19',
      description: 'Install and later backfill one sump; pump rental is B-DWTR-PUMP-DAY.',
      material_cost_cents: { v: 45000, prov: est('≈8 ft perforated 18–24 in. riser + filter fabric + ~2 CY clean stone + 50 ft discharge hose and fittings, national baseline 2026') }, labor_hours_per_unit: { v: 4, prov: est('dig, set riser and stone, hang pump, run hose; backfill at removal') },
      equipment_cost_cents: { v: 0, prov: est('excavator time carried by the excavation scope') }, waste_pct: { v: 5, prov: est('stone over-order') } },
    { code: 'B-DWTR-PUMP-DAY', name: 'Dewatering pump (2–4 in. submersible or trash pump) — rental, fuel/power and daily check', name_es: 'Bomba de desagüe (sumergible o de lodos de 2–4 pulg.) — renta, combustible/energía y revisión diaria', unit: 'DAY', csi: '31 23 19',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 0.5, prov: est('daily inspection, log entry, refuel or clear intake') },
      equipment_cost_cents: { v: 12000, prov: est('mid-size pump rental day rate incl. fuel or power, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'B-DWTR-FILTERBAG-EA', name: 'Geotextile dewatering filter bag (≥100 sq ft) on stone pad, each', name_es: 'Bolsa filtrante de geotextil para desagüe (≥100 pies²) sobre base de piedra, c/u', unit: 'EA', csi: '31 25 00',
      material_cost_cents: { v: 25000, prov: est('≈10x15 ft dewatering bag + stone pad, distributor list 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('place pad, connect hose, swap/dispose when full') },
      equipment_cost_cents: { v: 0, prov: est('hand placed') }, waste_pct: { v: 0, prov: est('single unit') } },
    { code: 'B-DWTR-TANK-DAY', name: 'Baffled settling (weir) tank — rental per day incl. delivery share', name_es: 'Tanque de sedimentación con deflectores (vertedero) — renta por día incl. parte de entrega', unit: 'DAY', csi: '31 25 00',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 0.25, prov: est('daily check, sediment level') },
      equipment_cost_cents: { v: 9000, prov: est('portable baffled tank day rate + mobilization spread, 2026') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'B-DWTR-WELLPOINT-LF', name: 'Wellpoint system — jet points, header and swing joints, install and remove, per LF of header', name_es: 'Sistema de puntas filtrantes — hincado, colector y juntas giratorias, instalación y retiro, por pie lineal de colector', unit: 'LF', csi: '31 23 19',
      description: 'Install/remove only; vacuum pump operation is priced per day separately.',
      material_cost_cents: { v: 2500, prov: est('consumables, filter sand, swing-joint parts per LF at ~5 ft point spacing, 2026') }, labor_hours_per_unit: { v: 0.6, prov: est('jet, sand-pack, connect, later pull') },
      equipment_cost_cents: { v: 4000, prov: est('jetting pump + header/point rental share per LF, 2026') }, waste_pct: { v: 5, prov: est('damaged points') } },
    { code: 'B-DWTR-MONITOR-EA', name: 'Monitoring point — observation well or settlement point, install and read', name_es: 'Punto de monitoreo — pozo de observación o punto de asentamiento, instalación y lectura', unit: 'EA', csi: '31 23 19',
      material_cost_cents: { v: 15000, prov: est('1–2 in. PVC observation pipe or survey target + cap, 2026') }, labor_hours_per_unit: { v: 2, prov: est('install + baseline and periodic readings') },
      equipment_cost_cents: { v: 5000, prov: est('meter / survey instrument share') }, waste_pct: { v: 0, prov: est('n/a') } },
  ],
  quantity_rules: [
    { code: 'B-DWTR-SUMP-EA', assumption: 'Open pumping with two sumps for a commercial/multifamily excavation — confirm with the soils report', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'B-DWTR-PUMP-DAY', assumption: 'Two pumps for about 10 working days through footings and walls — adjust to the schedule', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const', mul: 20 } },
    { code: 'B-DWTR-FILTERBAG-EA', assumption: 'Two filter bags for the open-pumping discharge — replace as they fill', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'B-DWTR-MONITOR-EA', assumption: 'Four settlement / observation points near adjoining structures — set the real count from the dewatering plan', when: { building_types: ['commercial', 'industrial', 'residential_mf'] }, qty: { basis: 'const', mul: 4 } },
    { code: 'B-DWTR-SUMP-EA', assumption: 'One sump for a house basement excavation in wet ground', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'B-DWTR-PUMP-DAY', assumption: 'One pump for about 7 working days through footings and walls', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 7 } },
  ],
  dependency_hints: [
    { after_trades: ['erosion_control'], before_phase: 'foundation', note: 'Dewatering starts after perimeter erosion controls and before footings; wellpoint drawdown is confirmed before the excavation reaches the water table.' },
  ],
});
