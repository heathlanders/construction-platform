// Trade Knowledge Pack — acoustical_ceilings (Acoustical Ceilings). Wave 15 — NEW-TRADE pattern (no hand
// recipe). Suspended T-bar grid + lay-in tile/panel ceilings, tile replacement in existing grid, and
// specialty clouds/baffles (CSI 09 51 / 09 53). Framed drywall ceilings are metal_stud_framing
// (B-MSF-CEIL-SF); ceiling tile asbestos removal is abatement (B-ABT-CEIL-SF).
// Dossier: docs/trade-packs/dossiers/acoustical_ceilings.md. Sources: UFGS 09 51 00 (Aug 2020), City of
// Bellevue suspended-ceiling inspection checklist (SDC D–F, Apr 2022), Armstrong suspended-ceiling
// install guide, 29 CFR 1926 (C, E, I, K, L, M, X, Z), IBC 808.1.1 / 1613.1 and NEC 410.36 / 300.11
// (reference only). ASTM C635/C636/E580, ASCE 7 and CISCA guides are reference-only (never copied).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['acoustical_ceilings-ufgs-09-51-00'], confidence: 'verified' as const, last_verified: D };
const bel = { src: ['acoustical_ceilings-bellevue-checklist'], confidence: 'verified' as const, last_verified: D };
const arm = { src: ['acoustical_ceilings-armstrong-howto'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });


export default definePack({
  key: 'acoustical_ceilings',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs suspended acoustical ceilings — hanger wires to structure, perimeter angle, main runners and cross tees, seismic bracing where required, support for lights and diffusers, and lay-in tiles or panels — plus tile replacement in existing grid and specialty clouds and baffles, after the above-ceiling work is inspected.',
    summary_es: 'Instala plafones acústicos suspendidos — alambres colgantes a la estructura, ángulo perimetral, largueros principales y tes transversales, arriostre sísmico cuando se requiere, soporte para luminarias y difusores, y placas o paneles sobrepuestos — además del reemplazo de placas en retícula existente y nubes y mamparas acústicas, después de inspeccionar los trabajos sobre el plafón.',
    glossary: [
      { term: 'Main runner (main tee)', term_es: 'Larguero principal (te principal)', def: 'The long grid member hung from the wires, usually 4 ft apart, that carries the ceiling.', def_es: 'Perfil largo de la retícula colgado de los alambres, normalmente a 4 pies entre sí, que carga el plafón.' },
      { term: 'Cross tee', term_es: 'Te transversal', def: 'Shorter grid member that clips into the mains to form the 2x2 or 2x4 openings.', def_es: 'Perfil más corto que se engancha a los largueros para formar los módulos de 2x2 o 2x4.' },
      { term: 'Wall angle (wall molding)', term_es: 'Ángulo perimetral (moldura de muro)', def: 'L-shaped trim fastened to the walls at ceiling height; grid ends rest on it.', def_es: 'Moldura en forma de L fijada a los muros a la altura del plafón; los extremos de la retícula se apoyan en ella.' },
      { term: 'Hanger wire', term_es: 'Alambre colgante', def: 'Wire tied to the structure above and wrapped through the main runner to hold the grid up.', def_es: 'Alambre amarrado a la estructura superior y enrollado en el larguero para sostener la retícula.' },
      { term: 'Lay-in tile (panel)', term_es: 'Placa sobrepuesta (panel)', def: 'Acoustical panel that drops into the grid opening and rests on the tee flanges.', def_es: 'Panel acústico que se coloca dentro del módulo de la retícula y descansa sobre los patines de las tes.' },
      { term: 'Border (perimeter) tile', term_es: 'Placa de borde (perimetral)', def: 'Cut tile at the walls; a balanced layout makes borders equal on opposite sides and at least half a tile.', def_es: 'Placa cortada junto a los muros; un trazo balanceado deja bordes iguales en lados opuestos y de al menos media placa.' },
      { term: 'Splay wires (seismic bracing)', term_es: 'Alambres en abanico (arriostre sísmico)', def: 'Cluster of four sloped wires plus a strut that keeps the ceiling from swaying in an earthquake.', def_es: 'Grupo de cuatro alambres inclinados más un puntal que evita que el plafón se mueva en un sismo.' },
      { term: 'Above-ceiling inspection', term_es: 'Inspección sobre el plafón', def: 'Hold point where MEP, sprinkler, dampers and firestopping above the grid are checked before tiles close it up.', def_es: 'Punto de espera donde se revisan instalaciones, rociadores, compuertas y sellos cortafuego sobre la retícula antes de colocar las placas.' },
      { term: 'Reflected ceiling plan (RCP)', term_es: 'Plano de plafón reflejado', def: 'Drawing of the ceiling as seen from above: grid layout, heights, lights, diffusers and sprinklers.', def_es: 'Plano del plafón visto desde arriba: trazo de la retícula, alturas, luminarias, difusores y rociadores.' },
      { term: 'Cloud / baffle', term_es: 'Nube / mampara acústica', def: 'Free-hanging acoustical panel (flat cloud or vertical baffle) hung on cables instead of a full grid.', def_es: 'Panel acústico suspendido libremente (nube horizontal o mampara vertical) colgado con cables en lugar de una retícula completa.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'suspended_grid',
      example_title: 'Suspended acoustic ceiling system',
      when: { title_re: '\\bacoustic(?:al)?\\s+ceilings?|suspended\\s+(?:acoustic(?:al)?\\s+)?ceilings?|ceiling\\s+grid|grid\\s*(?:&|and)\\s*tiles?|lay[- ]in\\s+(?:ceilings?|tiles?|panels?)|\\bact\\s+ceilings?|drop\\s+ceilings?|t[- ]bar\\s+ceilings?' },
      steps: [
        {
          title: 'Confirm above-ceiling work is done and inspected',
          instruction: 'Before any tile goes in, walk the space with the reflected ceiling plan. Ductwork, piping, conduit, sprinkler branch lines and heads, fire/smoke dampers and firestopping above the ceiling line must be finished and pass the above-ceiling inspection. Check that damper and valve access points line up with a tile or an access panel. Store tiles unopened in the room for 24 hours at the room’s normal temperature and humidity.',
          detail: 'UFGS 09 51 00 asks for 60–85 °F and no more than 70% relative humidity for 24 hours before, during and after tile goes in — HVAC running and wet trades (plaster, concrete, terrazzo) finished and dry.',
          tools: ['reflected ceiling plan', 'flashlight', 'thermo-hygrometer'],
          materials: [],
          safety_ids: ['lift_fall', 'ladder_top_step', 'live_wiring'],
          qa_ids: ['above_ceiling_signoff', 'acclimation'],
        },
        {
          title: 'Lay out from the center and set the wall angle',
          instruction: 'Find the room center and lay the grid out so the border tiles are equal on opposite walls and as wide as possible — never a sliver under half a tile. Laser a level line at ceiling height on every wall and fasten the wall angle to it near each end and at the spacing on the detail. Miter or cap the corners. In seismic areas (design category D–F) use the wider perimeter angle the details call for.',
          tools: ['rotary laser', 'tape measure', 'chalk line', 'screw gun or powder-actuated tool', 'tin snips'],
          materials: ['wall angle / wall molding', 'corner caps', 'fasteners for the wall type'],
          safety_ids: ['ladder_top_step', 'pat_tool', 'sharp_edges', 'eye_debris'],
          qa_ids: ['border_balance', 'wall_angle'],
          code_refs: [{ section: '808.1.1', code_type: 'IBC', note: 'Suspended acoustical ceilings installed per ASTM C635, C636 and maker instructions' }],
        },
        {
          title: 'Hang wires from the structure',
          instruction: 'Install hanger wires along each main runner line, at the spacing and wire gauge on the detail (commonly 12 ga at 4 ft), tied to the structure — not to the underside of steel deck, ducts, pipes, conduit or another trade’s hangers. Wrap each end at least three tight turns. Keep wires plumb; where an obstruction is in the way, splay the wire and counter-splay or brace it, or hang a trapeze channel. Add wires at each corner of light fixtures and next to grilles.',
          tools: ['scissor lift or rolling scaffold', 'hammer drill or powder-actuated tool', 'wire twister', 'laser'],
          materials: ['hanger wire per detail', 'eye pins, anchors or clips to structure', 'cold-rolled channel for trapezes'],
          safety_ids: ['lift_fall', 'scaffold_ride', 'pat_tool', 'silica_drilling', 'eye_debris', 'falling_objects', 'live_wiring'],
          qa_ids: ['hanger_spacing', 'wires_plumb'],
          code_refs: [{ section: '808.1.1', code_type: 'IBC', note: 'Hangers and suspension installed per the referenced installation practice' }],
        },
        {
          title: 'Set main runners and cross tees level and square',
          instruction: 'Trim the first main so a cross-tee slot lands at the border distance, hang it on the wires and level the grid to the laser. Clip in cross tees, check the openings for square with a tape on the diagonals, and keep mains off the walls where the detail shows a gap. In seismic design category D–F: fix the grid to the wall angle on two adjacent walls, leave the clearance shown at the free ends, tie free ends together with spreader bars or listed clips, and add splay-wire clusters with a compression strut at the spacing on the seismic detail.',
          tools: ['laser', 'tape measure', 'tin snips', 'pliers', 'screw gun'],
          materials: ['main runners (duty class per spec)', 'cross tees', 'spreader bars or perimeter clips', 'splay wire and compression struts (seismic)'],
          safety_ids: ['lift_fall', 'sharp_edges', 'eye_debris', 'falling_objects'],
          qa_ids: ['grid_level', 'seismic_perimeter', 'seismic_bracing'],
          code_refs: [{ section: '1613.1', code_type: 'IBC', note: 'Seismic design of nonstructural components per ASCE 7, incl. suspended ceilings' }],
        },
        {
          title: 'Support lights, diffusers and sprinkler heads',
          instruction: 'Fasten every lay-in light to the grid with clips so it cannot fall out, and run the extra wires from its corners to the structure — heavy fixtures and pendants hang from the structure on their own. Electrical wiring and cables run on their own support wires, never laid on the grid or tiles. Diffusers and grilles get the support the detail shows. Around sprinkler heads leave the clearance or oversized ring the seismic detail calls for so the ceiling can move.',
          tools: ['pliers', 'wire twister', 'screw gun'],
          materials: ['fixture clips', 'supplemental hanger wire', 'sprinkler trim rings'],
          safety_ids: ['live_wiring', 'lift_fall', 'falling_objects'],
          qa_ids: ['fixture_support', 'wiring_independent', 'sprinkler_clearance'],
          code_refs: [
            { section: '410.36(B)', code_type: 'NEC', note: 'Luminaires in suspended ceilings fastened to the framing by mechanical means' },
            { section: '300.11', code_type: 'NEC', note: 'Wiring above suspended ceilings not supported by the ceiling grid or its wires' },
          ],
        },
        {
          title: 'Drop in tiles, clean and call the final',
          instruction: 'Cut border tiles face up with a sharp knife and drop the tiles in with clean gloves, edges tight to the flanges and pattern running one way. Install hold-down clips where the spec, fire rating or light tiles require them. Do not lay insulation on the tiles. Replace chipped, stained or warped tiles, clean smudges, check access tiles under dampers and valves, then call the final.',
          tools: ['utility knife', 'straightedge', 'clean cotton gloves', 'tile saw or knife for tegular edges'],
          materials: ['acoustical tiles / panels', 'hold-down clips', 'spare attic stock'],
          safety_ids: ['ladder_top_step', 'fiber_dust', 'sharp_edges', 'housekeeping'],
          qa_ids: ['tile_fit', 'finish_clean'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '808.1.1', code_type: 'IBC', note: 'Acoustical ceiling system complete per its installation standard' }],
        },
      ],
    },
    {
      id: 'tile_replacement',
      example_title: 'Replace damaged ceiling tiles',
      priority: 5,
      when: { title_re: '(?:replace|replacement|swap)\\w*\\s+(?:\\w+\\s+){0,2}(?:ceiling\\s+)?tiles?|ceiling\\s+tile\\s+(?:replacement|repair)|re[- ]?tile\\s+(?:the\\s+)?ceiling' },
      steps: [
        {
          title: 'Check age and cause before removing tiles',
          instruction: 'In an older building, confirm the owner’s asbestos survey covers the ceiling tiles before you lift one; if the tiles are suspect and not tested, stop and get them tested. Find and fix the cause of stained tiles (roof, pipe or condensate leak) first. Match the replacement tile: size, edge, pattern, color, and fire rating where the ceiling is rated.',
          tools: ['flashlight', 'moisture meter'],
          materials: ['replacement tiles matching type and rating'],
          safety_ids: ['asbestos_survey', 'ladder_top_step', 'live_wiring'],
          qa_ids: ['match_rating'],
        },
        {
          title: 'Remove and replace the tiles',
          instruction: 'Lift tiles out without bending the tees; bag wet or moldy tiles at the ladder. Check the grid while it is open — reset bent tees and loose wires. Drop in the new tiles, add hold-down clips where they were, and keep fixture and wiring supports untouched.',
          tools: ['stepladder or rolling scaffold', 'utility knife', 'clean gloves'],
          materials: ['replacement tiles', 'hold-down clips', 'disposal bags'],
          safety_ids: ['ladder_top_step', 'fiber_dust', 'falling_objects', 'housekeeping'],
          qa_ids: ['tile_fit', 'grid_level'],
        },
        {
          title: 'Clean up and record',
          instruction: 'Vacuum dust with a HEPA vacuum — do not dry sweep. Leave spare tiles with the owner and note the rooms and tile type replaced.',
          tools: ['HEPA vacuum'],
          materials: [],
          safety_ids: ['fiber_dust', 'housekeeping'],
          qa_ids: ['finish_clean'],
        },
      ],
    },
    {
      id: 'clouds_baffles',
      example_title: 'Install acoustic ceiling clouds and baffles',
      priority: 10,
      when: { title_re: '\\bclouds?\\b|\\bbaffles?\\b|acoustic(?:al)?\\s+(?:wall\\s+)?panels?\\s+(?:hung|suspended)|specialty\\s+ceilings?' },
      steps: [
        {
          title: 'Lay out clouds and check sprinklers and lights',
          instruction: 'Mark cloud and baffle locations from the reflected ceiling plan. Check each one against sprinkler heads, smoke detectors, diffusers and lights — a cloud can block a sprinkler spray, so get the fire-sprinkler designer’s OK on any conflict before hanging it.',
          tools: ['laser', 'reflected ceiling plan', 'tape measure'],
          materials: [],
          safety_ids: ['lift_fall', 'ladder_top_step'],
          qa_ids: ['sprinkler_clearance', 'above_ceiling_signoff'],
        },
        {
          title: 'Hang cables or framing from the structure',
          instruction: 'Anchor the hanging kit or sub-framing to the structure at the points and with the anchors the maker’s instructions list — not to ducts, pipes or the ceiling grid unless the kit is made for it. Level the cable lengths to the laser.',
          tools: ['scissor lift', 'hammer drill', 'laser', 'torque driver'],
          materials: ['cable hanging kit or cloud framing', 'structural anchors'],
          safety_ids: ['lift_fall', 'pat_tool', 'silica_drilling', 'falling_objects', 'eye_debris'],
          qa_ids: ['hanger_spacing', 'grid_level'],
        },
        {
          title: 'Mount the panels and check them',
          instruction: 'Attach the panels with the maker’s clips, check that every panel is level, locked and has all its hangers, wipe them clean and call the final with the rest of the ceiling.',
          tools: ['lift', 'clean gloves', 'level'],
          materials: ['cloud or baffle panels', 'mounting clips'],
          safety_ids: ['lift_fall', 'falling_objects'],
          qa_ids: ['finish_clean'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    final: [
      { section: '808.1.1', code_type: 'IBC', note: 'Suspended acoustical ceilings installed per ASTM C635, C636 and maker instructions', prov: icc },
      { section: '1613.1', code_type: 'IBC', note: 'Seismic design of nonstructural components — ceilings braced per ASCE 7 / ASTM E580 by category', prov: icc },
      { section: '410.36(B)', code_type: 'NEC', note: 'Luminaires in suspended ceilings mechanically fastened to the ceiling framing', prov: nec },
      { section: '300.11', code_type: 'NEC', note: 'Wiring above suspended ceilings supported independently of the ceiling grid', prov: nec },
    ],
  },
  equipment: [
    { when: { title_re: 'acoustic|ceiling|grid|tile|cloud|baffle', building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'scissor_lift', reason: 'Hang wires, set grid and drop tiles at ceiling height across open floors', optional: true },
    { when: { title_re: 'cloud|baffle|high[- ]bay|gym|atrium', building_types: ['commercial', 'industrial'] }, type: 'boom_lift', reason: 'Reach structure over high or obstructed areas for cloud and baffle hangers', optional: true },
  ],
  hazards: [
    { id: 'lift_fall', hazard: 'Fall from a scissor lift or rolling scaffold while working at the ceiling', hazard_es: PENDING_ES, controls: ['Keep guardrails in place on platforms more than 10 ft up; lock casters before climbing', 'Drive and set up only on firm, level floor away from floor openings and edges'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'scaffold_ride', hazard: 'Rolling scaffold tipping while someone rides it to the next bay', hazard_es: PENDING_ES, controls: ['Climb down before the scaffold is moved unless every riding condition is met (level, clear floor, proper height-to-base)', 'Push from the base, never pull from the platform'], controls_es: PENDING_ES, osha_ref: '1926.452(w)(6)', severity: 3, prov: osha('l') },
    { id: 'ladder_top_step', hazard: 'Fall from a stepladder while reaching up to the grid', hazard_es: PENDING_ES, controls: ['Never stand on the top step or top cap', 'Move the ladder instead of over-reaching; use a taller ladder or lift'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(13)', severity: 3, prov: osha('x') },
    { id: 'live_wiring', hazard: 'Shock from live wiring or open boxes above the ceiling', hazard_es: PENDING_ES, controls: ['Treat all wiring above the ceiling as live until the electrician confirms it is off', 'Do not move, tie off or cut wiring and fixtures — call the electrician'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'pat_tool', hazard: 'Struck by a pin or misfire from a powder-actuated tool', hazard_es: PENDING_ES, controls: ['Only workers trained on that tool may use it; test it each day before loading', 'Never fire into thin deck, brittle concrete or near an edge without backing'], controls_es: PENDING_ES, osha_ref: '1926.302(e)(1)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'silica_drilling', hazard: 'Breathing silica dust drilling overhead anchor holes in concrete', hazard_es: PENDING_ES, controls: ['Use a drill with a dust shroud and HEPA vacuum, or follow the drilling row of the silica table', 'Do not dry sweep the dust'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('z') },
    { id: 'eye_debris', hazard: 'Dust, wire ends and chips falling into the eyes while working overhead', hazard_es: PENDING_ES, controls: ['Wear safety glasses for all overhead work, drilling and cutting'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'sharp_edges', hazard: 'Cuts from snipped grid, wall angle and wire ends', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves handling and cutting grid', 'Bend wire tails up and out of the way'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'falling_objects', hazard: 'Struck by tools, grid pieces or tiles dropped from the lift', hazard_es: PENDING_ES, controls: ['Hard hats below; barricade the area under overhead work', 'Keep tools and parts in the lift tray, not on the rails'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 3, ppe: ['hard hat'], prov: osha('m') },
    { id: 'fiber_dust', hazard: 'Mineral-fiber and fiberglass dust from cutting and handling tiles', hazard_es: PENDING_ES, controls: ['Cut with a knife rather than a power saw where possible; cut in one area', 'Clean up with a HEPA vacuum; wear a dust mask when cutting a lot of tile'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['N95 dust mask', 'gloves', 'long sleeves'], prov: osha('d') },
    { id: 'asbestos_survey', hazard: 'Disturbing asbestos in old ceiling tiles during replacement or tie-ins', hazard_es: PENDING_ES, controls: ['Get the owner’s asbestos survey before touching existing ceilings in older buildings', 'Stop work and have suspect tile tested; removal is abatement work'], controls_es: PENDING_ES, osha_ref: '1926.1101(k)(2)(i)', severity: 4, prov: osha('z') },
    { id: 'housekeeping', hazard: 'Trips and falls over tile cartons, scrap grid and debris', hazard_es: PENDING_ES, controls: ['Keep aisles and lift paths clear; break down cartons as you go', 'Collect scrap grid and wire in a bin each day'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'above_ceiling_signoff', item: 'Above-ceiling inspection passed (MEP, sprinkler, dampers, firestopping) and signed off before any tile is installed; access tiles or panels sit under dampers, valves and serviceable equipment.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'acclimation', item: 'Tiles stored unopened in the space 24 h before install; space held at 60–85 °F and ≤70% RH with HVAC running and wet trades dry.', item_es: tr('Placas almacenadas sin abrir en el espacio 24 h antes de instalar; espacio entre 60–85 °F y ≤70% de humedad relativa con el aire acondicionado funcionando y trabajos húmedos secos.'), prov: { src: ['acoustical_ceilings-ufgs-09-51-00', 'acoustical_ceilings-armstrong-howto'], confidence: 'verified', last_verified: D } },
    { id: 'border_balance', item: 'Borders equal on opposite walls; no border tile narrower than half a tile unless the RCP shows it.', item_es: tr('Bordes iguales en muros opuestos; ninguna placa de borde menor a media placa salvo que lo indique el plano de plafón reflejado.'), prov: { src: ['acoustical_ceilings-ufgs-09-51-00', 'acoustical_ceilings-armstrong-howto'], confidence: 'verified', last_verified: D } },
    { id: 'wall_angle', item: 'Wall angle level, fastened within 3 in. of each end and at the detailed spacing (UFGS default 16 in.), corners mitered or capped.', item_es: tr('Ángulo perimetral a nivel, fijado a menos de 3 pulg. de cada extremo y a la separación del detalle (16 pulg. por defecto en UFGS), esquinas a inglete o con tapa.'), prov: ufgs },
    { id: 'hanger_spacing', item: 'Hanger wires at the detailed gauge and spacing (commonly 12 ga at 4 ft), tied to structure with at least three tight turns each end — none from steel deck underside, ducts, pipes or conduit; wires at each light-fixture corner.', item_es: PENDING_ES, safety: true, prov: { src: ['acoustical_ceilings-ufgs-09-51-00', 'acoustical_ceilings-bellevue-checklist'], confidence: 'verified', last_verified: D } },
    { id: 'wires_plumb', item: 'Wires plumb (no more than about 1 in 6 out of plumb); splayed wires offset by counter-splay, bracing or a trapeze.', item_es: tr('Alambres a plomo (no más de aprox. 1 en 6 fuera de plomo); alambres inclinados compensados con contra-inclinación, arriostre o trapecio.'), prov: { src: ['acoustical_ceilings-ufgs-09-51-00', 'acoustical_ceilings-bellevue-checklist'], confidence: 'verified', last_verified: D } },
    { id: 'grid_level', item: 'Grid level to the laser with no visible sag; at least two main runners per span.', item_es: tr('Retícula a nivel según el láser sin flechas visibles; al menos dos largueros principales por claro.'), prov: ufgs },
    { id: 'seismic_perimeter', item: 'Seismic category D–F: grid fixed to two adjacent walls, free ends with the detailed clearance (about 3/4 in.) on the angle, spreader bars or listed clips at free ends.', item_es: PENDING_ES, safety: true, prov: bel },
    { id: 'seismic_bracing', item: 'Seismic category D–F ceilings over about 1,000 SF braced with splay-wire clusters and struts at the detailed spacing (about 12 ft o.c., first within 6 ft of walls).', item_es: PENDING_ES, safety: true, prov: bel },
    { id: 'fixture_support', item: 'Every lay-in light clipped to the grid with supplemental wires per detail; heavy fixtures and pendants hung independently from structure.', item_es: PENDING_ES, safety: true, prov: { src: ['acoustical_ceilings-ufgs-09-51-00', 'acoustical_ceilings-bellevue-checklist'], confidence: 'verified', last_verified: D } },
    { id: 'wiring_independent', item: 'No cables or conduit resting on the grid, tiles or ceiling hanger wires.', item_es: PENDING_ES, safety: true, prov: { src: ['nfpa-fa'], confidence: 'verified', last_verified: D } },
    { id: 'sprinkler_clearance', item: 'Sprinkler heads centered in tiles with the oversized ring or flexible drop clearance the seismic detail requires; no cloud or baffle blocking a head.', item_es: PENDING_ES, safety: true, prov: bel },
    { id: 'tile_fit', item: 'Tiles seated tight to the flanges, pattern running one way, no chipped, stained, warped or sagging tiles; hold-down clips where the spec, rating or light (<1 psf) tiles require them.', item_es: tr('Placas asentadas sobre los patines, patrón en una sola dirección, sin placas despostilladas, manchadas, deformadas o colgadas; clips de sujeción donde los piden la especificación, la clasificación de fuego o placas ligeras (<1 lb/pie²).'), prov: ufgs },
    { id: 'match_rating', item: 'Replacement tiles match size, edge and color, and carry the same fire rating in rated ceilings.', item_es: PENDING_ES, safety: true, prov: { src: ['acoustical_ceilings-bellevue-checklist'], confidence: 'verified', last_verified: D } },
    { id: 'finish_clean', item: 'Tiles and grid clean of smudges and dust; damaged units replaced; attic stock handed over.', item_es: tr('Placas y retícula limpias de manchas y polvo; piezas dañadas reemplazadas; placas de repuesto entregadas.'), prov: ufgs },
  ],
  inspection_checklists: {
    above_ceiling_inspection: [
      { item: 'Ductwork, piping, conduit and cabling above the ceiling complete, supported and labeled', item_es: tr('Ductos, tuberías, conduit y cableado sobre el plafón terminados, soportados y etiquetados') },
      { item: 'Sprinkler branch lines and drops in place at the RCP locations', item_es: PENDING_ES },
      { item: 'Fire/smoke dampers installed with access panels or access tiles beneath', item_es: PENDING_ES },
      { item: 'Rated wall penetrations above the ceiling firestopped', item_es: PENDING_ES },
      { item: 'Hanger wires plumb and tied to structure, none from deck underside, ducts or pipes', item_es: PENDING_ES, ref: 'IBC 808.1.1' },
      { item: 'Light fixtures supported per detail; wiring not resting on grid', item_es: PENDING_ES, ref: 'NEC 410.36(B)' },
      { item: 'Seismic perimeter, spreader bars and splay bracing in place (SDC D–F)', item_es: PENDING_ES, ref: 'IBC 1613.1' },
    ],
    final: [
      { item: 'Grid level and square, border tiles balanced, wall angle tight', item_es: tr('Retícula a nivel y a escuadra, placas de borde balanceadas, ángulo perimetral firme') },
      { item: 'All tiles installed, clean and undamaged; hold-down clips where required', item_es: tr('Todas las placas instaladas, limpias y sin daño; clips de sujeción donde se requieren') },
      { item: 'Sprinkler heads, lights and diffusers aligned with the grid and clear', item_es: PENDING_ES },
      { item: 'Access tiles marked under dampers and valves; attic stock delivered', item_es: tr('Placas de acceso señaladas bajo compuertas y válvulas; placas de repuesto entregadas') },
    ],
  },
  assemblies: [
    { code: 'B-ACT-SYS-SF', name: 'Suspended acoustical ceiling — 15/16 in. exposed grid with 2x2 mineral-fiber lay-in tile, wire and wall angle, per SF', name_es: 'Plafón acústico suspendido — retícula 15/16 pulg., placa de fibra mineral 2x2, alambre y ángulo, por pie²', unit: 'SF', csi: '09 51 13',
      description: 'Complete system (grid + tile). Seismic adder is B-ACT-SEIS-SF. Framed drywall ceilings are B-MSF-CEIL-SF.',
      material_cost_cents: { v: 230, prov: est('≈$1.05/SF grid + wire + angle and ≈$1.25/SF standard mineral-fiber 2x2 tile, national distributor baseline 2026') }, labor_hours_per_unit: { v: 0.02, prov: est('≈50 SF/hr per installer for open office layouts incl. wires, grid, borders and tile') },
      equipment_cost_cents: { v: 6, prov: est('scissor lift day share') }, waste_pct: { v: 6, prov: est('border cuts and broken tile') } },
    { code: 'B-ACT-GRID-SF', name: 'Acoustical ceiling suspension only — hanger wire, mains, cross tees and wall angle, per SF', name_es: 'Sólo suspensión de plafón acústico — alambre colgante, largueros, tes transversales y ángulo perimetral, por pie²', unit: 'SF', csi: '09 51 13',
      description: 'Grid where tile is owner- or separately furnished.',
      material_cost_cents: { v: 105, prov: est('standard intermediate/heavy-duty 15/16 in. grid + 12 ga wire + angle per SF, 2026 baseline') }, labor_hours_per_unit: { v: 0.013, prov: est('wires and grid share of the full system labor') },
      equipment_cost_cents: { v: 5, prov: est('scissor lift day share') }, waste_pct: { v: 5, prov: est('end cuts') } },
    { code: 'B-ACT-TILE-REPL-SF', name: 'Ceiling tile replacement in existing grid — remove, dispose and install matching lay-in tile, per SF', name_es: 'Reemplazo de placas en retícula existente — retirar, desechar e instalar placa sobrepuesta igual, por pie²', unit: 'SF', csi: '09 51 13',
      description: 'Non-asbestos tile only (asbestos removal is B-ABT-CEIL-SF).',
      material_cost_cents: { v: 135, prov: est('standard mineral-fiber tile + bags/disposal share, 2026 baseline') }, labor_hours_per_unit: { v: 0.012, prov: est('remove, bag, reset tees and drop new tile in occupied space') },
      equipment_cost_cents: { v: 0, prov: est('ladder / rolling scaffold — no rental') }, waste_pct: { v: 8, prov: est('border cuts and partial cartons') } },
    { code: 'B-ACT-SEIS-SF', name: 'Seismic adder, suspended ceiling (SDC D–F) — wide angle, clips/spreaders, splay wires and struts, per SF', name_es: 'Adicional sísmico, plafón suspendido (CDS D–F) — ángulo ancho, clips, alambres en abanico y puntales, por pie²', unit: 'SF', csi: '09 51 13',
      description: 'Add to B-ACT-SYS-SF or B-ACT-GRID-SF only where the structure is in seismic design category D, E or F.',
      material_cost_cents: { v: 35, prov: est('2 in. angle premium + clips + splay wire clusters/struts at ~144 SF per brace, 2026 baseline') }, labor_hours_per_unit: { v: 0.006, prov: est('perimeter clips, spreader bars and brace points') },
      equipment_cost_cents: { v: 1, prov: est('lift share') }, waste_pct: { v: 5, prov: est('cut-offs') } },
  ],
  quantity_rules: [
    { code: 'B-ACT-SYS-SF', assumption: '≈60% of commercial floor area gets suspended acoustical ceiling (≈15% drywall ceilings, rest exposed or service) — measure from the reflected ceiling plan', when: { building_types: ['commercial'] }, qty: { basis: 'area_sf_sum', mul: 0.6, round: 'ceil' } },
    { code: 'B-ACT-SYS-SF', assumption: '≈10% of industrial floor area (offices, break rooms, toilets) gets suspended acoustical ceiling; plant floor left open — measure from the RCP', when: { building_types: ['industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.1, round: 'ceil' } },
  ],
  dependency_hints: [
    { after_trades: ['ductwork', 'fire_sprinkler', 'electrical', 'drywall'], before_phase: 'punch', note: 'Grid goes in after above-ceiling MEP and sprinkler work pass the above-ceiling inspection and walls are boarded; tile drops in after painting, before punch.' },
  ],
});
