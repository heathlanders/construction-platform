// Trade Knowledge Pack — metal_panels (Architectural Metal Panels / ACM / Rainscreen). Wave 09 — NEW-TRADE
// pattern (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/metal_panels.md.
// Scope: architectural wall cladding — ACM/MCM rainscreen, insulated metal panels (IMP), exposed-fastener
// steel siding — on any building. NOT the metal building system's own roof/wall sheeting (pemb pack,
// B-PEMB-*) or post-frame steel skin (post_frame pack). Sources: UFGS 07 42 13 / 07 42 63, MCA (MCM, IMP),
// manufacturer processing manual, 29 CFR 1926 (M, L, CC, E, I, H, D, K, X), IBC/IRC/IECC + NFPA 285 (ref only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['metal_panels-ufgs-07-42-13'], confidence: 'verified' as const, last_verified: D };
const ufgsFab = { src: ['metal_panels-ufgs-07-42-13', 'metal_panels-ufgs-07-42-63'], confidence: 'verified' as const, last_verified: D };
const mcm = { src: ['metal_panels-mca-mcm', 'metal_panels-alucobond-processing'], confidence: 'derived' as const, last_verified: D, note: 'Common practice in fabricator/manufacturer instructions — follow the approved shop drawings for the system installed.' };
const film = { src: ['metal_panels-alucobond-processing', 'metal_panels-ufgs-07-42-13'], confidence: 'verified' as const, last_verified: D };
const imp = { src: ['metal_panels-mca-imp', 'metal_panels-ufgs-07-42-13'], confidence: 'derived' as const, last_verified: D, note: 'IMP joints carry the air/vapor seal — follow the panel maker’s joint and sealant details.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const nfpa = { src: ['nfpa-fa', 'icc-pa'], confidence: 'verified' as const, last_verified: D, note: 'NFPA 285 is a fire test standard referenced by the IBC — test reports come from the panel/system maker.' };

const PANEL_RE = 'metal\\s+(?:wall\\s+)?panels?|\\bacm\\b|\\bmcm\\b|composite\\s+(?:metal\\s+)?panels?|rain\\s?screen|insulated\\s+metal|\\bimps?\\b|metal\\s+siding|steel\\s+siding|metal\\s+cladding';
const ACM_RE = '\\bacm\\b|\\bmcm\\b|composite\\s+(?:metal\\s+)?panels?|rain\\s?screen';

export default definePack({
  key: 'metal_panels',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs architectural metal wall cladding — ACM/MCM rainscreen systems, insulated metal panels and exposed-fastener steel siding — including subframing with thermal clips, the WRB/air barrier behind it, panel sequence and fastening, trims and flashing at openings, sealant joints and protective-film removal. Metal building system sheeting belongs to the PEMB scope.',
    summary_es: 'Instala revestimiento metálico arquitectónico — sistemas de fachada ventilada de ACM/MCM, paneles metálicos aislados y lámina de acero con fijación expuesta — con subestructura y clips térmicos, barrera WRB/de aire, fijación de paneles, molduras y tapajuntas en vanos, juntas selladas y retiro de la película. La lámina de edificios PEMB es otro alcance.',
    glossary: [
      { term: 'ACM / MCM', term_es: 'ACM / MCM (material compuesto de aluminio)', def: 'Two thin metal skins bonded to a solid core, routed and folded into trays that hang on the wall.', def_es: 'Dos láminas metálicas delgadas pegadas a un núcleo sólido, ruteadas y dobladas en bandejas que se cuelgan en el muro.' },
      { term: 'Rainscreen', term_es: 'Fachada ventilada', def: 'Cladding hung off the wall with an air gap behind it so water that gets past the panel drains and dries out.', def_es: 'Revestimiento separado del muro con una cámara de aire detrás para que el agua que pase drene y se seque.' },
      { term: 'Insulated metal panel (IMP)', term_es: 'Panel metálico aislado (IMP)', def: 'Factory panel with a foam core between two steel skins; one layer gives cladding, insulation and air barrier.', def_es: 'Panel de fábrica con núcleo de espuma entre dos láminas de acero; una sola capa da revestimiento, aislamiento y barrera de aire.' },
      { term: 'Subgirt / Z-girt', term_es: 'Larguero secundario / perfil Z', def: 'Light steel rails fastened to the wall that the panels attach to.', def_es: 'Rieles de acero liviano fijados al muro a los que se sujetan los paneles.' },
      { term: 'Thermal clip', term_es: 'Clip térmico', def: 'Bracket with a thermal break that holds the rails off the wall so the insulation runs continuous behind them.', def_es: 'Soporte con corte térmico que separa los rieles del muro para que el aislamiento sea continuo detrás.' },
      { term: 'Protective film', term_es: 'Película protectora', def: 'Peel-off plastic on the panel face; its arrows show install direction and it must come off soon after install.', def_es: 'Plástico desprendible en la cara del panel; sus flechas indican la dirección de instalación y debe retirarse poco después de instalar.' },
      { term: 'Closure', term_es: 'Cierre (closure)', def: 'Foam or metal strip that fills the ribs of a profiled panel at the top and bottom to block water, air and pests.', def_es: 'Tira de espuma o metal que rellena las costillas del panel perfilado arriba y abajo para bloquear agua, aire y plagas.' },
      { term: 'Reveal joint', term_es: 'Junta de revelado', def: 'The open or sealed gap between panels that sets the façade pattern.', def_es: 'La separación abierta o sellada entre paneles que define el patrón de la fachada.' },
      { term: 'NFPA 285', term_es: 'NFPA 285', def: 'Large-scale fire test that wall assemblies with combustible parts must pass on taller, non-combustible-type buildings.', def_es: 'Prueba de fuego a gran escala que deben pasar los muros con componentes combustibles en edificios de construcción no combustible más altos.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'metal_wall_panels',
      example_title: 'Install metal wall panels',
      when: { title_re: PANEL_RE },
      steps: [
        {
          title: 'Check the wall and the panel layout',
          instruction: 'Walk the wall with the approved shop drawings: framing and sheathing within the panel maker’s tolerance, sheathing joints backed, and every penetration (vents, lights, hose bibs) located against the panel joints before anything is hung. Land panel bundles on blocking near the work, keep them dry and sloped to drain, and strap them down — wind lifts loose sheets.',
          tools: ['tape measure', 'string line', 'level', 'telehandler or forklift'],
          materials: ['approved shop drawings', 'dunnage', 'ratchet straps'],
          safety_ids: ['wind_storage', 'sheet_edges'],
          qa_ids: ['substrate_tolerance', 'penetrations_vs_joints'],
        },
        {
          title: 'Install the WRB / air barrier and subframing',
          instruction: 'Lap the WRB or air-barrier membrane shingle-style, tape seams and tie it into the window and door flashings. Lay out clip and rail lines from the shop drawings, set thermal clips at the spacing shown, fit the continuous insulation tight between them, and fasten the girts or hat channels plumb and in plane. Leave it open for the sheathing / WRB inspection.',
          tools: ['laser level', 'drill/driver', 'chalk line', 'J-roller'],
          materials: ['WRB or fluid/sheet air barrier', 'seam tape', 'thermal clips', 'galvanized Z-girts or hat channels', 'continuous insulation board', 'corrosion-resistant fasteners'],
          safety_ids: ['edge_fall', 'scaffold_fall', 'aerial_lift', 'power_tool'],
          qa_ids: ['wrb_lapped', 'subframe_plane', 'ci_continuous'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: '1404.4', code_type: 'IBC', note: 'Flashing at wall openings and penetrations' }, { section: 'C402.5', code_type: 'IECC', note: 'Continuous air barrier in the commercial envelope' }],
        },
        {
          title: 'Hang and fasten the panels',
          instruction: 'Start where the drawings show, keep the first course dead level and work in the panel’s lap direction. Set full-length panels plumb and aligned with the building lines, fasten with the type, size and spacing shown — straight, snug, washers seated, never overdriven. Separate dissimilar metals, cut with shears or a saw, never a torch, and seal side laps or joints as detailed.',
          detail: 'Insulated panels: seat each tongue fully and keep the factory joint sealant continuous — it is the air and vapor seal.',
          tools: ['screw gun with depth-sensing nose', 'panel lifting clamps', 'shears or circular saw with metal blade', 'level'],
          materials: ['metal wall panels', 'panel fasteners with sealing washers', 'closures', 'joint sealant / tape sealant', 'isolation tape'],
          safety_ids: ['edge_fall', 'aerial_lift', 'sheet_edges', 'falling_objects', 'eye_flying', 'noise'],
          qa_ids: ['plumb_aligned', 'fasteners_seated', 'dissimilar_metals', 'imp_joint_seal'],
        },
        {
          title: 'Trim and flash openings, corners and ends',
          instruction: 'Install sill, jamb and head trims so every piece laps over the one below, with a hemmed drip edge at heads and sills. Set closures at the top and bottom of profiled panels and at openings, bed exposed flashing in sealant, and leave expansion room at trim joints. Seal around penetrations with the maker’s boots or collars.',
          tools: ['hand seamer', 'shears', 'caulk gun', 'pop-rivet tool'],
          materials: ['formed trims and flashings matching the panel finish', 'foam or metal closures', 'butyl tape / sealant', 'pop rivets'],
          safety_ids: ['edge_fall', 'sheet_edges', 'ladder'],
          qa_ids: ['trim_lap_drip'],
          code_refs: [{ section: '1404.4', code_type: 'IBC', note: 'Flashing at wall openings and penetrations' }, { section: 'R703.4', code_type: 'IRC', note: 'Flashing — residential wall openings' }],
        },
        {
          title: 'Seal joints, pull film, clean and close out',
          instruction: 'Tool sealant joints over backer rod where the system uses sealed joints. Pull the protective film from each finished elevation as soon as it is complete — never in cold weather and never in patches — then wear clean gloves on the bare finish. Touch up scratches with the maker’s repair paint, sweep metal shavings off every surface, and hand over the fire-test and warranty documents for the final.',
          tools: ['caulk gun', 'jointing tool', 'soft cloths', 'magnet sweeper'],
          materials: ['backer rod', 'joint sealant', 'touch-up paint'],
          safety_ids: ['aerial_lift', 'chem_sealant'],
          qa_ids: ['sealant_joints', 'film_removed', 'nfpa285_listed'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '1402.5', code_type: 'IBC', note: 'Vertical and lateral flame propagation — combustible wall components' }, { section: '285', code_type: 'NFPA', note: 'Fire test of exterior wall assemblies with combustible components' }],
        },
      ],
    },
    {
      id: 'acm_rainscreen',
      example_title: 'Install ACM rainscreen panels',
      priority: 10,
      when: { title_re: ACM_RE },
      steps: [
        {
          title: 'Confirm the fire-tested assembly and shop drawings',
          instruction: 'Before material ships, match the panel core, insulation, WRB and attachment system against the fire-test report and approved shop drawings — a substitute in any layer can void it. Check the fabricated trays against the panel schedule and confirm the film arrows all run the same way.',
          tools: ['shop drawings', 'panel schedule'],
          materials: ['fire-test / code evaluation report', 'fabricated ACM trays'],
          safety_ids: ['sheet_edges'],
          qa_ids: ['nfpa285_listed', 'film_direction'],
          code_refs: [{ section: '1402.5', code_type: 'IBC', note: 'Vertical and lateral flame propagation — combustible wall components' }, { section: '2603.5', code_type: 'IBC', note: 'Foam plastic insulation in Type I–IV exterior walls' }],
        },
        {
          title: 'Air barrier, clips and rails',
          instruction: 'Complete and inspect the air barrier and its tie-ins at openings first. Set thermal clips and vertical/horizontal rails to the layout lines, shimming to bring the rail face into one plane, and install the fire-stopping or cavity barriers the drawings show at floor lines.',
          tools: ['laser level', 'drill/driver', 'string line'],
          materials: ['thermal clips', 'aluminum or galvanized rails', 'continuous insulation', 'cavity / fire barriers as detailed'],
          safety_ids: ['edge_fall', 'aerial_lift', 'scaffold_fall', 'power_tool'],
          qa_ids: ['subframe_plane', 'ci_continuous', 'wrb_lapped'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: 'C402.5', code_type: 'IECC', note: 'Continuous air barrier in the commercial envelope' }],
        },
        {
          title: 'Hang the trays in sequence',
          instruction: 'Hang trays on their clips or pins in the order the drawings number them, keeping film arrows the same way on every elevation. Hold reveal joints even with spacers, leave the drainage path at the base and heads open, and fasten with the specified rivets or screws without crushing the tray.',
          tools: ['reveal spacers', 'rivet tool', 'drill/driver', 'level'],
          materials: ['ACM trays', 'stainless fasteners or rivets', 'joint extrusions or sealant per system'],
          safety_ids: ['edge_fall', 'aerial_lift', 'falling_objects', 'wind_storage', 'suspended_load'],
          qa_ids: ['film_direction', 'drainage_open', 'plumb_aligned'],
        },
        {
          title: 'Trims, sealant and film removal',
          instruction: 'Install head, sill and corner trims lapped to drain, seal the joints the system calls to be sealed, then pull the protective film elevation by elevation as soon as it is complete — never in cold weather, never in patches. Clean, touch up and hand over the warranty and fire-test documents.',
          tools: ['caulk gun', 'soft cloths'],
          materials: ['trims', 'sealant', 'backer rod'],
          safety_ids: ['aerial_lift', 'chem_sealant'],
          qa_ids: ['trim_lap_drip', 'film_removed'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    sheathing: [
      { section: '1404.4', code_type: 'IBC', note: 'Flashing at wall openings and penetrations, lapped to drain outward', prov: icc },
      { section: '1402.2', code_type: 'IBC', note: 'Weather protection — exterior wall envelope with a WRB and drainage', prov: icc },
      { section: 'C402.5', code_type: 'IECC', note: 'Continuous air barrier in the commercial building envelope', prov: icc },
      { section: 'R703.4', code_type: 'IRC', note: 'Flashing at residential wall openings and penetrations', prov: icc },
    ],
    final: [
      { section: '1402.5', code_type: 'IBC', note: 'Vertical and lateral flame propagation for walls with combustible components', prov: icc },
      { section: '2603.5', code_type: 'IBC', note: 'Foam plastic in exterior walls of Type I–IV construction', prov: icc },
      { section: '285', code_type: 'NFPA', note: 'Fire test method for exterior non-load-bearing wall assemblies', prov: nfpa },
    ],
  },
  equipment: [
    { when: { title_re: PANEL_RE }, type: 'boom_lift', reason: 'Reach panel, rail and trim work at height from a guarded platform' },
    { when: { title_re: PANEL_RE, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'telehandler', reason: 'Unload and stage panel bundles and lift long insulated panels', optional: true },
    { when: { title_re: 'insulated\\s+metal|\\bimps?\\b', building_types: ['commercial', 'industrial'] }, type: 'crane', reason: 'Set long, heavy insulated metal panels with vacuum lifters on large walls', optional: true },
    { when: { title_re: PANEL_RE }, type: 'scissor_lift', reason: 'Low-level rail, trim and sealant work on slab-level elevations', optional: true },
  ],
  hazards: [
    { id: 'edge_fall', hazard: 'Fall from a wall edge, floor edge or roof edge while working panels', hazard_es: PENDING_ES, controls: ['Guardrails, safety net or personal fall arrest at 6 ft or more above a lower level', 'Plan anchorages before work at the edge starts'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness + lanyard when required'], prov: osha('m') },
    { id: 'scaffold_fall', hazard: 'Fall from scaffold while installing rails and panels', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on scaffolds over 10 ft', 'Fully plank the platform; keep the scaffold tied as panels go on'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from an aerial lift basket', hazard_es: PENDING_ES, controls: ['Harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never climb the rails or step off onto the wall'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'sheet_edges', hazard: 'Deep cuts from panel edges, cut ends and metal slivers', hazard_es: PENDING_ES, controls: ['Cut-resistant gloves and sleeves when handling and cutting panels', 'Carry long panels on edge with two people'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['cut-resistant gloves', 'sleeves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from hot metal chips and swarf while cutting and drilling', hazard_es: PENDING_ES, controls: ['Safety glasses (face shield with a saw) while cutting, drilling and fastening'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses', 'face shield'], prov: osha('e') },
    { id: 'falling_objects', hazard: 'Panels, trims and tools falling on people below', hazard_es: PENDING_ES, controls: ['Barricade and keep people out of the area below overhead work', 'Tether tools; keep loose material off lift platforms'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'wind_storage', hazard: 'Wind lifting and throwing stored or partly fastened panels', hazard_es: PENDING_ES, controls: ['Strap, block or weight stacked bundles', 'Stop panel handling in high wind; fasten what is hung before leaving'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'suspended_load', hazard: 'Struck or crushed by a panel lifted by crane or telehandler', hazard_es: PENDING_ES, controls: ['Nobody in the fall zone of a suspended panel except those guiding it', 'Use tag lines and a qualified rigger and signal person'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, prov: osha('cc') },
    { id: 'power_tool', hazard: 'Saw and drill injuries cutting metal panels and rails', hazard_es: PENDING_ES, controls: ['Keep guards in place; use the blade made for metal', 'Clamp or support the work'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'gloves'], prov: osha('i') },
    { id: 'noise', hazard: 'Hearing damage from metal saws and screw guns', hazard_es: PENDING_ES, controls: ['Hearing protection when cutting metal or when noise is above the action level'], controls_es: PENDING_ES, osha_ref: '1926.52', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while trimming low elevations', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it reaches', 'Firm footing, three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'chem_sealant', hazard: 'Skin, eye and breathing irritation from sealants, primers and cleaners', hazard_es: PENDING_ES, controls: ['Read the SDS; ventilate', 'Gloves and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'substrate_tolerance', item: 'Framing and sheathing checked and within the panel maker’s flatness and alignment tolerance before any rail goes on; sheathing joints backed.', item_es: { status: 'translated', text: 'Estructura y entablado revisados y dentro de la tolerancia de planitud y alineación del fabricante antes de colocar rieles; juntas del entablado respaldadas.' }, prov: ufgs },
    { id: 'penetrations_vs_joints', item: 'Every wall penetration located against the panel joint layout before hanging, so no penetration lands in a seam.', item_es: { status: 'translated', text: 'Cada penetración del muro ubicada contra el trazo de juntas antes de colgar, para que ninguna caiga en una costura.' }, prov: ufgs },
    { id: 'wrb_lapped', item: 'WRB / air barrier lapped shingle-style, seams taped and tied into window, door and penetration flashings before cladding covers it.', item_es: { status: 'translated', text: 'WRB / barrera de aire traslapada como teja, juntas encintadas y unida a los tapajuntas de ventanas, puertas y penetraciones antes de cubrirla.' }, prov: { src: ['metal_panels-ufgs-07-42-13', 'doe-basc-win-flashed'], confidence: 'derived', last_verified: D } },
    { id: 'subframe_plane', item: 'Clips and rails at the spacing on the shop drawings, rail face in one plane and plumb within the system tolerance.', item_es: { status: 'translated', text: 'Clips y rieles a la separación de los planos de taller, cara de rieles en un mismo plano y aplomada dentro de la tolerancia del sistema.' }, prov: ufgsFab },
    { id: 'ci_continuous', item: 'Continuous insulation fitted tight around clips with no open gaps; only the clips break it.', item_es: { status: 'translated', text: 'Aislamiento continuo ajustado alrededor de los clips sin huecos; solo los clips lo interrumpen.' }, prov: { src: ['doe-basc'], confidence: 'derived', last_verified: D, note: 'Continuous-insulation practice; thermal clips limit bridging through the insulation layer.' } },
    { id: 'plumb_aligned', item: 'Panels plumb, true to building lines, full length where shown, with no buckles, waves or ripples and a uniform module.', item_es: { status: 'translated', text: 'Paneles aplomados, alineados con las líneas del edificio, de largo completo donde se indica, sin abolladuras ni ondas y con módulo uniforme.' }, prov: ufgs },
    { id: 'fasteners_seated', item: 'Fastener type, size and spacing as shown; driven straight, washers seated, not overdriven; no torch-cut or damaged panels installed.', item_es: { status: 'translated', text: 'Tipo, tamaño y separación de sujetadores según planos; colocados rectos, arandelas asentadas, sin sobreapretar; ningún panel cortado con soplete o dañado instalado.' }, prov: ufgs },
    { id: 'dissimilar_metals', item: 'Dissimilar metals and corrosive substrates separated with coating, membrane or isolator as the maker recommends.', item_es: { status: 'translated', text: 'Metales disímiles y sustratos corrosivos separados con recubrimiento, membrana o aislante según el fabricante.' }, prov: ufgs },
    { id: 'imp_joint_seal', item: 'Insulated panel joints fully engaged with the factory or field sealant continuous along every joint.', item_es: { status: 'translated', text: 'Juntas de paneles aislados totalmente encajadas con el sellador de fábrica o de obra continuo en cada junta.' }, prov: imp },
    { id: 'trim_lap_drip', item: 'Trims lapped to drain with a hemmed drip at heads and sills, exposed flashing bedded in sealant, expansion room at joints; closures at top and bottom of profiled panels.', item_es: { status: 'translated', text: 'Molduras traslapadas para drenar con gotero doblado en cabezales y alféizares, tapajuntas expuesto asentado en sellador, holgura de dilatación en juntas y cierres arriba y abajo de paneles perfilados.' }, prov: ufgs },
    { id: 'film_direction', item: 'Protective-film arrows run the same way on every panel of an elevation (color and sheen match).', item_es: { status: 'translated', text: 'Las flechas de la película protectora van en la misma dirección en cada panel de una fachada (color y brillo uniformes).' }, prov: film },
    { id: 'drainage_open', item: 'Rainscreen cavity vented and drained at the base and at each horizontal interruption; no sealant or debris blocking it; reveals even and straight.', item_es: { status: 'translated', text: 'Cámara de fachada ventilada y drenada en la base y en cada interrupción horizontal, sin sellador ni basura que la bloquee; revelados parejos y rectos.' }, prov: mcm },
    { id: 'sealant_joints', item: 'Sealed joints over backer rod, tooled, full adhesion on both sides, no voids.', item_es: { status: 'translated', text: 'Juntas selladas sobre cordón de respaldo, alisadas, con adherencia completa a ambos lados y sin vacíos.' }, prov: ufgs },
    { id: 'film_removed', item: 'Protective film fully removed from each completed elevation soon after install, not in cold weather or in patches; shavings swept off, finish clean.', item_es: { status: 'translated', text: 'Película protectora retirada completamente de cada fachada terminada poco después de instalar, no en clima frío ni por partes; virutas barridas y acabado limpio.' }, prov: film },
    { id: 'nfpa285_listed', item: 'Installed core, insulation, WRB and attachment match the fire-tested (NFPA 285) assembly on file where the code requires it.', item_es: PENDING_ES, safety: true, prov: nfpa },
  ],
  inspection_checklists: {
    sheathing: [
      { item: 'WRB / air barrier continuous, lapped and taped; tied into opening flashings', item_es: PENDING_ES, ref: '1402.2' },
      { item: 'Opening and penetration flashings in place before cladding', item_es: PENDING_ES, ref: '1404.4' },
      { item: 'Continuous insulation and thermal clips installed per the approved drawings', item_es: PENDING_ES, ref: 'C402.5' },
    ],
    final: [
      { item: 'Wall assembly matches the fire-tested assembly / evaluation report on file', item_es: PENDING_ES, ref: '1402.5' },
      { item: 'Fire or cavity barriers at floor lines in the rainscreen cavity where shown', item_es: PENDING_ES },
      { item: 'Trims, closures and sealant joints complete; protective film removed', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-MP-ACM-RS-SF', name: 'ACM/MCM rainscreen system, fabricated trays + attachment extrusions, supply + install, per SF wall', name_es: 'Fachada ventilada ACM/MCM, bandejas fabricadas + perfiles, suministro e instalación, por pie² de muro', unit: 'SF', csi: '07 42 43',
      description: 'Panel system only — subframing/clips, air barrier and trims are separate lines.',
      material_cost_cents: { v: 2800, prov: est('fabricated 4 mm FR-core ACM trays + extrusions, national baseline 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('layout, hang, fasten and reveal-set per SF') },
      equipment_cost_cents: { v: 150, prov: est('boom lift share per SF') }, waste_pct: { v: 8, prov: est('fabrication drop + damaged trays') } },
    { code: 'B-MP-IMP-WALL-SF', name: 'Insulated metal wall panel, ~3 in. foam core, concealed fastener, supply + install, per SF wall', name_es: 'Panel metálico aislado de muro, núcleo de espuma ~3 pulg., fijación oculta, suministro e instalación, por pie² de muro', unit: 'SF', csi: '07 42 13',
      material_cost_cents: { v: 1800, prov: est('mid-grade 3 in. IMP with clips and joint sealant, national baseline 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('long panels set from a lift — one pass gives cladding + insulation + air seal') },
      equipment_cost_cents: { v: 100, prov: est('boom lift / telehandler share per SF') }, waste_pct: { v: 5, prov: est('panels ordered to length; trims and cut-offs') } },
    { code: 'B-MP-STEEL-EXP-SF', name: 'Exposed-fastener steel wall panel (ribbed/corrugated, painted 26–29 ga), supply + install, per SF wall', name_es: 'Panel de acero de muro, fijación expuesta (acanalado, pintado cal. 26–29), suministro e instalación, por pie²', unit: 'SF', csi: '07 42 13',
      description: 'Architectural steel siding over girts or furring — not metal-building-system sheeting (B-PEMB-*).',
      material_cost_cents: { v: 350, prov: est('painted ribbed steel panel + fasteners + closures, national baseline 2026') }, labor_hours_per_unit: { v: 0.04, prov: est('screw-fastened sheets over girts') },
      equipment_cost_cents: { v: 25, prov: est('lift share') }, waste_pct: { v: 8, prov: est('end cuts and opening cut-outs') } },
    { code: 'B-MP-SUBFRAME-SF', name: 'Panel subframing — thermal clips + galvanized Z-girts / hat channels, per SF wall', name_es: 'Subestructura de paneles — clips térmicos + perfiles Z / omega galvanizados, por pie² de muro', unit: 'SF', csi: '05 41 00',
      description: 'Excludes the continuous-insulation board itself.',
      material_cost_cents: { v: 450, prov: est('thermal clips at ~16–24 in. o.c. + light-gauge rails + fasteners, 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('layout, clip and rail per SF') },
      equipment_cost_cents: { v: 50, prov: est('lift share') }, waste_pct: { v: 5, prov: est('rail cut-offs') } },
    { code: 'B-MP-TRIM-LF', name: 'Formed metal panel trim / flashing (sill, jamb, head, corner), per LF', name_es: 'Moldura / tapajuntas metálico formado para paneles (alféizar, jamba, cabezal, esquina), por pie lineal', unit: 'LF', csi: '07 62 00',
      material_cost_cents: { v: 600, prov: est('break-formed prefinished trim + sealant + rivets, 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('fit, lap, seal and fasten per LF') },
      equipment_cost_cents: { v: 0, prov: est('hand tools; lift covered by panel lines') }, waste_pct: { v: 10, prov: est('laps and miters') } },
  ],
  quantity_rules: [
    { code: 'B-MP-TRIM-LF', assumption: 'Metal wall panels called out — ≈16 LF of sill/jamb/head trim per scheduled window (add door trims by takeoff)', when: { facts_any: ['metal_siding'] }, qty: { basis: 'windows', mul: 16, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['framing', 'windows', 'air_barrier'], before_phase: 'punch', note: 'Panels go on after framing/sheathing, windows and the air barrier are in and inspected; film comes off before punch.' },
  ],
});
