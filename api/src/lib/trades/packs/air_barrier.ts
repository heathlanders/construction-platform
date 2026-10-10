// Trade Knowledge Pack — air_barrier (Air / Vapor Barrier). Wave 09 — NEW-TRADE pattern (no hand recipe,
// no template tasks). Dossier: docs/trade-packs/dossiers/air_barrier.md.
// Scope: commercial fluid-applied and self-adhered sheet air barriers (+ transitions, mock-up, field and
// whole-building testing) and interior sheet vapor retarders. Residential housewrap / WRB stays with the
// siding pack (B-SID-WRB-SF) and is NOT matched here.
// Sources: UFGS 07 27 10 / 07 27 19.01 / 07 27 26 (public domain), DOE BASC aligned air barriers (gov_open),
// ABAA QAP (program page; protocols reference only), IECC C402.5 / R402.4, IBC 1404.3, IRC R702.7 (reference
// only), 29 CFR 1926 (C, D, E, F, K, L, M, X).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgsSys = { src: ['air_barrier-ufgs-07-27-10'], confidence: 'verified' as const, last_verified: D };
const ufgsSa = { src: ['air_barrier-ufgs-07-27-19-01'], confidence: 'verified' as const, last_verified: D };
const ufgsFa = { src: ['air_barrier-ufgs-07-27-26'], confidence: 'verified' as const, last_verified: D };
const ufgsBoth = { src: ['air_barrier-ufgs-07-27-19-01', 'air_barrier-ufgs-07-27-26'], confidence: 'verified' as const, last_verified: D };
const basc = { src: ['doe-basc-ins-aligned-ab'], confidence: 'derived' as const, last_verified: D, note: 'Residential ENERGY STAR aligned-air-barrier guidance applied to interior sheet vapor retarders.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'air_barrier',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs the continuous air barrier of the building enclosure — fluid-applied or self-adhered sheet membranes on exterior sheathing or masonry backup, transition membranes at openings, roof and foundation, and interior sheet vapor retarders — then proves it with a mock-up, adhesion and thickness checks, and a whole-building air leakage test when specified.',
    summary_es: 'Instala la barrera de aire continua de la envolvente — membranas líquidas o láminas autoadheribles sobre el entablado exterior o muro de mampostería, membranas de transición en vanos, techo y cimentación, y retardadores de vapor interiores en lámina — y la comprueba con una maqueta, pruebas de adherencia y espesor, y una prueba de fugas de aire de todo el edificio cuando se especifica.',
    glossary: [
      { term: 'Air barrier', term_es: 'Barrera de aire', def: 'Continuous layer of materials around the whole building that stops air leaking in or out.', def_es: 'Capa continua de materiales alrededor de todo el edificio que impide que el aire entre o salga.' },
      { term: 'Vapor retarder', term_es: 'Retardador de vapor', def: 'Layer that slows moisture moving through a wall or ceiling; its class and side depend on the climate.', def_es: 'Capa que frena el paso de humedad por un muro o techo; su clase y lado dependen del clima.' },
      { term: 'Fluid-applied membrane', term_es: 'Membrana líquida', def: 'Air barrier sprayed or rolled on wet that cures into a seamless rubbery film.', def_es: 'Barrera de aire rociada o aplicada con rodillo en húmedo que cura como una película continua y elástica.' },
      { term: 'Self-adhered sheet', term_es: 'Lámina autoadherible', def: 'Peel-and-stick membrane rolled onto a primed surface in lapped sheets.', def_es: 'Membrana de despegar y pegar que se rodilla sobre una superficie imprimada en láminas traslapadas.' },
      { term: 'Transition membrane', term_es: 'Membrana de transición', def: 'Flexible strip that ties the air barrier across gaps, joints and changes in material — at windows, roof edge and foundation.', def_es: 'Tira flexible que une la barrera de aire sobre huecos, juntas y cambios de material — en ventanas, borde del techo y cimentación.' },
      { term: 'Wet-mil gauge', term_es: 'Galga de película húmeda', def: 'Notched comb pressed into fresh coating to read its wet thickness in mils.', def_es: 'Peine dentado que se presiona en el recubrimiento fresco para leer su espesor húmedo en milésimas.' },
      { term: 'Fishmouth', term_es: 'Boca de pez', def: 'Open wrinkle at a sheet lap edge that lets air and water in.', def_es: 'Arruga abierta en el borde de un traslape que deja entrar aire y agua.' },
      { term: 'Mock-up', term_es: 'Maqueta', def: 'Sample wall built and tested first to show the approved way to build every detail.', def_es: 'Muro de muestra que se construye y prueba primero para mostrar la forma aprobada de cada detalle.' },
      { term: 'Blower-door test', term_es: 'Prueba de puerta soplante', def: 'Fans pressurize the building to measure how much air leaks through the enclosure.', def_es: 'Ventiladores presurizan el edificio para medir cuánto aire se fuga por la envolvente.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'fluid_applied',
      example_title: 'Fluid-applied air barrier at exterior walls',
      when: { title_re: 'air[- ]?barrier|air[ /&-]+(?:and )?vapou?r|\\bAVB\\b|fluid[- ]applied|liquid[- ]applied' },
      steps: [
        {
          title: 'Hold the pre-install meeting and build the mock-up',
          instruction: 'Walk the details with the GC, glazing, roofing and cladding trades: sequence, compatible sealants and who ties into what. Build the mock-up wall with a window, a wall-to-roof or wall-to-floor transition and typical penetrations. Do the adhesion test and leak check on it and get it approved before starting the building.',
          tools: ['adhesion test kit', 'smoke pencil', 'camera'],
          materials: ['air barrier system components for the mock-up'],
          safety_ids: ['chem_hazcom', 'scaffold_fall'],
          qa_ids: ['mockup_approved', 'inspections_5_50_95'],
        },
        {
          title: 'Examine and prepare the substrate',
          instruction: 'Confirm sheathing is fastened at edges and corners and its joints are treated per the maker; masonry joints struck flush and voids filled. Surfaces must be sound, clean and dry: run the plastic-sheet moisture test on concrete and masonry. Check that sealants already in the wall are compatible, then mask adjacent finishes.',
          tools: ['moisture meter', 'plastic sheet and tape (moisture test)', 'wire brush', 'trowel'],
          materials: ['sheathing joint treatment', 'non-shrink grout or patching compound', 'masking film'],
          safety_ids: ['scaffold_fall', 'aerial_lift', 'eye_flying'],
          qa_ids: ['substrate_sound_dry'],
        },
        {
          title: 'Install transition membranes at openings and edges',
          instruction: 'Before the field coat, set transition membrane at rough openings, roof-to-wall and wall-to-foundation joints, deflection joints and gaps the coating cannot bridge. Put a sealant or mastic fillet under every inside corner so there are no sharp 90° folds, span wide gaps with fastened metal, prime, and roll the membrane fully bonded with no wrinkles.',
          tools: ['hand roller', 'utility knife', 'caulk gun', 'drill/driver'],
          materials: ['transition membrane', 'primer', 'termination mastic', 'galvanized or stainless sheet metal'],
          safety_ids: ['scaffold_fall', 'edge_fall', 'chem_hazcom', 'flammable'],
          qa_ids: ['transitions_supported', 'continuity'],
        },
        {
          title: 'Spray or roll the membrane to the specified thickness',
          instruction: 'Apply inside the maker’s temperature range, in one or two coats, at the wet thickness the maker gives for this substrate. Check wet mils every few square feet as you go; rough surfaces like CMU need more. Lap the coating at least 3 in. onto the transition membrane and seal fastener heads, ties and every penetration with the maker’s termination sealant.',
          detail: 'Specs commonly target about 40 dry mils on smooth sheathing and about 60 on rough block — use the number in the project spec and product data.',
          tools: ['airless sprayer or roller', 'wet-mil gauge', 'brush'],
          materials: ['fluid-applied air barrier', 'termination sealant', 'reinforcing mesh at joints and corners'],
          safety_ids: ['spray_injection', 'solvent_vapor', 'respirator', 'flammable', 'scaffold_fall'],
          qa_ids: ['wet_mil_readings', 'penetrations_sealed'],
        },
        {
          title: 'Inspect and test before it is covered',
          instruction: 'Leave the air barrier exposed until the inspector or testing agency has seen it. Walk the wall for pinholes, thin spots, missed penetrations and debonded edges; run adhesion pulls where specified, repair defects, and keep the daily report. Coordinate cladding so the membrane is not left uncovered longer than the maker allows.',
          tools: ['adhesion test kit', 'wet-mil gauge', 'flashlight', 'camera'],
          materials: ['repair coating', 'termination sealant'],
          safety_ids: ['scaffold_fall', 'aerial_lift'],
          qa_ids: ['inspections_5_50_95', 'adhesion_test', 'exposure_limit'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: 'C402.5.1.1', code_type: 'IECC', note: 'Air barrier construction — continuous across joints, assemblies and penetrations' }],
        },
        {
          title: 'Support the whole-building air leakage test',
          instruction: 'When the spec or the energy code path calls for it, help the test agency: close or temporarily seal doors, dampers and openings as their plan says, stay on site to find leaks with smoke while the building is under pressure, seal them and support a retest. File the report for the final inspection.',
          tools: ['smoke pencil', 'caulk gun'],
          materials: ['temporary seal film and tape', 'sealant'],
          safety_ids: ['eye_flying', 'cord_shock'],
          qa_ids: ['whole_building_test'],
          gating_inspection_type: 'final',
          code_refs: [{ section: 'C402.5', code_type: 'IECC', note: 'Air leakage of the thermal envelope — compliance options incl. building test' }],
        },
      ],
    },
    {
      id: 'self_adhered_sheet',
      example_title: 'Self-adhered membrane air barrier at CMU backup wall',
      when: { title_re: 'self[- ]?adher|peel[- ]and[- ]stick|\\bsheet (?:air|membrane)' },
      priority: 10,
      steps: [
        {
          title: 'Approve the mock-up and check the substrate',
          instruction: 'Get the mock-up with its window, roof and floor connections approved first. Then confirm the substrate is sound, clean and dry (plastic-sheet test on concrete and masonry), sheathing joints treated, and existing sealants compatible with the membrane.',
          tools: ['adhesion test kit', 'moisture meter', 'plastic sheet and tape (moisture test)'],
          materials: [],
          safety_ids: ['scaffold_fall', 'chem_hazcom'],
          qa_ids: ['mockup_approved', 'substrate_sound_dry'],
        },
        {
          title: 'Prime the substrate',
          instruction: 'Apply the primer the maker lists for that substrate — masonry, gypsum sheathing, wood or metal — and let it dry completely; gypsum sheathing may need more than one coat. Run the primer about 2 in. past where the membrane edge will land so the inspector can see it was primed.',
          tools: ['roller', 'brush', 'sprayer'],
          materials: ['membrane primer'],
          safety_ids: ['solvent_vapor', 'flammable', 'chem_hazcom'],
          qa_ids: ['laps_shingled_rolled'],
        },
        {
          title: 'Detail corners, transitions and penetrations',
          instruction: 'Put a 12 in. reinforcing strip centered on inside and outside corners and joints. Fillet inside corners with sealant or mastic, span gaps with fastened metal, and provide backup at deflection joints. Wrap the membrane into rough openings and seal every pipe, conduit, duct and steel penetration with mastic or the maker’s sealant.',
          tools: ['hand roller', 'utility knife', 'caulk gun', 'drill/driver'],
          materials: ['self-adhered membrane', 'termination mastic', 'sealant', 'sheet metal'],
          safety_ids: ['scaffold_fall', 'edge_fall', 'eye_flying'],
          qa_ids: ['transitions_supported', 'penetrations_sealed', 'continuity'],
        },
        {
          title: 'Install field sheets shingle-lapped and rolled',
          instruction: 'Start at the bottom and work up so every upper sheet laps the one below and sheds water. Keep side laps at least 2-1/2 in. and end laps at least 5 in. (more if the maker says), roll every sheet and seam firmly, and mastic any reverse lap or cut edge. Seal the top edge with mastic at the end of each day.',
          tools: ['hand roller', 'utility knife', 'trowel'],
          materials: ['self-adhered membrane', 'termination mastic'],
          safety_ids: ['scaffold_fall', 'aerial_lift', 'ladder'],
          qa_ids: ['laps_shingled_rolled'],
        },
        {
          title: 'Inspect, test and protect before cladding',
          instruction: 'Walk the wall for fishmouths, wrinkles and lost adhesion and fix them. Do adhesion pulls where specified, record the 5/50/95% inspections, and keep the membrane exposed until inspected — but covered before the maker’s UV exposure limit runs out.',
          tools: ['adhesion test kit', 'flashlight', 'camera'],
          materials: ['membrane patches', 'mastic'],
          safety_ids: ['scaffold_fall', 'aerial_lift'],
          qa_ids: ['inspections_5_50_95', 'adhesion_test', 'exposure_limit'],
          gating_inspection_type: 'sheathing',
          code_refs: [{ section: 'C402.5.1.1', code_type: 'IECC', note: 'Air barrier construction — continuous, joints sealed, penetrations sealed' }],
        },
      ],
    },
    {
      id: 'interior_vapor_retarder',
      example_title: 'Install poly vapor retarder at exterior walls and ceiling',
      when: { title_re: '^(?![\\s\\S]*\\bair\\b)[\\s\\S]*(?:vapou?r (?:barrier|retarder)|\\bpoly(?:ethylene)? sheet)' },
      priority: 5,
      steps: [
        {
          title: 'Confirm the class and the side',
          instruction: 'Check the plans and the energy compliance documents for whether an interior vapor retarder is required and which class — in cold climates it goes on the warm-in-winter side; in hot-humid climates a poly sheet can trap moisture. Confirm insulation is in and inspected-ready behind it.',
          tools: ['plans', 'flashlight'],
          materials: [],
          safety_ids: ['ladder'],
          qa_ids: ['vr_class_side'],
        },
        {
          title: 'Hang the sheet and seal laps and edges',
          instruction: 'Run the sheet continuous across studs and ceiling joists, lap seams at least one framing bay or as the maker says, and tape every lap. Seal the perimeter to the top and bottom plates with acoustic sealant so the sheet also works as an interior air barrier, and line it up with the insulation — no gaps or folds.',
          tools: ['stapler', 'utility knife', 'caulk gun', 'ladder'],
          materials: ['polyethylene or specified vapor retarder sheet', 'vapor retarder tape', 'acoustic sealant'],
          safety_ids: ['ladder', 'chem_hazcom'],
          qa_ids: ['vr_laps_taped'],
        },
        {
          title: 'Seal penetrations and hold for inspection',
          instruction: 'Cut neat openings at boxes, pipes and the attic hatch and seal each one with tape, a gasketed box or sealant. Patch every tear. Leave the work open for the insulation inspection before drywall.',
          tools: ['utility knife', 'caulk gun'],
          materials: ['vapor retarder tape', 'airtight electrical box covers or gaskets', 'sealant'],
          safety_ids: ['cord_shock', 'ladder'],
          qa_ids: ['penetrations_sealed', 'vr_laps_taped'],
          gating_inspection_type: 'insulation',
          code_refs: [
            { section: 'R702.7', code_type: 'IRC', note: 'Vapor retarders — class by climate zone, warm-in-winter side' },
            { section: '1404.3', code_type: 'IBC', note: 'Vapor retarders in exterior walls of commercial buildings' },
            { section: 'R402.4.1.1', code_type: 'IECC', note: 'Air barrier and insulation installation criteria' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    sheathing: [
      { section: 'C402.5.1.1', code_type: 'IECC', note: 'Air barrier construction — continuous through joints, transitions and penetrations', prov: icc },
    ],
    insulation: [
      { section: 'C402.5.1', code_type: 'IECC', note: 'Commercial air barriers — continuous around the thermal envelope', prov: icc },
      { section: 'R402.4.1.1', code_type: 'IECC', note: 'Residential air barrier and insulation installation criteria', prov: icc },
      { section: 'R702.7', code_type: 'IRC', note: 'Vapor retarders — class and placement by climate zone', prov: icc },
      { section: '1404.3', code_type: 'IBC', note: 'Vapor retarders in exterior walls', prov: icc },
    ],
    final: [
      { section: 'C402.5', code_type: 'IECC', note: 'Air leakage of the thermal envelope — compliance options incl. whole-building test', prov: icc },
      { section: 'R402.4.1.2', code_type: 'IECC', note: 'Residential air leakage testing', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'air[- ]?barrier|fluid[- ]applied|self[- ]?adher|\\bAVB\\b', building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'boom_lift', reason: 'Reach the exterior wall to prime, detail and coat above the first floor', optional: true },
    { when: { title_re: 'fluid[- ]applied|liquid[- ]applied|spray', building_types: ['commercial', 'residential_mf', 'industrial'] }, type: 'generator', reason: 'Power for the airless sprayer where temporary power is not at the wall', optional: true },
    { when: { title_re: 'vapou?r (?:barrier|retarder)', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Hang and seal vapor retarder at high interior walls and ceilings', optional: true },
  ],
  hazards: [
    { id: 'scaffold_fall', hazard: 'Fall from scaffold while priming, detailing or coating the wall', hazard_es: PENDING_ES, controls: ['Guardrails or personal fall arrest on scaffolds more than 10 ft high', 'Fully plank the platform and keep it clear of buckets and rolls'], controls_es: PENDING_ES, osha_ref: '1926.451(g)(1)', severity: 4, ppe: ['harness when required'], prov: osha('l') },
    { id: 'aerial_lift', hazard: 'Thrown or falling from an aerial lift basket', hazard_es: PENDING_ES, controls: ['Wear a harness and lanyard tied to the basket or boom', 'Stand on the floor of the basket — never on the rails'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 4, ppe: ['harness + lanyard'], prov: osha('l') },
    { id: 'edge_fall', hazard: 'Fall from a roof edge or floor edge while tying the air barrier into the roof or slab edge', hazard_es: PENDING_ES, controls: ['Guardrails, safety net or personal fall arrest at unprotected edges 6 ft or more above the lower level'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness when required'], prov: osha('m') },
    { id: 'ladder', hazard: 'Ladder slip or overreach while detailing openings', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it reaches', 'Firm footing and three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'chem_hazcom', hazard: 'Skin and eye irritation from primers, adhesives, mastics and membrane coatings', hazard_es: PENDING_ES, controls: ['Keep the SDS for every product on site and read it before use', 'Label all transfer containers; wear gloves and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'solvent_vapor', hazard: 'Breathing solvent vapors from primers and coatings, worst in enclosed or poorly ventilated areas', hazard_es: PENDING_ES, controls: ['Keep exposure below the limits on the SDS', 'Prefer low-VOC products indoors and stop work if workers feel dizzy'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 3, prov: osha('d') },
    { id: 'ventilation', hazard: 'Vapor build-up when coating inside stairwells, shafts or tightly closed-in spaces', hazard_es: PENDING_ES, controls: ['Provide mechanical ventilation in enclosed areas', 'Keep the ventilation running until the product has flashed off'], controls_es: PENDING_ES, osha_ref: '1926.57(a)', severity: 3, prov: osha('d') },
    { id: 'respirator', hazard: 'Inhaling spray mist during spray application', hazard_es: PENDING_ES, controls: ['Use the respirator the SDS calls for, with fit testing and medical clearance', 'Keep other trades out of the spray zone'], controls_es: PENDING_ES, osha_ref: '1926.103', severity: 3, ppe: ['respirator per SDS'], prov: osha('e') },
    { id: 'flammable', hazard: 'Fire from solvent-based primers and adhesives near torches, heaters or sparks', hazard_es: PENDING_ES, controls: ['Store and carry flammable products only in approved containers', 'No open flames or smoking near priming; keep an extinguisher close'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'spray_injection', hazard: 'Skin injection injury from the high-pressure airless spray tip', hazard_es: PENDING_ES, controls: ['Train sprayers on the gun safety lock and tip guard', 'Relieve pressure before cleaning or changing tips; never point the gun at anyone'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, prov: osha('c') },
    { id: 'eye_flying', hazard: 'Eye injury from splashes, overspray and wire-brushing debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles while preparing, priming and spraying'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses or goggles'], prov: osha('e') },
    { id: 'cord_shock', hazard: 'Electric shock from sprayer, test-fan and tool cords on a wet site', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily and remove damaged ones'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
  ],
  qa_checklist: [
    { id: 'mockup_approved', item: 'Mock-up with floor, window and roof connections and typical penetrations built, adhesion-tested and approved before production work.', item_es: { status: 'translated', text: 'Maqueta con uniones de piso, ventana y techo y penetraciones típicas construida, probada en adherencia y aprobada antes de la obra.' }, prov: { src: ['air_barrier-ufgs-07-27-10', 'air_barrier-ufgs-07-27-26'], confidence: 'verified', last_verified: D } },
    { id: 'substrate_sound_dry', item: 'Substrate sound, clean and dry (concrete/masonry cured, voids filled, joints flush, plastic-sheet moisture test passed); existing sealants confirmed compatible.', item_es: { status: 'translated', text: 'Sustrato firme, limpio y seco (concreto/mampostería curados, huecos rellenos, juntas al ras, prueba de humedad con lámina aprobada); selladores existentes confirmados compatibles.' }, prov: ufgsBoth },
    { id: 'transitions_supported', item: 'No sharp 90° inside corners — fillet under the membrane; gaps spanned with fastened metal; backup provided at deflection joints.', item_es: { status: 'translated', text: 'Sin esquinas interiores a 90° — filete bajo la membrana; huecos cubiertos con metal fijado; respaldo en juntas de deflexión.' }, prov: ufgsSa },
    { id: 'continuity', item: 'Air barrier connected without gaps from foundation to wall to roof and into every rough opening.', item_es: { status: 'translated', text: 'Barrera de aire conectada sin huecos de la cimentación al muro y al techo, y hacia dentro de cada vano.' }, prov: ufgsSys },
    { id: 'wet_mil_readings', item: 'Wet-mil readings recorded across the wall meet the product data for the substrate (more on rough block); coat laps at least 3 in. onto the transition membrane.', item_es: { status: 'translated', text: 'Lecturas de película húmeda registradas en todo el muro cumplen la ficha técnica del sustrato (más en bloque rugoso); la capa traslapa al menos 3 pulg. sobre la membrana de transición.' }, prov: ufgsFa },
    { id: 'penetrations_sealed', item: 'Every pipe, conduit, duct, tie, fastener head and box penetration sealed with the maker’s sealant, mastic or tape.', item_es: { status: 'translated', text: 'Cada penetración de tubo, conducto, ducto, anclaje, cabeza de sujetador y caja sellada con el sellador, masilla o cinta del fabricante.' }, prov: ufgsBoth },
    { id: 'laps_shingled_rolled', item: 'Primer dry and visible ~2 in. past the edge; sheets shingle-lapped (2-1/2 in. side, 5 in. end min), rolled, no fishmouths; top edge mastic-sealed each day.', item_es: { status: 'translated', text: 'Imprimador seco y visible ~2 pulg. más allá del borde; láminas traslapadas como teja (mín. 2-1/2 pulg. lateral, 5 pulg. extremo), rodilladas, sin bocas de pez; borde superior sellado cada día.' }, prov: { src: ['air_barrier-ufgs-07-27-19-01', 'air_barrier-ufgs-07-27-10'], confidence: 'verified', last_verified: D } },
    { id: 'adhesion_test', item: 'Field adhesion pulls done where specified; result and failure mode recorded against the maker’s minimum.', item_es: { status: 'translated', text: 'Pruebas de adherencia en campo donde se especifica; resultado y modo de falla registrados frente al mínimo del fabricante.' }, prov: ufgsSys },
    { id: 'inspections_5_50_95', item: 'Inspections at about 5, 50 and 95 percent complete; daily reports list products, substrates, temperatures, areas done and QC results; defects repaired.', item_es: { status: 'translated', text: 'Inspecciones al 5, 50 y 95 por ciento; reportes diarios con productos, sustratos, temperaturas, zonas terminadas y resultados de control; defectos reparados.' }, prov: ufgsBoth },
    { id: 'exposure_limit', item: 'Membrane covered by cladding before the maker’s UV exposure limit; overexposed material replaced.', item_es: { status: 'translated', text: 'Membrana cubierta por el revestimiento antes del límite de exposición UV del fabricante; material sobreexpuesto reemplazado.' }, prov: ufgsBoth },
    { id: 'whole_building_test', phase: 'commissioning', item: 'Whole-building air leakage test (when required) passed at or below the project target, report on file.', item_es: { status: 'translated', text: 'Prueba de fugas de aire de todo el edificio (cuando se requiere) aprobada en o bajo la meta del proyecto, con reporte archivado.' }, prov: { src: ['air_barrier-ufgs-07-27-10', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'vr_class_side', item: 'Vapor retarder class and side match the plans and climate zone; no interior poly where the design calls for a vapor-open wall.', item_es: { status: 'translated', text: 'Clase y lado del retardador de vapor según planos y zona climática; sin polietileno interior donde el diseño pide un muro permeable.' }, prov: icc },
    { id: 'vr_laps_taped', item: 'Vapor retarder continuous and in full contact with the insulation, laps taped, perimeter sealed to the plates, no gaps or folds.', item_es: { status: 'translated', text: 'Retardador de vapor continuo y en contacto total con el aislamiento, traslapes encintados, perímetro sellado a las soleras, sin huecos ni pliegues.' }, prov: basc },
    { id: 'spray_zone_safe', item: 'Spray zone ventilated, other trades kept out, sprayers wearing the respirator the SDS requires.', item_es: PENDING_ES, safety: true, prov: osha('d') },
    { id: 'tie_off_lifts', item: 'Everyone working from scaffolds over 10 ft, lifts or near edges is guarded or tied off.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-l', 'ecfr-1926-m'], confidence: 'verified', last_verified: D } },
  ],
  inspection_checklists: {
    sheathing: [
      { item: 'Air barrier left exposed and complete at the area being inspected', item_es: PENDING_ES },
      { item: 'Transitions at windows, doors, roof edge and foundation installed and bonded', item_es: PENDING_ES, ref: 'C402.5.1.1' },
      { item: 'Penetrations sealed; laps shingled; no fishmouths or debonded edges', item_es: PENDING_ES, ref: 'C402.5.1.1' },
    ],
    insulation: [
      { item: 'Continuous air barrier path shown on the energy documents is built as drawn', item_es: PENDING_ES, ref: 'C402.5.1' },
      { item: 'Interior vapor retarder (where required) right class, warm side, laps taped, penetrations sealed', item_es: PENDING_ES, ref: 'R702.7 / 1404.3' },
    ],
    final: [
      { item: 'Air leakage test report (when the compliance path requires it) meets the target', item_es: PENDING_ES, ref: 'C402.5' },
      { item: 'Field QC and adhesion test reports on file', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-AB-FLUID-SF', name: 'Fluid-applied air/vapor barrier on sheathing or CMU, ~40–60 dry mils, per SF', name_es: 'Barrera de aire/vapor líquida sobre entablado o bloque, ~40–60 milésimas secas, por pie²', unit: 'SF', csi: '07 27 26',
      description: 'Field coat incl. joint reinforcement and termination sealant; transitions are B-AB-TRANS-LF.',
      material_cost_cents: { v: 150, prov: est('vapor-permeable or impermeable fluid membrane at ~40–60 dry mils + joint mesh + sealant, national baseline 2026') }, labor_hours_per_unit: { v: 0.02, prov: est('spray crew incl. masking, mil checks and penetration sealing') },
      equipment_cost_cents: { v: 8, prov: est('airless sprayer + lift share per SF') }, waste_pct: { v: 10, prov: est('overspray and rough-substrate overrun') } },
    { code: 'B-AB-SA-SF', name: 'Self-adhered sheet air barrier with primer, per SF', name_es: 'Barrera de aire en lámina autoadherible con imprimador, por pie²', unit: 'SF', csi: '07 27 19',
      material_cost_cents: { v: 190, prov: est('self-adhered membrane + primer + mastic, national baseline 2026') }, labor_hours_per_unit: { v: 0.03, prov: est('prime, hang, roll, detail corners and seams') },
      equipment_cost_cents: { v: 5, prov: est('lift share per SF') }, waste_pct: { v: 12, prov: est('laps and cut-offs') } },
    { code: 'B-AB-TRANS-LF', name: 'Air barrier transition membrane at openings, roof and foundation joints (~9–12 in. wide), per LF', name_es: 'Membrana de transición de barrera de aire en vanos, techo y juntas de cimentación (~9–12 pulg.), por pie lineal', unit: 'LF', csi: '07 27 00',
      material_cost_cents: { v: 160, prov: est('transition membrane + primer + mastic fillet, national baseline 2026') }, labor_hours_per_unit: { v: 0.05, prov: est('prime, fillet corners, set and roll') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('corner pieces and laps') } },
    { code: 'B-AB-MOCKUP-EA', name: 'Air barrier mock-up wall (~8x8 ft) with window, transitions and field adhesion/leak testing, each', name_es: 'Maqueta de muro de barrera de aire (~8x8 pies) con ventana, transiciones y pruebas de adherencia/fugas, c/u', unit: 'EA', csi: '07 27 10',
      description: 'Air barrier trade share of the mock-up incl. testing-agency visit; backup wall and window by others.',
      material_cost_cents: { v: 60000, prov: est('membranes, transitions, sealants for one mock-up') }, labor_hours_per_unit: { v: 16, prov: est('build, inspect, test, tear-out of air barrier layers') },
      equipment_cost_cents: { v: 150000, prov: est('testing-agency field adhesion + leak-detection visit') }, waste_pct: { v: 0, prov: est('one-off') } },
    { code: 'B-AB-BLDG-TEST-EA', name: 'Whole-building air leakage test with leak-finding and retest support, each building', name_es: 'Prueba de fugas de aire de todo el edificio con búsqueda de fugas y apoyo para reprueba, por edificio', unit: 'EA', csi: '01 91 19',
      description: 'Mid-size commercial building; testing agency fans + report in equipment, trade crew to seal openings and fix leaks in labor.',
      material_cost_cents: { v: 30000, prov: est('temporary seal film, tape, sealant') }, labor_hours_per_unit: { v: 16, prov: est('prep, attend test, seal found leaks, attend retest') },
      equipment_cost_cents: { v: 600000, prov: est('third-party multi-fan building test + report, mid-size building, 2026') }, waste_pct: { v: 0, prov: est('one-off') } },
    { code: 'B-AB-VR-POLY-SF', name: 'Interior polyethylene vapor retarder, taped laps, sealed perimeter, per SF', name_es: 'Retardador de vapor interior de polietileno, traslapes encintados y perímetro sellado, por pie²', unit: 'SF', csi: '07 26 00',
      material_cost_cents: { v: 12, prov: est('6-mil poly + tape + acoustic sealant, national baseline 2026') }, labor_hours_per_unit: { v: 0.006, prov: est('hang, tape and seal walls/ceilings') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('laps and cut-outs') } },
  ],
  quantity_rules: [
    { code: 'B-AB-FLUID-SF', assumption: 'Exterior wall ≈ 0.8 SF per SF of floor area on a commercial/MF job — measure elevations and pick fluid-applied OR sheet', when: { building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'area_sf_sum', mul: 0.8, round: 'round' } },
    { code: 'B-AB-TRANS-LF', assumption: '≈16 LF of transition membrane per scheduled window (perimeter of a ~3x5 opening) — add roof-edge and foundation lines from the drawings', when: { building_types: ['commercial', 'residential_mf', 'industrial'] }, qty: { basis: 'windows', mul: 16, round: 'ceil' } },
    { code: 'B-AB-MOCKUP-EA', assumption: 'One air barrier mock-up per commercial project — remove if the spec does not require one', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'B-AB-BLDG-TEST-EA', assumption: 'One whole-building air leakage test — remove if the energy compliance path does not use testing', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'B-AB-VR-POLY-SF', assumption: 'Vapor barrier called out on plans — ≈1 SF of poly per SF of floor (ceiling) until exterior walls are measured', when: { facts_any: ['vapor_barrier'], building_types: ['residential_sf', 'pole_barn'] }, qty: { basis: 'area_sf_sum', mul: 1, round: 'round' } },
  ],
  dependency_hints: [
    { after_trades: ['framing', 'metal_stud_framing', 'masonry'], before_phase: 'finishes_exterior', note: 'Exterior air barrier goes on after sheathing or masonry backup and before cladding, so it can be inspected exposed.' },
    { after_trades: ['insulation'], before_phase: 'drywall', note: 'Interior vapor retarder goes on after insulation is in and before drywall, held for the insulation inspection.' },
  ],
});
