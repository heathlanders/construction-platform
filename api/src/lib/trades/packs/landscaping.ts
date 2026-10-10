// Trade Knowledge Pack — landscaping (Landscaping). Wave 04, COMPLEMENT pattern: the hand recipe in
// task-buildout/nopermit.ts keeps producing the work step for "Final grading, seeding & landscaping"
// tasks; this pack adds glossary, hazards (utility strikes, skid-steer rollover/struck-by, power lines,
// heat, fertilizer/pesticide exposure, noise, debris, lifting, sharp tools), QA, owner/erosion
// checklists, equipment hints and assemblies the catalog lacks. permit_trade null → NO gates, NO
// code_refs. No quantity rules: blueprint facts carry no lawn/planting area (area_sf_sum is building
// floor area, not lawn) and no planting schedule tokens.
// Dossier: docs/trade-packs/dossiers/landscaping.md. Sources: UFGS 32 92 19 / 32 92 23 / 32 93 00,
// UW–Madison Extension (A3434 lawn, tree planting flyer), WDNR technical standards 1058/1059,
// Diggers Hotline (811), 29 CFR 1926 Subparts C, D, E, O, P, W; IRC R401.3 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
type Src = string;
const v = (src: Src[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => v([`ecfr-1926-${sub}`], note);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'landscaping',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Final grading and the living site work around a building: topsoil, fine grading for drainage, seed or sod, trees, shrubs and beds, mulch, edging and low-voltage landscape lighting — plus erosion control on bare soil until the new cover is established.',
    summary_es: 'Nivelación final y el trabajo vivo alrededor de una construcción: tierra vegetal, nivelación fina para drenaje, semilla o pasto en rollo, árboles, arbustos y camas de plantas, mulch, bordes e iluminación de jardín de bajo voltaje, además del control de erosión en suelo desnudo hasta que la nueva cubierta se establezca.',
    glossary: [
      { term: 'Finish grade', term_es: 'Nivel final (rasante)', def: 'The final shaped soil surface, set so water runs away from the building and toward swales or drains.', def_es: 'La superficie final del suelo, formada para que el agua escurra lejos del edificio hacia cunetas o drenajes.' },
      { term: 'Topsoil', term_es: 'Tierra vegetal', def: 'Loose, humus-bearing surface soil spread over the subgrade so grass and plants can root.', def_es: 'Suelo superficial suelto y con materia orgánica que se extiende sobre la subrasante para que el pasto y las plantas enraícen.' },
      { term: 'Positive drainage', term_es: 'Drenaje positivo', def: 'Ground that slopes away from the foundation on every side so no water ponds against the house.', def_es: 'Terreno con pendiente que se aleja de la cimentación por todos lados para que el agua no se estanque junto a la casa.' },
      { term: 'Root flare', term_es: 'Collar de raíz (base ensanchada)', def: 'The bulge where a tree trunk widens into its roots; it must sit at or slightly above finished grade.', def_es: 'El ensanchamiento donde el tronco se abre hacia las raíces; debe quedar al nivel del suelo terminado o un poco arriba.' },
      { term: 'Balled and burlapped (B&B)', term_es: 'Cepellón con arpillera (B&B)', def: 'Field-dug tree or shrub sold with its root ball wrapped in burlap, often inside a wire basket.', def_es: 'Árbol o arbusto sacado del campo con el cepellón envuelto en arpillera, muchas veces dentro de una canasta de alambre.' },
      { term: 'Pure live seed (PLS)', term_es: 'Semilla pura viva (PLS)', def: 'The part of a seed bag that is the right species and will actually germinate; seeding rates are set in PLS.', def_es: 'La parte de la bolsa de semilla que es de la especie correcta y que realmente germina; las dosis de siembra se fijan en PLS.' },
      { term: 'Nurse crop', term_es: 'Cultivo nodriza', def: 'Fast annual grass (oats, annual rye) sown with permanent seed to hold soil while the slower grass comes in.', def_es: 'Pasto anual de crecimiento rápido (avena, centeno anual) sembrado con la semilla permanente para sujetar el suelo mientras crece el pasto lento.' },
      { term: 'Crimping', term_es: 'Engrapado del mulch (crimpado)', def: 'Pressing straw mulch into the soil with a disk tool so wind and rain do not move it.', def_es: 'Presionar el mulch de paja dentro del suelo con un disco para que el viento y la lluvia no lo muevan.' },
      { term: 'Watering saucer', term_es: 'Cajete de riego', def: 'A low soil ring around a new tree or shrub that holds water over the root ball.', def_es: 'Un pequeño bordo de tierra alrededor de un árbol o arbusto nuevo que retiene el agua sobre el cepellón.' },
      { term: 'Establishment period', term_es: 'Periodo de establecimiento', def: 'The weeks after seeding, sodding or planting when the new cover needs regular water and no traffic.', def_es: 'Las semanas después de sembrar, colocar pasto o plantar en que la nueva cubierta necesita riego regular y nada de tránsito.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'grad|topsoil|landscap|site restor' }, type: 'skid_steer', reason: 'Spread topsoil, fine-grade and move mulch and plant material', optional: true },
    { when: { title_re: 'grad|topsoil|landscap', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'dump_truck', reason: 'Haul topsoil, mulch and spoils on larger sites', optional: true },
    { when: { title_re: 'lighting' }, type: 'trencher', reason: 'Shallow trench for low-voltage landscape lighting cable', optional: true },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Hitting buried gas, electric, telecom or water lines when digging plant holes, trenching or grading', hazard_es: PENDING_ES, controls: ['Call 811 and wait for locates before any digging; keep marks visible for the whole job', 'Hand-dig or use soft digging near marked lines; stop and call if an unmarked line shows up', 'Mark private lines (lighting, irrigation, septic, invisible fence) with the owner before digging'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: v(['ecfr-1926-p', 'landscaping-diggers-hotline', 'landscaping-uwex-plant-tree']) },
    { id: 'equipment_rollover', hazard: 'Skid steer or compact tractor tipping over on slopes, banks or soft ground while grading or carrying loads', hazard_es: PENDING_ES, controls: ['Run only machines with a rollover protective structure and wear the seat belt', 'Travel straight up and down slopes with the bucket low; never turn across a steep slope', 'Keep away from edges of excavations, ditches and retaining walls'], controls_es: PENDING_ES, osha_ref: '1926.1000(a)', severity: 4, prov: osha('w', 'Subpart W covers wheel-type tractors and front-end loaders, and skid-steers built after July 15, 2019; seat belts also per 1926.602(a)(2)(i).') },
    { id: 'struck_by_equipment', hazard: 'Workers on foot struck or run over by a reversing skid steer, loader or dump truck', hazard_es: PENDING_ES, controls: ['Machines with a blocked rear view need a working backup alarm or a spotter', 'Keep ground crew out of the swing and travel path; make eye contact before walking near a machine', 'Wear high-visibility clothing around moving equipment'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'overhead_lines', hazard: 'Raised loader arms, dump beds or tree booms contacting overhead power lines while setting trees or dumping material', hazard_es: PENDING_ES, controls: ['Look up before raising a bucket or bed; keep the required distance from lines', 'Use a spotter when working near overhead lines; plan tree locations away from lines'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(6)', severity: 4, prov: osha('o') },
    { id: 'heat_stress', hazard: 'Heat illness from hard physical work in full sun during summer planting and sodding', hazard_es: PENDING_ES, controls: ['Provide water, shade and rest breaks; let new workers build up to full days', 'Train the crew to spot heat illness signs and act fast; schedule heavy work early'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: { ...osha('c'), confidence: 'derived', note: 'No construction heat standard; employer must train workers to recognize and avoid unsafe conditions.' } },
    { id: 'chemical_exposure', hazard: 'Skin, eye and breathing exposure to fertilizers, herbicides, pesticides and lime', hazard_es: PENDING_ES, controls: ['Read the product label and SDS before use; follow the label for mixing, PPE and re-entry', 'Only licensed applicators apply restricted-use pesticides; keep products closed and labeled', 'Wash hands before eating; keep spreader loading away from water and drains'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['chemical gloves', 'safety glasses'], prov: osha('d', '1926.59 adopts 29 CFR 1910.1200 Hazard Communication; pesticide label directions are federal law (FIFRA).') },
    { id: 'flying_debris', hazard: 'Rocks, mulch and soil thrown into eyes by trimmers, blowers, tillers and edgers', hazard_es: PENDING_ES, controls: ['Wear safety glasses with side shields when running power equipment', 'Keep other workers and the public clear of trimmer and blower discharge'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses with side shields'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing damage from skid steers, tillers, sod cutters, blowers and trimmers', hazard_es: PENDING_ES, controls: ['Wear ear plugs or muffs when running or working beside loud equipment', 'Keep mufflers and guards in place'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: osha('e') },
    { id: 'manual_lifting', hazard: 'Back strain lifting sod rolls, heavy root balls, bags of mulch and stone', hazard_es: PENDING_ES, controls: ['Use carts, tarps or the machine for heavy root balls; two-person lift for large containers', 'Lift with the legs, keep loads close, rotate tasks through the day'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, prov: { ...osha('c'), confidence: 'derived', note: 'No construction ergonomics standard; covered by the training duty.' } },
    { id: 'sharp_tools', hazard: 'Cuts and punctures from spades, pruners, saws, edging and wire baskets', hazard_es: PENDING_ES, controls: ['Keep tools sharp and in good repair; replace cracked handles', 'Wear cut-resistant gloves when cutting burlap, twine and wire baskets'], controls_es: PENDING_ES, osha_ref: '1926.301(a)', severity: 2, ppe: ['work gloves'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'locates_done', phase: 'sitework', item: 'Utility locates marked and current before any digging; private lines (irrigation, lighting, septic, pet fence) marked with the owner.', item_es: PENDING_ES, safety: true, prov: v(['ecfr-1926-p', 'landscaping-diggers-hotline']) },
    { id: 'positive_drainage', phase: 'sitework', item: 'Finished grade falls away from the foundation on every side at least as steeply as IRC R401.3 requires near the house; lawn areas keep a 1–2% slope to swales — no flat spots or water-holding pockets.', item_es: tr('El nivel final se aleja de la cimentación por todos lados con al menos la pendiente que exige IRC R401.3 junto a la casa; el césped mantiene 1–2 % hacia las cunetas, sin zonas planas ni charcos.'), prov: v(['icc-pa', 'landscaping-uwex-a3434'], 'IRC R401.3 drainage cited by section only (reference); 1–2% lawn slope from UW Extension A3434.') },
    { id: 'grade_below_siding', phase: 'sitework', item: 'Soil and mulch kept below the siding and sill plate, never against siding, foundation insulation or window wells; grade at paving within 1 in. of the edge.', item_es: tr('La tierra y el mulch quedan por debajo del revestimiento y la solera, nunca contra el revestimiento, el aislamiento de la cimentación ni los pozos de ventana; el nivel junto al pavimento queda a 1 pulgada o menos del borde.'), prov: v(['landscaping-ufgs-32-92-23'], 'UFGS 32 92 23 3.2.1 prepared surface max 1 in. below adjoining paving; clearance to siding per manufacturer instructions.') },
    { id: 'topsoil_depth', phase: 'sitework', item: 'Topsoil at least 4 in. deep (probe a few spots), worked into the subsoil, stones over 3/4 in. and debris raked out, no depressions.', item_es: tr('Tierra vegetal de al menos 4 pulgadas (verificar con sonda en varios puntos), mezclada con el subsuelo, piedras de más de 3/4 de pulgada y basura retiradas con rastrillo, sin hundimientos.'), prov: v(['landscaping-ufgs-32-92-19', 'landscaping-uwex-a3434'], 'UFGS 3.1.1.1 4 in. topsoil; UW A3434 3–4 in. minimum.') },
    { id: 'seed_rate_cover', phase: 'sitework', item: 'Seed sown at the bag/spec rate in two passes at right angles, covered no more than 1/4 in., rolled lightly, then straw mulched so about half the soil still shows.', item_es: tr('Semilla sembrada a la dosis de la bolsa o especificación en dos pasadas en cruz, cubierta a no más de 1/4 de pulgada, rodillada ligeramente y luego con paja de modo que se vea la mitad del suelo.'), prov: v(['landscaping-ufgs-32-92-19', 'landscaping-wi-dnr-1059', 'landscaping-uwex-a3434']) },
    { id: 'seed_window', phase: 'sitework', item: 'Seed only when the soil is not frozen, muddy or snow-covered and soil stays above about 53 °F (best mid-August to mid-September in Wisconsin); dormant seeding noted as such.', item_es: tr('Sembrar solo con el suelo sin congelar, sin lodo ni nieve y con la temperatura del suelo arriba de unos 53 °F (mejor de mediados de agosto a mediados de septiembre en Wisconsin); la siembra latente se anota como tal.'), prov: v(['landscaping-wi-dnr-1059', 'landscaping-uwex-a3434', 'landscaping-ufgs-32-92-19']) },
    { id: 'sod_fresh_tight', phase: 'sitework', item: 'Sod laid within 24–48 hours of harvest, joints staggered like brick, every edge butted tight with no gaps or overlaps, corners patched.', item_es: tr('Pasto en rollo colocado dentro de 24–48 horas de cosechado, juntas alternadas como ladrillo, cada borde bien pegado sin huecos ni traslapes, esquinas parchadas.'), prov: v(['landscaping-uwex-a3434', 'landscaping-ufgs-32-92-23']) },
    { id: 'sod_rolled_watered', phase: 'sitework', item: 'Sod rolled right after laying to remove air pockets, then watered until the soil is wet about 6 in. deep without runoff; on slopes laid across the slope and staked.', item_es: tr('Pasto en rollo compactado con rodillo al terminar para sacar bolsas de aire y luego regado hasta mojar unas 6 pulgadas de suelo sin escurrimiento; en pendientes se coloca atravesado y con estacas.'), prov: v(['landscaping-ufgs-32-92-23', 'landscaping-uwex-a3434']) },
    { id: 'tree_depth', phase: 'sitework', item: 'Trees set with the root flare visible at or 1–2 in. above finished grade, plumb, on firm undisturbed soil; hole 3–5 times the root-ball width.', item_es: tr('Árboles colocados con el collar de raíz visible al nivel del suelo terminado o 1–2 pulgadas arriba, a plomo, sobre suelo firme sin remover; hoyo de 3 a 5 veces el ancho del cepellón.'), prov: v(['landscaping-uwex-plant-tree', 'landscaping-ufgs-32-93-00'], 'UW Extension tree planting; same principle as ANSI A300 Part 6 (reference only).') },
    { id: 'wrap_removed', phase: 'sitework', item: 'Wire basket, twine and burlap removed or folded down at least the top third of the ball; circling roots on container plants loosened.', item_es: tr('Canasta de alambre, cuerdas y arpillera retiradas o dobladas hacia abajo al menos en el tercio superior del cepellón; raíces en círculo de plantas en maceta aflojadas.'), prov: v(['landscaping-ufgs-32-93-00', 'landscaping-uwex-plant-tree']) },
    { id: 'mulch_depth', phase: 'sitework', item: 'Mulch 2–3 in. deep in beds and saucers, pulled 2–3 in. back from trunks and stems and kept off siding — no mulch volcanoes.', item_es: tr('Mulch de 2–3 pulgadas en camas y cajetes, retirado 2–3 pulgadas de troncos y tallos y lejos del revestimiento, sin volcanes de mulch.'), prov: v(['landscaping-ufgs-32-93-00', 'landscaping-uwex-plant-tree']) },
    { id: 'plant_watering', phase: 'sitework', item: 'Every new plant watered slowly and deeply the day it goes in (soil wet about 12 in. for trees); saucer built and holding water.', item_es: tr('Cada planta nueva regada lento y profundo el mismo día (suelo mojado unas 12 pulgadas para árboles); cajete hecho y reteniendo agua.'), prov: v(['landscaping-ufgs-32-93-00', 'landscaping-uwex-plant-tree']) },
    { id: 'erosion_until_established', phase: 'sitework', item: 'Bare and seeded slopes covered (straw crimped, blanket or silt fence as planned) and checked weekly and after 0.5 in. of rain until the grass is dense.', item_es: tr('Taludes desnudos y sembrados cubiertos (paja engrapada, manta o malla de sedimentos según el plan) y revisados cada semana y después de 0.5 pulgadas de lluvia hasta que el pasto esté denso.'), prov: v(['landscaping-wi-dnr-1059', 'landscaping-wi-dnr-1058']) },
    { id: 'care_handoff', phase: 'punch', item: 'Owner given written watering and mowing instructions (keep seed moist; water sod every 1–2 days about 2 weeks; first mow at about 3 in.; no traffic 4–6 weeks).', item_es: tr('El dueño recibe instrucciones escritas de riego y corte (mantener húmeda la semilla; regar el pasto en rollo cada 1–2 días unas 2 semanas; primer corte a unas 3 pulgadas; sin tránsito 4–6 semanas).'), prov: v(['landscaping-uwex-a3434', 'landscaping-wi-dnr-1059']) },
    { id: 'plant_warranty', phase: 'punch', item: 'Plant and lawn warranty terms (length, what is replaced, owner watering duty) written on the handoff sheet with the plant list.', item_es: tr('Los términos de garantía de plantas y césped (duración, qué se reemplaza, obligación de riego del dueño) quedan por escrito en la hoja de entrega junto con la lista de plantas.'), prov: est('Common contractor practice; no public standard sets warranty length.') },
  ],
  inspection_checklists: {
    final_grade_check: [
      { item: 'Utility locates current; private lines marked before final grading and planting', item_es: PENDING_ES, ref: '29 CFR 1926.651(b)(1)' },
      { item: 'Ground slopes away from the foundation on all sides; downspout outlets discharge onto splash blocks or extensions, not into beds', item_es: tr('El terreno baja alejándose de la cimentación por todos lados; las bajantes descargan en salpicaderos o extensiones, no en las camas'), ref: 'IRC R401.3' },
      { item: 'Topsoil depth and smoothness checked; no ruts, ponding spots or debris before seed or sod', item_es: tr('Profundidad y uniformidad de la tierra vegetal revisadas; sin surcos, charcos ni basura antes de semilla o pasto en rollo') },
      { item: 'Grade sits below siding and sill, and flush (within 1 in.) at walks and drives', item_es: tr('El nivel queda debajo del revestimiento y la solera, y a ras (1 pulgada o menos) en banquetas y entradas') },
    ],
    establishment_check: [
      { item: 'Seeded areas show even germination with no bare patches; reseed spots larger than about a square foot', item_es: tr('Las áreas sembradas germinan parejo sin manchas desnudas; resembrar zonas mayores de un pie cuadrado aproximadamente'), ref: 'WDNR 1059' },
      { item: 'Sod has rooted (cannot be lifted at the corners) and has no brown seams', item_es: tr('El pasto en rollo ya enraizó (no se levanta de las esquinas) y no tiene juntas secas') },
      { item: 'Erosion controls in place and working until vegetation is dense; repair washouts', item_es: tr('Controles de erosión colocados y funcionando hasta que la vegetación esté densa; reparar deslaves'), ref: 'WDNR 1058/1059' },
      { item: 'Trees and shrubs alive, upright, flare visible; stakes and straps not girdling the trunk', item_es: tr('Árboles y arbustos vivos, derechos, con el collar visible; estacas y correas sin estrangular el tronco') },
    ],
    final_walkthrough: [
      { item: 'Plant count, species and sizes match the plan or plant list', item_es: tr('Cantidad, especie y tamaño de plantas coinciden con el plano o la lista de plantas') },
      { item: 'Mulch depth and clearance from trunks and siding checked; bed edges clean', item_es: tr('Profundidad del mulch y separación de troncos y revestimiento revisadas; bordes de camas limpios') },
      { item: 'Walks, drives and streets swept of soil and mulch; inlets protected or cleaned', item_es: tr('Banquetas, entradas y calles barridas de tierra y mulch; coladeras protegidas o limpias') },
      { item: 'Owner received watering/mowing instructions and the plant warranty sheet', item_es: tr('El dueño recibió las instrucciones de riego y corte y la hoja de garantía de plantas') },
    ],
  },
  assemblies: [
    { code: 'G-LSC-TOPSOIL-CY', name: 'Topsoil — furnish, spread and fine-grade, per CY', name_es: 'Tierra vegetal: suministro, extendido y nivelación fina, por yarda cúbica', unit: 'CY', csi: '32 91 13',
      material_cost_cents: { v: 3500, prov: est('screened topsoil delivered, 2026 national baseline; varies widely by region') },
      labor_hours_per_unit: { v: 0.2, prov: est('skid-steer spread plus hand rake/fine grade, ~5 CY/hr crew rate') },
      equipment_cost_cents: { v: 400, prov: est('skid steer day-rate share per CY') }, waste_pct: { v: 10, prov: est('settlement and spillage') } },
    { code: 'G-LSC-SEED-SF', name: 'Lawn seeding — prep, starter fertilizer, seed and straw mulch, per SF', name_es: 'Siembra de césped: preparación, fertilizante inicial, semilla y paja, por pie²', unit: 'SF', csi: '32 92 19',
      material_cost_cents: { v: 5, prov: { src: ['platform-baseline', 'landscaping-uwex-a3434'], confidence: 'estimate', last_verified: D, note: 'Cool-season mix at ~1.5 lb/1000 SF + starter fertilizer + ~65 lb straw/1000 SF (UW A3434 rates), 2026 prices' } },
      labor_hours_per_unit: { v: 0.002, prov: est('rake, spread seed in two passes, roll, straw — ~500 SF/hr') },
      equipment_cost_cents: { v: 0, prov: est('spreader and roller are hand equipment') }, waste_pct: { v: 10, prov: est('overlap and edge loss') } },
    { code: 'G-LSC-SOD-SF', name: 'Sod — furnish, lay, roll and first watering, per SF', name_es: 'Pasto en rollo: suministro, colocación, rodillo y primer riego, por pie²', unit: 'SF', csi: '32 92 23',
      material_cost_cents: { v: 45, prov: est('farm-grown bluegrass sod delivered, 2026 baseline') },
      labor_hours_per_unit: { v: 0.008, prov: est('lay staggered, cut edges, roll and water — ~125 SF/hr per worker') },
      equipment_cost_cents: { v: 1, prov: est('roller and water source share') }, waste_pct: { v: 5, prov: est('edge cutting and curves') } },
    { code: 'G-LSC-TREE-EA', name: 'Deciduous shade tree, 2 in. caliper B&B — plant, stake, mulch, water, each', name_es: 'Árbol de sombra caducifolio de 2 pulgadas de calibre B&B: plantar, estacar, mulch y riego, c/u', unit: 'EA', csi: '32 93 43',
      material_cost_cents: { v: 25000, prov: est('nursery 2 in. caliper B&B tree + stakes, straps, mulch, 2026 baseline') },
      labor_hours_per_unit: { v: 2, prov: est('dig 3–5× ball width, set at flare, remove basket/burlap, backfill in thirds, saucer, stake, mulch, water') },
      equipment_cost_cents: { v: 3000, prov: est('skid steer with forks/auger share to move and set the ball') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-LSC-SHRUB-EA', name: 'Shrub, 3 gal container — plant, mulch, water, each', name_es: 'Arbusto en maceta de 3 galones: plantar, mulch y riego, c/u', unit: 'EA', csi: '32 93 33',
      material_cost_cents: { v: 3500, prov: est('3 gal container shrub + backfill amendment, 2026 baseline') },
      labor_hours_per_unit: { v: 0.4, prov: est('dig, loosen roots, set, backfill, saucer, water') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('counted each') } },
    { code: 'G-LSC-MULCH-SF', name: 'Shredded hardwood bed mulch, 3 in. deep, per SF', name_es: 'Mulch de madera triturada en camas, 3 pulgadas de espesor, por pie²', unit: 'SF', csi: '32 91 13',
      material_cost_cents: { v: 30, prov: est('bulk shredded hardwood ~$35/CY delivered; 1 CY covers ~108 SF at 3 in.') },
      labor_hours_per_unit: { v: 0.006, prov: est('wheelbarrow and rake out, pull back from trunks and siding') },
      equipment_cost_cents: { v: 0, prov: est('hand placement') }, waste_pct: { v: 10, prov: est('settling and spillage') } },
  ],
  dependency_hints: [
    { after_trades: ['concrete_flatwork', 'hardscape_pavers', 'gutters'], note: 'Final grade, seed/sod and beds go in after drives, walks and downspouts are set so grades meet paving and outlets.' },
    { before_phase: 'punch', note: 'Seed or sod before the punch walkthrough so the owner gets care instructions and an establishment check.' },
  ],
});
