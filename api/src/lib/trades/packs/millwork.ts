// Trade Knowledge Pack — millwork (Architectural Millwork). Wave 15, COMPLEMENT pattern:
// the hand recipe in task-buildout/nopermit.ts (Field-verify & layout → Install & scribe, shared with
// cabinetry/countertops) keeps producing the work steps; this pack adds glossary, hazards, QA,
// GC/owner hold points and commercial millwork assemblies the catalog lacks (plastic-laminate casework,
// veneer wall paneling, reception desk, shop drawings, fire-retardant blocking).
// permit_trade null → NO gates, NO code_refs; ADA 2010 and IBC 803 checks live in inspection_checklists
// (cited by section, reference only). Residential cabinets = cabinetry pack (G-CB-*); countertops =
// countertops pack (G-CT-*); trim = finish_carpentry (G-FC-*); doors/hardware = doors_hardware (G-DHW-*).
// Dossier: docs/trade-packs/dossiers/millwork.md. Sources: UFGS 06 41 16.00 10, UFGS 06 20 00,
// AWI Architectural Woodwork Standards (ref only), 2010 ADA Standards (Access Board text),
// OSHA wood dust, NIOSH NPG, 29 CFR 1926 Subparts C/D/E/F/I/K/L/X/Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['cabinetry-ufgs-06-41-16'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const fc = (note: string) => ({ src: ['finish_carpentry-ufgs-06-20-00'], confidence: 'verified' as const, last_verified: D, note });
const awi = (note: string) => ({ src: ['cabinetry-awi-aws', 'cabinetry-ufgs-06-41-16'], confidence: 'derived' as const, last_verified: D, note });
const ada = (note: string) => ({ src: ['millwork-access-board-ada', 'plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D, note });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });
const COM: ('commercial')[] = ['commercial'];

export default definePack({
  key: 'millwork',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Shop-built architectural woodwork for commercial interiors: plastic-laminate and wood-veneer casework, reception and transaction desks, wood wall paneling and custom trim packages built to an AWI quality grade. The work runs from shop drawings and field measuring, through in-wall blocking and acclimation, to setting, scribing, leveling and touch-up.',
    summary_es: 'Carpintería arquitectónica de taller para interiores comerciales: mobiliario de laminado plástico y chapa, mostradores de recepción, paneles de madera y molduras a medida con grado AWI. Va de planos de taller y medición en obra, bloqueo en muros y aclimatación, a colocación, ajuste, nivelación y retoques.',
    glossary: [
      { term: 'Shop drawings', term_es: 'Planos de taller', def: 'Detailed plans, elevations and sections from the millwork shop showing sizes, materials, blocking and attachment; they must be approved before fabrication.', def_es: 'Planos, alzados y cortes detallados del taller que muestran medidas, materiales, bloqueo y fijación; deben aprobarse antes de fabricar.' },
      { term: 'Field verify', term_es: 'Verificar en obra', def: 'Measuring the actual built walls and openings so shop dimensions match the room, not just the drawings.', def_es: 'Medir los muros y vanos reales construidos para que las medidas de taller coincidan con el cuarto, no solo con los planos.' },
      { term: 'AWI grade', term_es: 'Grado AWI', def: 'Quality level (economy, custom or premium) named in the spec that sets materials, joinery and tolerances for the woodwork.', def_es: 'Nivel de calidad (económico, personalizado o premium) indicado en la especificación que define materiales, uniones y tolerancias.' },
      { term: 'Plastic laminate (P-lam)', term_es: 'Laminado plástico', def: 'Thin high-pressure laminate glued to particleboard or MDF for durable cabinet faces and tops.', def_es: 'Laminado delgado de alta presión pegado a aglomerado o MDF para frentes y cubiertas resistentes.' },
      { term: 'Blocking', term_es: 'Bloqueo (refuerzo en muro)', def: 'Solid wood or metal backing installed inside the wall before drywall so casework, desks and panels can be screwed to something solid.', def_es: 'Refuerzo de madera o metal colocado dentro del muro antes de la tablaroca para atornillar mobiliario, mostradores y paneles a algo sólido.' },
      { term: 'Acclimation', term_es: 'Aclimatación', def: 'Letting delivered woodwork sit in the finished, heated or cooled room so it adjusts to the room humidity before install.', def_es: 'Dejar la carpintería en el cuarto terminado y climatizado para que se ajuste a la humedad antes de instalarla.' },
      { term: 'Scribe', term_es: 'Ajuste (escribado)', def: 'Tracing an out-of-plumb wall or uneven floor onto a filler or panel edge and cutting it for a tight fit.', def_es: 'Trazar un muro fuera de plomo o un piso irregular sobre el canto de un relleno o panel y cortarlo para que ajuste.' },
      { term: 'Z-clip / French cleat', term_es: 'Clip en Z / listón francés', def: 'Interlocking hanger pair that lets a wall panel or desk front hang tight and level on the wall.', def_es: 'Par de colgadores entrelazados que permite colgar un panel o frente de mostrador firme y a nivel en el muro.' },
      { term: 'Transaction top', term_es: 'Cubierta de atención', def: 'Raised counter on a reception desk where visitors sign in; an accessible lower section is required.', def_es: 'Cubierta elevada del mostrador de recepción donde firman los visitantes; se requiere una parte baja accesible.' },
      { term: 'Fire-retardant treated (FRT)', term_es: 'Tratado ignífugo', def: 'Wood or panel treated and labeled to slow flame spread where the code limits finish materials.', def_es: 'Madera o tablero tratado y etiquetado para retardar la propagación de llama donde el código limita los acabados.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { title_re: 'millwork|casework|panel|reception|desk' }, type: 'air_compressor', reason: 'Pneumatic finish and pin nailers for trim, scribes and panel attachment', optional: true },
    { when: { title_re: 'millwork|panel|casework', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Set tall wall paneling, soffit trim and upper casework in high-ceiling spaces', optional: true },
  ],
  hazards: [
    { id: 'panel_tip', hazard: 'Wall panels, desk sections or tall casework sliding or tipping over from staging or while being set', hazard_es: PENDING_ES, controls: ['Store panels flat or leaned on a secured rack so they cannot slide or fall', 'Use two people or a cart to move large sections and keep them braced until fastened'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, ppe: ['gloves', 'safety-toe boots'], prov: osha('h') },
    { id: 'hidden_utilities', hazard: 'Drilling or screwing into live wiring, data, water or sprinkler lines in walls behind casework and paneling', hazard_es: PENDING_ES, controls: ['Get the blocking and rough-in locations from the GC before drilling', 'Scan the wall and stay in the blocking zone; stop and ask if a line is suspected'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 3, prov: osha('k') },
    { id: 'circular_saw', hazard: 'Cuts and kickback from track or circular saws trimming panels and fillers on site', hazard_es: PENDING_ES, controls: ['Keep upper and lower guards working; the lower guard must snap back', 'Clamp the work and support offcuts so the blade does not pinch'], controls_es: PENDING_ES, osha_ref: '1926.304(d)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'table_saw', hazard: 'Hand contact or kickback on a jobsite table saw ripping scribe strips and fillers', hazard_es: PENDING_ES, controls: ['Keep the blade guard, riving knife and anti-kickback device in place', 'Use a push stick for narrow rips and never reach over the blade'], controls_es: PENDING_ES, osha_ref: '1926.304(f)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'pin_nailer', hazard: 'Puncture wounds from pneumatic finish and pin nailers', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety device working; never bypass it', 'Keep hands clear of the nailing line when holding thin trim'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'wood_dust', hazard: 'Breathing hardwood, MDF and particleboard dust from cutting and sanding indoors', hazard_es: PENDING_ES, controls: ['Use saws and sanders with dust extraction; do heavy cutting in a ventilated or outdoor area', 'Clean up with a HEPA vacuum, not a broom or compressed air; wear a respirator when dust cannot be controlled'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['N95 or better respirator'], prov: { src: ['ecfr-1926-d', 'millwork-osha-wood-dust', 'flooring_wood-niosh-npg-wood-dust'], confidence: 'verified' as const, last_verified: D } },
    { id: 'formaldehyde', hazard: 'Formaldehyde vapor from cutting or machining composite panels (MDF, particleboard) in a closed room', hazard_es: PENDING_ES, controls: ['Ventilate the room while cutting composite panels', 'Prefer low-emission panels where the spec allows and limit field machining'], controls_es: PENDING_ES, osha_ref: '1926.1148', severity: 2, prov: osha('z') },
    { id: 'contact_adhesive', hazard: 'Fire or vapor exposure from solvent-based contact cement and laminate adhesives', hazard_es: PENDING_ES, controls: ['Keep flammable adhesives in approved containers and away from heaters, torches and sparks', 'Ventilate the area and keep an extinguisher nearby when using solvent adhesives'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'stepladder', hazard: 'Falls from a stepladder while setting uppers, crown and panel tops', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap', 'Set the ladder fully open on a level floor and move it instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'lift_fall', hazard: 'Falling from a scissor lift or rolling platform while setting tall paneling', hazard_es: PENDING_ES, controls: ['Keep guardrails closed and stand on the platform floor, never the rails', 'Set the lift on a level floor and lower it before moving'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'cord_shock', hazard: 'Electric shock from saws, sanders and extension cords', hazard_es: PENDING_ES, controls: ['Use GFCI protection on every temporary receptacle', 'Inspect cords daily and pull damaged ones from service'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_injury', hazard: 'Eye injury from chips, laminate shards and nail debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever cutting, trimming laminate, drilling or nailing'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'shop_drawings_approved', item: 'Shop drawings approved before fabrication, showing plans, elevations, sections, attachment details, blocking and cutout locations.', item_es: tr('Planos de taller aprobados antes de fabricar, con plantas, alzados, cortes, detalles de fijación, bloqueo y ubicación de cortes.'), prov: ufgs('1.4.4 shop drawings') },
    { id: 'field_measured', item: 'Walls, openings and ceiling heights field-measured and the shop notified of any difference from the drawings before fabrication.', item_es: tr('Muros, vanos y alturas de plafón medidos en obra y el taller avisado de cualquier diferencia con los planos antes de fabricar.'), prov: awi('Field verification before fabrication is standard AWI/spec practice; paraphrased.') },
    { id: 'blocking_in_place', item: 'In-wall blocking or backing installed at every casework, desk, panel and grab-point location before drywall closes the wall.', item_es: PENDING_ES, safety: true, prov: ufgs('1.4.4 shop drawings show blocking and hanging strips; 3.1 fasten into framing, blocking or hanging strips') },
    { id: 'mockup', item: 'Mock-up or first-installed unit approved where the spec calls for one; it sets the standard for the rest.', item_es: tr('Maqueta o primera unidad instalada aprobada donde la especificación la pida; marca el estándar para el resto.'), prov: ufgs('1.4.3 mock-ups') },
    { id: 'room_conditioned', item: 'Building enclosed, wet work done, painting and ceilings complete and HVAC holding the specified temperature and humidity before woodwork is delivered.', item_es: tr('Edificio cerrado, trabajos húmedos terminados, pintura y plafones completos y climatización manteniendo la temperatura y humedad especificadas antes de entregar la carpintería.'), prov: ufgs('1.6 environmental limitations with humidity control; 1.7 sequencing') },
    { id: 'acclimated', item: 'Woodwork stored off the floor in the conditioned space and acclimated at least 72 hours before installation.', item_es: tr('Carpintería almacenada sobre el piso en el espacio climatizado y aclimatada al menos 72 horas antes de instalar.'), prov: ufgs('1.5 storage; 3.1 condition to humidity not less than 72 hours') },
    { id: 'grade_labels', item: 'Materials, veneer match and finish match the specified AWI grade and approved samples; certification labels present where required.', item_es: tr('Materiales, igualación de chapa y acabado coinciden con el grado AWI especificado y las muestras aprobadas; etiquetas de certificación presentes donde se exijan.'), prov: awi('AWI AWS grade governs; tolerances are in the proprietary standard and are not copied here.') },
    { id: 'frt_labeled', item: 'Where fire-retardant treated wood or panels are specified, every piece carries the testing-lab label and field cuts keep the rating intact.', item_es: PENDING_ES, safety: true, prov: fc('1.7.7 fire-retardant treated lumber label; 2.7 FRT treatment') },
    { id: 'level_plumb', item: 'Casework and panels level, plumb and true in line within 1/8 in. in 8 ft, using concealed shims.', item_es: tr('Mobiliario y paneles a nivel, a plomo y alineados dentro de 1/8 pulg en 8 pies, con calzas ocultas.'), prov: ufgs('3.1 installation tolerance') },
    { id: 'fastened_to_framing', item: 'Wall-hung units fastened through the back near top and bottom at about 16 in. on center into framing, blocking or hanging strips — never into drywall alone.', item_es: PENDING_ES, safety: true, prov: ufgs('3.1 fasten wall cabinets through back, near top and bottom, 16 in. o.c.') },
    { id: 'scribed_refinished', item: 'Fillers and panel edges scribed tight to walls and floor; field cuts refinished and cut-damaged finish repaired.', item_es: tr('Rellenos y cantos de panel ajustados a muros y piso; cortes de obra reacabados y daños de acabado reparados.'), prov: ufgs('3.1 scribe and refinish cut surfaces') },
    { id: 'doors_drawers', item: 'Doors and drawers fit their openings without distortion, operate freely, and joinery and reveals are uniform.', item_es: tr('Puertas y cajones ajustan en sus vanos sin deformarse, operan libremente y las uniones y separaciones son parejas.'), prov: ufgs('3.1 / 3.2 adjusting') },
    { id: 'ada_counters', item: 'Accessible work surfaces 28–34 in. high; accessible service-counter portion 36 in. max high with knee and toe space where a forward approach is used.', item_es: tr('Superficies de trabajo accesibles de 28 a 34 pulg de alto; parte accesible del mostrador de atención de 36 pulg máximo con espacio para rodillas y pies si el acercamiento es frontal.'), prov: ada('902.3; 904.4.1 / 904.4.2; 306') },
    { id: 'touch_up_clean', item: 'Damaged pieces repaired or replaced, hardware cleaned, lubricated and adjusted, exposed and semi-exposed surfaces cleaned and protected at turnover.', item_es: tr('Piezas dañadas reparadas o reemplazadas, herrajes limpios, lubricados y ajustados, superficies expuestas y semiexpuestas limpias y protegidas en la entrega.'), prov: ufgs('3.2 adjusting and cleaning') },
  ],
  inspection_checklists: {
    pre_drywall_blocking: [
      { item: 'Blocking at every casework, desk, panel and accessory location per the approved shop drawings', item_es: tr('Bloqueo en cada ubicación de mobiliario, mostrador, panel y accesorio según los planos de taller aprobados') },
      { item: 'Electrical, data and plumbing rough-ins at desk and casework locations match the millwork layout', item_es: tr('Salidas eléctricas, de datos y de plomería en mostradores y mobiliario coinciden con el trazo de carpintería') },
      { item: 'Blocking material fire-retardant treated where the wall assembly requires it', item_es: PENDING_ES },
    ],
    field_verify_release: [
      { item: 'Shop drawings and finish samples approved; AWI grade confirmed', item_es: tr('Planos de taller y muestras de acabado aprobados; grado AWI confirmado') },
      { item: 'Field dimensions taken after framing/drywall and returned to the shop', item_es: tr('Medidas de obra tomadas después de la estructura/tablaroca y enviadas al taller') },
      { item: 'Equipment, appliance and fixture cut sheets checked against the cutouts', item_es: tr('Fichas técnicas de equipos, aparatos y muebles sanitarios revisadas contra los cortes') },
    ],
    delivery_acclimation: [
      { item: 'Room enclosed, painted, ceilings done, HVAC running at spec temperature and humidity', item_es: tr('Cuarto cerrado, pintado, plafones terminados, climatización funcionando a la temperatura y humedad especificadas') },
      { item: 'Woodwork stored off the floor and acclimated 72 hours; damage logged on delivery', item_es: tr('Carpintería almacenada sobre el piso y aclimatada 72 horas; daños registrados en la entrega') },
    ],
    fire_rating_check: [
      { item: 'Interior wall and ceiling finish materials meet the flame-spread class the code requires for the room', item_es: PENDING_ES, ref: 'IBC 803.1' },
      { item: 'FRT labels on site for each fire-retardant treated product', item_es: PENDING_ES },
    ],
    ada_counter_check: [
      { item: 'Accessible work surface height 28–34 in. measured with a tape', item_es: tr('Altura de superficie de trabajo accesible de 28 a 34 pulg medida con cinta'), ref: '2010 ADA 902.3' },
      { item: 'Service counter accessible portion length and 36 in. max height verified', item_es: tr('Longitud de la parte accesible del mostrador de atención y altura máxima de 36 pulg verificadas'), ref: '2010 ADA 904.4' },
      { item: 'Knee and toe clearance under forward-approach counters clear of aprons, supports and cabinet bottoms', item_es: tr('Espacio para rodillas y pies bajo mostradores de acercamiento frontal libre de faldones, soportes y fondos de gabinete'), ref: '2010 ADA 306' },
    ],
    final_punch: [
      { item: 'Casework and panels level, plumb and aligned; scribes tight; reveals even', item_es: tr('Mobiliario y paneles a nivel, a plomo y alineados; ajustes cerrados; separaciones parejas') },
      { item: 'Doors, drawers and hardware adjusted; finish touch-up done; surfaces clean', item_es: tr('Puertas, cajones y herrajes ajustados; retoques de acabado hechos; superficies limpias') },
    ],
  },
  assemblies: [
    { code: 'G-MW-PLAM-BASE-LF', name: 'Commercial plastic-laminate base casework, 24 in. deep, AWI custom grade, installed (top by others), per LF', name_es: 'Mobiliario inferior comercial de laminado plástico, 24 pulg de fondo, grado AWI, instalado, por pie lineal', unit: 'LF', csi: '06 41 16',
      material_cost_cents: { v: 26000, prov: est('shop-fabricated P-lam base cabinet, national baseline 2026') }, labor_hours_per_unit: { v: 0.6, prov: est('set, shim, join, fasten to blocking, scribe fillers') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('shop-built to length') } },
    { code: 'G-MW-PLAM-UPPER-LF', name: 'Commercial plastic-laminate wall casework, 12–14 in. deep, AWI custom grade, installed, per LF', name_es: 'Mobiliario superior comercial de laminado plástico, 12 a 14 pulg de fondo, grado AWI, instalado, por pie lineal', unit: 'LF', csi: '06 41 16',
      material_cost_cents: { v: 19000, prov: est('shop-fabricated P-lam wall cabinet, national baseline 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('two-person hang on ledger, screw to blocking at 16 in. o.c.') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('shop-built to length') } },
    { code: 'G-MW-VENEER-PANEL-SF', name: 'Wood-veneer wall paneling, flush panels on Z-clips or cleats, shop-finished, installed, per SF', name_es: 'Paneles de muro con chapa de madera, paneles al ras sobre clips en Z o listones, acabado de taller, instalados, por pie²', unit: 'SF', csi: '06 42 16',
      material_cost_cents: { v: 3800, prov: est('custom-grade veneer panels with hangers, national baseline 2026 — species drives cost') }, labor_hours_per_unit: { v: 0.12, prov: est('layout, set clips, hang, shim and align reveals') },
      equipment_cost_cents: { v: 0, prov: est('lift covered by equipment rules') }, waste_pct: { v: 5, prov: est('scribe and field-trim allowance') } },
    { code: 'G-MW-RECEPT-DESK-EA', name: 'Reception / transaction desk allowance, ~10–12 LF with accessible section, installed, each', name_es: 'Partida para mostrador de recepción / atención, ~10 a 12 pies lineales con sección accesible, instalado, c/u', unit: 'EA', csi: '06 41 00',
      material_cost_cents: { v: 1200000, prov: est('mid-range shop-built desk (laminate + solid surface transaction top), allowance — design drives cost') }, labor_hours_per_unit: { v: 16, prov: est('two-person set, join sections, anchor, scribe, wire grommets, punch') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('shop-built unit') } },
    { code: 'G-MW-SHOP-DWG-EA', name: 'Millwork shop drawings, samples and field-measure visit, per package', name_es: 'Planos de taller, muestras y visita de medición de carpintería, por paquete', unit: 'EA', csi: '06 40 00',
      material_cost_cents: { v: 250000, prov: est('drafting/engineering service + finish samples, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('field measure and verification visits') },
      equipment_cost_cents: { v: 0, prov: est('none') }, waste_pct: { v: 0, prov: est('n/a') } },
    { code: 'G-MW-FRT-BLOCK-LF', name: 'In-wall blocking for millwork, 2x6/2x8 fire-retardant treated, installed before drywall, per LF', name_es: 'Bloqueo en muro para carpintería, 2x6/2x8 tratado ignífugo, instalado antes de la tablaroca, por pie lineal', unit: 'LF', csi: '06 10 53',
      material_cost_cents: { v: 450, prov: est('FRT dimensional lumber + fasteners/clips, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('cut and fasten between studs at layout heights') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('stud-bay cut-offs') } },
  ],
  quantity_rules: [
    { code: 'G-MW-SHOP-DWG-EA', assumption: 'Commercial project — one millwork shop drawing / field-measure package', when: { building_types: COM }, qty: { basis: 'const', mul: 1 } },
    { code: 'G-MW-PLAM-BASE-LF', assumption: 'Commercial project — ≈24 LF of P-lam base casework (break room + work room) until millwork elevations are read; delete G-CAB-BASE-LF if a cabinet callout also seeded it', when: { building_types: COM }, qty: { basis: 'const', mul: 24 } },
    { code: 'G-MW-PLAM-UPPER-LF', assumption: 'Commercial project — ≈16 LF of P-lam wall casework over the base run until elevations are read', when: { building_types: COM }, qty: { basis: 'const', mul: 16 } },
    { code: 'G-MW-FRT-BLOCK-LF', assumption: 'Commercial project — ≈2 LF of in-wall blocking per LF of casework (base + upper + desk) ≈ 80 LF; confirm the wall assembly needs FRT', when: { building_types: COM }, qty: { basis: 'const', mul: 80 } },
  ],
  dependency_hints: [
    { note: 'Blocking for millwork must be laid out and installed during framing, before drywall closes the walls — get approved shop drawings early.' },
    { after_trades: ['drywall'], note: 'Millwork is delivered and installed after drywall, painting and ceilings are complete and HVAC is holding humidity (UFGS 06 41 16 1.6–1.7).' },
  ],
});
