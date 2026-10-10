// Trade Knowledge Pack — central_vacuum (Central Vacuum). Wave 17 — NEW-TRADE pattern (no hand recipe).
// Dossier: docs/trade-packs/dossiers/central_vacuum.md. Sources: manufacturer support pages (VacuMaid, H-P
// Products — vocabulary only; install PDFs not retrievable, so practice steps are common industry practice),
// IRC R302.4 / R302.11 / R502.8 / R602.6 (reference only), 29 CFR 1926 (C, D, E, F, I, K, M, X, Z).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const mfr = { src: ['central_vacuum-vacumaid', 'central_vacuum-hp-help'], confidence: 'estimate' as const, last_verified: D, note: 'Common industry practice for residential central vacuum; the maker’s install guide for the unit supplied governs. Manufacturer PDFs were not retrievable on research day.' };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const irc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };

export default definePack({
  key: 'central_vacuum',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs residential central vacuum systems — inlet layout by hose reach, rough-in of PVC tubing with long-sweep fittings and low-voltage control wire inside the walls, a power unit in the garage or utility room with an outdoor exhaust, then inlet trim, hose kit and a suction test.',
    summary_es: 'Instala sistemas de aspiración central residenciales: ubicación de bocas según el alcance de la manguera, tubería de PVC con codos de radio largo y cable de control de bajo voltaje dentro de los muros, unidad motora en el garaje o cuarto de servicio con escape al exterior, y luego acabados de las bocas, juego de manguera y prueba de succión.',
    glossary: [
      { term: 'Inlet valve', term_es: 'Boca de aspiración', def: 'Wall-mounted port with a spring door where the hose plugs in and starts the system.', def_es: 'Puerto en el muro con tapa de resorte donde se conecta la manguera y arranca el sistema.' },
      { term: 'Power unit', term_es: 'Unidad motora', def: 'The motor and dirt canister, usually on a garage wall, that makes the suction.', def_es: 'El motor y el recipiente de polvo, normalmente en un muro del garaje, que genera la succión.' },
      { term: 'Long-sweep fitting', term_es: 'Accesorio de radio largo', def: 'Gentle-radius elbow or tee that lets debris glide around turns instead of jamming.', def_es: 'Codo o te de radio amplio que deja pasar la suciedad en las curvas sin atascarse.' },
      { term: 'Low-voltage wire', term_es: 'Cable de bajo voltaje', def: 'Thin two-conductor control wire from each inlet to the power unit that turns the motor on.', def_es: 'Cable delgado de dos conductores desde cada boca hasta la unidad motora que enciende el motor.' },
      { term: 'Hose reach', term_es: 'Alcance de la manguera', def: 'How far the hose lets you clean from one inlet; it sets how many inlets the house needs.', def_es: 'Distancia que la manguera permite limpiar desde una boca; define cuántas bocas necesita la casa.' },
      { term: 'Exhaust vent', term_es: 'Ventilación de escape', def: 'Tube that carries the motor’s exhaust air outdoors, away from windows and air intakes.', def_es: 'Tubo que lleva el aire de escape del motor al exterior, lejos de ventanas y tomas de aire.' },
      { term: 'Fireblocking', term_es: 'Bloqueo contra fuego', def: 'Material that fills hidden wall and floor openings so fire cannot run up through them.', def_es: 'Material que rellena huecos ocultos en muros y pisos para que el fuego no suba por ellos.' },
      { term: 'Kick-plate inlet', term_es: 'Boca de zócalo', def: 'Inlet fitted low in cabinet toe-space so you can sweep debris straight in.', def_es: 'Boca instalada abajo en el zócalo del gabinete para barrer la suciedad directamente.' },
    ],
  },
  est_bucket: 'building',
  recipes: [
    {
      id: 'central_vac_system',
      example_title: 'Central vacuum rough-in and inlets',
      when: { title_re: 'central\\s*vac|vacuum\\s+system|vac(?:uum)?\\s+inlet' },
      steps: [
        {
          title: 'Lay out inlets and the power unit location',
          instruction: 'Mark inlet spots on the plans so the hose reaches every floor area from the nearest inlet, allowing for doors, stairs and furniture. Plan about one inlet for each two to three rooms, one at each stair landing and one in the garage. Pick the power unit spot on a garage or utility wall near a power circuit and an outside wall for the exhaust. Walk the plan with the GC and framer before drilling.',
          tools: ['tape measure', 'chalk line', 'pencil'],
          materials: ['floor plans'],
          safety_ids: ['ladder'],
          qa_ids: ['inlet_coverage', 'unit_location'],
        },
        {
          title: 'Rough in PVC tubing with long-sweep fittings',
          instruction: 'Drill through plates and joists inside the allowed notch and bore limits, then run tubing from the farthest inlet toward the power unit, joining branches with tees pointed in the direction of airflow. Use only long-sweep elbows, glue every joint fully, and support the tube so it does not sag. Mount an inlet bracket at each location with the tube end stubbed through. Do not run through rated walls or floors without restoring the rating.',
          detail: 'The inspector looks at the framing check before insulation goes in, so leave drilled holes and penetrations exposed until it passes.',
          tools: ['drill with auger bit', 'PVC cutter', 'tape measure', 'level', 'stud finder'],
          materials: ['vacuum PVC tubing', 'long-sweep elbows and tees', 'PVC primer and cement', 'pipe hangers or straps', 'inlet mounting brackets', 'fire-rated sealant or fireblock material'],
          safety_ids: ['power_tool', 'hand_tool', 'eye_flying', 'pvc_vapors', 'pvc_flammable', 'attic_fall', 'ladder'],
          qa_ids: ['sweeps_only', 'joints_glued', 'tube_supported', 'penetrations_sealed', 'notch_bore_limits'],
          gating_inspection_type: 'insulation',
          code_refs: [
            { section: 'R302.11', code_type: 'IRC', note: 'Fireblocking at hidden wall and floor openings' },
            { section: 'R302.4', code_type: 'IRC', note: 'Penetrations of fire-rated assemblies' },
            { section: 'R602.6', code_type: 'IRC', note: 'Drilling and notching limits for studs' },
          ],
        },
        {
          title: 'Run low-voltage wire and set the power unit',
          instruction: 'Staple two-conductor low-voltage wire along the tubing from each inlet bracket to the power unit, leaving slack at both ends, and keep it clear of line-voltage cable. Mount the power unit on its wall bracket at the planned height, run the exhaust tube to the outdoors with a rain-cap termination away from windows and air intakes, and connect the intake tubing. Power wiring is by the electrician, per the unit’s required circuit.',
          tools: ['staple gun', 'wire stripper', 'drill/driver', 'level', 'hole saw'],
          materials: ['low-voltage wire', 'wire connectors', 'power unit and wall bracket', 'exhaust tubing and wall cap', 'sealant'],
          safety_ids: ['cord_shock', 'heavy_lift', 'power_tool', 'silica'],
          qa_ids: ['lv_wire_separate', 'exhaust_outdoors', 'unit_mounted'],
        },
        {
          title: 'Trim inlets and install the hose kit',
          instruction: 'After drywall and paint, cut the inlet openings to the bracket, connect the low-voltage leads, and set each valve and trim plate. Hang the hose, tool set and any hose storage as the kit directs. Keep the plugs in the tubing until the walls are done so no drywall dust gets in.',
          tools: ['screwdriver', 'wire stripper', 'drywall saw', 'level'],
          materials: ['inlet valves and trim plates', 'hose and tool kit', 'wire nuts'],
          safety_ids: ['hand_tool', 'eye_flying', 'ladder'],
          qa_ids: ['inlets_secure', 'tubing_clean'],
        },
        {
          title: 'Test every inlet and the whole system',
          instruction: 'Power up the unit. At each inlet, check that inserting the hose starts the motor and that suction is strong at the hose end; if one is weak, hunt for leaks or a blockage. Confirm the exhaust is blowing outdoors and the canister seals. Show the owner how the system works and note any rated-wall seals for the final inspection.',
          tools: ['hose', 'suction test gauge or hand test'],
          materials: [],
          safety_ids: ['cord_shock'],
          qa_ids: ['suction_each_inlet', 'exhaust_outdoors', 'owner_walk'],
          gating_inspection_type: 'final',
          code_refs: [{ section: 'R302.4', code_type: 'IRC', note: 'Rated-assembly penetrations stay sealed at final' }],
        },
      ],
    },
  ],
  code_refs: {
    insulation: [
      { section: 'R302.11', code_type: 'IRC', note: 'Fireblocking at hidden wall and floor openings', prov: irc },
      { section: 'R302.4', code_type: 'IRC', note: 'Penetrations of fire-rated assemblies', prov: irc },
      { section: 'R602.6', code_type: 'IRC', note: 'Drilling and notching limits for studs', prov: irc },
      { section: 'R502.8', code_type: 'IRC', note: 'Cutting and notching floor joists', prov: irc },
    ],
    final: [
      { section: 'R302.4', code_type: 'IRC', note: 'Rated-assembly penetrations remain sealed', prov: irc },
    ],
  },
  hazards: [
    { id: 'ladder', hazard: 'Ladder slip or overreach while drilling and mounting brackets', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it is used to reach', 'Set it on firm footing and keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'attic_fall', hazard: 'Falling through an open hole or between ceiling joists in an attic or floor', hazard_es: PENDING_ES, controls: ['Walk and kneel only on joists or planks across them', 'Cover or guard any hole you drill through a floor before leaving it'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)', severity: 3, prov: osha('m') },
    { id: 'power_tool', hazard: 'Drill kickback and cuts from power tools and hole saws', hazard_es: PENDING_ES, controls: ['Use side handle on right-angle drills and brace against the stud', 'Keep guards in place and clamp or support the work'], controls_es: PENDING_ES, osha_ref: '1926.300(b)', severity: 3, ppe: ['safety glasses', 'hearing protection'], prov: osha('i') },
    { id: 'hand_tool', hazard: 'Cuts from PVC cutters, knives and sharp pipe ends', hazard_es: PENDING_ES, controls: ['Keep blades sharp and cut away from the body', 'Deburr pipe ends before fitting'], controls_es: PENDING_ES, osha_ref: '1926.301(a)', severity: 2, ppe: ['work gloves'], prov: osha('i') },
    { id: 'eye_flying', hazard: 'Eye injury from drilling chips, drywall dust and debris', hazard_es: PENDING_ES, controls: ['Wear safety glasses when drilling, cutting and working overhead'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'pvc_vapors', hazard: 'Breathing solvent vapors from PVC primer and cement in tight spaces', hazard_es: PENDING_ES, controls: ['Read the SDS and ventilate the work area', 'Keep containers closed between uses and wear gloves and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 2, ppe: ['nitrile gloves', 'safety glasses', 'respirator when the SDS calls for it'], prov: osha('d') },
    { id: 'pvc_flammable', hazard: 'Fire from flammable PVC primer and cement near heat or sparks', hazard_es: PENDING_ES, controls: ['Keep solvent in closed approved containers away from ignition sources', 'Remove rags and empties from the building daily'], controls_es: PENDING_ES, osha_ref: '1926.152(a)(1)', severity: 3, prov: osha('f') },
    { id: 'silica', hazard: 'Silica dust drilling the exhaust or tube hole through block or concrete', hazard_es: PENDING_ES, controls: ['Use a drill with dust capture or wet method', 'Wear a respirator when the dust control method calls for it'], controls_es: PENDING_ES, osha_ref: '1926.1153', severity: 3, ppe: ['respirator when required', 'safety glasses'], prov: osha('z') },
    { id: 'cord_shock', hazard: 'Electric shock from cords, tools and testing the powered unit', hazard_es: PENDING_ES, controls: ['GFCI protection on every temporary receptacle', 'Inspect cords daily; remove damaged ones', 'Lock out the circuit before connecting the unit'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)', severity: 3, prov: osha('k') },
    { id: 'heavy_lift', hazard: 'Back strain lifting and mounting the power unit', hazard_es: PENDING_ES, controls: ['Two-person lift for the motor and canister', 'Set the wall bracket first and lift to height, not overhead from the floor'], controls_es: PENDING_ES, osha_ref: '1926.20(b)', severity: 3, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'inlet_coverage', item: 'Inlet locations on the layout reach all floor area with the specified hose length, including each floor, stair landing and the garage.', item_es: { status: 'translated', text: 'Las bocas del plano alcanzan toda el área con la longitud de manguera especificada, incluyendo cada piso, descanso de escalera y el garaje.' }, prov: mfr },
    { id: 'unit_location', item: 'Power unit location is on a garage or utility wall, near a dedicated circuit and an outside wall for the exhaust, with room to service the canister.', item_es: { status: 'translated', text: 'La unidad motora está en un muro del garaje o cuarto de servicio, cerca de un circuito dedicado y de un muro exterior para el escape, con espacio para dar servicio al recipiente.' }, prov: mfr },
    { id: 'sweeps_only', item: 'Only long-sweep fittings used on branch turns and bends; tees point in the direction of airflow.', item_es: { status: 'translated', text: 'Solo se usan accesorios de radio largo en curvas y ramales; las tes apuntan en la dirección del flujo de aire.' }, prov: mfr },
    { id: 'joints_glued', item: 'Every PVC joint primed and cemented fully; no dry fits, no burrs inside the tube.', item_es: { status: 'translated', text: 'Cada unión de PVC con imprimador y cemento completos; sin uniones en seco ni rebabas dentro del tubo.' }, prov: mfr },
    { id: 'tube_supported', item: 'Tubing supported at the maker’s spacing with no sagging runs where dust can collect.', item_es: { status: 'translated', text: 'Tubería sujeta a la separación del fabricante, sin tramos caídos donde se acumule polvo.' }, prov: mfr },
    { id: 'notch_bore_limits', item: 'Holes and notches in studs and joists stay within the code’s allowed size and location.', item_es: PENDING_ES, safety: true, prov: irc },
    { id: 'penetrations_sealed', item: 'Where tubing passes through fire-rated walls, floors or fireblocking, the opening is sealed with an approved fire-resistant material.', item_es: PENDING_ES, safety: true, prov: irc },
    { id: 'lv_wire_separate', item: 'Low-voltage wire kept clear of line-voltage cable and stapled without pinching; continuity checked from each inlet to the unit.', item_es: { status: 'translated', text: 'Cable de bajo voltaje separado del cable de voltaje de línea y engrapado sin aplastarlo; continuidad verificada desde cada boca hasta la unidad.' }, prov: mfr },
    { id: 'unit_mounted', item: 'Power unit mounted level on its bracket into framing, accessible for canister emptying and filter service.', item_es: { status: 'translated', text: 'Unidad motora montada nivelada en su soporte sobre la estructura, accesible para vaciar el recipiente y cambiar el filtro.' }, prov: mfr },
    { id: 'exhaust_outdoors', item: 'Exhaust runs to the outdoors with a wall cap away from windows, doors and air intakes — never into an attic, crawl space or wall cavity.', item_es: PENDING_ES, safety: true, prov: mfr },
    { id: 'inlets_secure', item: 'Inlet valves and trim plates secure, doors spring shut, wires connected, plugs removed from tubing ends.', item_es: { status: 'translated', text: 'Bocas y placas firmes, tapas con resorte cierran, cables conectados y tapones retirados de los extremos de la tubería.' }, prov: mfr },
    { id: 'tubing_clean', item: 'Tubing ends plugged during drywall and cleared of dust and debris before trim.', item_es: { status: 'translated', text: 'Extremos de tubería tapados durante el drywall y limpios de polvo y residuos antes del acabado.' }, prov: mfr },
    { id: 'suction_each_inlet', item: 'Every inlet starts the motor with the hose inserted and gives firm suction at the hose end; weak inlets traced to leaks or blockages and corrected.', item_es: { status: 'translated', text: 'Cada boca arranca el motor con la manguera y da succión firme en la punta; las bocas débiles se rastrean por fugas u obstrucciones y se corrigen.' }, prov: mfr },
    { id: 'owner_walk', item: 'Owner shown how to use the inlets, empty the canister and find the warranty and filter information.', item_es: { status: 'translated', text: 'Se muestra al propietario cómo usar las bocas, vaciar el recipiente y dónde está la garantía e información de filtros.' }, prov: mfr },
  ],
  inspection_checklists: {
    insulation: [
      { item: 'Tubing penetrations through plates, joists and rated assemblies sealed or fireblocked', item_es: PENDING_ES, ref: 'R302.11' },
      { item: 'Drilled holes and notches in framing within allowed limits', item_es: PENDING_ES, ref: 'R602.6' },
      { item: 'Low-voltage wire and tubing in place and exposed before insulation is installed', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Rated-assembly penetrations still sealed after trim-out', item_es: PENDING_ES, ref: 'R302.4' },
      { item: 'Power unit exhaust terminates outdoors and the circuit is per the manufacturer’s label', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'B-CVAC-INLET-EA', name: 'Central vacuum rough-in per inlet (tubing run, sweep fittings, bracket, low-voltage wire)', name_es: 'Rough-in de aspiración central por boca (tubería, accesorios de radio largo, soporte, cable de bajo voltaje)', unit: 'EA', csi: '11 24 00',
      description: 'Typical ~25 LF of tubing per inlet branch share; inlet valve and trim are B-CVAC-TRIM-EA.',
      material_cost_cents: { v: 6500, prov: est('≈25 LF 2 in. vacuum tube + fittings + glue + bracket + 30 ft LV wire, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('drill, run, glue, strap and wire one inlet branch') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 10, prov: est('cut-offs and spoiled fittings') } },
    { code: 'B-CVAC-POWER-EA', name: 'Central vacuum power unit install with exhaust vent and hose/tool kit', name_es: 'Instalación de unidad motora de aspiración central con ventilación de escape y juego de manguera/herramientas', unit: 'EA', csi: '11 24 00',
      description: 'Mid-range residential unit, one per system; the electrical circuit is the electrician’s scope.',
      material_cost_cents: { v: 90000, prov: est('mid-range residential power unit + wall bracket + exhaust tube/cap + 30 ft hose and tool kit, 2026') }, labor_hours_per_unit: { v: 3, prov: est('mount, vent, connect and commission') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('unit is bought to size') } },
    { code: 'B-CVAC-TRIM-EA', name: 'Central vacuum inlet valve and trim plate, set after finishes', name_es: 'Boca de aspiración central con placa, instalada después de los acabados', unit: 'EA', csi: '11 24 00',
      material_cost_cents: { v: 3500, prov: est('inlet valve with spring door + trim plate, 2026') }, labor_hours_per_unit: { v: 0.4, prov: est('cut, connect leads, set and test one inlet') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 2, prov: est('damaged plates') } },
  ],
  quantity_rules: [
    { code: 'B-CVAC-INLET-EA', assumption: 'About one inlet per 2.5 rooms on the plans (hose reach), rounded up — confirm against the layout', when: { building_types: ['residential_sf'] }, qty: { basis: 'rooms', mul: 0.4, round: 'ceil' } },
    { code: 'B-CVAC-TRIM-EA', assumption: 'One trim inlet per rough-in inlet', when: { building_types: ['residential_sf'] }, qty: { basis: 'rooms', mul: 0.4, round: 'ceil' } },
    { code: 'B-CVAC-POWER-EA', assumption: 'One power unit per single-family system', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], before_phase: 'insulation', note: 'Tubing and low-voltage wire go in after framing and before insulation and drywall; inlets are trimmed after paint.' },
  ],
});
