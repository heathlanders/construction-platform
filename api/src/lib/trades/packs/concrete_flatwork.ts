// Trade Knowledge Pack — concrete_flatwork (Concrete Flatwork: Drives / Walks / Patios / Curb & Gutter).
// Wave 04, COMPLEMENT pattern: the hand recipe in task-buildout/building.ts (asphalt/flatwork branch)
// keeps producing the work steps (Prep subgrade & base → Form, pour & finish flatwork); this pack adds
// glossary, hazards, QA, owner/GC + right-of-way checklists, equipment hints and the few assemblies the
// catalog lacks. The Design Studio intake module (intake/trades/concrete_flatwork.ts) already prices
// the B-FLAT-* / B-FLATWORK-SF / G-SITE-DEMO-SF rows from migration 0045 — referenced, never redeclared.
// Flatwork usually has no AHJ building-inspection gate → no recipes gates, no code_refs.
// Dossier: docs/trade-packs/dossiers/concrete_flatwork.md. Sources: NRMCA CIP 2/6/11/14,
// UFGS 32 13 13.06, WisDOT Std Spec 601/602, 29 CFR 1926 Subparts E, G, K, O, P, Q, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string, note?: string) => ({ src: [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const cip2 = (note?: string) => src('concrete_flatwork-nrmca-cip2', note);
const cip6 = (note?: string) => src('concrete_flatwork-nrmca-cip6', note);
const cip11 = src('concrete_flatwork-nrmca-cip11');
const cip14 = src('concrete_flatwork-nrmca-cip14');
const dot602 = (note?: string) => src('concrete_flatwork-wisdot-ss-602', note);
const osha = (sub: string) => src(`ecfr-1926-${sub}`);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'concrete_flatwork',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Exterior concrete slabs on grade — driveways, sidewalks, patios, aprons, steps and curb & gutter: subgrade and base, forms, reinforcement, placing, broom finish, control and isolation joints, and curing.',
    summary_es: 'Losas exteriores de concreto sobre terreno — entradas de auto, banquetas, patios, accesos, escalones y guarnición con cuneta: subrasante y base, cimbra, refuerzo, colado, acabado escobillado, juntas de control y de aislamiento, y curado.',
    glossary: [
      { term: 'Subgrade', term_es: 'Subrasante', def: 'The native soil, cut or filled and compacted, that the base and slab sit on.', def_es: 'El suelo natural, cortado o rellenado y compactado, sobre el que van la base y la losa.' },
      { term: 'Aggregate base', term_es: 'Base de grava', def: 'Compacted layer of crushed stone under the slab that drains and gives even support.', def_es: 'Capa compactada de piedra triturada bajo la losa que drena y da apoyo parejo.' },
      { term: 'Control joint', term_es: 'Junta de control', def: 'Groove tooled or sawed into the slab so shrinkage cracks happen in a straight line there.', def_es: 'Ranura hecha con herramienta o sierra para que las grietas por contracción salgan rectas en ese lugar.' },
      { term: 'Isolation joint', term_es: 'Junta de aislamiento', def: 'Full-depth strip of filler that separates the slab from the house, garage slab, steps or curb so each can move.', def_es: 'Tira de relleno de todo el espesor que separa la losa de la casa, losa de cochera, escalones o guarnición para que cada uno se mueva.' },
      { term: 'Apron', term_es: 'Acceso vehicular (rampa de entrada)', def: 'The part of a driveway between the street and the sidewalk, often in the public right-of-way.', def_es: 'La parte de la entrada entre la calle y la banqueta, muchas veces en la vía pública.' },
      { term: 'Broom finish', term_es: 'Acabado escobillado', def: 'Texture dragged across fresh concrete with a broom so the surface is not slippery.', def_es: 'Textura que se pasa con escoba sobre el concreto fresco para que la superficie no sea resbalosa.' },
      { term: 'Bull float', term_es: 'Llana de mango largo (bull float)', def: 'Wide float on a long handle used right after screeding to level and embed the stone.', def_es: 'Llana ancha con mango largo que se usa justo después de reglear para nivelar y hundir la piedra.' },
      { term: 'Air-entrained concrete', term_es: 'Concreto con aire incluido', def: 'Mix with tiny air bubbles added so it survives freezing, thawing and salt.', def_es: 'Mezcla con burbujas de aire diminutas para que resista congelación, deshielo y sal.' },
      { term: 'Scaling', term_es: 'Descascaramiento', def: 'Surface flaking or peeling, usually from freeze-thaw, deicers or finishing with bleed water on top.', def_es: 'Desprendimiento de la superficie, casi siempre por congelación, sales de deshielo o por dar acabado con agua de sangrado.' },
      { term: 'Detectable warning', term_es: 'Superficie táctil de advertencia', def: 'Panel of raised domes at the bottom of a curb ramp that a cane or foot can feel.', def_es: 'Placa con domos en relieve al pie de una rampa de banqueta que se siente con el bastón o el pie.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  equipment: [
    { when: { title_re: 'driveway|sidewalk|walk|patio|flatwork|apron|curb|gutter|slab' }, type: 'skid_steer', reason: 'Strip sod, cut subgrade and spread base stone', optional: true },
    { when: { title_re: 'driveway|sidewalk|walk|patio|flatwork|apron|curb|gutter|slab' }, type: 'compactor', reason: 'Compact subgrade and aggregate base in lifts before forming' },
    { when: { title_re: 'driveway|patio|flatwork|apron|curb|gutter' }, type: 'concrete_pump', reason: 'Reach backyard patios or long drives where the truck chute cannot', optional: true },
    { when: { title_re: 'remov|demo|tear.?out|replace' }, type: 'dump_truck', reason: 'Haul broken-out concrete or asphalt off site', optional: true },
  ],
  hazards: [
    { id: 'truck_backing', hazard: 'Struck by a backing ready-mix truck, dump truck or skid steer on a tight driveway', hazard_es: PENDING_ES, controls: ['Back trucks only with a working reverse alarm or a spotter signaling', 'Keep the crew out of the blind zone behind the truck and between truck and house'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'equipment_reverse', hazard: 'Run over by a skid steer, loader or roller working in reverse during grading and base work', hazard_es: PENDING_ES, controls: ['Use only machines with a working reverse alarm or a spotter', 'Make eye contact with the operator before walking into the work area'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'rebar_impalement', hazard: 'Impalement on form stakes or rebar dowels sticking up from the ground', hazard_es: PENDING_ES, controls: ['Cap or guard every protruding rebar end and form stake', 'Cut stakes flush with the form top when practical'], controls_es: PENDING_ES, osha_ref: '1926.701(b)', severity: 3, prov: osha('q') },
    { id: 'utility_strike', hazard: 'Hitting a buried gas, electric or water line while cutting subgrade or driving form stakes', hazard_es: PENDING_ES, controls: ['Call the one-call (811) center and wait for marks before digging', 'Hand-dig near marked lines; never drive stakes over a marked line'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'traffic_row', hazard: 'Struck by passing traffic while working on an apron, curb & gutter or public sidewalk', hazard_es: PENDING_ES, controls: ['Set up signs, cones and barricades per the traffic control plan before work starts', 'Use trained flaggers in high-visibility garments when traffic must be stopped'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(1)', severity: 4, ppe: ['high-visibility vest'], prov: osha('g') },
    { id: 'cement_burns', hazard: 'Chemical burns from wet concrete soaking through clothing, boots or gloves while placing and finishing', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, rubber boots with pants over the tops, and eye protection', 'Wash skin contact right away with clean water; change concrete-soaked clothes'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['waterproof gloves', 'rubber boots', 'safety glasses', 'knee pads'], prov: osha('e') },
    { id: 'silica_sawcut', hazard: 'Silica dust from saw-cutting control joints or cutting out old concrete', hazard_es: PENDING_ES, controls: ['Use a saw with an integrated water feed that keeps the blade wet', 'Follow the Table 1 controls for the saw; use a respirator where Table 1 calls for one'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection', 'respirator when Table 1 requires'], prov: osha('z') },
    { id: 'power_trowel', hazard: 'Struck or caught by a ride-on or walk-behind power trowel', hazard_es: PENDING_ES, controls: ['Use only trowels with a working dead-man switch that stops the blades when the handles are released', 'Keep others off the slab while the trowel runs'], controls_es: PENDING_ES, osha_ref: '1926.702(c)', severity: 3, prov: osha('q') },
    { id: 'pump_line', hazard: 'Pump hose whip or a blowout when a pumped line plugs', hazard_es: PENDING_ES, controls: ['Support and secure pump discharge pipe and hose', 'Never open or uncouple a line under pressure; follow the pump operator'], controls_es: PENDING_ES, osha_ref: '1926.702(e)(1)', severity: 3, prov: osha('q') },
    { id: 'tool_shock', hazard: 'Shock from saws, vibratory screeds and cords on wet concrete', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle and cord set', 'Keep cord connections out of water and off the wet slab'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'utilities_marked', phase: 'sitework', item: 'One-call (811) locate done and marks visible before any subgrade cut or stake driving.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'subgrade_firm', phase: 'sitework', item: 'Sod, topsoil and soft spots removed; subgrade compacted and firm under a loaded wheelbarrow or proof-roll — no frost, mud or standing water.', item_es: tr('Pasto, tierra vegetal y zonas blandas retirados; subrasante compactada y firme al pasar una carretilla cargada o rodillo de prueba — sin escarcha, lodo ni agua estancada.'), prov: dot602('602.3.2.1 prepare and compact the foundation') },
    { id: 'base_compacted', phase: 'sitework', item: 'Aggregate base placed to the plan thickness and compacted in lifts; base extends past the slab edges.', item_es: tr('Base de grava colocada al espesor del plano y compactada por capas; la base sobresale de los bordes de la losa.'), prov: dot602('602.3.2.1 — foundation wider than the slab in embankments') },
    { id: 'forms_grade', phase: 'sitework', item: 'Forms straight, full slab depth, staked and braced to line and grade, and oiled; slab pitched to drain away from the building with no low spots.', item_es: tr('Cimbra recta, del espesor completo de la losa, estacada y apuntalada a línea y nivel, y aceitada; losa con pendiente que drena lejos del edificio y sin puntos bajos.'), prov: dot602('602.3.2.2 forms') },
    { id: 'thickness_check', phase: 'sitework', item: 'Slab thickness checked at the forms and across the base before the pour (string line or depth gauge) — no thin spots over high base.', item_es: tr('Espesor de losa verificado en la cimbra y sobre la base antes del colado (hilo o calibrador) — sin zonas delgadas sobre base alta.'), prov: dot602('602.3.2.3 pre-placement thickness check') },
    { id: 'isolation_joints', phase: 'sitework', item: 'Full-depth isolation filler set wherever the slab meets the house, garage slab, steps, curb, light poles or existing walks.', item_es: tr('Relleno de aislamiento de todo el espesor colocado donde la losa toca la casa, losa de cochera, escalones, guarnición, postes o banquetas existentes.'), prov: { ...cip6('isolation joints separate drives/patios from walks, garage slabs, stairs, poles; WisDOT 601/602 put filler at curbs, buildings and curb radius points'), src: ['concrete_flatwork-nrmca-cip6', 'concrete_flatwork-wisdot-ss-602', 'concrete_flatwork-wisdot-ss-601'] } },
    { id: 'air_entrained_mix', item: 'Delivery ticket shows the exterior mix ordered — air-entrained for freeze-thaw and deicer exposure, at the specified strength; no water added beyond what the mix allows.', item_es: tr('La remisión muestra la mezcla exterior pedida — con aire incluido para congelación y sales de deshielo, a la resistencia especificada; sin agua agregada más allá de lo permitido.'), prov: { ...cip2('exterior slabs exposed to freezing and deicers: air-entrained, ~4000 psi'), src: ['concrete_flatwork-nrmca-cip2', 'concrete_flatwork-ufgs-32-13-13-06'] } },
    { id: 'no_bleed_finish', item: 'Bull-floated before bleed water appears; no floating, troweling or brooming while bleed water is on the surface; no water sprinkled on to finish.', item_es: tr('Pasar la llana de mango largo antes de que salga el agua de sangrado; no allanar, alisar ni escobillar con agua de sangrado en la superficie; no rociar agua para dar acabado.'), prov: cip14 },
    { id: 'broom_texture', item: 'Exterior walking and driving surfaces get a uniform broom texture across the direction of travel (not a hard steel-trowel finish) unless another finish is specified.', item_es: tr('Las superficies exteriores para caminar y circular llevan textura de escoba uniforme a lo ancho del sentido de paso (no acabado liso de llana metálica) salvo otro acabado especificado.'), prov: { ...cip2('broom finish adequate for most exterior surfaces; avoid overworking'), src: ['concrete_flatwork-nrmca-cip2', 'concrete_flatwork-ufgs-32-13-13-06'] } },
    { id: 'joint_spacing', item: 'Control joints laid out at roughly 2–3 times the slab thickness in feet (about 10 ft max for a 4 in. slab), panels near square (length ≤ 1.5× width), and no L-shaped panels.', item_es: tr('Juntas de control trazadas a unas 2–3 veces el espesor de la losa en pies (unos 10 pies máx. para losa de 4 pulg), tableros casi cuadrados (largo ≤ 1.5 veces el ancho) y sin tableros en forma de L.'), prov: cip6('max spacing 24–36× slab thickness; ≈10 ft for 4 in.; length ≤ 1.5× width') },
    { id: 'joint_depth', item: 'Control joints tooled or sawed at least 1/4 of the slab depth (never under 1 in.); saw cuts made the same day, before random cracks form but after the edges stop raveling.', item_es: tr('Juntas de control hechas con herramienta o sierra a por lo menos 1/4 del espesor (nunca menos de 1 pulg); cortes con sierra el mismo día, antes de que salgan grietas pero cuando los bordes ya no se desmoronan.'), prov: { ...cip6('groove ≥ 1/4 depth, ≥ 1 in.; conventional saw-cut within 4–12 h'), src: ['concrete_flatwork-nrmca-cip6', 'concrete_flatwork-wisdot-ss-602'] } },
    { id: 'surface_true', item: 'Finished surface checked with a 10 ft straightedge — no spot off more than about 1/4 in., no birdbaths after rain or a hose test.', item_es: tr('Superficie terminada revisada con regla de 10 pies — ningún punto fuera más de unos 1/4 pulg, sin charcos después de lluvia o prueba con manguera.'), prov: dot602('602.3.2.3 10 ft straightedge, correct 1/4 in. variations') },
    { id: 'curing_started', item: 'Curing starts right after finishing (membrane compound or wet cover) and continues at least 3–7 days; slab protected from freezing and from traffic until it has strength.', item_es: tr('El curado inicia justo después del acabado (membrana de curado o cubierta húmeda) y sigue por lo menos 3 a 7 días; losa protegida de congelación y de tránsito hasta que gane resistencia.'), prov: cip11 },
    { id: 'traffic_opening', item: 'Driveway not opened to cars until the concrete has enough strength (WisDOT uses about 2,000 psi for residential drives, 3,000 psi for commercial); walks only when foot traffic will not mark the surface.', item_es: tr('No abrir la entrada a autos hasta que el concreto tenga suficiente resistencia (WisDOT usa unos 2,000 psi para entradas residenciales y 3,000 psi para comerciales); banquetas solo cuando las pisadas ya no marquen la superficie.'), prov: dot602('602.3.2.7 opening to service') },
    { id: 'no_deicers_first_winter', item: 'Owner told in writing: no deicing salts on the new slab its first winter (use sand for traction), and apply a breathable penetrating sealer once the slab has dried.', item_es: tr('Se le indicó al dueño por escrito: no usar sales de deshielo sobre la losa nueva el primer invierno (usar arena para tracción) y aplicar un sellador penetrante transpirable cuando la losa esté seca.'), prov: cip2('avoid deicers on new concrete; silane/siloxane breathable sealer') },
  ],
  inspection_checklists: {
    pre_pour_check: [
      { item: 'Utility marks honored; no stakes or cuts over marked lines', item_es: PENDING_ES },
      { item: 'Subgrade firm and compacted; base at plan thickness and compacted', item_es: tr('Subrasante firme y compactada; base al espesor del plano y compactada') },
      { item: 'Forms to line and grade; slope away from the building confirmed with a level or string', item_es: tr('Cimbra a línea y nivel; pendiente lejos del edificio confirmada con nivel o hilo') },
      { item: 'Isolation filler in place at house, garage slab, steps, curb and existing walks', item_es: tr('Relleno de aislamiento colocado en la casa, losa de cochera, escalones, guarnición y banquetas existentes') },
      { item: 'Mesh or rebar on chairs at mid-depth (if specified); dowels capped', item_es: PENDING_ES },
      { item: 'Joint layout marked on the forms; curing compound, broom and saw on site', item_es: tr('Trazo de juntas marcado en la cimbra; membrana de curado, escoba y sierra en la obra') },
      { item: 'Truck route and washout spot set; spotter assigned for backing', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Uniform broom texture; no trowel-burn slick spots on walking surfaces', item_es: tr('Textura de escoba uniforme; sin zonas lisas resbalosas en superficies para caminar') },
      { item: 'Control joints straight, at layout spacing and deep enough; no random cracks', item_es: tr('Juntas de control rectas, al espaciado del trazo y con la profundidad suficiente; sin grietas al azar') },
      { item: 'Edges tooled; no honeycomb or broken edges after form stripping', item_es: tr('Bordes boleados; sin oquedades ni bordes rotos al quitar la cimbra') },
      { item: 'Water drains off with no birdbaths; slab sheds away from the foundation', item_es: tr('El agua escurre sin charcos; la losa desagua lejos de la cimentación') },
      { item: 'Backfill placed and compacted along slab edges; site cleaned', item_es: tr('Relleno colocado y compactado a lo largo de los bordes; obra limpia') },
      { item: 'Owner given curing, first-winter no-salt and sealer care notes', item_es: tr('Se entregaron al dueño las indicaciones de curado, de no usar sal el primer invierno y de sellador') },
    ],
    row_permit_check: [
      { item: 'Right-of-way / driveway permit issued and posted before breaking the curb or sidewalk', item_es: tr('Permiso de vía pública o de acceso vehicular emitido y a la vista antes de romper la guarnición o la banqueta') },
      { item: 'Traffic control (signs, cones, barricades) in place per the approved plan', item_es: PENDING_ES },
      { item: 'Municipal inspector checked base, forms and apron thickness before the pour, if the permit requires it', item_es: tr('El inspector municipal revisó base, cimbra y espesor del acceso antes del colado, si el permiso lo requiere'), ref: 'WisDOT 602.3.2.3' },
      { item: 'Apron width, curb cut and thickness match the municipal driveway standard', item_es: tr('El ancho del acceso, el corte de guarnición y el espesor coinciden con la norma municipal de accesos') },
      { item: 'Public sidewalk crossing kept at the walk cross-slope and joint pattern, with expansion filler at the curb and walk', item_es: tr('El cruce de la banqueta pública conserva la pendiente transversal y el patrón de juntas de la banqueta, con relleno de expansión en la guarnición y la banqueta'), ref: 'WisDOT 602.3.2.5' },
      { item: 'Curb ramps have detectable warnings set in plastic concrete where the city requires them', item_es: tr('Las rampas de banqueta tienen superficie táctil colocada en el concreto fresco donde la ciudad lo exige'), ref: 'WisDOT 602.3.2.3' },
      { item: 'Curb & gutter joints match adjacent pavement joints; expansion joints at radius points and next to inlets', item_es: tr('Las juntas de la guarnición con cuneta coinciden con las del pavimento contiguo; juntas de expansión en los puntos de radio y junto a las coladeras'), ref: 'WisDOT 601.3.6' },
    ],
  },
  assemblies: [
    { code: 'B-CFW-CURB-GUTTER-LF', name: 'Concrete curb & gutter, 30 in. combined section, hand-formed, per LF', name_es: 'Guarnición con cuneta de concreto, sección combinada de 30 pulg, cimbrada a mano, por pie lineal', unit: 'LF', csi: '32 16 13',
      material_cost_cents: { v: 1500, prov: est('≈0.08 CY/LF ready-mix at the B-CONCRETE-CY baseline + form oil/stakes share, 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('3-person hand-form crew ≈100 LF/day incl. stripping; slipform is far faster') },
      equipment_cost_cents: { v: 100, prov: est('skid steer / truck share') }, waste_pct: { v: 5, prov: est('ready-mix over-order') } },
    { code: 'B-CFW-CURBCUT-LF', name: 'Remove existing curb & gutter for a driveway opening (saw-cut, break out, haul), per LF', name_es: 'Retiro de guarnición con cuneta existente para abrir acceso (corte con sierra, demolición, acarreo), por pie lineal', unit: 'LF', csi: '02 41 13',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 0.35, prov: est('saw both ends + full-depth cut, break out, load') },
      equipment_cost_cents: { v: 400, prov: est('wet saw blade wear + skid steer/breaker + haul/dump fee share') }, waste_pct: { v: 0, prov: est('removal item') } },
    { code: 'B-CFW-ISOJOINT-LF', name: 'Isolation (expansion) joint, 1/2 in. preformed filler, full depth, per LF', name_es: 'Junta de aislamiento (expansión), relleno preformado de 1/2 pulg, todo el espesor, por pie lineal', unit: 'LF', csi: '32 13 73',
      material_cost_cents: { v: 75, prov: est('asphalt-fiber or foam filler strip 4–6 in. + stakes/adhesive') }, labor_hours_per_unit: { v: 0.02, prov: est('cut and set against structure before the pour') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('cut-offs') } },
    { code: 'B-CFW-JOINTSEAL-LF', name: 'Joint sealing — backer rod + self-leveling sealant in flatwork joints, per LF', name_es: 'Sellado de juntas — cordón de respaldo y sellador autonivelante en juntas de losas, por pie lineal', unit: 'LF', csi: '32 13 73',
      material_cost_cents: { v: 120, prov: est('closed-cell backer rod + polyurethane self-leveling sealant at ~1/2 in. joint') }, labor_hours_per_unit: { v: 0.03, prov: est('clean joint, set rod, gun sealant') },
      equipment_cost_cents: { v: 0, prov: est('hand tools / blower') }, waste_pct: { v: 10, prov: est('tube ends and overfill') } },
    { code: 'B-CFW-DETWARN-EA', name: 'Detectable warning panel 2 × 4 ft, cast in plastic concrete at a curb ramp, each', name_es: 'Placa táctil de advertencia de 2 × 4 pies, colocada en concreto fresco en rampa de banqueta, c/u', unit: 'EA', csi: '32 17 26',
      material_cost_cents: { v: 16000, prov: est('cast-in-place composite or cast-iron panel 24×48 in., national baseline 2026 — city lists may require cast iron (higher)') }, labor_hours_per_unit: { v: 1.0, prov: est('set, weight and finish around panel in plastic concrete') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  quantity_rules: [
    { code: 'B-FLATWORK-SF', assumption: 'Single-family default until measured: two-car driveway ≈20×24 ft + 4 ft × 40 ft front walk ≈ 640 SF of 4 in. broom flatwork', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 640 } },
    { code: 'B-AGG-BASE-SY', assumption: '6 in. compacted aggregate base under the ≈640 SF default driveway + walk (640 SF ÷ 9)', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 640 / 9, round: 'ceil' } },
    { code: 'B-FLAT-SAWCUT-LF', assumption: 'Control joints ≈10 ft on center each way on the ≈640 SF default (area ÷ 5 LF, same rule the Design Studio intake uses)', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 128 } },
    { code: 'B-FLAT-THICK-SF-IN', assumption: 'Street apron ≈20×6 ft thickened from 4 in. to 6 in. (120 SF × 2 in.) — check the municipal driveway standard', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 240 } },
    { code: 'B-CFW-ISOJOINT-LF', assumption: 'Isolation filler ≈40 LF: driveway to garage slab (≈20 LF) + walk to stoop/foundation and public walk (≈20 LF)', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 40 } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'site_utilities'], note: 'Pour flatwork after foundation backfill has settled and utility trenches under the drive and walks are compacted.' },
    { before_phase: 'punch', note: 'Finish drives and walks before final punch; many municipalities need the apron and public walk done (or escrowed) before occupancy.' },
  ],
  intake_hook: { module_id: 'concrete_flatwork' },
});
