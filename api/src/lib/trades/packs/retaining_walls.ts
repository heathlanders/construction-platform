// Trade Knowledge Pack — retaining_walls (Retaining Walls — segmental block (SRW) gravity and geogrid-
// reinforced walls, boulder / landscape walls). Wave 06, NEW-TRADE pattern (no hand recipe), building
// family: gates footing (leveling pad, where the AHJ permits the wall) + final. Pavers belong to
// hardscape_pavers (its low seat wall G-HSP-SEATWALL-LF stays there); cast-in-place concrete walls belong
// to concrete. Dossier: docs/trade-packs/dossiers/retaining_walls.md. Sources: UFGS 32 32 23.13, CMHA
// (NCMA) SRW Best Practices Guide + Design Manual (ref), FHWA-NHI-10-024, Allan Block commercial manual,
// 29 CFR 1926 (C, D, M, O, P, Z), IRC R105.2/R404.4 + IBC 1807.2 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['retaining_walls-ufgs-32-32-23-13'], confidence: 'verified' as const, last_verified: D };
const ab = { src: ['retaining_walls-ab-commercial-manual'], confidence: 'verified' as const, last_verified: D };
const ufgsAb = (note?: string) => ({ src: ['retaining_walls-ufgs-32-32-23-13', 'retaining_walls-ab-commercial-manual'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const bp = { src: ['retaining_walls-cmha-srw-best-practices'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'retaining_walls',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Segmental concrete block retaining walls (gravity and geogrid-reinforced) and boulder / landscape walls that hold back soil at grade changes: layout, excavation, compacted leveling pad, buried first course, drainage aggregate and drain pipe, geogrid, compacted backfill in lifts, caps. Tall, surcharged or tiered walls need an engineered design.',
    summary_es: 'Muros de contención de bloque segmentado (por gravedad o con geomalla) y muros de roca que contienen el suelo: trazo, excavación, plantilla compactada, primera hilada enterrada, piedra y tubo de drenaje, geomalla, relleno compactado por capas y remates. Los muros altos, con sobrecarga o escalonados requieren diseño de ingeniero.',
    glossary: [
      { term: 'Segmental retaining wall (SRW)', term_es: 'Muro de contención segmentado (SRW)', def: 'Wall built of dry-stacked concrete blocks (no mortar) that interlock and step back as they go up.', def_es: 'Muro de bloques de concreto apilados en seco (sin mortero) que se traban y se van retirando hacia atrás al subir.' },
      { term: 'Leveling pad', term_es: 'Plantilla de nivelación', def: 'Compacted crushed-stone (or thin concrete) base in a trench that the first course of block sits on.', def_es: 'Base de piedra triturada compactada (o concreto delgado) en una zanja sobre la que se asienta la primera hilada.' },
      { term: 'Embedment (buried course)', term_es: 'Empotramiento (hilada enterrada)', def: 'Part of the wall set below finished grade in front of the wall so the toe cannot slide or wash out.', def_es: 'Parte del muro colocada bajo el nivel terminado al frente del muro para que el pie no se deslice ni se erosione.' },
      { term: 'Wall rock / drainage aggregate', term_es: 'Piedra de muro / agregado de drenaje', def: 'Clean crushed stone placed in the block cores and in a zone right behind the wall so water can drain out.', def_es: 'Piedra triturada limpia colocada en los huecos del bloque y en una franja justo detrás del muro para que drene el agua.' },
      { term: 'Toe drain', term_es: 'Dren de pie', def: 'Perforated pipe at the base behind the wall that carries water to daylight or a storm sewer.', def_es: 'Tubo perforado en la base detrás del muro que lleva el agua a una salida libre o al drenaje pluvial.' },
      { term: 'Geogrid', term_es: 'Geomalla', def: 'Plastic reinforcing grid laid between courses and back into the fill to tie a tall wall to the soil mass.', def_es: 'Malla plástica de refuerzo colocada entre hiladas y hacia atrás dentro del relleno para amarrar un muro alto a la masa de suelo.' },
      { term: 'Reinforced zone', term_es: 'Zona reforzada', def: 'The block of compacted fill behind the wall that contains the geogrid layers.', def_es: 'El volumen de relleno compactado detrás del muro que contiene las capas de geomalla.' },
      { term: 'Setback (batter)', term_es: 'Retiro (talud del muro)', def: 'How far each course steps back from the one below; built into the block lip or pins.', def_es: 'Cuánto se retira cada hilada respecto a la de abajo; viene dado por la pestaña o los pernos del bloque.' },
      { term: 'Surcharge', term_es: 'Sobrecarga', def: 'Extra load on the soil above the wall — a driveway, parking, a building, a slope or another wall tier.', def_es: 'Carga adicional sobre el suelo arriba del muro: una entrada de autos, estacionamiento, un edificio, un talud u otro nivel de muro.' },
      { term: 'Cap unit', term_es: 'Pieza de remate', def: 'Solid top unit glued onto the last course to finish and lock the wall.', def_es: 'Pieza sólida superior pegada sobre la última hilada para terminar y asegurar el muro.' },
    ],
  },
  recipes: [
    {
      id: 'srw_block_wall',
      example_title: 'Build segmental block retaining wall with geogrid, drain and caps',
      when: { title_re: 'retaining wall|segmental (?:block |retaining )?wall|\\bSRW\\b|modular (?:block|concrete) wall|geogrid|keystone wall|versa-?lok|allan block' },
      steps: [
        {
          title: 'Confirm design, permit and utility locates',
          instruction: 'Check the approved plan for wall height, block type, geogrid layers and drain outlets. Walls over the local height limit, or with a driveway, slope, building or another wall above them, need an engineered design and usually a permit — get both before digging. Call 811 and wait for marks. Stake the wall line and top-of-wall elevations.',
          code_refs: [
            { section: 'R105.2', code_type: 'IRC', note: 'Permit exemption covers only low retaining walls with no surcharge' },
            { section: 'R404.4', code_type: 'IRC', note: 'Tall or surcharged retaining walls need an engineered design' },
            { section: '1807.2', note: 'Retaining walls designed against sliding, overturning and soil pressure', code_type: 'IBC' },
          ],
          tools: ['stakes and string line', 'transit / laser level', 'tape', 'marking paint'],
          materials: ['stamped wall design / approved plans', 'block and geogrid submittals'],
          safety_ids: ['utility_strike'],
          qa_ids: ['engineered_design', 'locate_ticket'],
        },
        {
          title: 'Excavate the base trench and reinforced zone',
          instruction: 'Dig the base trench at least 24 in. wide and deep enough for 6 in. of compacted base plus the buried course. Where geogrid is used, cut back far enough for the full grid length. Keep spoil and block pallets at least 2 ft from the edge, slope or shore any cut a worker must enter that could cave, and keep water out of the trench.',
          tools: ['excavator or skid steer', 'shovel', 'laser level'],
          materials: ['stakes'],
          safety_ids: ['excavation_cave_in', 'spoil_at_edge', 'equipment_backing', 'struck_by_machine', 'water_in_trench'],
          qa_ids: ['base_trench'],
        },
        {
          title: 'Build and compact the leveling pad',
          instruction: 'Compact the trench bottom; dig out soft or wet soil and replace it with compacted stone. Place crushed-stone base in lifts no thicker than 6 in. to a minimum compacted 6 in. depth and screed it dead level along the wall (step it in full block heights on a sloping site). Call for the footing inspection here when the wall is permitted.',
          tools: ['plate compactor', 'screed board', '4 ft level', 'laser level'],
          materials: ['crushed aggregate base (wall rock or road base per plan)'],
          safety_ids: ['compactor_noise', 'block_handling'],
          qa_ids: ['leveling_pad', 'base_trench'],
          gating_inspection_type: 'footing',
        },
        {
          title: 'Set and level the buried first course',
          instruction: 'Start at the lowest point. Set the base course tight side to side, level front to back and side to side, and in line with the string. Bury it at least 6 in. or 1 in. per foot of wall height, whichever the plan calls for. Survey or string-check the first course before stacking.',
          tools: ['string line', 'torpedo and 4 ft levels', 'rubber mallet', 'laser level'],
          materials: ['wall units'],
          safety_ids: ['block_handling', 'silica_cutting'],
          qa_ids: ['first_course_embedment', 'block_joints_gaps'],
        },
        {
          title: 'Install drain pipe, wall rock and compacted backfill',
          instruction: 'Lay the perforated toe drain behind the base course with continuous fall to its outlet and vent it to daylight or a storm sewer. Fill the block cores and a zone at least 12 in. behind the wall with clean drainage stone. Backfill behind the stone with approved soil in lifts no thicker than one course (8 in. max), compacting each lift before stacking the next course. Only a walk-behind plate within 3 ft of the wall; keep heavy equipment 3 ft back.',
          tools: ['plate compactor', 'rake', 'shovel', 'level'],
          materials: ['perforated drain pipe with filter sock', 'clean drainage aggregate', 'approved backfill soil', 'filter fabric (where specified)'],
          safety_ids: ['compactor_noise', 'struck_by_machine', 'block_handling'],
          qa_ids: ['drainage_zone', 'toe_drain_daylight', 'backfill_lifts', 'no_heavy_compaction_near_wall'],
        },
        {
          title: 'Stack courses and place geogrid layers',
          instruction: 'Sweep each course clean, then stack the next one with joints offset at least 4 in. and the setback the block is built for; shim no more than 1/8 in. per course. At each grid elevation, cut geogrid to the design length, lay it with the strength direction perpendicular to the wall face up to the block lip, pull it taut, stake it, and cover with at least 6 in. of fill before any machine drives on it. No splices along the strength direction.',
          tools: ['utility knife or grid shears', 'stakes', 'level', 'plate compactor'],
          materials: ['wall units', 'geogrid (as designed)', 'landscape staples'],
          safety_ids: ['block_handling', 'fall_from_wall_top', 'silica_cutting'],
          qa_ids: ['geogrid_placement', 'setback_alignment', 'block_joints_gaps'],
        },
        {
          title: 'Glue caps, finish grade and protect the top',
          instruction: 'Cut caps wet, then bond them to the top course with flexible masonry adhesive without smearing the face. Finish grade so surface water runs away from the top of the wall; slope the last lift away at the end of each day. Install a guard or fence where people can walk along a top with a fall behind it. Clean the wall face and call for the final inspection when permitted.',
          tools: ['caulk gun', 'wet saw', 'rake', 'level'],
          materials: ['cap units', 'flexible masonry adhesive', 'topsoil', 'guard / fence materials (where required)'],
          safety_ids: ['silica_cutting', 'fall_from_wall_top'],
          qa_ids: ['caps_bonded', 'top_drainage', 'guard_at_drop', 'setback_alignment'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'boulder_landscape_wall',
      priority: 10,
      example_title: 'Build boulder retaining wall along driveway slope',
      when: { title_re: 'boulder|rock (?:retaining )?wall|stacked stone wall|landscape wall|outcropping|armou?r ?stone' },
      steps: [
        {
          title: 'Confirm height limits, design and locates',
          instruction: 'Boulder walls over the local permit height, or with a driveway, building or slope above them, need an engineered design and usually a permit. Call 811 and wait for marks. Stake the face line and plan where the excavator can reach every stone without working over people.',
          code_refs: [
            { section: 'R105.2', code_type: 'IRC', note: 'Permit exemption covers only low retaining walls with no surcharge' },
            { section: 'R404.4', code_type: 'IRC', note: 'Tall or surcharged retaining walls need an engineered design' },
          ],
          tools: ['stakes and string line', 'laser level', 'marking paint'],
          materials: ['approved plan or design (when required)'],
          safety_ids: ['utility_strike'],
          qa_ids: ['engineered_design', 'locate_ticket'],
        },
        {
          title: 'Excavate and place a compacted stone base',
          instruction: 'Dig a level base trench wider than the largest bottom stones and set them below grade per plan. Place and compact crushed stone in lifts; keep spoil 2 ft from the edge and nobody in a trench that could cave. Call for the footing inspection here when the wall is permitted.',
          tools: ['excavator', 'plate compactor', 'laser level'],
          materials: ['crushed aggregate base'],
          safety_ids: ['excavation_cave_in', 'spoil_at_edge', 'equipment_backing', 'compactor_noise'],
          qa_ids: ['leveling_pad', 'first_course_embedment'],
          gating_inspection_type: 'footing',
        },
        {
          title: 'Set boulders with drainage stone behind',
          instruction: 'Set the largest stones on the bottom, each on at least two points of the stone below, with the long dimension into the slope and the face battered back. Keep everyone out from under a suspended stone and away from the bucket swing. Fill voids and a zone behind the stones with clean drainage stone over a filter fabric, add a toe drain where water collects, and compact backfill in lifts with a plate only.',
          tools: ['excavator with thumb', 'pry bar', 'plate compactor'],
          materials: ['boulders (sized per plan)', 'clean drainage stone', 'filter fabric', 'perforated drain pipe (where needed)'],
          safety_ids: ['struck_by_machine', 'block_handling', 'equipment_backing'],
          qa_ids: ['drainage_zone', 'toe_drain_daylight', 'backfill_lifts', 'setback_alignment'],
        },
        {
          title: 'Finish grade, guard the top and walk the wall',
          instruction: 'Grade so runoff goes around, not over, the wall. Install a guard or fence where people walk along a top with a fall behind it. Check that no stone rocks or is loose before calling for the final inspection when permitted.',
          tools: ['rake', 'level'],
          materials: ['topsoil', 'erosion-control blanket or seed', 'guard / fence materials (where required)'],
          safety_ids: ['fall_from_wall_top'],
          qa_ids: ['top_drainage', 'guard_at_drop'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: 'R105.2', code_type: 'IRC', note: 'Permit exemption covers only low retaining walls with no surcharge', prov: icc },
      { section: 'R404.4', code_type: 'IRC', note: 'Retaining walls over the height limit or with surcharge need engineered design', prov: icc },
      { section: '1807.2', note: 'Retaining walls designed for soil pressure, sliding and overturning', code_type: 'IBC', prov: icc },
    ],
    final: [
      { section: 'R404.4', code_type: 'IRC', note: 'Built wall matches the engineered design where one was required', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'retaining wall|segmental|SRW|geogrid|boulder|landscape wall|modular' }, type: 'compactor', reason: 'Plate compactor for the leveling pad, drainage stone and every backfill lift' },
    { when: { title_re: 'retaining wall|segmental|SRW|geogrid|modular' }, type: 'skid_steer', reason: 'Dig the trench, move block pallets and place stone and backfill', optional: true },
    { when: { title_re: 'boulder|rock (?:retaining )?wall|armou?r ?stone|outcropping' }, type: 'excavator', reason: 'Lift and set boulders with a thumb; dig the base trench' },
    { when: { title_re: 'geogrid' }, type: 'excavator', reason: 'Cut back the slope for the reinforced zone on tall walls', optional: true },
  ],
  hazards: [
    { id: 'excavation_cave_in', hazard: 'Cave-in of the wall cut or base trench onto a worker', hazard_es: PENDING_ES, controls: ['Slope, bench or shore any cut 5 ft or deeper (or shallower if a competent person sees signs of movement) before anyone enters', 'Have a competent person inspect the cut daily and after rain; keep workers out from below a vertical cut face'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'spoil_at_edge', hazard: 'Spoil, block pallets or stone rolling or falling into the trench', hazard_es: PENDING_ES, controls: ['Keep spoil, materials and equipment at least 2 ft back from the edge', 'Scale loose rock from the cut face'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 3, prov: osha('p') },
    { id: 'utility_strike', hazard: 'Striking buried gas, electric, water or irrigation lines while digging the wall trench', hazard_es: PENDING_ES, controls: ['Call 811 and wait for marks before digging', 'Hand-dig or vacuum-excavate near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'water_in_trench', hazard: 'Working in a trench where water collects, softening the cut and the base', hazard_es: PENDING_ES, controls: ['Pump or divert water before work; stop if water keeps accumulating', 'Re-inspect the cut after rain'], controls_es: PENDING_ES, osha_ref: '1926.651(h)(1)', severity: 3, prov: osha('p') },
    { id: 'block_handling', hazard: 'Back, hand and foot injuries lifting 35–90 lb blocks, caps and stones all day', hazard_es: PENDING_ES, controls: ['Train the crew on lifting; stage pallets close to the wall and use block carts or clamps', 'Team-lift or machine-lift heavy units; rotate tasks; safety-toe boots and gloves'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['safety-toe boots', 'gloves'], prov: osha('c') },
    { id: 'equipment_backing', hazard: 'Struck by a backing skid steer, excavator or dump truck in a tight yard', hazard_es: PENDING_ES, controls: ['Use machines with a working reverse alarm or a spotter when the rear view is blocked', 'Keep the crew out of the travel path'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'struck_by_machine', hazard: 'Struck or pinned by a raised bucket or a swinging boulder', hazard_es: PENDING_ES, controls: ['Never stand under a raised bucket or suspended stone', 'Keep people outside the swing radius; guide stones with a bar, not hands'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(i)', severity: 4, prov: osha('o') },
    { id: 'silica_cutting', hazard: 'Breathing silica dust when cutting block or caps with a saw', hazard_es: PENDING_ES, controls: ['Cut with a saw that feeds water to the blade, as Table 1 of the silica standard lists', 'Wear the respirator Table 1 lists for longer cutting; never dry-cut'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator per Table 1', 'safety glasses', 'hearing protection'], prov: osha('z') },
    { id: 'compactor_noise', hazard: 'Hearing damage from plate compactors and saws', hazard_es: PENDING_ES, controls: ['Wear hearing protection while compactors and saws run', 'Rotate operators'], controls_es: PENDING_ES, osha_ref: '1926.52(d)(1)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'fall_from_wall_top', hazard: 'Falling from the top of a tall wall or the edge of the cut behind it', hazard_es: PENDING_ES, controls: ['Protect edges 6 ft or more above a lower level with guardrail or another fall protection system', 'Keep backfill close to the top course so no one works on a narrow ledge'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 3, prov: osha('m') },
  ],
  qa_checklist: [
    { id: 'engineered_design', phase: 'sitework', item: 'Walls over the local height limit, or with a surcharge, slope, structure or another tier above, are built to a stamped engineered design (and permit) — geogrid, block and drains match it.', item_es: PENDING_ES, safety: true, prov: { src: ['retaining_walls-cmha-srw-best-practices', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'IRC R105.2 / R404.4 thresholds (reference only) + CMHA tiered-wall and global-stability triggers.' } },
    { id: 'locate_ticket', phase: 'sitework', item: 'A valid 811 locate ticket is on file and marks are visible before the trench is dug.', item_es: PENDING_ES, safety: true, prov: { src: ['retaining_walls-ab-commercial-manual', 'ecfr-1926-p'], confidence: 'verified', last_verified: D } },
    { id: 'base_trench', phase: 'sitework', item: 'Base trench at least 24 in. wide, on firm undisturbed or compacted soil; soft or wet soil removed and replaced.', item_es: tr('Zanja de base de al menos 24 pulg. de ancho, sobre suelo firme sin alterar o compactado; el suelo blando o húmedo se retira y reemplaza.'), prov: ufgsAb() },
    { id: 'leveling_pad', phase: 'sitework', item: 'Leveling pad at least 6 in. of compacted crushed stone, placed in lifts of 6 in. or less, level along the wall (stepped in full course heights).', item_es: tr('Plantilla de nivelación de al menos 6 pulg. de piedra triturada compactada, colocada en capas de 6 pulg. o menos, nivelada a lo largo del muro (escalonada en alturas de hilada completas).'), prov: ufgsAb() },
    { id: 'first_course_embedment', phase: 'sitework', item: 'First course fully on the pad, level both ways and buried at least 6 in. or 1 in. per foot of wall height (more where the plan shows a toe slope).', item_es: tr('Primera hilada completamente sobre la plantilla, nivelada en ambos sentidos y enterrada al menos 6 pulg. o 1 pulg. por pie de altura del muro (más donde el plano indica talud al pie).'), prov: { src: ['retaining_walls-ab-commercial-manual', 'retaining_walls-cmha-srw-best-practices'], confidence: 'verified', last_verified: D } },
    { id: 'drainage_zone', item: 'Block cores and a zone at least 12 in. behind the wall filled with clean drainage stone, tamped; no soil mixed in.', item_es: tr('Huecos del bloque y una franja de al menos 12 pulg. detrás del muro llenos de piedra de drenaje limpia y apisonada; sin mezclar tierra.'), prov: ufgsAb() },
    { id: 'toe_drain_daylight', item: 'Perforated toe drain behind the base with continuous fall, protected from fines, and outlets vented to daylight or a storm sewer — outlets visible and clear.', item_es: tr('Dren de pie perforado detrás de la base con caída continua, protegido de finos y con salidas a la intemperie o al drenaje pluvial — salidas visibles y libres.'), prov: ufgsAb() },
    { id: 'geogrid_placement', item: 'Geogrid at the design elevations and lengths, strength direction perpendicular to the face, pulled taut and staked, no splices, 100% coverage, at least 6 in. of fill before any machine drives over it.', item_es: tr('Geomalla en las elevaciones y longitudes de diseño, dirección de resistencia perpendicular a la cara, tensada y estacada, sin empalmes, cobertura del 100%, y al menos 6 pulg. de relleno antes de que pase cualquier máquina.'), prov: { src: ['retaining_walls-ufgs-32-32-23-13', 'retaining_walls-fhwa-nhi-10-024'], confidence: 'verified', last_verified: D } },
    { id: 'backfill_lifts', item: 'Backfill placed in lifts no thicker than one course (8 in. max) and compacted to 95% Standard Proctor; in-place density tested where the project specifies.', item_es: tr('Relleno colocado en capas no mayores a una hilada (8 pulg. máx.) y compactado al 95% del Proctor estándar; densidad en sitio probada donde el proyecto lo exige.'), prov: ufgsAb() },
    { id: 'no_heavy_compaction_near_wall', item: 'Only walk-behind plate compactors within 3 ft of the back of the wall; heavy equipment kept 3 ft back.', item_es: tr('Solo compactadoras de placa manuales a menos de 3 pies de la parte trasera del muro; equipo pesado a 3 pies de distancia.'), prov: ufgsAb() },
    { id: 'setback_alignment', item: 'Each course keeps the block\'s built-in setback; top of wall within 3 in. of plan line and about 0.1 ft of plan elevation; face within 1 1/4 in. under a 10 ft straightedge and batter within 2° of plan; shims 1/8 in. max per course.', item_es: tr('Cada hilada mantiene el retiro propio del bloque; corona dentro de 3 pulg. de la línea y unos 0.1 pies de la elevación de plano; la cara dentro de 1 1/4 pulg. bajo una regla de 10 pies y el talud dentro de 2° del plano; calzas de 1/8 pulg. máx. por hilada.'), prov: ufgsAb('Tolerances are the UFGS suggested defaults; shim limit from the manufacturer manual.') },
    { id: 'block_joints_gaps', item: 'Vertical joints offset at least 4 in. from the course below, gaps between blocks 1/8 in. or less, no damaged units in the wall.', item_es: tr('Juntas verticales desfasadas al menos 4 pulg. de la hilada de abajo, separaciones entre bloques de 1/8 pulg. o menos, sin piezas dañadas en el muro.'), prov: ufgs },
    { id: 'caps_bonded', item: 'Caps (and top units where specified) bonded with flexible masonry adhesive, cut wet, no adhesive on the face.', item_es: tr('Remates (y piezas superiores donde se especifique) pegados con adhesivo flexible para mampostería, cortados en húmedo, sin adhesivo en la cara.'), prov: ufgsAb() },
    { id: 'top_drainage', item: 'Finished grade above the wall sends surface water away from or around the wall, not over the top or into the reinforced zone.', item_es: tr('El nivel terminado arriba del muro desvía el agua superficial lejos o alrededor del muro, no por encima ni hacia la zona reforzada.'), prov: { src: ['retaining_walls-ab-commercial-manual', 'retaining_walls-ufgs-32-32-23-13'], confidence: 'verified', last_verified: D } },
    { id: 'guard_at_drop', item: 'Guard or fence along the top where a walkway or yard sits beside a drop of more than about 30 in.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'retaining_walls-cmha-srw-best-practices'], confidence: 'derived', last_verified: D, note: 'Borrows the IRC R312.1.1 open-side-guard concept (reference only); local codes and the wall design decide whether a guard is required.' } },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Engineered design and permit on site where required; wall layout and height match the plan', item_es: tr('Diseño de ingeniero y permiso en sitio donde se requieren; trazo y altura del muro según plano'), ref: 'IRC R404.4' },
      { item: 'Base trench width and depth allow the full pad plus buried course', item_es: tr('Ancho y profundidad de la zanja permiten la plantilla completa más la hilada enterrada') },
      { item: 'Pad stone compacted in lifts and level; soft spots removed', item_es: tr('Piedra de plantilla compactada por capas y nivelada; puntos blandos retirados'), ref: 'UFGS 32 32 23.13 §3.2.3' },
      { item: 'Toe-drain route and outlet location ready', item_es: tr('Ruta del dren de pie y ubicación de la salida listas') },
    ],
    final: [
      { item: 'Wall plumb to its setback, in line, top at plan elevation; no bulges, open joints or cracked units', item_es: tr('Muro a plomo según su retiro, alineado, corona en la elevación de plano; sin abultamientos, juntas abiertas ni piezas agrietadas'), ref: 'UFGS 32 32 23.13 §3.4.4' },
      { item: 'Drain outlets visible and flowing to daylight or storm sewer', item_es: tr('Salidas del dren visibles y descargando a la intemperie o al drenaje pluvial') },
      { item: 'Caps glued and tight; grade above slopes water away', item_es: tr('Remates pegados y firmes; el nivel superior desvía el agua') },
      { item: 'Guard or fence in place where the top is beside a walkway with a fall', item_es: tr('Barandal o cerca colocada donde la corona colinda con un paso con caída') },
      { item: 'Engineer\'s observation letter or compaction test records on file where the design required them', item_es: tr('Carta de observación del ingeniero o registros de pruebas de compactación archivados donde el diseño los exigió'), ref: 'CMHA SRW Best Practices' },
    ],
  },
  assemblies: [
    { code: 'B-RTW-SRW-SF', name: 'Segmental block retaining wall (gravity) incl. pad, buried course, wall rock and backfill, per SF of face', name_es: 'Muro de contención de bloque segmentado (gravedad) con plantilla, hilada enterrada, piedra y relleno, por pie² de cara', unit: 'SF', csi: '32 32 23',
      material_cost_cents: { v: 1600, prov: est('Standard 1 SF face units + leveling-pad stone + drainage stone share; national baseline 2026, varies widely by block line') }, labor_hours_per_unit: { v: 0.35, prov: est('Trench, pad, set, fill and compact — 3-person crew ≈ 70 SF face/day') },
      equipment_cost_cents: { v: 150, prov: est('Skid steer + plate compactor + wet saw rental share') }, waste_pct: { v: 5, prov: est('Corner and step cuts, broken units') } },
    { code: 'B-RTW-GEOGRID-SY', name: 'Geogrid reinforcement, cut, placed taut and staked, per SY', name_es: 'Geomalla de refuerzo, cortada, colocada tensada y estacada, por yarda²', unit: 'SY', csi: '32 32 23',
      material_cost_cents: { v: 300, prov: est('Uniaxial/biaxial SRW geogrid roll price per SY, 2026 baseline') }, labor_hours_per_unit: { v: 0.03, prov: est('Cut, lay, tension, stake') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools; reinforced-zone excavation carried in B-RTW-SRW-SF / site work') }, waste_pct: { v: 10, prov: est('Roll-end and cut-length waste') } },
    { code: 'B-RTW-DRAIN-LF', name: '4 in. perforated toe drain with filter sock in drainage stone, with outlets to daylight, per LF of wall', name_es: 'Dren de pie perforado de 4 pulg. con calcetín en piedra de drenaje y salidas libres, por pie lineal de muro', unit: 'LF', csi: '33 46 00',
      material_cost_cents: { v: 350, prov: est('Perforated pipe + sock + fittings + outlet share') }, labor_hours_per_unit: { v: 0.05, prov: est('Lay to fall behind base course, connect outlets') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools') }, waste_pct: { v: 5, prov: est('Laps and fittings') } },
    { code: 'B-RTW-CAP-LF', name: 'Retaining wall cap units, cut wet and bonded with masonry adhesive, per LF', name_es: 'Piezas de remate de muro de contención, cortadas en húmedo y pegadas con adhesivo para mampostería, por pie lineal', unit: 'LF', csi: '32 32 23',
      material_cost_cents: { v: 1100, prov: est('Cap units + adhesive (≈1 tube per 60 ft) — baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('Set, cut and glue caps') },
      equipment_cost_cents: { v: 20, prov: est('Wet saw share') }, waste_pct: { v: 7, prov: est('Cuts at curves and corners') } },
    { code: 'B-RTW-BOULDER-SF', name: 'Boulder / stacked stone retaining wall set by excavator, per SF of exposed face', name_es: 'Muro de contención de roca / piedra apilada colocada con excavadora, por pie² de cara expuesta', unit: 'SF', csi: '32 32 00',
      material_cost_cents: { v: 1400, prov: est('Delivered landscape boulders + base and drainage stone share; strongly regional') }, labor_hours_per_unit: { v: 0.2, prov: est('Operator + 2 laborers ≈ 120 SF face/day') },
      equipment_cost_cents: { v: 500, prov: est('Excavator with thumb + plate compactor share') }, waste_pct: { v: 5, prov: est('Rejected / oversize stones') } },
    { code: 'B-RTW-ENGDESIGN-EA', name: 'Retaining wall engineered design and stamped drawings (residential / small commercial)', name_es: 'Diseño de ingeniería y planos sellados de muro de contención (residencial / comercial pequeño)', description: 'Professional fee carried in material cost; field observation visits extra.', unit: 'EA', csi: '01 81 00',
      material_cost_cents: { v: 150000, prov: est('Typical engineer fee for one wall up to ~10 ft, national baseline 2026') }, labor_hours_per_unit: { v: 1, prov: est('Contractor coordination time') },
      equipment_cost_cents: { v: 0, prov: est('None') }, waste_pct: { v: 0, prov: est('Fee') } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'site_utilities'], note: 'Rough grading and any utilities crossing behind or under the wall must be done before the base trench and reinforced zone are built.' },
  ],
});
