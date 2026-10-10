// Trade Knowledge Pack — decks (Decks & Porches). Wave 0b pilot: the NEW-TRADE pattern.
// Dossier: docs/trade-packs/dossiers/decks.md. Sources: AWC DCA 6 (2015 IRC), Simpson F-DECKCODE,
// 29 CFR 1926 (M, X, I, K, P), IRC R507/R312/R311.7/R317/R703.8 (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const dca6 = { src: ['awc-dca6'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'decks',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Attached and freestanding residential decks and porches: footings, posts, beams, joists, ledger to the house, decking, guards and stairs.',
    summary_es: 'Terrazas (decks) y porches residenciales, adosados o independientes: zapatas, postes, vigas, viguetas, larguero de anclaje a la casa, entablado, barandales y escaleras.',
    glossary: [
      { term: 'Ledger', term_es: 'Larguero de anclaje', def: 'Board bolted to the house rim joist that carries one end of the deck joists.', def_es: 'Tabla atornillada a la viga perimetral de la casa que soporta un extremo de las viguetas.' },
      { term: 'Joist hanger', term_es: 'Colgador de vigueta', def: 'Metal connector that holds a joist end to a beam or ledger.', def_es: 'Conector metálico que sujeta el extremo de una vigueta a una viga o larguero.' },
      { term: 'Beam', term_es: 'Viga', def: 'Built-up member on posts that carries the joists at the outer end.', def_es: 'Elemento armado sobre postes que soporta las viguetas en el extremo exterior.' },
      { term: 'Footing', term_es: 'Zapata', def: 'Concrete pad or pier below frost depth that each post bears on.', def_es: 'Base o pilote de concreto, bajo la profundidad de congelación, donde apoya cada poste.' },
      { term: 'Guard', term_es: 'Barandal de protección', def: 'Railing that keeps people from falling off a raised deck edge or stair.', def_es: 'Barandal que evita caídas desde el borde elevado de la terraza o la escalera.' },
      { term: 'Stringer', term_es: 'Zanca', def: 'Notched or solid board that supports stair treads.', def_es: 'Tabla cortada o sólida que soporta los peldaños de la escalera.' },
      { term: 'Hold-down', term_es: 'Anclaje de tensión', def: 'Connector that ties the deck framing to the house to resist the deck pulling away sideways.', def_es: 'Conector que une la estructura de la terraza a la casa para que no se separe lateralmente.' },
      { term: 'Flashing', term_es: 'Botaguas', def: 'Corrosion-resistant metal or membrane that sheds water away from the ledger and house wall.', def_es: 'Lámina metálica o membrana resistente a la corrosión que desvía el agua del larguero y del muro.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'attached_deck',
      example_title: 'Build rear deck',
      when: { title_re: '\\bdeck|porch' },
      steps: [
        {
          title: 'Lay out and dig footings',
          instruction: 'Call the locate line and wait for marks. Lay out post locations from the framing plan, then dig each footing to undisturbed soil at least 12 in. below grade or below the local frost line, whichever is deeper. Keep footings off septic fields, utility lines and meters.',
          tools: ['post hole digger / auger', 'string line', 'tape', 'level'],
          materials: ['form tubes', 'concrete', 'post bases (cast-in or anchored)'],
          safety_ids: ['struck_utility', 'power_tool'],
          qa_ids: ['footing_depth', 'footing_location'],
          gating_inspection_type: 'footing',
          code_refs: [{ section: 'R507', code_type: 'IRC', note: 'Decks — footings and supports' }],
        },
        {
          title: 'Attach and flash the ledger',
          instruction: 'Remove siding where the ledger goes. Install continuous corrosion-resistant flashing with a drip edge, then fasten the ledger (2x8 minimum, preservative-treated) to the house rim joist with 1/2 in. lag screws or through-bolts with washers in a staggered pattern. Do not fasten to brick veneer, cantilevered floors, or a truss ribbon board.',
          tools: ['drill/driver', 'impact driver', 'circular saw', 'level'],
          materials: ['PT 2x ledger', '1/2 in. hot-dip galvanized or stainless lags/bolts + washers', 'ledger flashing'],
          safety_ids: ['fall_edge', 'ladder', 'power_tool'],
          qa_ids: ['ledger_flashing', 'ledger_fasteners', 'no_veneer_attach'],
          code_refs: [{ section: 'R507', code_type: 'IRC', note: 'Decks — ledger attachment' }, { section: 'R703.8', code_type: 'IRC', note: 'Flashing at wall penetrations' }],
        },
        {
          title: 'Set posts and beams',
          instruction: 'Set 6x6 (or larger) posts on the footing post bases, plumb and brace them, and cut to height. Set the beam on post caps or notched posts with the connectors from the plan; cut ends get field preservative.',
          tools: ['circular saw', 'reciprocating saw', 'level', 'clamps'],
          materials: ['6x6 PT posts', 'beam plies', 'post caps / post bases', 'field-applied preservative'],
          safety_ids: ['power_tool', 'heavy_lift', 'fall_edge'],
          qa_ids: ['post_size', 'connectors_coated', 'cut_ends_treated'],
        },
        {
          title: 'Frame joists, hold-downs and blocking',
          instruction: 'Hang joists at the planned spacing with corrosion-resistant hangers fully nailed per the hanger maker. Install the lateral-load hold-down connections to the house framing, rim and blocking. Call for the framing inspection before any decking covers the connections.',
          tools: ['framing nailer', 'hammer', 'connector nailer', 'level'],
          materials: ['PT joists', 'joist hangers', 'hanger nails/screws (coated)', 'hold-down tension devices'],
          safety_ids: ['fall_edge', 'nailer'],
          qa_ids: ['hangers_full_nailed', 'hold_downs', 'connectors_coated'],
          gating_inspection_type: 'framing',
          code_refs: [{ section: 'R507', code_type: 'IRC', note: 'Decks — joists, beams and lateral connection' }, { section: 'R317', code_type: 'IRC', note: 'Protection of wood against decay' }],
        },
        {
          title: 'Install decking, guards and stairs',
          instruction: 'Fasten decking to the maker\'s gap and fastener schedule. Install guard posts with the specified connection to the rim or outside joist wherever the walking surface is more than 30 in. above grade, then rails and balusters. Build stairs at least 36 in. wide on 2x12 stringers with uniform risers and treads, plus a graspable handrail.',
          tools: ['saw', 'drill/driver', 'decking fastening tool', 'stair gauge'],
          materials: ['decking (wood or composite)', 'deck screws / hidden fasteners', 'guard posts + rail system', '2x12 stringers', 'treads', 'handrail'],
          safety_ids: ['fall_edge', 'power_tool', 'treated_dust'],
          qa_ids: ['guard_where_required', 'guard_post_attach', 'stair_geometry', 'decking_fastening'],
          gating_inspection_type: 'final',
          code_refs: [{ section: 'R312', code_type: 'IRC', note: 'Guards' }, { section: 'R311.7', code_type: 'IRC', note: 'Stairways' }],
        },
      ],
    },
  ],
  code_refs: {
    footing: [{ section: 'R507', code_type: 'IRC', note: 'Decks — footing size and depth', prov: irc }],
    framing: [{ section: 'R507', code_type: 'IRC', note: 'Decks — ledger, joists, lateral load connection', prov: irc }],
    final: [{ section: 'R312', code_type: 'IRC', note: 'Guards', prov: irc }, { section: 'R311.7', code_type: 'IRC', note: 'Stairways', prov: irc }],
  },
  equipment: [
    { when: { title_re: 'deck|porch|footing' }, type: 'air_compressor', reason: 'Pneumatic framing and connector nailers for joists and hangers', optional: true },
    { when: { building_types: ['commercial', 'residential_mf'] }, type: 'skid_steer', reason: 'Auger attachment for many footings on larger decks', optional: true },
  ],
  hazards: [
    { id: 'fall_edge', hazard: 'Fall from the deck edge or joists while framing', hazard_es: PENDING_ES, controls: ['Use guardrails, safety net or personal fall arrest at 6 ft or more above the lower level', 'Plank or cover open joist bays you walk on'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(13)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip or overreach at the ledger', hazard_es: PENDING_ES, controls: ['Set ladders on firm footing at the right angle and extend 3 ft above the landing', 'Keep three points of contact; do not overreach'], controls_es: PENDING_ES, osha_ref: '1926.1053', severity: 3, prov: osha('x') },
    { id: 'struck_utility', hazard: 'Striking buried utilities while digging footings', hazard_es: PENDING_ES, controls: ['Have utilities located and marked before digging', 'Hand-dig near marks'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'power_tool', hazard: 'Saw kickback and cuts from power saws', hazard_es: PENDING_ES, controls: ['Keep guards in place and support the work', 'Unplug or remove the battery to change blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'nailer', hazard: 'Puncture wounds from pneumatic nailers', hazard_es: PENDING_ES, controls: ['Use sequential-trip nailers for framing near people', 'Keep the safety device working; never point a tool at anyone'], controls_es: PENDING_ES, osha_ref: '1926.302(b)', severity: 3, ppe: ['safety glasses'], prov: osha('i') },
    { id: 'cord_shock', hazard: 'Electric shock from cords and tools outdoors', hazard_es: PENDING_ES, controls: ['Use GFCI protection on every temporary receptacle', 'Inspect cords daily; remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'heavy_lift', hazard: 'Strains and crush injuries setting beams and posts', hazard_es: PENDING_ES, controls: ['Two-person lift or mechanical help for beams', 'Brace posts before releasing'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 2, prov: osha('c') },
    { id: 'treated_dust', hazard: 'Eye and skin irritation from treated-lumber and composite dust', hazard_es: PENDING_ES, controls: ['Cut outdoors, wear eye protection and gloves', 'Wash before eating; never burn offcuts'], controls_es: PENDING_ES, osha_ref: '1926.28(a)', severity: 2, ppe: ['safety glasses', 'gloves', 'dust mask'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'footing_depth', phase: 'foundation', item: 'Every footing bears on undisturbed soil at least 12 in. below grade or below the frost line, whichever is deeper.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'footing_location', phase: 'foundation', item: 'No footing over a septic field, utility line or enclosed meter.', item_es: { status: 'translated', text: 'Ninguna zapata sobre campo séptico, línea de servicio o medidor.' }, prov: dca6 },
    { id: 'post_size', item: 'Posts are 6x6 nominal or larger and within the height limits of the approved table.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'ledger_flashing', item: 'Siding removed at the ledger and continuous corrosion-resistant flashing with drip edge installed above it.', item_es: PENDING_ES, prov: dca6 },
    { id: 'ledger_fasteners', item: 'Ledger fastened with 1/2 in. lag screws or through-bolts with washers in a staggered pattern; lag tips pass the inside face of the rim.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'no_veneer_attach', item: 'Ledger is not attached to brick or stone veneer, a cantilevered floor, or a truss ribbon board.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'connectors_coated', item: 'Hangers, post bases and fasteners in treated lumber are hot-dip galvanized (G-185) or stainless; stainless near salt water.', item_es: PENDING_ES, prov: dca6 },
    { id: 'cut_ends_treated', item: 'Field cuts on preservative-treated lumber are field-treated.', item_es: { status: 'translated', text: 'Los cortes en obra de madera tratada se tratan en obra.' }, prov: dca6 },
    { id: 'hangers_full_nailed', item: 'Every joist hanger has all nail holes filled with the fastener the hanger maker specifies.', item_es: PENDING_ES, safety: true, prov: { src: ['awc-dca6', 'simpson-deckcode'], confidence: 'verified', last_verified: D } },
    { id: 'hold_downs', item: 'Lateral-load hold-down connections to the house framing installed and visible for inspection.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'guard_where_required', item: 'Guards installed wherever the walking surface is more than 30 in. above grade.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'guard_post_attach', item: 'Guard posts attached to the rim or outside joist with the specified hardware, not just toe-screwed.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'stair_geometry', item: 'Stairs at least 36 in. wide on 2x12 stringers, uniform risers and treads, landing at least 36 in. deep, handrail installed.', item_es: PENDING_ES, safety: true, prov: dca6 },
    { id: 'decking_fastening', item: 'Decking fastened and gapped per the decking manufacturer; no protruding fasteners.', item_es: { status: 'translated', text: 'Entablado fijado y con separación según el fabricante; sin tornillos salidos.' }, prov: { src: ['awc-dca6'], confidence: 'derived', last_verified: D, note: 'Manufacturer schedules vary — follow the product installed.' } },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Holes dug to required depth on undisturbed soil, before concrete is placed', item_es: PENDING_ES, ref: 'DCA 6' },
      { item: 'Post base / anchor ready to set per plan', item_es: PENDING_ES },
    ],
    framing: [
      { item: 'Ledger flashing, fasteners and stagger visible', item_es: PENDING_ES, ref: 'DCA 6' },
      { item: 'All hangers fully nailed; hold-downs installed', item_es: PENDING_ES, ref: 'DCA 6' },
      { item: 'Beam, post and connector sizes match the approved plan', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Guards, guard posts and stair handrail complete', item_es: PENDING_ES, ref: 'DCA 6' },
      { item: 'Stair rise/run uniform; landing in place', item_es: PENDING_ES, ref: 'DCA 6' },
    ],
  },
  assemblies: [
    { code: 'B-DECK-FRAME-SF', name: 'Deck framing, PT (joists, beams, posts, hangers) per SF of deck', name_es: 'Estructura de terraza en madera tratada (viguetas, vigas, postes, colgadores) por pie²', unit: 'SF', csi: '06 15 00',
      material_cost_cents: { v: 700, prov: est('PT lumber + coated connectors, national baseline 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('2-person crew frames ~130–170 SF/day') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('cut-offs on joists/beams') } },
    { code: 'B-DECK-COMPOSITE-SF', name: 'Composite decking with hidden fasteners per SF', name_es: 'Entablado compuesto con fijación oculta por pie²', unit: 'SF', csi: '06 73 00',
      material_cost_cents: { v: 950, prov: est('mid-grade capped composite, national baseline 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('board install incl. picture-frame trim') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 8, prov: est('end cuts + border') } },
    { code: 'B-DECK-WOOD-SF', name: 'PT wood decking, face-screwed, per SF', name_es: 'Entablado de madera tratada atornillado por pie²', unit: 'SF', csi: '06 15 00',
      material_cost_cents: { v: 350, prov: est('5/4 PT decking + coated screws, 2026') }, labor_hours_per_unit: { v: 0.06, prov: est('face-screwed boards') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('end cuts') } },
    { code: 'B-DECK-RAIL-LF', name: 'Deck guard system (posts, rails, balusters) per LF', name_es: 'Barandal de terraza (postes, pasamanos, balaustres) por pie lineal', unit: 'LF', csi: '06 15 00',
      material_cost_cents: { v: 4500, prov: est('mid-grade composite/aluminum rail kit incl. post hardware') }, labor_hours_per_unit: { v: 0.5, prov: est('post blocking + rail install') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('kit cut-offs') } },
    { code: 'B-DECK-STAIR-RISER', name: 'Deck stair per riser (stringers, treads, risers, handrail share)', name_es: 'Escalera de terraza por peralte (zancas, huellas, contrahuellas, pasamanos)', unit: 'RISER', csi: '06 15 00',
      material_cost_cents: { v: 6000, prov: est('2x12 stringers + treads + handrail share') }, labor_hours_per_unit: { v: 1.0, prov: est('layout, cut and install per riser') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 10, prov: est('stringer layout waste') } },
    { code: 'B-DECK-FOOTING-EA', name: 'Deck pier footing with form tube and post base, each', name_es: 'Zapata de pilote para terraza con tubo de cimbra y base de poste, c/u', unit: 'EA', csi: '03 30 00',
      material_cost_cents: { v: 4500, prov: est('form tube, bagged/ready-mix share, cast-in post base') }, labor_hours_per_unit: { v: 1.5, prov: est('hand/auger dig, set tube, pour') },
      equipment_cost_cents: { v: 1000, prov: est('powered auger rental share') }, waste_pct: { v: 5, prov: est('concrete over-pour') } },
    { code: 'B-DECK-LEDGER-LF', name: 'Ledger attachment with flashing and through-bolts/lags per LF', name_es: 'Fijación de larguero con botaguas y pernos/tirafondos por pie lineal', unit: 'LF', csi: '06 15 00',
      material_cost_cents: { v: 1200, prov: est('PT 2x10 ledger, flashing, 1/2 in. coated lags + washers') }, labor_hours_per_unit: { v: 0.25, prov: est('siding removal, flash, fasten') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('flashing laps') } },
  ],
  quantity_rules: [
    { code: 'B-DECK-FRAME-SF', assumption: 'Deck called out on plans — assume ≈192 SF (12×16) until measured', qty: { basis: { component: 'deck' }, mul: 192 } },
    { code: 'B-DECK-COMPOSITE-SF', assumption: 'Composite decking assumed over the ≈192 SF deck — switch to B-DECK-WOOD-SF if wood', qty: { basis: { component: 'deck' }, mul: 192 } },
    { code: 'B-DECK-FOOTING-EA', assumption: '≈6 pier footings for a 12×16 attached deck (3 per beam line ×2 lines incl. stair landing)', qty: { basis: { component: 'deck' }, mul: 6 } },
    { code: 'B-DECK-LEDGER-LF', assumption: '≈16 LF ledger along the house', qty: { basis: { component: 'deck' }, mul: 16 } },
    { code: 'B-DECK-RAIL-LF', assumption: '≈28 LF guard on the three open sides minus stair opening', qty: { basis: { component: 'deck' }, mul: 28 } },
    { code: 'B-DECK-STAIR-RISER', assumption: '≈4 risers to grade (≈30 in. deck height)', qty: { basis: { component: 'deck' }, mul: 4 } },
  ],
  components: [
    // Qualifier required: bare "DECK" also means roof/steel deck ("METAL DECK", "ROOF DECK", "DECK SCREWS").
    { token: 'deck', re: "\\b(?:NEW|PROPOSED|COMPOSITE|WOOD|TREATED|REAR|FRONT|SIDE|ATTACHED|RAISED|EXISTING)\\s+(?:\\d+['\\x22]?\\s*[xX]\\s*\\d+['\\x22]?\\s+)?(?:COMPOSITE\\s+|WOOD\\s+)?DECK\\b|\\bDECK\\s+(?:FRAMING|LEDGER|JOISTS?|FOOTINGS?|STAIRS?|RAILINGS?|GUARDS?)\\b", example: "NEW 12'x16' COMPOSITE DECK", vision_hint: 'exterior deck or porch platform drawn on plan',
      task: { title: 'Build deck — footings, ledger, framing, decking, guards & stairs', phase: 'finishes_exterior', csi: '06 15 00', days: 4 } },
  ],
  dependency_hints: [
    { after_trades: ['siding'], note: 'Ledger flashing integrates with the siding/WRB — siding work at the ledger precedes deck framing.' },
  ],
});
