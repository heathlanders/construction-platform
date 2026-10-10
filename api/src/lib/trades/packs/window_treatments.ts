// Trade Knowledge Pack — window_treatments (Window Treatments). Wave 10 — COMPLEMENT pattern: the hand
// recipe in task-buildout/nopermit.ts keeps producing the work step; this pack adds glossary, hazards,
// QA (incl. child cord-safety handoff), owner/GC hold points, equipment hints and the G-WT- assemblies.
// Scope: blinds (horizontal/vertical), roller/cellular shades, motorized shades (low-voltage or plug-in;
// line-voltage power by the electrician), drapery track. permit_trade null → NO gates, NO code_refs.
// Dossier: docs/trade-packs/dossiers/window_treatments.md. Sources: 16 CFR 1260, CPSC Window Covering
// Safety Education Center, ANSI/WCMA A100.1 (ref), UFGS 12 21 00 + 12 24 13, Hunter Douglas install
// instructions, 29 CFR 1926 Subparts C, E, I, K, L, X, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const blinds = (note?: string) => ({ src: ['window_treatments-ufgs-12-21-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const shades = (note?: string) => ({ src: ['window_treatments-ufgs-12-24-13'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ufgsBoth = (note?: string) => ({ src: ['window_treatments-ufgs-12-21-00', 'window_treatments-ufgs-12-24-13'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const hd = (note?: string) => ({ src: ['window_treatments-hd-duette-std'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const cfr1260 = (note?: string) => ({ src: ['window_treatments-ecfr-16cfr1260', 'window_treatments-wcma-a100'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const cpsc = (note?: string) => ({ src: ['window_treatments-cpsc-education', 'window_treatments-wcsc'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const oshaDerived = (sub: string, note: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'derived' as const, last_verified: D, note });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const RES = ['residential_sf', 'residential_mf'] as const;
const COM = ['commercial', 'industrial'] as const;

export default definePack({
  key: 'window_treatments',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Measures and installs interior window coverings after paint is done: horizontal and vertical blinds, roller and cellular shades, motorized shades and drapery track — mounted level and secure, with no accessible cords or with cord loops tensioned to the wall, and the owner shown how to keep cords away from children.',
    summary_es: 'Mide e instala cubiertas interiores de ventana una vez terminada la pintura: persianas horizontales y verticales, cortinas enrollables y celulares, cortinas motorizadas y rieles de cortina — montadas a nivel y firmes, sin cordones accesibles o con el lazo tensado al muro, y explicando al dueño cómo mantener los cordones lejos de los niños.',
    glossary: [
      { term: 'Inside mount', term_es: 'Montaje interior', def: 'Covering fits inside the window opening, brackets fastened to the top of the frame or head jamb.', def_es: 'La cubierta va dentro del vano de la ventana, con soportes fijados a la parte superior del marco.' },
      { term: 'Outside mount', term_es: 'Montaje exterior', def: 'Covering mounts on the wall or trim above the opening and overlaps each side.', def_es: 'La cubierta se monta en el muro o moldura sobre el vano y traslapa cada lado.' },
      { term: 'Headrail', term_es: 'Riel superior (cabezal)', def: 'Top housing of a blind or shade that holds the operating parts and clips into the brackets.', def_es: 'Caja superior de la persiana o cortina que contiene el mecanismo y se engancha en los soportes.' },
      { term: 'Cordless', term_es: 'Sin cordón', def: 'Raised and lowered by hand, a wand or a motor — no pull cord a child can reach.', def_es: 'Se sube y baja con la mano, una varilla o un motor; sin cordón que un niño pueda alcanzar.' },
      { term: 'Continuous cord loop', term_es: 'Lazo de cordón continuo', def: 'Endless cord or bead chain that turns the shade roller; it must be held taut by a tensioner fastened to the wall.', def_es: 'Cordón o cadena de cuentas sin fin que gira el rodillo; debe quedar tenso con un tensor fijado al muro.' },
      { term: 'Cord tensioner', term_es: 'Tensor de cordón', def: 'Device screwed to the wall or frame that keeps a cord loop tight so it cannot form a hanging loop.', def_es: 'Dispositivo atornillado al muro o marco que mantiene tenso el lazo para que no cuelgue suelto.' },
      { term: 'Tilt wand', term_es: 'Varilla de inclinación', def: 'Clear rod that turns the slats of a blind instead of a cord.', def_es: 'Varilla transparente que gira las tablillas de la persiana en lugar de un cordón.' },
      { term: 'Stackback', term_es: 'Apilado (recogido)', def: 'Space the drawn-open drapery or vertical blind takes up at the side of the window.', def_es: 'Espacio que ocupa la cortina o persiana vertical recogida al costado de la ventana.' },
      { term: 'Hold-down bracket', term_es: 'Soporte de sujeción inferior', def: 'Small bracket that keeps the bottom rail from swinging, used on doors and drafty windows.', def_es: 'Pequeño soporte que evita que el riel inferior se mueva, usado en puertas y ventanas con corriente de aire.' },
      { term: 'Shade pocket', term_es: 'Cajillo de cortina', def: 'Recess in the ceiling or soffit that hides the roller when the shade is raised.', def_es: 'Hueco en el plafón que oculta el rodillo cuando la cortina está recogida.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  equipment: [
    { when: { building_types: [...COM], title_re: 'shade|blind|window treatment|drape|curtain' }, type: 'scissor_lift', reason: 'Reach high storefront, clerestory or atrium windows and ceiling shade pockets safely', optional: true },
  ],
  hazards: [
    { id: 'stepladder', hazard: 'Fall from a stepladder while setting brackets and headrails at the window head', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap of a stepladder', 'Move the ladder to each bracket instead of leaning out to reach'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'ladder_footing', hazard: 'Ladder sliding or tipping on tile, hardwood, carpet over pad or a stair landing', hazard_es: PENDING_ES, controls: ['Set ladders only on stable, level floors or secure them', 'Use slip-resistant feet on finished floors and protect the floor with a non-slip mat'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(6)', severity: 3, prov: osha('x') },
    { id: 'aerial_lift', hazard: 'Fall or ejection from a scissor or boom lift while hanging shades at tall commercial windows', hazard_es: PENDING_ES, controls: ['Stand on the platform floor only — never climb the rails or use a ladder in the basket', 'Wear the restraint and lanyard the lift maker requires; do not exceed the platform load'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(iv)', severity: 4, ppe: ['harness and restraint lanyard where required'], prov: osha('l') },
    { id: 'hidden_utilities', hazard: 'Drilling into live wiring, alarm sensors or plumbing hidden in the head jamb or wall above a window', hazard_es: PENDING_ES, controls: ['Scan the mounting area before drilling; ask about security sensors and wiring routes', 'Keep screws short enough to stay within the frame or blocking'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: osha('k') },
    { id: 'motor_power', hazard: 'Electric shock connecting a line-voltage (120 V) shade motor or its power supply', hazard_es: PENDING_ES, controls: ['Leave 120 V connections to the electrician; work only on de-energized, locked-out circuits', 'Installer connects only Class 2 low-voltage leads and plug-in supplies per the maker'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k', 'UFGS 12 24 13 2.1.4: motors are 120 V or low voltage with a Class 2 supply; coordinate wiring with the building electrical system.') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust drilling anchor holes in concrete, block or stone window heads', hazard_es: PENDING_ES, controls: ['Use a drill with dust extraction or another Table 1 control for handheld drilling', 'Clean dust with a HEPA vacuum — never dry-sweep or blow it off'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['safety glasses', 'respirator when Table 1 requires'], prov: osha('z') },
    { id: 'falling_headrail', hazard: 'Heavy shade, drapery rod or headrail pulling out of drywall-only fasteners and falling on a worker or occupant', hazard_es: PENDING_ES, controls: ['Fasten brackets into the frame, header or blocking; use the maker’s anchors where only drywall is available', 'Install every bracket the maker lists for the width, and snap the headrail fully into each one'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: oshaDerived('c', 'No 1926 section covers covering anchorage; derived from the training duty plus Hunter Douglas bracket-count and drywall-anchor instructions.') },
    { id: 'drill_tool', hazard: 'Shock or wrist injury from drills and drivers with damaged cords or binding bits', hazard_es: PENDING_ES, controls: ['Use double-insulated or grounded tools in good condition', 'Brace the drill with both hands for masonry bits'], controls_es: PENDING_ES, osha_ref: '1926.302(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'cord_shock', hazard: 'Electric shock from extension cords and chargers on an active jobsite', hazard_es: PENDING_ES, controls: ['Plug into GFCI-protected receptacles', 'Inspect cords daily and pull damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_debris', hazard: 'Eye injury from drywall, wood and masonry dust when drilling overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever drilling or cutting headrails and slats'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'housekeeping', hazard: 'Trips and cuts from cartons, cut slats, cord offcuts and packaging left in finished rooms', hazard_es: PENDING_ES, controls: ['Break down packaging and pick up offcuts as you go', 'Keep walkways and doorways clear'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 1, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'field_measure', item: 'Every opening measured in the field before ordering (width at top, middle and bottom; height; inside-mount depth) and differences from the drawings reported.', item_es: tr('Cada vano medido en sitio antes de ordenar (ancho arriba, en medio y abajo; alto; profundidad para montaje interior) y las diferencias con los planos reportadas.'), prov: ufgsBoth('3.1 verify all dimensions in the field and report discrepancies.') },
    { id: 'after_finishes', item: 'Installation started only after painting and finishing in the room are complete.', item_es: tr('Instalación iniciada solo después de terminar la pintura y los acabados del cuarto.'), prov: ufgsBoth('3.3 do not start until painting and finishing are complete.') },
    { id: 'placement_schedule', item: 'Type, color, mount, control side and stack/draw direction match the placement schedule or owner selection for each window.', item_es: tr('Tipo, color, montaje, lado del control y dirección de recogido coinciden con la tabla de colocación o la selección del dueño en cada ventana.'), prov: ufgsBoth('3.2 window treatment placement schedule.') },
    { id: 'brackets_secure', item: 'Bracket count per the maker for the width, end brackets near each jamb and the rest spaced evenly; screws into frame or blocking, maker’s anchors where only drywall exists.', item_es: PENDING_ES, safety: true, prov: hd('End brackets ~3 in. in from each jamb, others evenly spaced; wall anchors when fastening into drywall only; more brackets as width grows.') },
    { id: 'level_plumb', item: 'Headrails level and units plumb, secure and at the right height relative to the window; brackets shimmed where the head is out of level.', item_es: tr('Rieles superiores a nivel y unidades a plomo, firmes y a la altura correcta respecto a la ventana; soportes calzados donde la cabeza no está a nivel.'), prov: ufgsBoth('3.3 install level, plumb, secure, at proper height.') },
    { id: 'no_accessible_cords', item: 'Products are cordless, motorized or have cords that are inaccessible or short and static; custom units made after May 30, 2023 meet 16 CFR 1260 — no long pull cords or loose loops installed.', item_es: PENDING_ES, safety: true, prov: cfr1260('1260.1(a) effective date; 1260.2(a) custom coverings must have inaccessible or short static operating cords; stock products follow ANSI/WCMA A100.1 (ref).') },
    { id: 'loop_tensioned', item: 'Every continuous cord loop or bead chain held taut by its tensioner or restraining device, fastened to the wall or frame as the maker directs; loop not able to hang free.', item_es: PENDING_ES, safety: true, prov: { src: ['window_treatments-hd-duette-easyrise', 'window_treatments-ecfr-16cfr1260'], confidence: 'verified', last_verified: D, note: 'Tensioner is a safety device and must be secured to the wall or frame; 1260.2(d) restraining device for loop cords and bead chains.' } },
    { id: 'warnings_left', item: 'Maker’s cord-safety warning labels and tags left attached; operating and care instructions handed to the owner.', item_es: PENDING_ES, safety: true, prov: hd('Child-safety warning section of the installation booklet.') },
    { id: 'owner_cord_briefing', item: 'Owner told at handoff: cordless is safest with young children; keep cribs, beds and furniture away from windows and coverings; keep any cords short and out of reach.', item_es: PENDING_ES, safety: true, prov: cpsc('CPSC consumer guidance; 16 CFR 1260.4(b) — children 8 and under at risk from cords longer than 8 in.') },
    { id: 'controls_reach', item: 'Tilt wands and controls hang straight and reach within about 5 ft of the floor; blinds tilt and raise fully without binding.', item_es: tr('Varillas y controles cuelgan rectos y llegan a unos 5 pies del piso; las persianas giran y suben completas sin trabarse.'), prov: blinds('2.1.1.2 wand reaches within 5 ft of the floor; tilts and holds at any angle.') },
    { id: 'jamb_overlap', item: 'Outside-mount units overlap each jamb and mullion at least 3/4 in. where trim allows; pocket units fit fully in the pocket when raised and come out without damaging it.', item_es: tr('Las unidades de montaje exterior traslapan cada jamba y parteluz al menos 3/4 pulg donde la moldura lo permite; las de cajillo quedan completas dentro al subir y se retiran sin dañarlo.'), prov: ufgsBoth('3.4 overlap 0.75 in.; pocket units removable and fully contained.') },
    { id: 'clearance_hold_down', item: 'Inside-mount clearance at each jamb so slats do not rub; hold-down brackets on doors and where air sways the covering; door handles and window cranks still operate.', item_es: tr('Holgura en cada jamba en montaje interior para que las tablillas no rocen; soportes inferiores en puertas y donde el aire mueve la cubierta; manijas y manivelas siguen funcionando.'), prov: blinds('2.1.1 note — about 1/4 in. jamb clearance inside mount; 2.1.1.6 hold-downs where air movement sways the blind.') },
    { id: 'motor_commissioning', item: 'Motorized shades: upper and lower limits set, groups and keypads/remotes programmed per the schedule, no light gaps on blackout units, quiet operation; line-voltage power provided by the electrician.', item_es: tr('Cortinas motorizadas: límites superior e inferior ajustados, grupos y teclados/controles programados según la tabla, sin fugas de luz en unidades opacas, operación silenciosa; alimentación de línea a cargo del electricista.'), prov: shades('2.1.4 prewired motor + controls, set open/close limits, 120 V or Class 2 low voltage, coordinate wiring; blackout units without visible light gaps.') },
    { id: 'fabric_fire_rating', item: 'Commercial fabric and drapery submittals show the fire-propagation test the project specifies (NFPA 701 where required).', item_es: tr('Las fichas de tela y cortinas comerciales muestran la prueba de propagación de fuego que exige el proyecto (NFPA 701 donde se requiera).'), prov: ufgsBoth('1.1 / 1.4.2 fabrics conforming to NFPA 701 (reference only).') },
    { id: 'clean_adjust', item: 'Units cleaned and inspected for soiling or damage, adjusted to operate properly; metal parts isolated from concrete, mortar and dissimilar metals; damaged units replaced.', item_es: tr('Unidades limpias e inspeccionadas por manchas o daños, ajustadas para operar bien; piezas metálicas aisladas del concreto, mortero y metales distintos; unidades dañadas reemplazadas.'), prov: ufgsBoth('3.4 clean-up, adjust, isolate metal, repair or replace damaged units.') },
  ],
  inspection_checklists: {
    pre_install_verify: [
      { item: 'Field measurements taken and order confirmed against the placement schedule or owner selections', item_es: tr('Medidas de campo tomadas y pedido confirmado contra la tabla de colocación o la selección del dueño') },
      { item: 'Painting and finishing complete in each room', item_es: tr('Pintura y acabados terminados en cada cuarto') },
      { item: 'Blocking or solid frame available at each bracket location; pockets and recesses built to size', item_es: tr('Bloqueo o marco sólido en cada punto de soporte; cajillos y huecos construidos a la medida') },
      { item: 'Motorized: power, low-voltage cabling and keypad boxes in place and tested by the electrician', item_es: tr('Motorizadas: alimentación, cableado de bajo voltaje y cajas de teclado colocados y probados por el electricista') },
    ],
    child_cord_safety: [
      { item: 'No long pull cords or loose loops on any installed covering; custom units comply with 16 CFR 1260', item_es: PENDING_ES, ref: '16 CFR 1260.2' },
      { item: 'Every cord loop and bead chain tensioned to the wall or frame', item_es: PENDING_ES },
      { item: 'Warning labels attached; owner briefed on keeping cribs and furniture away from windows', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Each unit level, secure and operates through its full travel', item_es: tr('Cada unidad a nivel, firme y opera en todo su recorrido') },
      { item: 'Motorized limits, groups and controls demonstrated to the owner', item_es: tr('Límites, grupos y controles motorizados demostrados al dueño') },
      { item: 'Units clean, packaging and offcuts removed; spare parts and care instructions handed over', item_es: tr('Unidades limpias, empaques y recortes retirados; refacciones e instrucciones de cuidado entregadas') },
    ],
  },
  assemblies: [
    { code: 'G-WT-BLIND-EA', name: 'Cordless horizontal blind, 2 in. faux wood, up to ~36×60 in., installed, each', name_es: 'Persiana horizontal sin cordón de imitación madera de 2 pulg, hasta ~36×60 pulg, instalada, c/u', unit: 'EA', csi: '12 21 13',
      material_cost_cents: { v: 7500, prov: est('cordless faux-wood blind, typical residential size, national baseline 2026') }, labor_hours_per_unit: { v: 0.5, prov: est('measure check, two-three brackets, hang, valance, wand, adjust') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('made-to-measure counted units') } },
    { code: 'G-WT-ROLLER-EA', name: 'Manual roller shade (cordless or tensioned bead chain), up to ~48×72 in., installed, each', name_es: 'Cortina enrollable manual (sin cordón o cadena con tensor), hasta ~48×72 pulg, instalada, c/u', unit: 'EA', csi: '12 24 13',
      material_cost_cents: { v: 20000, prov: est('light-filtering or solar roller shade, mid-grade, national baseline 2026') }, labor_hours_per_unit: { v: 0.6, prov: est('brackets, set roller, tensioner, adjust stop/limits') },
      equipment_cost_cents: { v: 0, prov: est('tools only; lifts covered by equipment rules') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-WT-MOTOR-EA', name: 'Motorized roller shade, low-voltage or battery motor, remote/keypad, up to ~60×84 in., installed + programmed, each', name_es: 'Cortina enrollable motorizada (bajo voltaje o batería), control o teclado, hasta ~60×84 pulg, instalada y programada', unit: 'EA', csi: '12 24 13',
      material_cost_cents: { v: 75000, prov: est('mid-range motorized roller incl. motor + control share; line-voltage power and cabling by electrician not included') }, labor_hours_per_unit: { v: 1.5, prov: est('brackets, set shade, connect low-voltage lead, set limits, program groups') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-WT-DRAPE-TRACK-LF', name: 'Drapery track or traverse rod, wall or ceiling mounted, with carriers, per LF', name_es: 'Riel de cortina o barra de traslado, en muro o plafón, con carros, por pie lineal', unit: 'LF', csi: '12 22 00',
      material_cost_cents: { v: 1800, prov: est('commercial ripplefold/traverse track + carriers + brackets share, national baseline 2026') }, labor_hours_per_unit: { v: 0.2, prov: est('layout, fasten to blocking, set carriers, hang and dress fabric excluded') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('cut-to-length track') } },
  ],
  quantity_rules: [
    { code: 'G-WT-BLIND-EA', assumption: 'One cordless blind per scheduled window (residential) — change to shades or delete where the owner supplies coverings', when: { building_types: [...RES] }, qty: { basis: 'windows' } },
    { code: 'G-WT-ROLLER-EA', assumption: 'One manual roller shade per scheduled window (commercial) — switch motorized/blackout units to G-WT-MOTOR-EA per the placement schedule', when: { building_types: [...COM] }, qty: { basis: 'windows' } },
  ],
  dependency_hints: [
    { after_trades: ['painting', 'windows'], note: 'Coverings go in after windows are set and room painting and finishing are complete (UFGS 12 21 00 / 12 24 13 §3.3).' },
    { before_phase: 'punch', note: 'Install, adjust and brief the owner on cord safety before punch and final clean.' },
  ],
});
