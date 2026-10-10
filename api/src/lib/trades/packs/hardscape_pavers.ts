// Trade Knowledge Pack — hardscape_pavers (Hardscape / Pavers — patios, walks, driveways, outdoor-kitchen
// bases, low seat walls). Wave 04, NEW-TRADE pattern without a permit path (permit_trade null): no gates,
// no code_refs — owner/GC hold points live in inspection_checklists. Dossier:
// docs/trade-packs/dossiers/hardscape_pavers.md. Sources: UFGS 32 14 13.13, ICPI Tech Spec 18 (PICP),
// Rochester Concrete Products / Unilock / Belgard install guides, 29 CFR 1926 (C, D, E, I, O, P, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['hardscape_pavers-ufgs-32-14-13-13'], confidence: 'verified' as const, last_verified: D };
const picp = { src: ['hardscape_pavers-icpi-ts18-picp'], confidence: 'verified' as const, last_verified: D };
const guide = { src: ['hardscape_pavers-rcp-install-guide', 'hardscape_pavers-unilock-base-prep'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'hardscape_pavers',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Segmental concrete, clay or stone pavers for patios, walks and driveways (standard and permeable), plus the base for outdoor kitchens and low seat walls: excavation, compacted aggregate base, bedding, laying, edge restraint and joint fill.',
    summary_es: 'Adoquines segmentados de concreto, arcilla o piedra para patios, andadores y entradas de auto (estándar y permeables), más la base para cocinas exteriores y muretes bajos: excavación, base de agregado compactada, cama de asiento, colocación, restricción de borde y relleno de juntas.',
    glossary: [
      { term: 'Bedding sand', term_es: 'Arena de asiento', def: 'Coarse sand screeded about 1 in. thick on the compacted base; the pavers are set and vibrated into it.', def_es: 'Arena gruesa enrasada a unos 2.5 cm sobre la base compactada; los adoquines se asientan y vibran sobre ella.' },
      { term: 'Edge restraint', term_es: 'Restricción de borde', def: 'Plastic, aluminum, steel or concrete edging that keeps the outer pavers from creeping sideways.', def_es: 'Borde de plástico, aluminio, acero o concreto que evita que los adoquines exteriores se corran hacia los lados.' },
      { term: 'Polymeric sand', term_es: 'Arena polimérica', def: 'Joint sand with a binder that hardens after wetting; resists washout, weeds and ants.', def_es: 'Arena para juntas con aglutinante que endurece al mojarse; resiste deslave, maleza y hormigas.' },
      { term: 'Plate compactor', term_es: 'Compactadora de placa', def: 'Vibrating plate used to compact the base in lifts and to seat the pavers.', def_es: 'Placa vibratoria para compactar la base por capas y asentar los adoquines.' },
      { term: 'Screed', term_es: 'Enrasar (regla)', def: 'Dragging a straight board over rails to strike the bedding sand to an even thickness.', def_es: 'Pasar una regla recta sobre guías para dejar la arena de asiento con espesor uniforme.' },
      { term: 'Soldier course', term_es: 'Hilada de soldado', def: 'Row of pavers laid end-to-end along the border, often against the edge restraint.', def_es: 'Hilera de adoquines colocados uno tras otro en el borde, normalmente contra la restricción de borde.' },
      { term: 'Geotextile', term_es: 'Geotextil', def: 'Filter fabric between soft or wet soil and the aggregate base that keeps the soil from pumping up.', def_es: 'Tela filtrante entre suelo blando o húmedo y la base de agregado que evita que el suelo suba.' },
      { term: 'Permeable pavers (PICP)', term_es: 'Adoquines permeables (PICP)', def: 'Pavers with wide joints filled with small clean stone over an open-graded stone base that stores and drains rainwater.', def_es: 'Adoquines con juntas anchas rellenas de piedra limpia sobre una base de piedra de granulometría abierta que almacena y drena la lluvia.' },
      { term: 'Herringbone', term_es: 'Espiga', def: 'Zig-zag laying pattern with the best interlock; the usual choice where cars drive.', def_es: 'Patrón en zigzag con el mejor trabado; el usual donde circulan autos.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'paver_patio_walk',
      example_title: 'Install paver patio / walk — base, bedding, pavers, edge restraint & joint sand',
      when: { title_re: '\\bpavers?\\b|hardscape|brick (?:patio|walk)|interlocking (?:concrete )?pav|outdoor kitchen' },
      steps: [
        {
          title: 'Locate utilities, lay out and excavate',
          instruction: 'Confirm the 811 locate ticket and marks before digging. Stake the outline and set string lines at finished height with fall away from the house. Excavate to pavers + 1 in. bedding + compacted base depth: about 4–6 in. of base for patios and walks, 8–12 in. for driveways (deeper on clay or wet soil). Hand-dig near marked lines.',
          tools: ['stakes and string line', 'line level / transit', 'shovel', 'tape'],
          materials: ['marking paint', 'stakes'],
          safety_ids: ['utility_strike', 'skid_steer_struck', 'dump_truck_backing', 'heat_illness'],
          qa_ids: ['locate_ticket', 'excavation_depth_by_use', 'slope_drainage'],
        },
        {
          title: 'Compact subgrade and build the base in lifts',
          instruction: 'Compact the subgrade. Lay geotextile where the soil is soft, clay or stays wet. Spread dense-graded crushed aggregate base and compact it in lifts no thicker than 4 in., wetting but not soaking it. Grade the top of base to the same slope as the finished surface.',
          tools: ['plate compactor', 'rake', 'straightedge (10 ft)', 'level'],
          materials: ['geotextile (where needed)', 'dense-graded crushed aggregate base'],
          safety_ids: ['compactor_noise', 'compactor_crush', 'manual_lifting'],
          qa_ids: ['geotextile_where_needed', 'base_lifts_compacted', 'base_smoothness'],
        },
        {
          title: 'Set edge restraint and screed bedding sand',
          instruction: 'Install edge restraint on the compacted base along every edge that is not held by a wall, curb or slab. Lay screed rails and strike coarse bedding sand to an even 1 in. loose layer. Do not use sand to fill low spots in the base, and do not walk on the screeded sand.',
          tools: ['screed rails (1 in. pipe)', 'screed board', 'trowel', 'hammer'],
          materials: ['edge restraint + spikes', 'bedding sand (coarse, washed)'],
          safety_ids: ['manual_lifting', 'heat_illness'],
          qa_ids: ['edge_restraint', 'bedding_sand'],
        },
        {
          title: 'Lay and cut pavers',
          instruction: 'Start from a straight edge or corner and work forward from the pavers already laid, not on the sand. Keep joints 1/16–3/16 in. and pull string lines to hold the pattern straight; use herringbone where cars drive. Cut with a wet saw or splitter so no piece is smaller than about one third of a unit and no gap at the edges is over 1/4 in. Wash cutting slurry off the pavers right away.',
          tools: ['wet masonry saw or handheld saw with water feed', 'paver splitter', 'rubber mallet', 'string line'],
          materials: ['pavers', 'border / soldier-course units'],
          safety_ids: ['silica_cutting', 'saw_kickback', 'flying_chips', 'manual_lifting'],
          qa_ids: ['wet_cutting', 'laying_joints_cuts'],
        },
        {
          title: 'Compact, fill joints and final pass',
          instruction: 'Seat the pavers with at least three passes of the plate compactor (use a protective pad on textured or colored units), staying 5 ft back from any edge without restraint. Sweep joint sand or polymeric sand in and vibrate until the joints stay full. For polymeric sand, blow every grain off the surface, then wet it exactly as the bag says. Keep traffic off until joints are full and the surface is swept.',
          tools: ['plate compactor with pad', 'push broom', 'leaf blower', 'hose with shower nozzle'],
          materials: ['jointing sand or polymeric sand'],
          safety_ids: ['compactor_noise', 'compactor_crush', 'silica_cutting'],
          qa_ids: ['seating_passes', 'joint_fill', 'finished_tolerances'],
        },
      ],
    },
    {
      id: 'permeable_pavers',
      priority: 10,
      example_title: 'Install permeable paver driveway (PICP)',
      when: { title_re: 'permeable|\\bPICP\\b|pervious pav' },
      steps: [
        {
          title: 'Locate utilities and excavate the reservoir',
          instruction: 'Confirm locates, then excavate to the designed depth of subbase, base, bedding and pavers. Keep the system downslope of the house and away from basement walls. Do not over-compact the subgrade unless the design calls for it — compaction cuts infiltration.',
          tools: ['string line', 'transit / laser level', 'shovel'],
          materials: ['marking paint', 'stakes'],
          safety_ids: ['utility_strike', 'skid_steer_struck', 'dump_truck_backing', 'heat_illness'],
          qa_ids: ['locate_ticket'],
        },
        {
          title: 'Place geotextile and open-graded stone layers',
          instruction: 'Line the excavation sides (and the bottom if the design shows it) with geotextile. Place clean open-graded subbase stone (typically ASTM No. 2) and base stone (No. 57) in lifts, compacting each lift with the plate or roller as specified. Install any underdrain the design calls for.',
          tools: ['plate compactor or roller', 'rake', 'straightedge'],
          materials: ['geotextile', 'No. 2 subbase stone', 'No. 57 base stone', 'underdrain pipe (if designed)'],
          safety_ids: ['compactor_noise', 'compactor_crush', 'dump_truck_backing'],
          qa_ids: ['picp_layers', 'geotextile_where_needed'],
        },
        {
          title: 'Screed bedding stone and set edge restraint',
          instruction: 'Install a solid edge restraint. Screed about 2 in. of clean No. 8 stone as the bedding layer — not sand.',
          tools: ['screed rails', 'screed board'],
          materials: ['concrete or heavy edge restraint', 'No. 8 bedding stone'],
          safety_ids: ['manual_lifting'],
          qa_ids: ['edge_restraint', 'picp_layers'],
        },
        {
          title: 'Lay pavers, fill joints with stone, compact',
          instruction: 'Lay the permeable units in the specified pattern (at least 80 mm / 3 1/8 in. thick where cars drive). Sweep No. 8, 89 or 9 stone into the joints, compact, top up the joints and sweep the surface clean. Never use sand or polymeric sand in permeable joints.',
          tools: ['plate compactor with pad', 'wet saw', 'push broom'],
          materials: ['permeable pavers', 'No. 8 / 89 / 9 joint stone'],
          safety_ids: ['silica_cutting', 'saw_kickback', 'compactor_noise', 'manual_lifting'],
          qa_ids: ['picp_units_joints', 'wet_cutting', 'laying_joints_cuts', 'finished_tolerances'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'paver|hardscape|permeable|PICP|compact' }, type: 'compactor', reason: 'Vibratory plate to compact base lifts and seat the pavers' },
    { when: { title_re: 'driveway|permeable|PICP|excavat' }, type: 'skid_steer', reason: 'Dig the box and move base stone and paver pallets', optional: true },
    { when: { building_types: ['commercial', 'residential_mf'] }, type: 'skid_steer', reason: 'Larger paved areas — dig and place base by machine', optional: true },
    { when: { title_re: 'driveway|permeable|PICP|excavat' }, type: 'dump_truck', reason: 'Haul spoil off and deliver base stone', optional: true },
  ],
  hazards: [
    { id: 'silica_cutting', hazard: 'Breathing silica dust when cutting pavers, wall block or stone with a saw', hazard_es: PENDING_ES, controls: ['Cut with a saw that feeds water to the blade, as Table 1 of the silica standard lists for the saw', 'Wear the respirator Table 1 lists when cutting more than 4 hours a shift; never dry-cut in the open', 'Wash slurry off and keep others out of the cutting area'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator per Table 1', 'safety glasses', 'hearing protection'], prov: osha('z') },
    { id: 'utility_strike', hazard: 'Striking buried gas, electric or water lines while excavating', hazard_es: PENDING_ES, controls: ['Get an 811 locate and wait for marks before digging', 'Hand-dig or vacuum-excavate near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'compactor_noise', hazard: 'Hearing damage from plate compactors and saws', hazard_es: PENDING_ES, controls: ['Wear hearing protection while running compactors and saws', 'Rotate operators; keep idle crew back from the machine'], controls_es: PENDING_ES, osha_ref: '1926.52(d)(1)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'compactor_crush', hazard: 'Feet or hands caught under a plate compactor, or the plate walking away on a slope', hazard_es: PENDING_ES, controls: ['Wear safety-toe boots; keep feet clear of the plate', 'Work slopes across, not straight down; shut off before lifting or moving the machine'], controls_es: PENDING_ES, osha_ref: '1926.96', severity: 2, ppe: ['safety-toe boots'], prov: osha('e') },
    { id: 'skid_steer_struck', hazard: 'Struck or pinned by a skid steer or its raised bucket', hazard_es: PENDING_ES, controls: ['Never stand or work under a raised bucket; lower it when parked', 'Keep people out of the swing and travel path; use a spotter in tight yards'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(i)', severity: 4, prov: osha('o') },
    { id: 'dump_truck_backing', hazard: 'Struck by a backing dump truck delivering stone or hauling spoil', hazard_es: PENDING_ES, controls: ['Back up only with a working reverse alarm or a spotter signalling', 'Keep the crew out of the backing path'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'manual_lifting', hazard: 'Back and hand strains from lifting pavers, wall block and caps all day', hazard_es: PENDING_ES, controls: ['Stage pallets close to the work; use paver clamps and carts', 'Team-lift heavy caps and wall units; rotate tasks'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 2, ppe: ['gloves'], prov: osha('c') },
    { id: 'heat_illness', hazard: 'Heat illness working on sun-heated base and pavers', hazard_es: PENDING_ES, controls: ['Train the crew on heat-illness signs; provide water, shade and rest breaks', 'Start early on hot days and watch new workers closely'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
    { id: 'flying_chips', hazard: 'Eye injuries from chips when splitting or cutting pavers', hazard_es: PENDING_ES, controls: ['Wear safety glasses with side shields while cutting or splitting', 'Keep others clear of the cutting station'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'saw_kickback', hazard: 'Cuts and kickback from handheld cut-off saws', hazard_es: PENDING_ES, controls: ['Keep the blade guard in place and support the paver on a stable surface', 'Use the right diamond blade; never stand in line with the blade'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, ppe: ['safety glasses', 'gloves'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'locate_ticket', phase: 'sitework', item: 'A valid 811 locate ticket is on file and the marks are visible before any digging.', item_es: PENDING_ES, safety: true, prov: { src: ['hardscape_pavers-rcp-install-guide', 'ecfr-1926-p'], confidence: 'verified', last_verified: D } },
    { id: 'excavation_depth_by_use', phase: 'sitework', item: 'Compacted base depth matches use: about 4–6 in. for patios and walks, 8–12 in. for driveways; deeper end on clay, fill or poorly drained soil.', item_es: tr('La profundidad de base compactada corresponde al uso: unas 4–6 pulg. para patios y andadores, 8–12 pulg. para entradas de auto; el lado más profundo en arcilla, relleno o suelo mal drenado.'), prov: guide },
    { id: 'geotextile_where_needed', phase: 'sitework', item: 'Geotextile is placed over soft, clay or frequently wet subgrade (and on the sides of permeable systems).', item_es: tr('Se coloca geotextil sobre subrasante blanda, arcillosa o húmeda con frecuencia (y en los costados de sistemas permeables).'), prov: { src: ['hardscape_pavers-rcp-install-guide', 'hardscape_pavers-icpi-ts18-picp'], confidence: 'verified', last_verified: D } },
    { id: 'base_lifts_compacted', phase: 'sitework', item: 'Dense-graded base placed and compacted in lifts of 4 in. or less until the plate leaves no mark; meet any density test the project specifies.', item_es: tr('Base de granulometría densa colocada y compactada en capas de 4 pulg. o menos hasta que la placa no deje marca; cumplir cualquier prueba de densidad que pida el proyecto.'), prov: { src: ['hardscape_pavers-rcp-install-guide', 'hardscape_pavers-ufgs-32-14-13-13'], confidence: 'derived', last_verified: D, note: 'Lift limit from the manufacturer guide; UFGS defers base density to the project base-course spec.' } },
    { id: 'base_smoothness', phase: 'sitework', item: 'Top of base is within 3/8 in. under a 10 ft straightedge and follows the finished slope.', item_es: tr('La parte superior de la base queda dentro de 3/8 pulg. bajo una regla de 10 pies y sigue la pendiente final.'), prov: ufgs },
    { id: 'slope_drainage', phase: 'sitework', item: 'Finished surface falls away from the building to a drain or lawn — at least about 1 in. per 8 ft (≈1%); about 2% is the common target.', item_es: tr('La superficie terminada cae alejándose del edificio hacia un drenaje o césped — al menos 1 pulg. por cada 8 pies (≈1%); cerca de 2% es la meta común.'), prov: { src: ['hardscape_pavers-rcp-install-guide'], confidence: 'derived', last_verified: D, note: 'Guide: ≈1 in. per 8 ft for patios; its permeable cross-section shows a 2% minimum to the drainage feature.' } },
    { id: 'edge_restraint', item: 'Edge restraint installed on compacted base along every edge not held by a wall, curb or slab, before laying pavers.', item_es: tr('Restricción de borde instalada sobre base compactada en todo borde no contenido por muro, guarnición o losa, antes de colocar los adoquines.'), prov: ufgs },
    { id: 'bedding_sand', item: 'Bedding sand screeded to an even 1 in. loose layer (±1/4 in.), not used to fill base low spots, not walked on.', item_es: tr('Arena de asiento enrasada a una capa suelta uniforme de 1 pulg. (±1/4 pulg.), sin usarla para rellenar bajos de la base y sin pisarla.'), prov: ufgs },
    { id: 'wet_cutting', item: 'All saw cutting is done wet (water fed to the blade) or with the control Table 1 lists; slurry washed off the same day.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-z', 'hardscape_pavers-belgard-trg'], confidence: 'verified', last_verified: D } },
    { id: 'seating_passes', item: 'Pavers seated with at least three plate-compactor passes; no compaction within 5 ft of an edge without restraint.', item_es: tr('Adoquines asentados con al menos tres pasadas de compactadora; sin compactar a menos de 5 pies de un borde sin restricción.'), prov: ufgs },
    { id: 'finished_tolerances', item: 'Finished surface within 3/8 in. under a 10 ft straightedge, flush to 1/4 in. above edges and drains, and within 1/2 in. of planned grade.', item_es: tr('Superficie terminada dentro de 3/8 pulg. bajo regla de 10 pies, a ras hasta 1/4 pulg. sobre bordes y drenajes, y dentro de 1/2 pulg. del nivel de proyecto.'), prov: ufgs },
    { id: 'picp_layers', item: 'Permeable layers as designed: open-graded No. 2 subbase, No. 57 base, about 2 in. No. 8 bedding — no sand anywhere in the section.', item_es: tr('Capas permeables según diseño: subbase abierta No. 2, base No. 57, unas 2 pulg. de cama No. 8 — sin arena en ninguna capa.'), prov: picp },
    { id: 'laying_joints_cuts', item: 'Joints 1/16–3/16 in. with straight pattern lines; no cut piece smaller than about one third of a unit (no slivers); gaps at edges and drains 1/4 in. or less.', item_es: tr('Juntas de 1/16–3/16 pulg. con líneas rectas; ninguna pieza cortada menor a un tercio de pieza (sin astillas); huecos en bordes y drenajes de 1/4 pulg. o menos.'), prov: { src: ['hardscape_pavers-ufgs-32-14-13-13', 'hardscape_pavers-belgard-trg'], confidence: 'derived', last_verified: D, note: 'Joint width, gap and no-sliver rules from UFGS; one-third rule is Belgard guidance for tire-loaded areas, applied as best practice everywhere.' } },
    { id: 'joint_fill', item: 'Joint sand swept and vibrated in until joints stay full and excess swept off before traffic; polymeric sand blown off the surface and wetted exactly per its maker (no haze).', item_es: tr('Arena de juntas barrida y vibrada hasta que queden llenas y el exceso barrido antes del tránsito; la arena polimérica se sopla de la superficie y se moja exactamente según su fabricante (sin velo).'), prov: { src: ['hardscape_pavers-ufgs-32-14-13-13', 'hardscape_pavers-rcp-install-guide'], confidence: 'verified', last_verified: D } },
    { id: 'picp_units_joints', item: 'Permeable units at least 80 mm (3 1/8 in.) thick where vehicles drive (60 mm only for foot traffic); joints filled with clean No. 8, 89 or 9 stone and topped up after compaction.', item_es: tr('Piezas permeables de al menos 80 mm (3 1/8 pulg.) donde circulan vehículos (60 mm solo peatonal); juntas con piedra limpia No. 8, 89 o 9 recargadas después de compactar.'), prov: picp },
  ],
  inspection_checklists: {
    base_compaction_check: [
      { item: 'Excavation depth and compacted base thickness match the use (patio/walk vs driveway)', item_es: tr('La profundidad de excavación y el espesor de base compactada corresponden al uso (patio/andador vs entrada de auto)'), ref: 'mfr install guide' },
      { item: 'Geotextile in place where soils call for it', item_es: tr('Geotextil colocado donde el suelo lo requiere') },
      { item: 'Base compacted in lifts, smooth to a 10 ft straightedge and sloped to drain', item_es: tr('Base compactada por capas, lisa bajo regla de 10 pies y con pendiente para drenar'), ref: 'UFGS 32 14 13.13' },
      { item: 'Edge restraint set on compacted base before bedding goes down', item_es: tr('Restricción de borde colocada sobre base compactada antes de tender la cama'), ref: 'UFGS 32 14 13.13 §3.1.1' },
    ],
    final_walkthrough: [
      { item: 'Surface flat (3/8 in. / 10 ft), flush to 1/4 in. above edges and drains, no ponding', item_es: tr('Superficie plana (3/8 pulg. / 10 pies), a ras hasta 1/4 pulg. sobre bordes y drenajes, sin encharcamiento'), ref: 'UFGS 32 14 13.13 §3.3' },
      { item: 'Joints full; polymeric sand cured with no surface haze', item_es: tr('Juntas llenas; arena polimérica curada sin velo en la superficie') },
      { item: 'No slivers or loose cuts; pattern lines straight; edges tight to restraint', item_es: tr('Sin astillas ni cortes sueltos; líneas del patrón rectas; bordes firmes contra la restricción') },
      { item: 'Water runs away from the building; downspouts and drains discharge where planned', item_es: tr('El agua corre lejos del edificio; bajantes y drenajes descargan donde se planeó') },
      { item: 'Site swept and cleaned; cutting slurry removed; leftover pavers left for the owner if agreed', item_es: tr('Sitio barrido y limpio; lechada de corte retirada; adoquines sobrantes entregados al dueño si se acordó'), ref: 'UFGS 32 14 13.13 §3.4–3.5' },
    ],
    permeable_reservoir_check: [
      { item: 'System sits downslope of the building and not against a basement wall', item_es: tr('El sistema queda pendiente abajo del edificio y no contra un muro de sótano'), ref: 'ICPI Tech Spec 18' },
      { item: 'Geotextile on sides; subbase and base stone sizes and thicknesses match the design before bedding', item_es: tr('Geotextil en los costados; tamaño y espesor de piedra de subbase y base según diseño antes de la cama'), ref: 'ICPI Tech Spec 18' },
      { item: 'Underdrain installed and outlet clear, if designed', item_es: tr('Dren inferior instalado y salida libre, si está diseñado') },
    ],
  },
  assemblies: [
    { code: 'G-HSP-PAVER-SF', name: 'Concrete paver patio/walk, 60 mm units on 1 in. bedding sand, laid and seated, per SF', name_es: 'Patio/andador de adoquín de concreto, piezas de 60 mm sobre 1 pulg. de arena de asiento, colocado y asentado, por pie²', unit: 'SF', csi: '32 14 13',
      material_cost_cents: { v: 450, prov: est('mid-grade 60 mm concrete pavers + bedding sand share, national baseline 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('screed, lay, cut and seat — 3-person crew ≈ 250 SF/day') },
      equipment_cost_cents: { v: 20, prov: est('plate compactor + wet saw rental share') }, waste_pct: { v: 7, prov: est('cuts at borders and pattern') } },
    { code: 'G-HSP-PERM-SF', name: 'Permeable paver system (80 mm units, No. 8 bedding/joints, No. 57 base, geotextile), per SF', name_es: 'Sistema de adoquín permeable (piezas de 80 mm, cama/juntas No. 8, base No. 57, geotextil), por pie²', unit: 'SF', csi: '32 14 13',
      material_cost_cents: { v: 950, prov: est('80 mm permeable units + open-graded stone + geotextile; subbase depth varies with design') }, labor_hours_per_unit: { v: 0.16, prov: est('layered stone placement + laying + joint stone') },
      equipment_cost_cents: { v: 60, prov: est('skid steer + plate/roller share') }, waste_pct: { v: 6, prov: est('cuts and stone over-place') } },
    { code: 'G-HSP-EDGE-LF', name: 'Paver edge restraint (plastic/aluminum) with spikes, per LF', name_es: 'Restricción de borde para adoquín (plástico/aluminio) con clavos, por pie lineal', unit: 'LF', csi: '32 14 13',
      material_cost_cents: { v: 250, prov: est('commercial-grade edging + 10 in. spikes, 2026 list prices') }, labor_hours_per_unit: { v: 0.04, prov: est('set and spike on compacted base') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('laps and offcuts') } },
    { code: 'G-HSP-POLY-SF', name: 'Polymeric joint sand, installed and activated, per SF of paving', name_es: 'Arena polimérica para juntas, instalada y activada, por pie² de pavimento', unit: 'SF', csi: '32 14 13',
      material_cost_cents: { v: 50, prov: est('bagged polymeric sand; coverage varies with joint width and unit size') }, labor_hours_per_unit: { v: 0.01, prov: est('sweep, vibrate, blow off, wet') },
      equipment_cost_cents: { v: 0, prov: est('uses the paving compactor already on site') }, waste_pct: { v: 10, prov: est('sweep-off loss') } },
    { code: 'G-HSP-SEATWALL-LF', name: 'Segmental block seat wall ~18–24 in. high with caps, on compacted leveling pad, per LF', name_es: 'Murete de bloque segmentado de ~18–24 pulg. con remate, sobre plantilla compactada, por pie lineal', unit: 'LF', csi: '32 32 23',
      material_cost_cents: { v: 4500, prov: est('wall units, caps, cap adhesive, leveling-pad stone') }, labor_hours_per_unit: { v: 0.75, prov: est('pad, base course, courses, caps') },
      equipment_cost_cents: { v: 50, prov: est('saw + compactor share') }, waste_pct: { v: 5, prov: est('cap and corner cuts') } },
  ],
  quantity_rules: [
    { code: 'G-HSP-PAVER-SF', assumption: 'Paver patio/walk called out on plans — assume ≈250 SF (about 16×16) until measured', qty: { basis: { component: 'paver_patio' }, mul: 250 } },
    { code: 'B-FLAT-EXCAV-SF', assumption: 'Excavate and grade the ≈250 SF paver area (add depth for 8–9 in. total section)', qty: { basis: { component: 'paver_patio' }, mul: 250 } },
    { code: 'B-AGG-BASE-SY', assumption: '6 in. compacted aggregate base under the ≈250 SF paver area (≈28 SY)', qty: { basis: { component: 'paver_patio' }, mul: 28 } },
    { code: 'G-HSP-EDGE-LF', assumption: '≈64 LF edge restraint around a 16×16 patio (less where it meets the house)', qty: { basis: { component: 'paver_patio' }, mul: 64 } },
    { code: 'G-HSP-POLY-SF', assumption: 'Polymeric joint sand over the ≈250 SF paver area', qty: { basis: { component: 'paver_patio' }, mul: 250 } },
  ],
  components: [
    // "PAVEMENT" must not match; "ASPHALT PAVING" belongs to asphalt_paving. Bare PAVER(S) plus qualified forms.
    { token: 'paver_patio', re: '(?<!EXISTING\\s{1,3}(?:[A-Z]+\\s{1,3})?)\\bPAVERS?\\s+(?:PATIO|WALK(?:WAY)?|DRIVE(?:WAY)?|APRON|TERRACE)\\b|(?<!EXISTING\\s{1,3})\\b(?:BRICK|CONCRETE|PERMEABLE|INTERLOCKING|CLAY|STONE)\\s+PAVERS?\\b', example: 'NEW BRICK PAVER PATIO', vision_hint: 'paver patio, walk or driveway drawn on site plan',
      task: { title: 'Install paver patio / walk — base, bedding, pavers, edge restraint & joint sand', phase: 'sitework', csi: '32 14 13', days: 3 } },
  ],
  dependency_hints: [
    { after_trades: ['site_utilities', 'irrigation'], note: 'Run sleeves for irrigation, lighting and gas under the paved area before base goes down.' },
    { after_trades: ['gutters'], note: 'Downspout locations and drain outlets should be set before final grades so water drains off the paving.' },
  ],
});
