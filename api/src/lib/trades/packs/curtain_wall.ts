// Trade Knowledge Pack — curtain_wall (Curtain Wall / Storefront). Wave 10 — NEW-TRADE pattern (no hand recipe).
// Dossier: docs/trade-packs/dossiers/curtain_wall.md. Sources: UFGS 08 44 00 (curtain wall and glazed
// assemblies), UFGS 08 41 13 (aluminum-framed entrances and storefronts), UFGS 07 92 00 (joint sealants),
// UFGS 07 27 10 (air barrier), 29 CFR 1926 (M, L, CC, H, E, D, I, J, K, Z), IBC 1402/1404/1709/2403/2406 and
// IECC C402.4/C402.5 (reference only). AAMA/FGIA test methods named by number only (reference only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const cw = { src: ['curtain_wall-ufgs-08-44-00'], confidence: 'verified' as const, last_verified: D };
const sf = { src: ['curtain_wall-ufgs-08-41-13'], confidence: 'verified' as const, last_verified: D };
const seal = { src: ['caulking_sealants-ufgs-07-92-00', 'curtain_wall-ufgs-08-44-00'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

const LIFT_TYPES: ('commercial' | 'residential_mf' | 'industrial')[] = ['commercial', 'residential_mf', 'industrial'];

export default definePack({
  key: 'curtain_wall',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs aluminum-framed glass walls on commercial buildings — stick-built curtain wall, factory unitized panels, storefront framing and entrance doors — from shop drawings and anchor layout through glazing, perimeter air/water seals tied to the air barrier, field water testing and final hardware adjustment.',
    summary_es: 'Instala muros de vidrio con marcos de aluminio en edificios comerciales — muro cortina armado en obra, paneles unitizados de fábrica, fachadas comerciales (storefront) y puertas de entrada — desde los planos de taller y el trazo de anclajes hasta el acristalamiento, los sellos perimetrales de aire y agua unidos a la barrera de aire, la prueba de agua en campo y el ajuste final de herrajes.',
    glossary: [
      { term: 'Mullion', term_es: 'Montante', def: 'Vertical aluminum member that carries the glass and the wind load back to the anchors.', def_es: 'Perfil vertical de aluminio que sostiene el vidrio y transmite la carga de viento a los anclajes.' },
      { term: 'Transom (horizontal)', term_es: 'Travesaño', def: 'Horizontal member spanning between mullions that supports the glass above it.', def_es: 'Perfil horizontal entre montantes que soporta el vidrio de arriba.' },
      { term: 'Stick-built curtain wall', term_es: 'Muro cortina armado en obra', def: 'System assembled piece by piece on the building: anchors, mullions, transoms, then glass.', def_es: 'Sistema armado pieza por pieza en el edificio: anclajes, montantes, travesaños y luego el vidrio.' },
      { term: 'Unitized curtain wall', term_es: 'Muro cortina unitizado', def: 'Factory-built framed and glazed panels lifted into place and interlocked floor by floor.', def_es: 'Paneles enmarcados y acristalados en fábrica que se izan y se encastran piso por piso.' },
      { term: 'Storefront', term_es: 'Fachada comercial (storefront)', def: 'Lighter framing set between floor and structure above, usually ground floor, often with entrance doors.', def_es: 'Marco más liviano colocado entre el piso y la estructura superior, normalmente en planta baja, a menudo con puertas.' },
      { term: 'Pressure plate', term_es: 'Placa de presión', def: 'Exterior bar screwed to the mullion that clamps the glass against gaskets; covered by a snap cap.', def_es: 'Barra exterior atornillada al montante que aprieta el vidrio contra los empaques; se cubre con una tapa a presión.' },
      { term: 'Structural silicone glazing', term_es: 'Acristalamiento con silicón estructural', def: 'Glass bonded to the frame with structural silicone instead of an exterior cap.', def_es: 'Vidrio adherido al marco con silicón estructural en lugar de una tapa exterior.' },
      { term: 'Setting block', term_es: 'Calzo de asiento', def: 'Hard rubber block under the bottom edge of the glass that carries its weight.', def_es: 'Bloque de hule duro bajo el borde inferior del vidrio que soporta su peso.' },
      { term: 'Glass bite', term_es: 'Mordida del vidrio', def: 'How far the glass edge sits inside the frame pocket; too little and it can blow out.', def_es: 'Cuánto entra el borde del vidrio en el marco; si es poco, el vidrio puede desprenderse.' },
      { term: 'Embed / anchor clip', term_es: 'Placa embebida / clip de anclaje', def: 'Steel plate or channel cast in the slab edge that the curtain wall anchors bolt or weld to.', def_es: 'Placa o canal de acero colado en el borde de la losa al que se atornillan o sueldan los anclajes del muro cortina.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'curtain_wall_system',
      example_title: 'Curtain wall & storefront glazing',
      when: { title_re: '\\bcurtain[ -]?walls?\\b' },
      steps: [
        {
          title: 'Approve shop drawings and lay out the anchors',
          instruction: 'Do not fabricate or set anything until the shop drawings and engineer-stamped calculations are approved. Shoot bench marks for elevation and building-line offsets on every floor and mark each anchor location from the approved anchor layout.',
          detail: 'If a mark disagrees with the drawings, stop erection in that area until the discrepancy is resolved.',
          tools: ['total station or laser level', 'tape measure', 'chalk line', 'paint marker'],
          materials: ['approved shop drawings and anchor layout'],
          safety_ids: ['slab_edge', 'falling_objects'],
          qa_ids: ['shop_drawings_approved'],
        },
        {
          title: 'Verify embeds and the slab-edge survey',
          instruction: 'Check every embed or anchor location against the layout: position, elevation and slab-edge line. Record anything outside the anchor’s adjustment range and get an engineered fix before setting clips; never field-modify an embed on your own. Drill post-installed anchors only where the engineer allows.',
          tools: ['tape measure', 'laser level', 'rotary hammer with dust extraction', 'torque wrench'],
          materials: ['post-installed anchors where approved'],
          safety_ids: ['slab_edge', 'silica_drill', 'pat_tool'],
          qa_ids: ['embeds_surveyed'],
        },
        {
          title: 'Set anchors and erect the frame or hoist the units',
          instruction: 'Bolt or weld anchor clips, keeping the three-way adjustment. Stick system: hang mullions, set transoms, then plumb, level and align within tolerance before locking the anchors. Unitized system: rig each unit with the approved lifting device, hoist it to the floor, engage the stack joint with the unit below, and lock the anchors. Isolate aluminum from steel, concrete and masonry with pads, tape or coating.',
          detail: 'Typical spec tolerance: 1/8 in. out of plumb or level in 12 ft, 1/2 in. over the full run, 1/4 in. from drawing location — use the project spec values.',
          tools: ['torque wrench', 'level', 'string line', 'welder (where anchors are welded)', 'tag lines'],
          materials: ['anchor clips and bolts', 'mullions and transoms or unitized panels', 'isolation pads or bituminous coating', 'shims'],
          safety_ids: ['slab_edge', 'crane_swing', 'suspended_load', 'rigging', 'aerial_lift', 'hot_work', 'falling_objects'],
          qa_ids: ['frame_tolerance', 'anchors_locked', 'galvanic_isolation'],
        },
        {
          title: 'Glaze the frame',
          instruction: 'Before setting glass, check each opening for open joints, size and clearance; clean the pocket and glass edges with the approved cleaner. Set the glass on setting blocks at the specified points, keep the edge clearance and bite shown on the shop drawings, then install gaskets and the pressure plate (torqued to the maker’s value) and snap caps — or, for structural silicone glazing, apply silicone only to primed, cleaned surfaces within the cure window and leave temporary retainers until it cures.',
          tools: ['vacuum cups', 'glazing knife', 'torque driver', 'caulk gun', 'lint-free cloths'],
          materials: ['insulating glass units per schedule', 'setting blocks and edge blocks', 'gaskets', 'pressure plates and snap caps', 'structural silicone and primer where specified'],
          safety_ids: ['glass_cut', 'aerial_lift', 'falling_objects', 'chem_sealant'],
          qa_ids: ['frame_inspected_before_glass', 'setting_blocks_bite', 'ssg_adhesion'],
        },
        {
          title: 'Seal the perimeter, tie into the air barrier and water test',
          instruction: 'Lap the perimeter transition membrane from the frame onto the wall air barrier so water sheds outward, then install backer rod and perimeter sealant on clean, primed joints. Keep weeps and drainage paths open. Before interior finishes go in, have the testing agency run the field water spray test on the specified bays; open, fix and retest any leak.',
          detail: 'Field water spray testing is commonly specified per AAMA 501.2, with ASTM E1105 / E783 chamber tests when the spec calls for them.',
          tools: ['caulk gun', 'J-roller', 'spatula/tooling tool', 'calibrated spray nozzle (testing agency)'],
          materials: ['perimeter transition membrane', 'backer rod', 'perimeter sealant and primer'],
          safety_ids: ['aerial_lift', 'scaffold_fall', 'chem_sealant'],
          qa_ids: ['perimeter_tie_in', 'sealant_joint', 'weeps_open', 'field_water_test'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: '1404.4', code_type: 'IBC', note: 'Flashing at wall openings, lapped to drain outward' }, { section: 'C402.5', code_type: 'IECC', note: 'Continuous air barrier across fenestration joints' }],
        },
        {
          title: 'Adjust, label-check and clean for final',
          instruction: 'Adjust operable vents and door hardware to close and lock weathertight. Confirm safety-glazing marks where glass is in a hazardous location and leave fenestration rating labels in place for the inspector. Remove protective film and sealant smears, then clean the glass and framing.',
          tools: ['hex keys', 'screwdriver set', 'squeegee'],
          materials: ['approved glass cleaner'],
          safety_ids: ['aerial_lift', 'glass_cut'],
          qa_ids: ['safety_glazing_mark', 'hardware_adjusted'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '2406', code_type: 'IBC', note: 'Safety glazing in hazardous locations' }, { section: 'C402.4', code_type: 'IECC', note: 'Fenestration U-factor and SHGC as labeled' }],
        },
      ],
    },
    {
      id: 'storefront_entrance',
      example_title: 'Install storefront and entrance doors',
      when: { title_re: '^(?!.*\\bcurtain).*\\b(?:storefronts?|entrances?)\\b' },
      steps: [
        {
          title: 'Verify the opening and the sill',
          instruction: 'Check the opening against the shop drawings: width, height, square, and a level sill within the maker’s tolerance. Confirm blockouts for door pivots or closers and power for any electrified hardware or automatic operator.',
          tools: ['tape measure', 'laser level', 'framing square'],
          materials: ['approved shop drawings'],
          safety_ids: ['falling_objects'],
          qa_ids: ['opening_level_sill'],
        },
        {
          title: 'Set the sill flashing and the frame',
          instruction: 'Install the sill flashing or receptor with end dams sealed. Assemble the frame, set it on the receptor, shim and brace it, then anchor it so it is plumb, level and free of twist. Isolate aluminum from masonry, concrete and steel, and bed thresholds in mastic.',
          tools: ['level', 'drill/driver', 'rotary hammer with dust extraction', 'caulk gun'],
          materials: ['sill flashing or receptor with end dams', 'frame members', 'anchors and shims', 'isolation tape or bituminous coating', 'threshold mastic'],
          safety_ids: ['silica_drill', 'glass_cut', 'pat_tool'],
          qa_ids: ['frame_tolerance', 'galvanic_isolation'],
        },
        {
          title: 'Glaze and install the doors',
          instruction: 'Set glass on setting blocks with the specified edge clearance and bite, then install the glazing stops or gaskets. Hang the doors on their pivots or hinges and install closers, exit devices and locks per the hardware schedule.',
          tools: ['vacuum cups', 'glazing knife', 'drill/driver', 'hex keys'],
          materials: ['glass per schedule', 'setting blocks', 'gaskets', 'door hardware per schedule'],
          safety_ids: ['glass_cut', 'chem_sealant'],
          qa_ids: ['setting_blocks_bite', 'hardware_adjusted'],
        },
        {
          title: 'Seal the perimeter and tie into the air barrier',
          instruction: 'Lap the transition membrane from the frame onto the wall air barrier, then backer rod and perimeter sealant on clean, primed joints. Seal metal-to-metal joints with the maker’s sealant and leave the weep holes open.',
          tools: ['caulk gun', 'J-roller', 'tooling tool'],
          materials: ['transition membrane', 'backer rod', 'perimeter sealant and primer'],
          safety_ids: ['chem_sealant', 'aerial_lift'],
          qa_ids: ['perimeter_tie_in', 'sealant_joint', 'weeps_open'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: '1404.4', code_type: 'IBC', note: 'Flashing at wall openings, lapped to drain outward' }, { section: 'C402.5', code_type: 'IECC', note: 'Continuous air barrier across fenestration joints' }],
        },
        {
          title: 'Adjust doors and check glazing for final',
          instruction: 'Adjust closers, pivots and exit devices so doors latch and swing smoothly. Confirm safety-glazing marks in doors and beside doors, leave fenestration labels on for the inspector, then remove film and clean.',
          tools: ['hex keys', 'screwdriver set', 'squeegee'],
          materials: [],
          safety_ids: ['glass_cut'],
          qa_ids: ['hardware_adjusted', 'safety_glazing_mark'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '2406', code_type: 'IBC', note: 'Safety glazing in doors and adjacent hazardous locations' }, { section: 'C402.4', code_type: 'IECC', note: 'Fenestration U-factor and SHGC as labeled' }],
        },
      ],
    },
  ],
  code_refs: {
    sheathing: [
      { section: '1404.4', code_type: 'IBC', note: 'Flashing at exterior wall openings, lapped to drain outward', prov: icc },
      { section: '1402.2', code_type: 'IBC', note: 'Weather protection — exterior wall envelope that drains water outward', prov: icc },
      { section: 'C402.5', code_type: 'IECC', note: 'Continuous air barrier, including joints around fenestration', prov: icc },
    ],
    final: [
      { section: '2403', code_type: 'IBC', note: 'Glass — identification, supports and framing deflection', prov: icc },
      { section: '2406', code_type: 'IBC', note: 'Safety glazing in hazardous locations', prov: icc },
      { section: '1709.5', code_type: 'IBC', note: 'Exterior window and door assemblies — tested and labeled for design pressure', prov: icc },
      { section: 'C402.4', code_type: 'IECC', note: 'Fenestration U-factor and SHGC limits, rated and labeled', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: '\\bcurtain[ -]?walls?\\b', building_types: LIFT_TYPES }, type: 'crane', reason: 'Hoist unitized panels or bundled mullions and large glass to the floors', optional: true },
    { when: { title_re: '\\b(?:curtain[ -]?walls?|storefronts?)\\b' }, type: 'boom_lift', reason: 'Reach the exterior face to set caps, glass and perimeter seals', optional: true },
    { when: { title_re: '\\b(?:curtain[ -]?walls?|storefronts?)\\b' }, type: 'telehandler', reason: 'Stage glass crates and framing bundles at the floors', optional: true },
  ],
  hazards: [
    { id: 'slab_edge', hazard: 'Fall from an unprotected slab edge while setting anchors and frames', hazard_es: PENDING_ES, controls: ['Keep perimeter guardrail or a personal fall arrest system in place at edges 6 ft or more above the level below', 'Remove only the guardrail section being worked and replace it before leaving'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness + lanyard to a rated anchor'], prov: osha('m') },
    { id: 'falling_objects', hazard: 'Tools, clips or glass dropped onto people below the work face', hazard_es: PENDING_ES, controls: ['Barricade and post the drop zone below', 'Tether tools and keep toeboards or debris netting at the edge'], controls_es: PENDING_ES, osha_ref: '1926.501(c)', severity: 4, ppe: ['hard hat'], prov: osha('m') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from a boom lift basket at the facade', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'scaffold_fall', hazard: 'Fall from scaffold or a swing stage while sealing the perimeter', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on scaffolds more than 10 ft high', 'Fully plank the platform; inspect before each shift'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, prov: osha('l') },
    { id: 'crane_swing', hazard: 'Struck or pinned within the crane’s swing radius during unit hoisting', hazard_es: PENDING_ES, controls: ['Barricade the swing radius of the counterweight', 'Use a qualified signal person when the operator can’t see the set point'], controls_es: PENDING_ES, osha_ref: '1926.1424(a)', severity: 4, prov: osha('cc') },
    { id: 'suspended_load', hazard: 'Crushed by a unit or glass crate under a suspended load', hazard_es: PENDING_ES, controls: ['No one under a suspended load', 'Guide units with tag lines and receive them only once they are at the floor'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, prov: osha('cc') },
    { id: 'rigging', hazard: 'Rigging or vacuum lifter failure dropping a panel or lite', hazard_es: PENDING_ES, controls: ['Inspect slings, shackles and lifting devices before each shift', 'Stay within rated capacity; check vacuum lifter gauges before each pick'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 4, prov: osha('h') },
    { id: 'glass_cut', hazard: 'Cuts from glass edges and breakage while handling and setting lites', hazard_es: PENDING_ES, controls: ['Cut-resistant gloves and sleeves; carry glass on edge with vacuum cups', 'Clear and bag broken glass right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['cut-resistant gloves', 'sleeves', 'safety glasses'], prov: osha('e') },
    { id: 'silica_drill', hazard: 'Silica dust drilling concrete for post-installed anchors', hazard_es: PENDING_ES, controls: ['Rotary hammer with a shroud and HEPA dust extractor', 'Follow the drilling controls in the silica standard'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['respirator when required', 'safety glasses'], prov: osha('z') },
    { id: 'pat_tool', hazard: 'Fastener or tool injury from powder-actuated fasteners into steel or concrete', hazard_es: PENDING_ES, controls: ['Only trained, carded operators use powder-actuated tools', 'Never fire into spalled concrete or near an edge'], controls_es: PENDING_ES, osha_ref: '1926.302(e)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'hot_work', hazard: 'Fire from welding anchor clips near membranes, insulation and packaging', hazard_es: PENDING_ES, controls: ['Move or shield combustibles before welding', 'Fire extinguisher and a fire watch at the weld'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding helmet', 'leather gloves'], prov: osha('j') },
    { id: 'chem_sealant', hazard: 'Skin, eye and breathing irritation from silicone, primers and cleaning solvents', hazard_es: PENDING_ES, controls: ['Read the SDS and ventilate', 'Wear gloves and eye protection with primers and solvents'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'shop_drawings_approved', item: 'Shop drawings, anchor layout and engineer-stamped calculations approved before fabrication; approved set on site.', item_es: { status: 'translated', text: 'Planos de taller, trazo de anclajes y cálculos sellados por el ingeniero aprobados antes de fabricar; juego aprobado en obra.' }, prov: cw },
    { id: 'embeds_surveyed', item: 'Every embed or anchor location surveyed; anything outside the anchor adjustment range has an engineered fix on record.', item_es: { status: 'translated', text: 'Cada placa embebida o anclaje topografiado; lo que quede fuera del rango de ajuste tiene una solución de ingeniería registrada.' }, prov: cw },
    { id: 'frame_tolerance', item: 'Frame plumb, level and aligned within the spec tolerance (commonly 1/8 in. in 12 ft, 1/2 in. over the run, 1/16 in. offset at joints).', item_es: { status: 'translated', text: 'Marco aplomado, nivelado y alineado dentro de la tolerancia (comúnmente 1/8 pulg. en 12 pies, 1/2 pulg. en el total, 1/16 pulg. de desfase en juntas).' }, prov: cw },
    { id: 'anchors_locked', item: 'Adjustable anchor connections rigidly locked after alignment; bolt torque or weld per the shop drawings.', item_es: PENDING_ES, safety: true, prov: cw },
    { id: 'galvanic_isolation', item: 'Aluminum isolated from steel, concrete and masonry with pads, tape or bituminous coating.', item_es: { status: 'translated', text: 'Aluminio aislado del acero, concreto y mampostería con almohadillas, cinta o recubrimiento bituminoso.' }, prov: { src: ['curtain_wall-ufgs-08-44-00', 'curtain_wall-ufgs-08-41-13'], confidence: 'verified', last_verified: D } },
    { id: 'frame_inspected_before_glass', item: 'Each opening checked for size, glass clearance and open joints before glass is set; pockets and glass edges cleaned.', item_es: { status: 'translated', text: 'Cada vano revisado (medida, holgura del vidrio y juntas abiertas) antes de colocar el vidrio; bolsillos y bordes limpios.' }, prov: cw },
    { id: 'setting_blocks_bite', item: 'Glass sits on setting blocks at the specified points with the edge clearance and bite shown on the shop drawings.', item_es: PENDING_ES, safety: true, prov: cw },
    { id: 'ssg_adhesion', item: 'Structural silicone applied only to cleaned, primed surfaces; adhesion checks logged and temporary retainers left until cured.', item_es: PENDING_ES, safety: true, prov: est('Structural silicone practice summarized from published sealant-maker guidance — follow the project spec and sealant maker.') },
    { id: 'perimeter_tie_in', item: 'Perimeter transition membrane lapped from frame onto the wall air barrier, shingle-style, with no gaps at corners.', item_es: { status: 'translated', text: 'Membrana de transición perimetral traslapada del marco a la barrera de aire del muro, como teja, sin huecos en esquinas.' }, prov: { src: ['air_barrier-ufgs-07-27-10'], confidence: 'verified', last_verified: D } },
    { id: 'sealant_joint', item: 'Perimeter joints clean, primed and backed with rod; sealant tooled; applied between 40 °F and 90 °F unless the maker allows otherwise.', item_es: { status: 'translated', text: 'Juntas perimetrales limpias, imprimadas y con cordón de respaldo; sellador alisado; aplicado entre 40 °F y 90 °F salvo que el fabricante permita otra cosa.' }, prov: seal },
    { id: 'weeps_open', item: 'Weep holes and internal drainage open and unobstructed after sealing.', item_es: { status: 'translated', text: 'Orificios de drenaje y desagüe interno abiertos y sin obstrucción después de sellar.' }, prov: { src: ['curtain_wall-ufgs-08-44-00', 'curtain_wall-ufgs-08-41-13'], confidence: 'verified', last_verified: D } },
    { id: 'field_water_test', item: 'Field water spray test done on the specified bays before interior finishes; no water penetration, or leaks fixed and retested; reports filed.', item_es: { status: 'translated', text: 'Prueba de agua en campo en los tramos indicados antes de los acabados interiores; sin filtración, o fugas reparadas y probadas de nuevo; reportes archivados.' }, prov: cw },
    { id: 'hardware_adjusted', item: 'Doors and operable vents close, latch and lock smoothly and weathertight; closers and exit devices adjusted.', item_es: { status: 'translated', text: 'Puertas y ventilas cierran, enganchan y traban suavemente y herméticas; cierrapuertas y barras antipánico ajustados.' }, prov: sf },
    { id: 'opening_level_sill', item: 'Storefront opening sized to the shop drawings with the sill level within the maker’s tolerance.', item_es: { status: 'translated', text: 'Vano de la fachada comercial según planos de taller, con el alféizar nivelado dentro de la tolerancia del fabricante.' }, prov: sf },
    { id: 'safety_glazing_mark', phase: 'finishes_exterior', item: 'Glass in doors and other hazardous locations is tempered or laminated and carries a permanent safety-glazing mark.', item_es: PENDING_ES, safety: true, prov: icc },
  ],
  inspection_checklists: {
    sheathing: [
      { item: 'Perimeter transition membrane lapped onto the wall air barrier at heads, jambs and sills', item_es: PENDING_ES, ref: 'C402.5' },
      { item: 'Sill flashing / receptors with end dams drain to the exterior', item_es: PENDING_ES, ref: '1404.4' },
      { item: 'Field water spray test reports available for the tested bays', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Safety-glazing marks present in doors and hazardous locations', item_es: PENDING_ES, ref: '2406' },
      { item: 'Fenestration labels match the energy compliance documents', item_es: PENDING_ES, ref: 'C402.4' },
      { item: 'Product approvals / test reports for design pressure on site', item_es: PENDING_ES, ref: '1709.5' },
      { item: 'Entrance doors swing, latch and release as the hardware schedule requires', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-CW-STOREFRONT-SF', name: 'Aluminum storefront framing with 1 in. insulating glass, installed', name_es: 'Fachada comercial de aluminio con vidrio aislante de 1 pulg., instalada', unit: 'SF', csi: '08 41 13',
      material_cost_cents: { v: 4500, prov: est('thermally broken storefront framing + 1 in. IGU + sill receptor + perimeter sealant, national baseline 2026') }, labor_hours_per_unit: { v: 0.25, prov: est('glazier crew: frame, glaze, seal per SF of elevation') },
      equipment_cost_cents: { v: 0, prov: est('ground-floor work; lifts carried elsewhere') }, waste_pct: { v: 3, prov: est('framing cut-offs; glass ordered to size') } },
    { code: 'B-CW-STICK-SF', name: 'Stick-built aluminum curtain wall with insulating glass, installed', name_es: 'Muro cortina de aluminio armado en obra con vidrio aislante, instalado', unit: 'SF', csi: '08 44 13',
      material_cost_cents: { v: 7000, prov: est('mullions/transoms, anchors, IGU, pressure plates, caps, perimeter membrane + sealant, national baseline 2026') }, labor_hours_per_unit: { v: 0.35, prov: est('anchors, erect, glaze, seal per SF of wall') },
      equipment_cost_cents: { v: 300, prov: est('boom lift / hoisting share per SF') }, waste_pct: { v: 3, prov: est('extrusion cut-offs; glass ordered to size') } },
    { code: 'B-CW-UNITIZED-SF', name: 'Unitized curtain wall panels, hoisted and set', name_es: 'Paneles de muro cortina unitizado, izados y colocados', unit: 'SF', csi: '08 44 13',
      material_cost_cents: { v: 11000, prov: est('factory-assembled and glazed units + anchors + stack-joint seals, national baseline 2026') }, labor_hours_per_unit: { v: 0.12, prov: est('rig, hoist, set and lock units; field sealing at stacks and perimeter') },
      equipment_cost_cents: { v: 800, prov: est('crane or monorail hoist share per SF') }, waste_pct: { v: 1, prov: est('units built to size') } },
    { code: 'B-CW-ENTR-PAIR-EA', name: 'Aluminum entrance door pair with frame, glazing and hardware, installed', name_es: 'Par de puertas de entrada de aluminio con marco, vidrio y herrajes, instalado', unit: 'EA', csi: '08 41 13',
      material_cost_cents: { v: 750000, prov: est('pair of medium-stile doors, offset pivots, closers, exit devices, tempered glass, national baseline 2026') }, labor_hours_per_unit: { v: 12, prov: est('frame, hang, glaze and adjust hardware') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('ordered as a unit') } },
    { code: 'B-CW-WATERTEST-EA', name: 'Field water spray test of a curtain wall / storefront location, per test', name_es: 'Prueba de agua en campo de muro cortina o fachada comercial, por prueba', unit: 'EA', csi: '08 44 00',
      description: 'Testing-agency fee carried as equipment; labor = installer crew standing by to open and repair leaks.',
      material_cost_cents: { v: 0, prov: est('water and tape only') }, labor_hours_per_unit: { v: 4, prov: est('crew assisting the agency, interior observation, leak repair') },
      equipment_cost_cents: { v: 120000, prov: est('independent testing agency visit with calibrated spray rack, per location') }, waste_pct: { v: 0, prov: est('service, no material') } },
  ],
  quantity_rules: [
    { code: 'B-CW-WATERTEST-EA', assumption: 'Two field water spray tests on a commercial glazed facade — set to the number the spec requires', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'B-CW-ENTR-PAIR-EA', assumption: 'One main entrance door pair on a commercial building — confirm against the door schedule', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['structural_steel', 'concrete', 'air_barrier'], before_phase: 'finishes_interior', note: 'Curtain wall follows the structure and wall air barrier; field water testing must pass before interior finishes start.' },
  ],
});
