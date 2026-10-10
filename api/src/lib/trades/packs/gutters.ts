// Trade Knowledge Pack — gutters (Gutters & Downspouts). Wave 04 — NEW-TRADE pattern (no hand recipe).
// permit_trade null → NO gates, NO code_refs; owner/walkthrough hold points go in inspection_checklists.
// Bucket override: the existing catalog row B-GUTTER-LF (gutter + downspout, aluminum K-style) lives in
// 'building', so this pack pins est_bucket 'building' and uses B-GUT- codes; B-GUTTER-LF is referenced,
// never redeclared. Dossier: docs/trade-packs/dossiers/gutters.md. Sources: DOE BASC gutters & downspouts
// guide, UFGS 07 60 00 (3.1.17–3.1.18), Amerimax installation sheet + FAQ + guard sheet, SMACNA ASMM
// (reference only), IRC R801.3 (reference only), 29 CFR 1926 Subparts C, E, I, K, L, M, X.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const basc = (note?: string) => ({ src: ['gutters-doe-basc'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ufgs = (note?: string) => ({ src: ['gutters-ufgs-07-60-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const mfr = (note?: string) => ({ src: ['gutters-amerimax-metal-install', 'gutters-amerimax-faq'], confidence: 'derived' as const, last_verified: D, note: note ?? 'From the manufacturer’s published installation sheet / FAQ — follow the instructions for the system installed.' });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'gutters',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Collects roof runoff at the eaves and carries it away from the building: seamless aluminum (or steel/copper) gutters roll-formed on site, hangers, outlets, downspouts, extensions or drain tie-ins, and optional gutter guards and heat cable — plus tear-off and replacement of old systems.',
    summary_es: 'Recoge el agua del techo en los aleros y la aleja del edificio: canalones de aluminio sin costura (o acero/cobre) formados en obra, soportes, salidas, bajantes, extensiones o conexión a drenaje, y protectores de canalón y cable calefactor opcionales — además de retirar y reemplazar sistemas viejos.',
    glossary: [
      { term: 'Seamless gutter', term_es: 'Canalón sin costura', def: 'Gutter rolled from a coil on site to the full length of each run, so the only joints are corners and ends.', def_es: 'Canalón formado en obra desde un rollo al largo completo de cada tramo; solo tiene uniones en esquinas y extremos.' },
      { term: 'K-style gutter', term_es: 'Canalón estilo K', def: 'Flat-back gutter whose front face looks like crown molding — the common house profile.', def_es: 'Canalón de respaldo plano cuyo frente parece moldura de corona; el perfil común en casas.' },
      { term: 'Downspout (leader)', term_es: 'Bajante', def: 'Vertical pipe that carries water from the gutter outlet down to grade.', def_es: 'Tubo vertical que lleva el agua desde la salida del canalón hasta el suelo.' },
      { term: 'Outlet (drop)', term_es: 'Salida (embudo)', def: 'Hole and sleeve in the gutter bottom where the downspout connects.', def_es: 'Abertura con manga en el fondo del canalón donde se conecta la bajante.' },
      { term: 'Hidden hanger', term_es: 'Soporte oculto', def: 'Bracket inside the gutter that screws through to the fascia or rafter tail.', def_es: 'Soporte dentro del canalón que se atornilla a la fascia o a la cola del cabio.' },
      { term: 'Miter', term_es: 'Inglete (esquina)', def: 'Inside or outside corner piece where two gutter runs meet.', def_es: 'Pieza de esquina interior o exterior donde se unen dos tramos de canalón.' },
      { term: 'End cap', term_es: 'Tapa final', def: 'Piece that closes the open end of a gutter run; sealed and riveted.', def_es: 'Pieza que cierra el extremo abierto de un tramo; sellada y remachada.' },
      { term: 'Splash block / extension', term_es: 'Bloque de salpicadura / extensión', def: 'Pad or pipe at the downspout bottom that sends water away from the foundation.', def_es: 'Bloque o tubo al pie de la bajante que aleja el agua de la cimentación.' },
      { term: 'Kick-out flashing', term_es: 'Desviador (kick-out)', def: 'Bent flashing where a roof edge dies into a wall; it throws water into the gutter instead of behind the siding.', def_es: 'Tapajuntas doblado donde el borde del techo termina contra un muro; manda el agua al canalón y no detrás del revestimiento.' },
      { term: 'Gutter guard', term_es: 'Protector de canalón', def: 'Screen or cover over the gutter that keeps leaves and needles out.', def_es: 'Malla o cubierta sobre el canalón que impide la entrada de hojas y agujas.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'seamless_gutter_install',
      example_title: 'Gutters & downspouts install',
      when: { title_re: '\\bgutters?\\b|\\bdownspouts?\\b|eavestrough|roof drainage' },
      steps: [
        {
          title: 'Walk the eaves and lay out downspouts',
          instruction: 'Before raising a ladder, look up for the service drop and any overhead lines and plan every ladder and coil move to stay clear of them. Check the fascia and rafter tails for rot and the drip edge for damage. Mark downspout spots at the ends of long runs and every 20–40 ft of gutter, at corners where it helps, and where the water can run away from walks, drives and the foundation.',
          tools: ['tape measure', 'binoculars or a phone camera', 'awl', 'marker'],
          materials: [],
          safety_ids: ['power_line', 'ladder_conductive'],
          qa_ids: ['fascia_sound', 'downspout_spacing', 'size_for_roof'],
        },
        {
          title: 'Snap the slope line',
          instruction: 'Mark the high point of each run midway between outlets (or at the far end of a one-outlet run) just under the drip edge, then drop the line about 1/4 in. per 10 ft toward each outlet — or the slope the spec or manufacturer calls for. Snap a chalk line or set a string so the whole run falls evenly with no flat or back-pitched spots.',
          tools: ['chalk line or string', 'level', 'tape measure'],
          materials: [],
          safety_ids: ['ladder', 'roof_edge_fall'],
          qa_ids: ['slope_to_outlets'],
        },
        {
          title: 'Form, cut and assemble the gutter',
          instruction: 'Run the gutter machine with its guards on and feed the coil hands-clear. Roll each run a little long, cut outlets with a punch or snips, and seal and rivet end caps and miters with gutter sealant. Do not mix aluminum with steel or copper parts — the metals corrode each other.',
          detail: 'On long straight runs (commercial), add an expansion slip joint midway between outlets.',
          tools: ['gutter roll-forming machine', 'tin snips', 'outlet punch or drill', 'rivet gun', 'caulk gun'],
          materials: ['aluminum gutter coil', 'end caps', 'inside / outside miters', 'outlets', 'gutter sealant', 'pop rivets'],
          safety_ids: ['gutter_machine', 'sheet_metal_cut', 'eye_flying', 'cord_shock'],
          qa_ids: ['seams_sealed', 'expansion_joints'],
        },
        {
          title: 'Hang the gutter on the line',
          instruction: 'Two people carry and lift each long run, keeping it clear of power lines. Slip the back of the gutter under the drip edge, keep the front lip below the roof plane so snow and ice can slide clear, and screw a hidden hanger into the fascia or rafter tails every 24 in. — closer (about every 18 in.) in heavy snow country such as Wisconsin.',
          detail: 'Where ice dams are a known problem, heat cable may be added later per its maker; the circuit and GFCI protection are an electrician’s scope.',
          tools: ['drill/driver with hex bit', 'level', 'ladder stabilizers / standoffs'],
          materials: ['hidden hangers with screws', 'fascia screws'],
          safety_ids: ['ladder', 'power_line', 'roof_edge_fall', 'falling_objects', 'aerial_lift'],
          qa_ids: ['behind_drip_edge', 'hanger_spacing'],
        },
        {
          title: 'Run the downspouts',
          instruction: 'Fit the upper elbows to each outlet, then the downspout, with each upper piece slid inside the one below so water cannot leak out at the joints. Strap it to the wall at the top, the bottom and in between — about two straps per 10 ft section — with fasteners that match the metal. Make sure a kick-out flashing is in place wherever a roof edge ends against a wall above the gutter.',
          tools: ['drill/driver', 'tin snips', 'crimper'],
          materials: ['downspout sections', 'A and B elbows', 'downspout straps / bands', 'sheet metal screws'],
          safety_ids: ['ladder', 'power_line', 'sheet_metal_cut'],
          qa_ids: ['downspout_fastening', 'kickout_present'],
        },
        {
          title: 'Carry water away and test',
          instruction: 'Finish each downspout with an elbow onto an extension and splash block that drops the water at least 5 ft from the foundation onto ground that slopes away, or tie it into solid (non-perforated) pipe running to daylight or an approved drain. Never tie into the perforated footing drain. Run a hose at the high end of every run, watch every seam and outlet, then sweep the roof clear of metal chips and rivet stems.',
          tools: ['garden hose', 'level', 'broom or blower'],
          materials: ['downspout extensions or solid drain pipe', 'splash blocks'],
          safety_ids: ['ladder', 'roof_edge_fall'],
          qa_ids: ['discharge_distance', 'water_test', 'cleanup_shavings'],
        },
      ],
    },
    {
      id: 'gutter_replace_guards',
      example_title: 'Replace gutters and install gutter guards',
      when: { title_re: '(?:guard|cover|screen|leaf|replace(?:ment)?|re-?gutter|tear[- ]?off|remove)[^.]*\\bgutters?\\b|\\bgutters?\\b[^.]*(?:guard|cover|screen|replace(?:ment)?|tear[- ]?off|removal)' },
      priority: 10,
      steps: [
        {
          title: 'Set up below and check overhead lines',
          instruction: 'Rope or cone off the ground below the work so nobody walks under falling sections, and protect plantings. Locate the service drop and any overhead lines before moving ladders or long metal.',
          tools: ['caution tape or cones', 'tarps'],
          materials: [],
          safety_ids: ['falling_objects', 'power_line', 'ladder_conductive'],
        },
        {
          title: 'Take down the old gutters',
          instruction: 'Unscrew or cut hangers and lower each section to the ground — never drop it. Cut long runs into pieces short enough to control. Pull old spikes and fill the holes, then probe the fascia and rafter tails and replace rotted wood before anything new goes up.',
          tools: ['drill/driver', 'reciprocating saw or snips', 'pry bar', 'awl'],
          materials: ['replacement fascia stock where rotted', 'exterior wood filler'],
          safety_ids: ['ladder', 'sheet_metal_cut', 'falling_objects', 'roof_edge_fall'],
          qa_ids: ['fascia_sound'],
        },
        {
          title: 'Hang or re-hang to a true slope',
          instruction: 'For new gutters follow the full install sequence. For gutters that stay, re-snap the slope line, re-set sagging sections, and replace loose spikes with hidden hangers at the spacing the maker calls for so water drains to the outlets.',
          tools: ['chalk line', 'level', 'drill/driver'],
          materials: ['hidden hangers with screws', 'gutter sealant'],
          safety_ids: ['ladder', 'roof_edge_fall'],
          qa_ids: ['slope_to_outlets', 'hanger_spacing', 'seams_sealed'],
        },
        {
          title: 'Clean, flush and install the guards',
          instruction: 'Scoop out debris and flush each gutter and downspout until water runs clear before the guards go on. Fit the guards per their maker — clip or screw them to the gutter lip and slip or fasten the back edge as the instructions show, without lifting shingles enough to break their seal.',
          tools: ['gutter scoop', 'garden hose', 'drill/driver', 'tin snips'],
          materials: ['gutter guards / covers', 'guard fasteners'],
          safety_ids: ['ladder', 'sheet_metal_cut', 'roof_edge_fall'],
          qa_ids: ['guards_per_mfr'],
        },
        {
          title: 'Water test and clean up',
          instruction: 'Hose-test each run through the guards, confirm every downspout discharges well away from the foundation, and haul away old metal, hangers and debris.',
          tools: ['garden hose', 'broom or blower'],
          materials: ['downspout extensions or splash blocks as needed'],
          safety_ids: ['ladder'],
          qa_ids: ['water_test', 'discharge_distance', 'cleanup_shavings'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: '\\bgutters?\\b|\\bdownspouts?\\b|roof drainage', building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'boom_lift', reason: 'Reach second- and third-story eaves to hang long runs instead of working off tall ladders', optional: true },
  ],
  hazards: [
    { id: 'ladder', hazard: 'Fall from an extension ladder while hanging gutters or downspouts', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft past the eave or tie it off, set it on firm level footing at a 4:1 angle', 'Use standoffs so the ladder never leans on the gutter', 'Keep three points of contact; move the ladder instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'ladder_conductive', hazard: 'Metal ladder contacting overhead or service-drop conductors', hazard_es: PENDING_ES, controls: ['Use ladders with nonconductive side rails anywhere the ladder could touch energized lines', 'Look up before raising or moving any ladder'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(12)', severity: 4, prov: osha('x') },
    { id: 'power_line', hazard: 'Electrocution when long aluminum gutter runs, downspouts or coil swing into the service drop or overhead lines', hazard_es: PENDING_ES, controls: ['Locate the service drop and lines before work; keep all metal and people clear', 'Have the utility de-energize or cover the drop when the work must be close to it', 'Carry long runs low and horizontal with a spotter near lines'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'roof_edge_fall', hazard: 'Fall from the roof edge while reaching over the eave, setting the slope line or installing guards', hazard_es: PENDING_ES, controls: ['Work 6 ft or more above a lower level only with guardrail, safety net or personal fall arrest (or the residential alternative plan the rule allows)', 'Work from the ladder or a lift rather than leaning over the roof edge'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness + lanyard when on the roof'], prov: osha('m') },
    { id: 'falling_objects', hazard: 'Struck by a dropped gutter section, tools, hangers or old spikes', hazard_es: PENDING_ES, controls: ['Barricade the ground below the work and keep people out', 'Lower sections by hand or rope — never toss or drop them', 'Wear hard hats on the ground crew'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'sheet_metal_cut', hazard: 'Cuts from sharp gutter edges, snipped downspouts and old corroded metal', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when cutting, carrying and removing metal', 'File or hem sharp cut ends; bag scrap right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'long sleeves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from metal chips, rivet stems and debris falling from the gutter', hazard_es: PENDING_ES, controls: ['Wear safety glasses when drilling, riveting, cutting and cleaning out gutters overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'gutter_machine', hazard: 'Caught in the rollers or cut at the shear of the gutter roll-forming machine', hazard_es: PENDING_ES, controls: ['Keep all machine guards in place while running', 'Feed coil with hands clear of the rollers; lock out power before clearing a jam'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, prov: osha('i') },
    { id: 'cord_shock', hazard: 'Shock from the gutter machine, drills or cords used outdoors', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle and generator outlet', 'Inspect cords daily; keep them out of water'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a boom lift basket at upper eaves', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails — and keep clear of lines'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
  ],
  qa_checklist: [
    { id: 'fascia_sound', item: 'Fascia and rafter tails solid and free of rot before hanging; drip edge in place and undamaged.', item_es: tr('Fascia y colas de cabio firmes y sin pudrición antes de colgar; borde de goteo colocado y sin daños.'), prov: mfr('Installation sheet: remove old gutters and inspect fascia, replace if needed.') },
    { id: 'slope_to_outlets', item: 'Each run slopes evenly to its outlet with the high point midway between outlets — at least the maker’s minimum (about 1/4 in. per 10 ft); no flat or back-pitched spots.', item_es: tr('Cada tramo baja de forma pareja hacia su salida, con el punto alto a la mitad entre salidas; al menos el mínimo del fabricante (≈1/4 pulg. por 10 pies); sin tramos planos ni invertidos.'), prov: { src: ['gutters-amerimax-faq', 'gutters-ufgs-07-60-00', 'gutters-doe-basc'], confidence: 'verified', last_verified: D, note: 'Mfr minimum 1/4 in. per 10 ft; UFGS: slope uniformly to outlets, high points midway; DOE BASC guidance is steeper (≥1/16 in. per ft) — follow the project spec.' } },
    { id: 'behind_drip_edge', item: 'Gutter back sits under the drip edge and the front lip below the roof plane, so water lands in the gutter and snow and ice slide clear.', item_es: tr('El respaldo del canalón queda bajo el borde de goteo y el frente por debajo del plano del techo, para que el agua caiga dentro y la nieve y el hielo se deslicen.'), prov: { src: ['gutters-amerimax-metal-install', 'gutters-ufgs-07-60-00'], confidence: 'verified', last_verified: D } },
    { id: 'hanger_spacing', item: 'Hangers fastened into fascia or rafter tails every 24 in. or as the maker specifies, and closer (about 18 in.) in heavy snow and ice areas such as Wisconsin.', item_es: tr('Soportes fijados a la fascia o colas de cabio cada 24 pulg. o según el fabricante, y más juntos (≈18 pulg.) en zonas de mucha nieve y hielo como Wisconsin.'), prov: { src: ['gutters-amerimax-metal-install', 'gutters-ufgs-07-60-00'], confidence: 'verified', last_verified: D, note: 'Mfr: 24 in., 18 in. for heavy ice/snow; UFGS hangers ≤30 in. o.c.' } },
    { id: 'seams_sealed', item: 'End caps, miters and outlets sealed with gutter sealant and riveted; no drips at any joint during the water test.', item_es: tr('Tapas, ingletes y salidas sellados con sellador para canalón y remachados; ninguna unión gotea en la prueba de agua.'), prov: { src: ['gutters-amerimax-faq', 'gutters-ufgs-07-60-00'], confidence: 'verified', last_verified: D } },
    { id: 'expansion_joints', item: 'Long straight runs have an expansion slip joint midway between outlets; no mixed aluminum, steel and copper parts.', item_es: tr('Los tramos rectos largos llevan junta de dilatación a la mitad entre salidas; no se mezclan piezas de aluminio, acero y cobre.'), prov: { src: ['gutters-ufgs-07-60-00', 'gutters-amerimax-faq', 'gutters-smacna-asmm'], confidence: 'verified', last_verified: D, note: 'UFGS slip joints midway between outlets; mfr: do not mix metals (galvanic corrosion); SMACNA cited by concept only.' } },
    { id: 'downspout_spacing', item: 'Downspouts placed per the layout — typically every 20–50 ft of gutter and at the end of long runs; more where roof area or rainfall is high.', item_es: tr('Bajantes según el trazo: normalmente cada 20–50 pies de canalón y al final de tramos largos; más donde el área de techo o la lluvia son grandes.'), prov: { src: ['gutters-doe-basc', 'gutters-amerimax-faq'], confidence: 'verified', last_verified: D, note: 'DOE BASC: every 20–50 ft; mfr recommends about one per 20 ft.' } },
    { id: 'size_for_roof', item: 'Gutter and downspout size (e.g. 5 or 6 in. gutter, 2x3 or 3x4 downspout) matches the plans or is sized for the roof area and local rainfall.', item_es: tr('El tamaño del canalón y la bajante (p. ej. canalón de 5 o 6 pulg., bajante 2x3 o 3x4) coincide con los planos o se calcula para el área del techo y la lluvia local.'), prov: { src: ['gutters-doe-basc', 'gutters-smacna-asmm'], confidence: 'derived', last_verified: D, note: 'DOE BASC: install adequately sized gutters and downspouts; SMACNA sizing method cited by concept only.' } },
    { id: 'downspout_fastening', item: 'Downspout joints telescoped downhill (upper piece inside lower), strapped top, bottom and between (about two straps per 10 ft) with matching-metal fasteners.', item_es: tr('Uniones de bajante encajadas hacia abajo (pieza superior dentro de la inferior), sujetas arriba, abajo y en medio (≈2 abrazaderas por 10 pies) con tornillería del mismo metal.'), prov: { src: ['gutters-ufgs-07-60-00', 'gutters-amerimax-faq'], confidence: 'verified', last_verified: D } },
    { id: 'discharge_distance', item: 'Each downspout discharges at least 5 ft from the foundation onto grade sloping away, or into solid pipe to daylight / an approved drain (10 ft for an underground catchment); never into the footing drain.', item_es: tr('Cada bajante descarga al menos a 5 pies de la cimentación sobre terreno con pendiente hacia afuera, o a tubo sólido hacia superficie o drenaje aprobado (10 pies si es pozo subterráneo); nunca al drenaje de zapata.'), prov: { src: ['gutters-doe-basc', 'icc-pa'], confidence: 'verified', last_verified: D, note: 'DOE BASC discharge distances; IRC R801.3 roof drainage (reference only) requires a controlled discharge where soils are expansive or collapsible.' } },
    { id: 'kickout_present', item: 'Kick-out flashing present at every roof-wall intersection that ends above a gutter — coordinated with the siding/roofing crew.', item_es: tr('Hay desviador kick-out en cada encuentro techo-muro que termina sobre un canalón, coordinado con el equipo de revestimiento/techo.'), prov: { src: ['sid-doe-basc-kickout', 'gutters-doe-basc'], confidence: 'verified', last_verified: D } },
    { id: 'water_test', item: 'Hose test at the high end of every run: water reaches the outlet with no standing water in the gutter and no leaks at seams or downspout joints.', item_es: tr('Prueba con manguera en el extremo alto de cada tramo: el agua llega a la salida sin quedar estancada y sin fugas en uniones ni en la bajante.'), prov: mfr('Positive drainage to the outlet; leak-free seams.') },
    { id: 'guards_per_mfr', item: 'Gutters and downspouts cleaned before guards go on; guards fitted per their maker without breaking the shingle seal.', item_es: tr('Canalones y bajantes limpios antes de colocar protectores; protectores instalados según su fabricante sin romper el sello de las tejas.'), prov: { src: ['gutters-amerimax-guard'], confidence: 'derived', last_verified: D } },
    { id: 'heat_cable_gfci', item: 'Any gutter heat cable is installed per its maker on a ground-fault-protected circuit wired by an electrician, and does not overlap itself.', item_es: PENDING_ES, safety: true, prov: est('Electrical work is outside this trade; ground-fault protection and no-overlap are typical maker requirements for de-icing cable — confirm with the product installed.') },
    { id: 'cleanup_shavings', item: 'Roof, gutters and ground cleared of metal chips, rivet stems, old spikes and scrap at the end of the job.', item_es: tr('Techo, canalones y suelo limpios de virutas, remaches, clavos viejos y retazos al terminar el trabajo.'), prov: est('Metal chips stain and corrode roofing and finishes; standard close-out practice.') },
  ],
  inspection_checklists: {
    drainage_check: [
      { item: 'Every run drains to its outlet in a hose test; no standing water or leaking joints', item_es: tr('Cada tramo drena a su salida en la prueba con manguera; sin agua estancada ni uniones con fugas') },
      { item: 'Downspouts discharge 5 ft or more from the foundation onto grade that slopes away, or into solid drain pipe', item_es: tr('Las bajantes descargan a 5 pies o más de la cimentación sobre terreno con pendiente hacia afuera, o a tubo de drenaje sólido') },
      { item: 'No downspout tied into the perforated footing drain', item_es: tr('Ninguna bajante conectada al drenaje perforado de la zapata') },
      { item: 'Kick-out flashing at roof-wall intersections above gutters', item_es: tr('Desviador kick-out en encuentros techo-muro sobre canalones') },
    ],
    final_walkthrough: [
      { item: 'Gutters straight and tight to the fascia, behind the drip edge, with no visible sags', item_es: tr('Canalones rectos y pegados a la fascia, detrás del borde de goteo, sin pandeos visibles') },
      { item: 'Hangers at the agreed spacing (closer in snow country); end caps and miters sealed', item_es: tr('Soportes a la separación acordada (más juntos en zonas de nieve); tapas e ingletes sellados') },
      { item: 'Downspouts plumb and strapped; extensions or splash blocks in place', item_es: tr('Bajantes a plomo y sujetas; extensiones o bloques de salpicadura colocados') },
      { item: 'Gutter guards fitted where ordered; color matches the approved selection', item_es: tr('Protectores colocados donde se pidieron; el color coincide con la selección aprobada') },
      { item: 'Roof and yard clear of metal chips, scrap and old gutter debris', item_es: tr('Techo y patio limpios de virutas, retazos y restos de canalones viejos') },
    ],
  },
  assemblies: [
    { code: 'B-GUT-DS-LF', name: 'Additional aluminum downspout run (3x4) incl. elbows and straps, per LF', name_es: 'Tramo adicional de bajante de aluminio (3x4) con codos y abrazaderas, por pie lineal', unit: 'LF', csi: '07 71 23',
      description: 'For extra or tall downspouts beyond the allowance in B-GUTTER-LF (gutter + downspout).',
      material_cost_cents: { v: 450, prov: est('3x4 aluminum downspout + share of elbows and straps, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('cut, crimp, fit elbows and strap') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('cut-offs') } },
    { code: 'B-GUT-EXT-EA', name: 'Downspout extension with splash block, each', name_es: 'Extensión de bajante con bloque de salpicadura, c/u', unit: 'EA', csi: '07 71 23',
      material_cost_cents: { v: 2500, prov: est('elbow + 4–6 ft aluminum or flexible extension + precast or plastic splash block, 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('fit elbow and extension, set splash block on graded soil') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('bought per piece') } },
    { code: 'B-GUT-GUARD-LF', name: 'Gutter guard / cover, aluminum or steel mesh, per LF of gutter', name_es: 'Protector de canalón, malla de aluminio o acero, por pie lineal de canalón', unit: 'LF', csi: '07 71 23',
      material_cost_cents: { v: 400, prov: est('mid-grade metal mesh guard sections, national baseline 2026') }, labor_hours_per_unit: { v: 0.04, prov: est('clean, fit and fasten sections') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('end trims') } },
    { code: 'B-GUT-HEAT-LF', name: 'Gutter / downspout de-icing heat cable with clips, per LF (circuit by electrician)', name_es: 'Cable calefactor antihielo para canalón y bajante con clips, por pie lineal (circuito por electricista)', unit: 'LF', csi: '07 71 23',
      description: 'Cable and clips only — the GFCI-protected circuit and controller are electrical scope.',
      material_cost_cents: { v: 900, prov: est('self-regulating roof/gutter de-icing cable + clips, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('lay in gutter, run down downspout, clip') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('tails and loops') } },
    { code: 'B-GUT-REMOVE-LF', name: 'Remove and dispose existing gutters and downspouts, per LF', name_es: 'Retiro y desecho de canalones y bajantes existentes, por pie lineal', unit: 'LF', csi: '02 41 19',
      material_cost_cents: { v: 0, prov: est('no material') }, labor_hours_per_unit: { v: 0.03, prov: est('unhang, cut down, lower and load') },
      equipment_cost_cents: { v: 25, prov: est('haul / disposal share; aluminum scrap may offset') }, waste_pct: { v: 0, prov: est('removal — no waste factor') } },
  ],
  quantity_rules: [
    { code: 'B-GUTTER-LF', assumption: 'Gutters called out on plans — assume ≈160 LF of eave gutter + downspouts on a single-family house until measured from the roof plan (existing catalog assembly)', when: { facts_any: ['gutters_downspouts'], building_types: ['residential_sf'] }, qty: { basis: { component: 'gutters_downspouts' }, mul: 160 } },
    { code: 'B-GUTTER-LF', assumption: 'Gutters called out on plans — assume ≈320 LF of eave gutter + downspouts on a multi-family building until measured from the roof plan', when: { facts_any: ['gutters_downspouts'], building_types: ['residential_mf'] }, qty: { basis: { component: 'gutters_downspouts' }, mul: 320 } },
    { code: 'B-GUT-EXT-EA', assumption: 'One extension + splash block per downspout — ≈4 downspouts on a single-family house (one per ~40 ft of gutter)', when: { facts_any: ['gutters_downspouts'], building_types: ['residential_sf'] }, qty: { basis: { component: 'gutters_downspouts' }, mul: 4 } },
    { code: 'B-GUT-EXT-EA', assumption: 'One extension + splash block per downspout — ≈8 downspouts on a multi-family building', when: { facts_any: ['gutters_downspouts'], building_types: ['residential_mf'] }, qty: { basis: { component: 'gutters_downspouts' }, mul: 8 } },
  ],
  dependency_hints: [
    { after_trades: ['roofing', 'siding'], before_phase: 'sitework', note: 'Hang gutters after the roof drip edge, fascia and siding trim are done; set downspout discharge before final grading and landscaping.' },
  ],
});
