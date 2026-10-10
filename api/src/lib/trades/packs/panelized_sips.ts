// Trade Knowledge Pack — panelized_sips (Panelized / SIPs). Wave 07 — NEW-TRADE pattern (no hand recipe,
// no template tasks). Dossier: docs/trade-packs/dossiers/panelized_sips.md. Sources: DOE Building America
// Solution Center SIP guide, SIPA technical bulletins + installation FAQ, 29 CFR 1926 (C, D, E, F, H, I,
// M, O, CC), IRC R610 / R316.4 / R703 / R806.5 / R905.1.1 / N1102.4.1 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const basc = { src: ['panelized_sips-doe-basc-sips'], confidence: 'verified' as const, last_verified: D };
const sipa = { src: ['panelized_sips-sipa-install', 'panelized_sips-sipa-tech'], confidence: 'derived' as const, last_verified: D, note: 'SIPA installation FAQ / bulletins paraphrased — the panel maker’s shop drawings and installation manual govern.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

const SIP_RE = '\\bSIPs?\\b|structural[- ]insulated[- ]panel|panelized|wall panels?';
const ROOF_RE = '\\broof\\b[^.]*(?:\\bSIPs?\\b|structural[- ]insulated|panels?)|(?:\\bSIPs?\\b|structural[- ]insulated)[^.]*\\broof';

export default definePack({
  key: 'panelized_sips',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Sets factory-cut structural insulated panels (SIPs) and panelized wall sections — sill and plate prep, crane or telehandler setting, splines and fastening, continuous seam sealing and taping for an airtight shell, electrical chases, roof SIPs over a ridge beam, and keeping the panels dry until the drainage plane and roof are on.',
    summary_es: 'Coloca paneles estructurales aislados (SIP) y muros panelizados — preparación de solera, montaje con grúa o manipulador telescópico, lengüetas y fijación, sellado y encintado continuo de juntas para un cascarón hermético, canales eléctricos, paneles de techo sobre viga de cumbrera, y protección contra el agua hasta colocar el plano de drenaje y el techo.',
    glossary: [
      { term: 'SIP (structural insulated panel)', term_es: 'SIP (panel estructural aislado)', def: 'Panel of rigid foam glued between two skins of OSB or plywood; carries load and insulates at once.', def_es: 'Panel de espuma rígida pegada entre dos caras de OSB o contrachapado; carga y aísla a la vez.' },
      { term: 'Spline', term_es: 'Lengüeta (spline)', def: 'Strip that joins two panels at a seam — surface spline (OSB strips), insulated spline, or solid 2x where loads require it.', def_es: 'Tira que une dos paneles en una junta — de superficie (tiras de OSB), aislada, o madera maciza 2x donde la carga lo exige.' },
      { term: 'Shop drawings / panel layout', term_es: 'Planos de taller / despiece de paneles', def: 'Factory drawings that number every panel and show where it goes, its openings and chases.', def_es: 'Planos de fábrica que numeran cada panel e indican su lugar, vanos y canales.' },
      { term: 'Electrical chase', term_es: 'Canal eléctrico', def: 'Factory-cut channel in the foam core that wires are pulled through.', def_es: 'Canal cortado en fábrica en el núcleo de espuma por donde se pasan los cables.' },
      { term: 'SIP tape', term_es: 'Cinta para SIP', def: 'Peel-and-stick tape over panel seams, ridge and wall-roof joints that keeps the shell airtight.', def_es: 'Cinta autoadhesiva sobre juntas de paneles, cumbrera y unión muro-techo que mantiene hermético el cascarón.' },
      { term: 'Foam scoop', term_es: 'Raspador de espuma (hilo caliente)', def: 'Hot-wire tool that recesses the foam core so a spline or plate can slide in.', def_es: 'Herramienta de hilo caliente que rebaja el núcleo de espuma para insertar una lengüeta o placa.' },
      { term: 'Ridge beam', term_es: 'Viga de cumbrera', def: 'Structural beam at the peak that roof panels bear on; set before the roof panels.', def_es: 'Viga estructural en la cumbre donde se apoyan los paneles de techo; se coloca antes de ellos.' },
      { term: 'Thermal barrier', term_es: 'Barrera térmica', def: 'Fire-rated covering (usually 1/2 in. drywall) required over foam-core panels on the inside.', def_es: 'Revestimiento resistente al fuego (normalmente panel de yeso de 1/2 pulg.) requerido sobre paneles de núcleo de espuma por dentro.' },
      { term: 'Blower door test', term_es: 'Prueba de puerta sopladora', def: 'Test that pressurizes the house to measure air leakage and find leaks at seams.', def_es: 'Prueba que presuriza la casa para medir las fugas de aire y localizarlas en las juntas.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'sip_walls',
      example_title: 'Set SIP wall panels',
      when: { title_re: SIP_RE },
      steps: [
        {
          title: 'Receive, check and stage the panels',
          instruction: 'Check the load against the shop drawings — panel numbers, count, splines, sealant and screws — and note any damaged or wet panels before signing. Stack panels high, dry and flat on timbers no more than 6 ft apart over a ground cover, in the order they will be set, and cover them with tarps.',
          tools: ['shop drawings', 'tape measure', 'moisture meter'],
          materials: ['4x4 dunnage', 'ground cover poly', 'tarps'],
          safety_ids: ['forklift', 'rigging'],
          qa_ids: ['panels_dry_flat'],
        },
        {
          title: 'Check the deck and set the sill and bottom plates',
          instruction: 'Confirm the foundation and floor deck are level, square and to the dimensions on the shop drawings — SIPs tolerate less error than stick framing. Install the sill sealer and capillary break / termite shield, then snap lines and fasten the bottom plates so the outside skin of every panel bears fully on the plate with no overhang.',
          tools: ['transit or laser level', 'chalk line', 'framing square', 'drill/driver'],
          materials: ['sill sealer', 'capillary break / termite flashing', 'treated sill and bottom plate stock', 'anchor nuts and washers'],
          safety_ids: ['fall_edge', 'saw_cut'],
          qa_ids: ['deck_level_square', 'sill_break_bearing'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: 'R610', code_type: 'IRC', note: 'Structural insulated panel wall construction' }],
        },
        {
          title: 'Set, spline and fasten the wall panels',
          instruction: 'Starting at a corner, run the maker’s sealant beads on the plate, spline pockets and panel edges, then lift each numbered panel into place by crane, telehandler or hand per its size. Slide the splines in, close the seam with lift plates and a winch if needed, and screw or nail both skins on the maker’s schedule. Plumb and brace each wall before releasing the rigging; install the top plate and any structural splines at point loads.',
          detail: 'Never field-cut a panel, header or spline beyond the shop drawings without the engineer’s or maker’s approval.',
          tools: ['crane or telehandler with spreader / panel clamp', 'tag lines', 'lift plates and belt winch', 'power caulker', 'impact driver', 'level', 'wall braces'],
          materials: ['SIP wall panels per layout', 'splines', 'SIP sealant', 'panel screws or nails per schedule', 'top plates'],
          safety_ids: ['crane_fall_zone', 'crane_swing', 'power_line', 'rigging', 'forklift', 'panel_tip', 'fall_edge'],
          qa_ids: ['sealant_continuous', 'fasteners_schedule', 'plumb_braced', 'no_unapproved_cuts'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: 'R610', code_type: 'IRC', note: 'SIP walls — panel sizes, connections and openings per provisions or listing' }],
        },
        {
          title: 'Frame site openings and open the chases',
          instruction: 'If an opening was not factory-cut, mark it, cut through with a panel saw, recess the foam about 1-1/2 in. with a hot-wire scoop, caulk both skins and foam the core, then fit and nail the 2x sill, header and jambs through both skins. Drill access holes through plates, splines and the floor so they line up with every vertical wire chase.',
          detail: 'Openings wider than about 5 ft need an engineered header.',
          tools: ['beam / panel saw', 'hot-wire foam scoop', 'drill with spade bit', 'framing nailer'],
          materials: ['2x lumber for opening framing', 'SIP sealant', 'low-expansion foam'],
          safety_ids: ['saw_cut', 'foam_fire', 'foam_chem'],
          qa_ids: ['openings_framed', 'chase_holes_aligned'],
        },
        {
          title: 'Install the drainage plane and flash the openings',
          instruction: 'Wrap the walls with the specified water-resistive barrier, lapped shingle-style, and flash the base of the wall so water exits over the foundation. Install sill pans with back dams and flash every window and door before cladding. Keep panel edges and tops covered whenever rain is forecast.',
          tools: ['stapler / cap nailer', 'utility knife', 'J-roller'],
          materials: ['water-resistive barrier', 'self-adhered flashing', 'sill pans', 'base-of-wall flashing'],
          safety_ids: ['fall_edge'],
          qa_ids: ['wrb_drainage'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: 'R703.2', code_type: 'IRC', note: 'Water-resistive barrier over the wall' }, { section: 'R703.4', code_type: 'IRC', note: 'Flashing at openings and wall bases' }],
        },
        {
          title: 'Seal and tape every seam, foam the chases',
          instruction: 'Tape all panel-to-panel, wall-to-floor and wall-to-roof seams with SIP tape, rolled tight. After the electrician pulls wire and sets boxes, fill boxes and chases with low-expansion foam. Before drywall, walk every seam with a smoke pencil under blower-door depressurization and fix any leak.',
          tools: ['J-roller', 'foam gun', 'smoke pencil', 'blower door (rater)'],
          materials: ['SIP seam tape', 'low-expansion foam sealant'],
          safety_ids: ['foam_chem', 'fall_edge'],
          qa_ids: ['seams_taped', 'chase_holes_aligned', 'smoke_test'],
          gating_inspection_type: 'insulation',
          code_refs: [{ section: 'N1102.4.1.1', code_type: 'IRC', note: 'Air barrier installation criteria — continuous across panel joints' }, { section: 'R316.4', code_type: 'IRC', note: 'Foam plastic separated from the interior by a thermal barrier' }],
        },
      ],
    },
    {
      id: 'sip_roof',
      example_title: 'Install SIP roof panels',
      when: { title_re: ROOF_RE },
      priority: 10,
      steps: [
        {
          title: 'Set the ridge beam and bearing points',
          instruction: 'With the walls plumb, braced and square, lift the ridge beam with a crane and a rigged sling onto its posts or bearing walls, then confirm every point load carries down to the foundation as the drawings show. Have the roof panels staged and the crew ready so panels go up as soon as the beam is set.',
          tools: ['crane', 'slings and shackles', 'tag lines', 'level'],
          materials: ['ridge beam', 'post caps and hangers per drawings'],
          safety_ids: ['crane_fall_zone', 'crane_swing', 'power_line', 'rigging'],
          qa_ids: ['lift_plan'],
        },
        {
          title: 'Lift and fasten the roof panels',
          instruction: 'Run sealant beads on the wall top plates, the ridge beam and panel edges, then fly each numbered roof panel into place with panel lifting hardware. Close seams, install splines and drive the long panel screws into the beam and plates on the maker’s schedule. Guard or cover every skylight and chimney opening as soon as it is set.',
          tools: ['crane', 'panel lifting plates', 'long-shank impact driver', 'power caulker'],
          materials: ['SIP roof panels per layout', 'splines', 'SIP sealant', 'SIP panel screws'],
          safety_ids: ['crane_fall_zone', 'roof_steep', 'roof_holes', 'rigging'],
          qa_ids: ['sealant_continuous', 'fasteners_schedule', 'no_unapproved_cuts'],
          gating_inspection_type: 'framing',
        },
        {
          title: 'Seal the ridge and eaves and dry the roof in',
          instruction: 'Tape the ridge, roof-to-wall and panel seams on the inside, and seal the topside seams as the maker details. Install underlayment the same day the panels are set, lapped and fastened per the roofing instructions, so no rain reaches the panel tops.',
          tools: ['J-roller', 'cap nailer', 'chalk line'],
          materials: ['SIP seam tape', 'roof underlayment', 'drip edge'],
          safety_ids: ['roof_steep', 'roof_holes'],
          qa_ids: ['roof_seams_sealed'],
          gating_inspection_type: 'roof_dry_in',
          code_refs: [{ section: 'R905.1.1', code_type: 'IRC', note: 'Roof underlayment' }, { section: 'R806.5', code_type: 'IRC', note: 'Unvented roof assemblies — SIP roofs are typically unvented' }],
        },
      ],
    },
  ],
  code_refs: {
    framing: [
      { section: 'R610', code_type: 'IRC', note: 'Structural insulated panel wall construction — provisions, connections, openings', prov: irc },
    ],
    sheathing: [
      { section: 'R703.2', code_type: 'IRC', note: 'Water-resistive barrier over exterior walls', prov: irc },
      { section: 'R703.4', code_type: 'IRC', note: 'Flashing at openings and wall-base terminations', prov: irc },
    ],
    roof_dry_in: [
      { section: 'R905.1.1', code_type: 'IRC', note: 'Roof underlayment type and application', prov: irc },
      { section: 'R806.5', code_type: 'IRC', note: 'Unvented attic and enclosed rafter assemblies', prov: irc },
    ],
    insulation: [
      { section: 'R316.4', code_type: 'IRC', note: 'Thermal barrier between foam plastic and the interior', prov: irc },
      { section: 'N1102.4.1.1', code_type: 'IRC', note: 'Air barrier and insulation installation criteria', prov: irc },
    ],
    final: [
      { section: 'N1102.4.1.2', code_type: 'IRC', note: 'Building envelope air-leakage testing', prov: irc },
    ],
  },
  equipment: [
    { when: { title_re: ROOF_RE }, type: 'crane', reason: 'Fly the ridge beam and roof panels into place' },
    { when: { title_re: SIP_RE, building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'crane', reason: 'Set large wall panels on multi-story or commercial jobs' },
    { when: { title_re: SIP_RE }, type: 'telehandler', reason: 'Unload, stage and set wall panels; lift panels to the deck', optional: true },
    { when: { title_re: SIP_RE }, type: 'forklift', reason: 'All-terrain forklift to unload and move panel bundles on site', optional: true },
  ],
  hazards: [
    { id: 'crane_fall_zone', hazard: 'Struck or crushed by a swinging or dropped panel or ridge beam', hazard_es: PENDING_ES, controls: ['Keep everyone out of the fall zone while a load is hanging', 'Only the hooking-on and landing crew near the load; guide it with tag lines'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: osha('cc') },
    { id: 'crane_swing', hazard: 'Caught between the crane’s rotating upper works and an object', hazard_es: PENDING_ES, controls: ['Barricade the swing radius of the crane’s counterweight', 'Brief the crew on the barricaded area before the first lift'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)(2)', severity: 4, prov: osha('cc') },
    { id: 'power_line', hazard: 'Electrocution if the boom, load or tag line contacts an overhead line', hazard_es: PENDING_ES, controls: ['Identify overhead lines and keep the minimum clearance before setting up', 'Use a dedicated spotter when the work zone is near a line'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'rigging', hazard: 'Load drop from damaged slings, shackles or panel lifting hardware', hazard_es: PENDING_ES, controls: ['Inspect slings, shackles and lift plates every shift; tag out damaged gear', 'Use the maker’s lifting points and hardware for the panel size'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: osha('h') },
    { id: 'forklift', hazard: 'Tip-over or struck-by when moving panel bundles with a forklift or telehandler', hazard_es: PENDING_ES, controls: ['Stay within the posted rated capacity at the reach used', 'Travel with the load low on firm ground; trained operators only'], controls_es: PENDING_ES, osha_ref: '1926.602(c)(1)(i)', severity: 4, prov: osha('o') },
    { id: 'panel_tip', hazard: 'Unbraced wall panel blown over by wind or knocked down during setting', hazard_es: PENDING_ES, controls: ['Brace every wall panel before releasing the rigging', 'Stop setting large panels in high wind'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 4, prov: osha('c') },
    { id: 'fall_edge', hazard: 'Fall from the deck edge or wall top while setting and taping panels', hazard_es: PENDING_ES, controls: ['Guardrails, safety nets or personal fall arrest at 6 ft or more on residential work', 'Use a written fall protection plan only where the standard allows it'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness + lanyard when required'], prov: osha('m') },
    { id: 'roof_steep', hazard: 'Fall from a steep SIP roof while fastening panels and drying in', hazard_es: PENDING_ES, controls: ['Personal fall arrest, guardrails with toeboards, or nets on steep roofs 6 ft or more up', 'Install roof anchors as the first panels are fastened'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(11)', severity: 4, ppe: ['harness + lanyard', 'soft-soled shoes'], prov: osha('m') },
    { id: 'roof_holes', hazard: 'Fall through a skylight or chimney opening in the roof panels', hazard_es: PENDING_ES, controls: ['Cover or guard every roof opening as soon as the panel is set', 'Mark covers “HOLE” and secure them against displacement'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'saw_cut', hazard: 'Kickback and cuts from panel saws and chainsaw-style beam cutters', hazard_es: PENDING_ES, controls: ['Keep blade guards working and support the panel on both sides of the cut', 'Never stand in line with the blade'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'hearing protection', 'cut-resistant gloves'], prov: osha('i') },
    { id: 'foam_fire', hazard: 'Fire from hot-wire tools or sparks igniting the foam core and scrap', hazard_es: PENDING_ES, controls: ['Keep a 2A-rated extinguisher within reach while cutting or scooping foam', 'Clear foam scrap daily; no open flame or welding near exposed foam'], controls_es: PENDING_ES, osha_ref: '1926.150(c)(1)(i)', severity: 3, prov: osha('f') },
    { id: 'foam_chem', hazard: 'Skin, eye and breathing irritation from panel sealant, spray foam and hot-wire fumes', hazard_es: PENDING_ES, controls: ['Read the SDS; ventilate when scooping foam or foaming indoors', 'Wear gloves and eye protection with sealant and foam'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'panels_dry_flat', item: 'Load checked against the shop drawings (panel numbers, splines, fasteners); panels stored flat on timbers no more than 6 ft apart, off the ground on a ground cover, and tarped; no swollen or wet skins installed.', item_es: { status: 'translated', text: 'Carga verificada contra los planos de taller (números de panel, lengüetas, sujetadores); paneles almacenados planos sobre maderos a no más de 6 pies, sin tocar el suelo y sobre una cubierta, tapados con lona; no se instalan caras hinchadas o mojadas.' }, prov: basc },
    { id: 'deck_level_square', item: 'Foundation and deck checked level, square and to shop-drawing dimensions before the first panel; deviations resolved with the panel maker.', item_es: { status: 'translated', text: 'Cimentación y piso verificados nivelados, a escuadra y según las medidas del plano de taller antes del primer panel; las desviaciones se resuelven con el fabricante.' }, prov: basc },
    { id: 'sill_break_bearing', item: 'Sill sealer and capillary break / termite shield in place; the outside skin of every panel bears fully on the plate with no overhang.', item_es: { status: 'translated', text: 'Sellador de solera y barrera capilar / antitermitas colocados; la cara exterior de cada panel se apoya completa sobre la placa, sin volado.' }, prov: basc },
    { id: 'sealant_continuous', item: 'Sealant beads continuous at every plate, spline and panel edge — the number of beads the maker details for each joint, unbroken full length.', item_es: { status: 'translated', text: 'Cordones de sellador continuos en cada placa, lengüeta y borde de panel — la cantidad que indica el fabricante para cada junta, sin interrupción en todo el largo.' }, prov: basc },
    { id: 'fasteners_schedule', item: 'Screws or nails through both skins at the type, length and spacing on the maker’s or engineer’s fastening schedule.', item_es: { status: 'translated', text: 'Tornillos o clavos en ambas caras con el tipo, largo y separación del programa de fijación del fabricante o del ingeniero.' }, prov: sipa },
    { id: 'plumb_braced', item: 'Walls plumb, straight and braced before the rigging is released; seams closed tight (lift plates / winch used where needed).', item_es: { status: 'translated', text: 'Muros a plomo, rectos y apuntalados antes de soltar el aparejo; juntas cerradas (con placas de izaje / malacate donde se necesite).' }, prov: basc },
    { id: 'openings_framed', item: 'Site-cut openings: foam recessed, both skins caulked, core foamed, 2x frame nailed through both skins; openings over about 5 ft have an engineered header.', item_es: { status: 'translated', text: 'Vanos cortados en obra: espuma rebajada, ambas caras selladas, núcleo con espuma, marco 2x clavado por ambas caras; vanos de más de unos 5 pies con dintel diseñado por ingeniero.' }, prov: basc },
    { id: 'chase_holes_aligned', item: 'Access holes through plates, splines and floor line up with every vertical wire chase; no plumbing run in exterior SIP walls; boxes and chases foamed after the wire is pulled.', item_es: { status: 'translated', text: 'Los orificios en placas, lengüetas y piso coinciden con cada canal eléctrico vertical; no hay tubería de plomería en muros exteriores SIP; cajas y canales sellados con espuma después de pasar los cables.' }, prov: basc },
    { id: 'seams_taped', item: 'SIP tape applied and rolled at all panel, wall-floor, wall-roof and ridge seams.', item_es: { status: 'translated', text: 'Cinta SIP aplicada y rodillada en todas las juntas de panel, muro-piso, muro-techo y cumbrera.' }, prov: basc },
    { id: 'smoke_test', item: 'Seams checked with a smoke pencil under blower-door depressurization before drywall; leaks sealed and the air-leakage result recorded.', item_es: { status: 'translated', text: 'Juntas revisadas con lápiz de humo bajo despresurización con puerta sopladora antes del panel de yeso; fugas selladas y resultado de fugas registrado.' }, prov: basc },
    { id: 'roof_seams_sealed', item: 'Roof panel seams, ridge and eaves sealed inside and topside as the maker details; no gaps where warm indoor air can reach the roof deck; underlayment on the same day the panels are set.', item_es: { status: 'translated', text: 'Juntas de paneles de techo, cumbrera y aleros selladas por dentro y por arriba según el fabricante; sin huecos por donde el aire cálido interior llegue a la cubierta; membrana bajo teja colocada el mismo día que los paneles.' }, prov: { src: ['panelized_sips-doe-basc-sips', 'panelized_sips-sipa-tech'], confidence: 'derived', last_verified: D, note: 'SIPA durability bulletin and BASC ridge-tape guidance — air leaks at roof seams are the main moisture risk.' } },
    { id: 'wrb_drainage', item: 'Water-resistive barrier lapped shingle-style over the panels, with base-of-wall flashing and sill pans at every opening.', item_es: { status: 'translated', text: 'Barrera resistente al agua traslapada como teja sobre los paneles, con tapajuntas en la base del muro y bandejas en cada vano.' }, prov: basc },
    { id: 'no_unapproved_cuts', item: 'No panel, spline or header cut, notched or resized beyond the shop drawings without written engineer or maker approval.', item_es: PENDING_ES, safety: true, prov: { src: ['panelized_sips-doe-basc-sips', 'panelized_sips-sipa-install'], confidence: 'derived', last_verified: D, note: 'BASC: obtain engineering approval; SIPA: damaged or altered panels assessed by an engineer.' } },
    { id: 'lift_plan', item: 'Lift plan for the crane set: panel and beam weights, rigging, swing-radius barricade, power-line clearance and a qualified signal person.', item_es: PENDING_ES, safety: true, prov: osha('cc') },
    { id: 'thermal_barrier', item: 'Foam-core panels covered on the interior with the required thermal barrier (typically 1/2 in. gypsum board) before occupancy.', item_es: PENDING_ES, safety: true, prov: irc },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Panel layout, sizes and openings match the approved plans and shop drawings', item_es: PENDING_ES, ref: 'R610' },
      { item: 'Splines, plates and fasteners installed per the fastening schedule; headers at openings as detailed', item_es: PENDING_ES, ref: 'R610' },
      { item: 'Point loads carried down to the foundation; ridge beam bearing and connections as drawn', item_es: PENDING_ES },
    ],
    sheathing: [
      { item: 'Water-resistive barrier lapped over the panels; base-of-wall and opening flashing in place', item_es: PENDING_ES, ref: 'R703.2' },
    ],
    roof_dry_in: [
      { item: 'Roof panels fastened to the beam and walls; seams sealed; underlayment installed', item_es: PENDING_ES, ref: 'R905.1.1' },
    ],
    insulation: [
      { item: 'All panel seams taped and sealed; chases and boxes foamed; air barrier continuous', item_es: PENDING_ES, ref: 'N1102.4.1.1' },
      { item: 'Thermal barrier specified over interior foam surfaces before cover', item_es: PENDING_ES, ref: 'R316.4' },
    ],
    final: [
      { item: 'Blower-door air-leakage test result on file and within the adopted energy-code limit', item_es: PENDING_ES, ref: 'N1102.4.1.2' },
    ],
  },
  assemblies: [
    { code: 'B-SIP-WALL-SF', name: 'SIP wall panel, 6-1/2 in. EPS core, supply + set (splines, sealant, screws)', name_es: 'Panel SIP de muro, núcleo EPS 6-1/2 pulg., suministro y montaje (lengüetas, sellador, tornillos)', unit: 'SF', csi: '06 12 00',
      description: 'Per SF of gross exterior wall panel set. Equipment is a telehandler / small-crane share.',
      material_cost_cents: { v: 700, prov: est('6-1/2 in. OSB/EPS wall panel + splines + sealant + screws, national baseline 2026; varies widely by maker and region') }, labor_hours_per_unit: { v: 0.05, prov: est('4-person crew setting, splining, fastening and bracing ≈ 600–700 SF/day') },
      equipment_cost_cents: { v: 30, prov: est('telehandler / crane day share spread over the wall area') }, waste_pct: { v: 3, prov: est('factory-cut panels — field waste is splines and trims only') } },
    { code: 'B-SIP-ROOF-SF', name: 'SIP roof panel, 10-1/4 in. EPS core, supply + set (splines, sealant, long panel screws)', name_es: 'Panel SIP de techo, núcleo EPS 10-1/4 pulg., suministro y montaje (lengüetas, sellador, tornillos largos)', unit: 'SF', csi: '06 12 00',
      description: 'Per SF of roof panel (slope area). Ridge beam and roofing are separate.',
      material_cost_cents: { v: 900, prov: est('10-1/4 in. OSB/EPS roof panel + splines + sealant + panel screws, national baseline 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('crane-set crew flying, fastening and sealing roof panels') },
      equipment_cost_cents: { v: 70, prov: est('crane day share over a typical house roof') }, waste_pct: { v: 5, prov: est('eave/rake trims and field adjustments') } },
    { code: 'B-SIP-TAPE-LF', name: 'SIP seam tape at panel, wall-floor, wall-roof and ridge joints, installed', name_es: 'Cinta SIP en juntas de panel, muro-piso, muro-techo y cumbrera, instalada', unit: 'LF', csi: '07 27 00',
      material_cost_cents: { v: 70, prov: est('6 in. peel-and-stick SIP tape, national baseline 2026') }, labor_hours_per_unit: { v: 0.015, prov: est('apply and roll from a ladder or lift') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('laps and corner pieces') } },
    { code: 'B-SIP-SILL-LF', name: 'SIP sill prep: sill sealer, capillary break / termite flashing, treated sill and bottom plate', name_es: 'Preparación de solera SIP: sellador, barrera capilar / antitermitas, solera tratada y placa inferior', unit: 'LF', csi: '06 12 00',
      material_cost_cents: { v: 450, prov: est('treated 2x sill + 2x bottom plate + sill sealer + flashing strip, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('level, drill anchors, set sill and bottom plate per LF') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 8, prov: est('cut-offs at corners and openings') } },
  ],
  quantity_rules: [
    { code: 'B-SIP-WALL-SF', assumption: 'Exterior SIP wall area ≈ 0.8 × scheduled floor area (one story, 9 ft walls) — replace with the panel takeoff from the shop drawings', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.8, round: 'ceil' } },
    { code: 'B-SIP-ROOF-SF', assumption: 'SIP roof slope area ≈ 1.15 × scheduled floor area — remove if the roof is trussed or framed', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 1.15, round: 'ceil' } },
    { code: 'B-SIP-TAPE-LF', assumption: 'Seam tape ≈ 0.35 LF per SF of floor (top + bottom wall joints, vertical seams, ridge and eaves) — confirm from the shop drawings', when: { building_types: ['residential_sf', 'residential_mf'] }, qty: { basis: 'area_sf_sum', mul: 0.35, round: 'ceil' } },
    { code: 'B-SIP-SILL-LF', assumption: 'Sill length ≈ exterior perimeter ≈ 0.09 LF per SF of a ~2,000 SF footprint — measure the foundation plan', when: { building_types: ['residential_sf'] }, qty: { basis: 'area_sf_sum', mul: 0.09, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['concrete'], before_phase: 'roofing', note: 'SIP walls and roof go on a level, square foundation/deck and must be dried in before roofing finishes.' },
  ],
});
