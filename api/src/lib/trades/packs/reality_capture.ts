// Trade Knowledge Pack — reality_capture (Reality Capture — Drone / Laser Scan / BIM). Wave 23, SERVICES
// pattern: permit_trade null → no gates, no code_refs, no recipes (no template tasks). The pack carries
// identity, deliverable QA (FAA Part 107 credentials + airspace authorization, registered point cloud
// with stated accuracy, survey-tied control, dated orthomosaics, scan-to-BIM with stated LOD, handover),
// on-site hazards for a capture tech walking an active site, and descriptive hold-point checklists.
// Boundary / control monumentation itself is the surveying pack — this pack ties INTO that control.
// USIBD LOA is purchased (reference only); BIMForum LOD is a free association spec (paraphrase).
// Dossier: docs/trade-packs/dossiers/reality_capture.md.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const p107 = (note?: string) => ({ src: ['reality_capture-ecfr-14-107'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const faa = (id: string, note?: string) => ({ src: ['reality_capture-ecfr-14-107', id], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const loa = (note?: string) => ({ src: ['reality_capture-usibd-loa'], confidence: 'derived' as const, last_verified: D, ...(note ? { note } : {}) });
const lod = (note?: string) => ({ src: ['reality_capture-bimforum-lod'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const base = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'reality_capture',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Documents existing and in-progress conditions: drone photo and mapping flights under FAA Part 107, terrestrial and mobile laser scanning, registered point clouds, orthomosaics and progress photo sets, and scan-to-BIM models with a stated level of development. Ties data to the surveyor\'s control; does not set boundaries or monuments.',
    summary_es: 'Documenta condiciones existentes y el avance de obra: vuelos de dron para fotos y mapeo bajo la Parte 107 de la FAA, escaneo láser terrestre y móvil, nubes de puntos registradas, ortomosaicos y fotos de avance, y modelos BIM a partir de escaneo con un nivel de desarrollo declarado. Liga los datos al control del topógrafo; no fija linderos ni mojoneras.',
    glossary: [
      { term: 'Remote pilot certificate (Part 107)', term_es: 'Certificado de piloto remoto (Parte 107)', def: 'FAA certificate with a small UAS rating needed to act as remote pilot in command of a commercial drone flight; kept current with recurrent training every 24 months.', def_es: 'Certificado de la FAA con habilitación de UAS pequeño necesario para ser piloto remoto al mando de un vuelo comercial de dron; se mantiene vigente con capacitación recurrente cada 24 meses.' },
      { term: 'LAANC authorization', term_es: 'Autorización LAANC', def: 'Near-real-time FAA airspace authorization for flying in controlled airspace near airports, requested through an approved app before the flight.', def_es: 'Autorización de espacio aéreo de la FAA casi en tiempo real para volar en espacio controlado cerca de aeropuertos, solicitada en una aplicación aprobada antes del vuelo.' },
      { term: 'Point cloud', term_es: 'Nube de puntos', def: 'Millions of measured 3D points from a laser scanner or photogrammetry that together show the shape of the site or building.', def_es: 'Millones de puntos 3D medidos con escáner láser o fotogrametría que juntos muestran la forma del sitio o del edificio.' },
      { term: 'Registration', term_es: 'Registro (alineación de escaneos)', def: 'Joining individual scan setups into one point cloud, using targets or overlap, and reporting how well they fit together.', def_es: 'Unir los escaneos individuales en una sola nube de puntos, con dianas o traslape, e informar qué tan bien encajan.' },
      { term: 'Control / check points', term_es: 'Puntos de control / de verificación', def: 'Surveyed targets of known coordinates: control points tie the data to the project coordinate system; check points are held back to test the accuracy.', def_es: 'Dianas topografiadas de coordenadas conocidas: los puntos de control ligan los datos al sistema de coordenadas del proyecto; los de verificación se reservan para probar la exactitud.' },
      { term: 'Orthomosaic', term_es: 'Ortomosaico', def: 'Drone photos stitched and corrected into one map-accurate overhead image of the site, dated to the flight.', def_es: 'Fotos de dron unidas y corregidas en una sola imagen aérea a escala del sitio, fechada con el vuelo.' },
      { term: 'Level of Accuracy (LOA)', term_es: 'Nivel de exactitud (LOA)', def: 'USIBD classification that states how accurate measured or modeled data is; the deliverable should name the LOA it meets.', def_es: 'Clasificación de USIBD que indica qué tan exactos son los datos medidos o modelados; el entregable debe indicar el LOA que cumple.' },
      { term: 'Level of Development (LOD)', term_es: 'Nivel de desarrollo (LOD)', def: 'BIMForum scale (100–500) describing how complete and reliable a model element is — e.g. generic placeholder vs. specific size, location and connections.', def_es: 'Escala de BIMForum (100–500) que describe qué tan completo y confiable es un elemento del modelo — p. ej. marcador genérico contra tamaño, ubicación y conexiones específicas.' },
      { term: 'Scan-to-BIM', term_es: 'Escaneo a BIM', def: 'Building a 3D model of existing conditions by tracing walls, structure and MEP from a registered point cloud.', def_es: 'Crear un modelo 3D de condiciones existentes trazando muros, estructura e instalaciones a partir de una nube de puntos registrada.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  hazards: [
    { id: 'struck_by_equipment', hazard: 'Struck by backing loaders, rollers or trucks while walking the site to set scanner positions, targets or a drone launch point', hazard_es: PENDING_ES, controls: ['Check in with the superintendent and get the day\'s equipment routes before setting up', 'Wear high-visibility clothing and set scanner and target positions outside equipment travel and swing paths', 'Never assume a machine operator can see you — make eye contact or use a spotter before crossing'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest', 'hard hat'], prov: osha('o', 'Reverse alarms / signaling required for earthmoving equipment with an obstructed rear view.') },
    { id: 'edge_fall', hazard: 'Fall from unprotected slab edges, roofs or deck while scanning a structure under construction', hazard_es: PENDING_ES, controls: ['Keep the tripod and yourself back from any edge 6 ft or more above a lower level unless a guardrail, net or tie-off is in place', 'Do not move guardrails to get a clearer line of sight — ask for a protected position or scan from a lift'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness and lanyard where tie-off is the protection'], prov: osha('m') },
    { id: 'floor_holes', hazard: 'Stepping into floor openings or onto unsecured hole covers while watching a scanner or controller screen', hazard_es: PENDING_ES, controls: ['Walk the scan route before setting up and note holes and covers', 'Stop walking while looking at the controller; move only with eyes on the floor'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 3, prov: osha('m') },
    { id: 'laser_exposure', hazard: 'Eye exposure from the scanner or a laser layout tool aimed at workers', hazard_es: PENDING_ES, controls: ['Confirm the scanner class on its label — most are Class 1 or 1M; post laser warning signs where a higher class is used', 'Never aim a laser at people and cap or turn the unit off when not scanning', 'Only trained operators set up and run laser equipment'], controls_es: PENDING_ES, osha_ref: '1926.54(g)', severity: 2, prov: osha('d', '1926.54 (Subpart D) — qualified operators, warning placards, beam not directed at employees.') },
    { id: 'drone_over_crews', hazard: 'Workers struck by a drone that loses link, battery or control while flying over the site', hazard_es: PENDING_ES, controls: ['Brief the crews and superintendent on the flight area and times; flight path avoids people not taking part unless the operation meets Part 107 rules for flying over people', 'Run the preflight check (link, battery, weather, ground hazards) before every flight and keep the drone in sight', 'Set a clear launch and landing zone with a cone perimeter'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: { src: ['ecfr-1926-c', 'reality_capture-ecfr-14-107'], confidence: 'derived' as const, last_verified: D, note: 'No 1926 drone rule; general hazard training 1926.21(b)(2) applies. Flight rules: 14 CFR 107.39, 107.49.' } },
    { id: 'falling_objects', hazard: 'Head injury from tools or material falling from work overhead while scanning below active trades', hazard_es: PENDING_ES, controls: ['Wear a hard hat on the active site at all times', 'Schedule interior scans away from overhead work or set positions outside the drop zone'], controls_es: PENDING_ES, osha_ref: '1926.100(a)', severity: 3, ppe: ['hard hat'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'pilot_cert', item: 'Remote pilot in command holds a current Part 107 certificate (recurrent training within 24 months); copy on file before the first flight.', item_es: tr('El piloto remoto al mando tiene certificado vigente de la Parte 107 (capacitación recurrente dentro de 24 meses); copia en archivo antes del primer vuelo.'), prov: faa('reality_capture-faa-part107-pilot', '14 CFR 107.12, 107.65.') },
    { id: 'airspace_auth', item: 'Airspace checked for each flight; LAANC or ATC authorization on file when the site is in Class B, C, D or airport surface Class E airspace; night or over-people operations meet their Part 107 conditions.', item_es: tr('Espacio aéreo revisado para cada vuelo; autorización LAANC o del control de tránsito aéreo en archivo cuando el sitio está en espacio Clase B, C, D o Clase E de superficie de aeropuerto; vuelos nocturnos o sobre personas cumplen sus condiciones de la Parte 107.'), prov: faa('reality_capture-faa-laanc', '14 CFR 107.41, 107.29, 107.39.') },
    { id: 'flight_log', item: 'Flight log delivered: date, pilot, aircraft registration, area flown, altitude, authorization number, and any incident.', item_es: tr('Bitácora de vuelo entregada: fecha, piloto, matrícula de la aeronave, área volada, altitud, número de autorización y cualquier incidente.'), prov: base('Industry-standard deliverable; registration per 14 CFR 107.13.') },
    { id: 'control_tie', item: 'Data tied to the project survey control (coordinate system, datum and units named), with control coordinates supplied by the project surveyor.', item_es: tr('Datos ligados al control topográfico del proyecto (sistema de coordenadas, datum y unidades indicados), con coordenadas de control proporcionadas por el topógrafo del proyecto.'), prov: base('Coordinate with the surveying pack — the surveyor owns the control.') },
    { id: 'registration_report', item: 'Registration report delivered for each point cloud: setups or flights joined, target and cloud-to-cloud fit errors, and pass/fail against the specified accuracy.', item_es: tr('Informe de registro entregado por cada nube de puntos: posiciones o vuelos unidos, errores de ajuste de dianas y entre nubes, y aprobado/rechazado contra la exactitud especificada.'), prov: loa('Report format is industry practice; cite the USIBD LOA level only.') },
    { id: 'stated_accuracy', item: 'Each deliverable states its accuracy (USIBD LOA level or a plain tolerance) and how it was checked against independent check points.', item_es: tr('Cada entregable indica su exactitud (nivel LOA de USIBD o una tolerancia clara) y cómo se verificó contra puntos de verificación independientes.'), prov: loa() },
    { id: 'dated_imagery', item: 'Orthomosaics and progress photo sets labeled with capture date and area, kept on a consistent interval and view so progress can be compared.', item_es: tr('Ortomosaicos y juegos de fotos de avance rotulados con fecha de captura y área, en un intervalo y vista constantes para poder comparar el avance.'), prov: base('Progress documentation practice.') },
    { id: 'model_lod', item: 'Scan-to-BIM model states the LOD for each element category and notes elements not modeled or hidden from the scanner.', item_es: tr('El modelo de escaneo a BIM indica el LOD por categoría de elemento y anota los elementos no modelados u ocultos al escáner.'), prov: lod('BIMForum LOD definitions — LOD states what a model element can be relied on for.') },
    { id: 'handover', item: 'Files handed over in the agreed formats (e.g. E57/LAS point cloud, GeoTIFF orthomosaic, native and IFC model) with a readme listing coordinate system, units, dates and accuracy.', item_es: tr('Archivos entregados en los formatos acordados (p. ej. nube de puntos E57/LAS, ortomosaico GeoTIFF, modelo nativo e IFC) con un archivo léeme del sistema de coordenadas, unidades, fechas y exactitud.'), prov: base('Common open formats; confirm in the scope.') },
  ],
  inspection_checklists: {
    preflight: [
      { item: 'Pilot certificate current and aircraft registration on the drone', item_es: tr('Certificado del piloto vigente y matrícula visible en el dron'), ref: '14 CFR 107.12, 107.13' },
      { item: 'Airspace checked; LAANC or ATC authorization obtained where required', item_es: tr('Espacio aéreo revisado; autorización LAANC o del control de tránsito aéreo obtenida cuando se requiere'), ref: '14 CFR 107.41' },
      { item: 'Weather, ground hazards and people on site assessed; crews briefed on flight area', item_es: tr('Clima, peligros en el suelo y personas en obra evaluados; cuadrillas informadas del área de vuelo'), ref: '14 CFR 107.49' },
      { item: 'Flight plan keeps the drone off people not taking part, or meets an over-people category', item_es: tr('El plan de vuelo mantiene el dron fuera de personas que no participan, o cumple una categoría de vuelo sobre personas'), ref: '14 CFR 107.39' },
    ],
    control_and_accuracy: [
      { item: 'Control targets set and coordinated by the project surveyor before capture', item_es: tr('Dianas de control colocadas y coordenadas por el topógrafo del proyecto antes de la captura') },
      { item: 'Independent check points held out of the registration', item_es: tr('Puntos de verificación independientes excluidos del registro') },
      { item: 'Registration and check-point errors within the specified accuracy', item_es: tr('Errores de registro y de puntos de verificación dentro de la exactitud especificada'), ref: 'USIBD LOA' },
    ],
    data_handover: [
      { item: 'Coordinate system, datum, units and capture dates listed in the readme', item_es: tr('Sistema de coordenadas, datum, unidades y fechas de captura indicados en el léeme') },
      { item: 'Model LOD stated per element category', item_es: tr('LOD del modelo indicado por categoría de elemento'), ref: 'BIMForum LOD' },
      { item: 'Flight logs and authorizations included', item_es: tr('Bitácoras de vuelo y autorizaciones incluidas') },
    ],
  },
  dependency_hints: [
    { after_trades: ['surveying'], note: 'Capture ties to the surveyor\'s project control — set control before scanning or mapping flights.' },
  ],
});
