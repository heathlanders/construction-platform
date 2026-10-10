// Trade Knowledge Pack — lab_casework (Laboratory Casework / Equipment). Wave 16 — NEW-TRADE pattern
// (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/lab_casework.md.
// permit_trade null → NO gates, NO code_refs. Owner/EHS hold points (utility rough-in, hood
// certification, eyewash) live in inspection_checklists, cited by name only.
// Sources: UFGS 11 53 13 (fume hoods, Part 3), WI DFDM master spec 11 53 13 (posted hood instructions),
// UFGS 12 35 53 (scope only), SEFA 1/2/8 + ASHRAE 110 + ANSI/ISEA Z358.1 (reference only),
// 29 CFR 1910.1450 (general-industry context only), 29 CFR 1926 C/D/E/F/H/I/K/X.
// Out of scope: exhaust duct + fan (ductwork / hvac), air balancing (test_balance), piping to fittings
// (plumbing / process_piping / medical_gas), general millwork (G-MW-*), residential cabinets (G-CB-*).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgsHood = (note?: string) => ({ src: ['lab_casework-ufgs-11-53-13'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const wiHood = { src: ['lab_casework-wi-dfdm-115313', 'lab_casework-ufgs-11-53-13'], confidence: 'verified' as const, last_verified: D };
const ref = (src: string, note: string) => ({ src: [src, 'lab_casework-ufgs-11-53-13'], confidence: 'derived' as const, last_verified: D, note });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });
const COM: ('commercial')[] = ['commercial'];

export default definePack({
  key: 'lab_casework',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs laboratory furniture: steel or wood lab casework, epoxy-resin and phenolic worksurfaces, reagent shelving and fume hoods. The crew checks the lab utility rough-ins, then sets, levels and anchors casework, joins the heavy tops, sets hoods to the exhaust duct, and supports the hood performance test.',
    summary_es: 'Instala mobiliario de laboratorio: gabinetes de acero o madera, cubiertas de resina epóxica y fenólica, repisas para reactivos y campanas de extracción. La cuadrilla revisa las preparaciones de servicios, coloca, nivela y ancla los gabinetes, une las cubiertas pesadas, conecta las campanas al ducto y apoya la prueba de desempeño.',
    glossary: [
      { term: 'Fume hood', term_es: 'Campana de extracción', def: 'Ventilated enclosure that pulls fumes away from the user and out through an exhaust duct.', def_es: 'Gabinete ventilado que aleja los vapores del usuario y los saca por un ducto de extracción.' },
      { term: 'Sash', term_es: 'Guillotina', def: 'The movable glass front of a fume hood; its height changes how fast air enters the hood.', def_es: 'Frente de vidrio movible de la campana; su altura cambia la velocidad con que entra el aire.' },
      { term: 'Face velocity', term_es: 'Velocidad frontal', def: 'Speed of the air entering the open sash, measured in feet per minute during the hood test.', def_es: 'Velocidad del aire que entra por la guillotina abierta, medida en pies por minuto en la prueba.' },
      { term: 'Epoxy resin worksurface', term_es: 'Cubierta de resina epóxica', def: 'Heavy, chemical-resistant cast countertop used on lab benches.', def_es: 'Cubierta colada, pesada y resistente a químicos que se usa en mesas de laboratorio.' },
      { term: 'Phenolic resin top', term_es: 'Cubierta de resina fenólica', def: 'Lighter chemical-resistant worksurface made of pressed resin-soaked paper layers.', def_es: 'Cubierta más ligera y resistente a químicos hecha de capas de papel prensado con resina.' },
      { term: 'Reagent shelf', term_es: 'Repisa para reactivos', def: 'Shelf above a bench, usually with a front lip, for bottles of chemicals.', def_es: 'Repisa sobre la mesa, normalmente con borde frontal, para frascos de químicos.' },
      { term: 'Service fitting', term_es: 'Accesorio de servicio', def: 'Bench or hood valve for gas, air, vacuum or water, with a color-coded handle.', def_es: 'Válvula de mesa o campana para gas, aire, vacío o agua, con manija de color.' },
      { term: 'Acid waste', term_es: 'Desagüe ácido', def: 'Lab drain line made of a corrosion-resistant pipe material that carries chemical waste.', def_es: 'Línea de drenaje de laboratorio de material resistente a la corrosión para desechos químicos.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'lab_casework_install',
      example_title: 'Install laboratory casework and epoxy worksurfaces',
      when: { title_re: 'lab(oratory)? casework|lab bench|epoxy (resin )?(top|worksurface)' },
      steps: [
        {
          title: 'Verify lab utility rough-ins and backing',
          instruction: 'Before casework arrives, walk the room with the casework shop drawings and the plumbing, mechanical and electrical plans. Check every stub: lab gases, vacuum, DI and potable water, acid waste in its corrosion-resistant pipe, power and data. Confirm in-wall backing for wall cabinets and shelving. Write up any mismatch for the GC before walls are finished.',
          tools: ['tape measure', 'shop drawings', 'laser level', 'marker'],
          materials: [],
          safety_ids: ['eye_flying'],
          qa_ids: ['rough_in_match', 'acid_waste_material', 'backing_in_place'],
        },
        {
          title: 'Receive, stage and protect casework',
          instruction: 'Check cartons against the casework schedule and note freight damage before signing. Stage in a dry, conditioned room after wet trades are done. Band or lay down tall units so they cannot tip, keep aisles clear, and leave protective wrap on until setting.',
          tools: ['pallet jack', 'appliance dolly', 'utility knife'],
          materials: ['floor protection board', 'corner guards'],
          safety_ids: ['storage_stack', 'heavy_lift', 'sharp_edge'],
          qa_ids: ['rough_in_match'],
        },
        {
          title: 'Set, level and anchor base cabinets and tables',
          instruction: 'Snap the bench lines, set base cabinets and table frames, and level them with the leveling glides or shims so tops will sit flat. Fasten units to each other and to the wall backing or floor, using the seismic anchors on the drawings where scheduled. Keep service openings aligned with the stubs.',
          tools: ['laser level', '4 ft level', 'drill/driver', 'hammer drill'],
          materials: ['shims', 'cabinet screws', 'concrete anchors where scheduled'],
          safety_ids: ['power_tool', 'eye_flying', 'heavy_lift'],
          qa_ids: ['level_plumb', 'anchored_seismic'],
        },
        {
          title: 'Set epoxy or phenolic worksurfaces',
          instruction: 'Epoxy tops are very heavy: lift with at least two people or a lift aid, never alone. Dry-fit, then set on the base with the maker\'s adhesive spots. Join seams with the maker\'s seam adhesive, flush and tight, and clean off squeeze-out before it cures. Seal the top to walls and backsplashes with chemical-resistant sealant.',
          detail: 'Field cutouts for sinks and fittings follow the maker\'s instructions; cut with the tool and dust control they call for.',
          tools: ['suction cups', 'clamps', 'putty knife', 'caulk gun'],
          materials: ['manufacturer seam adhesive', 'chemical-resistant sealant'],
          safety_ids: ['heavy_lift', 'pinch_crush', 'chem_adhesive', 'dust_cutting'],
          qa_ids: ['seams_flush', 'sealed_wall'],
        },
        {
          title: 'Mount shelving, uprights and fittings',
          instruction: 'Install uprights and reagent shelves level, into backing, with the front lip on chemical shelves. Set sinks, cup sinks and service-fitting bodies in place for the plumber; the licensed plumber and electrician make every connection. Check that fitting handles are labeled and color-coded for the service they control.',
          tools: ['level', 'drill/driver', 'step ladder'],
          materials: ['shelf brackets', 'upright channels'],
          safety_ids: ['ladder', 'electric_live', 'power_tool'],
          qa_ids: ['shelf_load_lip', 'fittings_labeled'],
        },
      ],
    },
    {
      id: 'fume_hood_install',
      example_title: 'Set fume hood and connect exhaust',
      priority: 10,
      when: { title_re: 'fume hood' },
      steps: [
        {
          title: 'Set and anchor the hood on its base',
          instruction: 'Set the hood base cabinet (acid or flammable storage cabinet only where scheduled), level it, and anchor it. Rig the hood superstructure with enough people or a lift aid, set it on the base, level it and fasten it per the maker\'s instructions. Never lift by the sash or its counterweight.',
          tools: ['level', 'rated lifting straps', 'drill/driver', 'appliance dolly'],
          materials: ['shims', 'manufacturer anchors'],
          safety_ids: ['heavy_lift', 'pinch_crush', 'power_tool'],
          qa_ids: ['level_plumb', 'anchored_seismic'],
        },
        {
          title: 'Coordinate duct, monitor and interlocks',
          instruction: 'The HVAC trade connects the exhaust duct to the hood collar; the collar finish must match the hood interior where fumes touch it. Confirm the airflow monitor and low-flow alarm are mounted and wired, and that interlocks between the hood, its fan and room make-up air are in place.',
          tools: ['flashlight', 'drawings'],
          materials: [],
          safety_ids: ['ladder', 'electric_live'],
          qa_ids: ['monitor_alarm_works', 'makeup_air_balanced'],
        },
        {
          title: 'Connect hood services by licensed trades',
          instruction: 'Plumber and gas fitter connect water, gas, air and vacuum to the hood fittings, with remote controls on the hood exterior. Electrician connects receptacles, lights and the blower switch. Keep circuits locked out and tagged until the connecting trade releases them.',
          tools: ['soap solution', 'flashlight'],
          materials: [],
          safety_ids: ['electric_live', 'lockout_tag'],
          qa_ids: ['fittings_labeled'],
        },
        {
          title: 'Post instructions and test hood performance',
          instruction: 'Post the framed operating instructions and control diagram at each hood before testing. With HVAC balanced and room doors in normal position, the test agency measures face velocity at the operating sash height and runs the containment test the specification calls for. Record results on each hood and fix any failure before turnover.',
          detail: 'Acceptance targets come from the project specification and the owner\'s safety officer, not this pack.',
          tools: ['test agency instruments', 'sash height label'],
          materials: ['certification labels'],
          safety_ids: ['test_exposure', 'electric_live'],
          qa_ids: ['instructions_posted', 'hood_test_passed', 'monitor_alarm_works'],
        },
      ],
    },
    {
      id: 'eyewash_shower_coord',
      example_title: 'Coordinate lab emergency eyewash and shower',
      priority: 5,
      when: { title_re: 'eyewash|safety shower|emergency shower' },
      steps: [
        {
          title: 'Check eyewash and shower location and path',
          instruction: 'Walk the route from each hood and acid bench to its eyewash and safety shower. The path must stay level and unblocked: no casework, doors that swing into it, or stored carts. Report a location problem to the GC before casework is set.',
          tools: ['tape measure', 'drawings'],
          materials: [],
          safety_ids: [],
          qa_ids: ['eyewash_path_clear'],
        },
        {
          title: 'Witness the flush test',
          instruction: 'After the plumber connects the unit, witness the flush test with the owner: full flow, tepid water, valve stays open hands-free, drain or catch provided. Record the result and leave the inspection tag on the unit.',
          tools: ['bucket', 'thermometer'],
          materials: ['inspection tag'],
          safety_ids: ['eye_flying'],
          qa_ids: ['eyewash_flush_tested'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: 'fume hood|casework', building_types: ['commercial', 'industrial'] }, type: 'forklift', reason: 'Unload palletized hoods, epoxy tops and casework from the truck', optional: true },
  ],
  hazards: [
    { id: 'heavy_lift', hazard: 'Back strain or crushed hands lifting epoxy tops, hood bodies and steel cabinets', hazard_es: PENDING_ES, controls: ['Plan the lift; use two or more people, suction cups or a lift aid for epoxy tops', 'Never lift a hood by its sash or counterweight'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 3, ppe: ['work gloves', 'safety-toe boots'], prov: osha('c') },
    { id: 'pinch_crush', hazard: 'Fingers caught between a heavy top or hood and the cabinet below while setting it', hazard_es: PENDING_ES, controls: ['Set heavy items on blocks first, then slide them into place', 'Keep hands off bearing edges while lowering'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['work gloves'], prov: osha('e') },
    { id: 'storage_stack', hazard: 'Tall cabinets, hood crates or stacked tops tipping in the staging area', hazard_es: PENDING_ES, controls: ['Lay down or band tall units so they cannot tip', 'Stack tops flat on blocking; keep floor loads under the posted limit'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'sharp_edge', hazard: 'Cuts from steel cabinet edges, banding and crate fasteners', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when uncrating', 'Cut banding with a safety cutter and bin it right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from drilling, anchoring and flying debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses while drilling, anchoring and fastening'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'power_tool', hazard: 'Cuts or kickback from drills, hammer drills and saws used to fit casework', hazard_es: PENDING_ES, controls: ['Keep guards in place and use the right bit or blade', 'Unplug tools before changing bits or blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 2, prov: osha('i') },
    { id: 'dust_cutting', hazard: 'Breathing dust when field-cutting epoxy or phenolic tops', hazard_es: PENDING_ES, controls: ['Cut with tool-mounted dust collection or wet methods per the maker', 'Wear a respirator where dust cannot be controlled'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['respirator as needed', 'safety glasses'], prov: osha('d') },
    { id: 'chem_adhesive', hazard: 'Skin, eye and breathing irritation from seam adhesives, sealants and cleaners', hazard_es: PENDING_ES, controls: ['Read the SDS before use and ventilate the room', 'Wear chemical gloves and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'flammable_solvent', hazard: 'Fire from solvent cleaners near hood lighting, outlets or hot work', hazard_es: PENDING_ES, controls: ['Keep solvents in approved closed containers', 'No open flame or sparks while solvents are in use'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'ladder', hazard: 'Falls from step ladders while mounting wall cabinets, shelves and hood tops', hazard_es: PENDING_ES, controls: ['Use a ladder rated for the load, fully open and locked', 'Do not stand on the top step or on casework'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'electric_live', hazard: 'Shock from live circuits at hood and bench receptacles', hazard_es: PENDING_ES, controls: ['Only the electrician terminates power', 'Treat every stub-up as live until tested'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'lockout_tag', hazard: 'Hood blower or circuit energized while another trade is still connecting it', hazard_es: PENDING_ES, controls: ['Tag de-energized circuits at every point they can be switched on', 'Only the person who placed a tag removes it'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'test_exposure', hazard: 'Exposure to tracer gas or smoke during hood containment testing', hazard_es: PENDING_ES, controls: ['Only the test agency handles tracer gas; others stay out of the room', 'Ventilate per the agency procedure before re-entry'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'rough_in_match', item: 'Every gas, vacuum, water, acid-waste, power and data stub matches the casework shop drawings for location and height before walls are finished.', item_es: tr('Cada salida de gas, vacío, agua, desagüe ácido, electricidad y datos coincide con los planos de taller en ubicación y altura antes de terminar muros.'), prov: est('Shop-drawing coordination is standard lab practice; no public source reviewed.') },
    { id: 'acid_waste_material', item: 'Acid-waste piping at sinks and cup sinks is the corrosion-resistant material scheduled, not standard drain pipe.', item_es: tr('La tubería de desagüe ácido en tarjas y coladeras es del material resistente a la corrosión especificado, no tubo de drenaje común.'), prov: ufgsHood('2.3 note: acids may require epoxy, mineral or synthetic materials for working areas, acid wastes and drains.') },
    { id: 'backing_in_place', item: 'In-wall backing installed for wall cabinets, uprights and shelves before board goes up.', item_es: tr('Refuerzo dentro del muro instalado para gabinetes de pared, rieles y repisas antes de colocar el panel.'), prov: est('Trade practice; no public source reviewed.') },
    { id: 'level_plumb', item: 'Base cabinets, tables and hoods are level and in line so worksurfaces bear evenly; doors and drawers operate freely.', item_es: tr('Gabinetes base, mesas y campanas nivelados y alineados para que las cubiertas apoyen parejo; puertas y cajones operan libremente.'), prov: ref('lab_casework-sefa', 'SEFA 2/8 installation (ref only) — no tolerance values stored.') },
    { id: 'anchored_seismic', item: 'Casework, tall units and hoods fastened to each other and to wall or floor, with seismic anchors where the drawings show them.', item_es: PENDING_ES, safety: true, prov: ref('lab_casework-sefa', 'Anchorage per drawings and SEFA 2 (ref only).') },
    { id: 'seams_flush', item: 'Worksurface seams are tight, flush and filled with the maker\'s seam adhesive; squeeze-out cleaned off.', item_es: tr('Las juntas de las cubiertas quedan cerradas, al ras y rellenas con el adhesivo del fabricante; el excedente se limpia.'), prov: est('Manufacturer installation instructions; no public source reviewed.') },
    { id: 'sealed_wall', item: 'Joints between tops, backsplashes and walls sealed with chemical-resistant sealant; no open gaps.', item_es: tr('Juntas entre cubiertas, salpicaderos y muros selladas con sellador resistente a químicos; sin huecos abiertos.'), prov: est('Trade practice; no public source reviewed.') },
    { id: 'shelf_load_lip', item: 'Reagent shelves are level, fastened into backing and have a front lip where chemicals are stored.', item_es: PENDING_ES, safety: true, prov: est('Trade practice; no public source reviewed.') },
    { id: 'fittings_labeled', item: 'Service fittings have handles labeled and color-coded for the service; remote hood controls are outside the hood.', item_es: tr('Los accesorios de servicio tienen manijas rotuladas y de color según el servicio; los controles remotos de la campana quedan por fuera.'), prov: ufgsHood('2.2.3.3: remote controls for piped services located on the hood exterior.') },
    { id: 'monitor_alarm_works', item: 'Each hood airflow monitor shows flow and sounds its low-flow alarm when airflow drops.', item_es: PENDING_ES, safety: true, prov: wiHood },
    { id: 'makeup_air_balanced', item: 'Make-up air and interlocks keep the hood and room in balance; HVAC balancing done before hood testing.', item_es: PENDING_ES, safety: true, prov: ufgsHood('3.1: tempered make-up air sized to hood airflow; interlocks keep the hood/room air balance.') },
    { id: 'instructions_posted', item: 'Framed operating instructions and control diagrams posted at each hood before acceptance testing.', item_es: tr('Instrucciones de operación y diagramas de control enmarcados y colocados en cada campana antes de la prueba de aceptación.'), prov: wiHood },
    { id: 'hood_test_passed', item: 'Each hood field-tested by the test agency (face velocity at operating sash height and containment) and labeled with the result.', item_es: PENDING_ES, safety: true, prov: ref('lab_casework-ashrae-110', 'UFGS 11 53 13 3.3 field test; ASHRAE 110 method (ref only, no values).') },
    { id: 'eyewash_path_clear', item: 'Route from hoods and acid benches to the eyewash and safety shower is level and unblocked by casework or doors.', item_es: PENDING_ES, safety: true, prov: ref('lab_casework-ansi-z358-1', 'ANSI/ISEA Z358.1 location concept (ref only, no distances stored).') },
    { id: 'eyewash_flush_tested', item: 'Eyewash and shower flush test witnessed with full tepid flow and hands-free valve; tag left on unit.', item_es: PENDING_ES, safety: true, prov: ref('lab_casework-ansi-z358-1', 'ANSI/ISEA Z358.1 activation/testing concept (ref only).') },
  ],
  inspection_checklists: {
    utility_rough_in_check: [
      { item: 'Gas, vacuum, air and water stubs at the locations and heights on the casework drawings', item_es: PENDING_ES },
      { item: 'Acid waste and vents in the scheduled corrosion-resistant material', item_es: PENDING_ES, ref: 'UFGS 11 53 13 2.3' },
      { item: 'Power and data boxes located for bench and hood receptacles', item_es: PENDING_ES },
      { item: 'Wall backing in place for wall cabinets, uprights and shelves', item_es: PENDING_ES },
    ],
    casework_set_check: [
      { item: 'Casework level, aligned and fastened; seismic anchors where shown', item_es: PENDING_ES, ref: 'SEFA 2' },
      { item: 'Worksurface seams flush and sealed; tops sealed to walls', item_es: PENDING_ES, ref: 'SEFA 8' },
      { item: 'Shelves fastened into backing with front lips on chemical shelves', item_es: PENDING_ES },
    ],
    fume_hood_certification: [
      { item: 'HVAC balancing complete and make-up air running before testing', item_es: PENDING_ES, ref: 'UFGS 11 53 13 3.1' },
      { item: 'Operating instructions and control diagram posted at each hood', item_es: PENDING_ES, ref: 'UFGS 11 53 13 3.2' },
      { item: 'Face velocity at the operating sash height within the specified range', item_es: PENDING_ES, ref: 'ASHRAE 110' },
      { item: 'Containment (smoke / tracer) test performed as the specification requires', item_es: PENDING_ES, ref: 'ASHRAE 110 / SEFA 1' },
      { item: 'Airflow monitor and low-flow alarm work; result label on each hood', item_es: PENDING_ES, ref: 'UFGS 11 53 13 3.3' },
    ],
    eyewash_shower_check: [
      { item: 'Units located with a clear, level path from hazard areas', item_es: PENDING_ES, ref: 'ANSI Z358.1' },
      { item: 'Flush test witnessed and tagged', item_es: PENDING_ES, ref: 'ANSI Z358.1' },
    ],
  },
  assemblies: [
    { code: 'G-LAB-BASE-LF', name: 'Laboratory base cabinet, steel or wood, supply and install', name_es: 'Gabinete base de laboratorio, acero o madera, suministro e instalación', unit: 'LF', csi: '12 35 53',
      material_cost_cents: { v: 45000, prov: est('Painted-steel/wood lab base cabinets, blended per LF, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('set, level, fasten and anchor; 2-person crew') },
      equipment_cost_cents: { v: 0, prov: est('hand and power tools') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'G-LAB-EPOXY-TOP-LF', name: 'Epoxy resin worksurface, 1 in. thick, ~30 in. deep, supply and install', name_es: 'Cubierta de resina epóxica de 1 pulg., ~30 pulg. de fondo, suministro e instalación', unit: 'LF', csi: '12 35 53',
      material_cost_cents: { v: 9500, prov: est('cast epoxy resin top, distributor pricing range 2026, per LF of 30 in. depth') }, labor_hours_per_unit: { v: 0.5, prov: est('2–3 person set, seam and seal') },
      equipment_cost_cents: { v: 0, prov: est('suction cups and clamps as small tools') }, waste_pct: { v: 3, prov: est('seam adhesive and offcuts') } },
    { code: 'G-LAB-HOOD-EA', name: 'Bench fume hood ~6 ft with base cabinet, set and anchor (duct and services by others)', name_es: 'Campana de extracción de mesa ~6 pies con gabinete base, colocación y anclaje (ducto y servicios por otros)', unit: 'EA', csi: '11 53 13',
      material_cost_cents: { v: 1200000, prov: est('6 ft bypass or low-flow bench hood with base cabinet, national baseline 2026') }, labor_hours_per_unit: { v: 12, prov: est('uncrate, rig, set, level, anchor, adjust sash') },
      equipment_cost_cents: { v: 0, prov: est('forklift recommended separately as equipment') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'G-LAB-HOOD-CERT-EA', name: 'Fume hood performance test and certification (face velocity / containment)', name_es: 'Prueba de desempeño y certificación de campana (velocidad frontal / contención)', unit: 'EA', csi: '11 53 13',
      material_cost_cents: { v: 0, prov: est('labels only') }, labor_hours_per_unit: { v: 4, prov: est('test agency time per hood incl. report') },
      equipment_cost_cents: { v: 0, prov: est('agency instruments included in labor rate') }, waste_pct: { v: 0, prov: est('labor only') } },
    { code: 'G-LAB-SHELF-LF', name: 'Reagent shelving with uprights and front lip, supply and install', name_es: 'Repisas para reactivos con rieles y borde frontal, suministro e instalación', unit: 'LF', csi: '12 35 53',
      material_cost_cents: { v: 7500, prov: est('steel uprights, brackets and shelf with lip, blended per LF 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('layout, fasten uprights into backing, hang shelves') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('unit item') } },
  ],
  quantity_rules: [
    { code: 'G-LAB-BASE-LF', assumption: 'Assume 40 LF of lab base cabinets until the casework layout is measured — remove if no lab', when: { building_types: COM }, qty: { basis: 'const', mul: 40 } },
    { code: 'G-LAB-EPOXY-TOP-LF', assumption: 'Assume 40 LF of epoxy worksurface over the lab base cabinets', when: { building_types: COM }, qty: { basis: 'const', mul: 40 } },
    { code: 'G-LAB-HOOD-EA', assumption: 'Assume 2 bench fume hoods until the equipment schedule is confirmed', when: { building_types: COM }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-LAB-HOOD-CERT-EA', assumption: 'One performance test per fume hood', when: { building_types: COM }, qty: { basis: 'const', mul: 2 } },
    { code: 'G-LAB-SHELF-LF', assumption: 'Assume 30 LF of reagent shelving above benches', when: { building_types: COM }, qty: { basis: 'const', mul: 30 } },
  ],
  dependency_hints: [
    { after_trades: ['drywall', 'painting', 'flooring_resilient'], before_phase: 'punch', note: 'Lab casework sets after wall finishes and the floor; hood testing follows HVAC balancing and comes before punch.' },
  ],
});
