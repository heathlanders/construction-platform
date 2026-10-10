// Trade Knowledge Pack — cold_storage (Walk-In Coolers/Freezers & Cold Storage Rooms). Wave 14 —
// NEW-TRADE pattern (not in HAND_RECIPE_KEYS, no template tasks). Dossier: docs/trade-packs/dossiers/cold_storage.md.
// Sources: UFGS 13 21 26 (cold-storage rooms, prefabricated panel type), 10 CFR 431.306 (DOE walk-in
// standards), Nor-Lake/Master-Bilt + NAKS installation manuals, 29 CFR 1926 (C, D, E, H, K, M, X),
// IMC 307 / Ch. 11, IECC C403.11, IBC 2603 (reference only). The refrigeration pack owns condensing
// units, line sets, evacuation and charging — this pack builds the insulated box around them.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['cold_storage-ufgs-13-21-26'], confidence: 'verified' as const, last_verified: D };
const doe = { src: ['cold_storage-ecfr-10cfr431-306'], confidence: 'verified' as const, last_verified: D };
const norlake = { src: ['cold_storage-norlake-install'], confidence: 'verified' as const, last_verified: D };
const naks = { src: ['cold_storage-naks-wic-manual'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['cold_storage-norlake-install', 'cold_storage-naks-wic-manual'], confidence: 'derived' as const, last_verified: D, note: 'Common to the walk-in manufacturers’ published installation manuals — follow the manual for the box installed.' };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const BOX = 'walk-?\\s*in|cooler\\s*box|freezer\\s*box|cold\\s*(?:storage|room)';
const FLOOR = 'freezer\\s*(?:floor|slab)|under-?\\s*floor\\s*(?:heat|vent)|(?:heated|vented)\\s*(?:sub-?)?(?:floor|slab)|frost\\s*heave';

export default definePack({
  key: 'cold_storage',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Builds walk-in coolers, freezers and prefab cold rooms: levels the floor or screed (and the heated or vented freezer slab), erects cam-locked foam panels, hangs the door with closer, heater wire, strip curtain and inside release, seals joints, hangs the evaporator and its drain, then pulls the box down. Condensing units, line sets and charging belong to the refrigeration trade.',
    summary_es: 'Construye cámaras walk-in de refrigeración y congelación y cuartos fríos: nivela piso o perfil de base (y la losa calentada o ventilada del congelador), arma paneles de espuma con levas, instala puerta con cierrapuertas, cable calefactor, cortina y liberación interior, sella juntas, cuelga el evaporador y su drenaje y la enfría. Condensadora, líneas y carga son de refrigeración.',
    glossary: [
      { term: 'Walk-in cooler / freezer', term_es: 'Cámara frigorífica / congeladora (walk-in)', def: 'Insulated box big enough to walk into, kept above freezing (cooler) or below freezing (freezer).', def_es: 'Caja aislada en la que se puede entrar caminando, mantenida sobre el punto de congelación (refrigerador) o bajo cero (congelador).' },
      { term: 'Foamed panel', term_es: 'Panel de espuma', def: 'Wall, ceiling or floor section with metal skins and foam insulation between them, made at the factory.', def_es: 'Sección de muro, techo o piso con láminas metálicas y espuma aislante entre ellas, fabricada en planta.' },
      { term: 'Cam lock (section latch)', term_es: 'Cierre de leva (pestillo de sección)', def: 'Latch foamed into the panel edge; turning it with a hex wrench pulls two panels tight together.', def_es: 'Pestillo integrado en el borde del panel; al girarlo con una llave hexagonal junta firmemente dos paneles.' },
      { term: 'Screed', term_es: 'Perfil de base (screed)', def: 'Sealer strip set on the building floor that wall panels sit on when the box has no floor panels.', def_es: 'Perfil sellador colocado sobre el piso del edificio donde se apoyan los muros cuando la cámara no tiene paneles de piso.' },
      { term: 'Door heater wire', term_es: 'Cable calefactor de la puerta', def: 'Low-wattage heater around the door opening that stops condensation and ice at the gasket.', def_es: 'Calentador de bajo consumo alrededor del vano de la puerta que evita condensación y hielo en el empaque.' },
      { term: 'Inside release', term_es: 'Liberación interior', def: 'Knob or push rod inside the door that opens it even when it is latched or padlocked outside.', def_es: 'Perilla o varilla en el interior de la puerta que la abre aunque esté cerrada o con candado por fuera.' },
      { term: 'Pressure relief port', term_es: 'Puerto de alivio de presión', def: 'Heated vent in a freezer wall that equalizes air pressure so the door can be opened after it closes.', def_es: 'Ventila calentada en el muro del congelador que iguala la presión del aire para poder abrir la puerta después de cerrarla.' },
      { term: 'Evaporator (unit cooler)', term_es: 'Evaporador (enfriador de unidad)', def: 'Fan-and-coil unit hung inside the box that pulls heat out of the air.', def_es: 'Unidad de ventilador y serpentín colgada dentro de la cámara que extrae el calor del aire.' },
      { term: 'Frost heave', term_es: 'Levantamiento por congelación', def: 'Ground under a freezer slab freezing and swelling, which cracks and lifts the floor; prevented by heating or venting under the insulation.', def_es: 'El suelo bajo la losa del congelador se congela y se hincha, agrietando y levantando el piso; se evita calentando o ventilando bajo el aislamiento.' },
      { term: 'Pulldown', term_es: 'Descenso de temperatura (pulldown)', def: 'First run of the refrigeration that brings the empty box down to its holding temperature.', def_es: 'Primer arranque de la refrigeración que lleva la cámara vacía hasta su temperatura de operación.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [
    {
      id: 'walk_in_box',
      example_title: 'Walk-in cooler / freezer box erection',
      when: { title_re: BOX },
      steps: [
        {
          title: 'Check the slab, layout and clearances',
          instruction: 'Chalk the box outline from the floor plan drawing and check it is square (equal diagonals). Check the slab with a laser: it must be smooth and level to about ±1/2 in. over the footprint, or fix it before any panel goes down. Keep at least 2–3 in. between the box and building walls and above the ceiling, plus the clearances the refrigeration equipment needs. For a freezer with no floor panels, do not start until the insulated, heated or vented slab is done and signed off.',
          detail: 'Count the delivered panels against the packing list and the erection drawing before unbanding anything; store panels flat and off the floor.',
          tools: ['laser level', 'chalk line', 'tape measure', 'framing square'],
          materials: ['erection drawing and packing list'],
          safety_ids: ['panel_stack', 'slip_trip'],
          qa_ids: ['slab_level', 'clearances_layout'],
        },
        {
          title: 'Set the floor panels or the screed',
          instruction: 'Floor-panel boxes: roll out 6-mil poly vapor barrier, set the first floor panel at the high point and shim it dead level both ways, then add the rest and cam-lock them. Floorless coolers: set the screed sections on the outline, level and shim them, lift each one and lay a heavy bead of NSF-listed sealant under both edges, set it back, splice the joints and fasten it to the floor along the centerline. Trim and touch up the sealant.',
          tools: ['laser level', 'hex latch wrench', 'caulk gun', 'hammer drill', 'utility knife'],
          materials: ['6-mil polyethylene vapor barrier', 'composite shims', 'screed sections and splices', 'NSF-listed construction sealant', 'floor fasteners'],
          safety_ids: ['drill_debris', 'sealant_chem', 'panel_stack'],
          qa_ids: ['vapor_barrier', 'screed_sealed'],
        },
        {
          title: 'Erect wall and ceiling panels and lock them',
          instruction: 'Start with a corner panel, two people per panel. Set each wall panel, snug its cam locks about a quarter turn, then lock them to a full stop once the panel is aligned. Bring each ceiling panel in above the walls and lower it into place — never slide it, or the gaskets tear. Lock ceilings to each other first, re-check their position, then lock them down to the walls. Check walls plumb and ceiling level, then plug every latch hole.',
          detail: 'Large boxes: set ceiling panels as you go so they tie the walls together; use T-bar or hangers where the drawing calls for ceiling support.',
          tools: ['hex latch wrench', '4 ft level', 'step ladder', 'rubber mallet'],
          materials: ['wall, corner and ceiling panels', 'latch plug buttons', 'ceiling hangers or T-bar where shown'],
          safety_ids: ['panel_stack', 'ladder', 'top_of_box_fall', 'sheet_cut'],
          qa_ids: ['latches_full'],
        },
        {
          title: 'Hang the door, closer, strip curtain and inside release',
          instruction: 'Set the door section plumb and level and adjust the hinges so the door is square in the jamb. Open the door to 90° and let go — it has to swing shut and seal on its own. Install the strip curtain and the threshold or ramp. Check the inside release opens the door with the outside latch locked, and that the release knob glows or is lit in the dark.',
          code_refs: [{ section: '431.306(a)', code_type: '10 CFR', note: 'Walk-in doors need automatic closers and strip doors or other infiltration control' }],
          tools: ['level', 'screwdriver set', 'hex wrench', 'drill/driver'],
          materials: ['door section with closer', 'strip curtain and mounting bar', 'ramp or threshold'],
          safety_ids: ['lock_in', 'panel_stack'],
          qa_ids: ['door_self_close', 'inside_release'],
        },
        {
          title: 'Seal penetrations and wire the box',
          instruction: 'Drill every penetration (drain, refrigerant lines, conduit) clean through the panel, bush it and seal it airtight inside and out with NSF-listed sealant. Caulk the box base all around. Have the electrician land the light, switch, door heater, pressure relief port and any floor heat on their own circuits per the wiring diagram, and seal the conduit fitting at every junction box so moisture cannot get in. Leave the door heater off until the box reaches temperature.',
          detail: 'Foam plastic insulation must stay covered or protected as the code requires where it faces occupied space; leave panel skins intact.',
          code_refs: [{ section: '2603', code_type: 'IBC', note: 'Foam plastic insulation — protection and flame spread limits' }],
          tools: ['hole saw', 'drill/driver', 'caulk gun', 'multimeter', 'lockout kit'],
          materials: ['penetration bushings', 'NSF-listed sealant', 'vapor-proof light fixture', 'conduit and wire per electrician'],
          safety_ids: ['drill_debris', 'sealant_chem', 'electric_shock', 'cord_gfci'],
          qa_ids: ['penetrations_sealed', 'jbox_sealed'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Hang the evaporator and run the condensate drain',
          instruction: 'Hang the evaporator from the ceiling where the drawing shows, with the hangers or through-bolts the maker specifies and room to clean the coil and open the drain pan. Pipe the condensate out through the wall, sloped all the way, and trap it outside the box before it reaches an approved floor drain or sink. In a freezer, heat-trace and insulate the drain line inside the box and anywhere it can freeze, on a thermostat.',
          code_refs: [{ section: '307.2', note: 'Evaporator and cooling coil condensate disposal' }],
          tools: ['drill/driver', 'level', 'pipe cutter', 'hacksaw'],
          materials: ['evaporator (unit cooler) and hangers', 'condensate drain pipe and fittings', 'self-regulating heat cable and thermostat (freezers)', 'pipe insulation'],
          safety_ids: ['ladder', 'top_of_box_fall', 'electric_shock'],
          qa_ids: ['drain_slope_trap'],
          gating_inspection_type: 'equipment_set',
        },
        {
          title: 'Coordinate the refrigeration hookup and leak test',
          instruction: 'Hand over to the refrigeration trade for the condensing unit, line set, brazing, pressure test, evacuation and charge. Keep line sets supported and strain-free where they pass the box wall, and reseal any penetration they disturb. Nobody works inside the closed box while refrigerant is being tested or charged.',
          code_refs: [{ section: '1108', note: 'Field pressure test of refrigerant-containing parts before use' }],
          tools: ['caulk gun'],
          materials: ['NSF-listed sealant'],
          safety_ids: ['refrigerant_asphyx'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Pull the box down, run it 24 hours and turn it over',
          instruction: 'With the refrigeration running, pull the empty box down to its holding temperature, then turn on the door heater and pressure relief port. Run it at least 24 hours with controls, defrost and the temperature alarm in service, logging readings each hour. Set the thermometer sensor away from the door, test the alarm, check the lights, clear debris off the top of the box, and hand over the manuals and wiring diagrams.',
          code_refs: [{ section: '431.306(a)', code_type: '10 CFR', note: 'Walk-in panel insulation, fan motors and lighting meet the federal standard' }, { section: 'C403.11.2', code_type: 'IECC', note: 'Walk-in cooler and freezer requirements' }],
          tools: ['digital thermometer', 'data logger', 'multimeter'],
          materials: ['start-up log form', 'O&M manuals and wiring diagrams'],
          safety_ids: ['cold_stress', 'lock_in', 'top_of_box_fall'],
          qa_ids: ['pulldown_24h', 'alarm_tested', 'energy_compliance'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'freezer_floor',
      example_title: 'Freezer floor heat & insulated slab',
      when: { title_re: FLOOR },
      priority: 10,
      steps: [
        {
          title: 'Confirm the freezer floor design with the concrete trade',
          instruction: 'Get the freezer floor detail: recessed slab depth, insulation thickness, vapor barrier, and whether frost-heave protection is vent tubes or an electric heat mat or cable. Mark the box outline and where vent tubes daylight or the heat-cable leads and sensor come up. The concrete trade forms and pours; this crew places the heat or vents and the insulation.',
          tools: ['laser level', 'tape measure', 'chalk line'],
          materials: ['freezer floor detail drawing'],
          safety_ids: ['slip_trip'],
        },
        {
          title: 'Place the under-floor heat or vent tubes',
          instruction: 'On the sub-slab, lay the vent tubes at the spacing on the detail with both ends open to building air, or lay the heat cable or mat with its sensor in a conduit so it can be replaced. Test the heat cable insulation and resistance before covering it and record the readings.',
          tools: ['megohmmeter', 'multimeter', 'tie wire and pliers'],
          materials: ['vent tubes or heat cable / mat', 'sensor conduit', 'tie wire'],
          safety_ids: ['electric_shock', 'slip_trip'],
          qa_ids: ['floor_heat_tested'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Lay the insulation and vapor barrier',
          instruction: 'Lay rigid insulation boards tight, in staggered layers to the thickness on the detail, and cover them with the vapor barrier lapped and taped at every seam and turned up at the edges. Do not let anyone walk or wheel loads on unprotected board.',
          code_refs: [{ section: '431.306(a)', code_type: '10 CFR', note: 'Walk-in freezer floor insulation minimum' }],
          tools: ['utility knife', 'tape gun'],
          materials: ['rigid insulation board', 'polyethylene vapor barrier', 'seam tape'],
          safety_ids: ['slip_trip'],
          qa_ids: ['floor_insul'],
        },
        {
          title: 'Retest after the wearing slab and set the control',
          instruction: 'After the concrete trade pours the wearing slab, test the heat cable again and compare with the first readings. Wire the floor-heat thermostat and alarm, or check every vent tube is open at both ends. Do not start freezer pulldown until the floor heat is working or the vents are clear.',
          tools: ['megohmmeter', 'multimeter', 'flashlight'],
          materials: ['floor-heat thermostat and alarm'],
          safety_ids: ['electric_shock'],
          qa_ids: ['floor_heat_tested'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '2603', code_type: 'IBC', note: 'Foam plastic insulation in panels — protection and flame spread limits', prov: icc },
      { section: '431.306(a)', code_type: '10 CFR', note: 'Walk-in wall, ceiling, door and freezer floor insulation minimums', prov: doe },
    ],
    equipment_set: [
      { section: '307.2', note: 'Evaporator and cooling coil condensate disposal', prov: icc },
      { section: 'Ch. 11', note: 'Refrigeration systems — equipment installation', prov: icc },
    ],
    gas_refrigerant_test: [
      { section: '1108', note: 'Field pressure test of refrigerant-containing parts', prov: icc },
    ],
    final: [
      { section: 'C403.11.2', code_type: 'IECC', note: 'Walk-in cooler and freezer requirements', prov: { ...icc, note: 'Section number per the 2021 IECC; check the adopted edition.' } },
      { section: '431.306(a)', code_type: '10 CFR', note: 'Door closers, infiltration control, fan motors and lighting', prov: doe },
    ],
  },
  equipment: [
    { when: { title_re: BOX }, type: 'forklift', reason: 'Unload and stage panel crates flat near the box', optional: true },
  ],
  hazards: [
    { id: 'panel_stack', hazard: 'Struck or crushed by large foamed panels tipping over in storage or while being stood up', hazard_es: PENDING_ES, controls: ['Store panel crates flat on dunnage and secure stacks against sliding or falling', 'Handle every panel with two people; never stand a panel on edge unattended'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, ppe: ['gloves', 'safety-toe boots'], prov: osha('h') },
    { id: 'top_of_box_fall', hazard: 'Fall from the top of the box while setting ceilings, the evaporator or line sets', hazard_es: PENDING_ES, controls: ['Work on top of the box only where the maker allows it, on boards spanning the panels', 'Use guardrails or fall arrest where the top is 6 ft or more above the floor'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness + lanyard where required'], prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder fall while locking ceiling panels and hanging the evaporator', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it is used to reach', 'Keep three points of contact; set the ladder on the level floor, not on panels or crates'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'electric_shock', hazard: 'Shock while wiring door heaters, lights, relief port, drain heat cable or floor heat', hazard_es: PENDING_ES, controls: ['De-energize, lock and tag the circuit before working on it', 'Verify dead with a tester before touching conductors'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'cord_gfci', hazard: 'Shock from tools and cords on wet or frosted floors', hazard_es: PENDING_ES, controls: ['Plug tools into GFCI-protected outlets', 'Inspect cords before use and keep them out of water and off sharp panel edges'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'drill_debris', hazard: 'Eye injury from metal chips and foam dust when drilling and cutting panels', hazard_es: PENDING_ES, controls: ['Wear safety glasses or a face shield when drilling, hole-sawing or cutting panels', 'Vacuum chips and foam dust as you go'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'face shield'], prov: osha('e') },
    { id: 'sealant_chem', hazard: 'Skin and breathing irritation from sealants, adhesives and foam in a closed box', hazard_es: PENDING_ES, controls: ['Read the safety data sheet before use and follow its ventilation and glove advice', 'Keep the door open and air moving while sealants cure inside the box'], controls_es: PENDING_ES, osha_ref: '1926.59(h)', severity: 2, ppe: ['nitrile gloves'], prov: osha('d') },
    { id: 'sheet_cut', hazard: 'Cuts from panel skin edges, trim and strip-curtain hardware', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when handling panels and trim', 'Deburr any field-cut metal edge'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'lock_in', hazard: 'Worker shut inside the box with the door latched or padlocked outside', hazard_es: PENDING_ES, controls: ['Test the inside release before anyone works inside with the door closed', 'Never padlock the door while anyone may be inside; use a buddy check before closing up'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, prov: osha('c', 'General hazard-training duty; no 1926 rule specific to walk-in entrapment — release hardware per the maker.') },
    { id: 'cold_stress', hazard: 'Cold stress and frostbite working inside a running freezer during pulldown and testing', hazard_es: PENDING_ES, controls: ['Wear insulated clothing and gloves; limit time inside and warm up between entries', 'Work in pairs and watch each other for shivering and numbness'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 3, ppe: ['insulated jacket', 'insulated gloves'], prov: osha('c', 'Employer must require PPE where conditions call for it; no 1926 cold-stress standard.') },
    { id: 'refrigerant_asphyx', hazard: 'Breathing refrigerant or low oxygen in the closed box during a leak test or charge', hazard_es: PENDING_ES, controls: ['Keep everyone out of the closed box while lines are tested or charged', 'Ventilate and check the air before re-entering after any leak'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 3, prov: osha('d') },
    { id: 'slip_trip', hazard: 'Slips on wet, frosted or poly-covered floors and trips on panel crates and scraps', hazard_es: PENDING_ES, controls: ['Clear scraps, banding and crate lumber as you go', 'Keep floors dry; cover slick vapor barrier and insulation board with walk boards'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'slab_level', phase: 'finishes_interior', item: 'Slab smooth and level to about ±1/2 in. over the box footprint before any panel or screed is set.', item_es: tr('Losa lisa y nivelada a aproximadamente ±1/2 pulg. en toda el área de la cámara antes de colocar paneles o perfiles.'), prov: norlake },
    { id: 'clearances_layout', item: 'Box square on its outline, with at least 2 in. to building walls and above the ceiling plus the equipment clearances.', item_es: tr('Cámara a escuadra sobre su trazo, con al menos 2 pulg. a los muros del edificio y sobre el techo, más las distancias del equipo.'), prov: mfr },
    { id: 'vapor_barrier', item: '6-mil poly vapor barrier in place under floor panels before they are set.', item_es: tr('Barrera de vapor de polietileno de 6 mil colocada bajo los paneles de piso antes de instalarlos.'), prov: norlake },
    { id: 'screed_sealed', item: 'Screed level, set in a continuous bead of NSF-listed sealant, joints spliced and sealed, fastened to the floor.', item_es: tr('Perfil de base nivelado, asentado en un cordón continuo de sellador listado NSF, juntas empalmadas y selladas, fijado al piso.'), prov: norlake },
    { id: 'latches_full', item: 'Every cam latch at a full stop and plugged; walls plumb, ceiling level, gaskets touching both panel edges.', item_es: tr('Cada pestillo de leva al tope y tapado; muros a plomo, techo a nivel, empaques en contacto con ambos bordes.'), prov: norlake },
    { id: 'door_self_close', item: 'Door opened to 90° closes and seals on its own (automatic closer); strip curtain or other infiltration control installed.', item_es: tr('La puerta abierta a 90° se cierra y sella sola (cierrapuertas automático); cortina de tiras u otro control de infiltración instalado.'), prov: { src: ['cold_storage-norlake-install', 'cold_storage-ecfr-10cfr431-306'], confidence: 'verified', last_verified: D } },
    { id: 'inside_release', item: 'Inside release opens the door with the outside latch locked; release knob is visible in the dark.', item_es: PENDING_ES, safety: true, prov: naks },
    { id: 'penetrations_sealed', item: 'Every wall and ceiling penetration bushed and sealed airtight inside and out; box base caulked all around with NSF-listed sealant.', item_es: tr('Cada perforación en muro y techo con buje y sellada hermética por dentro y por fuera; base de la cámara calafateada en todo el perímetro.'), prov: mfr },
    { id: 'jbox_sealed', item: 'Conduit fittings sealed at every junction box on the box so moisture cannot enter fixtures.', item_es: PENDING_ES, safety: true, prov: norlake },
    { id: 'drain_slope_trap', item: 'Condensate drain sloped, routed out of the box, trapped outside it to an approved receptor; heat-traced and insulated in freezers.', item_es: tr('Drenaje de condensado con pendiente, sacado de la cámara, con sifón afuera hacia un receptor aprobado; con cable calefactor y aislado en congeladores.'), prov: { src: ['cold_storage-naks-wic-manual', 'icc-pa'], confidence: 'derived', last_verified: D, note: 'NAKS manual drain routing + IMC 307.2 topic; no code text stored.' } },
    { id: 'pulldown_24h', phase: 'commissioning', item: 'Box pulled down and run at least 24 h with controls and defrost in service; hourly readings logged.', item_es: tr('Cámara llevada a temperatura y operada al menos 24 h con controles y deshielo en servicio; lecturas horarias registradas.'), prov: ufgs },
    { id: 'alarm_tested', phase: 'commissioning', item: 'Temperature alarm tested and thermometer sensor mounted on a wall away from the door.', item_es: PENDING_ES, safety: true, prov: { src: ['cold_storage-ufgs-13-21-26', 'cold_storage-norlake-install'], confidence: 'verified', last_verified: D } },
    { id: 'energy_compliance', item: 'Panel labels show R-25 (cooler) / R-32 (freezer) or better; evaporator fan motors ECM; lights efficient or on an auto-off.', item_es: tr('Etiquetas de los paneles indican R-25 (refrigerador) / R-32 (congelador) o mejor; motores de ventilador del evaporador ECM; luces eficientes o con apagado automático.'), prov: doe },
    { id: 'floor_insul', item: 'Freezer floor insulation laid tight in staggered layers to at least R-28, vapor barrier lapped and taped.', item_es: tr('Aislamiento del piso del congelador colocado apretado en capas traslapadas hasta al menos R-28, barrera de vapor traslapada y encintada.'), prov: doe },
    { id: 'floor_heat_tested', item: 'Floor heat cable tested and recorded before it is covered, retested after the pour and working on its thermostat (or every vent tube open) before freezer pulldown.', item_es: PENDING_ES, safety: true, prov: { src: ['cold_storage-norlake-install', 'platform-baseline'], confidence: 'estimate', last_verified: D, note: 'Nor-Lake warns against freezers on unprepared slabs; the retest sequence is platform practice.' } },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Foam panels protected as required where they face occupied space; flame-spread label on file', item_es: PENDING_ES, ref: 'IBC 2603' },
      { item: 'Penetrations bushed and sealed; box base caulked; electrical junction boxes sealed', item_es: tr('Perforaciones con buje y selladas; base calafateada; cajas eléctricas selladas'), ref: 'mfr' },
      { item: 'Freezer floor heat or vent tubes in place and tested before covering', item_es: PENDING_ES },
    ],
    equipment_set: [
      { item: 'Evaporator hung per the maker with service access', item_es: tr('Evaporador colgado según el fabricante con acceso de servicio'), ref: 'IMC Ch. 11' },
      { item: 'Condensate drain sloped, trapped outside the box, to an approved receptor; heat-traced in freezers', item_es: tr('Drenaje de condensado con pendiente, sifón fuera de la cámara, a un receptor aprobado; con cable calefactor en congeladores'), ref: 'IMC 307.2' },
    ],
    gas_refrigerant_test: [
      { item: 'Refrigeration trade pressure test witnessed or report on file before charge (refrigeration pack)', item_es: tr('Prueba de presión del oficio de refrigeración presenciada o reporte archivado antes de cargar (paquete de refrigeración)'), ref: 'IMC 1108' },
    ],
    final: [
      { item: 'Door self-closes and seals; inside release works with the outside latch locked', item_es: PENDING_ES, ref: '10 CFR 431.306(a)' },
      { item: 'Strip curtain installed; lights efficient or on auto-off; panel R-value labels visible', item_es: tr('Cortina de tiras instalada; luces eficientes o con apagado automático; etiquetas de valor R visibles'), ref: 'IECC C403.11.2' },
      { item: '24-hour run log, alarm test and O&M manuals turned over', item_es: tr('Registro de operación de 24 horas, prueba de alarma y manuales de operación entregados'), ref: 'UFGS 13 21 26' },
    ],
  },
  assemblies: [
    { code: 'M-CS-COOLER-SF', name: 'Walk-in cooler box, 4 in. foamed panels with floor, erected and sealed (per SF of floor, door section excluded)', name_es: 'Cámara frigorífica walk-in, paneles de 4 pulg. con piso, armada y sellada (por SF de piso, sin puerta)', unit: 'SF', csi: '13 21 26',
      description: 'Wall, ceiling and floor panels for a ~7.5 ft tall box; refrigeration by the refrigeration trade.',
      material_cost_cents: { v: 6500, prov: est('≈430 SF of R-25+ panel for an 8×10 box ÷ 80 SF floor, national baseline 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('two installers about 1.5 days for an 8×10 box incl. leveling and sealing') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('factory-cut panels') } },
    { code: 'M-CS-FREEZER-SF', name: 'Walk-in freezer box, 4–5 in. panels with insulated floor, erected and sealed (per SF floor, no door)', name_es: 'Cámara congeladora walk-in, paneles de 4–5 pulg. con piso aislado, armada y sellada (por SF de piso, sin puerta)', unit: 'SF', csi: '13 21 26',
      material_cost_cents: { v: 8000, prov: est('R-32 walls/ceiling and R-28 floor panels for an 8×8 box ÷ 64 SF floor, national baseline 2026') }, labor_hours_per_unit: { v: 0.35, prov: est('as cooler plus heavier panels and floor sealing') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('factory-cut panels') } },
    { code: 'M-CS-FLRHEAT-SF', name: 'Freezer floor frost-heave protection: heat cable or vent tubes, rigid insulation, vapor barrier (no concrete)', name_es: 'Protección antiheladas del piso del congelador: cable calefactor o tubos de ventilación, aislamiento y barrera de vapor', unit: 'SF', csi: '13 21 26',
      material_cost_cents: { v: 900, prov: est('heat cable or vent tubes + ~4 in. rigid board + poly, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('lay heat/vents, board in layers, poly, two cable tests') },
      equipment_cost_cents: { v: 0, prov: est('hand tools and meters') }, waste_pct: { v: 8, prov: est('board offcuts and poly laps') } },
    { code: 'M-CS-DOOR-EA', name: 'Walk-in door section 36×78 in. with heater wire, closer, inside release, strip curtain and light, set', name_es: 'Sección de puerta walk-in 36×78 pulg. con cable calefactor, cierrapuertas, liberación interior, cortina y lámpara', unit: 'EA', csi: '13 21 26',
      material_cost_cents: { v: 180000, prov: est('door section + closer + strip curtain + light, national baseline 2026') }, labor_hours_per_unit: { v: 4, prov: est('set, plumb, adjust hinges/closer, curtain, release check') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('factory unit') } },
    { code: 'M-CS-EVAP-EA', name: 'Walk-in evaporator hung with condensate drain to receptor, heat-traced in freezers (no line set or charge)', name_es: 'Evaporador walk-in colgado con drenaje de condensado, con cable calefactor en congeladores (sin líneas ni carga)', unit: 'EA', csi: '13 21 26',
      material_cost_cents: { v: 160000, prov: est('small low-profile unit cooler + drain pipe, trap, heat cable, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('hang, level, drill/seal wall, drain with trap and heat trace') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('drain pipe offcuts') } },
  ],
  quantity_rules: [
    { code: 'M-CS-COOLER-SF', assumption: 'One 8×10 ft walk-in cooler (80 SF floor) — replace with the box schedule', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 80 } },
    { code: 'M-CS-FREEZER-SF', assumption: 'One 8×8 ft walk-in freezer (64 SF floor) — replace with the box schedule', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 64 } },
    { code: 'M-CS-FLRHEAT-SF', assumption: 'Frost-heave protection under the 64 SF freezer floor — drop if the freezer sits on an approved insulated floor panel over a heated space', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 64 } },
    { code: 'M-CS-DOOR-EA', assumption: 'One door section per box (cooler + freezer)', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'M-CS-EVAP-EA', assumption: 'One evaporator per box (cooler + freezer)', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 2 } },
  ],
  dependency_hints: [
    { after_trades: ['concrete', 'concrete_flatwork'], note: 'Slab (and the recessed, insulated freezer floor) poured and level before panels go down.' },
    { before_phase: 'commissioning', note: 'Box erected and sealed before the refrigeration trade sets the line set, charges and starts up.' },
  ],
});
