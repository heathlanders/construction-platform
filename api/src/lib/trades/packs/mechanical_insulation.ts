// Trade Knowledge Pack — mechanical_insulation (Mechanical / Pipe Insulation — pipe, duct and equipment
// insulation, vapor retarders, jacketing). Wave 14 — NEW-TRADE pattern (no hand recipe, no template tasks;
// only the generic mechanical phase recipe applies). Dossier: docs/trade-packs/dossiers/mechanical_insulation.md.
// Sources: UFGS 23 07 00 (Aug 2024), NIBS/NIA Mechanical Insulation Design Guide, NAIMA 3E Plus (method only),
// 29 CFR 1926 (C, D, E, L, M, X, Z incl. 1926.1101 asbestos TSI, AA), IECC / IMC / IBC (reference only).
// Grease duct wrap belongs to kitchen_exhaust (M-KEX-WRAP-LF); firestop systems belong to firestopping.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['mechanical_insulation-ufgs-23-07-00'], confidence: 'verified' as const, last_verified: D };
const midg = { src: ['mechanical_insulation-nia-midg'], confidence: 'verified' as const, last_verified: D };
const ufgsMidg = { src: ['mechanical_insulation-ufgs-23-07-00', 'mechanical_insulation-nia-midg'], confidence: 'verified' as const, last_verified: D };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const PIPE = 'pipe\\s*insulation|piping\\s*insulat|insulat\\w*\\s+(?:the\\s+)?(?:chilled|hot|heating|hydronic|refrigerant|condensate|domestic)\\s*(?:water\\s*)?(?:pipe|piping|lines?)|\\blagging\\b|pipe\\s*jacket';
const DUCT = 'duct\\s*(?:insulation|wrap)|insulat\\w*\\s+(?:the\\s+)?(?:supply\\s*|return\\s*)?duct';
const EQUIP = 'equipment\\s*insulat|insulat\\w*\\s+(?:the\\s+)?(?:tank|vessel|boiler|chiller|heat\\s*exchanger|breeching)';
const ANY = `${PIPE}|${DUCT}|${EQUIP}|mechanical\\s*insulation|jacketing`;

export default definePack({
  key: 'mechanical_insulation',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Insulates mechanical piping, ductwork and equipment after pressure and leakage tests pass: right material and thickness per the schedule, a sealed vapor retarder on cold lines, covered fittings and valves, weather jackets outdoors, protection at hangers, labels, and continuity through penetrations so the firestop trade can seal them.',
    summary_es: 'Aísla tuberías, ductos y equipos mecánicos después de aprobar las pruebas de presión y fugas: material y espesor correctos según la tabla, barrera de vapor sellada en líneas frías, accesorios y válvulas cubiertos, chaquetas contra la intemperie en exteriores, protección en los soportes, etiquetas y continuidad a través de las penetraciones para que el oficio de sellos cortafuego las selle.',
    glossary: [
      { term: 'ASJ (all-service jacket)', term_es: 'Chaqueta ASJ (para todo servicio)', def: 'Factory paper-foil-scrim jacket on fiberglass pipe insulation, with a self-sealing lap strip.', def_es: 'Chaqueta de fábrica de papel, aluminio y malla sobre el aislamiento de fibra de vidrio para tubería, con tira de traslape autoadhesiva.' },
      { term: 'Vapor retarder', term_es: 'Barrera de vapor', def: 'Continuous sealed outer layer on cold piping or duct that stops humid air from reaching the cold surface and sweating.', def_es: 'Capa exterior continua y sellada en tubería o ducto frío que impide que el aire húmedo llegue a la superficie fría y la haga sudar.' },
      { term: 'Elastomeric insulation', term_es: 'Aislamiento elastomérico', def: 'Flexible closed-cell rubber tube or sheet, glued at seams; common on refrigerant and chilled-water lines.', def_es: 'Tubo o lámina flexible de hule de celda cerrada, pegado en las uniones; común en líneas de refrigerante y agua helada.' },
      { term: 'Insulation insert', term_es: 'Inserto aislante', def: 'Rigid load-bearing insulation block at a hanger so the pipe weight does not crush the insulation.', def_es: 'Bloque rígido de aislamiento que soporta carga en el colgador para que el peso del tubo no aplaste el aislamiento.' },
      { term: 'Hanger shield', term_es: 'Protector de colgador', def: 'Curved sheet-metal saddle between the hanger and the insulation that spreads the load.', def_es: 'Silla curva de lámina entre el colgador y el aislamiento que reparte la carga.' },
      { term: 'Fitting cover', term_es: 'Cubierta de accesorio', def: 'Premolded PVC cover with an insulation insert that finishes an elbow, tee or valve.', def_es: 'Cubierta de PVC premoldeada con inserto aislante que termina un codo, una te o una válvula.' },
      { term: 'Metal jacket', term_es: 'Chaqueta metálica', def: 'Aluminum or stainless sheet wrapped and banded over insulation outdoors or in high-abuse areas.', def_es: 'Lámina de aluminio o acero inoxidable envuelta y sujeta con flejes sobre el aislamiento en exteriores o zonas de mucho maltrato.' },
      { term: 'Duct wrap', term_es: 'Manta para ducto', def: 'Flexible fiberglass blanket with a facing, wrapped around sheet-metal duct and taped at seams.', def_es: 'Manta flexible de fibra de vidrio con recubrimiento, que envuelve el ducto de lámina y se encinta en las uniones.' },
      { term: 'Lagging', term_es: 'Recubrimiento (lagging)', def: 'Older trade word for insulating and covering pipe or equipment.', def_es: 'Término antiguo del oficio para aislar y recubrir tubería o equipo.' },
      { term: 'TSI (thermal system insulation)', term_es: 'TSI (aislamiento de sistemas térmicos)', def: 'Insulation on pipes, boilers, tanks and ducts; in buildings from 1980 or earlier it is presumed to contain asbestos.', def_es: 'Aislamiento en tuberías, calderas, tanques y ductos; en edificios de 1980 o anteriores se presume que contiene asbesto.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [
    {
      id: 'pipe_insulation',
      example_title: 'Chilled water and refrigerant pipe insulation',
      when: { title_re: PIPE },
      steps: [
        {
          title: 'Confirm the piping is tested and released',
          instruction: 'Get written word that the pressure test, refrigerant test and any heat tracing on the section are done and passed before you cover it. Clean rust, scale, dirt and water off the pipe. In an existing building from 1980 or earlier, treat old pipe insulation as asbestos until it is tested — do not cut or disturb it; stop and call the supervisor.',
          detail: 'Insulating over an untested joint hides a leak; cutting old TSI can release asbestos.',
          tools: ['test report', 'wire brush', 'rags', 'flashlight'],
          materials: [],
          safety_ids: ['asbestos_tsi', 'hot_surface'],
          qa_ids: ['tests_before_cover', 'surface_clean_dry'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Check material, thickness and fire rating against the schedule',
          instruction: 'Match each service (chilled water, heating water, domestic hot and cold, refrigerant, condensate) to the insulation type and thickness on the drawings or schedule. Confirm the cartons show the flame-spread and smoke-developed rating the spec requires and that elastomeric is not used on pipe hotter than its rating. Keep material dry and in its cartons until the day you use it.',
          code_refs: [
            { section: 'C403.12.3', note: 'Piping insulation for heating and cooling systems (commercial)', code_type: 'IECC' },
            { section: 'R403.4', note: 'Mechanical system piping insulation (residential)', code_type: 'IECC' },
            { section: '1204.1', note: 'Pipe insulation characteristics — flame spread and smoke ratings' },
          ],
          tools: ['insulation schedule', 'tape measure', 'pipe gauge'],
          materials: ['pipe insulation per schedule', 'jacketing and lap tape'],
          safety_ids: ['fiber_irritation'],
          qa_ids: ['material_thickness', 'flame_smoke_rating', 'kept_dry'],
        },
        {
          title: 'Insulate straight runs continuous through hangers',
          instruction: 'Install full-length sections with tight butt joints — no stacked scraps. Keep insulation unbroken through every hanger: set a sheet-metal shield under the pipe and a rigid insert where the pipe weight would crush the insulation. Seal longitudinal laps and butt strips; stagger joints when two layers are used.',
          detail: 'Elastomeric: brush adhesive on both faces, let it tack, then press — a seam that pulls apart after an hour gets replaced.',
          tools: ['insulation knife', 'saw for rigid inserts', 'stapler', 'brush'],
          materials: ['pipe insulation sections', 'hanger shields', 'rigid insulation inserts', 'lap tape or contact adhesive'],
          safety_ids: ['knife_cuts', 'ladder', 'aerial_lift', 'adhesive_vapors'],
          qa_ids: ['continuous_hangers', 'laps_sealed'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Seal the vapor retarder on cold piping and cover fittings and valves',
          instruction: 'On chilled water, refrigerant suction, cold domestic water and condensate lines, keep the vapor retarder continuous: seal every lap and butt joint, coat or tape every staple, and seal around thermometers, gauges and hanger rods. Insulate elbows, tees, valves and strainers with fitted pieces or PVC fitting covers over inserts — no bare metal on a cold line. Leave valve stems and unions where they can be reached.',
          code_refs: [{ section: 'C403.12.3', note: 'Piping insulation — includes fittings and valves on the insulated system', code_type: 'IECC' }],
          tools: ['insulation knife', 'mastic brush', 'tape gun'],
          materials: ['vapor retarder mastic or PVDC tape', 'PVC fitting covers', 'fitting inserts', 'glass fabric tape'],
          safety_ids: ['knife_cuts', 'adhesive_vapors', 'confined_space'],
          qa_ids: ['vapor_retarder_continuous', 'fittings_covered'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Jacket outdoor and high-abuse piping',
          instruction: 'Where piping runs outdoors or on a roof, cover the insulation with an aluminum, stainless or UV-rated PVC jacket with laps turned so water runs off, banded or sealed weathertight. Do not use adhesive tape as the weather protection. Make the jacket removable for the first few feet at equipment so service work does not wreck it. Jacket low piping in mechanical rooms and kitchens where it will get bumped.',
          code_refs: [
            { section: 'C403.12.3.1', note: 'Protection of piping insulation exposed to weather (commercial)', code_type: 'IECC' },
            { section: 'R403.4.1', note: 'Protection of piping insulation (residential)', code_type: 'IECC' },
          ],
          tools: ['tin snips', 'banding tool', 'crimper', 'drill/driver'],
          materials: ['aluminum or UV-rated PVC jacket', 'bands and seals', 'jacket sealant', 'fitting covers'],
          safety_ids: ['roof_edge', 'sheet_metal_cut', 'ladder'],
          qa_ids: ['weather_jacket', 'removable_at_equipment'],
          gating_inspection_type: 'final',
        },
        {
          title: 'Carry insulation through penetrations and label',
          instruction: 'Run insulation continuous through wall and floor sleeves so the firestop crew can seal around the jacket with a listed system that allows insulated pipe — never strip insulation back to fit a sleeve without the firestop listing calling for it. Apply service and flow-direction labels on the jacket where the drawings require. Walk the job and repair any torn jacket.',
          code_refs: [{ section: '714', note: 'Penetrations of fire-resistance-rated assemblies', code_type: 'IBC' }],
          tools: ['insulation knife', 'label kit', 'flashlight'],
          materials: ['pipe labels and flow arrows', 'jacket repair tape'],
          safety_ids: ['ladder', 'aerial_lift'],
          qa_ids: ['penetrations_continuous', 'labels', 'jacket_repaired'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'duct_insulation',
      example_title: 'Supply duct insulation wrap',
      when: { title_re: DUCT },
      priority: 10,
      steps: [
        {
          title: 'Wait for the duct leakage test before wrapping',
          instruction: 'Confirm the duct leakage test is done and signed off and all duct joints are sealed. Wrapping first hides leaks the tester needs to find. Clean dust and oil off the duct.',
          code_refs: [{ section: 'C403.12.1', note: 'Duct and plenum insulation and sealing (commercial)', code_type: 'IECC' }],
          tools: ['test report', 'rags'],
          materials: [],
          safety_ids: ['ladder'],
          qa_ids: ['tests_before_cover'],
          gating_inspection_type: 'duct_leakage',
        },
        {
          title: 'Wrap the duct to the scheduled R-value',
          instruction: 'Cut duct wrap to length with enough to overlap the seam, facing out. Do not compress it — squeezing the blanket lowers its R-value. Hold it with outward-clinch staples and tape every seam with the matching facing tape. On wide ducts, add pins on the bottom so the wrap does not sag.',
          code_refs: [
            { section: 'R403.3.1', note: 'Insulation of ducts outside conditioned space (residential)', code_type: 'IECC' },
            { section: '604.1', note: 'Duct insulation — general' },
            { section: '604.3', note: 'Duct coverings and linings — flame spread and smoke ratings' },
          ],
          tools: ['insulation knife', 'straightedge', 'outward-clinch stapler', 'pin welder or adhesive pins'],
          materials: ['faced duct wrap', 'facing tape', 'insulation pins and washers'],
          safety_ids: ['fiber_irritation', 'knife_cuts', 'ladder', 'aerial_lift', 'confined_space'],
          qa_ids: ['material_thickness', 'flame_smoke_rating', 'duct_wrap_uncompressed'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Seal the facing on cold-air duct',
          instruction: 'On supply duct that carries cooled air, the facing is the vapor retarder: tape every seam, staple and tear, and seal around hanger straps and test ports. A gap will drip condensation onto the ceiling.',
          tools: ['tape gun', 'squeegee'],
          materials: ['facing tape', 'vapor retarder mastic'],
          safety_ids: ['adhesive_vapors'],
          qa_ids: ['vapor_retarder_continuous'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Weatherproof outdoor duct and patch after balancing',
          instruction: 'Duct outdoors or on the roof gets insulation plus a weather jacket or reinforced weather mastic over the whole surface. After the balancer finishes, patch every test hole and tear in the insulation and facing.',
          tools: ['mastic brush', 'tin snips', 'banding tool'],
          materials: ['weather mastic with fabric', 'metal or membrane jacket', 'facing tape'],
          safety_ids: ['roof_edge', 'sheet_metal_cut'],
          qa_ids: ['weather_jacket', 'jacket_repaired'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'equipment_insulation',
      example_title: 'Equipment insulation — tanks and heat exchanger',
      when: { title_re: EQUIP },
      priority: 5,
      steps: [
        {
          title: 'Plan insulation around service points and nameplates',
          instruction: 'Before insulating tanks, heat exchangers, pumps or chillers, mark the manways, flanges, gauges, valves and nameplates. These get removable covers or are left open so maintenance can reach them without tearing insulation.',
          tools: ['marker', 'tape measure', 'equipment drawings'],
          materials: [],
          safety_ids: ['hot_surface', 'confined_space'],
          qa_ids: ['removable_at_equipment'],
        },
        {
          title: 'Insulate and seal the equipment',
          instruction: 'Fit board or block insulation tight to the shell, stagger joints, and secure with bands or pins. On cold equipment, finish with a continuous vapor retarder and seal every penetration. Build removable, labeled covers for the service points.',
          tools: ['insulation knife', 'banding tool', 'pin welder'],
          materials: ['board or block insulation', 'bands', 'vapor retarder mastic', 'removable cover kits'],
          safety_ids: ['fiber_irritation', 'hot_surface', 'scaffold', 'knife_cuts'],
          qa_ids: ['vapor_retarder_continuous', 'removable_at_equipment'],
          gating_inspection_type: 'final',
        },
        {
          title: 'Jacket and finish',
          instruction: 'Cover with a metal jacket outdoors and in traffic areas; keep the nameplate and gauges visible. Clean up offcuts and dust.',
          tools: ['tin snips', 'banding tool', 'shop vacuum with HEPA filter'],
          materials: ['metal jacket', 'bands and seals'],
          safety_ids: ['sheet_metal_cut', 'fiber_irritation'],
          qa_ids: ['weather_jacket'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: 'C403.12.3', note: 'Piping insulation for heating and cooling systems (commercial)', code_type: 'IECC', prov: icc },
      { section: 'R403.4', note: 'Mechanical system piping insulation (residential)', code_type: 'IECC', prov: icc },
      { section: '1204.1', note: 'Pipe insulation characteristics — flame spread and smoke ratings', prov: icc },
      { section: '604.3', note: 'Duct coverings and linings — flame spread and smoke ratings', prov: icc },
    ],
    duct_leakage: [
      { section: 'C403.12.1', note: 'Duct and plenum insulation and sealing (commercial)', code_type: 'IECC', prov: icc },
      { section: 'R403.3.1', note: 'Insulation of ducts outside conditioned space (residential)', code_type: 'IECC', prov: icc },
    ],
    final: [
      { section: 'C403.12.3.1', note: 'Protection of piping insulation exposed to weather', code_type: 'IECC', prov: icc },
      { section: 'R403.4.1', note: 'Protection of piping insulation (residential)', code_type: 'IECC', prov: icc },
      { section: '714', note: 'Penetrations of fire-resistance-rated assemblies', code_type: 'IBC', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: ANY, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Reach overhead pipe and duct runs without working off ladder tops' },
    { when: { title_re: ANY, building_types: ['industrial'] }, type: 'boom_lift', reason: 'High piping racks and equipment in open bays', optional: true },
  ],
  hazards: [
    { id: 'asbestos_tsi', hazard: 'Disturbing old pipe, boiler or duct insulation that contains asbestos during renovation or tie-ins', hazard_es: PENDING_ES, controls: ['Treat thermal system insulation in buildings from 1980 or earlier as asbestos until the owner shows it was tested', 'Do not cut, strip or sweep old insulation; stop work and let a licensed abatement crew remove it'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)(2)(i)', severity: 4, prov: osha('z', 'PACM definition: TSI in buildings built no later than 1980; owner must identify ACM/PACM before work.') },
    { id: 'fiber_irritation', hazard: 'Skin, eye and throat irritation from glass and mineral fibers when cutting and handling insulation', hazard_es: PENDING_ES, controls: ['Wear long sleeves, gloves and safety glasses; use a dust respirator when cutting overhead or in tight spaces', 'Clean up with a HEPA vacuum or wet methods, not dry sweeping or compressed air'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['safety glasses', 'gloves', 'long sleeves', 'N95 respirator as needed'], prov: osha('d') },
    { id: 'adhesive_vapors', hazard: 'Breathing solvent vapors and fire from contact adhesive and mastics in closed rooms', hazard_es: PENDING_ES, controls: ['Read the SDS; ventilate the area so heavier-than-air vapors are cleared from low spots', 'Keep sparks, flames and hot work away from wet adhesive; close containers'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['chemical-resistant gloves', 'safety glasses'], prov: osha('d', 'Hazard communication (incorporates 1910.1200). Ventilation guidance from UFGS 23 07 00 3.1.4.2.') },
    { id: 'knife_cuts', hazard: 'Cuts from insulation knives and saws when cutting sections and inserts', hazard_es: PENDING_ES, controls: ['Cut away from the body on a stable surface with a sharp, retractable blade', 'Wear cut-resistant gloves'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'sheet_metal_cut', hazard: 'Deep cuts from aluminum and stainless jacket edges and bands', hazard_es: PENDING_ES, controls: ['Handle jacket sheet with cut-resistant gloves and sleeves', 'Fold or hem cut edges; snip band ends flush'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'sleeves'], prov: osha('e') },
    { id: 'hot_surface', hazard: 'Burns from operating steam, heating water or equipment that is still hot', hazard_es: PENDING_ES, controls: ['Confirm with the owner or mechanical contractor which lines are live; let them cool or isolate before working', 'Wear insulated gloves near hot surfaces'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 3, ppe: ['heat-resistant gloves'], prov: osha('c') },
    { id: 'ladder', hazard: 'Ladder fall while insulating overhead pipe and duct', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it is used to reach', 'Never stand on the top step or reach past the rails; use a lift for long runs'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'aerial_lift', hazard: 'Falling or being thrown from a lift while working on high piping and duct', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the platform anchor in boom lifts', 'Stand on the platform floor, never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'scaffold', hazard: 'Fall from scaffold around tanks and large equipment', hazard_es: PENDING_ES, controls: ['Use guardrails or personal fall arrest on scaffold platforms more than 10 ft up', 'Use only scaffolds erected and inspected by a competent person'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'roof_edge', hazard: 'Fall from the roof edge while jacketing rooftop piping and duct', hazard_es: PENDING_ES, controls: ['Use guardrails, safety net, personal fall arrest, or a warning line with a monitor on low-slope roofs', 'Stage materials away from the edge'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(10)', severity: 4, ppe: ['harness + lanyard where required'], prov: osha('m') },
    { id: 'confined_space', hazard: 'Bad air or entrapment in crawlspaces, pipe chases, tunnels and vessels', hazard_es: PENDING_ES, controls: ['Have a competent person evaluate the space before entry; follow the permit-space program if it is a permit space', 'Ventilate when using solvent adhesives in a tight space'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
  ],
  qa_checklist: [
    { id: 'tests_before_cover', item: 'Pressure, refrigerant and duct leakage tests passed and documented before any section is insulated.', item_es: { status: 'translated', text: 'Pruebas de presión, de refrigerante y de fugas de ducto aprobadas y documentadas antes de aislar cualquier tramo.' }, prov: ufgs },
    { id: 'surface_clean_dry', item: 'Pipe and duct surfaces clean and dry; insulation kept dry — wet or dirty material removed from the job.', item_es: { status: 'translated', text: 'Superficies de tubería y ducto limpias y secas; aislamiento mantenido seco — material mojado o sucio retirado de la obra.' }, prov: ufgs },
    { id: 'material_thickness', item: 'Insulation type and thickness for each service match the schedule and the energy-code requirement.', item_es: { status: 'translated', text: 'Tipo y espesor de aislamiento de cada servicio coinciden con la tabla y con el requisito del código de energía.' }, prov: { src: ['mechanical_insulation-ufgs-23-07-00', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.1.6 + IECC C403.12.3 / R403.4 topics; no table values stored.' } },
    { id: 'flame_smoke_rating', item: 'Insulation, jackets and adhesives inside the building carry the flame-spread / smoke-developed rating the spec calls for (labels on cartons).', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'kept_dry', item: 'Material stored off the floor in cartons and covered at the end of each day.', item_es: { status: 'translated', text: 'Material guardado sobre el piso, en sus cajas y cubierto al final de cada día.' }, prov: ufgs },
    { id: 'continuous_hangers', item: 'Insulation continuous through every hanger, with shields and rigid inserts where pipe weight would crush it; no compressed spots.', item_es: { status: 'translated', text: 'Aislamiento continuo en cada colgador, con protectores e insertos rígidos donde el peso del tubo lo aplastaría; sin partes comprimidas.' }, prov: ufgs },
    { id: 'laps_sealed', item: 'Longitudinal laps and butt strips sealed; full-length sections used, no stacked scraps; elastomeric seams hold after one hour.', item_es: { status: 'translated', text: 'Traslapes longitudinales y tiras de unión sellados; tramos de largo completo, sin pedazos amontonados; uniones elastoméricas firmes después de una hora.' }, prov: ufgs },
    { id: 'vapor_retarder_continuous', item: 'Vapor retarder on cold pipe, duct and equipment unbroken: staples coated, penetrations and hanger rods sealed, no sweating after start-up.', item_es: { status: 'translated', text: 'Barrera de vapor continua en tubería, ducto y equipo frío: grapas cubiertas, penetraciones y varillas de colgador selladas, sin condensación después del arranque.' }, prov: ufgsMidg },
    { id: 'fittings_covered', item: 'Elbows, tees, valves and strainers on insulated lines covered; valve stems and unions still reachable.', item_es: { status: 'translated', text: 'Codos, tes, válvulas y filtros en líneas aisladas cubiertos; vástagos de válvula y uniones todavía accesibles.' }, prov: ufgs },
    { id: 'duct_wrap_uncompressed', item: 'Duct wrap installed at full thickness, seams overlapped and taped, pinned on wide duct bottoms, no sags.', item_es: { status: 'translated', text: 'Manta de ducto instalada a su espesor completo, uniones traslapadas y encintadas, con pines en el fondo de ductos anchos, sin colgarse.' }, prov: midg },
    { id: 'weather_jacket', item: 'Outdoor and high-abuse insulation jacketed weathertight; laps shed water; no adhesive tape used as weather protection.', item_es: { status: 'translated', text: 'Aislamiento exterior y de zonas de maltrato con chaqueta hermética; traslapes que escurren el agua; sin cinta adhesiva como protección contra la intemperie.' }, prov: { src: ['mechanical_insulation-ufgs-23-07-00', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.4 + IECC C403.12.3.1 topic.' } },
    { id: 'removable_at_equipment', item: 'Removable covers at equipment service points, flanges and manways; nameplates and gauges left visible.', item_es: { status: 'translated', text: 'Cubiertas removibles en puntos de servicio de equipos, bridas y registros; placas de datos y manómetros visibles.' }, prov: ufgs },
    { id: 'penetrations_continuous', item: 'Insulation continuous through rated wall and floor penetrations, ready for a firestop system listed for insulated pipe.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'labels', item: 'Service and flow-direction labels applied on the jacket where the drawings require.', item_es: { status: 'translated', text: 'Etiquetas de servicio y dirección de flujo puestas sobre la chaqueta donde lo piden los planos.' }, prov: midg },
    { id: 'jacket_repaired', item: 'Test holes and torn insulation or facing repaired after balancing; no exposed cold metal left.', item_es: { status: 'translated', text: 'Orificios de prueba y aislamiento o recubrimiento roto reparados después del balanceo; no queda metal frío expuesto.' }, prov: ufgs },
  ],
  inspection_checklists: {
    gas_refrigerant_test: [
      { item: 'Refrigerant and piping pressure tests passed before insulation covers joints', item_es: { status: 'translated', text: 'Pruebas de presión de refrigerante y tubería aprobadas antes de que el aislamiento cubra las uniones' } },
    ],
    duct_leakage: [
      { item: 'Duct leakage test witnessed before duct wrap is applied', item_es: { status: 'translated', text: 'Prueba de fugas de ducto presenciada antes de colocar la manta' }, ref: 'IECC C403.12.1' },
    ],
    rough_in: [
      { item: 'Pipe and duct insulation material and thickness per schedule and energy code', item_es: { status: 'translated', text: 'Material y espesor del aislamiento de tubería y ducto según la tabla y el código de energía' }, ref: 'IECC C403.12.3' },
      { item: 'Insulation inside the building meets the required flame-spread / smoke-developed rating', item_es: PENDING_ES, ref: 'IMC 604.3' },
      { item: 'Vapor retarder continuous on cold piping and duct', item_es: { status: 'translated', text: 'Barrera de vapor continua en tubería y ducto fríos' } },
    ],
    final: [
      { item: 'Exterior piping insulation protected from sun, water and damage; removable at equipment', item_es: { status: 'translated', text: 'Aislamiento de tubería exterior protegido del sol, agua y daños; removible junto al equipo' }, ref: 'IECC C403.12.3.1' },
      { item: 'Insulated penetrations of rated assemblies sealed with a listed firestop system', item_es: PENDING_ES, ref: 'IBC 714' },
    ],
  },
  assemblies: [
    { code: 'M-INS-FG-PIPE-LF', name: 'Fiberglass pipe insulation with ASJ, 1 in. on up to 2 in. pipe, installed', name_es: 'Aislamiento de fibra de vidrio para tubería con chaqueta ASJ, 1 pulg. en tubo de hasta 2 pulg., instalado', unit: 'LF', csi: '23 07 19',
      description: 'Heating water / domestic hot water piping; fitting covers priced separately (M-INS-FITTING-EA).',
      material_cost_cents: { v: 300, prov: est('preformed fiberglass section + ASJ, distributor list spot, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('straight runs incl. hangers shields; overhead from lift') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; lift carried by the mechanical contractor') }, waste_pct: { v: 10, prov: est('cutoffs at fittings and hangers') } },
    { code: 'M-INS-ELAST-PIPE-LF', name: 'Flexible elastomeric pipe insulation, 3/4–1 in. wall, refrigerant / chilled water, glued seams', name_es: 'Aislamiento elastomérico flexible para tubería, pared de 3/4–1 pulg., refrigerante / agua helada, uniones pegadas', unit: 'LF', csi: '23 07 19',
      material_cost_cents: { v: 280, prov: est('closed-cell elastomeric tube + adhesive, distributor list spot, national baseline 2026') }, labor_hours_per_unit: { v: 0.07, prov: est('slit, glue seams and butts, seal fittings') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('cutoffs at fittings') } },
    { code: 'M-INS-ALUM-JKT-LF', name: 'Aluminum jacket over pipe insulation, outdoor, banded and sealed', name_es: 'Chaqueta de aluminio sobre aislamiento de tubería, exterior, con flejes y sellada', unit: 'LF', csi: '23 07 19',
      material_cost_cents: { v: 250, prov: est('smooth/embossed aluminum jacket + bands + sealant, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('cut, roll, lap to shed water, band') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 12, prov: est('laps and fitting offcuts') } },
    { code: 'M-INS-FITTING-EA', name: 'PVC fitting or valve cover with insulation insert, sealed', name_es: 'Cubierta de PVC para accesorio o válvula con inserto aislante, sellada', unit: 'EA', csi: '23 07 19',
      material_cost_cents: { v: 600, prov: est('premolded PVC cover + insert + tape, national baseline 2026') }, labor_hours_per_unit: { v: 0.2, prov: est('fit insert, set cover, seal vapor retarder') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('occasional broken cover') } },
  ],
  quantity_rules: [
    { code: 'M-INS-ELAST-PIPE-LF', assumption: 'Forced-air unit with cooling — insulate ≈25 LF of refrigerant suction line (matches the assumed line set length)', when: { facts_any: ['fau'] }, qty: { basis: { fixture: 'fau' }, mul: 25 } },
    { code: 'M-INS-FG-PIPE-LF', assumption: 'Water heater — ≈10 LF of insulated hot water piping at the heater; replace with the plumbing takeoff', when: { facts_any: ['water_heater'] }, qty: { basis: { fixture: 'water_heater' }, mul: 10 } },
    { code: 'M-INS-FG-PIPE-LF', assumption: 'Commercial heating / hot water piping allowance of 200 LF — replace with the piping takeoff', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 200 } },
    { code: 'M-INS-ELAST-PIPE-LF', assumption: 'Commercial refrigerant / chilled water piping allowance of 80 LF — replace with the piping takeoff', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 80 } },
    { code: 'M-INS-FITTING-EA', assumption: 'About 1 fitting or valve cover per 10 LF of commercial insulated piping (≈28)', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 28 } },
    { code: 'M-INS-ALUM-JKT-LF', assumption: 'Commercial rooftop piping allowance of 40 LF jacketed — remove if no piping runs outdoors', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 40 } },
  ],
  dependency_hints: [
    { after_trades: ['hvac', 'refrigeration', 'boilers_hydronic', 'plumbing', 'ductwork'], note: 'Insulate only after the piping/duct trade has pressure- or leakage-tested the section.' },
    { before_phase: 'drywall', note: 'Pipe and duct insulation in walls and above hard ceilings finished and inspected before they close.' },
  ],
});
