// Trade Knowledge Pack — refrigeration (Commercial Refrigeration: remote condensing units, compressor
// racks, reach-in / display cases, ice machines). Wave 14 — NEW-TRADE pattern (no hand recipe, no
// template tasks; only the generic mechanical phase recipe applies otherwise). Walk-in boxes belong to
// cold_storage. Dossier: docs/trade-packs/dossiers/refrigeration.md.
// Sources: UFGS 23 23 00 (Refrigerant Piping — brazing with nitrogen purge, pneumatic test, evacuation,
// charging), 40 CFR 82 Subpart F (venting ban, evacuation, 608 technician certification, 82.157 leak
// repair for ≥50 lb ODS appliances), 40 CFR 84 Subpart C (AIM Act leak repair ≥15 lb HFC from 2026),
// EPA refrigerant safety, 29 CFR 1926 (C, D, E, J, K, M, X, CC), IMC Ch. 11 / ASHRAE 15 / NEC 440 (ref only).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['hvac-ufgs-23-23-00'], confidence: 'verified' as const, last_verified: D };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D, note: 'IMC Ch. 11 numbering; confirm against the adopted edition.' };
const nfpa = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const cfr82 = { src: ['refrigeration-ecfr-40-82f'], confidence: 'verified' as const, last_verified: D };
const leak = { src: ['refrigeration-ecfr-40-82-157', 'refrigeration-ecfr-40-84c', 'refrigeration-epa-608-leak-repair'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

const TITLE = 'refrigerat|condensing\\s*units?|display\\s*cases?|reach-?\\s*in|refrigerant\\s*rack|compressor\\s*rack|merchandis(?:er|ing\\s*case)';
const ICE = 'ice\\s*(?:machine|maker)s?';
const UNITS = 'condensing\\s*units?|(?:compressor|refrigerant)\\s*racks?';
const CASES = 'display\\s*cases?|reach-?\\s*in|merchandis(?:er|ing\\s*case)';
const TEST = 'refrigera(?:nt|tion)\\s*(?:leak|pressure|standing)\\s*test|evacuat|refrigera(?:nt|tion)\\s*(?:charge|charging|start-?\\s*up)';

export default definePack({
  key: 'refrigeration',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs commercial refrigeration: sets remote condensing units or compressor racks, sets and connects reach-in and display cases and ice machines, brazes line sets under a nitrogen purge, pressure-tests with dry nitrogen, evacuates to a deep vacuum, charges, starts up and leaves EPA Section 608 service records. Walk-in boxes are cold storage; case drains tie into plumbing.',
    summary_es: 'Instala refrigeración comercial: unidades condensadoras o racks de compresores, vitrinas, reach-in y máquinas de hielo; suelda líneas con purga de nitrógeno, prueba con nitrógeno seco, hace vacío profundo, carga, arranca y deja registros EPA 608. Las cámaras (walk-in) y los drenajes finales son de otros oficios.',
    glossary: [
      { term: 'Condensing unit', term_es: 'Unidad condensadora', def: 'Outdoor or rooftop unit with the compressor and condenser coil that rejects the heat the cases pull out.', def_es: 'Unidad exterior o de techo con el compresor y el serpentín condensador que expulsa el calor que sacan las vitrinas.' },
      { term: 'Compressor rack', term_es: 'Rack de compresores', def: 'Several compressors on one frame serving many cases from a shared suction and liquid header, common in supermarkets.', def_es: 'Varios compresores en un mismo bastidor que alimentan muchas vitrinas desde cabezales comunes de succión y líquido; común en supermercados.' },
      { term: 'Line set', term_es: 'Juego de líneas', def: 'The paired copper suction and liquid lines between the case evaporator and the condensing unit.', def_es: 'Las líneas de cobre de succión y de líquido entre el evaporador de la vitrina y la unidad condensadora.' },
      { term: 'Nitrogen purge', term_es: 'Purga de nitrógeno', def: 'Low flow of dry nitrogen through the pipe while brazing so no scale forms inside the copper.', def_es: 'Flujo bajo de nitrógeno seco dentro del tubo mientras se suelda para que no se forme cascarilla en el cobre.' },
      { term: 'Standing pressure test', term_es: 'Prueba de presión sostenida', def: 'System filled with dry nitrogen to test pressure and watched over time to prove there are no leaks.', def_es: 'Sistema lleno de nitrógeno seco a presión de prueba y vigilado con el tiempo para comprobar que no hay fugas.' },
      { term: 'Micron gauge', term_es: 'Vacuómetro de micrones', def: 'Electronic gauge that reads deep vacuum in microns so you know moisture and air are out before charging.', def_es: 'Medidor electrónico que lee vacío profundo en micrones para saber que la humedad y el aire salieron antes de cargar.' },
      { term: 'Decay test', term_es: 'Prueba de caída de vacío', def: 'Pump valved off after evacuation; if the micron reading climbs past the limit there is a leak or moisture left.', def_es: 'Bomba cerrada después del vacío; si la lectura de micrones sube más del límite queda una fuga o humedad.' },
      { term: 'EPA 608 certification', term_es: 'Certificación EPA 608', def: 'Federal technician card (Type I, II, III or Universal) required for anyone who opens a refrigerant circuit.', def_es: 'Credencial federal de técnico (Tipo I, II, III o Universal) obligatoria para quien abra un circuito de refrigerante.' },
      { term: 'Leak rate', term_es: 'Tasa de fuga', def: 'Share of the full charge lost per year, calculated each time refrigerant is added; triggers repair deadlines on large systems.', def_es: 'Porción de la carga total que se pierde al año, calculada cada vez que se agrega refrigerante; activa plazos de reparación en sistemas grandes.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [
    {
      id: 'remote_case_system',
      example_title: 'Refrigerated display cases & remote condensing unit',
      when: { title_re: TITLE },
      steps: [
        {
          title: 'Check the equipment schedule, refrigerant and charge size',
          instruction: 'Compare the case and condensing unit schedule with what was delivered: model, voltage, refrigerant type and the full charge in pounds. Note any flammable (A2L or A3) refrigerant and whether the total charge in a room is near the limit that calls for a machinery room or leak detection. Mark the case line-up, line set routes, drain points and the condensing unit or rack location.',
          detail: 'The charge size sets the federal record keeping and leak repair duties later — write it down now.',
          code_refs: [{ section: '1103', note: 'Refrigeration system classification by refrigerant safety group' }, { section: '1104', note: 'System application limits — refrigerant quantity per occupancy' }, { section: '1105', note: 'Machinery room — when required, general requirements' }],
          tools: ['tape measure', 'chalk line', 'laser level', 'approved submittals'],
          materials: [],
          safety_ids: ['flammable_refrigerant'],
          qa_ids: ['schedule_match', 'charge_recorded'],
        },
        {
          title: 'Set the condensing unit or rack with service clearance',
          instruction: 'Lift the condensing unit or rack with a crane, telehandler or forklift — tag lines, nobody under the load. Set it level on the pad, rack stand or roof curb on vibration isolators, keep the airflow and service clearance the maker calls for, and anchor it. Cover any roof opening until the curb is set.',
          code_refs: [{ section: '304', note: 'Equipment installed per listing and the manufacturer\'s instructions' }, { section: '306', note: 'Access and service space for equipment' }],
          tools: ['crane, telehandler or forklift', 'tag lines', 'level', 'wrench set', 'hammer drill'],
          materials: ['condensing unit or compressor rack', 'vibration isolators', 'anchors or curb hardware'],
          safety_ids: ['struck_by_load', 'roof_edge'],
          qa_ids: ['unit_clearance'],
          gating_inspection_type: 'equipment_set',
        },
        {
          title: 'Set, level and join the cases; connect the drains',
          instruction: 'Roll cases into place on dollies or pallet jacks, never by hand-tipping. Level each case to the maker\'s tolerance, join line-ups with the joining kit and seal the joints. Run each case drain with its trap to an indirect waste receptor with an air gap — the plumber makes the final waste connection.',
          code_refs: [{ section: '307', note: 'Condensate disposal from evaporators' }, { section: '802', note: 'Indirect wastes — food-handling and refrigerated equipment drains', code_type: 'IPC' }],
          tools: ['case dollies or pallet jack', 'level', 'drill/driver', 'PVC saw'],
          materials: ['case joining kits and sealant', 'case drain traps and pipe', 'leveling shims'],
          safety_ids: ['case_tipping'],
          qa_ids: ['drains_trapped'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Run and braze the line sets under a nitrogen purge',
          instruction: 'Keep tube ends capped until you join them. Cut square, ream, and braze every joint with dry nitrogen flowing through the pipe so scale cannot form. Slope suction lines toward the compressor so oil returns, add traps only where the drawings show them, support the piping at close spacing and near every fitting, and insulate suction lines. Get a hot work permit and keep an extinguisher at the torch.',
          detail: 'Bend with a tube bender or use fittings — no kinked or flattened bends.',
          code_refs: [{ section: '1107', note: 'Refrigerant piping — materials, joints, location and support' }],
          tools: ['torch kit', 'nitrogen cylinder with regulator and flowmeter', 'tube cutter and reamer', 'tube bender', 'fire extinguisher'],
          materials: ['ACR copper tube and wrought fittings', 'brazing alloy', 'pipe hangers and clamps', 'suction-line insulation', 'filter drier and sight glass'],
          safety_ids: ['brazing_fire', 'cylinders', 'braze_fumes', 'aerial_lift'],
          qa_ids: ['nitrogen_braze', 'suction_slope'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Pressure-test the system with dry nitrogen',
          instruction: 'Isolate factory-charged parts and anything the test pressure could damage. Pressurize with dry nitrogen through a regulator with a relief valve — never connect a cylinder straight to the system. Bring it up in steps, soap every joint at the low stage, then hold the full test pressure from the drawings and record start and end readings with the temperature. Take a leaking joint apart and remake it; do not just reheat it. Test before any insulation or ceiling covers the joints.',
          code_refs: [{ section: '1108', note: 'Field test of refrigerant piping before the system is charged' }, { section: '15', note: 'Field pressure test — reference standard', code_type: 'ASHRAE' }],
          tools: ['nitrogen cylinder', 'regulator with relief valve', 'test gauge', 'soap or bubble solution', 'thermometer'],
          materials: ['dry nitrogen', 'test record form'],
          safety_ids: ['pressure_test', 'cylinders', 'asphyxiation'],
          qa_ids: ['pressure_test_held'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Evacuate to a deep vacuum and run a decay test',
          instruction: 'Release the test nitrogen, then pull the whole system down with a vacuum pump and large-bore hoses to the vacuum target in the spec or the maker\'s instructions, reading it on a micron gauge at the system — not at the pump. Valve the pump off and watch the gauge for the hold time. If it climbs past the limit, find the leak or keep evacuating until the moisture is gone. Record the readings.',
          detail: 'UFGS 23 23 00 example: pull to 300 microns and hold 1 hour without rising above 500 microns.',
          tools: ['vacuum pump', 'micron gauge', 'core removal tools', 'large-bore vacuum hoses'],
          materials: ['vacuum pump oil'],
          safety_ids: ['shock_lockout'],
          qa_ids: ['vacuum_decay'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Charge, leak-check and start up',
          instruction: 'Only an EPA 608 certified technician opens the refrigerant circuit and charges. Weigh in the charge on a scale per the maker, as liquid for blends, and finish to the sight glass, subcooling or superheat the maker gives. Leak-check every joint with an electronic detector, set controls and defrost, and confirm each case holds its design temperature. Install locking caps on outdoor access ports. Never vent refrigerant.',
          code_refs: [{ section: '1101.10', note: 'Locking access port caps on refrigerant circuits' }, { section: '440', note: 'Air-conditioning and refrigerating equipment — disconnects and circuit sizing', code_type: 'NEC' }],
          tools: ['charging scale', 'manifold or digital gauges', 'electronic leak detector', 'thermometers', 'recovery machine and cylinder'],
          materials: ['refrigerant per nameplate', 'locking access port caps'],
          safety_ids: ['frostbite', 'flammable_refrigerant', 'shock_lockout'],
          qa_ids: ['certified_tech', 'charge_weighed', 'leak_check_charged', 'case_temps', 'locking_caps'],
          gating_inspection_type: 'final',
        },
        {
          title: 'Leave the EPA 608 service records with the owner',
          instruction: 'Write down the refrigerant type, full charge, pounds added, the technician and certification number, and the leak-check results, and give the owner a copy. On systems with 50 lb or more of an ozone-depleting refrigerant, or 15 lb or more of an HFC from 2026, the owner must track the leak rate every time refrigerant is added and repair leaks over the trigger within 30 days — explain this at handover.',
          detail: 'Commercial refrigeration trigger is a 20% annual leak rate (40 CFR 82.157 for ODS appliances ≥50 lb; 40 CFR 84.106 for HFC appliances ≥15 lb from 2026-01-01).',
          tools: ['service log or app'],
          materials: ['charge label', 'service record form'],
          safety_ids: [],
          qa_ids: ['service_records', 'charge_recorded'],
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'ice_machine',
      example_title: 'Ice machine & bin installation',
      when: { title_re: ICE },
      priority: 10,
      steps: [
        {
          title: 'Set the ice machine head on its bin',
          instruction: 'Lift the head onto the bin with two people or a lift — heads are top-heavy. Seal it to the bin or dispenser with the adapter the maker supplies, level the bin on its legs, and keep the air clearance around an air-cooled head. Seal the bin to the floor or set it on legs as the health department requires.',
          code_refs: [{ section: '304', note: 'Equipment installed per listing and the manufacturer\'s instructions' }],
          tools: ['level', 'drill/driver', 'material lift'],
          materials: ['ice bin or dispenser', 'bin adapter kit', 'NSF sealant'],
          safety_ids: ['case_tipping'],
          
          gating_inspection_type: 'equipment_set',
        },
        {
          title: 'Connect water and drain through an air gap',
          instruction: 'Bring cold water to the unit with a shutoff valve, the filter the maker requires and backflow protection. Run the bin and machine drains separately, sloped, to an indirect waste receptor with an air gap — never hard-pipe them to a drain. Insulate drains that sweat.',
          code_refs: [{ section: '802', note: 'Indirect wastes — ice machine and bin drains through an air gap', code_type: 'IPC' }],
          tools: ['tube cutter', 'press or crimp tool', 'level'],
          materials: ['water shutoff valve', 'water filter assembly', 'drain pipe and fittings'],
          safety_ids: ['shock_lockout'],
          qa_ids: ['ice_air_gap'],
          gating_inspection_type: 'rough_in',
        },
        {
          title: 'Run the remote condenser lines (remote units only)',
          instruction: 'For a remote-condenser model use the maker\'s precharged line set or braze a field set under a nitrogen purge, then pressure-test with nitrogen and evacuate before opening the valves. Keep the line length and rise within the maker\'s limits.',
          code_refs: [{ section: '1108', note: 'Field test of refrigerant piping before charging' }],
          tools: ['torch kit', 'nitrogen regulator', 'vacuum pump', 'micron gauge'],
          materials: ['precharged or ACR line set', 'brazing alloy'],
          safety_ids: ['brazing_fire', 'pressure_test', 'cylinders'],
          qa_ids: ['nitrogen_braze', 'pressure_test_held', 'vacuum_decay'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Sanitize, start up and check the first harvest',
          instruction: 'With power on its own disconnect, sanitize the water system per the maker, start the machine, and throw away the first batches of ice. Confirm the harvest cycle, bin-full shutoff and that the drains run clear. Leave the cleaning schedule with the owner.',
          code_refs: [{ section: '440', note: 'Refrigerating equipment — disconnecting means', code_type: 'NEC' }],
          tools: ['multimeter', 'sanitizer test strips'],
          materials: ['ice machine sanitizer and cleaner'],
          safety_ids: ['shock_lockout'],
          
          gating_inspection_type: 'final',
        },
      ],
    },
    {
      id: 'refrigeration_test_charge',
      example_title: 'Refrigeration leak test, evacuation & startup',
      when: { title_re: TEST },
      priority: 20,
      steps: [
        {
          title: 'Pressure-test with dry nitrogen and record',
          instruction: 'Isolate factory-charged parts, pressurize through a regulator with a relief valve, soap joints at the low stage, then hold the full test pressure and log start, end and temperature. Remake any leaking joint and retest.',
          code_refs: [{ section: '1108', note: 'Field test of refrigerant piping before charging' }],
          tools: ['nitrogen cylinder', 'regulator with relief valve', 'test gauge', 'bubble solution'],
          materials: ['dry nitrogen', 'test record form'],
          safety_ids: ['pressure_test', 'cylinders', 'asphyxiation'],
          qa_ids: ['pressure_test_held'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Evacuate and hold the vacuum',
          instruction: 'Pull the system to the spec vacuum target on a micron gauge at the system, valve off and watch the hold time; repeat until it holds. Record the readings.',
          tools: ['vacuum pump', 'micron gauge', 'core removal tools'],
          materials: ['vacuum pump oil'],
          safety_ids: ['shock_lockout'],
          qa_ids: ['vacuum_decay'],
          gating_inspection_type: 'gas_refrigerant_test',
        },
        {
          title: 'Weigh in the charge, leak-check and start up',
          instruction: 'A certified technician weighs in the nameplate charge, leak-checks every joint electronically, sets controls and defrost, confirms case temperatures and installs locking caps. Record the charge and give the owner the service record.',
          code_refs: [{ section: '1101.10', note: 'Locking access port caps on refrigerant circuits' }],
          tools: ['charging scale', 'gauges', 'electronic leak detector', 'recovery machine'],
          materials: ['refrigerant per nameplate', 'locking access port caps'],
          safety_ids: ['frostbite', 'flammable_refrigerant'],
          qa_ids: ['certified_tech', 'charge_weighed', 'leak_check_charged', 'service_records'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '1107', note: 'Refrigerant piping — materials, joints, location and support', prov: icc },
      { section: '307', note: 'Condensate disposal from evaporators', prov: icc },
      { section: '802', note: 'Indirect wastes for refrigerated equipment and ice machines', code_type: 'IPC', prov: icc },
    ],
    equipment_set: [
      { section: '1105', note: 'Machinery room — when required and general requirements', prov: icc },
      { section: '306', note: 'Access and service space for equipment', prov: icc },
    ],
    gas_refrigerant_test: [
      { section: '1108', note: 'Field test of refrigerant-containing piping before charging', prov: icc },
      { section: '15', note: 'Safety standard for refrigeration systems — field test topic', code_type: 'ASHRAE', prov: { src: ['refrigeration-ashrae-15'], confidence: 'verified', last_verified: D } },
    ],
    final: [
      { section: '1101.10', note: 'Locking access port caps', prov: icc },
      { section: '440', note: 'Air-conditioning and refrigerating equipment', code_type: 'NEC', prov: nfpa },
    ],
  },
  equipment: [
    { when: { title_re: UNITS }, type: 'crane', reason: 'Set rooftop condensing units or compressor racks', optional: true },
    { when: { title_re: `${UNITS}|${CASES}` }, type: 'forklift', reason: 'Move and place display cases, racks and ground-mounted condensing units', optional: true },
    { when: { title_re: TITLE, building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Run and support line sets overhead in sales floors and back rooms', optional: true },
  ],
  hazards: [
    { id: 'brazing_fire', hazard: 'Fire from the brazing torch on line sets near case insulation, ceilings and stocked stores', hazard_es: PENDING_ES, controls: ['Get a hot work permit; move or shield combustibles and heat-shield behind the joint', 'Keep a charged extinguisher at the torch and post a fire watch during and after brazing'], controls_es: PENDING_ES, osha_ref: '1926.352(e)', severity: 4, ppe: ['brazing goggles', 'leather gloves'], prov: osha('j', 'Also 1926.352(a)-(d): move or protect fire hazards; extinguisher at hand.') },
    { id: 'cylinders', hazard: 'Nitrogen, oxy-fuel or refrigerant cylinder knocked over, valve sheared, or over-pressurizing a system', hazard_es: PENDING_ES, controls: ['Secure cylinders upright in a cart or chained, caps on when moving', 'Always use a pressure regulator on nitrogen; never connect a full cylinder straight to piping'], controls_es: PENDING_ES, osha_ref: '1926.350(a)(9)', severity: 4, prov: osha('j') },
    { id: 'braze_fumes', hazard: 'Breathing brazing fumes and decomposed refrigerant/flux vapors in back rooms and above ceilings', hazard_es: PENDING_ES, controls: ['Ventilate the work area or use local exhaust when brazing indoors', 'Recover all refrigerant before heating a joint — heated refrigerant breaks down into toxic gases'], controls_es: PENDING_ES, osha_ref: '1926.353(a)(3)', severity: 3, ppe: ['respirator as needed'], prov: osha('j') },
    { id: 'pressure_test', hazard: 'Pipe, fitting or gauge bursting during the nitrogen pressure test', hazard_es: PENDING_ES, controls: ['Isolate components not rated for the test pressure; raise pressure in steps with a relief valve set at the test limit', 'Keep people out of line with caps and fittings while the system is at test pressure'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, ppe: ['safety glasses'], prov: osha('c', 'General hazard-training duty; no construction-specific pneumatic test rule in 1926.') },
    { id: 'asphyxiation', hazard: 'Oxygen displaced by nitrogen or leaking refrigerant in machinery rooms, basements, case pits or walk-ins', hazard_es: PENDING_ES, controls: ['Ventilate low and enclosed spaces when venting test nitrogen or after a refrigerant leak', 'Check the oxygen level with a monitor before entering a space where a large leak occurred'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 4, prov: { src: ['ecfr-1926-d', 'refrigeration-epa-snap-safety'], confidence: 'derived', last_verified: D, note: 'Exposure limits for listed refrigerants (Subpart D); EPA lists asphyxiation among refrigerant risks. Confined spaces: 1926.1203(a).' } },
    { id: 'frostbite', hazard: 'Frostbite to hands and eyes from liquid refrigerant when connecting hoses or charging', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles and insulated gloves when connecting and charging', 'Use low-loss fittings and point hose ends away from people'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['safety glasses or goggles', 'insulated gloves'], prov: osha('e', 'Also 1926.95(a) protective equipment for chemical hazards.') },
    { id: 'flammable_refrigerant', hazard: 'Fire from A2L or A3 (propane) refrigerant meeting a flame or spark during service', hazard_es: PENDING_ES, controls: ['Check the refrigerant safety group on the nameplate before any work', 'Ventilate, use a leak detector rated for the refrigerant, and keep ignition sources away until the circuit is recovered'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(5)', severity: 4, prov: { src: ['ecfr-1926-c', 'refrigeration-epa-snap-safety'], confidence: 'derived', last_verified: D, note: 'Training duty for handling flammable gases; EPA lists flammability among refrigerant risks.' } },
    { id: 'shock_lockout', hazard: 'Shock or unexpected start while wiring or servicing compressors, fans and case heaters', hazard_es: PENDING_ES, controls: ['De-energize, lock and tag the disconnect before opening panels or connecting a vacuum pump to unit power', 'Verify zero voltage; capacitors can hold a charge'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'struck_by_load', hazard: 'Struck or crushed by a condensing unit or rack being lifted', hazard_es: PENDING_ES, controls: ['Use tag lines and stay out of the fall zone of a suspended load', 'Use the maker\'s lifting points and a rated rigging'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'gloves'], prov: osha('cc') },
    { id: 'roof_edge', hazard: 'Fall from the roof edge while setting rooftop condensing units', hazard_es: PENDING_ES, controls: ['Use guardrails, personal fall arrest, or a warning line with a monitor on low-slope roofs', 'Plan the landing zone away from the edge'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(10)', severity: 4, ppe: ['harness + lanyard where required'], prov: osha('m') },
    { id: 'aerial_lift', hazard: 'Falling from a lift or ladder while running line sets overhead', hazard_es: PENDING_ES, controls: ['Tie off to the anchor in boom-lift baskets; stay on the platform floor', 'Extend ladders 3 ft above the landing and keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 3, ppe: ['harness + lanyard in boom lifts'], prov: osha('l', 'Ladders: 1926.1053(b)(1) (Subpart X).') },
    { id: 'case_tipping', hazard: 'Crushed or strained by a tall display case or ice machine head tipping during moving and setting', hazard_es: PENDING_ES, controls: ['Move cases on dollies or pallet jacks with enough people; never walk a tall case by hand', 'Keep feet and hands clear when lowering onto legs or joining line-ups'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, ppe: ['safety-toe boots', 'gloves'], prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'schedule_match', item: 'Delivered cases, condensing units and ice machines match the approved schedule: model, voltage, refrigerant type and charge.', item_es: tr('Las vitrinas, unidades condensadoras y máquinas de hielo entregadas coinciden con el listado aprobado: modelo, voltaje, tipo de refrigerante y carga.'), prov: ufgs },
    { id: 'charge_recorded', item: 'Full refrigerant charge per system recorded, and a flag raised if a system holds 50 lb or more (ODS) or 15 lb or more (HFC).', item_es: tr('Carga total de refrigerante por sistema registrada, con aviso si un sistema tiene 50 lb o más (SAO) o 15 lb o más (HFC).'), prov: leak },
    { id: 'unit_clearance', phase: 'rough_in', item: 'Condensing unit or rack level, anchored, on isolators, with the airflow and service clearance the maker requires.', item_es: tr('Unidad condensadora o rack a nivel, anclada, sobre aisladores, con el espacio de aire y de servicio que pide el fabricante.'), prov: icc },
    { id: 'drains_trapped', phase: 'rough_in', item: 'Every case drain trapped and run to an indirect waste receptor with an air gap; no direct connection to the sanitary drain.', item_es: tr('Cada drenaje de vitrina con trampa y llevado a un receptor de desagüe indirecto con espacio de aire; sin conexión directa al drenaje sanitario.'), prov: icc },
    { id: 'nitrogen_braze', phase: 'rough_in', item: 'All brazed joints made with a nitrogen purge flowing; no flux on copper-to-copper joints; excess filler removed.', item_es: tr('Todas las uniones soldadas con purga de nitrógeno corriendo; sin fundente en uniones cobre con cobre; exceso de aporte retirado.'), prov: ufgs },
    { id: 'suction_slope', phase: 'rough_in', item: 'Horizontal suction lines slope toward the compressor for oil return; no unplanned oil traps or sags.', item_es: tr('Líneas de succión horizontales con pendiente hacia el compresor para el retorno de aceite; sin trampas ni columpios no previstos.'), prov: ufgs },
    { id: 'pressure_test_held', phase: 'inspections', item: 'Dry nitrogen standing test held at the design test pressure for the spec duration with no drop beyond temperature correction; record signed.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'vacuum_decay', phase: 'inspections', item: 'System evacuated to the spec vacuum on a micron gauge at the system and held through the decay period; readings recorded.', item_es: tr('Sistema evacuado al vacío de la especificación con vacuómetro en el sistema y sostenido durante la prueba de caída; lecturas registradas.'), prov: ufgs },
    { id: 'certified_tech', item: 'Every person who opened the refrigerant circuit or charged it holds a current EPA 608 certification of the right type; card numbers on file.', item_es: tr('Toda persona que abrió o cargó el circuito de refrigerante tiene certificación EPA 608 vigente del tipo correcto; números de credencial archivados.'), prov: { src: ['refrigeration-ecfr-40-82f', 'refrigeration-epa-608-tech-cert'], confidence: 'verified', last_verified: D, note: '40 CFR 82.161(a).' } },
    { id: 'charge_weighed', phase: 'commissioning', item: 'Refrigerant weighed in on a scale to the nameplate charge and finished to the maker\'s subcooling or superheat target.', item_es: tr('Refrigerante pesado con báscula hasta la carga de placa y ajustado al subenfriamiento o sobrecalentamiento del fabricante.'), prov: ufgs },
    { id: 'leak_check_charged', phase: 'commissioning', item: 'All joints leak-checked with an electronic detector after charging; no refrigerant vented at any stage.', item_es: PENDING_ES, safety: true, prov: { src: ['hvac-ufgs-23-23-00', 'refrigeration-ecfr-40-82f'], confidence: 'verified', last_verified: D } },
    { id: 'case_temps', phase: 'commissioning', item: 'Each case reaches and holds its design temperature through a defrost cycle; controls and alarms set.', item_es: tr('Cada vitrina alcanza y mantiene su temperatura de diseño durante un ciclo de deshielo; controles y alarmas ajustados.'), prov: ufgs },
    { id: 'locking_caps', phase: 'commissioning', item: 'Locking access port caps installed on outdoor refrigerant service ports.', item_es: PENDING_ES, safety: true, prov: icc },
    { id: 'service_records', item: 'Owner received the service record: refrigerant, full charge, pounds added, technician and certification, leak-check results, and the leak-rate tracking duty explained.', item_es: tr('El dueño recibió el registro de servicio: refrigerante, carga total, libras agregadas, técnico y certificación, resultados de fugas, y se le explicó la obligación de calcular la tasa de fuga.'), prov: leak },
    { id: 'ice_air_gap', phase: 'rough_in', item: 'Ice machine and bin drains run separately to an indirect waste receptor with an air gap; water line has shutoff, filter and backflow protection.', item_es: tr('Drenajes de la máquina y del depósito llevados por separado a un receptor indirecto con espacio de aire; línea de agua con llave de paso, filtro y protección contra reflujo.'), prov: icc },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Refrigerant piping supported, protected and with joints exposed for the test', item_es: PENDING_ES, ref: '1107' },
      { item: 'Case and ice machine drains trapped and discharging through air gaps to indirect waste', item_es: PENDING_ES, ref: 'IPC 802' },
    ],
    equipment_set: [
      { item: 'Condensing units and racks anchored with service clearance; machinery room provided where the charge requires it', item_es: PENDING_ES, ref: '1105' },
    ],
    gas_refrigerant_test: [
      { item: 'Nitrogen pressure test witnessed or documented before insulation or ceilings cover joints', item_es: PENDING_ES, ref: '1108' },
      { item: 'Evacuation and decay readings on file before charging', item_es: PENDING_ES, ref: 'UFGS 23 23 00' },
    ],
    final: [
      { item: 'Locking caps on outdoor service ports; disconnects within sight of units', item_es: PENDING_ES, ref: '1101.10 / NEC 440' },
      { item: 'EPA 608 technician certification and charge records provided to the owner', item_es: PENDING_ES, ref: '40 CFR 82.161' },
    ],
  },
  assemblies: [
    { code: 'M-REF-COND-UNIT-EA', name: 'Remote air-cooled refrigeration condensing unit ≈3–5 HP, set on pad or curb with isolators', name_es: 'Unidad condensadora remota enfriada por aire ≈3–5 HP, colocada sobre base o bastidor con aisladores', unit: 'EA', csi: '23 62 00',
      description: 'Unit, isolators and setting; line sets, power and charge priced separately.',
      material_cost_cents: { v: 650000, prov: est('commercial remote condensing unit, national baseline 2026') }, labor_hours_per_unit: { v: 10, prov: est('rig, set, level, anchor, connect lines at unit') },
      equipment_cost_cents: { v: 60000, prov: est('telehandler or crane share for the lift') }, waste_pct: { v: 0, prov: est('factory unit') } },
    { code: 'M-REF-CASE-EA', name: 'Remote refrigerated display or reach-in case ≈8 ft, set, leveled, joined, drain and lines connected', name_es: 'Vitrina refrigerada remota o reach-in ≈8 pies, colocada, nivelada, unida, con drenaje y líneas conectados', unit: 'EA', csi: '23 62 00',
      material_cost_cents: { v: 950000, prov: est('8 ft multi-deck or reach-in remote case, national baseline 2026') }, labor_hours_per_unit: { v: 8, prov: est('move, level, join, connect drain and line set at case') },
      equipment_cost_cents: { v: 2500, prov: est('case dollies / pallet jack share') }, waste_pct: { v: 0, prov: est('factory unit') } },
    { code: 'M-REF-LEAK-TEST-EA', name: 'Refrigeration system nitrogen pressure / standing test with report', name_es: 'Prueba de presión sostenida con nitrógeno del sistema de refrigeración, con reporte', unit: 'EA', csi: '23 23 00',
      material_cost_cents: { v: 6000, prov: est('dry nitrogen cylinder use per system') }, labor_hours_per_unit: { v: 3, prov: est('isolate, staged pressurize, soap joints, log hold') },
      equipment_cost_cents: { v: 1500, prov: est('regulator, gauges share') }, waste_pct: { v: 0, prov: est('labor item') } },
    { code: 'M-REF-EVAC-CHARGE-EA', name: 'Evacuation, weighed-in charge and startup per refrigeration circuit (≈20 lb refrigerant allowance)', name_es: 'Vacío, carga pesada y arranque por circuito de refrigeración (≈20 lb de refrigerante incluidas)', unit: 'EA', csi: '23 23 00',
      description: 'Includes refrigerant allowance; adjust for actual charge and refrigerant price.',
      material_cost_cents: { v: 40000, prov: est('≈20 lb HFC/HFO blend allowance, 2026 spot pricing varies widely') }, labor_hours_per_unit: { v: 6, prov: est('evacuate, decay test, weigh in, leak check, set controls') },
      equipment_cost_cents: { v: 3000, prov: est('vacuum pump, micron gauge, scale, leak detector share') }, waste_pct: { v: 0, prov: est('weighed charge') } },
    { code: 'M-REF-ICE-MACHINE-EA', name: 'Modular ice machine head and bin ≈500 lb/day, set, water and air-gap drain connected, started', name_es: 'Máquina de hielo modular con depósito ≈500 lb/día, colocada, con agua y drenaje con espacio de aire, arrancada', unit: 'EA', csi: '11 40 00',
      material_cost_cents: { v: 700000, prov: est('air-cooled modular head + bin + filter, national baseline 2026') }, labor_hours_per_unit: { v: 6, prov: est('set head on bin, connect water/drains, sanitize, start up') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('factory unit') } },
  ],
  quantity_rules: [
    { code: 'M-REF-COND-UNIT-EA', assumption: 'One remote condensing unit for a small commercial refrigeration scope — replace with the equipment schedule', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'M-REF-CASE-EA', assumption: 'Two remote cases for a small commercial refrigeration scope — replace with the case schedule', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'M-REFRIG-LINE-LF', assumption: 'About 50 LF of line set from cases to the condensing unit — replace with the piping takeoff', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 50 } },
    { code: 'M-REF-LEAK-TEST-EA', assumption: 'One nitrogen pressure test per field-piped refrigeration system', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'M-REF-EVAC-CHARGE-EA', assumption: 'One evacuation, charge and startup per refrigeration circuit', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['concrete', 'roofing'], note: 'Condensing unit pads and roof curbs in place before units are set.' },
    { before_phase: 'drywall', note: 'Refrigerant piping pressure-tested before insulation, ceilings or walls cover the joints.' },
  ],
});
