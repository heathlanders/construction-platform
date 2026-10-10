// Trade Knowledge Pack — surveying (Surveying / Staking).
// Wave 21 (services), NEW-TRADE pattern: no hand recipe; 5 blueprint template tasks
// ("Survey & stake building footprint", "Survey, ALTA & geotechnical investigation",
// "Survey, stake & geotechnical investigation", "Survey, geotechnical & environmental assessment").
// services → permit_trade null: NO gates, NO code_refs, NO assemblies/quantity rules/components.
// The geotechnical / environmental parts of those titles belong to the geotech and
// environmental_consulting trades — recipes here only coordinate with them.
// Wisconsin anchor: Wis. Admin. Code ch. A-E 7 (minimum standards for property surveys) and
// Wis. Stat. 443.02(4) (only a licensed professional land surveyor may practice land surveying).
// ALTA/NSPS 2021 is reference-only (public PDF not fetchable here).
// Dossier: docs/trade-packs/dossiers/surveying.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const src = (id: string | string[], note?: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const derived = (id: string | string[], note: string) => ({ src: Array.isArray(id) ? id : [id], confidence: 'derived' as const, last_verified: D, note });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const osha = (sub: string) => src([`ecfr-1926-${sub}`]);
const tr = (text: string) => ({ status: 'translated' as const, text });

const AE7 = 'surveying-wi-ae7';

export default definePack({
  key: 'surveying',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Land surveying and construction staking by a licensed professional land surveyor: researching records and retracing the property boundary, setting control and corner monuments, preparing the survey map or ALTA/NSPS plat, staking the building footprint and grades with offsets and cut sheets, and checking the foundation with a location / as-built survey.',
    summary_es: 'Topografía y trazo de obra a cargo de un agrimensor profesional con licencia: investigar registros y replantear el lindero, colocar puntos de control y mojoneras de esquina, preparar el plano del levantamiento o plano ALTA/NSPS, trazar la huella del edificio y niveles con estacas desplazadas y hojas de corte, y verificar la cimentación con un levantamiento de ubicación / as-built.',
    glossary: [
      { term: 'Professional land surveyor (PLS)', term_es: 'Agrimensor profesional con licencia', def: 'The licensed surveyor who signs and seals the survey; in Wisconsin only a licensee may practice or offer land surveying (Wis. Stat. 443.02(4)).', def_es: 'El agrimensor con licencia que firma y sella el levantamiento; en Wisconsin solo un titular de licencia puede ejercer u ofrecer la agrimensura.' },
      { term: 'Monument', term_es: 'Mojonera / monumento', def: 'A permanent physical marker (iron rod, pipe, concrete) set or found at a property corner; coordinates alone do not replace it.', def_es: 'Marca física permanente (varilla, tubo, concreto) colocada o encontrada en una esquina del predio; las coordenadas solas no la sustituyen.' },
      { term: 'Benchmark', term_es: 'Banco de nivel', def: 'A point of known elevation that all site grades, footing and floor elevations are run from.', def_es: 'Punto de elevación conocida desde el cual se corren todos los niveles del sitio, zapatas y pisos.' },
      { term: 'Control point', term_es: 'Punto de control', def: 'A protected point of known horizontal (and often vertical) position, set clear of the work, used to stake and re-stake the project.', def_es: 'Punto protegido de posición horizontal (y a menudo vertical) conocida, colocado fuera del área de trabajo, para trazar y volver a trazar la obra.' },
      { term: 'Offset stake', term_es: 'Estaca desplazada (offset)', def: 'A stake set a known distance off the true line or corner so it survives excavation and forming.', def_es: 'Estaca colocada a una distancia conocida de la línea o esquina real para que sobreviva la excavación y la cimbra.' },
      { term: 'Cut sheet', term_es: 'Hoja de cortes', def: 'A table listing each stake, its offset, and the cut or fill from the stake to the design grade.', def_es: 'Tabla que lista cada estaca, su desplazamiento y el corte o relleno desde la estaca hasta el nivel de diseño.' },
      { term: 'ALTA/NSPS land title survey', term_es: 'Levantamiento de título ALTA/NSPS', def: 'A boundary survey to the national ALTA/NSPS standard, tied to a title commitment, with optional Table A items agreed with the client or lender.', def_es: 'Levantamiento de linderos según la norma nacional ALTA/NSPS, ligado a un compromiso de título, con conceptos opcionales de la Tabla A acordados con el cliente o el prestamista.' },
      { term: 'Encroachment', term_es: 'Invasión de lindero', def: 'A building, fence, drive or other use that crosses a property line or setback; the survey map shows what the surveyor observed.', def_es: 'Edificio, cerca, entrada u otro uso que cruza un lindero o una restricción de retiro; el plano muestra lo que el agrimensor observó.' },
      { term: 'Foundation location (as-built) survey', term_es: 'Levantamiento de ubicación de cimentación (as-built)', def: 'A check of the formed or poured foundation against property lines, setbacks and design elevation before framing proceeds.', def_es: 'Verificación de la cimentación cimbrada o colada contra linderos, retiros y elevación de diseño antes de seguir con la estructura.' },
      { term: 'Relative positional accuracy', term_es: 'Precisión posicional relativa', def: 'The 95 % uncertainty between two surveyed corners; Wisconsin allows at most 0.13 ft plus 100 parts per million between adjacent corners.', def_es: 'La incertidumbre al 95 % entre dos esquinas levantadas; Wisconsin permite como máximo 0.13 pies más 100 partes por millón entre esquinas adyacentes.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'survey_and_stake',
      example_title: 'Survey & stake building footprint',
      when: { title_re: '\\bsurvey' },
      steps: [
        {
          title: 'Research records and set the scope with the client',
          instruction: 'Get the deed, recorded plat or certified survey map, prior surveys, right-of-way and section-corner records, and the site and grading plans. Confirm with the client what is needed: boundary retracement, control, footprint and grade staking, and a foundation location survey. Note the geotechnical and environmental work on the same task is by the geotech / environmental consultant — share the control and boring layout with them.',
          detail: 'Wis. Admin. Code A-E 7.03(1): the property survey follows the register of deeds records as nearly as practicable, using deeds, plats, PLSS monument records and right-of-way data.',
          tools: ['county register of deeds / surveyor records', 'site and grading plans'],
          materials: [],
          safety_ids: [],
          qa_ids: ['scope_written'],
        },
        {
          title: 'Locate monuments and retrace the boundary',
          instruction: 'Call 811 before driving any iron. Search for the record corner monuments and PLSS ties, measure between the monuments found, and compare with the record. Resolve the boundary and set any missing corner monuments flush with the ground where practicable. Record every monument as found or set.',
          detail: 'A-E 7.03(2): set monuments at the parcel corners unless they already exist. A-E 7.06(3): adjacent corners within 0.13 ft + 100 ppm; 7.06(4): closed traverse closure better than 1 in 3,000.',
          tools: ['total station or GNSS receiver', 'metal detector', 'shovel', 'sledge'],
          materials: ['iron rods or pipes with ID caps', 'witness lath and flagging'],
          safety_ids: ['traffic_struck_by', 'plants_animals', 'heat_cold', 'stake_driving'],
          qa_ids: ['monuments_found_or_set', 'positional_accuracy'],
        },
        {
          title: 'Set project control and a benchmark clear of the work',
          instruction: 'Set at least two (preferably three) intervisible horizontal control points and a benchmark outside the excavation, haul routes and laydown areas. Tie them to the boundary and the plan datum, flag and protect them, and give the contractor a control sheet with coordinates and elevations.',
          tools: ['total station or GNSS receiver', 'digital or automatic level'],
          materials: ['control hubs or rebar with caps', 'lath, flagging and paint'],
          safety_ids: ['equipment_struck_by', 'stake_driving'],
          qa_ids: ['control_redundant'],
        },
        {
          title: 'Stake the building footprint and grades with offsets',
          instruction: 'From control, stake the building corners and main gridlines at offsets that will survive excavation (or set batter boards), plus any rough-grade and utility stakes on the plan. Check the staked layout against setback lines and diagonals before anyone digs. Issue a cut sheet listing each stake, its offset, and cut or fill to design grade.',
          tools: ['total station or GNSS receiver', 'level and rod', 'tape'],
          materials: ['hubs and lath', 'marking paint', 'batter board lumber'],
          safety_ids: ['equipment_struck_by', 'excavation_edge', 'stake_driving'],
          qa_ids: ['layout_checked', 'monuments_protected'],
        },
        {
          title: 'Run a foundation location / as-built survey',
          instruction: 'After the footings or foundation walls are formed or poured, locate the corners and top-of-wall elevation and compare them with the property lines, setbacks and design elevation. Report any variance to the contractor and engineer in writing before framing starts.',
          tools: ['total station or GNSS receiver', 'level and rod'],
          materials: [],
          safety_ids: ['excavation_edge', 'trench_entry'],
          qa_ids: ['foundation_location_checked'],
        },
        {
          title: 'Prepare, seal and file the survey map',
          instruction: 'Draw the map with bearings and distances, monuments found or set, ties to government corners, any possession or encroachments observed, the parcel description and the client name. Seal and sign it with the compliance certificate, file it with the county, and deliver it with the staking and as-built records.',
          detail: 'A-E 7.05: map contents, seal and certificate, filed per Wis. Stat. 59.45(1). A-E 7.06(5): bearings to 30 seconds, distances to 0.01 ft.',
          tools: ['CAD / survey software'],
          materials: [],
          safety_ids: [],
          qa_ids: ['map_content', 'map_sealed_filed'],
        },
      ],
    },
    {
      id: 'alta_boundary_survey',
      example_title: 'Survey, ALTA & geotechnical investigation',
      priority: 1,
      when: { title_re: '\\bALTA\\b|\\bland\\s+title\\s+survey|\\bboundary\\s+survey' },
      steps: [
        {
          title: 'Agree the ALTA scope, Table A items and title commitment',
          instruction: 'Get the current title commitment and every recorded document it lists. Agree in writing with the client and lender which optional Table A items are included (for example flood zone, topography, utilities, parking, zoning) and who the certification is to. Confirm the geotechnical borings are by the geotech consultant and will be located from your control.',
          tools: ['title commitment and exception documents'],
          materials: [],
          safety_ids: [],
          qa_ids: ['scope_written'],
        },
        {
          title: 'Research the record and adjoiners',
          instruction: 'Pull deeds for the parcel and its adjoiners, recorded plats and certified survey maps, right-of-way plans and PLSS monument records. Plot every easement and exception from the commitment so each can be shown or noted as not plottable.',
          tools: ['register of deeds records', 'county surveyor / PLSS records'],
          materials: [],
          safety_ids: [],
          qa_ids: ['easements_addressed'],
        },
        {
          title: 'Locate boundary monuments, improvements and evidence of use',
          instruction: 'Call 811 first. Find and measure the record monuments, retrace the boundary and set missing corners. Locate buildings, drives, fences, utilities visible at the surface, and any use crossing the lines, plus the Table A items agreed.',
          detail: 'A-E 7.03 boundary retracement and corner monuments; A-E 7.05(5) show observed possession or use by others across the lines.',
          tools: ['total station or GNSS receiver', 'metal detector', 'level and rod'],
          materials: ['iron rods or pipes with ID caps', 'lath and flagging'],
          safety_ids: ['traffic_struck_by', 'plants_animals', 'heat_cold', 'stake_driving'],
          qa_ids: ['monuments_found_or_set', 'positional_accuracy', 'map_content'],
        },
        {
          title: 'Set control for design, borings and construction',
          instruction: 'Leave protected control points and a benchmark on the plan datum so the designers, the geotech driller and the builder all work from the same points. Issue a control sheet.',
          tools: ['total station or GNSS receiver', 'digital or automatic level'],
          materials: ['control hubs or rebar with caps', 'lath and flagging'],
          safety_ids: ['equipment_struck_by', 'stake_driving'],
          qa_ids: ['control_redundant'],
        },
        {
          title: 'Draft, certify and deliver the ALTA/NSPS plat',
          instruction: 'Draft the plat to the ALTA/NSPS standard and the Wisconsin map rules: boundary bearings and distances, monuments found or set, easements and exceptions, improvements, encroachments and the agreed Table A items. Have the PLS review, sign, seal and certify it to the named parties, file it with the county as required, and deliver the plat and control data.',
          detail: 'A-E 7.05 map contents, 7.05(8) seal, signature and compliance statement; 7.05(11) coordinate system, datum and adjustment noted when coordinates are shown.',
          tools: ['CAD / survey software'],
          materials: [],
          safety_ids: [],
          qa_ids: ['map_content', 'map_sealed_filed', 'easements_addressed'],
        },
      ],
    },
  ],
  qa_checklist: [
    { id: 'scope_written', item: 'Scope agreed in writing: boundary, control, staking, as-built, and for an ALTA survey the Table A items and certified parties. Any A-E 7.01(4) exclusions are noted on the map.', item_es: tr('Alcance acordado por escrito: linderos, control, trazo, as-built y, en un levantamiento ALTA, los conceptos de la Tabla A y las partes certificadas. Toda exclusión de A-E 7.01(4) se anota en el plano.'), prov: src([AE7, 'surveying-alta-nsps-2021']) },
    { id: 'monuments_found_or_set', item: 'Every parcel corner has a monument, each shown on the map as found or set with a description; coordinates are not used in place of monuments.', item_es: tr('Cada esquina del predio tiene mojonera y cada una aparece en el plano como encontrada o colocada, con su descripción; no se usan coordenadas en lugar de mojoneras.'), prov: src([AE7, 'surveying-wi-stat236-15'], 'A-E 7.03(2), 7.05(4), 7.07; monument types per Wis. Stat. 236.15(1)') },
    { id: 'positional_accuracy', item: 'Relative positional accuracy between adjacent corners is within 0.13 ft + 100 ppm, and any closed traverse closes better than 1 in 3,000.', item_es: tr('La precisión posicional relativa entre esquinas adyacentes está dentro de 0.13 pies + 100 ppm, y toda poligonal cerrada cierra mejor que 1 en 3,000.'), prov: src(AE7, 'A-E 7.06(3)-(4)') },
    { id: 'control_redundant', item: 'At least two protected control points and a benchmark are set outside the work area, tied to the plan datum and listed on a control sheet given to the contractor.', item_es: tr('Hay al menos dos puntos de control protegidos y un banco de nivel fuera del área de trabajo, ligados al dato del plano y listados en una hoja de control entregada al contratista.'), prov: est('Common construction-layout practice; no public numeric standard cited.') },
    { id: 'layout_checked', item: 'Staked corners are checked by diagonals or an independent shot and against setback lines before excavation, and a cut sheet (stake, offset, cut/fill) is delivered.', item_es: tr('Las esquinas trazadas se verifican con diagonales o una medición independiente y contra las líneas de retiro antes de excavar, y se entrega una hoja de cortes (estaca, desplazamiento, corte/relleno).'), prov: est('Layout check practice; setbacks come from the local zoning approval.') },
    { id: 'foundation_location_checked', item: 'The foundation location / as-built survey confirms corners within setbacks and top of wall at design elevation before framing; variances are reported in writing.', item_es: tr('El levantamiento de ubicación de cimentación confirma esquinas dentro de los retiros y la corona del muro en la elevación de diseño antes de la estructura; las diferencias se reportan por escrito.'), prov: est('Many WI municipalities and lenders require a foundation location check; confirm locally.') },
    { id: 'map_content', item: 'Map shows bearings to 30 seconds and distances to 0.01 ft, ties to at least 2 government monuments, record-vs-measured notes, observed encroachments, the parcel description and the client name.', item_es: tr('El plano muestra rumbos a 30 segundos y distancias a 0.01 pies, ligas a por lo menos 2 monumentos oficiales, notas de registrado contra medido, invasiones observadas, la descripción del predio y el nombre del cliente.'), prov: src(AE7, 'A-E 7.05(3)-(7m), 7.06(5)') },
    { id: 'map_sealed_filed', item: 'Map is sealed, signed and certified by a licensed professional land surveyor as complying with ch. A-E 7, and filed with the county surveyor as required.', item_es: tr('El plano está sellado, firmado y certificado por un agrimensor profesional con licencia como conforme con el cap. A-E 7, y presentado ante el agrimensor del condado según se requiere.'), prov: src([AE7, 'surveying-wi-stat443', 'surveying-wi-stat59-45'], 'A-E 7.05(8)-(9); Wis. Stat. 443.02(4), 59.45(1)') },
    { id: 'monuments_protected', item: 'Corner monuments and control near the work are flagged and witnessed; any monument disturbed by construction is reported and reset by the surveyor (Wis. Stat. 236.32).', item_es: tr('Las mojoneras y puntos de control cerca de la obra están señalados y referenciados; toda mojonera alterada por la obra se reporta y la vuelve a colocar el agrimensor (Wis. Stat. 236.32).'), prov: src('surveying-wi-stat236-32') },
    { id: 'easements_addressed', item: 'Every easement and exception in the title commitment is plotted on the ALTA plat or noted as not plottable.', item_es: tr('Cada servidumbre y excepción del compromiso de título se dibuja en el plano ALTA o se anota como no dibujable.'), prov: derived('surveying-alta-nsps-2021', 'Paraphrase of the standard\'s record-document requirement; reference only.') },
  ],
  hazards: [
    { id: 'traffic_struck_by', hazard: 'Struck by a vehicle while measuring on or along a road, right-of-way or street corner', hazard_es: PENDING_ES, controls: ['Set work-zone signs and devices per MUTCD Part 6 before working in or next to a lane; use a flagger where needed', 'Wear high-visibility apparel and keep a lookout facing traffic', 'Park the survey truck as a buffer with warning lights on'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility vest'], prov: osha('g') },
    { id: 'equipment_struck_by', hazard: 'Struck by excavators, dozers or loaders while staking or checking grades in an active earthwork area', hazard_es: PENDING_ES, controls: ['Make eye contact with operators and agree hand signals before entering the swing or travel path', 'Never stand behind reversing machines; confirm backup alarms work', 'Wear high-visibility apparel on every active site'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest', 'hard hat'], prov: osha('o') },
    { id: 'trench_entry', hazard: 'Cave-in when stepping into an unprotected trench or footing excavation to shoot an elevation', hazard_es: PENDING_ES, controls: ['Do not enter an excavation 5 ft or deeper unless it is sloped, shored or boxed and the competent person allows it', 'Take shots from outside with an extendable rod where possible'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'excavation_edge', hazard: 'Falling into an excavation or the edge collapsing while setting offsets or checking a foundation', hazard_es: PENDING_ES, controls: ['Keep back from excavation edges and off spoil piles', 'Cross only on walkways; set instruments back from the edge'], controls_es: PENDING_ES, osha_ref: '1926.651(l)', severity: 3, prov: osha('p') },
    { id: 'heat_cold', hazard: 'Heat illness in summer or cold stress and slips in winter during long days walking lines in the field', hazard_es: PENDING_ES, controls: ['Carry water and take shade breaks; watch each other for heat illness signs', 'Dress in layers in cold weather, keep dry and limit time in wind chill; use traction aids on ice'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
    { id: 'plants_animals', hazard: 'Ticks, poison ivy, stinging insects and dogs while cutting lines through brush and fence rows', hazard_es: PENDING_ES, controls: ['Train the crew to recognize local harmful plants and animals and the first aid for each', 'Use repellent, long sleeves and tucked pants; check for ticks at the end of the day', 'Wear eye protection and gloves when clearing brush with a machete or saw'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(4)', severity: 2, prov: osha('c') },
    { id: 'stake_driving', hazard: 'Eye or hand injury from flying chips or a glancing sledge while driving hubs, lath and iron monuments', hazard_es: PENDING_ES, controls: ['Wear safety glasses and gloves when driving stakes or irons', 'Use a stake holder instead of holding the stake by hand; call 811 before driving long irons'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'gloves'], prov: osha('e') },
  ],
  inspection_checklists: {
    footprint_staking_review: [
      { item: 'Building corners and gridlines staked from project control, with offsets clear of the excavation.', item_es: tr('Esquinas y ejes del edificio trazados desde el control del proyecto, con desplazamientos fuera de la excavación.') },
      { item: 'Diagonals checked and staked layout compared with setback lines before digging.', item_es: tr('Diagonales verificadas y trazo comparado con las líneas de retiro antes de excavar.') },
      { item: 'Cut sheet and control sheet delivered to the contractor.', item_es: tr('Hoja de cortes y hoja de control entregadas al contratista.') },
    ],
    foundation_location_survey: [
      { item: 'Foundation corners located and compared with property lines and setbacks.', item_es: tr('Esquinas de la cimentación ubicadas y comparadas con linderos y retiros.') },
      { item: 'Top-of-wall or top-of-footing elevation checked against design.', item_es: tr('Elevación de la corona del muro o de la zapata verificada contra el diseño.') },
      { item: 'Written report of any variance issued before framing.', item_es: tr('Reporte escrito de cualquier diferencia emitido antes de la estructura.') },
    ],
  },
  dependency_hints: [
    { before_phase: 'foundation', note: 'Boundary, control and footprint staking come before excavation; the foundation location survey follows footing/wall placement.' },
  ],
});
