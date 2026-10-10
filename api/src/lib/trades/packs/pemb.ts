// Trade Knowledge Pack — pemb (Pre-Engineered Metal Buildings). Wave 07 — NEW-TRADE pattern (no hand
// recipe, no template tasks). Dossier: docs/trade-packs/dossiers/pemb.md. Sources: UFGS 13 34 19
// (Metal Building Systems, Part 3 Execution), 29 CFR 1926 Subpart R (§1926.752–.761, esp. .758
// systems-engineered metal buildings), Subparts CC, H, L, E; MBMA Metal Building Systems Manual and
// ICC IBC/IECC (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['pemb-ufgs-13-34-19'], confidence: 'verified' as const, last_verified: D };
const mfr = { src: ['pemb-ufgs-13-34-19', 'pemb-mbma'], confidence: 'derived' as const, last_verified: D, note: 'UFGS 13 34 19 §3.3 defers to the manufacturer’s erection drawings and instructions — follow the documents for the building supplied.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'pemb',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Erects pre-engineered (systems-engineered) metal buildings from the manufacturer’s erection drawings — anchor-rod verification, primary rigid frames with temporary and permanent rod/cable bracing, secondary girts, purlins and eave struts, faced blanket insulation, standing-seam or through-fastened roof and wall panels, trim and closures.',
    summary_es: 'Monta edificios metálicos preingenierizados según los planos de montaje del fabricante — verificación de pernos de anclaje, marcos rígidos principales con arriostramiento temporal y permanente de varilla o cable, largueros de muro, correas y puntales de alero, aislamiento en manta con barrera, paneles de techo y muro de junta alzada o con fijación expuesta, molduras y cierres.',
    glossary: [
      { term: 'Rigid frame', term_es: 'Marco rígido', def: 'Main tapered steel column-and-rafter frame that carries the roof and spans the building width.', def_es: 'Marco principal de columnas y vigas de acero de sección variable que soporta el techo y cubre el ancho del edificio.' },
      { term: 'Anchor rod (anchor bolt)', term_es: 'Varilla de anclaje (perno de anclaje)', def: 'Threaded rod cast in the footing or pier that holds a column base plate down.', def_es: 'Varilla roscada colada en la zapata o pedestal que sujeta la placa base de una columna.' },
      { term: 'Anchor bolt plan', term_es: 'Plano de pernos de anclaje', def: 'Manufacturer drawing that shows rod locations, sizes, projection and the column reactions for the foundation design.', def_es: 'Plano del fabricante que muestra ubicación, tamaño y saliente de los pernos y las reacciones de columna para diseñar la cimentación.' },
      { term: 'Purlin', term_es: 'Correa', def: 'Light Z- or C-shaped member spanning between rafters that the roof panels fasten to.', def_es: 'Perfil liviano en Z o C entre vigas del marco al que se fijan los paneles del techo.' },
      { term: 'Girt', term_es: 'Larguero de muro', def: 'Horizontal Z- or C-member on the walls that the wall panels fasten to.', def_es: 'Perfil horizontal en Z o C en los muros al que se fijan los paneles de muro.' },
      { term: 'Eave strut', term_es: 'Puntal de alero', def: 'Member at the top of the sidewall that supports the roof panel edge and the top of the wall panels.', def_es: 'Perfil en la parte alta del muro lateral que soporta el borde del techo y la parte superior de los paneles de muro.' },
      { term: 'Rod / cable bracing (X-bracing)', term_es: 'Arriostramiento de varilla o cable (en X)', def: 'Diagonal rods or cables in the roof and walls that hold the frames plumb against wind.', def_es: 'Varillas o cables diagonales en techo y muros que mantienen los marcos aplomados contra el viento.' },
      { term: 'Flange brace', term_es: 'Riostra de ala', def: 'Small angle from a purlin or girt to the frame’s inside flange that keeps the frame from buckling sideways.', def_es: 'Ángulo pequeño de la correa o larguero al ala interior del marco que evita que el marco se pandee de lado.' },
      { term: 'Standing seam roof', term_es: 'Techo de junta alzada', def: 'Roof panel system joined by raised seams over concealed clips that let the panels move with temperature.', def_es: 'Sistema de paneles unidos por juntas elevadas sobre clips ocultos que permiten el movimiento por temperatura.' },
      { term: 'Faced blanket insulation', term_es: 'Aislamiento en manta con barrera', def: 'Fiberglass roll with a vapor-retarder facing laid over the purlins or girts before the panels go on.', def_es: 'Rollo de fibra de vidrio con barrera de vapor que se tiende sobre correas o largueros antes de los paneles.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'frame_erection',
      example_title: 'Erect metal building frames',
      when: { title_re: 'metal\\s+building|\\bpemb\\b|pre-?engineered|systems?-engineered|rigid\\s+frames?|primary\\s+fram|\\berect(?:ion)?\\b|\\bsteel\\s+frames?' },
      steps: [
        {
          title: 'Verify foundations, anchor rods and concrete strength',
          instruction: 'With the erector present, check footing and pier locations, slab elevation and every anchor rod (size, spacing, projection, plumb) against the manufacturer’s anchor bolt plan. Get written notice that the concrete has reached the required strength and that any rod repairs were approved. Report misplaced rods to the engineer of record — never bend, cut or re-weld them on your own.',
          tools: ['tape measure', 'transit or laser level', 'anchor bolt plan', 'chalk line'],
          materials: [],
          safety_ids: ['green_concrete'],
          qa_ids: ['anchor_layout', 'concrete_strength_notice', 'four_anchor_rods'],
        },
        {
          title: 'Shake out steel and plan the lifts',
          instruction: 'Unload and sort members by mark number near where they go, on dunnage off the ground. Check the shipping list for shorts. Walk the crane setup with the operator: firm level ground, power-line clearance, swing area barricaded, and a lift plan that keeps people out from under loads.',
          tools: ['shipping list / erection drawings', 'tag lines', 'rigging'],
          materials: ['dunnage / cribbing'],
          safety_ids: ['power_line', 'suspended_load'],
          
        },
        {
          title: 'Set the braced bay first',
          instruction: 'Set base plates on clean, level bearing (shims or leveling nuts as detailed). Stand the columns and rafters of the bay that carries the permanent bracing, bolt each rigid frame as the erection drawings require before the crane lets go, and install temporary guys or bracing until that bay is plumbed and its permanent rod or cable bracing is in. Build out from that stable bay.',
          detail: 'Connectors working over 15 ft need fall protection gear on and must be tied off above 30 ft or two stories.',
          tools: ['crane', 'spud wrench', 'impact wrench', 'come-alongs', 'plumb bob or laser'],
          materials: ['frame bolts, nuts and washers', 'temporary cable guys', 'shim packs'],
          safety_ids: ['frame_stability', 'frame_release_bolts', 'connector_fall', 'suspended_load'],
          qa_ids: ['bearing_level', 'temp_bracing', 'frame_bolts_before_release'],
        },
        {
          title: 'Install girts, purlins, eave struts and bracing',
          instruction: 'Hang girts, eave struts and purlins with the lap and bolt pattern on the drawings; where two members share a hole, keep at least one nut on the first member. Install sag rods, flange braces and the permanent rod or cable bracing. Plumb and square each frame, then snug the bracing until it is tight with no sag — do not over-tension.',
          tools: ['aerial lift', 'impact wrench', 'plumb laser', 'tape measure'],
          materials: ['purlins, girts and eave struts', 'flange braces', 'rod or cable bracing', 'sag rods / bridging'],
          safety_ids: ['girt_connection', 'purlin_anchor', 'edge_fall', 'aerial_lift', 'falling_objects'],
          qa_ids: ['flange_braces', 'plumb_square'],
        },
        {
          title: 'Final bolt-up and touch-up',
          instruction: 'Tighten every connection to the level the erection drawings call for (snug-tight or pretensioned) and replace any missing bolts. Do not field cut or drill primary members without the manufacturer engineer’s written approval. Clean and touch up primer at abrasions and field connections, then leave the frame open for the framing inspection and any required special inspection.',
          tools: ['impact wrench', 'torque wrench or turn-of-nut marks', 'wire brush'],
          materials: ['manufacturer touch-up primer'],
          safety_ids: ['edge_fall', 'aerial_lift'],
          qa_ids: ['bolt_tightening', 'no_field_mods'],
          gating_inspection_type: 'framing',
          code_refs: [
            { section: '2205', code_type: 'IBC', note: 'Structural steel — design, fabrication and erection per AISC 360' },
            { section: '2210', code_type: 'IBC', note: 'Cold-formed steel members (purlins, girts, eave struts)' },
            { section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel where required' },
          ],
        },
      ],
    },
    {
      id: 'anchor_rods',
      example_title: 'Anchor bolts for metal building',
      priority: 10,
      when: { title_re: 'anchor\\s+(?:bolts?|rods?)|\\bembeds?\\b' },
      steps: [
        {
          title: 'Lay out rod groups from the anchor bolt plan',
          instruction: 'Establish building lines and column grid from survey control. Mark each rod group location, check the plan dimensions against the foundation drawings, and flag any mismatch to the engineer before forming.',
          tools: ['transit or total station', 'tape measure', 'string lines', 'anchor bolt plan'],
          materials: ['stakes', 'marking paint'],
          safety_ids: ['sheet_edges'],
          qa_ids: ['anchor_layout'],
        },
        {
          title: 'Set rods in templates before the pour',
          instruction: 'Hold each rod group in a plywood or steel template at the plan spacing, elevation and projection. Tie the rods so they stay plumb during the pour, and protect the threads with tape or sleeves. Every column gets at least four rods.',
          tools: ['drill', 'level', 'tape measure'],
          materials: ['anchor rods with nuts and washers', 'rod templates', 'tie wire', 'thread protection'],
          safety_ids: ['sheet_edges'],
          qa_ids: ['anchor_layout', 'four_anchor_rods'],
          gating_inspection_type: 'footing',
          code_refs: [
            { section: '1809', code_type: 'IBC', note: 'Shallow foundations — footings sized for the frame reactions' },
            { section: '1901.3', code_type: 'IBC', note: 'Anchoring to concrete per the ACI 318 anchorage provisions' },
          ],
        },
        {
          title: 'Survey the rods after the pour',
          instruction: 'After the forms strip, re-check every rod for location, spacing, projection and plumb against the plan and record the as-built. Any repair, replacement or field change of a rod needs the engineer of record’s approval and written notice to the erector before that column is set.',
          tools: ['transit or total station', 'tape measure'],
          materials: [],
          safety_ids: ['green_concrete'],
          qa_ids: ['anchor_asbuilt', 'concrete_strength_notice'],
          gating_inspection_type: 'foundation',
          code_refs: [{ section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction, including cast-in anchors' }],
        },
      ],
    },
    {
      id: 'panels_insulation',
      example_title: 'Install metal building roof/wall panels',
      priority: 10,
      when: { title_re: '\\bpanels?\\b|\\bsheeting\\b|standing\\s+seam|\\bsiding\\b|\\bcladding\\b|\\binsulation\\b|\\btrim\\b' },
      steps: [
        {
          title: 'Stage panels and check sequence',
          instruction: 'Land panel bundles on the frame only where the drawings allow, close to a main frame, and strap loose sheets down at the end of every shift — wind lifts them. Check panel lengths and laps against the panel layout, and confirm roof penetration locations against the seams before any panel goes on.',
          tools: ['telehandler or crane', 'panel lifting clamps', 'tape measure'],
          materials: ['panel bundles', 'ratchet straps'],
          safety_ids: ['falling_objects', 'sheet_edges', 'suspended_load'],
          
        },
        {
          title: 'Insulate and sheet the walls',
          instruction: 'Hang faced blanket insulation on the girts with the facing toward the warm side, tabs lapped and stapled or taped continuous. Set wall panels plumb and in line with the building corners, full length from sill to eave, fastened in the pattern on the drawings with washers seated, not crushed.',
          tools: ['screw gun with depth-sensing nose', 'staple gun', 'level', 'shears'],
          materials: ['faced blanket insulation', 'wall panels', 'panel fasteners with sealing washers', 'tape'],
          safety_ids: ['sheet_edges', 'aerial_lift'],
          qa_ids: ['insulation_facing', 'fastener_seating'],
          gating_inspection_type: 'sheathing',
        },
        {
          title: 'Install roof insulation',
          instruction: 'Roll faced blanket across the purlins one run at a time, just ahead of the panels, with thermal blocks or spacers where the drawings call for them. Seal facing tabs, and tape every tear before it is covered.',
          detail: 'Purlins are not a walking surface or a tie-off point unless a qualified person approved it and permanent bridging is in.',
          tools: ['staple gun', 'utility knife', 'tape'],
          materials: ['faced blanket insulation', 'thermal spacer blocks', 'facing tape'],
          safety_ids: ['edge_fall', 'purlin_anchor'],
          qa_ids: ['insulation_facing'],
          gating_inspection_type: 'insulation',
          code_refs: [{ section: 'C402.1', code_type: 'IECC', note: 'Commercial opaque envelope insulation, incl. metal building roof and wall assemblies' }],
        },
        {
          title: 'Install roof panels',
          instruction: 'Start at the end the drawings show, ribs running down the slope, each sheet square to the eave. Through-fastened panels: fasten in the pattern shown. Standing seam: set clips at every purlin and seam with the manufacturer’s seamer. Lap ends at least 8 in. with the sealant shown, and walk only on planks or panel ribs.',
          tools: ['screw gun', 'power seamer (standing seam)', 'shears', 'caulk gun'],
          materials: ['roof panels', 'standing-seam clips or panel fasteners', 'tape sealant / mastic', 'closures'],
          safety_ids: ['edge_fall', 'sheet_edges', 'falling_objects'],
          qa_ids: ['roof_end_lap', 'fastener_seating'],
          gating_inspection_type: 'roof_dry_in',
          code_refs: [
            { section: '1507.4', code_type: 'IBC', note: 'Metal roof panels — slope, material and fastening' },
            { section: '1504.3.2', code_type: 'IBC', note: 'Metal panel roof systems — wind uplift resistance' },
          ],
        },
        {
          title: 'Trim, flash, close and clean up',
          instruction: 'Install eave, rake, ridge and corner trim, closures and flashing with laps that shed water. Sweep metal shavings off the roof and gutters the same day — they rust stains into the finish. Touch up scratches with the manufacturer’s paint and leave the building ready for final.',
          tools: ['screw gun', 'shears', 'caulk gun', 'soft broom'],
          materials: ['trim and flashing', 'foam closures', 'sealant', 'touch-up paint'],
          safety_ids: ['edge_fall', 'sheet_edges'],
          qa_ids: ['swarf_cleaned'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    footing: [
      { section: '1809', code_type: 'IBC', note: 'Shallow foundations — footings sized for the frame reactions', prov: icc },
      { section: '1901.3', code_type: 'IBC', note: 'Anchoring to concrete per the ACI 318 anchorage provisions', prov: icc },
    ],
    foundation: [
      { section: '1705.3', code_type: 'IBC', note: 'Special inspection of concrete construction, including cast-in anchors', prov: icc },
    ],
    framing: [
      { section: '2205', code_type: 'IBC', note: 'Structural steel — design, fabrication and erection per AISC 360', prov: icc },
      { section: '2210', code_type: 'IBC', note: 'Cold-formed steel members (purlins, girts, eave struts)', prov: icc },
      { section: '1705.2', code_type: 'IBC', note: 'Special inspection of structural steel where required', prov: icc },
    ],
    roof_dry_in: [
      { section: '1507.4', code_type: 'IBC', note: 'Metal roof panels — slope, material and fastening', prov: icc },
      { section: '1504.3.2', code_type: 'IBC', note: 'Metal panel roof systems — wind uplift resistance', prov: icc },
    ],
    insulation: [
      { section: 'C402.1', code_type: 'IECC', note: 'Commercial opaque envelope insulation, incl. metal building roof and wall assemblies', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'rigid\\s+frames?|\\bframes?\\b|\\berect(?:ion)?\\b|primary\\s+(?:steel|fram)' }, type: 'crane', reason: 'Set columns and rigid-frame rafters', optional: false },
    { when: { title_re: 'metal\\s+building|\\bpemb\\b|pre-?engineered|\\berect(?:ion)?\\b|girts?|purlins?|panels?|sheeting|standing\\s+seam' }, type: 'boom_lift', reason: 'Reach frame connections, girts, purlins and wall panels at height' },
    { when: { title_re: 'panels?|sheeting|standing\\s+seam|metal\\s+building|\\bpemb\\b' }, type: 'telehandler', reason: 'Unload and lift panel bundles and secondary steel', optional: true },
    { when: { title_re: 'anchor\\s+(?:bolts?|rods?)|touch-?up|repair' }, type: 'welder', reason: 'Field repairs only with written engineer approval', optional: true },
  ],
  hazards: [
    { id: 'connector_fall', hazard: 'Connector falls while bolting frames at height', hazard_es: PENDING_ES, controls: ['Connectors working between 15 and 30 ft wear fall arrest, positioning or restraint gear ready to tie off', 'Above 30 ft or two stories, connectors must be tied off or otherwise protected', 'Only trained connectors make initial connections'], controls_es: PENDING_ES, osha_ref: '1926.760(b)(1)', severity: 4, ppe: ['full-body harness', 'self-retracting lifeline'], prov: osha('r') },
    { id: 'edge_fall', hazard: 'Fall from an unprotected roof edge, eave or open purlin bay over 15 ft', hazard_es: PENDING_ES, controls: ['Guardrails, safety nets, or personal fall arrest or restraint above 15 ft', 'Anchor only to points a qualified person approved'], controls_es: PENDING_ES, osha_ref: '1926.760(a)(1)', severity: 4, ppe: ['full-body harness'], prov: osha('r') },
    { id: 'purlin_anchor', hazard: 'Tying off to or walking on purlins and girts', hazard_es: PENDING_ES, controls: ['Never use purlins or girts as a fall-arrest anchor without written approval from a qualified person', 'Walk purlins only to install safety systems, after permanent bridging is in and with fall protection'], controls_es: PENDING_ES, osha_ref: '1926.758(g)', severity: 4, prov: osha('r') },
    { id: 'frame_stability', hazard: 'Partially erected frames collapse or topple in wind', hazard_es: PENDING_ES, controls: ['Keep the structure stable at every stage — temporary guys or bracing until permanent bracing is complete', 'Build out from a fully braced bay', 'Stop erection in high wind'], controls_es: PENDING_ES, osha_ref: '1926.754(a)', severity: 4, prov: osha('r') },
    { id: 'frame_release_bolts', hazard: 'Rigid frame falls after the crane releases it', hazard_es: PENDING_ES, controls: ['Install and tighten the greater of half the bolts or the manufacturer’s count on both sides of the web at each flange before releasing the load'], controls_es: PENDING_ES, osha_ref: '1926.758(c)', severity: 4, prov: osha('r') },
    { id: 'girt_connection', hazard: 'Girt or eave strut drops when a shared connection is opened', hazard_es: PENDING_ES, controls: ['Where members share holes, keep at least one bolt with its nut wrench-tight on the first member unless a field seat secures it'], controls_es: PENDING_ES, osha_ref: '1926.758(e)', severity: 3, prov: osha('r') },
    { id: 'green_concrete', hazard: 'Anchor rods pull out or footings fail under erection loads', hazard_es: PENDING_ES, controls: ['Do not start erection until written notice says the concrete reached 75% of design strength or enough to carry erection loads', 'Confirm any anchor-rod repairs were approved'], controls_es: PENDING_ES, osha_ref: '1926.752(b)', severity: 4, prov: osha('r') },
    { id: 'suspended_load', hazard: 'Struck by a swinging or dropped frame member or panel bundle', hazard_es: PENDING_ES, controls: ['Plan load routes so nobody works under a suspended load except connectors and riggers', 'Use self-closing hook latches and tag lines; a qualified rigger rigs every load', 'Inspect slings and hardware before each shift; use only tagged rigging within its rating'], controls_es: PENDING_ES, osha_ref: '1926.753(d)(1)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: osha('r') },
    { id: 'power_line', hazard: 'Crane boom or load contacts overhead power lines', hazard_es: PENDING_ES, controls: ['Identify the work zone and check power-line distances before setting up', 'De-energize, keep the required clearance, or use a dedicated spotter'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from an aerial lift basket while bolting', hazard_es: PENDING_ES, controls: ['Wear a harness with the lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'falling_objects', hazard: 'Loose bolts, tools or wind-blown panels falling from the roof', hazard_es: PENDING_ES, controls: ['Secure materials and tools not in use aloft', 'Keep other trades out from under erection unless overhead protection is provided', 'Strap panel bundles and loose sheets at the end of the shift'], controls_es: PENDING_ES, osha_ref: '1926.759(a)', severity: 3, prov: osha('r') },
    { id: 'sheet_edges', hazard: 'Cuts from sharp panel, trim and rod edges', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves and sleeves handling panels and trim', 'Carry long sheets on edge with two people'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'safety glasses'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'anchor_layout', phase: 'foundation', item: 'Anchor rod groups match the manufacturer’s anchor bolt plan for location, spacing, diameter, projection and plumb; templates used.', item_es: { status: 'translated', text: 'Los grupos de pernos de anclaje coinciden con el plano del fabricante en ubicación, separación, diámetro, saliente y plomo; se usaron plantillas.' }, prov: ufgs },
    { id: 'anchor_asbuilt', phase: 'foundation', item: 'Post-pour survey of every rod recorded; deviations reported to the engineer of record before erection, no field changes without written approval.', item_es: { status: 'translated', text: 'Levantamiento de cada perno después del colado registrado; desviaciones informadas al ingeniero antes del montaje, sin cambios en obra sin aprobación escrita.' }, prov: { src: ['pemb-ufgs-13-34-19', 'ecfr-1926-r'], confidence: 'verified', last_verified: D } },
    { id: 'concrete_strength_notice', item: 'Written notice on file that footing and pier concrete reached 75% of design strength (or enough for erection loads) before steel is set.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'four_anchor_rods', item: 'Every structural column is anchored with at least four anchor rods.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'bearing_level', item: 'Bearing surfaces clean and roughened; base plates set level on shims, leveling nuts or grout as detailed.', item_es: { status: 'translated', text: 'Superficies de apoyo limpias y rugosas; placas base niveladas sobre calzas, tuercas de nivelación o mortero según detalle.' }, prov: ufgs },
    { id: 'temp_bracing', item: 'Temporary guys or bracing in place on every erected frame until the permanent bracing and connections are complete.', item_es: PENDING_ES, safety: true, prov: { src: ['pemb-ufgs-13-34-19', 'ecfr-1926-r'], confidence: 'verified', last_verified: D } },
    { id: 'frame_bolts_before_release', item: 'Each rigid frame has the required bolts (at least half, or the manufacturer’s count if greater) installed and tight at each flange before the crane releases it.', item_es: PENDING_ES, safety: true, prov: osha('r') },
    { id: 'flange_braces', item: 'Flange braces installed at every location shown on the erection drawings.', item_es: { status: 'translated', text: 'Riostras de ala instaladas en cada ubicación indicada en los planos de montaje.' }, prov: mfr },
    { id: 'plumb_square', item: 'Frames plumbed, aligned and squared before permanent bolt-up; rod or cable bracing snug with no sag.', item_es: { status: 'translated', text: 'Marcos aplomados, alineados y a escuadra antes del apriete final; varillas o cables de arriostramiento tensos sin comba.' }, prov: ufgs },
    { id: 'bolt_tightening', item: 'All connection bolts present and tightened to the level on the erection drawings (snug-tight or pretensioned); no missing nuts or washers.', item_es: { status: 'translated', text: 'Todos los pernos de conexión presentes y apretados al nivel de los planos de montaje (ajuste firme o pretensado); sin tuercas ni arandelas faltantes.' }, prov: mfr },
    { id: 'no_field_mods', item: 'No field cutting, drilling or altering of structural members without the manufacturer engineer’s written approval.', item_es: { status: 'translated', text: 'Ningún corte, perforación ni modificación de elementos estructurales en obra sin aprobación escrita del ingeniero del fabricante.' }, prov: ufgs },
    { id: 'insulation_facing', phase: 'insulation', item: 'Blanket facing continuous toward the warm side, tabs sealed, and every tear taped before panels cover it.', item_es: { status: 'translated', text: 'Barrera de la manta continua hacia el lado cálido, pestañas selladas y cada rotura encintada antes de cubrirla con paneles.' }, prov: ufgs },
    { id: 'fastener_seating', item: 'Panel fasteners in the manufacturer’s pattern, washers seated flat — not under- or over-driven; no stripped screws.', item_es: { status: 'translated', text: 'Tornillos de panel según el patrón del fabricante, arandelas asentadas planas — ni flojas ni aplastadas; sin tornillos barridos.' }, prov: mfr },
    { id: 'roof_end_lap', phase: 'roofing', item: 'Roof panels run with ribs down the slope; end laps at least 8 in. with sealant as detailed.', item_es: { status: 'translated', text: 'Paneles de techo con nervaduras en dirección de la pendiente; traslapes de extremo de al menos 8 pulg. con sellador según detalle.' }, prov: ufgs },
    { id: 'swarf_cleaned', item: 'Panels cut with shears, never a torch; metal shavings and loose fasteners removed from roof, gutters and panels daily; abrasions touched up.', item_es: { status: 'translated', text: 'Paneles cortados con tijeras, nunca con soplete; virutas y tornillos sueltos retirados a diario de techo, canaletas y paneles; rayones retocados.' }, prov: ufgs },
  ],
  inspection_checklists: {
    footing: [
      { item: 'Anchor rods set in templates per the anchor bolt plan before concrete is placed', item_es: PENDING_ES, ref: '1901.3' },
      { item: 'Footing size and reinforcing match the foundation design for the manufacturer’s reactions', item_es: PENDING_ES, ref: '1809' },
    ],
    foundation: [
      { item: 'As-built anchor rod survey on file; any deviation resolved by the engineer of record', item_es: PENDING_ES },
      { item: 'Concrete special inspection reports available where required', item_es: PENDING_ES, ref: '1705.3' },
    ],
    framing: [
      { item: 'Sealed manufacturer erection drawings and design calculations on site', item_es: PENDING_ES },
      { item: 'Permanent rod/cable bracing, flange braces and sag rods installed per drawings', item_es: PENDING_ES, ref: '2205' },
      { item: 'Bolts tightened; structural steel special inspection complete where required', item_es: PENDING_ES, ref: '1705.2' },
    ],
    sheathing: [
      { item: 'Wall panels fastened per pattern; openings framed and flashed', item_es: PENDING_ES },
    ],
    insulation: [
      { item: 'Roof and wall insulation R-values and facing match the energy compliance documents', item_es: PENDING_ES, ref: 'C402.1' },
    ],
    roof_dry_in: [
      { item: 'Roof panel type and clip/fastener pattern match the approved wind-uplift design', item_es: PENDING_ES, ref: '1504.3.2' },
      { item: 'End laps sealed; ridge, eave and penetration flashings installed', item_es: PENDING_ES, ref: '1507.4' },
    ],
    final: [
      { item: 'Trim, closures and gutters complete; roof cleaned of metal shavings', item_es: PENDING_ES },
      { item: 'Manufacturer certification letter and special inspection final report on file', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-PEMB-KIT-SF', name: 'Metal building system package (frames, secondary, through-fastened panels, trim), per SF floor', name_es: 'Paquete de edificio metálico (marcos, secundarios, paneles con fijación expuesta, molduras), por pie² de planta', unit: 'SF', csi: '13 34 19',
      description: 'Supply only, delivered. Clear-span single-story, ~14–20 ft eave. Erection is B-PEMB-ERECT-SF.',
      material_cost_cents: { v: 1600, prov: est('typical 2026 delivered package price for a simple clear-span building, wide regional/steel-price swing — tune per quote') }, labor_hours_per_unit: { v: 0, prov: est('supply only') },
      equipment_cost_cents: { v: 0, prov: est('supply only') }, waste_pct: { v: 0, prov: est('package is fabricated to size') } },
    { code: 'B-PEMB-ERECT-SF', name: 'Erect metal building — frames, secondary, panels, trim, per SF floor', name_es: 'Montaje de edificio metálico — marcos, secundarios, paneles y molduras, por pie² de planta', unit: 'SF', csi: '13 34 19',
      material_cost_cents: { v: 20, prov: est('incidental sealant, fasteners overage and touch-up paint') }, labor_hours_per_unit: { v: 0.05, prov: est('≈5-person erection crew completing ~800–1,000 SF of simple building per day') },
      equipment_cost_cents: { v: 125, prov: est('crane and aerial-lift days spread over floor area for a mid-size building') }, waste_pct: { v: 0, prov: est('materials are incidental') } },
    { code: 'B-PEMB-ANCHOR-EA', name: 'Anchor rod set per column (4 rods, nuts, washers, template), layout and set', name_es: 'Juego de pernos de anclaje por columna (4 varillas, tuercas, arandelas, plantilla), trazo y colocación', unit: 'EA', csi: '05 05 19',
      material_cost_cents: { v: 9000, prov: est('four 3/4 in. headed or hooked rods with nuts/washers plus a template, 2026') }, labor_hours_per_unit: { v: 1, prov: est('layout, template set and post-pour check per column') },
      equipment_cost_cents: { v: 0, prov: est('hand tools and survey instrument') }, waste_pct: { v: 0, prov: est('counted per column') } },
    { code: 'B-PEMB-BLANKET-SF', name: 'Faced fiberglass blanket insulation over purlins/girts, per SF of surface', name_es: 'Aislamiento de manta de fibra de vidrio con barrera sobre correas y largueros, por pie² de superficie', unit: 'SF', csi: '07 21 16',
      description: 'Metal-building blanket with laminated facing, installed with the panels. Use instead of B-INSUL-SF on PEMB projects.',
      material_cost_cents: { v: 110, prov: est('R-13 to R-19 faced metal-building blanket, 2026 distributor pricing range') }, labor_hours_per_unit: { v: 0.012, prov: est('rolled out with the panels by the sheeting crew') },
      equipment_cost_cents: { v: 0, prov: est('included in erection equipment') }, waste_pct: { v: 5, prov: est('end trims and tabs') } },
    { code: 'B-PEMB-SSR-ADD-SF', name: 'Standing-seam roof upgrade over through-fastened roof (adder), per SF roof', name_es: 'Mejora a techo de junta alzada sobre techo con fijación expuesta (adicional), por pie² de techo', unit: 'SF', csi: '07 61 13',
      material_cost_cents: { v: 250, prov: est('panel, clip and trim premium over a through-fastened roof, 2026') }, labor_hours_per_unit: { v: 0.015, prov: est('clip layout and seaming time beyond screwing panels') },
      equipment_cost_cents: { v: 10, prov: est('power seamer rental spread per SF') }, waste_pct: { v: 3, prov: est('panel end trims') } },
  ],
  quantity_rules: [
    { code: 'B-PEMB-KIT-SF', assumption: 'Metal building package priced on the scheduled floor area — confirm against the manufacturer quote', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', round: 'ceil' } },
    { code: 'B-PEMB-ERECT-SF', assumption: 'Erection priced on the scheduled floor area of the metal building', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'area_sf_sum', round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['concrete', 'rebar'], note: 'Steel erection starts only after footings/piers are poured with anchor rods surveyed and the concrete has reached erection strength.' },
  ],
});
