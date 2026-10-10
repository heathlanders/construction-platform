// Trade Knowledge Pack — framing (Rough Carpentry / Framing (Wood)). Wave 01, COMPLEMENT pattern:
// the hand recipe in task-buildout/building.ts keeps producing the work steps (Frame structure →
// Sheath & nail braced walls); this pack adds glossary, hazards, QA, inspection checklists, extra
// code refs, equipment hints and assemblies the catalog lacks (subfloor, sill, LVL, connectors).
// Dossier: docs/trade-packs/dossiers/framing.md. Sources: UFGS 06 10 00, AWC WFCM 2018, APA E30,
// SBCA BCSI (ref), DOE BASC advanced framing, 29 CFR 1926 Subparts C, E, I, K, M, X, CC.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['ufgs-06-10-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const wfcm = { src: ['awc-wfcm-2018'], confidence: 'verified' as const, last_verified: D };
const apa = { src: ['apa-e30'], confidence: 'verified' as const, last_verified: D };
const bcsi = { src: ['sbca-bcsi', 'ufgs-06-10-00'], confidence: 'verified' as const, last_verified: D, note: 'UFGS 3.1.15 requires trusses be handled, erected and braced per TPI/BCSI; paraphrased.' };
const basc = { src: ['doe-basc-advframing'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'framing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Wood light-frame structure: sill plates, floor joists and subfloor, stud walls with headers, roof trusses or rafters, wall and roof sheathing, fireblocking and the connectors that tie it all to the foundation.',
    summary_es: 'Estructura ligera de madera: soleras de cimentación, viguetas y contrapiso, muros de montantes con cabezales, armaduras o vigas de techo, entablado de muros y techo, cortafuegos y los conectores que unen todo a la cimentación.',
    glossary: [
      { term: 'Sill plate', term_es: 'Solera de cimentación', def: 'Treated board bolted to the top of the foundation that the floor or walls sit on.', def_es: 'Tabla tratada atornillada sobre la cimentación donde apoyan el piso o los muros.' },
      { term: 'Stud', term_es: 'Montante (barrote)', def: 'Vertical framing member in a wall, usually 2x4 or 2x6.', def_es: 'Pieza vertical de la estructura de un muro, normalmente 2x4 o 2x6.' },
      { term: 'Header', term_es: 'Cabezal (dintel)', def: 'Beam over a door or window opening that carries the load around it.', def_es: 'Viga sobre una puerta o ventana que desvía la carga alrededor del vano.' },
      { term: 'Top plate', term_es: 'Solera superior', def: 'Doubled horizontal boards on top of the studs that tie the wall together.', def_es: 'Tablas horizontales dobles sobre los montantes que amarran el muro.' },
      { term: 'Crown', term_es: 'Comba', def: 'The natural bow in a board — install joists and rafters crown up.', def_es: 'La curvatura natural de una tabla; instalar viguetas y vigas con la comba hacia arriba.' },
      { term: 'Braced wall panel', term_es: 'Panel de muro arriostrado', def: 'Section of wall sheathed and nailed to resist wind and earthquake racking.', def_es: 'Tramo de muro entablado y clavado para resistir el empuje lateral de viento o sismo.' },
      { term: 'Fireblocking', term_es: 'Bloqueo cortafuego', def: 'Solid blocking that closes hidden cavities so fire and smoke cannot travel through them.', def_es: 'Bloqueo sólido que cierra cavidades ocultas para que el fuego y el humo no pasen.' },
      { term: 'Hurricane tie', term_es: 'Conector anti-levantamiento', def: 'Metal strap or clip that holds a truss or rafter down to the wall against wind uplift.', def_es: 'Fleje o grapa metálica que sujeta la armadura o viga al muro contra el levantamiento por viento.' },
      { term: 'LVL', term_es: 'Madera microlaminada (LVL)', def: 'Engineered beam made of glued wood veneers, used for long spans and headers.', def_es: 'Viga de ingeniería hecha de chapas de madera encoladas, para claros largos y cabezales.' },
      { term: 'Temporary bracing', term_es: 'Arriostramiento temporal', def: 'Boards that hold walls and trusses straight and standing until sheathing and permanent bracing go on.', def_es: 'Tablas que mantienen muros y armaduras rectos y en pie hasta colocar el entablado y el arriostramiento permanente.' },
    ],
  },
  est_bucket: 'building',
  recipes: [],
  code_refs: {
    framing: [
      { section: 'R602.3', code_type: 'IRC', note: 'Wood wall design, construction and fastening schedule', prov: irc },
      { section: 'R602.7', code_type: 'IRC', note: 'Headers over wall openings', prov: irc },
      { section: 'R602.6', code_type: 'IRC', note: 'Limits on drilling and notching studs and plates', prov: irc },
      { section: 'R502.8', code_type: 'IRC', note: 'Limits on cutting, drilling and notching floor joists', prov: irc },
      { section: 'R602.8', code_type: 'IRC', note: 'Fireblocking of concealed wall and floor cavities', prov: irc },
      { section: 'R802.10', code_type: 'IRC', note: 'Wood trusses — design drawings, bracing, no field alteration', prov: irc },
      { section: 'R802.11', code_type: 'IRC', note: 'Roof tie-down against wind uplift', prov: irc },
      { section: 'R403.1.6', code_type: 'IRC', note: 'Sill plate anchorage to the foundation', prov: irc },
    ],
    sheathing: [
      { section: 'R602.10', code_type: 'IRC', note: 'Wall bracing — braced wall lines and panels', prov: irc },
      { section: 'R503', code_type: 'IRC', note: 'Floor sheathing', prov: irc },
      { section: 'R803', code_type: 'IRC', note: 'Roof sheathing', prov: irc },
    ],
  },
  equipment: [
    { when: { title_re: 'fram|sheath|truss|joist|wall' }, type: 'air_compressor', reason: 'Pneumatic framing and sheathing nailers', optional: true },
    { when: { title_re: 'truss|roof framing|rafter|sheath' }, type: 'telehandler', reason: 'Lift lumber bundles and set trusses or sheathing on upper floors', optional: true },
    { when: { facts_any: ['engineered_trusses'], building_types: ['residential_mf', 'commercial'] }, type: 'crane', reason: 'Set truss bundles or panelized sections on larger buildings', optional: true },
  ],
  hazards: [
    { id: 'fall_residential', hazard: 'Fall from walls, floor edges or roof framing during residential framing', hazard_es: PENDING_ES, controls: ['Use guardrails, safety net or personal fall arrest at 6 ft or more above the lower level', 'If those are infeasible, follow a written site-specific fall protection plan'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness and lanyard when required'], prov: osha('m') },
    { id: 'floor_holes', hazard: 'Fall through stair openings and other holes in the subfloor', hazard_es: PENDING_ES, controls: ['Cover holes with secured, marked covers or guard them with rails', 'Re-cover any hole as soon as work at it stops'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'structure_collapse', hazard: 'Unbraced walls or trusses blowing over or collapsing like dominoes during erection', hazard_es: PENDING_ES, controls: ['Install temporary bracing on walls and trusses as each is set, per the truss bracing guide', 'Have a competent person check bracing before loading or in wind; stop work in high wind'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(2)', severity: 4, prov: { ...osha('c'), note: 'General competent-person inspection duty; truss bracing practice per SBCA BCSI (reference).' } },
    { id: 'truss_hoist', hazard: 'Struck by a truss bundle or panel being hoisted or landed', hazard_es: PENDING_ES, controls: ['Stay out of the fall zone except the workers hooking, guiding or receiving the load', 'Use a qualified rigger and tag lines'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat'], prov: osha('cc') },
    { id: 'power_line', hazard: 'Crane or telehandler boom contacting overhead power lines', hazard_es: PENDING_ES, controls: ['Identify the work zone and check clearance to power lines before any lift', 'Use a dedicated spotter when equipment may approach the lines'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic nailers', hazard_es: PENDING_ES, controls: ['Keep the muzzle safety device working; never bypass it', 'Use sequential-trip mode near other workers; never point the tool at anyone'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(3)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'circular_saw', hazard: 'Cuts and kickback from portable circular saws', hazard_es: PENDING_ES, controls: ['Keep upper and lower guards working; the lower guard must snap back', 'Support the board so the kerf does not pinch the blade'], controls_es: PENDING_ES, osha_ref: '1926.304(d)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while setting plates, beams and trusses', hazard_es: PENDING_ES, controls: ['Extend ladder rails 3 ft above the landing and secure the top', 'Keep three points of contact; move the ladder instead of reaching'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'cord_shock', hazard: 'Electric shock from saws, cords and temporary power', hazard_es: PENDING_ES, controls: ['Use GFCI protection on every temporary receptacle', 'Inspect cords daily and pull damaged ones from service'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'eye_injury', hazard: 'Eye injury from flying nails, chips and sawdust', hazard_es: PENDING_ES, controls: ['Wear safety glasses whenever nailing, cutting or drilling'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'lumber_stacks', hazard: 'Lumber stacks sliding or toppling', hazard_es: PENDING_ES, controls: ['Stack lumber on level, solid sills so piles are stable', 'Pull nails from used lumber before stacking'], controls_es: PENDING_ES, osha_ref: '1926.250(b)(8)', severity: 2, prov: osha('c') },
    { id: 'nail_debris', hazard: 'Stepping on scrap lumber with protruding nails; trips on debris', hazard_es: PENDING_ES, controls: ['Keep scrap with nails out of work areas, passageways and stairs', 'Clear deck and floor debris at regular intervals'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, ppe: ['puncture-resistant boots'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'lumber_moisture', item: 'Framing lumber at or below 19% moisture content when enclosed; no members with visible mold or decay.', item_es: tr('Madera de estructura con 19% de humedad o menos al cerrarse; ninguna pieza con moho o pudrición visible.'), prov: ufgs('Part 2 moisture limit; Part 3 bars material with biological growth') },
    { id: 'sill_anchored', item: 'Sill plates treated, set level and square, and anchored per plan with washers and nuts tight; at least two anchors per sill piece.', item_es: tr('Soleras tratadas, a nivel y escuadra, ancladas según plano con arandelas y tuercas apretadas; al menos dos anclas por pieza de solera.'), prov: ufgs('3.2.14 sill plates') },
    { id: 'crown_up', item: 'Joists and rafters set crown up, in alignment, with full bearing; splices and laps only over a bearing.', item_es: tr('Viguetas y vigas con la comba hacia arriba, alineadas y con apoyo completo; empalmes y traslapes solo sobre un apoyo.'), prov: ufgs('3.1 / 3.1.4') },
    { id: 'joist_bearing', item: 'Joist ends have the minimum bearing on wood/metal and concrete/masonry, and every joist framing into the side of a beam or header sits in a hanger.', item_es: tr('Los extremos de viguetas tienen el apoyo mínimo sobre madera/metal y concreto/mampostería, y toda vigueta que llega al costado de una viga o cabezal va en colgador.'), prov: ufgs('3.1.4.1 floor framing') },
    { id: 'hangers_nailed', item: 'Every hanger and connector has a fastener in every required hole, using the fastener type the maker lists.', item_es: tr('Cada colgador y conector tiene clavo o tornillo en cada orificio requerido, del tipo que indica el fabricante.'), prov: ufgs('3.1.14 metal framing anchors') },
    { id: 'no_bad_cuts', item: 'No cuts, bores or notches in studs, joists, beams or truss members beyond code limits; damaged members repaired per an approved detail or replaced.', item_es: tr('Sin cortes, perforaciones ni muescas en montantes, viguetas, vigas o armaduras más allá de los límites del código; piezas dañadas reparadas con detalle aprobado o reemplazadas.'), prov: ufgs('3.1 — no cutting or boring without approval') },
    { id: 'headers_sized', item: 'Headers over every opening match the plan size, with the required jack and king studs.', item_es: tr('Los cabezales sobre cada vano coinciden con el tamaño del plano, con los montantes de apoyo y completos requeridos.'), prov: wfcm },
    { id: 'walls_plumb', item: 'Studs plumb within 1/4 in. in 8 ft (non-cumulative) and plates straight; walls square before sheathing.', item_es: tr('Montantes a plomo dentro de 1/4 pulg en 8 pies (no acumulativo) y soleras rectas; muros a escuadra antes del entablado.'), prov: ufgs('3.4 framing tolerances') },
    { id: 'subfloor_panels', item: 'Subfloor panels laid long dimension across joists, end joints staggered over framing, edge and end gaps left, glued and fastened to schedule.', item_es: tr('Paneles de contrapiso con el lado largo perpendicular a las viguetas, juntas de extremo alternadas sobre la estructura, con holgura en bordes y extremos, pegados y fijados según el patrón.'), prov: ufgs('3.1.6 subflooring; APA E30') },
    { id: 'shear_nailing', item: 'Braced-wall and roof sheathing nailed at the edge and field spacing on the plans; no overdriven nails through the panel face.', item_es: tr('Entablado de muros arriostrados y techo clavado con el espaciado de borde y campo del plano; sin clavos hundidos que atraviesen la cara del panel.'), prov: apa },
    { id: 'roof_panel_edges', item: 'Roof sheathing has clips, blocking or tongue-and-groove edges where the panel span requires edge support.', item_es: tr('El entablado del techo lleva grapas, bloqueo o machihembrado donde el claro del panel requiere soporte de borde.'), prov: ufgs('3.1.17 roof sheathing per APA E30') },
    { id: 'uplift_ties', item: 'Truss or rafter uplift ties installed at the spacing shown, fully nailed.', item_es: tr('Conectores anti-levantamiento de armaduras o vigas instalados al espaciado indicado y totalmente clavados.'), prov: ufgs('3.1.14') },
    { id: 'fireblocking', item: 'Fireblocking installed at floor/ceiling levels, soffits, stair stringers and around vents and chimneys before cover.', item_es: tr('Bloqueo cortafuego instalado en niveles de piso/techo, plafones, zancas de escalera y alrededor de ductos y chimeneas antes de cubrir.'), prov: wfcm },
    { id: 'truss_bracing', item: 'Trusses set plumb at layout spacing with temporary and permanent bracing installed per the truss drawings and bracing guide before any load.', item_es: PENDING_ES, safety: true, prov: bcsi },
    { id: 'aligned_framing', item: 'Where advanced framing is specified: studs, joists and trusses stacked in line, two-stud corners and insulated headers as detailed.', item_es: tr('Donde se especifique estructura avanzada: montantes, viguetas y armaduras alineadas, esquinas de dos montantes y cabezales aislados según el detalle.'), prov: basc },
  ],
  inspection_checklists: {
    framing: [
      { item: 'Sill anchorage, hold-downs and straps installed per plan', item_es: PENDING_ES, ref: 'R403.1.6' },
      { item: 'Member sizes, spacing and spans match the plans; truss drawings on site', item_es: PENDING_ES, ref: 'R802.10' },
      { item: 'Headers, beams and point loads carried to the foundation', item_es: PENDING_ES, ref: 'R602.7' },
      { item: 'No over-cut, over-bored or notched members; repairs per approved detail', item_es: PENDING_ES, ref: 'R602.6' },
      { item: 'Fireblocking and draftstopping in place before cover', item_es: PENDING_ES, ref: 'R602.8' },
      { item: 'Truss permanent bracing and uplift ties installed', item_es: PENDING_ES, ref: 'R802.11' },
      { item: 'Stair openings and floor holes guarded or covered', item_es: PENDING_ES },
    ],
    sheathing: [
      { item: 'Braced wall panels at the plan locations and lengths', item_es: PENDING_ES, ref: 'R602.10' },
      { item: 'Edge and field nail spacing per plan; no overdriven nails', item_es: PENDING_ES, ref: 'R602.10' },
      { item: 'Roof sheathing edge clips or blocking where required; panel gaps left', item_es: PENDING_ES, ref: 'R803' },
    ],
  },
  assemblies: [
    { code: 'B-FRM-SUBFLOOR-SF', name: 'Subfloor, 3/4 in. T&G OSB glued and nailed, per SF', name_es: 'Contrapiso de OSB machihembrado de 3/4 pulg, pegado y clavado, por pie²', unit: 'SF', csi: '06 16 23',
      material_cost_cents: { v: 125, prov: est('23/32 T&G OSB panel + subfloor adhesive + fasteners, national baseline 2026') }, labor_hours_per_unit: { v: 0.016, prov: est('2-person crew lays ~1,000 SF/day incl. glue') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 8, prov: est('panel cut-offs at stairs and edges') } },
    { code: 'B-FRM-SILL-LF', name: 'Treated sill plate with sill gasket, anchors tightened, per LF', name_es: 'Solera de cimentación tratada con sello, anclas apretadas, por pie lineal', unit: 'LF', csi: '06 11 00',
      material_cost_cents: { v: 260, prov: est('PT 2x6 + foam sill gasket + washers/nuts share, 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('layout, drill over bolts, set and tighten') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('end cuts at corners') } },
    { code: 'B-FRM-LVL-LF', name: 'LVL beam or header, 1-3/4 x 11-7/8 in., per LF per ply', name_es: 'Viga o cabezal LVL de 1-3/4 x 11-7/8 pulg, por pie lineal por capa', unit: 'LF', csi: '06 17 13',
      material_cost_cents: { v: 1100, prov: est('distributor LVL pricing spot, national baseline 2026 — volatile') }, labor_hours_per_unit: { v: 0.08, prov: est('cut, nail plies, set on posts/hangers') },
      equipment_cost_cents: { v: 0, prov: est('tools only; lifts covered by equipment rules') }, waste_pct: { v: 5, prov: est('ordered to length, minor trim') } },
    { code: 'B-FRM-HOLDDOWN-EA', name: 'Hold-down connector with anchor and fasteners, installed, each', name_es: 'Conector de anclaje (hold-down) con ancla y fijaciones, instalado, c/u', unit: 'EA', csi: '06 05 23',
      material_cost_cents: { v: 4000, prov: est('mid-size hold-down + SDS screws + threaded rod/anchor share') }, labor_hours_per_unit: { v: 0.5, prov: est('locate, drill, fasten to post and anchor') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted units') } },
    { code: 'B-FRM-UPLIFT-TIE-EA', name: 'Truss / rafter uplift tie (hurricane tie), installed, each', name_es: 'Conector anti-levantamiento de armadura o viga, instalado, c/u', unit: 'EA', csi: '06 05 23',
      material_cost_cents: { v: 150, prov: est('galvanized uplift clip + nails') }, labor_hours_per_unit: { v: 0.05, prov: est('hand or palm-nailer install from ladder/scaffold') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 2, prov: est('spares') } },
  ],
  quantity_rules: [
    { code: 'B-FRM-SUBFLOOR-SF', assumption: 'Framed floor on joists — subfloor ≈ sum of scheduled room areas (understates gross floor; confirm takeoff). Delete if your B-FRAME-SF rate already includes subfloor', when: { facts_any: ['floor_joists', 'i_joists'] }, qty: { basis: 'area_sf_sum', round: 'ceil' } },
    { code: 'B-FRM-SILL-LF', assumption: 'Anchor bolts on plans — assume ≈160 LF of sill (typical single-family perimeter) until measured', when: { facts_any: ['anchor_bolts'] }, qty: { basis: { component: 'anchor_bolts' }, mul: 160 } },
    { code: 'B-FRM-LVL-LF', assumption: 'LVL / engineered beam called out — assume ≈24 LF of ply (one 2-ply 12 ft beam) until the beam schedule is read', when: { facts_any: ['lvl_beam'] }, qty: { basis: { component: 'lvl_beam' }, mul: 24 } },
    { code: 'B-FRM-UPLIFT-TIE-EA', assumption: 'Engineered roof trusses — ≈30 trusses × 2 bearing ends = 60 uplift ties until the truss layout is read', when: { facts_any: ['engineered_trusses'] }, qty: { basis: { component: 'engineered_trusses' }, mul: 60 } },
  ],
  dependency_hints: [
    { after_trades: ['concrete'], note: 'Framing starts after the foundation passes and anchor bolts are set and cured.' },
    { before_phase: 'insulation', note: 'Framing and sheathing inspections must pass before insulation and drywall cover the frame.' },
  ],
});
