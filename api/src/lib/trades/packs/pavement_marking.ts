// Trade Knowledge Pack — pavement_marking (Pavement Marking / Striping). Wave 19, COMPLEMENT pattern:
// the hand recipe in task-buildout/nopermit.ts ('Lay out & stripe', ADA layout) keeps producing the work
// step for the three template tasks ("Site signage, striping & ADA compliance", "Site markings, safety
// striping & ADA ramps", "Site signage & pavement markings"); this pack adds glossary, hazards, QA,
// owner/GC hold-point checklists (permit_trade null → no gates, no code_refs), equipment hints and the
// line / legend / removal assemblies the catalog lacks. G-STRIPE-STALL (migration 0037) is referenced in
// spirit only (per-stall rate) and never redeclared. Detectable warning fields belong to the curb-ramp /
// concrete scope (WisDOT 602), not here.
// Dossier: docs/trade-packs/dossiers/pavement_marking.md. Sources: FHWA MUTCD 11th ed. Part 3 (+ Part 6),
// WisDOT Std Spec 646 + Average Unit Price List (FY2025), Ohio DOT Item 644 (thermoplastic), 2010 ADA
// Standards 208/502 + U.S. Access Board Ch. 5 guide, 29 CFR 1926 Subparts D, E, F, G, O, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string | string[], note?: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const mutcd = (note?: string) => src('pavement_marking-mutcd-part3', note);
const ss646 = (note?: string) => src('pavement_marking-wisdot-ss-646', note);
const odot = (note?: string) => src('pavement_marking-odot-644', note);
const ada = (note?: string) => src(['plumbing-ada-2010', 'pavement_marking-access-board-ch5'], note);
const osha = (sub: string, extra: string[] = []) => src([`ecfr-1926-${sub}`, ...extra]);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const aup = (note: string) => ({ src: ['asphalt_paving-wisdot-aup'], confidence: 'derived' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'pavement_marking',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Parking-lot and roadway striping: layout to the site plan, stall and aisle lines, accessible (ADA) spaces with access aisles and symbols, arrows, words, crosswalks, curb and fire-lane markings in paint, epoxy or thermoplastic with glass beads, plus grinding or blasting off old lines.',
    summary_es: 'Rayado de estacionamientos y calles: trazo según el plano del sitio, líneas de cajones y pasillos, cajones accesibles (ADA) con pasillo de acceso y símbolo, flechas, palabras, pasos peatonales, marcas de bordillo y carril de bomberos en pintura, epóxico o termoplástico con microesferas de vidrio, además de quitar líneas viejas con esmeril o chorro.',
    glossary: [
      { term: 'Layout (premarking)', term_es: 'Trazo (premarcado)', def: 'Chalk or paint dots and string lines that show where every stripe, stall and symbol goes before the real paint.', def_es: 'Puntos de gis o pintura y líneas de hilo que muestran dónde va cada raya, cajón y símbolo antes de la pintura final.' },
      { term: 'Glass beads', term_es: 'Microesferas de vidrio', def: 'Tiny glass balls dropped into wet marking so headlights reflect back to the driver at night.', def_es: 'Bolitas de vidrio que se echan sobre la marca fresca para que la luz de los faros regrese al conductor de noche.' },
      { term: 'Retroreflectivity', term_es: 'Retrorreflectividad', def: 'How much headlight the line sends back to the driver; measured with a meter in mcd/m²/lx.', def_es: 'Cuánta luz de los faros regresa la línea al conductor; se mide con un aparato en mcd/m²/lx.' },
      { term: 'Mil', term_es: 'Milésima (mil)', def: 'One thousandth of an inch — how marking thickness is specified (paint about 15–16 mils, thermoplastic about 125).', def_es: 'Una milésima de pulgada; así se especifica el espesor de la marca (pintura unos 15–16 mils, termoplástico unos 125).' },
      { term: 'Thermoplastic', term_es: 'Termoplástico', def: 'Solid marking material melted in a heated kettle and laid hot as a thick line that hardens as it cools.', def_es: 'Material sólido que se derrite en una olla caliente y se aplica caliente en una línea gruesa que endurece al enfriarse.' },
      { term: 'Access aisle', term_es: 'Pasillo de acceso', def: 'Striped space next to an accessible parking stall where a wheelchair user gets in and out; no parking allowed in it.', def_es: 'Espacio rayado junto a un cajón accesible donde la persona en silla de ruedas sube y baja; no se permite estacionar en él.' },
      { term: 'International Symbol of Accessibility (ISA)', term_es: 'Símbolo Internacional de Accesibilidad (SIA)', def: 'The wheelchair symbol painted in an accessible stall and shown on its sign.', def_es: 'El símbolo de silla de ruedas pintado en el cajón accesible y mostrado en su letrero.' },
      { term: 'Stencil', term_es: 'Plantilla (esténcil)', def: 'Cut template used to paint arrows, words and symbols to standard shapes and sizes.', def_es: 'Plantilla recortada para pintar flechas, palabras y símbolos con forma y tamaño estándar.' },
      { term: 'Marking train', term_es: 'Convoy de rayado', def: 'The striper plus lead and trailing protection vehicles with lights and signs when striping an open road.', def_es: 'La máquina rayadora con vehículos de protección adelante y atrás con luces y letreros al rayar una vía abierta.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'remov|blast|grind' }, type: 'air_compressor', reason: 'Air-blast old markings or blow the surface clean before striping', optional: true },
  ],
  hazards: [
    { id: 'traffic_struck_by', hazard: 'Struck by vehicles driving through an open lot or street while workers lay out and stripe', hazard_es: PENDING_ES, controls: ['Close the area being striped with cones, barricades and signs per the traffic control plan (MUTCD Part 6) before layout starts', 'Stripe a lot in sections so live traffic never shares the section being painted; face oncoming cars when you can'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(2)', severity: 4, ppe: ['high-visibility vest'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'flagger_exposure', hazard: 'Flagger struck while holding traffic for a striping operation on a street or drive entrance', hazard_es: PENDING_ES, controls: ['Use only trained flaggers with a STOP/SLOW paddle and high-visibility garments', 'Keep an escape route; never stand in the open lane'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility vest', 'hard hat'], prov: osha('g', ['asphalt_paving-mutcd-part6']) },
    { id: 'striper_backing', hazard: 'Run over by a striping truck, ride-on striper or material truck backing up', hazard_es: PENDING_ES, controls: ['Back only with a working reverse alarm or an observer signaling', 'Walkers stay out of the striper path and the blind zone behind trucks'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'thermo_burns', hazard: 'Severe burns from molten thermoplastic (about 400–440 °F at the shoe), the kettle, hand liner screed box or splashes while charging the kettle', hazard_es: PENDING_ES, controls: ['Wear long sleeves, long pants, heat-resistant gloves, face shield and leather boots around the kettle and applicator', 'Add blocks slowly to the kettle; keep the thermostat working so material never overheats', 'Cool a burn with clean water right away and get medical care; never peel hardened material off skin'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['heat-resistant gloves', 'face shield', 'long sleeves', 'leather boots'], prov: osha('e', ['pavement_marking-odot-644']) },
    { id: 'propane_kettle', hazard: 'Fire or explosion from propane cylinders, hoses and burners on thermoplastic kettles, preheaters and hand liners', hazard_es: PENDING_ES, controls: ['Check hoses, regulators and fittings before lighting; leak-test with soapy water, never a flame', 'Secure cylinders upright with valves closed when not in use; keep a fire extinguisher on the rig'], controls_es: PENDING_ES, osha_ref: '1926.153', severity: 3, prov: osha('f') },
    { id: 'flammable_storage', hazard: 'Fire from solvent-borne paint, thinner and gasoline for engines stored or refueled on the striping rig', hazard_es: PENDING_ES, controls: ['Keep paint, solvent and fuel in approved closed containers', 'Shut off engines and burners before refueling; no smoking near the rig'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'solvent_vapors', hazard: 'Breathing paint solvent or epoxy vapors and overspray mist while spraying lines and cleaning guns', hazard_es: PENDING_ES, controls: ['Work upwind of the spray guns; use water-borne paint where the job allows', 'Clean guns in the open, not inside the truck cab; use the respirator the safety data sheet lists when vapors build up'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['respirator when the SDS requires'], prov: osha('d') },
    { id: 'hazcom', hazard: 'Skin and eye contact with paint, epoxy components, primers and bead coatings without knowing their hazards', hazard_es: PENDING_ES, controls: ['Keep safety data sheets on the rig and label every container', 'Train the crew on the products they handle; wear chemical gloves when mixing or loading epoxy'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['chemical-resistant gloves', 'safety glasses'], prov: osha('d') },
    { id: 'silica_removal', hazard: 'Silica dust from grinding or blasting old lines off concrete or asphalt', hazard_es: PENDING_ES, controls: ['Use grinders and blasters with vacuum dust collection or water as Table 1 lists', 'Follow the Table 1 respirator rule for the tool; keep others out of the dust'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator when Table 1 requires', 'safety glasses'], prov: osha('z', ['pavement_marking-wisdot-ss-646']) },
    { id: 'flying_particles', hazard: 'Eye injury from glass beads, blasting grit and chips from grinding or water blasting', hazard_es: PENDING_ES, controls: ['Wear safety glasses at the bead dispenser and during removal; add a face shield for blasting', 'Keep bystanders out of the blast and grinding zone'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'face shield'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing damage from line grinders, air blasters, ultra-high-pressure water blasters and compressors', hazard_es: PENDING_ES, controls: ['Wear hearing protection when running or working next to removal equipment', 'Keep compressors and engines away from where the crew stands'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: osha('e') },
    { id: 'heat_stress', hazard: 'Heat illness working on hot black pavement in summer sun next to a hot kettle', hazard_es: PENDING_ES, controls: ['Keep cool drinking water on the rig and drink small amounts often', 'Rest in shade; watch each other for confusion, cramps or stopped sweating and call 911 for heat stroke'], controls_es: PENDING_ES, osha_ref: '1926.51(a)(1)', severity: 3, prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'traffic_control_set', item: 'Area being striped is closed to traffic with cones and signs per the traffic control plan before layout, and wet lines stay coned until dry.', item_es: PENDING_ES, safety: true, prov: src(['asphalt_paving-mutcd-part6', 'pavement_marking-wisdot-ss-646'], 'Part 6 work zones; 646.3.1.2(2) 28-in. cones on wet marking') },
    { id: 'layout_matches_plan', item: 'Layout matches the approved site plan: stall count, stall widths, aisle widths, fire lanes, arrows and crosswalks checked before any paint goes down.', item_es: tr('El trazo coincide con el plano aprobado: cantidad de cajones, ancho de cajones, ancho de pasillos, carriles de bomberos, flechas y pasos peatonales revisados antes de pintar.'), prov: est('Standard site-plan layout check; mirrors the hand-recipe QA') },
    { id: 'surface_ready', item: 'Surface clean, dry and free of dust, oil and loose material; new asphalt cured per the marking maker before striping.', item_es: tr('Superficie limpia, seca y sin polvo, aceite ni material suelto; asfalto nuevo curado según el fabricante de la pintura antes de rayar.'), prov: ss646('646.3.1.1(1) prepare the surface as the manufacturer specifies') },
    { id: 'temperature_limits', item: 'Paint not placed below 50 °F ambient and pavement; epoxy not below 35 °F; thermoplastic only on pavement at or above the spec minimum and rising.', item_es: tr('No aplicar pintura con ambiente y pavimento bajo 50 °F; epóxico no bajo 35 °F; termoplástico solo con pavimento en o sobre el mínimo especificado y subiendo.'), prov: src(['pavement_marking-wisdot-ss-646', 'pavement_marking-odot-644'], '646.3.1.3(1); ODOT 644.04') },
    { id: 'thickness_beads', item: 'Wet film thickness and bead rate checked at start of each shift (paint about 16 mils with 10–12 lb beads per gallon on WisDOT work) and logged.', item_es: tr('Espesor de película húmeda y dosis de microesferas revisados al inicio de cada turno (pintura unos 16 mils con 10–12 lb de microesferas por galón en obras de WisDOT) y registrados.'), prov: ss646('646.3.1.2(4) table — paint 16 mils, 10–12 lb/gal beads; (1) remark sections under 90% of rate') },
    { id: 'thermo_temp_thickness', item: 'Thermoplastic applied at the temperature range on the product data sheet (about 400–440 °F at the shoe) and to the specified thickness (often 125 mils); kettle thermostat working.', item_es: tr('Termoplástico aplicado en el rango de temperatura de la hoja técnica (unos 400–440 °F en la zapata) y al espesor especificado (a menudo 125 mils); termostato de la olla funcionando.'), prov: odot('644.03 kettle thermostat; 644.04 400–440 °F, 125 mils') },
    { id: 'sharp_edges', item: 'Lines straight and to width with sharp cutoffs at both sides and ends; beads spread evenly across the line; no overspray on curbs or walks.', item_es: tr('Líneas rectas y del ancho correcto con cortes limpios en ambos lados y extremos; microesferas repartidas parejo en toda la línea; sin rociado sobre bordillos ni banquetas.'), prov: ss646('646.3.1.1(7)') },
    { id: 'colors_correct', item: 'Colors per MUTCD: yellow separates opposing traffic and marks the left edge of one-way drives, white for same-direction lines, stalls, arrows, words and crosswalks; blue only to supplement accessible stalls.', item_es: tr('Colores según el MUTCD: amarillo separa tráfico en sentidos opuestos y marca el borde izquierdo de vías de un sentido; blanco para líneas del mismo sentido, cajones, flechas, palabras y pasos peatonales; azul solo como complemento en cajones accesibles.'), prov: mutcd('3A.03, 3B.20, 3B.27') },
    { id: 'ada_count_van', item: 'Accessible stall count meets ADA 208.2 for the lot size, with at least one van-accessible space for every six accessible spaces (or fraction).', item_es: tr('La cantidad de cajones accesibles cumple ADA 208.2 para el tamaño del estacionamiento, con al menos un cajón para camioneta por cada seis accesibles (o fracción).'), prov: ada('208.2 table; 208.2.4 van spaces') },
    { id: 'ada_dimensions', item: 'Accessible car stalls at least 96 in. wide, van stalls 132 in. (or 96 in. with a 96 in. aisle), access aisles at least 60 in. wide, full stall length, measured to line centers.', item_es: tr('Cajones accesibles para auto de al menos 96 pulg de ancho, para camioneta 132 pulg (o 96 pulg con pasillo de 96 pulg), pasillos de acceso de al menos 60 pulg y del largo completo del cajón, medidos al centro de las líneas.'), prov: ada('502.2, 502.3.1, 502.3.2; widths measured to marking centerlines (Access Board guide)') },
    { id: 'ada_aisle_marked', item: 'Access aisles hatched or marked so drivers will not park in them, not overlapping the drive lane, and at the same level as the stall (slope 1:48 max).', item_es: tr('Pasillos de acceso con achurado o marcas para que nadie estacione en ellos, sin invadir el carril de circulación y al mismo nivel del cajón (pendiente máxima 1:48).'), prov: ada('502.3.3, 502.3.4, 502.4') },
    { id: 'ada_symbol_signs', item: 'Wheelchair symbol placed in each accessible stall where the plan calls for it, and the ISA / "van accessible" signs mounted with the bottom at least 60 in. above grade.', item_es: tr('Símbolo de silla de ruedas en cada cajón accesible donde lo pida el plano, y letreros SIA / "van accessible" instalados con la parte inferior a 60 pulg o más sobre el piso.'), prov: src(['pavement_marking-mutcd-part3', 'plumbing-ada-2010'], 'MUTCD 3B.22 ISA marking; ADA 502.6 sign height') },
    { id: 'crosswalk_ramps', item: 'Crosswalks white, at least 6 ft wide, and placed so curb ramps fall inside the crosswalk lines.', item_es: tr('Pasos peatonales blancos, de al menos 6 pies de ancho y ubicados de modo que las rampas queden dentro de las líneas del paso.'), prov: mutcd('3C.03(03), (05), (09)') },
    { id: 'removal_clean', item: 'Old or conflicting lines fully removed (no ghost lines that could confuse drivers) without gouging the pavement; dust and residue collected and hauled off.', item_es: tr('Líneas viejas o contradictorias quitadas por completo (sin líneas fantasma que confundan a los conductores) sin dañar el pavimento; polvo y residuos recogidos y retirados.'), prov: ss646('646.3.1.4(1)–(2)') },
  ],
  inspection_checklists: {
    layout_approval: [
      { item: 'Owner/GC walks the layout before paint: stall count, ADA stalls and aisles, fire lanes, arrows and crosswalks match the approved site plan', item_es: tr('El dueño o contratista general revisa el trazo antes de pintar: cajones, cajones y pasillos ADA, carriles de bomberos, flechas y pasos peatonales coinciden con el plano aprobado') },
      { item: 'ADA stall count and van stalls checked against 2010 ADA 208.2 for the total stalls', item_es: tr('Cantidad de cajones ADA y para camioneta verificada contra ADA 2010 208.2 según el total de cajones'), ref: 'ADA 208.2' },
      { item: 'Accessible stalls on the shortest accessible route to an accessible entrance', item_es: tr('Cajones accesibles en la ruta accesible más corta hacia una entrada accesible'), ref: 'ADA 208.3' },
      { item: 'Traffic control plan in place for any area that stays open', item_es: PENDING_ES },
    ],
    material_submittal: [
      { item: 'Marking and bead product data and certificates on file (approved-product list where the owner requires it)', item_es: tr('Hojas técnicas y certificados de pintura y microesferas en archivo (lista de productos aprobados cuando el dueño lo exija)'), ref: 'WisDOT 646.2' },
      { item: 'Air and pavement temperature logged at start of work', item_es: tr('Temperatura del aire y del pavimento registrada al iniciar el trabajo'), ref: 'WisDOT 646.3.1.3' },
    ],
    final_acceptance: [
      { item: 'Lines straight, to width, sharp-edged and evenly beaded; no tracking or overspray', item_es: tr('Líneas rectas, del ancho correcto, con bordes limpios y microesferas parejas; sin pisadas ni rociado'), ref: 'WisDOT 646.3.1.1' },
      { item: 'Initial retroreflectivity readings meet the contract minimum where measured (roadway long lines)', item_es: tr('Lecturas iniciales de retrorreflectividad cumplen el mínimo del contrato donde se midan (líneas longitudinales de vía)'), ref: 'WisDOT 646.3.1.5' },
      { item: 'Access aisles marked, ISA symbols and accessible-parking signs installed', item_es: tr('Pasillos de acceso marcados, símbolos SIA y letreros de estacionamiento accesible instalados'), ref: 'ADA 502.3.3' },
      { item: 'Cones and devices picked up only after markings are dry and traffic-ready', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'G-PM-LINE-PAINT-LF', name: 'Pavement marking line, 4 in., waterborne paint with glass beads, per LF', name_es: 'Línea de marca vial de 4 pulg, pintura base agua con microesferas, por pie lineal', unit: 'LF', csi: '32 17 23',
      material_cost_cents: { v: 8, prov: aup('646.1005 Marking Line Paint 4-Inch FY2023–2025 avg about $0.31/LF all-in; ~1/3 split to paint + beads') },
      labor_hours_per_unit: { v: 0.0015, prov: est('Walk-behind striper ~4,000–5,000 LF/day incl. layout on a lot; highway trucks are much faster') },
      equipment_cost_cents: { v: 4, prov: est('Striper + layout tools share per LF') },
      waste_pct: { v: 5, prov: est('Gun flushing and start/stop loss') } },
    { code: 'G-PM-THERMO-LF', name: 'Pavement marking line, 4 in., hot-applied thermoplastic 125 mil with beads, per LF', name_es: 'Línea de marca vial de 4 pulg, termoplástico en caliente de 125 mils con microesferas, por pie lineal', unit: 'LF', csi: '32 17 23',
      material_cost_cents: { v: 55, prov: est('≈0.44 lb/LF of material (ODOT 644: 2,340 lb per mile of 4-in. solid line) at ~$1.10/lb plus beads and primer; national baseline 2026') },
      labor_hours_per_unit: { v: 0.006, prov: est('Hand liner / small truck crew on short municipal and site runs') },
      equipment_cost_cents: { v: 15, prov: est('Kettle, preheater and propane share') },
      waste_pct: { v: 8, prov: est('Kettle residue and start/stop loss') } },
    { code: 'G-PM-LEGEND-EA', name: 'Pavement arrow, word or symbol (e.g. STOP, FIRE LANE), paint with beads, stenciled, each', name_es: 'Flecha, palabra o símbolo en pavimento (p. ej. ALTO, FIRE LANE), pintura con microesferas, con plantilla, c/u', unit: 'EA', csi: '32 17 23',
      material_cost_cents: { v: 2500, prov: aup('646.5005 Marking Arrow Paint $177.89–$192.64 and 646.5105 Word Paint $125–$200 each (FY2023–24); material share') },
      labor_hours_per_unit: { v: 1.5, prov: est('Layout, stencil set, spray and bead, two passes for large legends') },
      equipment_cost_cents: { v: 1500, prov: est('Stencil wear + sprayer share') },
      waste_pct: { v: 5, prov: est('Overspray') } },
    { code: 'G-PM-ADA-SYMBOL-EA', name: 'Accessible stall marking: ISA wheelchair symbol and access-aisle hatching, painted, per stall', name_es: 'Marca de cajón accesible: símbolo SIA y achurado del pasillo de acceso, pintado, por cajón', unit: 'EA', csi: '32 17 23',
      material_cost_cents: { v: 3000, prov: aup('646.5205 Marking Symbol Paint $148.33 each (FY2024); plus aisle hatching paint — material share') },
      labor_hours_per_unit: { v: 1.25, prov: est('Symbol stencil + blue background + aisle hatch lines') },
      equipment_cost_cents: { v: 1000, prov: est('Stencil + sprayer share') },
      waste_pct: { v: 5, prov: est('Overspray') } },
    { code: 'G-PM-CROSSWALK-LF', name: 'Crosswalk bar, 24 in. wide, paint with beads, per LF of bar', name_es: 'Barra de paso peatonal de 24 pulg de ancho, pintura con microesferas, por pie lineal de barra', unit: 'LF', csi: '32 17 23',
      material_cost_cents: { v: 90, prov: aup('646.7505 Marking Crosswalk Paint Block Style 24-Inch $3.75/LF (FY2023); material share') },
      labor_hours_per_unit: { v: 0.03, prov: est('Taped-off bars, two coats') },
      equipment_cost_cents: { v: 25, prov: est('Sprayer share') },
      waste_pct: { v: 5, prov: est('Overspray and tape edges') } },
    { code: 'G-PM-REMOVE-LF', name: 'Remove existing pavement marking line, 4 in., by grinding or blasting with dust collection, per LF', name_es: 'Retiro de línea de marca vial existente de 4 pulg, con esmeril o chorro y recolección de polvo, por pie lineal', unit: 'LF', csi: '02 41 19',
      material_cost_cents: { v: 0, prov: est('No material') },
      labor_hours_per_unit: { v: 0.005, prov: aup('646.9000 Marking Removal Line 4-Inch $0.26–$0.46/LF; 646.9010 water blasting $0.58–$0.76/LF (FY2023–2025); labor share') },
      equipment_cost_cents: { v: 15, prov: aup('Grinder / blaster + vacuum share of the WisDOT removal unit price') },
      waste_pct: { v: 0, prov: est('No material') } },
  ],
  quantity_rules: [
    { code: 'G-PM-ADA-SYMBOL-EA', assumption: 'Accessible parking called out on a commercial plan — assume 2 accessible stalls (the 2010 ADA 208.2 minimum for 26–50 stalls) until the site plan stall count is read', when: { facts_any: ['has_accessibility'], building_types: ['commercial'] }, qty: { basis: 'const', mul: 2 } },
  ],
  dependency_hints: [
    { after_trades: ['asphalt_paving', 'concrete_flatwork'], note: 'Striping goes on after the final surface course or flatwork is placed and cured, and heavy construction traffic is off the lot.' },
  ],
});
