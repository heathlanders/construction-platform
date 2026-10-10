// Trade Knowledge Pack — insulation (Batt / Blown / Rigid). Wave 01, COMPLEMENT pattern: the hand
// recipe in task-buildout/building.ts keeps producing the work step ("Install insulation & air seal",
// gating `insulation`); this pack adds hazards, Grade-I-style QA, the insulation inspection checklist,
// code refs, glossary and add-on assemblies (air sealing, baffles, rim joist, blown attic, rigid foundation).
// Dossier: docs/trade-packs/dossiers/insulation.md. Sources: ENERGY STAR National Rater Field Checklist
// Rev 12, DOE Building America Solution Center, Insulation Institute (NAIMA), IECC (ref only),
// RESNET/ICC 301 (ref only), 29 CFR 1926 Subparts C, D, E, F, K, M, X, AA.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const oshaPart = { src: ['ecfr-1926'], confidence: 'verified' as const, last_verified: D };
const es = (note?: string) => ({ src: ['energy-star-rater-checklist'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const basc = (id: string) => ({ src: [id], confidence: 'verified' as const, last_verified: D });
const iecc = (note?: string) => ({ src: ['icc-pa'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

export default definePack({
  key: 'insulation',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Thermal insulation of the building envelope — batts, blown loose-fill and rigid foam board in walls, attics, floors, rim joists and foundations — plus the air sealing and baffles that make it work.',
    summary_es: 'Aislamiento térmico de la envolvente del edificio — colchonetas, relleno suelto soplado y placas de espuma rígida en muros, áticos, pisos, vigas perimetrales y cimientos — más el sellado de aire y deflectores que lo hacen funcionar.',
    glossary: [
      { term: 'R-value', term_es: 'Valor R', def: 'How well insulation resists heat flow; higher is better. Printed on the batt facing or bag.', def_es: 'Qué tanto resiste el aislamiento el paso del calor; más alto es mejor. Viene impreso en la colchoneta o la bolsa.' },
      { term: 'Batt', term_es: 'Colchoneta', def: 'Pre-cut blanket of fiberglass or mineral wool sized to fit between studs or joists.', def_es: 'Manta precortada de fibra de vidrio o lana mineral del ancho entre montantes o viguetas.' },
      { term: 'Loose-fill (blown)', term_es: 'Relleno suelto (soplado)', def: 'Cellulose or fiberglass blown by machine into attics or closed cavities.', def_es: 'Celulosa o fibra de vidrio soplada con máquina en áticos o cavidades cerradas.' },
      { term: 'Baffle (rafter vent)', term_es: 'Deflector (ventila de cabio)', def: 'Channel at the eave that keeps insulation off the soffit vents and stops wind from blowing through it.', def_es: 'Canal en el alero que mantiene el aislamiento lejos de las ventilas del sofito y evita que el viento lo atraviese.' },
      { term: 'Air sealing', term_es: 'Sellado de aire', def: 'Caulk, foam or gaskets that close holes and gaps so air cannot leak around the insulation.', def_es: 'Sellador, espuma o empaques que cierran huecos para que el aire no se fugue alrededor del aislamiento.' },
      { term: 'Depth marker (attic ruler)', term_es: 'Marcador de profundidad (regla de ático)', def: 'Card stapled to a truss showing how deep blown insulation must be.', def_es: 'Tarjeta engrapada a una armadura que indica la profundidad requerida del aislamiento soplado.' },
      { term: 'Grade I install', term_es: 'Instalación Grado I', def: 'Best installation grade: insulation fills the cavity with no gaps, voids or compression.', def_es: 'Mejor grado de instalación: el aislamiento llena la cavidad sin huecos, vacíos ni compresión.' },
      { term: 'Vapor retarder', term_es: 'Retardador de vapor', def: 'Layer (kraft facing, poly or special paint) that slows moisture moving into the wall; placement depends on climate zone.', def_es: 'Capa (papel kraft, polietileno o pintura especial) que frena el paso de humedad al muro; su ubicación depende de la zona climática.' },
      { term: 'Rim joist (band joist)', term_es: 'Viga perimetral (viga de borde)', def: 'Outer framing member around a floor — a common air-leak and cold spot.', def_es: 'Pieza de estructura exterior alrededor de un piso — punto común de fugas de aire y frío.' },
      { term: 'Wind washing', term_es: 'Lavado por viento', def: 'Outside air blowing through attic insulation at the eaves, cutting its R-value.', def_es: 'Aire exterior que atraviesa el aislamiento del ático en los aleros y reduce su valor R.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    insulation: [
      { section: 'N1101.10.1', code_type: 'IRC', note: 'Insulation carries a visible R-value mark or installer certificate (IECC R303.1.1)', prov: iecc('IRC Chapter 11 mirrors IECC residential; numbering per 2021 IRC — check adopted edition.') },
      { section: 'N1101.10.1.1', code_type: 'IRC', note: 'Blown/sprayed attic insulation: depth markers facing the access (IECC R303.1.1.1)', prov: iecc('2021 IRC numbering; 2018 IRC lists it as N1101.10.1.') },
      { section: 'N1102.2.3', code_type: 'IRC', note: 'Baffles at soffit/eave vents in vented attics (IECC R402.2.3)', prov: iecc() },
      { section: 'N1102.2.4', code_type: 'IRC', note: 'Attic access hatches insulated and weatherstripped (IECC R402.2.4)', prov: iecc() },
      { section: 'N1102.4.1.1', code_type: 'IRC', note: 'Air barrier and insulation installed per the component table (IECC R402.4.1.1)', prov: iecc() },
    ],
  },
  hazards: [
    { id: 'fiber_dust', hazard: 'Breathing glass, mineral wool or cellulose fibers and dust while cutting, blowing or handling insulation', hazard_es: PENDING_ES, controls: ['Use a respirator (N95 or better) when blowing loose-fill or working in dusty attics', 'Ventilate the work area; keep the blower hopper outdoors when possible'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 2, ppe: ['N95 respirator', 'long sleeves', 'gloves'], prov: osha('e') },
    { id: 'airborne_limits', hazard: 'Dust and chemical vapor exposure (cellulose dust, foam sealant and adhesive vapors) above exposure limits', hazard_es: PENDING_ES, controls: ['Follow the product SDS; keep exposures under the Table 1 limits', 'Use local exhaust or fans in enclosed spaces'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, prov: osha('d') },
    { id: 'eye_fibers', hazard: 'Eye irritation or injury from fibers, blown material and spray foam', hazard_es: PENDING_ES, controls: ['Wear safety glasses with side shields; goggles when blowing or spraying overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety goggles'], prov: osha('e') },
    { id: 'fall_through_ceiling', hazard: 'Falling through drywall ceiling between attic joists or trusses', hazard_es: PENDING_ES, controls: ['Step only on framing or on walk boards laid across joists', 'Confirm the attic framing can carry workers before entering'], controls_es: PENDING_ES, osha_ref: '1926.501(a)(2)', severity: 3, prov: osha('m') },
    { id: 'open_holes', hazard: 'Falling through open stairwells, chases or attic hatch openings more than 6 ft above the floor below', hazard_es: PENDING_ES, controls: ['Cover or guard open holes before insulating around them', 'Mark covers so nobody removes them'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip at the attic hatch or while insulating high walls', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the access landing or use a grab point', 'Set on firm footing; keep three points of contact while carrying bags'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'live_wiring', hazard: 'Electric shock from energized wiring, splices or fixtures in walls and attics', hazard_es: PENDING_ES, controls: ['Find out which circuits are live before working near them; de-energize where possible', 'Never staple through or compress cables; do not cut insulation near open splices'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 3, prov: osha('k') },
    { id: 'attic_heat', hazard: 'Heat stress in hot attics', hazard_es: PENDING_ES, controls: ['Schedule attic work for the cooler part of the day; take shade and water breaks', 'Train the crew to spot heat illness signs; work in pairs'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
    { id: 'confined_attic', hazard: 'Tight attics or crawlspaces that may qualify as confined spaces (poor air, hard exit)', hazard_es: PENDING_ES, controls: ['Have a competent person evaluate the space before entry', 'Keep the exit path clear and a second person outside'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 3, prov: oshaPart },
    { id: 'foam_fire', hazard: 'Fire from foam board, foam sealant or kraft facing near heat, lights or open flame', hazard_es: PENDING_ES, controls: ['No smoking or open flame near foam and facings', 'Keep work lights and heaters away from insulation materials'], controls_es: PENDING_ES, osha_ref: '1926.151(a)(3)', severity: 3, prov: oshaPart },
  ],
  qa_checklist: [
    { id: 'rvalue_matches', phase: 'insulation', item: 'Installed R-value matches the plan or energy compliance report for every assembly (walls, ceilings, floors, rim, slab edge).', item_es: { status: 'translated', text: 'El valor R instalado coincide con el plano o el reporte de cumplimiento energético en cada ensamble (muros, techos, pisos, viga perimetral, borde de losa).' }, prov: es('Item 1.2') },
    { id: 'grade_one', phase: 'insulation', item: 'Cavities filled edge to edge with no gaps, voids, misalignment or compression (Grade I); batts split around wires and pipes, not stuffed behind them.', item_es: { status: 'translated', text: 'Cavidades llenas de lado a lado sin huecos, vacíos, desalineación ni compresión (Grado I); colchonetas divididas alrededor de cables y tubos, no metidas detrás.' }, prov: { src: ['energy-star-rater-checklist', 'resnet-301'], confidence: 'verified', last_verified: D, note: 'Grade I defined in ANSI/RESNET/ICC 301 (ref only).' } },
    { id: 'labels_cert', phase: 'insulation', item: 'R-value labels visible on batts or bags, or the installer certificate posted with type, R-value and installed thickness.', item_es: { status: 'translated', text: 'Etiquetas de valor R visibles en colchonetas o bolsas, o certificado del instalador colocado con tipo, valor R y espesor instalado.' }, prov: iecc('IECC R303.1.1') },
    { id: 'air_seal_first', phase: 'insulation', item: 'Top plates, wire and pipe penetrations, flue chases and duct boots sealed before insulation covers them.', item_es: { status: 'translated', text: 'Placas superiores, pasos de cables y tubos, ductos de chimenea y bocas de ducto sellados antes de que el aislamiento los cubra.' }, prov: es('Section 4 — reduced air leakage') },
    { id: 'aligned_air_barrier', phase: 'insulation', item: 'Insulation touches a complete air barrier on every side required (knee walls, tubs/showers on exterior walls, dropped soffits, rim joists).', item_es: { status: 'translated', text: 'El aislamiento toca una barrera de aire completa en cada lado requerido (muros enanos, tinas/regaderas en muros exteriores, plafones bajos, vigas perimetrales).' }, prov: { src: ['energy-star-rater-checklist', 'doe-basc-ins-aligned-ab'], confidence: 'verified', last_verified: D } },
    { id: 'baffles_eaves', phase: 'insulation', item: 'Baffles in every rafter bay with a soffit vent, extending above the finished insulation height so vents stay open and wind cannot wash the insulation.', item_es: { status: 'translated', text: 'Deflectores en cada espacio entre cabios con ventila de sofito, por encima de la altura final del aislamiento para mantener las ventilas abiertas y evitar el lavado por viento.' }, prov: { src: ['doe-basc-ins-baffles', 'doe-basc-ins-windwash', 'energy-star-rater-checklist'], confidence: 'verified', last_verified: D } },
    { id: 'full_height_eaves', phase: 'insulation', item: 'Ceiling insulation reaches full depth over the top plate of exterior walls (raised-heel truss or high-density insulation where space is tight).', item_es: { status: 'translated', text: 'El aislamiento del techo alcanza su profundidad completa sobre la placa superior de los muros exteriores (armadura de talón alto o aislamiento de alta densidad donde falta espacio).' }, prov: es('Item 3.1') },
    { id: 'depth_markers', phase: 'insulation', item: 'Blown attic insulation leveled to the target settled depth; depth markers about every 300 SF, facing the attic access.', item_es: { status: 'translated', text: 'Aislamiento soplado del ático nivelado a la profundidad asentada objetivo; marcadores de profundidad aproximadamente cada 300 pie², orientados hacia el acceso del ático.' }, prov: iecc('IECC R303.1.1.1 — spacing paraphrased; check adopted edition.') },
    { id: 'attic_hatch', phase: 'insulation', item: 'Attic hatch or pull-down stair insulated and weatherstripped, with a dam keeping loose-fill from spilling.', item_es: { status: 'translated', text: 'Escotilla o escalera plegable del ático aislada y con burlete, con un tope que evita que el relleno suelto se derrame.' }, prov: { src: ['energy-star-rater-checklist', 'icc-pa'], confidence: 'verified', last_verified: D, note: 'ENERGY STAR Item 4.10; IECC R402.2.4.' } },
    { id: 'recessed_lights', phase: 'insulation', item: 'Recessed lights touching insulation are IC-rated and airtight (ICAT); non-IC fixtures keep the clearance the fixture label requires.', item_es: PENDING_ES, safety: true, prov: es('Item 4.2') },
    { id: 'chimney_clearance', phase: 'insulation', item: 'Required clearance kept between insulation and chimneys, flues and other heat sources, with a noncombustible dam; only noncombustible material touches the flue.', item_es: PENDING_ES, safety: true, prov: { src: ['naima-library', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'Clearance distance comes from the appliance/flue listing; check the listing on site.' } },
    { id: 'foam_covered', phase: 'insulation', item: 'Foam plastic insulation in living spaces and attics covered by an approved thermal or ignition barrier unless the product is listed for exposed use.', item_es: PENDING_ES, safety: true, prov: iecc('IRC R316 foam plastic — paraphrased.') },
    { id: 'vapor_retarder', phase: 'insulation', item: 'Vapor retarder class and side match the climate zone in the plan (warm-in-winter side in cold zones); no double vapor barriers.', item_es: { status: 'translated', text: 'La clase y el lado del retardador de vapor coinciden con la zona climática del plano (lado cálido en invierno en zonas frías); sin doble barrera de vapor.' }, prov: iecc('IRC R702.7 vapor retarders — paraphrased.') },
    { id: 'rim_joists', phase: 'insulation', item: 'Rim and band joists insulated and air sealed on the inside (rigid foam sealed at edges or spray foam).', item_es: { status: 'translated', text: 'Vigas perimetrales aisladas y selladas por dentro (espuma rígida sellada en bordes o espuma en aerosol).' }, prov: es('Item 2.7') },
    { id: 'slab_edge', phase: 'foundation', item: 'Slab edge or foundation rigid insulation continuous to the specified depth, top edge protected, no gaps at corners.', item_es: { status: 'translated', text: 'Aislamiento rígido del borde de losa o cimiento continuo hasta la profundidad especificada, borde superior protegido, sin huecos en las esquinas.' }, prov: es('Item 3.2') },
  ],
  inspection_checklists: {
    insulation: [
      { item: 'Insulation type and R-value match the approved energy compliance documents', item_es: PENDING_ES, ref: 'IECC R402.1' },
      { item: 'R-value labels or installer certificate visible for the inspector', item_es: PENDING_ES, ref: 'IECC R303.1.1' },
      { item: 'Air sealing complete at top plates, penetrations, chases, tubs and rim joists before cover', item_es: PENDING_ES, ref: 'IECC R402.4.1.1' },
      { item: 'Cavity insulation fills cavities fully — no gaps, voids or compression', item_es: PENDING_ES },
      { item: 'Eave baffles installed in vented attics; access hatch insulated and weatherstripped', item_es: PENDING_ES, ref: 'IECC R402.2.3 / R402.2.4' },
      { item: 'Clearances kept at recessed lights, chimneys and flues; IC-rated fixtures where covered', item_es: PENDING_ES },
      { item: 'Vapor retarder installed per climate zone where required', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Attic blown insulation at target depth with depth markers facing the access', item_es: PENDING_ES, ref: 'IECC R303.1.1.1' },
      { item: 'Installer insulation certificate posted near the electrical panel or attic access', item_es: PENDING_ES, ref: 'IECC R401.3' },
    ],
  },
  assemblies: [
    { code: 'B-INS-BLOWN-ATTIC-SF', name: 'Blown loose-fill attic insulation (cellulose or fiberglass), ~R-49, per SF of attic floor', name_es: 'Aislamiento soplado de relleno suelto en ático (celulosa o fibra de vidrio), ~R-49, por pie² de piso de ático', unit: 'SF', csi: '07 21 26',
      material_cost_cents: { v: 85, prov: est('loose-fill bags at ~R-49 coverage, national baseline 2026') }, labor_hours_per_unit: { v: 0.005, prov: est('2-person blowing crew ~1,500–2,000 SF/day incl. setup') },
      equipment_cost_cents: { v: 5, prov: est('blowing machine rental/ownership share') }, waste_pct: { v: 5, prov: est('hopper and hose losses') } },
    { code: 'B-INS-RIGID-FDN-SF', name: 'Rigid foam board insulation at foundation wall or slab edge, ~2 in., per SF', name_es: 'Placa de espuma rígida en muro de cimiento o borde de losa, ~2 in, por pie²', unit: 'SF', csi: '07 21 13',
      material_cost_cents: { v: 125, prov: est('XPS/EPS/polyiso 2 in. board + fasteners/adhesive, 2026') }, labor_hours_per_unit: { v: 0.02, prov: est('cut, adhere/fasten and tape seams') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 8, prov: est('cut-offs at corners and steps') } },
    { code: 'B-INS-AIRSEAL-EA', name: 'Whole-house air sealing package (top plates, penetrations, chases, hatch, rim) per dwelling', name_es: 'Paquete de sellado de aire de toda la casa (placas superiores, pasos, ductos, escotilla, viga perimetral) por vivienda', unit: 'EA', csi: '07 27 00',
      material_cost_cents: { v: 25000, prov: est('foam sealant, caulk, gaskets, fire-rated sealant for a ~2,000 SF house') }, labor_hours_per_unit: { v: 10, prov: est('one installer ~1.25 days pre-drywall') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('consumables priced per house') } },
    { code: 'B-INS-BAFFLE-EA', name: 'Attic eave baffle (rafter vent) installed, each bay', name_es: 'Deflector de alero de ático (ventila de cabio) instalado, por espacio', unit: 'EA', csi: '07 21 26',
      material_cost_cents: { v: 150, prov: est('foam or cardboard rafter vent, 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('fit and staple per bay incl. dam') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('damaged pieces') } },
    { code: 'B-INS-RIM-LF', name: 'Rim / band joist insulation and air seal (rigid + foam or spray foam) per LF', name_es: 'Aislamiento y sellado de viga perimetral (rígido + espuma o espuma en aerosol) por pie lineal', unit: 'LF', csi: '07 21 00',
      material_cost_cents: { v: 300, prov: est('cut rigid foam + canned foam, or 2-component kit share, 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('cut, fit and seal each joist bay') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('foam board cut-offs') } },
  ],
  quantity_rules: [
    { code: 'B-INS-AIRSEAL-EA', assumption: 'One whole-house air sealing package per residential dwelling', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'B-INS-BAFFLE-EA', assumption: '≈1 eave baffle per 40 SF of floor area (two eaves, 24 in. bays) until the roof is measured', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.025, round: 'ceil' } },
    { code: 'B-INS-RIM-LF', assumption: 'Rim joist length ≈ perimeter ≈ 0.09 LF per SF of floor area (square-ish plan) until measured', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.09, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['electrical', 'plumbing', 'hvac'], before_phase: 'drywall', note: 'Insulate after MEP rough-in passes and before drywall; the insulation inspection is the last look inside the walls.' },
  ],
});
