// Trade Knowledge Pack — concrete_cutting (Concrete Cutting / Coring — flat/slab sawing, core drilling, wall
// sawing, wire sawing). Wave 08, NEW-TRADE pattern without a permit path (permit_trade null): no gates, no
// code_refs — the hold points (scan before cut, structural approval, slurry plan) live in inspection_checklists.
// Existing B-FLAT-SAWCUT-LF (control joints in new flatwork) and B-CFW-CURBCUT-LF (curb-cut removal) are NOT
// redeclared — this pack prices cutting EXISTING structural concrete. Dossier:
// docs/trade-packs/dossiers/concrete_cutting.md. Sources: 29 CFR 1926.1153 Table 1 (entries ii, iv, vi, vii, x),
// 1926 Subparts C/E/H/I/K/M/T, UFGS 02 41 00 §1.3/§3.1.7, CSDA (GPR best practices BP-007/BP-026, by title only),
// WisDOT/WDNR concrete slurry fact sheet (Jul 2026), MPCA slurry guidance, 811.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const silica = (note?: string) => osha('z', note);
const ufgs = (note?: string) => ({ src: ['demolition-ufgs-02-41-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const csda = (note?: string) => ({ src: ['concrete_cutting-csda', 'concrete_cutting-csda-standards'], confidence: 'derived' as const, last_verified: D, ...(note ? { note } : {}) });
const slurry = (note?: string) => ({ src: ['concrete_cutting-wisdot-slurry', 'concrete_cutting-mpca-slurry'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'concrete_cutting',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Cuts and drills existing concrete with diamond tools — slab sawing for trenches and openings, core holes for pipe and conduit, wall sawing for doors and windows, wire sawing for thick sections. Scans for rebar, PT tendons and conduit first, works from engineer-approved layouts, controls silica with water, and captures the slurry.',
    summary_es: 'Corta y perfora concreto existente con diamante: corte de losas para zanjas y aberturas, núcleos para tubería y conduit, corte de muros para puertas y ventanas, corte con hilo para piezas gruesas. Primero escanea varilla, cables postensados y conduit, trabaja con trazos aprobados por el ingeniero, controla la sílice con agua y recoge el lodo.',
    glossary: [
      { term: 'Flat saw (slab saw)', term_es: 'Cortadora de piso (sierra de losa)', def: 'Walk-behind or ride-on saw that cuts floors, slabs and pavement from above.', def_es: 'Sierra que se empuja o se maneja y corta pisos, losas y pavimento desde arriba.' },
      { term: 'Wall saw (track saw)', term_es: 'Sierra de muro (sierra de riel)', def: 'Saw that runs on a track bolted to a wall or slab and cuts straight, deep openings.', def_es: 'Sierra que corre sobre un riel anclado al muro o a la losa y hace cortes rectos y profundos.' },
      { term: 'Wire saw', term_es: 'Sierra de hilo', def: 'Diamond-beaded cable pulled around the concrete to cut very thick or odd-shaped sections.', def_es: 'Cable con perlas de diamante que se jala alrededor del concreto para cortar piezas muy gruesas o de forma irregular.' },
      { term: 'Core drill (core rig)', term_es: 'Perforadora de núcleos', def: 'Drill with a hollow diamond bit, anchored to the surface, that cuts round holes and removes a solid plug.', def_es: 'Taladro con broca hueca de diamante, anclado a la superficie, que hace agujeros redondos y saca un tapón sólido.' },
      { term: 'GPR scan', term_es: 'Escaneo con georradar (GPR)', def: 'Ground-penetrating radar used to find rebar, tendons, conduit and pipe inside concrete before cutting; marks are drawn on the surface.', def_es: 'Radar que penetra el concreto para encontrar varilla, cables, conduit y tubería antes de cortar; las marcas se dibujan en la superficie.' },
      { term: 'Post-tension (PT) tendon', term_es: 'Cable postensado (PT)', def: 'High-strength steel strand stressed inside a slab; cutting one releases stored energy and weakens the slab.', def_es: 'Torón de acero de alta resistencia tensado dentro de la losa; cortarlo libera energía acumulada y debilita la losa.' },
      { term: 'Overcut', term_es: 'Sobrecorte', def: 'Extra length a round blade cuts past a corner so the piece comes free; must be approved or avoided by finishing with a core or hand saw.', def_es: 'Largo extra que corta un disco redondo más allá de la esquina para soltar la pieza; debe aprobarse o evitarse terminando con núcleo o sierra de mano.' },
      { term: 'Slurry', term_es: 'Lodo de corte', def: 'Gray water and fine concrete dust from wet cutting; it is caustic and must be captured, not washed into drains.', def_es: 'Agua gris con polvo fino de concreto que sale del corte en húmedo; es cáustica y debe recogerse, no lavarse al drenaje.' },
      { term: 'Stitch drilling', term_es: 'Perforación en costura', def: 'Overlapping core holes in a line to make an opening where a saw cannot reach.', def_es: 'Núcleos traslapados en línea para hacer una abertura donde no llega la sierra.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'core_drilling',
      priority: 2,
      example_title: 'Core drill slab penetrations for plumbing and electrical',
      when: { title_re: 'core ?drill|coring|\\bcores?\\b|core holes?|penetrations? through (?:the )?(?:slab|wall|deck)' },
      steps: [
        {
          title: 'Confirm hole locations and scan before drilling',
          instruction: 'Get the hole list with sizes and locations from the trade that needs them, and get the engineer\'s OK for any hole through a beam, column, joist or post-tensioned slab. Lay out each center, then have the area scanned (GPR or X-ray) and marked for rebar, tendons, conduit and pipe. Shift any hole that lands on a tendon or live conduit — never drill through one.',
          detail: 'Ask the owner for as-built and PT shop drawings. A scan has limits: dense steel, wet concrete and metal deck can hide things — if the operator is unsure, stop and ask.',
          tools: ['tape', 'marking crayon', 'GPR scanner (scan crew)'],
          materials: ['marking paint', 'layout drawings'],
          safety_ids: ['embedded_electrical', 'pt_tendon_structure'],
          qa_ids: ['scan_marked', 'structural_ok', 'layout_checked'],
        },
        {
          title: 'Set up the rig, water and protection below',
          instruction: 'Anchor or vacuum-base the core rig square to the surface per the maker. Run water to the bit and set a wet vac or slurry ring to catch the runoff. Plug the tool into a GFCI-protected outlet or cord. Before drilling through a floor, barricade and post the space below so nobody is under the hole when the core drops.',
          tools: ['core rig with anchor or vacuum base', 'wet vacuum or slurry ring', 'GFCI cord set'],
          materials: ['wedge anchors', 'plastic sheeting', 'barricade tape'],
          safety_ids: ['wet_electrical', 'struck_by_cut_piece', 'silica_coring'],
          qa_ids: ['slurry_captured', 'below_protected'],
        },
        {
          title: 'Drill wet and remove the core',
          instruction: 'Drill with continuous water at the speed the bit maker calls for, keeping steady feed pressure. If the bit hits steel that was not on the scan, stop and check with the super before going on. Catch or retrieve the core as it breaks free, then vacuum up the slurry while it is still wet.',
          tools: ['diamond core bit', 'wet vacuum'],
          materials: ['water supply'],
          safety_ids: ['silica_coring', 'saw_guard_kickback', 'slurry_skin'],
          qa_ids: ['silica_controls', 'holes_clean'],
        },
        {
          title: 'Clean up and hand off the holes',
          instruction: 'Vacuum or mop up all slurry and haul it to the planned collection point — never rinse it into a floor drain, storm drain or yard. Cover or plug open holes until the trade sets its sleeve or pipe. Record each hole size and location, and note any steel that was cut, for the engineer and the owner.',
          tools: ['wet vacuum', 'mop and squeegee'],
          materials: ['hole covers or plugs', 'slurry buckets or tote'],
          safety_ids: ['open_holes', 'slurry_skin'],
          qa_ids: ['holes_covered', 'slurry_disposed', 'cut_record'],
        },
      ],
    },
    {
      id: 'wall_wire_sawing',
      priority: 2,
      example_title: 'Wall saw new door opening in existing foundation wall',
      when: { title_re: 'wall ?saw|wire ?saw|track saw|(?:cut|saw)(?:ting)? (?:an? |new )?(?:door|window|egress|wall )?openings?|new (?:door|window|egress) opening|enlarge (?:the )?(?:opening|window)' },
      steps: [
        {
          title: 'Get the engineer\'s detail and plan the shoring',
          instruction: 'Do not cut a wall or structural slab opening until the engineer has approved its size and location and any header, lintel or shoring. Install the shoring or temporary support the engineer calls for before cutting. Scan both faces of the wall and mark rebar, conduit and pipe. Plan how each piece comes out: size it so the crane, forklift or rollers can safely carry it.',
          detail: 'For egress windows and door cut-ins in basements, check the waterproofing and drain tile outside before cutting, and plan the excavation with that trade.',
          tools: ['GPR scanner (scan crew)', 'level', 'chalk line'],
          materials: ['shoring posts and beams as designed', 'engineer\'s detail'],
          safety_ids: ['pt_tendon_structure', 'embedded_electrical', 'struck_by_cut_piece'],
          qa_ids: ['structural_ok', 'scan_marked', 'shoring_in_place'],
        },
        {
          title: 'Lay out, mount the track and drill corner holes',
          instruction: 'Snap the opening on both faces and match the cuts so they line up through the wall. Drill core holes at the corners where overcuts are not allowed, so the blade stops inside them. Bolt the track square and tight to the wall per the saw maker. Set slurry control at the base and protect finishes and windows nearby.',
          tools: ['core rig', 'wall saw track and anchors', 'square'],
          materials: ['wedge anchors', 'plastic sheeting', 'slurry dams or absorbent socks'],
          safety_ids: ['silica_walk_wall', 'wet_electrical', 'saw_guard_kickback'],
          qa_ids: ['layout_checked', 'slurry_captured'],
        },
        {
          title: 'Cut wet and pin each piece before the last cut',
          instruction: 'Cut with water running the whole time. Before the final cut that frees a piece, pin, wedge or rig it so it cannot fall or roll. Keep everyone out of the drop zone and out of line with a wire saw\'s cable path — a broken wire whips. Stop if the blade binds or the cut closes up.',
          tools: ['wall saw or wire saw', 'hydraulic or hi-cycle power unit', 'rigging and pins'],
          materials: ['wedges', 'lifting anchors'],
          safety_ids: ['struck_by_cut_piece', 'saw_guard_kickback', 'silica_walk_wall'],
          qa_ids: ['silica_controls', 'piece_secured'],
        },
        {
          title: 'Remove pieces, dress edges and clean up',
          instruction: 'Lift or roll each piece out on rated rigging; check slings before each shift. Grind or saw smooth any edge that will show, and trim cut rebar flush or as the engineer directs (coat exposed ends if specified). Capture and haul the slurry to the planned spot, sweep wet or HEPA-vacuum, and leave the opening guarded or covered until the next trade frames it.',
          tools: ['forklift, crane or rollers', 'grinder with shroud and vacuum', 'wet vacuum'],
          materials: ['rated slings and shackles', 'edge protection or guardrail'],
          safety_ids: ['struck_by_cut_piece', 'open_holes', 'slurry_skin'],
          qa_ids: ['edges_dressed', 'slurry_disposed', 'holes_covered', 'cut_record'],
        },
      ],
    },
    {
      id: 'slab_sawing',
      priority: 1,
      example_title: 'Saw cut slab for under-slab plumbing trench',
      when: { title_re: 'saw ?cut|sawcut|flat ?saw|slab saw|concrete cutting|cut(?:ting)? (?:and remove |out )?(?:the )?(?:existing )?(?:slab|floor|concrete|pavement)|trench (?:cut|saw)' },
      steps: [
        {
          title: 'Mark the cut and scan the slab',
          instruction: 'Snap the cut lines from the layout and confirm the depth needed. Have the slab scanned and marked for rebar, PT tendons, radiant tubing, conduit and pipe; on a slab-on-grade, also call 811 if the cut or the trench below reaches soil. Get the engineer\'s OK before cutting any PT slab, beam, or a slab marked structural.',
          tools: ['chalk line', 'tape', 'GPR scanner (scan crew)'],
          materials: ['marking paint'],
          safety_ids: ['embedded_electrical', 'pt_tendon_structure'],
          qa_ids: ['scan_marked', 'structural_ok', 'layout_checked'],
        },
        {
          title: 'Set up water, slurry control and power',
          instruction: 'Check the saw guard, blade rating and arbor before starting. Hook up the water feed and set dams or a slurry vac along the cut so the runoff is captured. Indoors, use an electric or hi-cycle saw, or provide the exhaust ventilation a gas saw needs, and keep electric saws on GFCI.',
          tools: ['walk-behind flat saw with water feed', 'slurry vacuum', 'GFCI cord set'],
          materials: ['slurry dams or absorbent socks', 'plastic sheeting'],
          safety_ids: ['saw_guard_kickback', 'engine_exhaust', 'wet_electrical'],
          qa_ids: ['slurry_captured'],
        },
        {
          title: 'Cut wet in passes to depth',
          instruction: 'Cut along the line with water running, in passes to full depth as the blade maker calls for. Keep hands and feet clear of the blade and never stand in line behind a handheld saw. Stop at steel that is not on the scan and ask before going on. Vacuum slurry as you go so it does not spread or reach drains.',
          tools: ['flat saw', 'handheld saw with water feed (for corners)'],
          materials: ['diamond blades'],
          safety_ids: ['silica_walk_wall', 'silica_handheld', 'saw_guard_kickback', 'slurry_skin'],
          qa_ids: ['silica_controls', 'cut_straight_depth'],
        },
        {
          title: 'Break out, clean up and protect the opening',
          instruction: 'Break out the concrete between the cuts with a jackhammer that has water spray or a shroud and vacuum. Load out debris, recycle clean concrete, and send the captured slurry to the planned disposal. Barricade or cover the trench or opening until the next trade starts.',
          tools: ['jackhammer with water or shroud', 'wet vacuum', 'skid steer or wheelbarrow'],
          materials: ['barricades or covers'],
          safety_ids: ['silica_breaking', 'open_holes'],
          qa_ids: ['silica_controls', 'slurry_disposed', 'holes_covered', 'cut_record'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'wall ?saw|wire ?saw|track saw|(?:door|window|egress) opening' }, type: 'generator', reason: 'Powers hi-cycle or electric wall/wire saws and the slurry vacuum where site power is not enough', optional: true },
    { when: { title_re: 'wall ?saw|wire ?saw|(?:door|window|egress) opening' }, type: 'forklift', reason: 'Lifts and carries heavy cut wall or slab sections out', optional: true },
    { when: { title_re: 'saw ?cut|sawcut|flat ?saw|slab saw|trench (?:cut|saw)|pavement' }, type: 'skid_steer', reason: 'Breaks out and loads sawn slab pieces and trench spoil', optional: true },
  ],
  hazards: [
    { id: 'silica_walk_wall', hazard: 'Breathing silica dust from walk-behind flat saws and wall or wire saws cutting concrete', hazard_es: PENDING_ES, controls: ['Use a saw with an integrated water feed that keeps water on the blade the whole cut', 'Outdoors with water: Table 1 requires no respirator; indoors or in an enclosed area: APF 10 respirator', 'Run and maintain the saw per the maker to keep dust down'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator APF 10 (indoors)', 'safety glasses', 'hearing protection'], prov: silica('Table 1 entry (iv) walk-behind saws. Wall and wire saws are not named in Table 1 — they need an exposure assessment under 1926.1153(d); applying the walk-behind controls is our conservative default.') },
    { id: 'silica_handheld', hazard: 'Breathing silica dust from handheld cut-off saws used for corners, short cuts and masonry', hazard_es: PENDING_ES, controls: ['Use a saw with an integrated water feed that keeps water on the blade', 'Outdoors: no respirator for 4 hours or less per shift, APF 10 above 4 hours; indoors: APF 10 at any time on task', 'Never dry-cut concrete with a handheld saw'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator APF 10 (as Table 1 requires)', 'safety glasses', 'face shield', 'hearing protection'], prov: silica('Table 1 entry (ii) handheld power saws (any blade diameter).') },
    { id: 'silica_coring', hazard: 'Breathing silica dust from core drilling and anchor drilling', hazard_es: PENDING_ES, controls: ['Rig-mounted core drills: use the integrated water feed to the cutting surface — no respirator required by Table 1', 'Handheld or stand-mounted drills for anchors: shroud plus a dust collector meeting the airflow and 99% filter rule; clean holes with a HEPA vacuum'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 2, ppe: ['safety glasses'], prov: silica('Table 1 entries (vi) rig-mounted core saws or drills and (vii) handheld and stand-mounted drills.') },
    { id: 'silica_breaking', hazard: 'Breathing silica dust from jackhammering out sawn concrete', hazard_es: PENDING_ES, controls: ['Use water spray at the point of impact or a shroud and dust collector', 'Outdoors: APF 10 above 4 hours per shift; indoors: APF 10 at any time on task', 'Clean up wet or with a HEPA vacuum — no dry sweeping or compressed air'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator APF 10 (as Table 1 requires)', 'hearing protection', 'safety glasses'], prov: silica('Table 1 entry (x) jackhammers and handheld powered chipping tools; housekeeping per 1926.1153(f).') },
    { id: 'embedded_electrical', hazard: 'Cutting or drilling into live conduit, cable or gas or water pipe hidden in the concrete or below a slab', hazard_es: PENDING_ES, controls: ['Find out before work starts whether energized circuits are in or near the cut — scan, check drawings and ask the owner', 'Have live circuits in the cut area de-energized and locked out, or move the cut', 'Stop at any unexpected hit and get the super before continuing'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(3)', severity: 4, prov: { src: ['ecfr-1926-k', 'concrete_cutting-csda', 'concrete_repair_lifting-call811'], confidence: 'verified', last_verified: D } },
    { id: 'pt_tendon_structure', hazard: 'Cutting a post-tension tendon, key rebar or a bearing element — sudden strand release, loss of support or collapse', hazard_es: PENDING_ES, controls: ['Get a written engineer approval and opening detail before cutting structural slabs, beams, walls or any PT slab', 'Scan and mark tendons and rebar; keep cuts and cores off tendon marks', 'Install shoring the engineer calls for before cutting'], controls_es: PENDING_ES, osha_ref: '1926.850(a)', severity: 4, prov: { src: ['ecfr-1926-t', 'demolition-ufgs-02-41-00', 'concrete_cutting-csda'], confidence: 'derived', last_verified: D, note: 'Cutting openings is partial demolition: 1926.850(a) engineering survey of collapse risk; UFGS 02 41 00 §1.3 add supports for cutting and get approval for structural repair. PT-specific practice from CSDA (by title).' } },
    { id: 'struck_by_cut_piece', hazard: 'Being struck or crushed by a cut piece or core that drops, tips or rolls when it breaks free, or by a rigging failure while lifting it', hazard_es: PENDING_ES, controls: ['Pin, wedge or rig every piece before the final cut; catch cores from below where possible', 'Barricade and post the drop zone and the floor below before cutting or coring through', 'Size pieces to the lifting equipment; inspect slings each shift and never exceed their rated load'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(iii)', severity: 4, prov: { src: ['ecfr-1926-m', 'ecfr-1926-h'], confidence: 'verified', last_verified: D, note: '1926.501(b)(4)(iii) objects falling through holes; 1926.251(a)(1)-(2) rigging inspection and safe working load.' } },
    { id: 'open_holes', hazard: 'Falling or stepping into new floor openings, cored holes and trenches', hazard_es: PENDING_ES, controls: ['Cover holes with secured, marked covers strong enough for the expected load, or guardrail them', 'Use fall arrest at openings more than 6 ft above a lower level until guarded'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 3, prov: osha('m', 'Cover requirements in 1926.502(i).') },
    { id: 'saw_guard_kickback', hazard: 'Kickback, blade contact, a binding core bit, or a breaking wire-saw cable — cuts, thrown segments and beads, spinning rigs', hazard_es: PENDING_ES, controls: ['Keep guards on; check the blade is rated for the saw speed with no cracks or missing segments; never hand-hold a large core drill', 'Stand to the side of a handheld saw, use two hands, never cut above shoulder height, and support pieces so cuts open', 'Guard wire-saw pulleys and the wire path; run the wire saw from outside its line', 'Keep hydraulic hoses within rated pressure and inspect them daily'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 4, ppe: ['face shield', 'safety glasses', 'hearing protection', 'cut-resistant chaps (handheld)'], prov: osha('i', '1926.300(b)(1)-(2) guards and moving parts; 1926.302(d)(2) hydraulic rated pressure; wire-saw practice per CSDA (by title).') },
    { id: 'wet_electrical', hazard: 'Electric shock from electric saws, core rigs and vacuums used in standing water and slurry', hazard_es: PENDING_ES, controls: ['Plug every tool into GFCI protection or an assured grounding program', 'Use double-insulated or grounded tools and keep cords and connections out of water', 'Check cords and plugs before each shift'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 4, prov: { src: ['ecfr-1926-k', 'ecfr-1926-i'], confidence: 'verified', last_verified: D, note: '1926.404(b)(1) GFCI/assured grounding; 1926.302(a)(1) double-insulated or grounded electric tools.' } },
    { id: 'engine_exhaust', hazard: 'Carbon monoxide from gas saws and power units run indoors or in basements and pits', hazard_es: PENDING_ES, controls: ['Prefer electric, hi-cycle or hydraulic saws with the power unit outside', 'If a gas tool must run inside, ventilate and monitor CO; stop the engine to refuel'], controls_es: PENDING_ES, osha_ref: '1926.302(c)(2)', severity: 4, prov: { src: ['ecfr-1926-i', 'restoration-niosh-co'], confidence: 'verified', last_verified: D } },
    { id: 'slurry_skin', hazard: 'Caustic slurry burning skin and eyes, and slick floors from slurry', hazard_es: PENDING_ES, controls: ['Wear waterproof gloves, boots and eye protection when cutting wet and handling slurry', 'Vacuum slurry as you go and keep walkways clear and dry'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['waterproof gloves', 'rubber boots', 'safety glasses'], prov: { src: ['ecfr-1926-e', 'ecfr-1926-c', 'concrete_cutting-wisdot-slurry'], confidence: 'verified', last_verified: D, note: 'Slurry is high-pH (WisDOT fact sheet); slip control per 1926.25(a).' } },
  ],
  qa_checklist: [
    { id: 'scan_marked', phase: 'foundation', item: 'Every cut and core area scanned (GPR or X-ray) and marked on the surface for rebar, tendons, conduit and pipe before cutting; scan report kept on site.', item_es: PENDING_ES, safety: true, prov: csda('CSDA-BP-007 / BP-026 concepts (scan, mark, know the limits) — by title.') },
    { id: 'structural_ok', item: 'Engineer\'s written approval and opening detail on hand for any cut or core in a PT slab, beam, column, joist or bearing wall; required shoring installed first.', item_es: PENDING_ES, safety: true, prov: ufgs('§1.3: add supports for cutting; approval before structural repair or reinforcement.') },
    { id: 'layout_checked', item: 'Cut lines and core centers match the layout and are confirmed with the trade that needs them; both faces of a wall line up; corner holes drilled where no overcut is allowed.', item_es: tr('Líneas de corte y centros de núcleos coinciden con el trazo y están confirmados con el oficio que los necesita; ambas caras del muro alineadas; perforaciones en esquinas donde no se permite sobrecorte.'), prov: ufgs('§3.1.7: wall cuts perpendicular to the face and aligned with the opposite face.') },
    { id: 'silica_controls', item: 'Every saw, core rig and jackhammer run with its Table 1 control (water feed, or shroud and dust collector) working, with the respirators Table 1 requires; written exposure control plan on site.', item_es: PENDING_ES, safety: true, prov: silica('Table 1 + 1926.1153(g) written exposure control plan.') },
    { id: 'slurry_captured', item: 'Slurry dams, vacuums or socks in place before cutting; no slurry reaching floor drains, storm inlets, soil or finishes.', item_es: tr('Diques, aspiradoras o barreras para lodo colocados antes de cortar; sin lodo llegando a coladeras, bocas de tormenta, tierra o acabados.'), prov: slurry() },
    { id: 'slurry_disposed', item: 'Captured slurry settled, pH-adjusted or hauled per the site plan; dried solids disposed as solid waste or clean concrete — nothing rinsed to a drain.', item_es: tr('Lodo recogido asentado, con pH ajustado o retirado según el plan; sólidos secos desechados como residuo sólido o concreto limpio; nada enjuagado al drenaje.'), prov: slurry('WisDOT/WDNR: pH 6–9 before placement in a structure, daily pH log; solids per NR 500–538.') },
    { id: 'below_protected', item: 'Area below each through-floor core or cut barricaded and posted, and checked clear before the piece breaks free.', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'piece_secured', item: 'Each wall or slab piece pinned, wedged or rigged before its final cut; nothing dropped or tipped uncontrolled.', item_es: PENDING_ES, safety: true, prov: osha('m') },
    { id: 'shoring_in_place', item: 'Shoring, needles or lintels installed per the engineer\'s detail before any wall or structural slab cut begins.', item_es: PENDING_ES, safety: true, prov: ufgs() },
    { id: 'cut_straight_depth', item: 'Cuts straight on the line, to the specified depth, with no overcuts past the approved limits.', item_es: tr('Cortes rectos sobre la línea, a la profundidad especificada y sin sobrecortes fuera de los límites aprobados.'), prov: ufgs('§3.1.7: saw along straight lines.') },
    { id: 'holes_clean', item: 'Core holes round, plumb or square to the surface, at the size on the hole list, and clean of slurry and loose plugs.', item_es: tr('Perforaciones redondas, a plomo o a escuadra con la superficie, del tamaño de la lista y limpias de lodo y tapones sueltos.'), prov: est('Field practice; sleeve fit is checked by the trade receiving the hole.') },
    { id: 'edges_dressed', item: 'Exposed edges saw-cut or ground smooth; broken faces only where hidden by finished work; cut rebar ends trimmed and coated as directed.', item_es: tr('Bordes expuestos cortados o pulidos lisos; caras rotas solo donde las cubre el acabado; puntas de varilla cortadas recortadas y protegidas según indicaciones.'), prov: ufgs('§3.1.7: broken face only where concealed, otherwise grind smooth or saw through.') },
    { id: 'holes_covered', item: 'New holes, openings and trenches covered (secured, marked) or guarded until the next trade takes them over.', item_es: PENDING_ES, safety: true, prov: osha('m', '1926.501(b)(4) + 1926.502(i) covers.') },
    { id: 'cut_record', item: 'As-cut record given to the super: hole sizes and locations, openings, and any rebar or conduit cut, with photos.', item_es: tr('Registro de lo cortado entregado al supervisor: tamaños y ubicaciones de perforaciones, aberturas y cualquier varilla o conduit cortado, con fotos.'), prov: csda() },
  ],
  inspection_checklists: {
    scan_before_cut: [
      { item: 'GPR/X-ray scan done over every cut and core area; marks on the surface and a scan report on site', item_es: PENDING_ES, ref: 'CSDA-BP-007 / BP-026' },
      { item: 'As-builts and PT shop drawings reviewed; tendons and live conduit kept clear of every cut', item_es: PENDING_ES },
      { item: 'Live circuits in the cut area identified and locked out, or the cut moved', item_es: PENDING_ES, ref: '1926.416(a)(3)' },
      { item: 'For slab-on-grade cuts reaching soil: 811 ticket confirmed', item_es: PENDING_ES },
    ],
    structural_approval: [
      { item: 'Engineer\'s written approval and opening detail for every structural cut or PT slab core', item_es: PENDING_ES },
      { item: 'Shoring, needles or lintels installed and checked before cutting', item_es: PENDING_ES, ref: 'UFGS 02 41 00 §1.3' },
      { item: 'Lift plan and piece sizes match the equipment on site', item_es: tr('Plan de izaje y tamaño de piezas acordes con el equipo en sitio') },
    ],
    slurry_plan: [
      { item: 'Collection method (dams, vacuum, tote) and disposal location agreed before cutting', item_es: tr('Método de recolección (diques, aspiradora, contenedor) y lugar de disposición acordados antes de cortar') },
      { item: 'Floor drains and nearby storm inlets protected', item_es: tr('Coladeras y bocas de tormenta cercanas protegidas') },
      { item: 'pH log kept when slurry is treated on site', item_es: tr('Bitácora de pH llevada cuando el lodo se trata en sitio'), ref: 'WisDOT/WDNR slurry fact sheet' },
    ],
    final_walkthrough: [
      { item: 'Holes and openings at the right size and place; edges dressed', item_es: tr('Perforaciones y aberturas del tamaño y en el lugar correctos; bordes terminados') },
      { item: 'All slurry and debris removed; finishes clean', item_es: tr('Todo el lodo y escombro retirado; acabados limpios') },
      { item: 'Openings covered or guarded and handed to the next trade', item_es: PENDING_ES },
      { item: 'As-cut record and photos delivered', item_es: tr('Registro de cortes y fotos entregados') },
    ],
  },
  assemblies: [
    { code: 'G-CUT-CORE-SM-EA', name: 'Core hole up to 6 in. dia. through slab or wall up to 8 in. thick, wet, incl. setup and slurry pickup, each', name_es: 'Núcleo de hasta 6 pulg. de diámetro en losa o muro de hasta 8 pulg., en húmedo, con montaje y recolección de lodo, c/u', unit: 'EA', csi: '03 81 30',
      material_cost_cents: { v: 1500, prov: est('diamond bit wear + anchor + water, ≈$15 per hole at 2026 bit prices') },
      labor_hours_per_unit: { v: 0.75, prov: est('1 operator: anchor rig, drill ≈8 in. of concrete, retrieve core, vacuum — ≈10 holes/day incl. moves') },
      equipment_cost_cents: { v: 2500, prov: est('core rig, wet vac and generator day-rate share over ≈10 holes') }, waste_pct: { v: 0, prov: est('no material waste on a coring line item') } },
    { code: 'G-CUT-CORE-LG-EA', name: 'Core hole 8–12 in. dia. through slab or wall up to 8 in. thick, wet, incl. setup and slurry pickup, each', name_es: 'Núcleo de 8 a 12 pulg. de diámetro en losa o muro de hasta 8 pulg., en húmedo, con montaje y recolección de lodo, c/u', unit: 'EA', csi: '03 81 30',
      material_cost_cents: { v: 4000, prov: est('large-diameter bit wear runs ≈2.5× a small bit per hole') },
      labor_hours_per_unit: { v: 1.5, prov: est('slower feed, heavier core removal — ≈5 holes/day') },
      equipment_cost_cents: { v: 4500, prov: est('larger rig + power unit share over ≈5 holes') }, waste_pct: { v: 0, prov: est('no material waste') } },
    { code: 'G-CUT-FLATSAW-LF', name: 'Flat-saw existing slab up to 6 in. deep, wet, incl. slurry capture (break-out separate), per LF', name_es: 'Corte de losa existente hasta 6 pulg. de prof., en húmedo, con recolección de lodo (demolición aparte), por pie lineal', unit: 'LF', csi: '03 81 13',
      material_cost_cents: { v: 150, prov: est('diamond blade wear ≈$0.25 per LF-inch at 6 in.') },
      labor_hours_per_unit: { v: 0.04, prov: est('walk-behind saw ≈25 LF/hr at 6 in. incl. moves and slurry vac') },
      equipment_cost_cents: { v: 150, prov: est('flat saw + slurry vac day-rate share') }, waste_pct: { v: 0, prov: est('blade wear already in material') } },
    { code: 'G-CUT-WALLSAW-LF', name: 'Wall-saw existing concrete wall up to 12 in. thick, track-mounted, wet, per LF of cut (shoring and removal separate)', name_es: 'Corte de muro existente hasta 12 pulg. con sierra de riel, en húmedo, por pie lineal (apuntalamiento y retiro aparte)', unit: 'LF', csi: '03 81 16',
      material_cost_cents: { v: 600, prov: est('large-diameter wall-saw blade wear ≈$0.50 per LF-inch at 12 in.') },
      labor_hours_per_unit: { v: 0.4, prov: est('2-person crew: track setup, corner cores, cut both faces — ≈40 LF/day') },
      equipment_cost_cents: { v: 900, prov: est('wall saw + hydraulic or hi-cycle power unit day-rate share over ≈40 LF') }, waste_pct: { v: 0, prov: est('blade wear already in material') } },
    { code: 'G-CUT-GPR-EA', name: 'GPR concrete scan and surface marking, per scan location (up to ≈4×4 ft), each', name_es: 'Escaneo de concreto con georradar (GPR) y marcado en superficie, por ubicación (hasta ≈4×4 pies), c/u', unit: 'EA', csi: '03 81 00',
      material_cost_cents: { v: 0, prov: est('marking paint negligible') },
      labor_hours_per_unit: { v: 0.25, prov: est('scan tech ≈15 min per location incl. marking; sub minimums (half day) not modeled') },
      equipment_cost_cents: { v: 5000, prov: est('GPR unit day-rate share ≈$50 per location at ≈16 locations/day, 2026') }, waste_pct: { v: 0, prov: est('service line') } },
  ],
  dependency_hints: [
    { after_trades: ['structural', 'engineering'], note: 'Openings in structural slabs, walls and PT slabs need the engineer\'s detail and any shoring in place before cutting.' },
    { before_phase: 'rough_in', note: 'Core and saw slab and wall penetrations before plumbing, electrical and mechanical rough-in runs through them.' },
  ],
});
