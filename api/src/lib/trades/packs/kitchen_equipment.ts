// Trade Knowledge Pack — kitchen_equipment (Commercial Kitchen Equipment). Wave 13 — NEW-TRADE pattern
// (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/kitchen_equipment.md.
// Sources: FDA Food Code 2022 (ch. 4 equipment, ch. 5 water/plumbing/waste, ch. 8 plan review +
// preoperational inspection), Wis. Admin. Code ATCP 75.075 (plan review), NSF food-equipment listings
// (reference only), IPC/IFGC (reference only), 29 CFR 1926 (C, E, F, H, I, J, K, O, D).
// Out of scope: Type I hoods / grease duct (kitchen_exhaust), hood suppression (fire_protection_special),
// walk-in coolers/freezers (cold_storage), residential appliances (appliances).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const fda = { src: ['kitchen_equipment-fda-food-code-2022'], confidence: 'verified' as const, last_verified: D };
const atcp = { src: ['kitchen_equipment-wi-atcp-75'], confidence: 'verified' as const, last_verified: D };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const mfr = (note: string) => ({ src: ['kitchen_equipment-nsf-listings', 'kitchen_equipment-fda-food-code-2022'], confidence: 'derived' as const, last_verified: D, note });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });

const TITLE_RE = 'kitchen equipment|food ?service|commercial kitchen|dish ?machine|cook ?line|warewash';

export default definePack({
  key: 'kitchen_equipment',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Supplies, sets, levels and seals commercial foodservice equipment — cooking line, worktables, sinks, dish machines, holding units — coordinates the utility rough-ins other trades provide (gas, power, water, indirect waste, floor sinks, grease interceptor), then runs start-up, maker demos and the health pre-opening inspection.',
    summary_es: 'Suministra, coloca, nivela y sella equipo de cocina comercial — línea de cocción, mesas, tarjas, lavavajillas, conservación — coordina las preparaciones de otros oficios (gas, electricidad, agua, desagüe indirecto, coladeras, interceptor de grasa) y hace el arranque, las demostraciones y la inspección sanitaria previa a la apertura.',
    glossary: [
      { term: 'Equipment schedule', term_es: 'Cédula de equipo', def: 'The numbered list of every kitchen item with its model, size and utility needs.', def_es: 'Lista numerada de cada equipo de cocina con su modelo, tamaño y necesidades de servicios.' },
      { term: 'Rough-in drawing', term_es: 'Plano de preparaciones', def: 'Drawing that locates every gas, power, water and drain stub for each piece of equipment.', def_es: 'Plano que ubica cada salida de gas, electricidad, agua y desagüe para cada equipo.' },
      { term: 'Indirect waste', term_es: 'Desagüe indirecto', def: 'A drain that empties into a floor sink or receptor through an air gap instead of piping straight to the sewer.', def_es: 'Desagüe que descarga a una coladera o receptor mediante un espacio de aire en lugar de conectarse directo al drenaje.' },
      { term: 'Air gap', term_es: 'Espacio de aire', def: 'Open vertical space between a pipe outlet and the flood rim of the fixture below, so dirty water can never be pulled back.', def_es: 'Espacio vertical abierto entre la salida de un tubo y el borde de derrame del receptor, para que el agua sucia nunca regrese.' },
      { term: 'Floor sink', term_es: 'Coladera de piso (floor sink)', def: 'Recessed, trapped receptor in the floor that takes indirect waste from equipment.', def_es: 'Receptor empotrado en el piso, con trampa, que recibe el desagüe indirecto del equipo.' },
      { term: 'Grease interceptor', term_es: 'Interceptor de grasa', def: 'Tank on the kitchen drain line that holds back fats and oils before they reach the sewer.', def_es: 'Tanque en la línea de drenaje de la cocina que retiene grasas y aceites antes de llegar al drenaje.' },
      { term: 'NSF listing', term_es: 'Certificación NSF', def: 'Third-party sanitation listing showing the equipment is built to be cleanable and food-safe.', def_es: 'Certificación sanitaria de un tercero que indica que el equipo es limpiable y apto para alimentos.' },
      { term: 'Booster heater', term_es: 'Calentador de refuerzo', def: 'Heater that raises the dish machine final-rinse water to sanitizing temperature.', def_es: 'Calentador que eleva el agua del enjuague final del lavavajillas a temperatura de desinfección.' },
      { term: 'Three-compartment sink', term_es: 'Tarja de tres compartimientos', def: 'Wash, rinse and sanitize sink used for manual dishwashing.', def_es: 'Tarja para lavar, enjuagar y desinfectar usada para el lavado manual de trastes.' },
      { term: 'Pre-opening inspection', term_es: 'Inspección previa a la apertura', def: 'Health department walk-through before the food permit is issued.', def_es: 'Revisión del departamento de salud antes de emitir el permiso de alimentos.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'foodservice_equipment_install',
      example_title: 'Install commercial kitchen equipment',
      when: { title_re: TITLE_RE },
      steps: [
        {
          title: 'Check rough-ins against the equipment schedule',
          instruction: 'Before walls and floors close, walk every item on the equipment schedule against the rough-in drawing: gas stub and size, power voltage/phase/amps, hot and cold water, indirect waste to a floor sink, floor sink locations and the grease interceptor line. Mark any mismatch for the plumber, electrician or GC in writing. Keep the health-department plan approval on site.',
          tools: ['tape measure', 'rough-in drawings', 'marker'],
          materials: [],
          safety_ids: ['eye_flying'],
          qa_ids: ['plan_approval_on_site', 'rough_in_match', 'interceptor_access'],
        },
        {
          title: 'Receive, uncrate and stage the equipment',
          instruction: 'Check every crate against the schedule and the packing list, note freight damage on the delivery receipt before signing, and confirm each item carries its food-equipment sanitation listing. Move pallets with a pallet jack or forklift, stack nothing on top of stainless tops, and keep aisles clear.',
          detail: 'Leave protective film on stainless until final clean; it keeps scratches off during the rest of construction.',
          tools: ['pallet jack', 'pry bar', 'utility knife', 'appliance dolly'],
          materials: ['floor protection board'],
          safety_ids: ['heavy_lift', 'forklift', 'storage_stack', 'sharp_edge'],
          qa_ids: ['nsf_listed'],
        },
        {
          title: 'Set, level and space each piece',
          instruction: 'Set items in schedule order from the wall out. Level with the adjustable feet, use casters with brakes where the plans show them, and leave the space the maker and health code call for: on legs high enough to clean under, sealed to the floor, or tight to the wall. Rig heavy ranges and ovens with rated straps; never lift by doors, knobs or rails.',
          tools: ['level', 'adjustable wrench', 'appliance dolly', 'rated lifting straps'],
          materials: ['leg anchors or flanged-foot fasteners where scheduled', 'shims'],
          safety_ids: ['heavy_lift', 'rigging'],
          qa_ids: ['legs_or_sealed', 'cleaning_space', 'level_doors'],
          code_refs: [
            { section: '4-402.11', code_type: 'FDA Food Code', note: 'Fixed equipment spaced for cleaning or sealed to walls and adjoining units' },
            { section: '4-402.12', code_type: 'FDA Food Code', note: 'Floor-mounted fixed equipment sealed to the floor or raised on legs' },
          ],
        },
        {
          title: 'Seal joints to walls and adjoining equipment',
          instruction: 'Close every gap a fixed item has to the wall or the unit next to it where spills can run in: food-grade sealant in small gaps, stainless trim strips over wider ones. Tool the bead smooth so it can be wiped clean; no open seams, voids or exposed foam.',
          tools: ['caulk gun', 'putty knife', 'drill/driver'],
          materials: ['food-grade silicone sealant', 'stainless trim strip or cover angle'],
          safety_ids: ['chem_sealant', 'sharp_edge'],
          qa_ids: ['wall_seal'],
        },
        {
          title: 'Coordinate final utility connections',
          instruction: 'Licensed trades make the connections: the plumber runs water, indirect waste with an air gap to the floor sink, and any required backflow device; the gas fitter installs a shutoff and an approved connector with restraint on movable cooking equipment; the electrician terminates power per nameplate. Keep circuits locked out and tagged until the connecting trade releases them, then leak-check gas joints with soap solution.',
          detail: 'No food-equipment drain may pipe straight into the sewer. Warewashing machines and culinary sinks are the only possible exceptions, and only where the local code allows.',
          tools: ['soap solution', 'flashlight', 'voltmeter (electrician)'],
          materials: [],
          safety_ids: ['electric_live', 'lockout_tag', 'hot_work'],
          qa_ids: ['indirect_waste_air_gap', 'gas_shutoff_leak', 'power_per_nameplate'],
          code_refs: [
            { section: '802.1.1', code_type: 'IPC', note: 'Food-handling equipment drains discharge indirectly through an air gap' },
            { section: '409.5', code_type: 'IFGC', note: 'Shutoff valve ahead of each gas appliance' },
            { section: '5-202.13', code_type: 'FDA Food Code', note: 'Air gap at least twice the inlet diameter and not under 1 inch' },
          ],
        },
        {
          title: 'Start up, demonstrate and pass pre-opening',
          instruction: 'With the hood and its suppression system already approved, fire and run each item to the maker’s start-up sheet, record temperatures and pressures, and fix leaks or faults. Have the maker or agent demonstrate operation and cleaning to the owner’s staff, hand over manuals and warranties, peel the film, clean, and walk the space with the inspector and the health department.',
          tools: ['probe thermometer', 'sanitizer test strips', 'start-up checklists'],
          materials: ['stainless cleaner'],
          safety_ids: ['burn_startup', 'fire_startup', 'chem_sealant'],
          qa_ids: ['startup_records', 'test_kits_gauges', 'preopening_passed'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '8-203.10', code_type: 'FDA Food Code', note: 'Regulator pre-operational inspection against the approved plans' },
            { section: '4-205.10', code_type: 'FDA Food Code', note: 'ANSI-certified food equipment deemed to meet design and construction rules' },
          ],
        },
      ],
    },
    {
      id: 'dish_machine',
      example_title: 'Set dish machine and booster heater',
      priority: 10,
      when: { title_re: 'dish ?machine|dishwasher|warewash' },
      steps: [
        {
          title: 'Set and level the dish machine and tables',
          instruction: 'Set the machine, soiled and clean tables in line so tables drain toward the machine. Level, seal the tables to the wall and to the machine, and check the drain route: indirect to a floor sink, or direct only where local code allows and a trapped floor drain is within 5 feet.',
          tools: ['level', 'adjustable wrench', 'caulk gun'],
          materials: ['food-grade silicone sealant', 'table leg anchors'],
          safety_ids: ['heavy_lift', 'sharp_edge'],
          qa_ids: ['level_doors', 'wall_seal', 'indirect_waste_air_gap'],
          code_refs: [{ section: '5-402.11', code_type: 'FDA Food Code', note: 'No direct sewer connection from food equipment drains except as allowed' }],
        },
        {
          title: 'Connect hot water, booster and power',
          instruction: 'Plumber connects hot water, the booster heater and the drain; electrician connects the machine and booster per nameplate. Confirm the chemical pumps (detergent, rinse aid, sanitizer for low-temp machines) are mounted and primed by the chemical supplier.',
          tools: ['flashlight'],
          materials: [],
          safety_ids: ['electric_live', 'lockout_tag', 'chem_sealant'],
          qa_ids: ['power_per_nameplate'],
        },
        {
          title: 'Verify gauges and sanitizing temperatures',
          instruction: 'Run full cycles with a maximum-registering thermometer or temperature labels on a rack. Confirm the wash and rinse tank gauges read, and the final rinse reaches the sanitizing temperature on the data plate (hot-water machines) or the sanitizer reads in range on test strips (chemical machines). Record results on the start-up sheet.',
          tools: ['maximum-registering thermometer or temperature labels', 'sanitizer test strips'],
          materials: [],
          safety_ids: ['burn_startup'],
          qa_ids: ['dish_temps', 'test_kits_gauges', 'startup_records'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '4-204.115', code_type: 'FDA Food Code', note: 'Dish machine shows wash, rinse and final-rinse temperatures' },
            { section: '4-501.112', code_type: 'FDA Food Code', note: 'Hot-water final rinse within the sanitizing temperature range' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    final: [
      { section: '4-402.11', code_type: 'FDA Food Code', note: 'Fixed equipment spaced for cleaning or sealed to walls and adjoining units', prov: fda },
      { section: '4-402.12', code_type: 'FDA Food Code', note: 'Floor-mounted fixed equipment sealed to the floor or raised on legs', prov: fda },
      { section: '5-402.11', code_type: 'FDA Food Code', note: 'No direct sewer connection from food equipment drains except as allowed', prov: fda },
      { section: '8-203.10', code_type: 'FDA Food Code', note: 'Regulator pre-operational inspection against the approved plans', prov: fda },
      { section: '75.075', code_type: 'WI ATCP', note: 'Food establishment plan approval before construction or remodel (Wisconsin)', prov: atcp },
      { section: '802.1.1', code_type: 'IPC', note: 'Food-handling equipment drains discharge indirectly through an air gap', prov: icc },
      { section: '409.5', code_type: 'IFGC', note: 'Shutoff valve ahead of each gas appliance', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: TITLE_RE, building_types: ['commercial', 'industrial', 'residential_mf'] }, type: 'forklift', reason: 'Unload and move palletized equipment from the truck to the kitchen', optional: true },
    { when: { title_re: 'stainless|counter|fabricat|custom' }, type: 'welder', reason: 'Field-weld and polish custom stainless seams', optional: true },
  ],
  hazards: [
    { id: 'heavy_lift', hazard: 'Back strain or crushed hands moving ranges, ovens, fryers and sinks', hazard_es: PENDING_ES, controls: ['Plan the route and set spot before moving; use dollies, pallet jacks or extra people', 'Never lift by doors, knobs, rails or burner grates'], controls_es: PENDING_ES, osha_ref: '1926.20(b)(1)', severity: 3, ppe: ['work gloves', 'safety-toe boots'], prov: osha('c') },
    { id: 'forklift', hazard: 'Struck by or crushed under a forklift or falling pallet during unloading', hazard_es: PENDING_ES, controls: ['Only trained and evaluated operators drive the forklift', 'Keep people out of the travel path and from under raised loads'], controls_es: PENDING_ES, osha_ref: '1926.602(d)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'rigging', hazard: 'Equipment dropping when rigged through doors, down stairs or onto a curb', hazard_es: PENDING_ES, controls: ['Inspect straps, slings and hardware before each shift; remove damaged gear', 'Use only rigging with a legible rated-load tag'], controls_es: PENDING_ES, osha_ref: '1926.251(a)(1)', severity: 3, prov: osha('h') },
    { id: 'storage_stack', hazard: 'Crates or boxed equipment tipping or sliding in the staging area', hazard_es: PENDING_ES, controls: ['Block, band or lay down tall crates so they cannot tip', 'Keep floor loading under the posted limit on upper floors'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 3, prov: osha('h') },
    { id: 'sharp_edge', hazard: 'Cuts from sheet-metal edges, banding and crate fasteners', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves when uncrating and handling stainless', 'Cut banding with the safety cutter and bin it right away'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves', 'sleeves'], prov: osha('e') },
    { id: 'eye_flying', hazard: 'Eye injury from flying chips, banding and fasteners', hazard_es: PENDING_ES, controls: ['Wear safety glasses while uncrating, drilling and fastening'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'electric_live', hazard: 'Shock from live circuits at equipment junction boxes and receptacles', hazard_es: PENDING_ES, controls: ['Only the electrician terminates power; work on de-energized circuits', 'Treat every stub-up as live until tested'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'lockout_tag', hazard: 'Equipment energized while another trade is still connecting it', hazard_es: PENDING_ES, controls: ['Tag de-energized circuits at every point they can be switched on', 'Remove tags only by the person who placed them after the connection is released'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'hot_work', hazard: 'Fire from welding or grinding stainless near crates, packing and finishes', hazard_es: PENDING_ES, controls: ['Move combustible packing away or shield it before hot work', 'Keep an extinguisher at hand and watch the area after work stops'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding helmet', 'leather gloves'], prov: osha('j') },
    { id: 'chem_sealant', hazard: 'Skin, eye and breathing irritation from sealants, stainless cleaners and dish chemicals', hazard_es: PENDING_ES, controls: ['Read the SDS and ventilate', 'Wear gloves and eye protection when handling chemicals'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses'], prov: osha('d') },
    { id: 'burn_startup', hazard: 'Burns from hot surfaces, oil, steam and rinse water during start-up', hazard_es: PENDING_ES, controls: ['Only start-up staff run equipment; keep others back', 'Wear heat-resistant gloves and let surfaces cool before touching'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 3, ppe: ['heat-resistant gloves', 'safety glasses'], prov: osha('e') },
    { id: 'fire_startup', hazard: 'Fire at first light-off of gas cooking equipment', hazard_es: PENDING_ES, controls: ['Hood and suppression system approved and active before cooking equipment is fired', 'Portable extinguisher within reach during start-up'], controls_es: PENDING_ES, osha_ref: '1926.150(c)(1)', severity: 3, prov: osha('f') },
  ],
  qa_checklist: [
    { id: 'plan_approval_on_site', item: 'Health-department plan approval letter and approved equipment layout on site; installed layout matches it or changes are approved.', item_es: { status: 'translated', text: 'Carta de aprobación del departamento de salud y la distribución aprobada en obra; la instalación coincide o los cambios están aprobados.' }, prov: { src: ['kitchen_equipment-wi-atcp-75', 'kitchen_equipment-fda-food-code-2022'], confidence: 'verified', last_verified: D } },
    { id: 'rough_in_match', item: 'Every gas, power, water and drain stub matches the rough-in drawing for location, size, voltage/phase and height before walls close.', item_es: { status: 'translated', text: 'Cada salida de gas, electricidad, agua y desagüe coincide con el plano de preparaciones en ubicación, tamaño, voltaje/fase y altura antes de cerrar muros.' }, prov: est('Common to manufacturer spec sheets and rough-in drawings. No public source reviewed — trade practice.') },
    { id: 'interceptor_access', item: 'Grease interceptor or trap located where it can be opened and cleaned easily.', item_es: { status: 'translated', text: 'Interceptor o trampa de grasa ubicado donde se pueda abrir y limpiar con facilidad.' }, prov: fda },
    { id: 'nsf_listed', item: 'Each scheduled item carries a food-equipment sanitation listing mark or is approved by the regulator.', item_es: { status: 'translated', text: 'Cada equipo de la cédula tiene marca de certificación sanitaria para equipo de alimentos o está aprobado por la autoridad.' }, prov: mfr('Food Code 4-205.10: ANSI-certified food equipment is deemed compliant; NSF listing search used to confirm.') },
    { id: 'legs_or_sealed', item: 'Fixed floor equipment is sealed to the floor or on legs giving at least 6 in. clearance (4 in. where no part is over 6 in. from cleaning access).', item_es: { status: 'translated', text: 'El equipo fijo de piso está sellado al piso o sobre patas con al menos 6 pulg. de altura libre (4 pulg. si ninguna parte queda a más de 6 pulg. del acceso de limpieza).' }, prov: fda },
    { id: 'cleaning_space', item: 'Fixed equipment either has cleaning access along sides, back and top, or is tight to adjoining units and walls (1/32 in. max) or sealed.', item_es: { status: 'translated', text: 'El equipo fijo tiene acceso de limpieza por los lados, atrás y arriba, o queda junto a equipos y muros (máx. 1/32 pulg.) o sellado.' }, prov: fda },
    { id: 'level_doors', item: 'Each item level; doors, drawers and lids close and seal; tables and drainboards drain toward the sink or machine.', item_es: { status: 'translated', text: 'Cada equipo nivelado; puertas, cajones y tapas cierran y sellan; mesas y escurrideros drenan hacia la tarja o máquina.' }, prov: est('Manufacturer installation instructions. No public source reviewed — trade practice.') },
    { id: 'wall_seal', item: 'Joints to walls and adjoining equipment exposed to spills are sealed smooth and cleanable — no open seams or voids.', item_es: { status: 'translated', text: 'Juntas con muros y equipos contiguos expuestas a derrames selladas lisas y limpiables — sin costuras abiertas ni huecos.' }, prov: fda },
    { id: 'indirect_waste_air_gap', item: 'Food equipment drains discharge indirectly with an air gap of at least twice the outlet diameter and not less than 1 in.; no direct sewer connection unless the local code allows it for warewashing.', item_es: PENDING_ES, safety: true, prov: { src: ['kitchen_equipment-fda-food-code-2022', 'icc-pa'], confidence: 'verified', last_verified: D } },
    { id: 'gas_shutoff_leak', item: 'Each gas appliance has an accessible shutoff, an approved connector (with restraint on movable equipment) and joints leak-tested with no bubbles.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'power_per_nameplate', item: 'Power connections match each nameplate voltage, phase and amperage; cords and receptacles undamaged.', item_es: PENDING_ES, safety: true, prov: est('Nameplate data from the manufacturer; connection by the licensed electrician. No public source reviewed — trade practice.') },
    { id: 'dish_temps', item: 'Hot-water dish machine final rinse reaches 165 °F (stationary-rack single-temp) or 180 °F (others) at the manifold, not over 194 °F; chemical machines read sanitizer in range.', item_es: { status: 'translated', text: 'El enjuague final del lavavajillas de agua caliente llega a 165 °F (rack fijo, una temperatura) o 180 °F (otros) en el múltiple, sin pasar de 194 °F; las máquinas químicas leen desinfectante en rango.' }, prov: fda },
    { id: 'test_kits_gauges', item: 'Dish machine wash/rinse/final-rinse gauges work; sanitizer test kits and thermometers provided to the owner.', item_es: { status: 'translated', text: 'Funcionan los indicadores de lavado, enjuague y enjuague final del lavavajillas; se entregan al dueño tiras de prueba de desinfectante y termómetros.' }, prov: fda },
    { id: 'startup_records', item: 'Start-up sheet completed for every powered item (temperatures, pressures, controls) and filed with manuals and warranties.', item_es: { status: 'translated', text: 'Hoja de arranque completa para cada equipo con energía (temperaturas, presiones, controles) y archivada con manuales y garantías.' }, prov: est('Manufacturer start-up and warranty registration requirements. No public source reviewed — trade practice.') },
    { id: 'preopening_passed', item: 'Health department pre-operational inspection passed and building final signed before the food permit opens.', item_es: { status: 'translated', text: 'Inspección sanitaria previa a la operación aprobada y final de construcción firmado antes de abrir con el permiso de alimentos.' }, prov: fda },
  ],
  inspection_checklists: {
    final: [
      { item: 'Equipment installed per the approved layout; changes approved in writing', item_es: PENDING_ES, ref: 'ATCP 75.075' },
      { item: 'Gas appliances: shutoff valves, approved connectors, restraints on movable units, no leaks', item_es: PENDING_ES, ref: 'IFGC 409.5' },
      { item: 'Indirect waste air gaps visible at floor sinks; backflow devices where required', item_es: PENDING_ES, ref: 'IPC 802.1.1' },
      { item: 'Hood and suppression approvals in hand before cooking equipment is fired', item_es: PENDING_ES },
    ],
    health_dept_preopening: [
      { item: 'Fixed equipment on 6 in. legs or sealed; joints to walls sealed and cleanable', item_es: PENDING_ES, ref: 'Food Code 4-402.11/12' },
      { item: 'Handwashing sinks in place with hot and cold water, soap and towels', item_es: PENDING_ES, ref: 'Food Code 5-203.11' },
      { item: 'Three-compartment sink and/or dish machine reach sanitizing temperatures or concentration', item_es: PENDING_ES, ref: 'Food Code 4-501.112' },
      { item: 'Cold and hot holding equipment reaching temperature with thermometers in place', item_es: PENDING_ES, ref: 'Food Code 4-301.11' },
      { item: 'Grease interceptor accessible; no direct drain connections from food equipment', item_es: PENDING_ES, ref: 'Food Code 5-402.11' },
    ],
  },
  assemblies: [
    { code: 'B-KEQ-SET-EA', name: 'Set, level and anchor one foodservice equipment item (owner/vendor-furnished)', name_es: 'Colocar, nivelar y anclar un equipo de cocina comercial (suministrado por el dueño/proveedor)', unit: 'EA', csi: '11 40 00',
      description: 'Install labor per item; equipment supply and utility connections priced separately.',
      material_cost_cents: { v: 1500, prov: est('shims, leg anchors, sealant allowance per item, national baseline 2026') }, labor_hours_per_unit: { v: 3, prov: est('uncrate, move into place, level, anchor; 2-person crew average across small and large items') },
      equipment_cost_cents: { v: 0, prov: est('dollies and pallet jack carried as small tools') }, waste_pct: { v: 5, prov: est('consumables') } },
    { code: 'B-KEQ-WORKTABLE-EA', name: 'Stainless worktable ≈30x72 in. with undershelf, supply and set', name_es: 'Mesa de trabajo de acero inoxidable ≈30x72 pulg. con entrepaño, suministro y colocación', unit: 'EA', csi: '11 40 00',
      material_cost_cents: { v: 60000, prov: est('16-ga stainless top, galvanized or stainless undershelf, NSF listed; national distributor pricing 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('assemble legs/undershelf, level, place') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'B-KEQ-SINK3-EA', name: 'Three-compartment stainless sink with drainboards, supply and set (plumbing connection by others)', name_es: 'Tarja inoxidable de tres compartimientos con escurrideros, suministro y colocación (plomería por otros)', unit: 'EA', csi: '11 40 00',
      material_cost_cents: { v: 180000, prov: est('NSF-listed 3-compartment sink with two drainboards and faucet set, 2026') }, labor_hours_per_unit: { v: 3, prov: est('set, level, seal to wall; plumber connects') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('unit item') } },
    { code: 'B-KEQ-SEAL-LF', name: 'Food-grade sealant or stainless cover strip at equipment-to-wall joints', name_es: 'Sellador grado alimenticio o tapajuntas de acero inoxidable en juntas de equipo con muro', unit: 'LF', csi: '11 40 00',
      material_cost_cents: { v: 150, prov: est('food-grade silicone plus occasional stainless angle, blended per LF, 2026') }, labor_hours_per_unit: { v: 0.08, prov: est('clean, bead, tool; trim strip where gaps are wide') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 10, prov: est('partial tubes and trim cut-offs') } },
    { code: 'B-KEQ-STARTUP-EA', name: 'Start-up, check-out and owner demonstration per powered equipment item', name_es: 'Arranque, verificación y demostración al dueño por equipo con energía', unit: 'EA', csi: '11 40 00',
      material_cost_cents: { v: 0, prov: est('no materials') }, labor_hours_per_unit: { v: 2, prov: est('run-in, record temps/pressures, adjust, demonstrate to staff') },
      equipment_cost_cents: { v: 0, prov: est('test instruments carried as small tools') }, waste_pct: { v: 0, prov: est('labor only') } },
  ],
  quantity_rules: [
    { code: 'B-KEQ-SET-EA', assumption: 'Assume 10 equipment items to set until the equipment schedule count is confirmed', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 10 } },
    { code: 'B-KEQ-SINK3-EA', assumption: 'One three-compartment warewashing sink per commercial kitchen — remove if the owner supplies it', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'B-KEQ-SEAL-LF', assumption: 'Assume 40 LF of equipment-to-wall sealing until the layout is measured', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 40 } },
    { code: 'B-KEQ-STARTUP-EA', assumption: 'Assume 6 powered items needing start-up and demo until the schedule is confirmed', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 6 } },
  ],
  dependency_hints: [
    { after_trades: ['kitchen_exhaust', 'tile'], before_phase: 'punch', note: 'Equipment sets after the hood, wall finishes and quarry tile/epoxy floors are in, and before punch and the health department pre-opening.' },
  ],
});
