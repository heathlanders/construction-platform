// Trade Knowledge Pack — utility_locating (Utility Locating / GPR Scanning).
// Wave 21, SERVICES pattern: permit_trade is null → no gates, no code_refs, no assemblies, no
// quantity rules, no components. The trade's product is a set of deliverables (one-call ticket, marks,
// private-locate report/map, GPR slab-scan report) — those are the QA items. One optional recipe for a
// private utility locate / slab scan; no blueprint template task uses this trade today.
// The GPR scan PRICE already lives in the concrete_cutting pack (G-CUT-GPR-EA) — referenced, never redeclared.
// Legal anchor is Wisconsin's Diggers Hotline law, Wis. Stat. § 182.0175 (other states have their own
// one-call law; the concepts — notice, marks, clearance, renewal — carry over).
// Dossier: docs/trade-packs/dossiers/utility_locating.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string | string[], note?: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const wi = (note?: string) => src('utility_locating-wi-182-0175', note);
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'utility_locating',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Finds and marks buried lines before anyone digs, drills or cuts: confirms the 811 / one-call ticket, locates private lines the utilities do not mark (propane, outbuilding power, irrigation, site lighting, storm), scans concrete slabs with ground-penetrating radar before cutting or coring, and hands over marks plus a written locate or scan report.',
    summary_es: 'Encuentra y marca líneas enterradas antes de excavar, perforar o cortar: confirma el ticket del 811, localiza líneas privadas que las compañías no marcan (propano, luz a otros edificios, riego, alumbrado), escanea losas con georradar antes de cortar o hacer núcleos y entrega marcas más un reporte escrito.',
    glossary: [
      { term: 'One-call ticket (811)', term_es: 'Ticket de one-call (811)', def: 'Locate request filed with the state one-call center (Diggers Hotline in Wisconsin); its number, start date and the list of utilities notified prove the dig was called in.', def_es: 'Solicitud de localización hecha al centro one-call del estado (Diggers Hotline en Wisconsin); su número, fecha de inicio y la lista de compañías avisadas prueban que se llamó antes de excavar.' },
      { term: 'Private facility', term_es: 'Instalación privada', def: 'Line owned by the property owner, not a utility member — propane, power to a garage or sign, irrigation, parking-lot lighting. 811 does not mark these; a private locator does.', def_es: 'Línea del dueño de la propiedad, no de una compañía miembro — propano, luz a un garaje o letrero, riego, alumbrado del estacionamiento. El 811 no las marca; las marca un localizador privado.' },
      { term: 'White lining', term_es: 'Marcado en blanco', def: 'White paint, flags or stakes outlining where the excavation will happen, so locators mark the right area.', def_es: 'Pintura, banderas o estacas blancas que delimitan dónde se va a excavar, para que los localizadores marquen el área correcta.' },
      { term: 'Uniform color code', term_es: 'Código de colores uniforme', def: 'Marking colors for buried lines: red power, yellow gas/oil/steam, orange communications, blue water, green sewer/drain, purple reclaimed water, pink survey, white proposed dig.', def_es: 'Colores de marcado de líneas enterradas: rojo electricidad, amarillo gas/petróleo/vapor, naranja comunicaciones, azul agua, verde drenaje, morado agua reciclada, rosa topografía, blanco excavación propuesta.' },
      { term: 'Tolerance zone', term_es: 'Zona de tolerancia', def: 'Band on each side of a mark where the line may actually be; dig there only by hand or vacuum. Wisconsin requires an 18 in. clearance for powered equipment.', def_es: 'Franja a cada lado de una marca donde puede estar la línea; ahí solo se excava a mano o con aspiradora. Wisconsin exige 18 pulg de separación para equipo motorizado.' },
      { term: 'Electromagnetic (EM) locator', term_es: 'Localizador electromagnético (EM)', def: 'Transmitter and receiver that trace a metal line or tracer wire by direct connection, clamp or induction; a sonde does the same inside nonmetallic pipe.', def_es: 'Transmisor y receptor que siguen una línea metálica o cable trazador por conexión directa, pinza o inducción; una sonda hace lo mismo dentro de tubo no metálico.' },
      { term: 'Ground-penetrating radar (GPR)', term_es: 'Georradar (GPR)', def: 'Radar cart or handheld unit that shows reflections from rebar, tendons, conduit and pipe in concrete or soil; depth readings are estimates.', def_es: 'Carrito o equipo de mano de radar que muestra reflejos de varilla, cables, conduit y tubería en concreto o suelo; la profundidad que indica es estimada.' },
      { term: 'Tracer wire', term_es: 'Cable trazador', def: 'Wire buried with plastic pipe so it can be found with an EM locator; Wisconsin requires it on nonconductive water and sewer laterals installed after 2006.', def_es: 'Cable enterrado junto a tubería de plástico para poder encontrarla con un localizador EM; Wisconsin lo exige en acometidas no conductoras de agua y drenaje instaladas después de 2006.' },
      { term: 'Quality level (QL-A to QL-D)', term_es: 'Nivel de calidad (QL-A a QL-D)', def: 'Subsurface utility engineering label for how a line was found: D records, C visible surface features, B traced with instruments, A exposed and measured in a test hole.', def_es: 'Etiqueta de ingeniería de servicios subterráneos según cómo se encontró la línea: D registros, C elementos visibles, B trazada con instrumentos, A expuesta y medida en un sondeo.' },
      { term: 'Relocate / repeat notice', term_es: 'Re-marcado / aviso repetido', def: 'New request to refresh marks when they are destroyed, or when the dig does not start or stops for more than 10 days.', def_es: 'Nueva solicitud para renovar marcas cuando se destruyen, o cuando la excavación no empieza o se detiene por más de 10 días.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'private_locate_scan',
      example_title: 'Private utility locate and GPR slab scan before cutting',
      when: { title_re: '\\b(?:private\\s+(?:utility\\s+)?locat\\w*|utility\\s+locat\\w*|GPR|ground[- ]penetrating\\s+radar|(?:slab|concrete)\\s+scan\\w*|scan\\s+(?:the\\s+)?slab|subsurface\\s+utility)\\b' },
      steps: [
        {
          title: 'Confirm the one-call ticket and the work area',
          instruction: 'Get the 811 / one-call ticket number, its legal start date and time, and the list of utilities notified. Check that the dig area is outlined in white and matches the ticket. Do not start until every listed utility has marked or answered "clear".',
          detail: 'Wisconsin: notice at least 3 working days ahead (weekends and holidays do not count). Each contractor digging needs its own ticket. One-call does not cover private lines — that is this job.',
          tools: ['ticket printout or phone', 'white marking paint', 'flags'],
          materials: [],
          safety_ids: ['utility_strike'],
          qa_ids: ['ticket_valid', 'white_lining'],
        },
        {
          title: 'Review records and walk the site',
          instruction: 'Collect as-builts, site plans and the owner\'s knowledge of private lines. Walk the area and note every surface clue: meters, risers, pedestals, valve boxes, cleanouts, light poles, a propane tank, sprinkler heads, outbuildings with power. Set up traffic control first if you will work in the street.',
          tools: ['site plan', 'camera', 'measuring wheel'],
          materials: ['cones and signs if in the roadway'],
          safety_ids: ['roadway_struck_by', 'confined_space'],
          qa_ids: ['quality_level'],
        },
        {
          title: 'Trace and mark the private lines',
          instruction: 'Trace metal lines and tracer wire with the EM locator — direct connect where you can reach the line, clamp or induction where you cannot. Push a sonde through nonmetallic sewer or drain pipe from a cleanout. Sweep with GPR for plastic lines with no tracer wire. Paint and flag each line in its color with the owner and size, and write "not located" where a line you expected could not be found.',
          detail: 'Never open a manhole or vault to drop a sonde without the confined-space check. EM and GPR give horizontal position best; any depth reading is an estimate.',
          tools: ['EM locator transmitter and receiver', 'sonde and push rod', 'GPR unit', 'marking paint in color code', 'flags'],
          materials: ['marking paint', 'flags', 'stakes for unpaved ground'],
          safety_ids: ['roadway_struck_by', 'confined_space'],
          qa_ids: ['color_code_marks', 'tracer_wire'],
        },
        {
          title: 'Scan the slab before cutting or coring',
          instruction: 'Lay out the cut lines or core centers first. Scan the area in a grid with GPR and mark rebar, post-tension tendons, conduit, radiant tubing and pipe right on the concrete. Note estimated depths as approximate and write down anything that limits the scan (dense steel, wet or new concrete, metal deck, a second mat). If a target near a cut cannot be identified, stop and tell the super — do not guess.',
          tools: ['GPR unit', 'marking crayon or paint', 'chalk line', 'camera'],
          materials: [],
          safety_ids: ['energized_concealed', 'silica_dust'],
          qa_ids: ['gpr_report'],
        },
        {
          title: 'Hand over the report and protect the marks',
          instruction: 'Give the GC a locate or scan report with a sketch or map, photos of the marks, the ticket number, date, method used for each line, quality level and the "not located" list. Remind the crew: hand or vacuum digging only inside the tolerance zone. Call in a relocate when marks get destroyed or the dig is delayed or stopped more than 10 days.',
          tools: ['report template', 'camera'],
          materials: [],
          safety_ids: ['utility_strike'],
          qa_ids: ['private_report', 'tolerance_zone', 'ticket_renewal', 'exposed_inspected'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Striking a buried power, gas or communication line while probing, potholing or digging to verify a mark — electrocution, gas release, fire', hazard_es: PENDING_ES, controls: ['Dig only on a valid ticket after every utility has responded', 'Expose lines by hand or vacuum excavation inside the tolerance zone (18 in. in Wisconsin)', 'If a line is hit or gas escapes: stop, clear the area, call 911 and the line owner'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(3)', severity: 4, ppe: ['hard hat', 'safety glasses', 'gloves'], prov: src(['ecfr-1926-p', 'utility_locating-wi-182-0175'], '1926.651(b)(1)–(4); Wis. Stat. 182.0175(2)(as), (2)(am)7') },
    { id: 'roadway_struck_by', hazard: 'Struck by passing traffic while tracing lines and painting marks in the street or parking lot', hazard_es: PENDING_ES, controls: ['Set signs and cones per the traffic control plan before entering the lane', 'Park the truck upstream with beacons on as a shield', 'Face traffic while marking; use a lookout on busy streets'], controls_es: PENDING_ES, osha_ref: '1926.200(g)(2)', severity: 4, ppe: ['high-visibility apparel Class 2 or 3'], prov: src(['ecfr-1926-g', 'asphalt_paving-mutcd-part6']) },
    { id: 'energized_concealed', hazard: 'Missed or misread scan targets lead the cutting or coring crew into live conduit or cable hidden in the slab', hazard_es: PENDING_ES, controls: ['Tell the crew which targets are confirmed and which are uncertain; never imply a clean slab', 'Have circuits in the cut area de-energized and locked out where the scan is unclear', 'Stop at any unidentified target near a cut and get the super'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: src(['ecfr-1926-k', 'concrete_cutting-csda']) },
    { id: 'silica_dust', hazard: 'Breathing silica dust from drilling verification holes or working beside slab cutting and coring', hazard_es: PENDING_ES, controls: ['Use water or a vacuum dust collector on any drill or saw per Table 1', 'Stay out of the dust from other crews\' cutting; scan before they start, not during', 'Wear the respirator Table 1 calls for when controls are not enough'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator per Table 1 when required', 'safety glasses'], prov: src('ecfr-1926-z') },
    { id: 'confined_space', hazard: 'Entering or leaning into a manhole, vault or pit to reach a line or launch a sonde — bad air, gas, falls', hazard_es: PENDING_ES, controls: ['Work from the surface: push rods and sondes in from the opening, never enter', 'Treat vaults and manholes as confined spaces until a competent person says otherwise; test the air before any entry', 'Guard open covers so no one falls in'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, ppe: ['gas monitor where entry is possible'], prov: src('ecfr-1926-aa') },
  ],
  qa_checklist: [
    { id: 'ticket_valid', phase: 'site_prep', item: 'One-call ticket number recorded; ticket filed at least 3 working days ahead, start date/time reached, and every listed utility has marked or answered "clear" before digging.', item_es: PENDING_ES, safety: true, prov: wi('182.0175(2)(am)1, (2)(bm), (2m)(a)2; Diggers Hotline guide (cleared only after all members respond)') },
    { id: 'white_lining', phase: 'site_prep', item: 'Proposed dig area outlined in white paint, flags or stakes and matches the ticket description.', item_es: tr('El área de excavación propuesta está delimitada con pintura, banderas o estacas blancas y coincide con la descripción del ticket.'), prov: src(['utility_locating-diggers-hotline-guide', 'utility_locating-cga-best-practices']) },
    { id: 'color_code_marks', phase: 'site_prep', item: 'Every located line marked in the uniform color code (red, yellow, orange, blue, green, purple; pink survey, white proposed) with paint on pavement and flags or stakes on soil, labeled with owner and size.', item_es: tr('Cada línea localizada está marcada con el código de colores uniforme (rojo, amarillo, naranja, azul, verde, morado; rosa topografía, blanco propuesta) con pintura en pavimento y banderas o estacas en tierra, rotulada con dueño y tamaño.'), prov: src(['utility_locating-wi-182-0175', 'utility_locating-cga-best-practices'], 'Wis. Stat. 182.0175(2m)(b)1–7; purple reclaimed water per CGA') },
    { id: 'private_report', phase: 'site_prep', item: 'Private-locate report handed over: sketch or map, photos of marks, ticket number, date, method used per line, and a list of lines expected but not located.', item_es: tr('Reporte de localización privada entregado: croquis o plano, fotos de las marcas, número de ticket, fecha, método usado por línea y lista de líneas esperadas que no se localizaron.'), prov: src(['utility_locating-wi-182-0175', 'utility_locating-cga-best-practices'], '182.0175(1m)(e)1 — one-call excludes private facilities, so the private locate needs its own record') },
    { id: 'gpr_report', phase: 'site_prep', item: 'GPR slab-scan report: scanned area and grid, targets marked on the concrete, depths labeled as approximate, scan limits stated (dense steel, wet concrete, metal deck), and photos of the layout.', item_es: PENDING_ES, safety: true, prov: src('concrete_cutting-csda', 'CSDA-BP-007 / BP-026 concepts (scan, mark, state limits) — by title') },
    { id: 'tolerance_zone', phase: 'site_prep', item: 'Crew told the tolerance zone: no powered digging within 18 in. of an unexposed mark; once exposed, at least 12 in. or twice the machine\'s control limit.', item_es: PENDING_ES, safety: true, prov: wi('182.0175(2)(as)1–2') },
    { id: 'ticket_renewal', phase: 'site_prep', item: 'Relocate or repeat notice filed when marks are destroyed or covered, the dig does not start within 10 days of the ticket start, or work stops more than 10 days.', item_es: PENDING_ES, safety: true, prov: src(['utility_locating-wi-182-0175', 'utility_locating-diggers-hotline-guide'], '182.0175(2)(am)4') },
    { id: 'exposed_inspected', phase: 'site_prep', item: 'Exposed lines inspected before backfill; any strike or damage reported to the owner right away, and to 911 if gas or a hazardous liquid escapes; no backfill until the owner has inspected or repaired.', item_es: PENDING_ES, safety: true, prov: wi('182.0175(2)(am)6, 6m, 7') },
    { id: 'tracer_wire', phase: 'site_prep', item: 'Plastic water or sewer laterals checked for tracer wire; a lateral with no wire or a broken wire is noted on the report and swept with GPR or a sonde.', item_es: tr('Se revisa si las acometidas plásticas de agua o drenaje tienen cable trazador; una acometida sin cable o con cable roto se anota en el reporte y se busca con GPR o sonda.'), prov: wi('182.0175(2r) — locating wire on nonconductive laterals installed after Dec 31, 2006') },
    { id: 'quality_level', phase: 'site_prep', item: 'When the job calls for subsurface utility engineering, each line segment on the deliverable is tagged with its ASCE 38 quality level (D records, C surface features, B traced, A exposed in a test hole).', item_es: tr('Cuando el trabajo pide ingeniería de servicios subterráneos, cada tramo de línea en el entregable lleva su nivel de calidad ASCE 38 (D registros, C elementos visibles, B trazado, A expuesto en un sondeo).'), prov: src('utility_locating-asce-38', 'Quality-level names only — reference') },
  ],
  inspection_checklists: {
    locate_ticket_valid: [
      { item: 'Ticket number, start date/time and list of notified utilities on site', item_es: tr('Número de ticket, fecha y hora de inicio y lista de compañías avisadas en el sitio'), ref: 'Wis. Stat. 182.0175(2)(bm)' },
      { item: 'Every listed utility has marked or answered clear', item_es: PENDING_ES },
      { item: 'Ticket not stale: dig started within 10 days and not stopped more than 10 days', item_es: PENDING_ES, ref: 'Wis. Stat. 182.0175(2)(am)4' },
      { item: 'Separate ticket for each contractor who will dig', item_es: tr('Un ticket por separado para cada contratista que va a excavar') },
    ],
    pre_excavation_marks: [
      { item: 'Dig area white-lined and matches the ticket', item_es: tr('Área de excavación marcada en blanco y coincide con el ticket') },
      { item: 'Utility marks and private-locate marks visible, in the right colors, not faded or paved over', item_es: tr('Marcas de compañías y de localización privada visibles, del color correcto, sin borrarse ni quedar bajo pavimento') },
      { item: 'Private lines (propane, outbuilding power, irrigation, lighting) located or listed as not found', item_es: tr('Líneas privadas (propano, luz a otros edificios, riego, alumbrado) localizadas o anotadas como no encontradas') },
      { item: 'Crew briefed on the 18 in. tolerance zone and hand/vacuum digging near marks', item_es: PENDING_ES, ref: 'Wis. Stat. 182.0175(2)(as)' },
    ],
    slab_scan_before_cut: [
      { item: 'Cut lines and core centers laid out before the scan', item_es: tr('Líneas de corte y centros de núcleos trazados antes del escaneo') },
      { item: 'Targets marked on the concrete and shown in the scan report with approximate depths', item_es: tr('Objetivos marcados en el concreto y mostrados en el reporte con profundidades aproximadas') },
      { item: 'Unidentified targets near a cut resolved with the super or the cut moved', item_es: PENDING_ES },
    ],
  },
});
