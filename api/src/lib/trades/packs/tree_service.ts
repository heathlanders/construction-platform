// Trade Knowledge Pack — tree_service (Tree Service / Land Clearing). Wave 06, NEW-TRADE pattern: no
// hand recipe exists, so this pack carries three recipes — tree removal / felling / land clearing, stump
// grinding, and tree protection zone setup for construction. permit_trade null → NO gates, NO code_refs;
// owner/arborist hold points live in inspection_checklists (pre_work_hazard_assessment,
// tree_protection_fence_check, final_walkthrough). No quantity rules: blueprint facts carry no tree
// counts, diameters or wooded acreage.
// OSHA has NO tree-care standard. Construction-site hazards cite 29 CFR 1926 (K electrical, O equipment,
// L aerial lifts, CC cranes, I tools, E PPE, G flaggers, P excavation); line-clearance tree trimming near
// energized lines is GENERAL INDUSTRY 29 CFR 1910.269 and is cited as context only. ANSI Z133 is
// reference-only (paraphrased concepts, no numbers copied).
// Dossier: docs/trade-packs/dossiers/tree_service.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
type Src = string;
const v = (src: Src[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const der = (src: Src[], note: string) => ({ src, confidence: 'derived' as const, last_verified: D, note });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'tree_service',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Removing, felling and chipping trees, grinding stumps and clearing brush and timber from a building site — and fencing off the root zones of the trees that stay so construction does not kill them.',
    summary_es: 'Retiro, derribo y triturado de árboles, molienda de tocones y desmonte de maleza y madera en un terreno de obra, además de cercar la zona de raíces de los árboles que se conservan para que la construcción no los mate.',
    glossary: [
      { term: 'Drop zone', term_es: 'Zona de caída', def: 'The marked area under and around a tree where cut wood can land; nobody on the ground enters it while cutting overhead.', def_es: 'El área marcada debajo y alrededor de un árbol donde puede caer la madera cortada; nadie en el suelo entra mientras se corta arriba.' },
      { term: 'Felling notch (face cut)', term_es: 'Muesca de derribo (corte de dirección)', def: 'The wedge cut on the side the tree should fall toward; it steers the fall.', def_es: 'El corte en cuña del lado hacia donde debe caer el árbol; dirige la caída.' },
      { term: 'Hinge', term_es: 'Bisagra', def: 'The strip of uncut wood left between the notch and the back cut that controls the tree as it falls.', def_es: 'La franja de madera sin cortar entre la muesca y el corte de tala que controla el árbol mientras cae.' },
      { term: 'Escape route', term_es: 'Ruta de escape', def: 'A cleared path back and away at an angle from the line of fall, planned before the back cut.', def_es: 'Un camino despejado hacia atrás y en diagonal a la línea de caída, planeado antes del corte de tala.' },
      { term: 'Qualified line-clearance arborist', term_es: 'Arborista calificado para despeje de líneas', def: 'An arborist trained and authorized to work near energized power lines; nobody else works within reach of a live line.', def_es: 'Arborista capacitado y autorizado para trabajar cerca de líneas eléctricas energizadas; nadie más trabaja al alcance de una línea viva.' },
      { term: 'DBH (diameter at breast height)', term_es: 'DAP (diámetro a la altura del pecho)', def: 'Trunk diameter measured 4.5 ft above the ground; used to size trees and their root protection zone.', def_es: 'Diámetro del tronco medido a 4.5 pies del suelo; sirve para clasificar árboles y su zona de protección de raíces.' },
      { term: 'Dripline', term_es: 'Línea de goteo', def: 'The ring on the ground directly below the outermost branches.', def_es: 'El anillo en el suelo justo debajo de las ramas más exteriores.' },
      { term: 'Protected / critical root zone', term_es: 'Zona protegida / crítica de raíces', def: 'The fenced area around a saved tree — at least the dripline, often 1.5 ft per inch of DBH — kept free of traffic, storage and grade changes.', def_es: 'El área cercada alrededor de un árbol que se conserva (al menos la línea de goteo, a menudo 1.5 pies por pulgada de DAP) libre de tránsito, almacenamiento y cambios de nivel.' },
      { term: 'Grubbing', term_es: 'Destronque', def: 'Pulling out stumps, roots and buried debris after clearing so the ground can be graded.', def_es: 'Sacar tocones, raíces y escombros enterrados después del desmonte para poder nivelar el terreno.' },
      { term: 'Oak wilt', term_es: 'Marchitez del roble', def: 'A fatal fungal disease of oaks spread by beetles to fresh wounds; in Wisconsin avoid cutting or wounding oaks April through July.', def_es: 'Enfermedad mortal de los robles causada por un hongo que los escarabajos llevan a heridas frescas; en Wisconsin evite cortar o herir robles de abril a julio.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'tree_removal_felling',
      example_title: 'Remove trees and clear building pad',
      priority: 2,
      when: { title_re: 'remov|fell|cut down|take down|clear|grub' },
      steps: [
        {
          title: 'Survey the site, the trees and the lines',
          instruction: 'Walk the site with a qualified arborist before any cutting. Mark each tree to remove or save, check every tree for rot, splits and dead tops, and look up for overhead power, phone and cable lines. If any tree or limb could reach a line, stop: the utility de-energizes it or a qualified line-clearance crew does that tree.',
          detail: 'Call 811 if stumps will be ground or grubbed. In Wisconsin, do not cut or wound oaks April through July (oak wilt) unless the owner accepts it and wounds are sealed at once.',
          tools: ['tree-marking paint or flagging', 'tape measure', 'binoculars'],
          materials: ['site plan with trees to remove and save'],
          safety_ids: ['power_line_contact', 'struck_by_falling'],
          qa_ids: ['hazard_assessment', 'lines_identified', 'oak_wilt_window'],
        },
        {
          title: 'Set up the drop zone and traffic control',
          instruction: 'Mark a drop zone around each tree at least as wide as the tree is tall and tape it off. Agree on voice and hand signals between the cutter and the ground crew. Where a tree can fall toward a road or walk, close it with cones and a flagger.',
          tools: ['cones', 'caution tape', 'radios'],
          materials: ['signs and barricades'],
          safety_ids: ['struck_by_falling', 'traffic_struck_by'],
          qa_ids: ['drop_zone_marked'],
        },
        {
          title: 'Fell or piece down the tree',
          instruction: 'Open-ground trees: plan the fall line and two escape routes, clear brush at the base, cut the notch facing the fall line, then the back cut leaving a hinge, and walk out the escape route as the tree goes. Trees near buildings or lines: climb or use an aerial lift and lower sections with ropes or a crane; never let a piece free-fall where it cannot land safely.',
          detail: 'Set the chain brake before every move with a running saw; shut the saw off to refuel. Aerial lifts tie off to the boom or basket and are never used to hoist wood unless built for it.',
          tools: ['chainsaw', 'felling wedges', 'climbing or rigging gear', 'aerial lift or crane where needed'],
          materials: ['bar oil', 'fuel'],
          safety_ids: ['chainsaw_cut', 'struck_by_falling', 'aerial_lift_fall', 'climbing_fall', 'crane_power_line', 'power_line_contact', 'noise'],
          qa_ids: ['felling_plan', 'ppe_saw'],
        },
        {
          title: 'Buck, chip and haul the wood',
          instruction: 'Cut logs to haul length. Feed brush into the chipper butt-first from the side of the infeed, let go once the rollers take it, and push short pieces with a stick or the next branch. Haul logs and chips off site to a legal disposal or use point.',
          detail: 'Keep oak and ash wood local; do not move firewood onto state lands from farther than 10 miles. Leave oak logs from wilt-killed trees covered or debarked per WI DNR guidance.',
          tools: ['chainsaw', 'chipper', 'log loader or skid steer'],
          materials: [],
          safety_ids: ['chipper_entanglement', 'chainsaw_cut', 'noise'],
          qa_ids: ['chipper_side_feed', 'debris_disposal'],
        },
        {
          title: 'Cut stumps low and clear the area',
          instruction: 'Cut stumps as close to the ground as safe. Stumps under the building footprint, drives and utilities are ground or grubbed out; others are left or ground to the depth in the scope. Rake out branches and leave the cleared area ready for the excavator.',
          tools: ['chainsaw', 'rakes', 'skid steer'],
          materials: [],
          safety_ids: ['chainsaw_cut', 'utility_strike_grinding'],
          qa_ids: ['site_left_clean'],
        },
      ],
    },
    {
      id: 'stump_grinding',
      example_title: 'Grind stumps at building footprint',
      priority: 1,
      when: { title_re: 'stump' },
      steps: [
        {
          title: 'Locate utilities and set up a debris zone',
          instruction: 'Confirm 811 locates are marked and current, and mark private lines (irrigation, lighting, septic, pet fence) with the owner. Rope off the area around the grinder; keep people, cars and windows out of the throw zone or shield them with plywood or a debris curtain.',
          tools: ['cones', 'caution tape', 'plywood or debris shield'],
          materials: [],
          safety_ids: ['utility_strike_grinding', 'stump_grinder_debris'],
          qa_ids: ['locates_before_grinding'],
        },
        {
          title: 'Grind each stump to the specified depth',
          instruction: 'Clear rocks and metal from around the stump. Sweep the cutter wheel across the stump in passes, working down to the depth in the scope and out past the surface roots. Stop and hand-dig if you hit a line, rock or buried metal.',
          tools: ['stump grinder', 'shovel', 'probe bar'],
          materials: [],
          safety_ids: ['stump_grinder_debris', 'utility_strike_grinding', 'noise'],
          qa_ids: ['stump_depth'],
        },
        {
          title: 'Remove grindings and backfill',
          instruction: 'Pull the grindings out of the hole and haul or spread them where the scope says. Under footings, slabs and drives, remove all grindings and roots and backfill with clean compacted soil, because wood chips rot and settle. Leave lawn areas topsoiled and level.',
          tools: ['shovel', 'rake', 'skid steer', 'plate compactor'],
          materials: ['clean fill or topsoil'],
          safety_ids: ['noise'],
          qa_ids: ['grindings_removed'],
        },
      ],
    },
    {
      id: 'tree_protection_zone',
      example_title: 'Install tree protection fencing',
      priority: 3,
      when: { title_re: 'tree protect|protection fenc|root zone|\\bTPZ\\b|preserv|save trees' },
      steps: [
        {
          title: 'Mark the protection zones with the arborist',
          instruction: 'With the owner and arborist, confirm which trees stay. Mark each protected zone at the dripline, or farther (1.5 ft per inch of trunk diameter) for sensitive or wooded-lot trees. Show the zones and the haul routes on the site plan.',
          tools: ['tape measure', 'marking paint', 'DBH tape'],
          materials: ['site plan'],
          safety_ids: ['utility_strike_grinding'],
          qa_ids: ['tpz_size'],
        },
        {
          title: 'Install the protection fence and signs',
          instruction: 'Set sturdy, highly visible fence (orange construction fence on driven posts, snow fence or chain link) around each zone. Hang tree-protection signs in English and Spanish about every 20 ft. Lay 6 in. of wood chips on haul paths that must pass near roots.',
          tools: ['post driver', 'zip ties or wire'],
          materials: ['protection fence', 'T-posts', 'signs', 'wood chips for haul paths'],
          safety_ids: ['utility_strike_grinding'],
          qa_ids: ['tpz_fence_signs'],
        },
        {
          title: 'Keep the zones clean through construction',
          instruction: 'Inside the fence: no parking, material or fuel storage, concrete washout, trenching, or added or removed soil. Any root cutting outside the zone is a clean saw cut, backfilled within an hour. Report fence damage or tree injury to the PM and arborist the same day.',
          tools: ['pruning saw'],
          materials: [],
          safety_ids: [],
          qa_ids: ['tpz_no_storage', 'root_cuts_clean'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'remov|fell|clear|grub|stump' }, type: 'skid_steer', reason: 'Move logs and brush, grub stumps and roots, spread grindings', optional: true },
    { when: { title_re: 'remov|fell|clear|grub|stump' }, type: 'dump_truck', reason: 'Haul chips, logs, grindings and brush off site', optional: true },
    { when: { title_re: '\\bfell|take down|cut down|tree remov|remove (the )?trees?' }, type: 'boom_lift', reason: 'Piece down trees too close to buildings or lines to fell whole', optional: true },
    { when: { title_re: '\\bfell|take down|cut down|tree remov|remove (the )?trees?', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'crane', reason: 'Lift out large tree sections over structures where they cannot be lowered safely', optional: true },
  ],
  hazards: [
    { id: 'power_line_contact', hazard: 'Electrocution when a tree, limb, rope, saw or worker contacts or comes near an energized overhead line', hazard_es: PENDING_ES, controls: ['Look up and identify every line before work; treat all lines as live', 'Stay at least 10 ft from lines up to 50 kV (more for higher voltage); if you cannot, have the utility de-energize and ground them', 'Only qualified line-clearance arborists work on trees within reach of energized lines', 'Never let a tree or section fall toward a line; rope or piece it away'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: v(['ecfr-1926-k', 'tree_service-osha-hb3731', 'tree_service-ecfr-1910-269'], 'Clearance distance from OSHA HB-3731; line-clearance tree trimming is general industry 1910.269 — cited for context.') },
    { id: 'crane_power_line', hazard: 'Crane or loader boom contacting overhead lines while lifting tree sections or logs', hazard_es: PENDING_ES, controls: ['Identify the work zone and its distance to lines before any crane lift', 'Use a dedicated spotter and plan the lift away from lines'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: v(['ecfr-1926-cc']) },
    { id: 'struck_by_falling', hazard: 'Struck by a falling tree, limb, top or log — the leading tree-care fatality', hazard_es: PENDING_ES, controls: ['Have a qualified arborist assess the tree before cutting; rig sections that cannot free-fall', 'Mark the drop zone; no ground worker enters while cutting overhead', 'Use agreed voice and visual signals before each cut', 'Wear a hard hat in and near the work area'], controls_es: PENDING_ES, osha_ref: '1926.100(a)', severity: 4, ppe: ['hard hat'], prov: v(['ecfr-1926-e', 'tree_service-osha-hb3731', 'tree_service-ansi-z133'], 'Drop-zone + signals from OSHA HB-3731; head protection 1926.100(a).') },
    { id: 'chainsaw_cut', hazard: 'Cuts from chainsaw kickback or contact, and fires from refueling a hot saw', hazard_es: PENDING_ES, controls: ['Keep the chain brake, chain catcher and guards working; engage the brake when moving', 'Hold the saw with both hands; do not cut with the bar tip or above shoulder height', 'Stop the engine to refuel or service'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 4, ppe: ['chainsaw chaps or cut-resistant pants', 'hard hat', 'safety glasses', 'hearing protection', 'gloves'], prov: der(['ecfr-1926-i', 'ecfr-1926-e', 'tree_service-ansi-z133'], '1926 has no chainsaw-specific rule: guards per 1926.300(b)(1), stop to refuel per 1926.302(c)(1), PPE per 1926.95(a); kickback practice per ANSI Z133 (reference only).') },
    { id: 'chipper_entanglement', hazard: 'Being pulled into a brush chipper by clothing, gloves or a branch caught in the feed rollers', hazard_es: PENDING_ES, controls: ['Feed from the side of the infeed, butt end first; let go once the rollers take the branch', 'Keep hands and feet out of the infeed; push short pieces with a long branch', 'Know where the feed-stop bar is; keep guards and stop controls working', 'No loose clothing, cuffs or dangling straps near the chipper'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 4, prov: der(['ecfr-1926-i', 'tree_service-ansi-z133'], 'Moving-parts guarding 1926.300(b)(2); side-feeding practice per ANSI Z133 (reference only).') },
    { id: 'aerial_lift_fall', hazard: 'Falling or being thrown from an aerial lift, or the lift tipping over on soft or sloped ground', hazard_es: PENDING_ES, controls: ['Wear a harness or belt with the lanyard attached to the boom or basket', 'Set up on firm, level ground with outriggers down', 'Never use the lift to hoist wood unless it is built for it'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness and lanyard'], prov: v(['ecfr-1926-l', 'tree_service-osha-hb3731']) },
    { id: 'climbing_fall', hazard: 'Falls while climbing a tree — a failed limb, trunk or cut rope', hazard_es: PENDING_ES, controls: ['Inspect the tree for rot and cracks before climbing', 'Stay tied in at all times; use a second line or lanyard when cutting', 'Use only climbing gear approved for arborist work and inspect it before each climb'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, ppe: ['arborist climbing harness', 'hard hat'], prov: der(['ecfr-1926-c', 'tree_service-osha-hb3731', 'tree_service-ansi-z133'], 'No 1926 rule for tree climbing; training duty 1926.21(b)(2); practice from OSHA HB-3731 and ANSI Z133 (reference only).') },
    { id: 'stump_grinder_debris', hazard: 'Chips, rocks and metal thrown by the stump grinder wheel into eyes, people, cars or windows', hazard_es: PENDING_ES, controls: ['Rope off the throw zone; keep bystanders and vehicles out', 'Clear rocks and metal from around the stump first', 'Wear a face shield over safety glasses'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['face shield', 'safety glasses'], prov: v(['ecfr-1926-e']) },
    { id: 'utility_strike_grinding', hazard: 'Grinding, grubbing or driving fence posts into buried gas, electric or communication lines', hazard_es: PENDING_ES, controls: ['Call 811 and wait for locates before grinding, grubbing or driving posts', 'Mark private lines with the owner; hand-dig near marks'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: der(['ecfr-1926-p'], 'Applies 1926.651(b)(1) locate duty to stump grinding/grubbing that opens the ground.') },
    { id: 'traffic_struck_by', hazard: 'Workers struck by traffic, or falling wood landing on a road or walk', hazard_es: PENDING_ES, controls: ['Close the lane or walk under the drop zone with signs and cones', 'Use trained flaggers in high-visibility garments'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 3, ppe: ['high-visibility vest'], prov: v(['ecfr-1926-g', 'tree_service-osha-topic']) },
    { id: 'noise', hazard: 'Hearing loss from chainsaws, chippers and stump grinders', hazard_es: PENDING_ES, controls: ['Wear plugs or muffs whenever saws, chippers or grinders run'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: v(['ecfr-1926-e']) },
  ],
  qa_checklist: [
    { id: 'hazard_assessment', item: 'Pre-work hazard assessment done by a qualified arborist: each tree checked for rot, splits and dead tops; climb, lift or crane method chosen.', item_es: PENDING_ES, safety: true, prov: v(['tree_service-osha-hb3731', 'tree_service-ansi-z133']) },
    { id: 'lines_identified', item: 'Overhead lines identified and utility notified; any tree within reach of an energized line assigned to a qualified line-clearance crew or the line de-energized.', item_es: PENDING_ES, safety: true, prov: v(['tree_service-osha-hb3731', 'tree_service-ecfr-1910-269', 'ecfr-1926-k']) },
    { id: 'drop_zone_marked', item: 'Drop zone taped off, signals agreed, and roads or walks under it closed before cutting.', item_es: PENDING_ES, safety: true, prov: v(['tree_service-osha-hb3731', 'ecfr-1926-g']) },
    { id: 'felling_plan', item: 'Felling plan set for each felled tree: fall line, notch and hinge, and two clear escape routes.', item_es: PENDING_ES, safety: true, prov: der(['tree_service-ansi-z133', 'tree_service-osha-topic'], 'Common felling practice; ANSI Z133 reference only.') },
    { id: 'ppe_saw', item: 'Saw operators wear chaps, hard hat, eye and ear protection; saws have working chain brakes.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-e', 'ecfr-1926-i']) },
    { id: 'chipper_side_feed', item: 'Chipper fed from the side, butt first; feed-stop control tested at the start of the day.', item_es: PENDING_ES, safety: true, prov: der(['tree_service-ansi-z133', 'ecfr-1926-i'], 'ANSI Z133 concept, reference only.') },
    { id: 'locates_before_grinding', item: '811 locates marked and current, and private lines marked, before stump grinding, grubbing or driving fence posts.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-p']) },
    { id: 'oak_wilt_window', item: 'In Wisconsin, oaks not cut, pruned or wounded April through July; if unavoidable, wound sealer applied right after the cut.', item_es: tr('En Wisconsin, los robles no se cortan, podan ni hieren de abril a julio; si es inevitable, se aplica sellador de heridas justo después del corte.'), prov: v(['tree_service-wi-dnr-oakwilt']) },
    { id: 'stump_depth', item: 'Stumps ground to the depth in the scope (measure a few) and surface roots removed out to the edge of the stump.', item_es: tr('Tocones molidos a la profundidad del alcance (medir algunos) y raíces superficiales retiradas hasta el borde del tocón.'), prov: est('Grind depth is set by the contract scope; no public standard sets it.') },
    { id: 'grindings_removed', item: 'Under footings, slabs and drives, all grindings and roots removed and the hole backfilled with clean compacted soil; lawn areas topsoiled and level.', item_es: tr('Bajo zapatas, losas y entradas, se retiran todas las virutas y raíces y el hueco se rellena con tierra limpia compactada; las áreas de césped quedan con tierra vegetal y niveladas.'), prov: est('Organic material under structures settles as it decays; common practice.') },
    { id: 'debris_disposal', item: 'Logs, chips and brush hauled to a legal disposal or use site; oak and ash wood kept local and firewood not moved onto state lands from more than 10 miles.', item_es: tr('Troncos, astillas y ramas llevados a un sitio legal de disposición o uso; la madera de roble y fresno se queda en la zona y la leña no se lleva a terrenos estatales desde más de 10 millas.'), prov: v(['tree_service-wi-dnr-firewood', 'tree_service-wi-dnr-eab', 'tree_service-wi-dnr-oakwilt']) },
    { id: 'tpz_size', item: 'Protection zone for each saved tree set at the dripline or 1.5 ft per inch of DBH, whichever the arborist chooses, and shown on the site plan.', item_es: tr('La zona de protección de cada árbol que se conserva se fija en la línea de goteo o a 1.5 pies por pulgada de DAP, según decida el arborista, y se marca en el plano del sitio.'), prov: v(['tree_service-purdue-fnr463']) },
    { id: 'tpz_fence_signs', item: 'Protection fence is continuous, upright and highly visible, with bilingual signs about every 20 ft.', item_es: tr('La cerca de protección es continua, está derecha y muy visible, con letreros bilingües cada 20 pies aproximadamente.'), prov: v(['tree_service-purdue-fnr463']) },
    { id: 'tpz_no_storage', item: 'No parking, storage, fuel, washout, trenching or grade change inside any protection zone; checked at each site meeting.', item_es: tr('No hay estacionamiento, almacenamiento, combustible, lavado de concreto, zanjas ni cambio de nivel dentro de ninguna zona de protección; se revisa en cada junta de obra.'), prov: v(['tree_service-purdue-fnr463']) },
    { id: 'root_cuts_clean', item: 'Roots cut outside the zone are clean saw cuts, backfilled within an hour and watered within 24 hours.', item_es: tr('Las raíces cortadas fuera de la zona tienen cortes limpios de sierra, se rellenan dentro de una hora y se riegan dentro de 24 horas.'), prov: v(['tree_service-purdue-fnr463']) },
    { id: 'site_left_clean', item: 'Cleared area free of branches, logs and debris; streets and walks swept; site ready for excavation.', item_es: tr('El área desmontada queda libre de ramas, troncos y escombros; calles y banquetas barridas; terreno listo para la excavación.'), prov: est('Common contractor practice.') },
  ],
  inspection_checklists: {
    pre_work_hazard_assessment: [
      { item: 'Qualified arborist inspected each tree for defects and chose the removal method (fell, climb, lift, crane)', item_es: PENDING_ES, ref: 'OSHA HB-3731' },
      { item: 'Overhead lines identified; utility contacted for any tree within reach; line-clearance crew assigned where needed', item_es: PENDING_ES, ref: '29 CFR 1926.416(a)(1)' },
      { item: '811 locates current before grinding or grubbing', item_es: PENDING_ES, ref: '29 CFR 1926.651(b)(1)' },
      { item: 'Drop zones, traffic control and escape routes planned; crew briefed on signals', item_es: PENDING_ES, ref: '29 CFR 1926.201(a)' },
      { item: 'Trees to save and trees to remove confirmed with the owner on the site plan', item_es: tr('Árboles a conservar y a retirar confirmados con el dueño en el plano del sitio') },
    ],
    tree_protection_fence_check: [
      { item: 'Fence in place at the agreed root-zone line around every saved tree before equipment arrives', item_es: tr('Cerca colocada en la línea acordada de zona de raíces alrededor de cada árbol conservado antes de que llegue la maquinaria'), ref: 'Purdue FNR-463-W' },
      { item: 'Bilingual tree-protection signs posted', item_es: tr('Letreros bilingües de protección de árboles colocados') },
      { item: 'No storage, parking, fuel, washout or grade change inside the fence', item_es: tr('Sin almacenamiento, estacionamiento, combustible, lavado ni cambio de nivel dentro de la cerca') },
      { item: 'Haul paths near roots covered with wood chips', item_es: tr('Caminos de acarreo cerca de raíces cubiertos con astillas de madera') },
    ],
    final_walkthrough: [
      { item: 'All marked trees removed; saved trees undamaged', item_es: tr('Todos los árboles marcados retirados; los árboles conservados sin daño') },
      { item: 'Stumps ground to scope depth; grindings removed and holes backfilled under structures', item_es: tr('Tocones molidos a la profundidad del alcance; virutas retiradas y huecos rellenados bajo estructuras') },
      { item: 'Wood, chips and brush disposed of per local and WI DNR guidance', item_es: tr('Madera, astillas y ramas dispuestas según las reglas locales y la guía del WI DNR'), ref: 'WI DNR oak wilt / firewood' },
      { item: 'Streets, walks and lawns cleaned; ruts repaired', item_es: tr('Calles, banquetas y césped limpios; surcos reparados') },
    ],
  },
  assemblies: [
    { code: 'G-TREE-REMOVE-SM-EA', name: 'Tree removal, small (up to 12 in. DBH) — fell, chip, haul, stump cut low, each', name_es: 'Retiro de árbol pequeño (hasta 12 pulg. de DAP): derribo, triturado, acarreo, tocón cortado a ras, c/u', unit: 'EA', csi: '31 13 13',
      material_cost_cents: { v: 2000, prov: est('disposal/tipping share for chips and logs, 2026 national baseline') },
      labor_hours_per_unit: { v: 2.5, prov: est('3-person crew ~50 min: open-ground fell, buck, chip, load') },
      equipment_cost_cents: { v: 15000, prov: est('chipper + chip truck day-rate share') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-TREE-REMOVE-MD-EA', name: 'Tree removal, medium (12–24 in. DBH) — fell or piece down, chip, haul, each', name_es: 'Retiro de árbol mediano (12–24 pulg. de DAP): derribo o por secciones, triturado, acarreo, c/u', unit: 'EA', csi: '31 13 13',
      material_cost_cents: { v: 6000, prov: est('disposal/tipping share, 2026 national baseline') },
      labor_hours_per_unit: { v: 6, prov: est('3-person crew ~2 hr incl. some rigging') },
      equipment_cost_cents: { v: 40000, prov: est('chipper, chip truck, log loader or lift share') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-TREE-REMOVE-LG-EA', name: 'Tree removal, large (over 24 in. DBH) — climb/lift and rig down, chip, haul, each', name_es: 'Retiro de árbol grande (más de 24 pulg. de DAP): trepado o elevador y bajado con cuerdas, triturado, acarreo, c/u', unit: 'EA', csi: '31 13 13',
      material_cost_cents: { v: 15000, prov: est('disposal/tipping share for large wood volume, 2026 national baseline') },
      labor_hours_per_unit: { v: 14, prov: est('3–4 person crew most of a day; rigging near structures') },
      equipment_cost_cents: { v: 90000, prov: est('aerial lift or crane share + chipper + trucks; crane picks priced separately when required') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-TREE-STUMP-EA', name: 'Stump grinding (avg. 18 in. stump) — grind to scope depth, rake out grindings, each', name_es: 'Molienda de tocón (promedio 18 pulg.): moler a la profundidad del alcance y retirar virutas, c/u', unit: 'EA', csi: '31 13 13',
      material_cost_cents: { v: 0, prov: est('no material; backfill priced separately') },
      labor_hours_per_unit: { v: 0.75, prov: est('one operator + helper, setup and grind') },
      equipment_cost_cents: { v: 6000, prov: est('self-propelled stump grinder day-rate share') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-TREE-CLEAR-AC', name: 'Land clearing and grubbing, light-to-medium woods — cut, grub, chip or haul, per acre', name_es: 'Desmonte y destronque de bosque ligero a medio: corte, destronque, triturado o acarreo, por acre', unit: 'AC', csi: '31 11 00',
      material_cost_cents: { v: 100000, prov: est('disposal/tipping for brush, logs and stumps per acre, 2026 national baseline; varies widely') },
      labor_hours_per_unit: { v: 40, prov: est('crew of 3–4 about 1.5 days per acre') },
      equipment_cost_cents: { v: 350000, prov: est('excavator or forestry mulcher, skid steer, chipper and trucks share per acre') }, waste_pct: { v: 0, prov: est('area measure') } },
    { code: 'G-TREE-PROTECT-LF', name: 'Tree protection fence — orange construction fence on steel posts with signs, per LF', name_es: 'Cerca de protección de árboles: malla naranja de obra en postes de acero con letreros, por pie lineal', unit: 'LF', csi: '01 56 39',
      material_cost_cents: { v: 150, prov: est('4 ft orange fence + T-posts at ~8 ft + signs every ~20 ft, 2026 baseline') },
      labor_hours_per_unit: { v: 0.04, prov: est('drive posts and tie fence, ~25 LF/hr') },
      equipment_cost_cents: { v: 0, prov: est('hand post driver') }, waste_pct: { v: 5, prov: est('overlap and ties') } },
  ],
  dependency_hints: [
    { before_phase: 'foundation', note: 'Tree removal, stump grinding and clearing come before excavation and footings; protection fences go up before any equipment arrives.' },
  ],
});
