// Trade Knowledge Pack — asphalt_paving (Asphalt Paving: driveways, parking lots, overlays, patching, sealcoating).
// Wave 06, COMPLEMENT pattern: the hand recipe in task-buildout/building.ts (asphalt/flatwork branch) keeps
// producing the work steps (Prep subgrade & base → Pave & compact asphalt); this pack adds glossary, hazards,
// QA, owner/GC hold-point checklists (no AHJ building gate → no gates, no code_refs), equipment hints, the
// overlay/maintenance assemblies the catalog lacks, and component-gated quantities. B-ASPHALT-SY and
// B-AGG-BASE-SY (migration 0037) are referenced, never redeclared. Line striping belongs to pavement_marking.
// Dossier: docs/trade-packs/dossiers/asphalt_paving.md. Sources: WisDOT Std Spec 211/305/450/455/460/465 +
// Average Unit Price List (FY2025), FHWA tack coat tech brief, NIOSH asphalt fumes, MUTCD Part 6,
// 29 CFR 1926 Subparts C, D, E, F, G, O, P, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string | string[], note?: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ss305 = (note?: string) => src('asphalt_paving-wisdot-ss-305', note);
const ss450 = (note?: string) => src('asphalt_paving-wisdot-ss-450', note);
const ss455 = (note?: string) => src('asphalt_paving-wisdot-ss-455', note);
const ss460 = (note?: string) => src('asphalt_paving-wisdot-ss-460', note);
const tack = (note?: string) => src(['asphalt_paving-fhwa-tack', 'asphalt_paving-wisdot-ss-455'], note);
const seal = (note?: string) => src('asphalt_paving-sealmaster-spec', note);
const osha = (sub: string, extra: string[] = []) => src([`ecfr-1926-${sub}`, ...extra]);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const aup = (note: string) => ({ src: ['asphalt_paving-wisdot-aup'], confidence: 'derived' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'asphalt_paving',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Hot-mix asphalt driveways, parking lots and drive aisles, plus overlays, milling, patching, crack sealing and sealcoating: proof-rolled and compacted base, tack coat, paving at temperature, rolling to density, tight joints and drainage.',
    summary_es: 'Entradas de auto, estacionamientos y pasillos de asfalto en caliente, además de sobrecarpetas, fresado, bacheo, sellado de grietas y sellador: base compactada y probada con rodillo, riego de liga, pavimentación a temperatura, compactación a densidad, juntas bien cerradas y buen drenaje.',
    glossary: [
      { term: 'Hot-mix asphalt (HMA)', term_es: 'Mezcla asfáltica en caliente', def: 'Stone, sand and asphalt binder mixed hot at a plant and trucked to the job to be paved while still hot.', def_es: 'Piedra, arena y asfalto mezclados en caliente en planta y llevados en camión a la obra para tenderlos aún calientes.' },
      { term: 'Binder course', term_es: 'Capa de liga (capa inferior)', def: 'Lower asphalt layer with bigger stone that carries the load under the surface course.', def_es: 'Capa inferior de asfalto con piedra más grande que soporta la carga debajo de la capa de rodamiento.' },
      { term: 'Surface course', term_es: 'Capa de rodamiento', def: 'Top asphalt layer with finer stone that cars drive on.', def_es: 'Capa superior de asfalto con piedra más fina sobre la que circulan los autos.' },
      { term: 'Tack coat', term_es: 'Riego de liga', def: 'Thin spray of asphalt emulsion on an existing or lower layer so the new asphalt bonds to it.', def_es: 'Rociado delgado de emulsión asfáltica sobre una capa existente o inferior para que el asfalto nuevo se pegue.' },
      { term: 'Mat', term_es: 'Carpeta (tendido)', def: 'The strip of fresh asphalt laid by the paver.', def_es: 'La franja de asfalto fresco que deja la pavimentadora.' },
      { term: 'Proof roll', term_es: 'Prueba con rodillo cargado', def: 'Driving a loaded truck or heavy roller over the base to find soft spots that move or rut.', def_es: 'Pasar un camión cargado o rodillo pesado sobre la base para encontrar zonas blandas que se mueven o se marcan.' },
      { term: 'Milling', term_es: 'Fresado', def: 'Grinding off the top of old pavement with a drum machine before an overlay.', def_es: 'Rebajar la parte superior del pavimento viejo con una máquina de tambor antes de una sobrecarpeta.' },
      { term: 'Cold joint', term_es: 'Junta fría', def: 'Seam where new asphalt meets a lane or edge that has already cooled; it must be cut back and tacked.', def_es: 'Unión donde el asfalto nuevo toca un carril o borde ya frío; hay que recortarla y aplicarle riego de liga.' },
      { term: 'Lute', term_es: 'Rastrillo de asfalto (lute)', def: 'Flat-edged rake used to level hand-placed asphalt and fix the mat edge.', def_es: 'Rastrillo de borde plano para nivelar asfalto colocado a mano y arreglar la orilla de la carpeta.' },
      { term: 'Sealcoat', term_es: 'Sellador de pavimento', def: 'Thin emulsion coating squeegeed or sprayed on cured asphalt to slow weathering.', def_es: 'Capa delgada de emulsión aplicada con jalador o rociada sobre asfalto ya curado para frenar el desgaste.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  equipment: [
    { when: { title_re: 'asphalt|paving|pave|blacktop|parking|drive|overlay|truck court' }, type: 'compactor', reason: 'Roll the aggregate base and compact the hot mat to density behind the paver' },
    { when: { title_re: 'asphalt|paving|pave|blacktop|parking|drive|overlay|mill|truck court' }, type: 'dump_truck', reason: 'Deliver hot mix to the paver and haul millings or broken-out pavement', optional: true },
    { when: { title_re: 'asphalt|paving|pave|blacktop|parking|drive|patch|truck court' }, type: 'skid_steer', reason: 'Fine-grade base, spread stone and place mix by hand in tight areas', optional: true },
  ],
  hazards: [
    { id: 'hot_mix_burns', hazard: 'Burns from hot mix (about 300 °F), screed plates, tack and crack-seal melters, or hot material splashing from a truck bed', hazard_es: PENDING_ES, controls: ['Wear long sleeves, long pants, gloves and leather boots — no bare skin near the hopper, screed or melter', 'Stay clear of the truck bed when it raises and of the hopper wings when they fold', 'Cool a burn with clean water right away and get first aid; never peel stuck asphalt off skin'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['heat-resistant gloves', 'long sleeves', 'leather boots', 'safety glasses'], prov: osha('e') },
    { id: 'asphalt_fumes', hazard: 'Breathing asphalt fumes at the paver, screed and hopper (NIOSH REL ceiling 5 mg/m³; OSHA has no PEL)', hazard_es: PENDING_ES, controls: ['Use the paver engineering fume controls and keep them running', 'Work upwind of the screed and hopper when you can; rotate workers off the screed', 'Train the crew on fume exposure and keep mix temperature within the supplier range — overheated mix smokes more'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, prov: src(['asphalt_paving-niosh-npg-asphalt', 'ecfr-1926-c'], 'No OSHA PEL for asphalt fumes — training duty 1926.21(b)(2) + NIOSH REL') },
    { id: 'truck_backing', hazard: 'Struck by a backing dump truck delivering mix to the paver or hauling millings', hazard_es: PENDING_ES, controls: ['Back trucks only with a working reverse alarm or an observer signaling', 'One trained spotter guides trucks to the paver; everyone else stays out of the blind zone'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'roller_paver_reverse', hazard: 'Run over or crushed by a roller, paver or skid steer working back and forth over the mat', hazard_es: PENDING_ES, controls: ['Run only machines with a working reverse alarm, or have a worker signal that it is safe', 'Make eye contact with the operator before walking behind or beside a roller; never ride on the screed deck unless it is built for a rider'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'work_zone_traffic', hazard: 'Struck by passing traffic while paving a street apron, drive entrance or a lot that stays open', hazard_es: PENDING_ES, controls: ['Set signs, cones and barricades per the traffic control plan (MUTCD Part 6) before work starts', 'Keep a buffer between traffic and the crew; close the area to cars, not just the lane being paved'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(2)', severity: 4, ppe: ['high-visibility vest'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'flagger_exposure', hazard: 'Flagger struck by a vehicle while controlling traffic at the work zone', hazard_es: PENDING_ES, controls: ['Use only trained flaggers in high-visibility garments with a STOP/SLOW paddle per MUTCD Part 6', 'Stand on the shoulder with an escape route — never in the open lane'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility vest', 'hard hat'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'heat_stress', hazard: 'Heat exhaustion or heat stroke working on hot black pavement next to 300 °F mix in summer sun', hazard_es: PENDING_ES, controls: ['Keep cool drinking water at the job and drink small amounts often', 'Take rest breaks in shade; build up new workers over the first days', 'Watch each other for confusion, cramps or stopped sweating — call 911 for heat stroke'], controls_es: PENDING_ES, osha_ref: '1926.51(a)(1)', severity: 3, prov: osha('d') },
    { id: 'silica_milling', hazard: 'Silica dust from milling, saw-cutting or breaking out pavement, especially over concrete', hazard_es: PENDING_ES, controls: ['Use milling machines with drum exhaust ventilation and water sprays as listed in Table 1', 'Keep water feed on saws; follow the Table 1 respirator rule for the tool and task'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection', 'respirator when Table 1 requires'], prov: osha('z') },
    { id: 'tack_slip', hazard: 'Slipping on fresh, unbroken tack coat or tracking it onto ramps, steps and walks', hazard_es: PENDING_ES, controls: ['Walk on untacked areas or wait until the tack breaks (turns from brown to black)', 'Wear slip-resistant boots; clean tracked tack off walks and steps right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['slip-resistant boots'], prov: osha('e', ['asphalt_paving-fhwa-tack']) },
    { id: 'utility_strike', hazard: 'Hitting a buried gas, electric or water line while undercutting soft spots or digging base', hazard_es: PENDING_ES, controls: ['Call the one-call (811) center and wait for marks before any digging', 'Hand-dig near marks; stop and call the owner if you expose an unmarked line'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'propane_screed', hazard: 'Fire or explosion from propane screed heaters, torches or melter burners', hazard_es: PENDING_ES, controls: ['Inspect hoses, regulators and fittings before lighting; leak-test with soapy water, never a flame', 'Secure cylinders upright, valves closed when not in use, away from the hot screed; keep a fire extinguisher on the paver'], controls_es: PENDING_ES, osha_ref: '1926.153', severity: 3, prov: osha('f') },
  ],
  qa_checklist: [
    { id: 'utilities_marked', phase: 'sitework', item: 'One-call (811) locate done and marks visible before undercutting, grading or driving any stakes.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'traffic_control_set', phase: 'sitework', item: 'Signs, cones and barricades set per the traffic control plan before paving any street apron or open lot; flaggers trained and in high-visibility garments.', item_es: PENDING_ES, safety: true, prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'base_compacted', phase: 'sitework', item: 'Aggregate base placed to plan thickness and compacted in lifts (about 6 in. compacted per lift, up to 8 in. with a vibratory roller).', item_es: tr('Base de grava colocada al espesor del plano y compactada por capas (unas 6 pulg compactadas por capa, hasta 8 pulg con rodillo vibratorio).'), prov: ss305('305.3.2.2 layer limits') },
    { id: 'base_proof_rolled', phase: 'sitework', item: 'Soft or yielding subgrade dug out and replaced; base proof-rolled with a loaded truck or heavy roller — no rutting, pumping or movement; base dry, unfrozen and swept clean.', item_es: tr('Subrasante blanda o que cede excavada y reemplazada; base probada con camión cargado o rodillo pesado — sin roderas, bombeo ni movimiento; base seca, sin congelar y barrida.'), prov: src(['asphalt_paving-wisdot-ss-211', 'asphalt_paving-wisdot-ss-450'], 'WisDOT 211.3 correct yielding areas; 450.3.2.1.1(3) firm, compacted, not frozen or unstable') },
    { id: 'weather_ok', item: 'Air temperature in the shade at least about 36 °F for the top layer (32 °F for lower layers) and rising, no rain on the base; colder paving only under a written cold-weather plan.', item_es: tr('Temperatura del aire a la sombra de por lo menos unos 36 °F para la capa superior (32 °F para capas inferiores) y subiendo, sin lluvia sobre la base; con más frío solo bajo un plan escrito de clima frío.'), prov: ss450('450.3.2.1.1(1) and 450.3.2.1.2') },
    { id: 'tack_on_existing', phase: 'sitework', item: 'Before an overlay or between lifts: surface swept clean and dry, tack coat sprayed in one even coat over the full width (more on a milled surface), no puddles, and let it break (brown to black) before paving.', item_es: tr('Antes de una sobrecarpeta o entre capas: superficie barrida, limpia y seca, riego de liga en una sola capa pareja en todo el ancho (más en superficie fresada), sin charcos, y se deja romper (de café a negro) antes de pavimentar.'), prov: tack('WisDOT 455.3.2: 0.050–0.070 gal/SY diluted, clean surface, no standing water; FHWA: milled surfaces need a higher rate') },
    { id: 'mat_temperature', item: 'Mix temperature checked with an infrared gun at the truck and behind the screed and logged; loads outside the supplier range (WisDOT: within 20 °F of the recommended temperature) are rejected.', item_es: tr('Temperatura de la mezcla medida con termómetro infrarrojo en el camión y detrás de la regla y anotada; se rechazan cargas fuera del rango del proveedor (WisDOT: dentro de 20 °F de la temperatura recomendada).'), prov: ss450('450.3.2.3 delivery within 20 F of supplier recommendation') },
    { id: 'compact_while_hot', item: 'Rolling starts right behind the paver while the mat is hot and continues until the rollers no longer leave marks; edges and spots the roller cannot reach are hand-tamped.', item_es: tr('El rodillo trabaja justo detrás de la pavimentadora mientras la carpeta está caliente y sigue hasta que ya no deja marcas; orillas y zonas sin acceso del rodillo se compactan con pisón manual.'), prov: ss450('450.3.2.6.1(1)–(3) compact while hot, hand tamp edges') },
    { id: 'density_check', item: 'Field density checked where the job calls for it (nuclear gauge or cores) — WisDOT target is about 93% of maximum density for traffic and parking lanes; driveways compacted until no further movement shows.', item_es: tr('Densidad de campo revisada donde el trabajo lo pida (densímetro nuclear o núcleos) — WisDOT pide cerca del 93% de la densidad máxima en carriles y estacionamientos; entradas de auto compactadas hasta que ya no se vea movimiento.'), prov: ss460('table 460-3; 450.3.2.6.2 ordinary compaction for driveways') },
    { id: 'lift_thickness', item: 'Compacted lift thickness checked with a probe or core against the plan; each lift within the range the mix size allows (e.g. about 1.75 in. minimum for a 12.5 mm mix).', item_es: tr('Espesor compactado de cada capa verificado con varilla o núcleo contra el plano; cada capa dentro del rango que permite el tamaño de la mezcla (p. ej. unas 1.75 pulg mínimo para mezcla de 12.5 mm).'), prov: ss460('460.3.2 thickness limits by nominal size') },
    { id: 'joints_tight', item: 'Joints made hot where possible; cold joints and butt joints cut back to a straight vertical face, tacked, and rolled flush with no gap or step.', item_es: tr('Juntas hechas en caliente cuando se pueda; juntas frías y a tope recortadas a cara vertical recta, con riego de liga y compactadas al ras sin hueco ni escalón.'), prov: ss450('450.3.2.8 jointing — cut back, tack, co-planar') },
    { id: 'drainage_slope', item: 'Finished surface drains — cross slope about 1–2% minimum toward inlets or edges, no birdbaths after rain or a hose test, and water sheds away from the building.', item_es: tr('La superficie terminada drena — pendiente transversal mínima de alrededor de 1–2% hacia coladeras u orillas, sin charcos después de lluvia o prueba con manguera, y el agua corre lejos del edificio.'), prov: est('Common practice minimum slope for asphalt parking/drives; plan grades govern') },
    { id: 'smoothness', item: 'Top layer checked with a 10 ft straightedge — no more than about 1/8 in. variation (1/4 in. on lower layers); humps and dips corrected.', item_es: tr('Capa superior revisada con regla de 10 pies — no más de unos 1/8 pulg de variación (1/4 pulg en capas inferiores); se corrigen bordos y depresiones.'), prov: ss450('450.3.2.9.1 smoothness') },
    { id: 'no_traffic_until_cooled', item: 'No hauling or car traffic on new asphalt until final rolling is done and the mat has cooled and hardened; owner told to avoid sharp turns and kickstands the first warm weeks.', item_es: tr('Sin acarreo ni tránsito de autos sobre el asfalto nuevo hasta terminar la compactación final y que la carpeta se enfríe y endurezca; se le indica al dueño evitar giros cerrados y patas de moto las primeras semanas de calor.'), prov: ss450('450.3.2.5(5) no hauling over a layer until final rolling') },
    { id: 'sealcoat_timing', item: 'Sealcoat only after the new asphalt has cured per the sealer label (commonly 30–90 days, longer in cool weather), cracks sealed first, at 50 °F and rising with no rain for 24 h.', item_es: tr('Aplicar sellador solo después de que el asfalto nuevo cure según la etiqueta del sellador (comúnmente 30–90 días, más con clima fresco), sellando primero las grietas, a 50 °F o más y subiendo, sin lluvia por 24 h.'), prov: seal('4.1 cure 30–60 days (other labels: 90 days or a season); 4.3 cracks first; 6.2 weather') },
  ],
  inspection_checklists: {
    base_proof_roll: [
      { item: 'Utility marks honored; no undercut or stakes over marked lines', item_es: PENDING_ES },
      { item: 'Subgrade shaped to grade; soft spots dug out and replaced', item_es: tr('Subrasante perfilada a nivel; zonas blandas excavadas y reemplazadas'), ref: 'WisDOT 211.3' },
      { item: 'Base stone at plan thickness, compacted in lifts', item_es: tr('Piedra de base al espesor del plano, compactada por capas'), ref: 'WisDOT 305.3.2' },
      { item: 'Proof roll with loaded truck or heavy roller — no rutting, pumping or deflection', item_es: tr('Prueba con camión cargado o rodillo pesado — sin roderas, bombeo ni deflexión') },
      { item: 'Base grades checked with laser or string — drains to inlets/edges, no flat spots', item_es: tr('Niveles de base revisados con láser o hilo — drena hacia coladeras u orillas, sin zonas planas') },
      { item: 'Curbs, inlets and structure frames set to final height before paving', item_es: tr('Guarniciones, coladeras y marcos de registros a su altura final antes de pavimentar') },
      { item: 'Base dry, unfrozen and swept of loose material', item_es: tr('Base seca, sin congelar y barrida de material suelto'), ref: 'WisDOT 450.3.2.1.1(3)' },
    ],
    paving_temperature_log: [
      { item: 'Air temperature in shade and forecast recorded at start of paving', item_es: tr('Temperatura del aire a la sombra y pronóstico anotados al iniciar la pavimentación'), ref: 'WisDOT 450.3.2.1.1' },
      { item: 'Delivery ticket checked: mix type, tons, time batched', item_es: tr('Remisión revisada: tipo de mezcla, toneladas, hora de carga') },
      { item: 'Mix temperature logged per load at the truck and behind the screed; out-of-range loads rejected', item_es: tr('Temperatura de la mezcla anotada por carga en el camión y detrás de la regla; cargas fuera de rango rechazadas'), ref: 'WisDOT 450.3.2.3' },
      { item: 'Tack coat applied and broken before paving (overlays and between lifts)', item_es: tr('Riego de liga aplicado y roto antes de pavimentar (sobrecarpetas y entre capas)'), ref: 'WisDOT 455.3.2' },
      { item: 'Rolling pattern started behind the paver while hot; finish rolling done before the mat cools', item_es: tr('Patrón de compactación iniciado detrás de la pavimentadora en caliente; compactación final antes de que la carpeta se enfríe') },
      { item: 'Compacted thickness probed and density readings recorded where required', item_es: tr('Espesor compactado medido con varilla y lecturas de densidad anotadas donde se requiera'), ref: 'WisDOT 460.3.2/460.3.3' },
      { item: 'Spotter assigned for truck exchanges at the paver; traffic control in place', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Uniform texture — no segregation, roller marks, tears or bleeding spots', item_es: tr('Textura uniforme — sin segregación, marcas de rodillo, desgarres ni zonas con exceso de asfalto') },
      { item: 'Joints tight, flush and sealed; no open seams at curbs, slabs or existing pavement', item_es: tr('Juntas cerradas, al ras y selladas; sin uniones abiertas en guarniciones, losas o pavimento existente') },
      { item: 'Water sheds to inlets/edges; no birdbaths after rain or hose test', item_es: tr('El agua escurre hacia coladeras u orillas; sin charcos después de lluvia o prueba con manguera') },
      { item: '10 ft straightedge checks within tolerance on the top layer', item_es: tr('Revisiones con regla de 10 pies dentro de tolerancia en la capa superior'), ref: 'WisDOT 450.3.2.9.1' },
      { item: 'Edges compacted and backfilled with topsoil or stone; no unsupported edge drop-off', item_es: tr('Orillas compactadas y rellenadas con tierra o piedra; sin escalón de orilla sin soporte') },
      { item: 'Owner given care notes: no traffic until cooled, avoid sharp turns, sealcoat timing', item_es: tr('Se entregaron al dueño las indicaciones: sin tránsito hasta enfriar, evitar giros cerrados, tiempo para sellador') },
      { item: 'Site cleaned of tracked tack, millings and spilled mix; striping scheduled after cure', item_es: tr('Obra limpia de riego arrastrado, fresado y mezcla derramada; señalamiento programado después del curado') },
    ],
  },
  assemblies: [
    { code: 'B-ASP-HMA-TON', name: 'Hot-mix asphalt pavement (binder or surface), placed and compacted by paver, per ton', name_es: 'Mezcla asfáltica en caliente (capa inferior o de rodamiento), tendida con pavimentadora y compactada, por tonelada', unit: 'TON', csi: '32 12 16',
      material_cost_cents: { v: 6000, prov: aup('≈80% of WisDOT FY2025 avg bid for 12.5 mm HMA (460.6224 $71.11, 460.5224 $75.11/ton) treated as plant mix + haul; remainder carried in labor/equipment') },
      labor_hours_per_unit: { v: 0.1, prov: est('6–7 person paving crew ≈500 t/day on lots; small jobs run slower') },
      equipment_cost_cents: { v: 900, prov: est('paver + 2 rollers + transfer share per ton, 2026') },
      waste_pct: { v: 3, prov: est('end-of-day and truck leftovers') } },
    { code: 'B-ASP-MILL-SY', name: 'Mill existing asphalt surface, about 1.5–2 in., load and haul millings, per SY', name_es: 'Fresado de superficie asfáltica existente, unas 1.5–2 pulg, carga y acarreo del fresado, por yarda cuadrada', unit: 'SY', csi: '32 01 16',
      material_cost_cents: { v: 0, prov: est('no material') },
      labor_hours_per_unit: { v: 0.006, prov: est('mill operator + groundman + sweeper on a half-lane machine') },
      equipment_cost_cents: { v: 130, prov: aup('WisDOT 204.0120 Removing Asphaltic Surface Milling avg bid $1.50/SY FY2025, $1.82 FY2024; equipment share of that range') },
      waste_pct: { v: 0, prov: est('removal item') } },
    { code: 'B-ASP-TACK-SY', name: 'Tack coat, emulsion sprayed at about 0.05–0.07 gal/SY, per SY', name_es: 'Riego de liga con emulsión rociada a unos 0.05–0.07 gal/yd², por yarda cuadrada', unit: 'SY', csi: '32 12 16',
      material_cost_cents: { v: 18, prov: aup('0.06 gal/SY × WisDOT 455.0605 Tack Coat avg bid $2.95/gal FY2025') },
      labor_hours_per_unit: { v: 0.001, prov: est('distributor truck or wand, sweep ahead') },
      equipment_cost_cents: { v: 3, prov: est('distributor / broom share') },
      waste_pct: { v: 5, prov: est('overspray and line flushing') } },
    { code: 'B-ASP-CRACKSEAL-LF', name: 'Crack sealing — rout or clean and blow out, hot-pour sealant, per LF', name_es: 'Sellado de grietas — ranurado o limpieza y soplado, sellador aplicado en caliente, por pie lineal', unit: 'LF', csi: '32 01 13',
      material_cost_cents: { v: 30, prov: aup('WisDOT 415.6000.S Rout and Seal avg bid $0.99/LF FY2023–2024 (FY2025 $6.00 single-project outlier ignored); material share') },
      labor_hours_per_unit: { v: 0.008, prov: est('2-person crew with melter ≈2,000 LF/day') },
      equipment_cost_cents: { v: 15, prov: est('melter, router, compressor/heat lance share') },
      waste_pct: { v: 10, prov: est('melter residue and overband') } },
    { code: 'B-ASP-SEALCOAT-SY', name: 'Sealcoat cured asphalt, two coats of asphalt emulsion sealer with sand, per SY', name_es: 'Sellador sobre asfalto curado, dos manos de sellador de emulsión asfáltica con arena, por yarda cuadrada', unit: 'SY', csi: '32 01 13',
      material_cost_cents: { v: 40, prov: est('≈0.15–0.2 gal/SY concentrate for 2 coats + sand/additive at distributor pricing, 2026') },
      labor_hours_per_unit: { v: 0.008, prov: est('clean, edge and squeegee/spray two coats') },
      equipment_cost_cents: { v: 8, prov: est('spray rig or squeegee machine + blower share') },
      waste_pct: { v: 5, prov: est('tank residue and edging') } },
    { code: 'B-ASP-PATCH-SF', name: 'Full-depth asphalt patch — saw-cut, remove to 3 in., tack edges, replace and compact, per SF', name_es: 'Bacheo de asfalto profundo — corte con sierra, retiro hasta 3 pulg, liga en bordes, reposición y compactación, por pie²', unit: 'SF', csi: '32 01 16',
      material_cost_cents: { v: 150, prov: aup('≈0.018 ton/SF at 3 in. × WisDOT 465.0110 Asphaltic Surface Patching avg bid $140.26/ton FY2025, material share ≈60%') },
      labor_hours_per_unit: { v: 0.06, prov: est('saw both sides, break out, square up, place and roll by hand crew') },
      equipment_cost_cents: { v: 80, prov: est('saw blade, skid steer/breaker, small roller, haul share') },
      waste_pct: { v: 10, prov: est('small-batch hot mix loss') } },
  ],
  quantity_rules: [
    { code: 'B-ASPHALT-SY', assumption: 'Asphalt paving callout on single-family plans: two-car driveway ≈20 × 40 ft ≈ 89 SY of 3 in. asphalt — measure the site plan', when: { facts_any: ['asphalt_paving'], building_types: ['residential_sf'] }, qty: { basis: { component: 'asphalt_paving' }, mul: 89 } },
    { code: 'B-ASP-HMA-TON', assumption: 'Asphalt paving callout: ≈1,500 SY lot (≈40 stalls + aisles) at 4 in. compacted (2.25 in. binder + 1.75 in. surface) × ≈0.055 t per SY-inch ≈ 330 t — measure the site plan', when: { facts_any: ['asphalt_paving'], building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: { component: 'asphalt_paving' }, mul: 330 } },
    { code: 'B-ASP-TACK-SY', assumption: 'Tack coat between binder and surface lifts over the ≈1,500 SY default lot', when: { facts_any: ['asphalt_paving'], building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: { component: 'asphalt_paving' }, mul: 1500 } },
    { code: 'B-AGG-BASE-SY', assumption: 'Compacted aggregate base under the ≈1,500 SY default lot (catalog row is 6 in.; heavier truck areas often need 8–12 in. — check the geotech/plan section)', when: { facts_any: ['asphalt_paving'], building_types: ['residential_mf', 'commercial', 'industrial'] }, qty: { basis: { component: 'asphalt_paving' }, mul: 1500 } },
  ],
  dependency_hints: [
    { after_trades: ['excavation', 'site_utilities', 'concrete_flatwork'], note: 'Pave after utility trenches are compacted and curb & gutter, inlets and structure frames are set to final grade.' },
    { before_phase: 'punch', note: 'Final surface course and striping (pavement_marking) go on near the end, after heavy construction traffic is off the lot.' },
  ],
});
