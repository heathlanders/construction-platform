// Trade Knowledge Pack — waterproofing (Waterproofing / Dampproofing). Wave 09 — NEW-TRADE pattern
// (no hand recipe — the 4 template tasks used to fall to the generic foundation branch in building.ts).
// Dossier: docs/trade-packs/dossiers/waterproofing.md. Sources: UFGS 07 11 13 / 07 13 53 / 07 14 00 /
// 33 46 16, DOE BASC below-grade guides (footing drain, dampproofing, capillary break, sump, urban
// below-grade), CCW MiraDRI TDS + ICC-ES ESR-4925 (representative self-adhered sheet), 29 CFR 1926
// (P, D, E, F, M, X, Z), IRC R401.3/R405.1/R406.1/R406.2/R506.2.3 + IBC 1805/1907.1 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const v = (...src: string[]) => ({ src, confidence: 'verified' as const, last_verified: D });
const tr = (text: string) => ({ status: 'translated' as const, text });

const TITLE_RE = '\\bwater-?proofing\\b|\\bdamp-?proofing\\b';

export default definePack({
  key: 'waterproofing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Keeps ground water out of below-grade walls and slabs: surface prep of cured concrete or parged block, dampproofing or membrane waterproofing as the plans and soil conditions require, protection / drainage board, footing drain to daylight or a sump, and the under-slab vapor retarder — all checked before backfill and before the slab pour.',
    summary_es: 'Mantiene el agua del suelo fuera de muros y losas bajo nivel: preparación del muro, impermeabilización asfáltica o membrana según planos y suelo, tablero de protección o drenaje, drenaje de zapata a la superficie o a un cárcamo, y barrera de vapor bajo la losa — revisado antes del relleno y del colado.',
    glossary: [
      { term: 'Dampproofing', term_es: 'Impermeabilización asfáltica (dampproofing)', def: 'Asphalt coating that slows soil moisture through a wall; not made to hold back standing water.', def_es: 'Recubrimiento asfáltico que frena la humedad del suelo a través del muro; no resiste agua con presión.' },
      { term: 'Waterproofing membrane', term_es: 'Membrana impermeable', def: 'Sheet or fluid-applied layer that resists water under pressure where the water table is high.', def_es: 'Capa en lámina o líquida que resiste agua con presión donde el nivel freático es alto.' },
      { term: 'Hydrostatic pressure', term_es: 'Presión hidrostática', def: 'Push of standing ground water against a wall or slab; it is what turns dampproofing into a waterproofing job.', def_es: 'Empuje del agua freática contra el muro o la losa; es lo que convierte el trabajo en impermeabilización completa.' },
      { term: 'Footing drain (drain tile)', term_es: 'Drenaje de zapata (tubo perforado)', def: 'Perforated pipe in clean stone beside the footing that carries water to daylight or a sump.', def_es: 'Tubo perforado en piedra limpia junto a la zapata que lleva el agua a la superficie o a un cárcamo.' },
      { term: 'Drainage board / mat', term_es: 'Tablero o manto de drenaje', def: 'Dimpled or composite sheet on the wall that protects the coating and lets water fall to the drain.', def_es: 'Lámina con hoyuelos o compuesta sobre el muro que protege el recubrimiento y deja bajar el agua al drenaje.' },
      { term: 'Parging', term_es: 'Repellado', def: 'Thin mortar coat on block walls that gives a smooth surface for the coating.', def_es: 'Capa delgada de mortero sobre muros de block que deja una superficie lisa para el recubrimiento.' },
      { term: 'Vapor retarder', term_es: 'Retardador de vapor', def: 'Plastic sheet under the slab that stops ground moisture from wicking into the floor.', def_es: 'Lámina plástica bajo la losa que impide que la humedad del suelo suba al piso.' },
      { term: 'Sump pit', term_es: 'Cárcamo de bombeo', def: 'Lined pit at the low point of the basement that collects drain water for a pump.', def_es: 'Pozo con forro en el punto más bajo del sótano que recoge el agua del drenaje para una bomba.' },
      { term: 'Fillet / cant', term_es: 'Chaflán de sellador', def: 'Bead of sealant in an inside corner so the membrane bends without bridging.', def_es: 'Cordón de sellador en la esquina interior para que la membrana doble sin quedar en puente.' },
      { term: 'Flood test', term_es: 'Prueba de inundación', def: 'Ponding water on a horizontal membrane for a day to find leaks before it is covered.', def_es: 'Encharcar una membrana horizontal por un día para encontrar fugas antes de cubrirla.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'below_grade_residential',
      example_title: 'Waterproofing & damp-proofing',
      when: { phase: ['foundation'], title_re: TITLE_RE },
      steps: [
        {
          title: 'Check the cure and prep the wall',
          instruction: 'Confirm the walls have cured the time the coating maker requires and the surface is dry and not frozen. Snap or cut form ties, grind off fins, fill tie holes, honeycomb and voids, and remove form oil or curing compound the coating will not bond to. Parge block walls first. Keep spoil piles back from the trench edge.',
          tools: ['grinder with dust shroud', 'trowel', 'wire brush', 'moisture meter or plastic-sheet test'],
          materials: ['patching mortar', 'parging mortar (block walls)'],
          safety_ids: ['trench_cavein', 'trench_egress', 'spoil_edge', 'silica_grind'],
          qa_ids: ['cure_dry_surface', 'ties_patched'],
        },
        {
          title: 'Dampproof or waterproof the wall',
          instruction: 'Use the system the plans call for: dampproofing where there is no standing ground water, membrane waterproofing where the soil report or plans show a high water table. Prime as the maker directs, then coat or apply the membrane from the footing up to finish grade, sealing the footing-to-wall joint and every pipe or tie penetration. Recoat thin or dull spots.',
          detail: 'Self-adhered sheet: sealant fillet at inside corners, laps rolled tight, mastic on top edges and T-joints, fishmouths slit and patched. Store solvent primers closed and away from the trench.',
          code_refs: [
            { section: 'R406.1', code_type: 'IRC', note: 'Dampproof walls enclosing below-grade space, footing to finished grade' },
            { section: 'R406.2', code_type: 'IRC', note: 'Waterproofing instead of dampproofing where a high water table exists' },
          ],
          tools: ['roller or spray rig', 'brush', 'J-roller', 'utility knife', 'caulk gun'],
          materials: ['primer per coating maker', 'asphalt dampproofing or waterproofing membrane', 'termination mastic', 'sealant for fillets and penetrations'],
          safety_ids: ['solvent_vapor_trench', 'solvent_exposure', 'flammable_storage', 'skin_chem', 'eye_splash', 'ladder'],
          qa_ids: ['system_matches_plan', 'coverage_continuous', 'membrane_laps', 'vapor_ventilated'],
        },
        {
          title: 'Lay the footing drain to daylight or sump',
          instruction: 'Set perforated pipe beside the footing, not on it, below the slab level, perforations down, on about 2 in. of clean washed stone with about 6 in. over the top, all wrapped in filter fabric. Run a continuous loop with steady fall to a solid pipe that discharges to daylight well away from the house, to an approved storm connection, or to the sump.',
          code_refs: [{ section: 'R405.1', code_type: 'IRC', note: 'Foundation drains around walls that retain earth and enclose below-grade space' }],
          tools: ['laser level', 'shovel', 'hacksaw'],
          materials: ['4 in. perforated drain pipe (socked where specified)', 'solid outlet pipe and fittings', 'washed 1/2–3/4 in. stone', 'filter fabric'],
          safety_ids: ['trench_cavein', 'trench_egress', 'excavation_water', 'spoil_edge'],
          qa_ids: ['drain_beside_footing', 'clean_stone_fabric', 'drain_outlet', 'trench_protected'],
        },
        {
          title: 'Hang protection or drainage board, then backfill',
          instruction: 'Cover the coating with the protection or drainage board the plans call for, top edge under the finish-grade line and terminated so soil cannot get behind it. Keep the work open for any pre-backfill check the AHJ requires, then backfill in lifts with free-draining material, keeping rocks off the board, and grade the ground away from the wall.',
          code_refs: [{ section: 'R401.3', code_type: 'IRC', note: 'Grade lots to drain surface water away from foundation walls' }],
          tools: ['utility knife', 'drill/driver', 'termination bar tools'],
          materials: ['drainage board or protection board', 'termination bar or fasteners per board maker'],
          safety_ids: ['excavation_edge_fall', 'trench_cavein'],
          qa_ids: ['protection_board', 'backfill_care'],
        },
        {
          title: 'Place the under-slab vapor retarder',
          instruction: 'Over the compacted stone base, roll out the vapor retarder with seams lapped and taped, turned up and sealed at walls and footings, and sealed tight around every pipe, post and radon riser. Patch any punctures before the slab inspection and the pour.',
          code_refs: [{ section: 'R506.2.3', code_type: 'IRC', note: 'Vapor retarder between slab and base course, joints lapped' }],
          tools: ['utility knife', 'tape gun'],
          materials: ['polyethylene or reinforced vapor retarder (thickness per plans)', 'seam and pipe-boot tape'],
          safety_ids: ['skin_chem'],
          qa_ids: ['vapor_retarder_continuous', 'sump_pit'],
          gating_inspection_type: 'foundation',
        },
      ],
    },
    {
      id: 'below_grade_commercial',
      example_title: 'Waterproofing & below-grade drainage',
      priority: 10,
      when: { phase: ['foundation'], title_re: TITLE_RE, building_types: ['commercial', 'industrial', 'residential_mf'] },
      steps: [
        {
          title: 'Verify ground water and the substrate',
          instruction: 'Read the geotechnical report and the waterproofing details: if the water table can reach the slab or walls, the job is full waterproofing (or a dewatering system), not dampproofing. Walk the walls with the maker’s rep before priming: cure time met, voids and tie holes filled, high spots ground, no curing compound or form oil the membrane will not bond to.',
          code_refs: [{ section: '1805.1.3', code_type: 'IBC', note: 'Ground-water control system can lower the water table and change the requirement' }],
          tools: ['grinder with dust shroud', 'trowel', 'moisture meter'],
          materials: ['patching mortar', 'parging mortar (block walls)'],
          safety_ids: ['trench_cavein', 'trench_egress', 'silica_grind'],
          qa_ids: ['system_matches_plan', 'cure_dry_surface', 'ties_patched'],
        },
        {
          title: 'Install the membrane and detail every transition',
          instruction: 'Prime as directed, set sealant fillets at inside corners, double-ply corners and joints, flash every penetration and tie-in, then install the membrane with rolled laps and mastic at all terminations. Make walls, slab and any split-slab or deck membrane one continuous system. Flood-test horizontal membrane over occupied space before covering it.',
          code_refs: [
            { section: '1805.3', code_type: 'IBC', note: 'Waterproofing walls and floors where hydrostatic pressure exists' },
            { section: '1805.2', code_type: 'IBC', note: 'Dampproofing where no hydrostatic pressure is expected' },
          ],
          tools: ['roller or spray rig', 'J-roller', 'utility knife', 'caulk gun', 'wet-film gauge'],
          materials: ['primer per membrane maker', 'sheet or fluid-applied waterproofing membrane', 'reinforcing strips', 'termination mastic and sealant', 'reglet or termination bar'],
          safety_ids: ['solvent_vapor_trench', 'solvent_exposure', 'flammable_storage', 'skin_chem', 'eye_splash', 'excavation_edge_fall'],
          qa_ids: ['coverage_continuous', 'membrane_laps', 'flood_test', 'vapor_ventilated'],
        },
        {
          title: 'Subsoil drain, drainage composite and backfill',
          instruction: 'Lay the perimeter subsoil drain in filter-fabric-wrapped clean stone to the sump, storm system or daylight outlet shown, with a check valve where the outlet can back up. Cover the membrane with the drainage composite or protection board before anyone backfills, tie the composite into the drain, and backfill in lifts without bruising the membrane.',
          code_refs: [{ section: '1805.4', code_type: 'IBC', note: 'Subsoil drainage system — gravel base, foundation drain, discharge' }],
          tools: ['laser level', 'utility knife', 'drill/driver'],
          materials: ['perforated drain pipe and solid outlet', 'washed stone', 'filter fabric', 'drainage composite or protection board'],
          safety_ids: ['trench_cavein', 'trench_egress', 'excavation_water', 'spoil_edge'],
          qa_ids: ['drain_outlet', 'clean_stone_fabric', 'protection_board', 'backfill_care', 'trench_protected'],
        },
        {
          title: 'Under-slab vapor retarder',
          instruction: 'Install the specified vapor retarder over the prepared base with seams lapped and taped, turned up at walls and grade beams, and every penetration booted and taped. Repair punctures from rebar chairs and foot traffic before the pre-pour inspection.',
          code_refs: [{ section: '1907.1', code_type: 'IBC', note: 'Slab-on-ground vapor retarder with lapped joints' }],
          tools: ['utility knife', 'tape gun'],
          materials: ['vapor retarder per specification', 'seam tape and pipe boots'],
          safety_ids: ['skin_chem'],
          qa_ids: ['vapor_retarder_continuous'],
          gating_inspection_type: 'foundation',
        },
      ],
    },
  ],
  code_refs: {
    foundation: [
      { section: 'R406.1', code_type: 'IRC', note: 'Dampproofing of concrete and masonry walls enclosing below-grade space', prov: icc },
      { section: 'R406.2', code_type: 'IRC', note: 'Waterproofing where a high water table or severe soil-water condition exists', prov: icc },
      { section: 'R405.1', code_type: 'IRC', note: 'Drains around foundations that retain earth and enclose below-grade space', prov: icc },
      { section: 'R506.2.3', code_type: 'IRC', note: 'Vapor retarder under concrete floor slabs', prov: icc },
      { section: '1805', code_type: 'IBC', note: 'Dampproofing, waterproofing and subsoil drainage of below-grade walls and floors', prov: icc },
      { section: '1907.1', code_type: 'IBC', note: 'Slab-on-ground vapor retarder', prov: icc },
    ],
  },
  equipment: [
    { when: { phase: ['foundation'], title_re: 'drain|waterproof|damp-?proof' }, type: 'skid_steer', reason: 'Move washed stone and drainage board around the foundation and place backfill lifts', optional: true },
  ],
  hazards: [
    { id: 'trench_cavein', hazard: 'Cave-in of the overdig or drain trench while working against the foundation wall', hazard_es: PENDING_ES, controls: ['Slope, bench, shore or shield any excavation 5 ft or deeper before anyone enters', 'Competent person inspects the excavation daily and after rain'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'trench_egress', hazard: 'No quick way out of a deep trench in an emergency', hazard_es: PENDING_ES, controls: ['Provide a ladder, ramp or stair within 25 ft of travel in trenches 4 ft or deeper'], controls_es: PENDING_ES, osha_ref: '1926.651(c)(2)', severity: 3, prov: osha('p') },
    { id: 'spoil_edge', hazard: 'Spoil, stone or rolls of material falling into the excavation', hazard_es: PENDING_ES, controls: ['Keep spoil, stone piles and material at least 2 ft back from the edge or use retaining devices'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 3, prov: osha('p') },
    { id: 'excavation_water', hazard: 'Working in an excavation with accumulated water', hazard_es: PENDING_ES, controls: ['Pump water out or provide the protection the competent person requires before entering', 'Re-check walls after heavy rain'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(1)', severity: 3, prov: osha('p') },
    { id: 'solvent_vapor_trench', hazard: 'Solvent vapors from primers and coatings collecting in a narrow trench or pit', hazard_es: PENDING_ES, controls: ['Test the atmosphere in excavations over 4 ft where vapors can build up', 'Use water-based products or force ventilation in tight overdigs'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)(i)', severity: 4, ppe: ['respirator when the SDS or testing requires'], prov: osha('p') },
    { id: 'solvent_exposure', hazard: 'Breathing solvent and asphalt vapors above exposure limits', hazard_es: PENDING_ES, controls: ['Read the SDS; keep exposure below the listed limits with ventilation or respirators'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 3, ppe: ['organic-vapor respirator when required'], prov: osha('d') },
    { id: 'flammable_storage', hazard: 'Fire from solvent-based primers, adhesives and cleaners', hazard_es: PENDING_ES, controls: ['Keep flammable liquids in approved, closed containers away from heat and the trench', 'No smoking or open flame near priming'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'skin_chem', hazard: 'Skin burns or irritation from asphalt coatings, primers and mastics', hazard_es: PENDING_ES, controls: ['Wear chemical-resistant gloves and long sleeves', 'Clean skin with the cleaner the SDS lists, not solvent'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['chemical-resistant gloves', 'long sleeves'], prov: osha('e') },
    { id: 'eye_splash', hazard: 'Eye injury from spray, splash or grinding chips', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles; add a face shield when spraying overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety goggles'], prov: osha('e') },
    { id: 'silica_grind', hazard: 'Silica dust from grinding fins and patching concrete', hazard_es: PENDING_ES, controls: ['Use a grinder with shroud and vacuum or water as Table 1 lists', 'Do not dry sweep the dust'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator per Table 1'], prov: osha('z') },
    { id: 'excavation_edge_fall', hazard: 'Fall into a deep foundation excavation from the edge', hazard_es: PENDING_ES, controls: ['Guard or barricade excavation edges 6 ft or deeper where they are hard to see', 'Use walkways with guardrails to cross'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(7)(i)', severity: 3, prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip while coating the upper wall from the overdig', hazard_es: PENDING_ES, controls: ['Set the ladder on firm, level footing and extend it 3 ft above the landing'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 2, prov: osha('x') },
  ],
  qa_checklist: [
    { id: 'cure_dry_surface', item: 'Concrete cured for the time the coating maker lists; surface dry, not frozen, and free of form oil or curing compound that blocks bond.', item_es: tr('Concreto curado el tiempo que indica el fabricante del recubrimiento; superficie seca, sin congelar y sin aceite de cimbra ni curador que impida la adherencia.'), prov: v('waterproofing-ufgs-07-11-13', 'waterproofing-ccw-miradri-tds') },
    { id: 'ties_patched', item: 'Form ties cut or snapped and patched, fins ground, voids and honeycomb filled; block walls parged before coating.', item_es: tr('Amarres de cimbra cortados y resanados, rebabas esmeriladas, huecos y panales rellenados; muros de block repellados antes de recubrir.'), prov: v('waterproofing-ufgs-07-13-53', 'waterproofing-basc-dampproof') },
    { id: 'system_matches_plan', item: 'Dampproofing vs. waterproofing matches the plans and soil report — membrane waterproofing used wherever a high water table is shown.', item_es: tr('Impermeabilización asfáltica o membrana según planos y estudio de suelo — membrana donde se indica nivel freático alto.'), prov: { src: ['icc-pa', 'waterproofing-ufgs-07-11-13', 'waterproofing-basc-urban-below-grade', 'waterproofing-icces-esr4925'], confidence: 'verified', last_verified: D } },
    { id: 'coverage_continuous', item: 'Coating or membrane continuous from the footing (over the footing-to-wall joint) up to finish grade, every penetration sealed, no holidays, thin or dull spots.', item_es: tr('Recubrimiento o membrana continua desde la zapata (sobre la junta zapata-muro) hasta el nivel de terreno terminado, cada penetración sellada, sin huecos ni zonas delgadas.'), prov: v('waterproofing-ufgs-07-11-13', 'waterproofing-ufgs-07-13-53', 'icc-pa') },
    { id: 'membrane_laps', item: 'Sheet laps rolled tight (about 2-1/2 in. side, 5 in. end or per maker), fillets at inside corners, mastic at top edges; no fishmouths or wrinkles left.', item_es: tr('Traslapes de la lámina bien rodillados (unas 2-1/2 pulg. laterales y 5 pulg. en extremos o según fabricante), chaflanes en esquinas interiores, mastique en bordes superiores; sin arrugas ni bocas de pez.'), prov: v('waterproofing-ufgs-07-13-53', 'waterproofing-ccw-miradri-tds') },
    { id: 'flood_test', phase: 'foundation', item: 'Horizontal membrane over occupied space ponded about 24 h with no drop in level before it is covered.', item_es: tr('Membrana horizontal sobre espacio ocupado encharcada unas 24 h sin bajar el nivel antes de cubrirla.'), prov: v('waterproofing-ufgs-07-13-53', 'waterproofing-ufgs-07-14-00') },
    { id: 'protection_board', item: 'Protection or drainage board covers all coated wall before backfill, joints butted and top edge terminated so soil cannot get behind.', item_es: tr('Tablero de protección o drenaje cubre todo el muro recubierto antes del relleno, juntas a tope y borde superior rematado para que no entre tierra detrás.'), prov: v('waterproofing-ufgs-07-13-53', 'waterproofing-basc-urban-below-grade') },
    { id: 'drain_beside_footing', item: 'Drain pipe sits beside the footing (not on top), below the slab level, perforations down, as a continuous loop.', item_es: tr('Tubo de drenaje junto a la zapata (no encima), por debajo del nivel de la losa, perforaciones hacia abajo, en circuito continuo.'), prov: v('waterproofing-basc-footing-drain') },
    { id: 'clean_stone_fabric', item: 'Washed stone free of fines about 2 in. under and 6 in. over the pipe, fully wrapped in filter fabric.', item_es: tr('Piedra lavada sin finos, unas 2 pulg. bajo el tubo y 6 pulg. encima, envuelta completamente en tela filtrante.'), prov: v('waterproofing-basc-footing-drain', 'waterproofing-ufgs-33-46-16') },
    { id: 'drain_outlet', item: 'Drain falls to a solid outlet discharging to daylight well away from the building, an approved storm connection, or the sump; outlet protected from backflow and rodents.', item_es: tr('El drenaje cae a un tubo sólido que descarga a la superficie lejos del edificio, a una conexión pluvial aprobada o al cárcamo; salida protegida contra contraflujo y roedores.'), prov: v('waterproofing-basc-footing-drain', 'waterproofing-ufgs-33-46-16') },
    { id: 'sump_pit', item: 'Sump liner at the low point on gravel, tied to the perimeter drain, with a gasketed airtight cover and a check valve on the discharge.', item_es: tr('Forro del cárcamo en el punto más bajo sobre grava, conectado al drenaje perimetral, con tapa hermética con empaque y válvula de retención en la descarga.'), prov: v('waterproofing-basc-sump') },
    { id: 'vapor_retarder_continuous', item: 'Vapor retarder over the stone base with seams lapped 6–12 in. and taped, sealed at walls and around every penetration, punctures patched before the pour.', item_es: tr('Retardador de vapor sobre la base de piedra con traslapes de 6–12 pulg. encintados, sellado en muros y alrededor de cada penetración, perforaciones reparadas antes del colado.'), prov: v('waterproofing-basc-capillary-break', 'icc-pa') },
    { id: 'backfill_care', item: 'Backfill placed in lifts with free-draining material, no rocks or equipment against the board, and finished grade sloping away from the wall.', item_es: tr('Relleno en capas con material que drena, sin piedras ni equipo contra el tablero, y terreno terminado con pendiente hacia afuera del muro.'), prov: v('waterproofing-basc-dampproof', 'icc-pa') },
    { id: 'trench_protected', item: 'Any excavation 5 ft or deeper is sloped, benched or shored before entry, with a ladder within 25 ft and a daily competent-person check.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'vapor_ventilated', item: 'Solvent-based products used in a deep overdig or pit only with atmosphere testing and ventilation; containers closed and stored away from the trench.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'ecfr-1926-d', 'waterproofing-ufgs-07-13-53'], confidence: 'verified', last_verified: D } },
  ],
  inspection_checklists: {
    foundation: [
      { item: 'Dampproofing or waterproofing applied footing to finish grade before backfill (where the AHJ checks before backfill)', item_es: tr('Impermeabilización aplicada de la zapata al nivel de terreno antes del relleno (donde la autoridad lo revisa antes del relleno)'), ref: 'R406.1' },
      { item: 'Waterproofing membrane used where the soil report shows a high water table', item_es: tr('Membrana impermeable donde el estudio de suelo indica nivel freático alto'), ref: 'R406.2' },
      { item: 'Footing drain in stone and fabric beside the footing, discharging to an approved point', item_es: tr('Drenaje de zapata en piedra y tela junto a la zapata, con descarga a un punto aprobado'), ref: 'R405.1' },
      { item: 'Under-slab vapor retarder continuous, lapped, sealed at walls and penetrations', item_es: tr('Retardador de vapor bajo losa continuo, traslapado y sellado en muros y penetraciones'), ref: 'R506.2.3' },
      { item: 'Evaluation report or maker’s instructions on site for the membrane installed', item_es: tr('Reporte de evaluación o instrucciones del fabricante en obra para la membrana instalada') },
    ],
  },
  assemblies: [
    { code: 'B-WP-DAMP-SF', name: 'Asphalt dampproofing, primer + two coats, below-grade wall, per SF', name_es: 'Impermeabilización asfáltica, imprimador + dos manos, muro bajo nivel, por pie²', unit: 'SF', csi: '07 11 13',
      material_cost_cents: { v: 18, prov: est('asphalt emulsion ≈2 gal/100 SF per coat (UFGS 07 11 13 rate) + primer, national baseline 2026') }, labor_hours_per_unit: { v: 0.008, prov: est('spray/roll two coats incl. light prep') },
      equipment_cost_cents: { v: 0, prov: est('sprayer/rollers in labor') }, waste_pct: { v: 10, prov: est('overspray and recoats') } },
    { code: 'B-WP-MEMB-SF', name: 'Self-adhered or fluid-applied waterproofing membrane, below-grade wall or slab, incl. primer and detailing, per SF', name_es: 'Membrana impermeable autoadherible o líquida, muro o losa bajo nivel, con imprimador y detalles, por pie²', unit: 'SF', csi: '07 13 26',
      material_cost_cents: { v: 160, prov: est('60-mil rubberized-asphalt sheet + primer + mastic + reinforcing strips, national baseline 2026') }, labor_hours_per_unit: { v: 0.035, prov: est('prime, fillet, install, roll laps, terminate') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 12, prov: est('laps, corners and double plies') } },
    { code: 'B-WP-DRAINBRD-SF', name: 'Drainage board / composite on below-grade wall, per SF', name_es: 'Tablero / compuesto de drenaje en muro bajo nivel, por pie²', unit: 'SF', csi: '33 46 00',
      material_cost_cents: { v: 65, prov: est('dimpled HDPE or geocomposite drainage board + termination, national baseline 2026') }, labor_hours_per_unit: { v: 0.012, prov: est('hang, butt joints, terminate') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 8, prov: est('cut-offs at corners') } },
    { code: 'B-WP-DRAINTILE-LF', name: 'Foundation footing drain, 4 in. perforated pipe in washed stone and filter fabric, per LF', name_es: 'Drenaje de zapata, tubo perforado de 4 pulg. en piedra lavada y tela filtrante, por pie lineal', unit: 'LF', csi: '33 46 00',
      description: 'Excavation of the overdig is the excavation scope; outlet pipe to daylight priced as part of this LF on typical houses.',
      material_cost_cents: { v: 450, prov: est('pipe + sock ≈$1/LF, ≈0.07 CY washed stone, fabric, share of outlet fittings, national baseline 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('fabric, stone bed, pipe, cover stone, wrap') },
      equipment_cost_cents: { v: 50, prov: est('skid steer share to place stone') }, waste_pct: { v: 5, prov: est('stone over-order') } },
    { code: 'B-WP-SUMP-EA', name: 'Sump basin with gasketed airtight lid, gravel bed and drain tie-in (pump excluded), each', name_es: 'Cárcamo con tapa hermética con empaque, cama de grava y conexión al drenaje (sin bomba), c/u', unit: 'EA', csi: '22 14 29',
      description: 'Pump and discharge are P-PL-SUMP-PUMP-EA.',
      material_cost_cents: { v: 15000, prov: est('perforated basin + gasketed lid + gravel + fittings, national baseline 2026') }, labor_hours_per_unit: { v: 3, prov: est('dig, bed, set liner, tie in drain, seal at slab') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('single unit') } },
    { code: 'B-WP-VR-SF', name: 'Under-slab vapor retarder, 10-mil or heavier, seams taped and penetrations booted, per SF', name_es: 'Retardador de vapor bajo losa, 10 mil o más, juntas encintadas y penetraciones selladas, por pie²', unit: 'SF', csi: '07 26 00',
      material_cost_cents: { v: 22, prov: est('10–15 mil polyolefin sheet + seam tape + pipe boots, national baseline 2026') }, labor_hours_per_unit: { v: 0.003, prov: est('roll out, lap, tape, seal penetrations') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('laps and turn-ups') } },
  ],
  quantity_rules: [
    { code: 'B-WP-VR-SF', assumption: 'Slab-on-grade callout: vapor retarder ≈60% of summed room area as the ground-floor footprint — confirm slab area', when: { facts_any: ['slab_on_grade'] }, qty: { basis: 'area_sf_sum', mul: 0.6, round: 'ceil' } },
    { code: 'B-WP-DAMP-SF', assumption: 'Foundation-wall callout on a house: ≈140 LF of wall × 8 ft below grade dampproofed — confirm wall length and height', when: { facts_any: ['foundation_wall'], building_types: ['residential_sf'] }, qty: { basis: { component: 'foundation_wall' }, mul: 1120 } },
    { code: 'B-WP-DRAINTILE-LF', assumption: 'Foundation-wall callout on a house: ≈150 LF footing drain incl. outlet run — confirm perimeter', when: { facts_any: ['foundation_wall'], building_types: ['residential_sf'] }, qty: { basis: { component: 'foundation_wall' }, mul: 150 } },
    { code: 'B-WP-SUMP-EA', assumption: 'Foundation-wall (basement) callout on a house: one sump basin — remove if the drain runs to daylight', when: { facts_any: ['foundation_wall'], building_types: ['residential_sf'] }, qty: { basis: { component: 'foundation_wall' } } },
  ],
  dependency_hints: [
    { after_trades: ['concrete', 'formwork', 'masonry'], note: 'Waterproofing goes on after the foundation walls are poured or laid and cured, and before backfill and the slab pour.' },
  ],
});
