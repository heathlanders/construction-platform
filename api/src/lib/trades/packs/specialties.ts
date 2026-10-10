// Trade Knowledge Pack — specialties (Div 10 Specialties). Wave 16 — NEW-TRADE pattern (no hand recipe,
// no template tasks of its own; 'Restroom accessories, partitions & casework' belongs to toilet_partitions).
// Scope: toilet/bath accessories (grab bars, dispensers, mirrors, hooks), corner guards / wall protection,
// FRP wall panels, lockers, markerboards/tackboards, mailboxes (curbside + cluster box units), flagpoles.
// Fire extinguisher cabinets live in fire_protection_special (B-FPS-EXT-CAB-EA) — not duplicated here.
// permit_trade null → NO gates, NO code_refs; ADA / blocking hold points live in inspection_checklists.
// Dossier: docs/trade-packs/dossiers/specialties.md. Sources: 2010 ADA Standards (Access Board / DOJ),
// UFGS 10 28 13 / 10 26 00 / 10 51 13 / 10 11 00, USPS mailbox guidance, Salsbury CBU instructions,
// 29 CFR 1926 Subparts C, D, E, I, K, P, X, Z.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ada = (note?: string) => v(['millwork-access-board-ada', 'plumbing-ada-2010'], note);
const acc = (note?: string) => v(['specialties-ufgs-10-28-13'], note);
const wall = (note?: string) => v(['specialties-ufgs-10-26-00'], note);
const lock = (note?: string) => v(['specialties-ufgs-10-51-13'], note);
const board = (note?: string) => v(['specialties-ufgs-10-11-00'], note);
const usps = (note?: string) => v(['specialties-usps-mailboxes'], note);
const cbu = (note?: string) => v(['specialties-salsbury-cbu'], note);
const osha = (sub: string, note?: string) => v([`ecfr-1926-${sub}`], note);
const oshaDerived = (sub: string, note: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'derived' as const, last_verified: D, note });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const COM = ['commercial', 'industrial'] as const;

export default definePack({
  key: 'specialties',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs Division 10 specialties: restroom accessories (grab bars, dispensers, mirrors, hooks) at ADA heights on solid blocking, corner guards and FRP wall protection, lockers, markerboards and tackboards, mailboxes and cluster box units, and flagpoles — checking blocking before drywall and grab-bar strength before turnover.',
    summary_es: 'Instala especialidades de la División 10: accesorios de baño (barras de apoyo, dispensadores, espejos) a alturas ADA sobre bloqueo, esquineros y paneles FRP, lockers, pizarrones, buzones y unidades agrupadas, y astas — revisando el bloqueo antes del tablaroca y la resistencia de las barras antes de entregar.',
    glossary: [
      { term: 'Grab bar', term_es: 'Barra de apoyo', def: 'Horizontal bar next to and behind a toilet or in a shower that a person can pull on or lean on.', def_es: 'Barra horizontal junto y detrás del inodoro o en la regadera para jalarse o apoyarse.' },
      { term: 'Blocking (backing)', term_es: 'Bloqueo (refuerzo)', def: 'Wood or metal strap set between studs before drywall so accessories, grab bars and boards have something solid to screw into.', def_es: 'Madera o lámina colocada entre montantes antes del tablaroca para que accesorios, barras y pizarrones se atornillen a algo sólido.' },
      { term: 'Concealed backplate', term_es: 'Placa de montaje oculta', def: 'Plate fastened to the wall first; the accessory then hooks or locks onto it so no screws show.', def_es: 'Placa que se fija primero al muro; el accesorio se engancha sobre ella sin tornillos visibles.' },
      { term: 'AFF (above finish floor)', term_es: 'SPT (sobre piso terminado)', def: 'Heights are measured from the finished floor surface, not the slab.', def_es: 'Las alturas se miden desde el piso terminado, no desde la losa.' },
      { term: 'Corner guard', term_es: 'Esquinero', def: 'Stainless or vinyl angle covering an outside wall corner so carts and gurneys do not break it.', def_es: 'Ángulo de acero inoxidable o vinilo que cubre una esquina exterior del muro para que carros y camillas no la dañen.' },
      { term: 'FRP panel', term_es: 'Panel FRP', def: 'Fiberglass-reinforced plastic sheet glued to walls in kitchens, janitor rooms and restrooms for an easy-clean surface.', def_es: 'Lámina de plástico reforzado con fibra de vidrio pegada al muro en cocinas, cuartos de aseo y baños para una superficie fácil de limpiar.' },
      { term: 'Protruding object', term_es: 'Objeto saliente', def: 'Anything on a wall between about 27 and 80 in. high that sticks out into a walkway where a cane cannot detect it.', def_es: 'Cualquier cosa en el muro entre unas 27 y 80 pulg de alto que sobresale al pasillo donde un bastón no la detecta.' },
      { term: 'Cluster box unit (CBU)', term_es: 'Unidad de buzones agrupados (CBU)', def: 'Pedestal-mounted bank of locked mail compartments and parcel lockers for a subdivision or apartment site.', def_es: 'Conjunto de buzones con llave y casilleros de paquetes sobre pedestal para un fraccionamiento o complejo de departamentos.' },
      { term: 'Reach range', term_es: 'Rango de alcance', def: 'The height band (15 to 48 in. AFF) a person in a wheelchair can reach for controls and dispensers.', def_es: 'Franja de altura (15 a 48 pulg SPT) que una persona en silla de ruedas alcanza para controles y dispensadores.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'restroom_accessories',
      example_title: 'Install toilet accessories and grab bars',
      when: { title_re: 'accessor|grab bar|\\bmirrors?\\b' },
      steps: [
        {
          title: 'Confirm blocking before drywall',
          instruction: 'With framing open, walk every restroom against the accessory schedule and check that solid blocking or backing plate is in each grab bar, mirror, dispenser and partition-bracket location, at the right height. Mark missing backing for the framer before the walls are closed — it cannot be added later without opening the wall.',
          tools: ['tape measure', 'laser level', 'marker'],
          materials: ['accessory schedule and mounting-height elevations'],
          safety_ids: ['ladder_top_step', 'housekeeping'],
          qa_ids: ['blocking_verified'],
        },
        {
          title: 'Lay out accessories at ADA heights',
          instruction: 'After tile and paint, snap layout lines from the finished floor. Grab bars 33–36 in. to the top of the bar; side bar 42 in. long, no more than 12 in. from the rear wall, running to at least 54 in.; rear bar 36 in. long. Mirror bottom 40 in. max over a lavatory; toilet paper outlet 15–48 in. high and 7–9 in. in front of the bowl, never behind a grab bar. Keep controls 15–48 in. high.',
          detail: 'Items mounted in a corridor between 27 and 80 in. high may project no more than 4 in. into the walkway — use recessed or semi-recessed units there.',
          tools: ['tape measure', 'level', 'laser level', 'pencil'],
          materials: ['mounting-height elevations', 'manufacturer templates'],
          safety_ids: ['ladder_top_step'],
          qa_ids: ['ada_heights', 'grab_bar_layout', 'dispenser_reach', 'protrusion_limit'],
        },
        {
          title: 'Install accessories on blocking or backplates',
          instruction: 'Drill and fasten each unit into the blocking or studs — never into drywall alone. Surface units go on concealed backplates; recessed units screw to studs or blocking. Use corrosion-resistant fasteners with exposed heads matching the finish. Bed shower bracket plates in silicone so they seal watertight. Leave the strippable film on until the owner accepts.',
          tools: ['drill/driver', 'hammer drill with dust extraction', 'level', 'stud finder/scanner'],
          materials: ['accessories per schedule', 'concealed backplates', 'corrosion-resistant fasteners', 'silicone sealant'],
          safety_ids: ['hidden_utilities', 'drill_tool', 'silica_drilling', 'eye_debris', 'cord_shock'],
          qa_ids: ['fastened_to_backing'],
        },
        {
          title: 'Load-check every grab bar',
          instruction: 'Confirm the bar is 1-1/2 in. off the wall with 12 in. of clear space above it, then pull and push hard along the length and at each flange. Any movement, flex at a flange or cracked tile means the anchorage cannot hold the 250 lb the ADA requires — remove and re-anchor into blocking before anyone uses it.',
          tools: ['tape measure', 'level'],
          materials: [],
          safety_ids: ['falling_items'],
          qa_ids: ['grab_bar_strength', 'grab_bar_spacing'],
        },
        {
          title: 'Clean, adjust and hand over',
          instruction: 'Remove protective film after acceptance. Clean with the maker’s cleaner only — no alkaline or abrasive products on stainless. Check dispensers open, lock and dispense, and hand keys and spare parts to the owner.',
          tools: ['soft cloths'],
          materials: ['manufacturer-approved cleaner', 'dispenser keys'],
          safety_ids: ['housekeeping'],
        },
      ],
    },
    {
      id: 'wall_protection_lockers_boards',
      example_title: 'Install corner guards, FRP and lockers',
      when: { title_re: 'corner guard|wall protection|\\bFRP\\b|locker|markerboard|tackboard|whiteboard|specialt' },
      steps: [
        {
          title: 'Verify backing and finished surfaces',
          instruction: 'Check the locker bases, board locations and wall-guard lines have blocking or reinforcing behind the drywall, and that walls are clean, smooth and painted. Boards and lockers go in only after room painting is finished.',
          tools: ['tape measure', 'stud finder/scanner', 'level'],
          materials: ['specialties placement schedule'],
          safety_ids: ['housekeeping'],
          qa_ids: ['blocking_verified'],
        },
        {
          title: 'Install corner guards, wall guards and FRP',
          instruction: 'Set corner guards plumb on outside corners, full height or to the scheduled height. On gypsum board use the contact adhesive made for drywall and leave it undisturbed 24 hours; on block, anchor with the maker’s fasteners. Space wall-guard brackets 3 ft on center max. Roll FRP panels into a full adhesive bed with the maker’s trowel, leave expansion gaps at joints and corners, and fasten with the maker’s rivets where required.',
          tools: ['level', 'notched trowel', 'J-roller', 'drill/driver', 'shears or fine-tooth saw'],
          materials: ['corner guards', 'wall-guard rails and brackets', 'FRP panels', 'FRP moldings', 'panel adhesive', 'drywall contact adhesive'],
          safety_ids: ['adhesive_vapor', 'sharp_edges', 'drill_tool', 'eye_debris'],
          qa_ids: ['corner_guard_plumb', 'frp_bonded'],
        },
        {
          title: 'Set, anchor and bolt lockers together',
          instruction: 'Assemble per the maker. Set on the base level, align horizontally and vertically, bolt adjacent units together and screw them to the wall blocking (and base) so a full bank cannot tip. Adjust each door to close and latch without binding, then install number plates in sequence. Keep at least one accessible locker of each type with shelves and hooks 15–48 in. high.',
          tools: ['level', 'drill/driver', 'socket set'],
          materials: ['lockers', 'locker base', 'connecting bolts', 'wall anchors into blocking', 'number plates'],
          safety_ids: ['heavy_tipping', 'ladder_top_step'],
          qa_ids: ['lockers_anchored', 'accessible_locker'],
        },
        {
          title: 'Hang markerboards and tackboards',
          instruction: 'Mount at the scheduled height (floor to top of frame) on reinforced partitions with concealed fasteners, level and plumb. Fit chalk trays and map rails, then clean the writing surface with the maker’s cleaner.',
          tools: ['level', 'laser level', 'drill/driver'],
          materials: ['markerboards / tackboards', 'mounting clips', 'concealed fasteners'],
          safety_ids: ['ladder_top_step'],
          qa_ids: ['blocking_verified'],
        },
      ],
    },
    {
      id: 'site_specialties',
      example_title: 'Install cluster mailbox units and flagpole',
      when: { title_re: 'mailbox|flagpole|\\bCBU\\b' },
      steps: [
        {
          title: 'Get the location approved and locate utilities',
          instruction: 'Confirm the mailbox or cluster box location with the local postmaster before pouring anything, and confirm the flagpole location and foundation detail on the drawings. Call 811 and mark underground utilities before digging a pad or footing.',
          tools: ['tape measure', 'marking paint'],
          materials: ['site plan', 'postmaster approval record'],
          safety_ids: ['buried_utilities'],
          qa_ids: ['postmaster_approval'],
        },
        {
          title: 'Prepare the pad or footing',
          instruction: 'Form and pour the cluster-box pad to the size and thickness the maker lists, with air-entrained concrete, level and with a firm accessible approach. For a curbside box, set the post no deeper than 24 in. and avoid heavy rigid supports. Build flagpole footings and sleeves to the engineered detail.',
          tools: ['shovel', 'forms', 'level', 'concrete tools'],
          materials: ['concrete', 'gravel base', 'forms', 'flagpole sleeve per detail'],
          safety_ids: ['buried_utilities', 'heavy_tipping'],
          qa_ids: ['curbside_height'],
        },
        {
          title: 'Anchor and level the unit',
          instruction: 'Place the template, drill the anchor holes, set the expansion anchors and bolt the pedestal down; check level. Lift the cluster box onto the pedestal with two people and bolt it from inside. Plumb and wedge or grout the flagpole in its sleeve per the maker.',
          tools: ['hammer drill with dust extraction', 'wrenches', 'level'],
          materials: ['1/2 in. concrete expansion anchors', 'pedestal and gasket', 'mounting bolts'],
          safety_ids: ['heavy_tipping', 'silica_drilling', 'drill_tool'],
          qa_ids: ['cbu_anchored_level'],
        },
        {
          title: 'Turn over locks and keys',
          instruction: 'Leave the master-lock opening for the postmaster to install the carrier lock. Hand compartment keys, the key log and maker instructions to the owner or property manager.',
          tools: [],
          materials: ['compartment keys', 'key log'],
          safety_ids: ['housekeeping'],
        },
      ],
    },
  ],
  hazards: [
    { id: 'ladder_top_step', hazard: 'Fall from a stepladder while mounting mirrors, boards, high corner guards or locker tops', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap of a stepladder', 'Move the ladder instead of leaning out'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'hidden_utilities', hazard: 'Drilling into live wiring, plumbing supply or flush-valve lines behind restroom walls', hazard_es: PENDING_ES, controls: ['Scan the wall and check the plumbing and electrical drawings before drilling', 'Keep screws to the blocking depth'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: osha('k') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust drilling anchors in block, tile, stone or concrete pads', hazard_es: PENDING_ES, controls: ['Use a drill with dust extraction or another Table 1 control', 'Clean up with a HEPA vacuum — never dry sweep'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['safety glasses', 'respirator when Table 1 requires'], prov: osha('z') },
    { id: 'drill_tool', hazard: 'Shock or wrist injury from drills with damaged cords or binding masonry bits', hazard_es: PENDING_ES, controls: ['Use double-insulated or grounded tools in good condition', 'Brace hammer drills with both hands'], controls_es: PENDING_ES, osha_ref: '1926.302(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'cord_shock', hazard: 'Electric shock from extension cords in wet restrooms and showers', hazard_es: PENDING_ES, controls: ['Plug into GFCI-protected receptacles', 'Keep cords out of standing water; pull damaged cords'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_debris', hazard: 'Eye injury from tile, drywall or metal chips when drilling or trimming panels', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever drilling, cutting or riveting'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'adhesive_vapor', hazard: 'Solvent contact-adhesive and panel-adhesive vapors in small closed rooms', hazard_es: PENDING_ES, controls: ['Read the SDS and follow its ventilation and glove requirements', 'Ventilate the room; no ignition sources near solvent adhesive'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['chemical-resistant gloves'], prov: osha('d', '1926.59 hazard communication incorporates 1910.1200 SDS/labeling duties.') },
    { id: 'sharp_edges', hazard: 'Cuts from stainless corner guards, sheet-metal locker parts and cut FRP edges', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves handling and trimming metal and FRP', 'Deburr cut edges'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'heavy_tipping', hazard: 'Struck or crushed by a locker bank, large mirror or cluster box unit tipping during setting', hazard_es: PENDING_ES, controls: ['Two-person lift for lockers, large mirrors and CBUs', 'Bolt lockers together and to the wall before loading or leaving them'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: oshaDerived('c', 'No 1926 section covers locker/CBU tip-over; derived from the training duty plus UFGS 10 51 13 3.1 and Salsbury two-person lift instruction.') },
    { id: 'falling_items', hazard: 'Grab bar or accessory pulling out of the wall under load and injuring a user or worker', hazard_es: PENDING_ES, controls: ['Anchor only into blocking or backplates', 'Load-check every grab bar before turnover'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: oshaDerived('c', 'Derived: occupant hazard controlled by ADA 609.8 anchorage strength; training duty covers the installer.') },
    { id: 'buried_utilities', hazard: 'Striking a buried gas, electric or water line digging a mailbox pad or flagpole footing', hazard_es: PENDING_ES, controls: ['Call 811 and locate utilities before digging', 'Hand dig near marked lines'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'housekeeping', hazard: 'Trips and cuts from cartons, offcuts and packaging left in finished rooms', hazard_es: PENDING_ES, controls: ['Break down packaging and pick up offcuts as you go'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 1, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'blocking_verified', phase: 'framing', item: 'Blocking or backing plate in place at every grab bar, mirror, dispenser, board and locker location before drywall, at the scheduled height.', item_es: tr('Bloqueo o placa de refuerzo colocado en cada barra de apoyo, espejo, dispensador, pizarrón y locker antes del tablaroca, a la altura indicada.'), prov: acc('3.1.1/3.1.2 fasten to studs, blocking or backplates; UFGS 10 11 00 3.2 reinforcing at partitions.') },
    { id: 'ada_heights', item: 'Accessories at the heights on the elevations measured from the finished floor; mirror bottom 40 in. max over a lavatory (35 in. max elsewhere); shelves 40–48 in.', item_es: tr('Accesorios a las alturas de las elevaciones medidas desde el piso terminado; parte baja del espejo a 40 pulg máx sobre lavabo (35 pulg máx en otro lugar); repisas de 40 a 48 pulg.'), prov: ada('603.3 mirrors; 603.4 coat hooks within reach ranges, shelves 40–48 in.') },
    { id: 'grab_bar_layout', item: 'Grab bars horizontal, top of bar 33–36 in.; side bar 42 in. long min, ≤12 in. from rear wall, extending to 54 in. min; rear bar 36 in. long min, 12 in. one side / 24 in. other side of the toilet centerline.', item_es: PENDING_ES, safety: true, prov: ada('609.4; 604.5.1; 604.5.2.') },
    { id: 'grab_bar_spacing', item: 'Grab bar 1-1/2 in. from the wall, 1-1/2 in. clear below and at ends, 12 in. clear above; diameter 1-1/4 to 2 in.', item_es: PENDING_ES, safety: true, prov: ada('609.3 spacing; 609.2.1 circular cross section.') },
    { id: 'grab_bar_strength', item: 'Every grab bar, flange and anchor rigid under a hard pull and push at any point — designed to resist 250 lb; loose bars re-anchored into blocking.', item_es: PENDING_ES, safety: true, prov: ada('609.8 structural strength 250 lb at any point on bar, fastener, mount or support.') },
    { id: 'dispenser_reach', item: 'Toilet paper outlet 15–48 in. high, 7–9 in. in front of the bowl, not behind a grab bar; dispenser and dryer controls 15–48 in. and operable with one hand, 5 lb max.', item_es: tr('Salida del papel higiénico de 15 a 48 pulg de alto, de 7 a 9 pulg frente al inodoro, no detrás de una barra; controles de dispensadores y secadores de 15 a 48 pulg y operables con una mano, 5 lb máx.'), prov: ada('604.7; 308.2.1/308.3.1; 309.4.') },
    { id: 'protrusion_limit', item: 'Wall-mounted items in a circulation path with a leading edge 27–80 in. high project no more than 4 in.', item_es: PENDING_ES, safety: true, prov: ada('307.2 protrusion limits.') },
    { id: 'fastened_to_backing', item: 'Units fastened into blocking, studs or backplates — none into drywall alone; exposed screw heads oval and matching the accessory finish; shower plates sealed.', item_es: tr('Unidades fijadas a bloqueo, montantes o placas — ninguna solo al tablaroca; cabezas de tornillo visibles ovaladas y del mismo acabado; placas en regadera selladas.'), prov: acc('3.1, 3.1.1, 3.1.2.') },
    { id: 'corner_guard_plumb', item: 'Corner guards plumb and tight to the corner; on drywall bonded with gypsum-rated contact adhesive and left 24 h; wall-guard brackets 3 ft o.c. max.', item_es: tr('Esquineros a plomo y ajustados a la esquina; en tablaroca pegados con adhesivo de contacto para yeso y dejados 24 h; soportes de guardamuros a 3 pies máx entre centros.'), prov: wall('3.1.1 a/b/d/e.') },
    { id: 'frp_bonded', item: 'FRP panels fully bonded with no hollow spots or bubbles, joints and corners in the maker’s trim with expansion gaps, edges sealed in wet areas.', item_es: tr('Paneles FRP totalmente adheridos sin huecos ni burbujas, juntas y esquinas en molduras del fabricante con holgura de expansión, bordes sellados en áreas húmedas.'), prov: wall('3.1.3 wall panels per manufacturer’s written instructions.') },
    { id: 'lockers_anchored', item: 'Lockers level and aligned, adjacent units bolted together and fastened to wall blocking and base; doors close tight without binding; numbers in sequence.', item_es: PENDING_ES, safety: true, prov: lock('3.1, 3.2.') },
    { id: 'accessible_locker', item: 'At least 5% (no fewer than one of each type) of lockers accessible, with shelf, hook and latch 15–48 in. high and one-hand operation.', item_es: tr('Al menos 5% (no menos de uno de cada tipo) de los lockers accesibles, con repisa, gancho y pestillo de 15 a 48 pulg de alto y operación con una mano.'), prov: ada('225.2.1; 811.3; 811.4.') },
    { id: 'postmaster_approval', item: 'Mailbox or cluster box location approved by the local postmaster before the pad is poured.', item_es: tr('Ubicación del buzón o unidad de buzones aprobada por el jefe de correos local antes de colar la base.'), prov: usps('Postmaster approval for non-standard and wall boxes; CBU site approval practice per Salsbury.') },
    { id: 'curbside_height', item: 'Curbside mailbox 41–45 in. from the road surface to the box bottom, face 6–8 in. back from the curb, post buried no deeper than 24 in.', item_es: tr('Buzón de acera a 41–45 pulg de la superficie del camino a la base del buzón, 6–8 pulg detrás de la guarnición, poste enterrado no más de 24 pulg.'), prov: usps() },
    { id: 'cbu_anchored_level', item: 'Pedestal anchored with all four 1/2 in. expansion anchors through the template, unit bolted on and level.', item_es: tr('Pedestal anclado con las cuatro anclas de expansión de 1/2 pulg a través de la plantilla, unidad atornillada y a nivel.'), prov: cbu() },
  ],
  inspection_checklists: {
    blocking_before_drywall: [
      { item: 'Blocking at every grab bar location, both walls of each accessible toilet and shower, at grab-bar height', item_es: PENDING_ES, ref: '2010 ADA 609.8' },
      { item: 'Backing at mirrors, dispensers, partition brackets, boards, wall guards and locker banks', item_es: tr('Refuerzo en espejos, dispensadores, soportes de mamparas, pizarrones, guardamuros y bancos de lockers') },
      { item: 'Recessed accessory openings framed to the maker’s rough-in size', item_es: tr('Huecos de accesorios empotrados enmarcados al tamaño indicado por el fabricante') },
    ],
    ada_mounting_heights: [
      { item: 'Grab bar heights, lengths and positions checked against the accessible toilet layout', item_es: PENDING_ES, ref: '2010 ADA 604.5 / 609.4' },
      { item: 'Grab bars load-checked; none move or flex', item_es: PENDING_ES, ref: '2010 ADA 609.8' },
      { item: 'Mirror, dispenser, hook and shelf heights within limits; toilet paper not behind a grab bar', item_es: tr('Alturas de espejo, dispensadores, ganchos y repisas dentro de límites; papel no detrás de una barra'), ref: '2010 ADA 603 / 604.7' },
      { item: 'No wall item in a walkway projecting more than 4 in. between 27 and 80 in. high', item_es: PENDING_ES, ref: '2010 ADA 307.2' },
    ],
    mailbox_site_approval: [
      { item: 'Postmaster approved the box or CBU location and type', item_es: tr('El jefe de correos aprobó la ubicación y el tipo de buzón o CBU') },
      { item: 'Utilities located before digging the pad or footing', item_es: PENDING_ES },
    ],
    final_walkthrough: [
      { item: 'Every scheduled specialty item installed, secure, level and operating', item_es: tr('Cada especialidad programada instalada, firme, a nivel y funcionando') },
      { item: 'Protective film removed, surfaces cleaned, damaged items replaced', item_es: tr('Película retirada, superficies limpias, piezas dañadas reemplazadas') },
      { item: 'Keys, spare parts and maker care instructions handed to the owner', item_es: tr('Llaves, refacciones e instrucciones de cuidado del fabricante entregadas al dueño') },
    ],
  },
  assemblies: [
    { code: 'G-SPC-TOIL-ACC-SET-EA', name: 'Restroom accessory set (TP, towel, soap, mirror, hook), commercial stainless, installed, per restroom', name_es: 'Juego de accesorios de baño (papel, toallas, jabón, espejo, gancho), inoxidable comercial, por baño', unit: 'EA', csi: '10 28 13',
      material_cost_cents: { v: 120000, prov: est('mid-grade commercial stainless set for one single-user or small multi-user restroom, national baseline 2026') }, labor_hours_per_unit: { v: 4, prov: est('layout + 5–6 units on backplates, sealing, protection') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-SPC-GRAB-BAR-EA', name: 'Stainless grab bar, 1-1/2 in. dia., 36–42 in., installed into blocking, each', name_es: 'Barra de apoyo de acero inoxidable, 1-1/2 pulg diám., 36–42 pulg, instalada en bloqueo, c/u', unit: 'EA', csi: '10 28 13',
      material_cost_cents: { v: 6500, prov: est('commercial stainless grab bar with concealed flanges, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('layout, drill tile, anchor into blocking, load-check') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-SPC-CORNER-GUARD-EA', name: 'Corner guard, stainless or vinyl, 4 ft tall, installed, each', name_es: 'Esquinero de acero inoxidable o vinilo, 4 pies de alto, instalado, c/u', unit: 'EA', csi: '10 26 00',
      material_cost_cents: { v: 4500, prov: est('48 in. surface corner guard, 1-1/2 to 2-1/2 in. wings, national baseline 2026') }, labor_hours_per_unit: { v: 0.4, prov: est('cut, adhesive or anchor, plumb') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-SPC-FRP-SF', name: 'FRP wall panel, 0.09 in., adhesive applied with moldings, per SF', name_es: 'Panel FRP de pared de 0.09 pulg, pegado con molduras, por pie cuadrado', unit: 'SF', csi: '10 26 00',
      material_cost_cents: { v: 220, prov: est('pebbled FRP sheet + adhesive + vinyl trim share, national baseline 2026') }, labor_hours_per_unit: { v: 0.04, prov: est('cut, trowel adhesive, roll, trim') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('sheet cutoffs around openings') } },
    { code: 'G-SPC-LOCKER-EA', name: 'Steel locker, 12×15×72 in. single tier, assembled and anchored, per opening', name_es: 'Locker de acero 12×15×72 pulg de un nivel, armado y anclado, por compartimiento', unit: 'EA', csi: '10 51 13',
      material_cost_cents: { v: 26000, prov: est('knock-down steel locker per opening incl. base/trim share, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('assemble, set, bolt together, anchor, adjust door') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'G-SPC-CBU-EA', name: 'Cluster box unit, 12–16 compartments with parcel locker, on pedestal, anchored to pad (pad excluded), each', name_es: 'Unidad de buzones agrupados 12–16 compartimientos con casillero de paquetes, en pedestal, anclada, c/u', unit: 'EA', csi: '10 55 00',
      material_cost_cents: { v: 220000, prov: est('USPS-approved CBU + pedestal, national baseline 2026') }, labor_hours_per_unit: { v: 4, prov: est('template, drill/anchor, set unit (two people), level') },
      equipment_cost_cents: { v: 0, prov: est('hammer drill only') }, waste_pct: { v: 0, prov: est('counted units') } },
  ],
  quantity_rules: [
    { code: 'G-SPC-TOIL-ACC-SET-EA', assumption: 'Two restrooms with one accessory set each on a commercial job — adjust to the restroom count on the plans', when: { building_types: [...COM] }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-SPC-GRAB-BAR-EA', assumption: 'Side + rear grab bar at one accessible toilet in each of two restrooms (4 bars) — adjust per accessible fixtures and showers', when: { building_types: [...COM] }, qty: { basis: 'const', mul: 4 } },
    { code: 'G-SPC-CBU-EA', assumption: 'One cluster box unit for a multifamily site — size the count to unit count and postmaster direction', when: { building_types: ['residential_mf'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { before_phase: 'drywall', note: 'Blocking for grab bars, accessories, boards and lockers must be verified before walls are closed (UFGS 10 28 13 3.1).' },
    { after_trades: ['painting', 'tile', 'toilet_partitions'], note: 'Accessories, boards and lockers go in after tile and room painting are complete.' },
    { before_phase: 'punch', note: 'Install, load-check grab bars and hand over keys before punch and final clean.' },
  ],
});
