// Trade Knowledge Pack — hvac (HVAC / Mechanical). Wave 02, COMPLEMENT pattern: the family hand
// recipe in task-buildout/mechanical.ts keeps producing the phase-keyed work steps (rough ductwork &
// line sets → set equipment → pressure-test → start up & verify); this pack adds glossary, hazards,
// QA, inspection checklists, extra code refs, equipment hints and the assemblies the M- catalog lacks
// (heat-pump split, condensate pump, overflow switch, ERV/HRV, startup & commissioning).
// Focus: residential + light-commercial forced-air furnaces, heat pumps, split AC and mini-splits.
// Dossier: docs/trade-packs/dossiers/hvac.md. Sources: UFGS 23 81 00 / 23 23 00, ENERGY STAR HVAC
// Design Report + Commissioning Checklist (Rev 14), DOE BASC HIE checklists + mini-split code brief,
// EPA Section 608 / 40 CFR 82 Subpart F, ACCA manuals (ref), IMC / IRC / IECC (ref),
// 29 CFR 1926 Subparts D, E, J, K, M, X, CC.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string) => v([sub === 'j' ? 'ecfr-1926-j' : `ecfr-1926-${sub}`]);
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const icc = v(['icc-pa']);
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'hvac',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Heating, cooling and ventilation equipment for homes and light commercial buildings: furnaces, heat pumps, split air conditioners, ductless mini-splits and rooftop units — sized from a load calculation, set, piped, vented, charged and started up.',
    summary_es: 'Equipos de calefacción, enfriamiento y ventilación para viviendas y comercios ligeros: calefactores, bombas de calor, aires acondicionados divididos, minisplits sin ductos y unidades de techo — dimensionados con un cálculo de cargas, colocados, conectados, ventilados, cargados y puestos en marcha.',
    glossary: [
      { term: 'Load calculation (Manual J)', term_es: 'Cálculo de cargas (Manual J)', def: 'Room-by-room estimate of how much heating and cooling the house needs; equipment is picked from it.', def_es: 'Estimación cuarto por cuarto de cuánta calefacción y enfriamiento necesita la casa; el equipo se escoge con ella.' },
      { term: 'Line set', term_es: 'Juego de líneas de refrigerante', def: 'The pair of copper refrigerant lines (suction and liquid) that connect the outdoor unit to the indoor coil.', def_es: 'Par de tubos de cobre de refrigerante (succión y líquido) que unen la unidad exterior con el serpentín interior.' },
      { term: 'Superheat / subcooling', term_es: 'Sobrecalentamiento / subenfriamiento', def: 'Temperature readings used to check the refrigerant charge against the manufacturer target.', def_es: 'Lecturas de temperatura que sirven para revisar la carga de refrigerante contra la meta del fabricante.' },
      { term: 'Evacuation', term_es: 'Evacuación (vacío)', def: 'Pulling a deep vacuum on new refrigerant piping to remove air and moisture before charging.', def_es: 'Hacer un vacío profundo en la tubería nueva de refrigerante para sacar aire y humedad antes de cargar.' },
      { term: 'Condensate', term_es: 'Condensado', def: 'Water the cooling coil (and high-efficiency furnace) drips; it must be trapped and drained to an approved place.', def_es: 'Agua que escurre del serpentín de enfriamiento (y del calefactor de alta eficiencia); debe llevar trampa y drenarse a un lugar aprobado.' },
      { term: 'Secondary drain pan / float switch', term_es: 'Charola secundaria / interruptor de flotador', def: 'Backup pan and a switch that shuts the unit off if the main condensate drain clogs.', def_es: 'Charola de respaldo y un interruptor que apaga el equipo si se tapa el drenaje principal de condensado.' },
      { term: 'Static pressure', term_es: 'Presión estática', def: 'Resistance the blower pushes against in the duct system; measured to confirm airflow.', def_es: 'Resistencia contra la que empuja el ventilador en los ductos; se mide para confirmar el flujo de aire.' },
      { term: 'Combustion air', term_es: 'Aire de combustión', def: 'Outside or room air a gas furnace needs to burn safely; supplied by openings or a sealed intake pipe.', def_es: 'Aire exterior o del cuarto que necesita un calefactor de gas para quemar con seguridad; llega por aberturas o un tubo de admisión sellado.' },
      { term: 'ERV / HRV', term_es: 'ERV / HRV (ventilador recuperador)', def: 'Balanced ventilator that brings in fresh air and recovers heat (HRV) or heat and moisture (ERV) from exhaust air.', def_es: 'Ventilador balanceado que mete aire fresco y recupera el calor (HRV) o el calor y la humedad (ERV) del aire que sale.' },
      { term: 'EPA 608 certification', term_es: 'Certificación EPA 608', def: 'Federal technician certification required to open refrigerant circuits or buy most refrigerants.', def_es: 'Certificación federal de técnico necesaria para abrir circuitos de refrigerante o comprar la mayoría de los refrigerantes.' },
    ],
  },
  est_bucket: 'mechanical',
  recipes: [],
  code_refs: {
    rough_in: [
      { section: '312', note: 'Heating and cooling load calculations for system sizing', prov: icc },
      { section: '603', note: 'Duct construction and installation', prov: icc },
      { section: '1107', note: 'Refrigerant piping — materials, joints, protection', prov: v(['icc-pa'], 'IMC Ch. 11 numbering; confirm against the adopted edition.') },
    ],
    equipment_set: [
      { section: '304', note: 'Equipment installed per listing and manufacturer instructions', prov: icc },
      { section: '306', note: 'Access and working space for service of equipment', prov: icc },
      { section: '307', note: 'Condensate disposal, traps and auxiliary drain protection', prov: icc },
      { section: 'M1411.3', note: 'Cooling coil condensate conveyed to an approved place', code_type: 'IRC', prov: v(['icc-pa', 'hvac-basc-minisplit-brief'], 'Section cited in the DOE BASC mini-split code brief.') },
      { section: 'R403.7', note: 'Equipment sized to the load calculation (Manual S/J)', code_type: 'IECC', prov: v(['icc-pa', 'hvac-basc-minisplit-brief'], 'Section number varies by IECC edition; BASC brief cites the sizing provision.') },
    ],
    gas_refrigerant_test: [
      { section: '1108', note: 'Field pressure test of refrigerant piping before charging', prov: v(['icc-pa'], 'IMC Ch. 11 numbering; confirm against the adopted edition.') },
      { section: 'M1411.6', note: 'Locking caps on outdoor refrigerant access ports', code_type: 'IRC', prov: v(['icc-pa', 'hvac-basc-minisplit-brief']) },
    ],
    final: [
      { section: '701', note: 'Combustion air for fuel-burning appliances', prov: icc },
      { section: '801', note: 'Chimneys and vents — general venting rules', prov: icc },
    ],
  },
  equipment: [
    { when: { title_re: 'vav|diffuser|grille|ductwork|air handler|ahu', building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Reach ceiling-mounted ducts, VAV boxes and diffusers above open floors', optional: true },
    { when: { title_re: 'rooftop|rtu|condenser|heat pump|equipment set', building_types: ['residential_mf'] }, type: 'telehandler', reason: 'Lift condensers or rooftop units onto roofs and pads of multifamily buildings', optional: true },
  ],
  hazards: [
    { id: 'refrigerant_contact', hazard: 'Frostbite and eye injury from liquid refrigerant spraying out of hoses, valves or a cut line', hazard_es: PENDING_ES, controls: ['Wear safety glasses or goggles and insulated gloves when connecting gauges or recovering refrigerant', 'Recover refrigerant with certified equipment before opening a circuit; never vent it'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['safety goggles', 'insulated gloves'], prov: v(['ecfr-1926-e', 'hvac-epa-608', 'hvac-ecfr-40-82f'], 'Eye/face PPE per 1926.102; venting prohibition and technician certification per EPA Section 608 / 40 CFR 82 Subpart F.') },
    { id: 'brazing_fire', hazard: 'Fire from brazing torches near wood framing, insulation or dust in attics, walls and closets', hazard_es: PENDING_ES, controls: ['Move or shield combustibles and use a heat shield behind the joint', 'Keep a charged fire extinguisher at the brazing spot and check the area after work'], controls_es: PENDING_ES, osha_ref: '1926.352(d)', severity: 4, ppe: ['shade goggles', 'leather gloves'], prov: osha('j') },
    { id: 'gas_cylinders', hazard: 'Falling or damaged oxy-fuel, nitrogen or refrigerant cylinders', hazard_es: PENDING_ES, controls: ['Secure cylinders upright in a cart or chained', 'Use a pressure regulator on nitrogen; never connect a full cylinder straight to piping'], controls_es: PENDING_ES, osha_ref: '1926.350(a)(9)', severity: 3, prov: osha('j') },
    { id: 'electric_shock', hazard: 'Electric shock from live disconnects, capacitors and control wiring at the unit', hazard_es: PENDING_ES, controls: ['Open and verify the disconnect before touching wiring; discharge capacitors', 'Work energized only for testing, with insulated meters and gloves'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, ppe: ['insulated gloves'], prov: osha('k') },
    { id: 'lockout', hazard: 'Unit restarted by someone else while a worker is inside it', hazard_es: PENDING_ES, controls: ['Tag the disconnect and breaker at every point the unit can be energized', 'Lock the disconnect where it accepts a lock'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'roof_edge', hazard: 'Fall from a roof edge while setting or servicing rooftop units and condensers', hazard_es: PENDING_ES, controls: ['Use guardrails, a warning line plus monitor where allowed, or personal fall arrest at 6 ft or more', 'Plan the crane or hoist lift so no one works at the edge during the pick'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness and lanyard when required'], prov: osha('m') },
    { id: 'attic_fall', hazard: 'Stepping between attic joists and falling through the ceiling', hazard_es: PENDING_ES, controls: ['Lay walk boards across joists to the equipment', 'Light the attic path and keep it clear of insulation drifts'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(ii)', severity: 3, prov: v(['ecfr-1926-m'], 'Applied by analogy: open joist bays treated as holes a worker can step through.') },
    { id: 'ladder', hazard: 'Ladder falls reaching attic hatches, high walls for mini-split heads or roof access', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above the landing and secure the top', 'Never carry equipment up a ladder by hand — hoist it'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'crane_pick', hazard: 'Struck by a rooftop unit or condenser being lifted by crane', hazard_es: PENDING_ES, controls: ['Keep everyone out of the fall zone except those hooking or guiding the load', 'Use tag lines and a qualified rigger and signal person'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat'], prov: osha('cc') },
    { id: 'manual_lifting', hazard: 'Back strain or crushed hands when carrying condensers and furnaces', hazard_es: PENDING_ES, controls: ['Use an appliance dolly or two-person lift', 'Plan the path and set-down spot before lifting'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 2, ppe: ['work gloves'], prov: v(['ecfr-1926-c'], 'General hazard-training duty; 1926 has no manual-lifting standard.') },
    { id: 'carbon_monoxide', hazard: 'Carbon monoxide exposure from a gas furnace or water heater with a blocked or disconnected vent during startup and testing', hazard_es: PENDING_ES, controls: ['Confirm the vent is connected and clear before firing the appliance', 'Run a CO monitor while doing combustion testing'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 4, ppe: ['personal CO monitor'], prov: v(['ecfr-1926-d', 'hvac-basc-combustion']) },
    { id: 'sheet_metal_cuts', hazard: 'Cuts from sheet-metal plenums, duct edges and coil fins', hazard_es: PENDING_ES, controls: ['Wear cut-resistant gloves and sleeves when handling duct and plenums', 'Deburr or hem cut edges'], controls_es: PENDING_ES, osha_ref: '1926.95(a)', severity: 2, ppe: ['cut-resistant gloves'], prov: osha('e') },
  ],
  qa_checklist: [
    { id: 'load_calc_on_file', phase: 'rough_in', item: 'A room-by-room load calculation and equipment selection are on file for the house and match the equipment actually delivered.', item_es: tr('Hay en archivo un cálculo de cargas cuarto por cuarto y la selección del equipo, y coinciden con el equipo realmente entregado.'), prov: v(['hvac-es-design-report', 'hvac-basc-hp-replace', 'hvac-acca-manuals']) },
    { id: 'clearances_access', phase: 'rough_in', item: 'Equipment has the service clearance, access opening and level platform the manufacturer and plans require; filter is easy to reach.', item_es: tr('El equipo tiene el espacio de servicio, la abertura de acceso y la plataforma nivelada que piden el fabricante y los planos; el filtro se alcanza fácilmente.'), prov: v(['hvac-ufgs-23-81-00', 'icc-pa']) },
    { id: 'nitrogen_braze', phase: 'rough_in', item: 'Refrigerant joints brazed with a nitrogen purge flowing; joints clean and free of excess filler.', item_es: tr('Uniones de refrigerante soldadas con purga de nitrógeno corriendo; uniones limpias y sin exceso de material de aporte.'), prov: v(['hvac-ufgs-23-23-00'], '3.2.3.2 brazed connections.') },
    { id: 'line_set_insulated', phase: 'rough_in', item: 'Suction line insulated its full length, with joints sealed and outdoor insulation protected from UV.', item_es: tr('Línea de succión aislada en todo su largo, con uniones selladas y el aislamiento exterior protegido contra rayos UV.'), prov: v(['hvac-basc-minisplit-brief', 'hvac-ufgs-23-23-00']) },
    { id: 'pressure_test_vacuum', phase: 'rough_in', item: 'New refrigerant piping held a nitrogen pressure test and was evacuated to the manufacturer vacuum target before charging; readings recorded.', item_es: tr('La tubería nueva de refrigerante sostuvo la prueba de presión con nitrógeno y se evacuó hasta la meta de vacío del fabricante antes de cargar; lecturas registradas.'), prov: v(['hvac-ufgs-23-23-00', 'hvac-ufgs-23-81-00']) },
    { id: 'charge_verified', phase: 'commissioning', item: 'Refrigerant charge verified by subcooling (TXV) or superheat (fixed orifice) against the manufacturer target, with readings on the commissioning sheet.', item_es: tr('Carga de refrigerante verificada por subenfriamiento (TXV) o sobrecalentamiento (orificio fijo) contra la meta del fabricante, con lecturas en la hoja de puesta en marcha.'), prov: v(['hvac-es-commissioning', 'hvac-basc-hp-replace']) },
    { id: 'airflow_measured', phase: 'commissioning', item: 'Airflow across the coil and total static pressure measured and within the manufacturer range; rooms balanced to design.', item_es: tr('Flujo de aire en el serpentín y presión estática total medidos y dentro del rango del fabricante; cuartos balanceados según el diseño.'), prov: v(['hvac-es-commissioning', 'hvac-basc-furnace-replace']) },
    { id: 'condensate_trap', phase: 'rough_in', item: 'Condensate drain trapped where the manufacturer requires, sloped to drain, and ending at an approved location — not on a walkway or foundation.', item_es: tr('Drenaje de condensado con trampa donde lo pide el fabricante, con pendiente para drenar y terminando en un lugar aprobado — no sobre un andador ni la cimentación.'), prov: v(['hvac-basc-minisplit-brief', 'icc-pa']) },
    { id: 'overflow_protection', phase: 'rough_in', item: 'Coil above or in finished space has a secondary pan or overflow float switch that shuts the unit off; switch tested by tripping it.', item_es: tr('Serpentín sobre o dentro de un espacio terminado tiene charola secundaria o interruptor de flotador que apaga el equipo; interruptor probado activándolo.'), prov: v(['icc-pa', 'hvac-basc-minisplit-brief']) },
    { id: 'vent_combustion_air', phase: 'commissioning', item: 'Gas appliance vent connected, sloped and supported with listed clearances to combustibles; combustion air openings or intake pipe as designed.', item_es: PENDING_ES, safety: true, prov: v(['hvac-basc-combustion', 'hvac-basc-furnace-replace', 'icc-pa']) },
    { id: 'co_alarm_present', phase: 'commissioning', item: 'Carbon monoxide alarm installed where the plans require for a home with fuel-burning appliances or an attached garage.', item_es: PENDING_ES, safety: true, prov: v(['hvac-basc-combustion', 'icc-pa']) },
    { id: 'gas_leak_check', phase: 'commissioning', item: 'Gas connection at the appliance leak-checked with solution or detector after lighting; no leaks.', item_es: PENDING_ES, safety: true, prov: v(['hvac-basc-furnace-replace']) },
    { id: 'locking_caps', phase: 'commissioning', item: 'Outdoor refrigerant service ports fitted with locking tamper-resistant caps.', item_es: tr('Puertos de servicio de refrigerante exteriores con tapas con seguro a prueba de manipulación.'), prov: v(['hvac-basc-minisplit-brief']) },
    { id: 'filter_thermostat', phase: 'commissioning', item: 'MERV 8 or better filter installed with a gasketed access door; thermostat on an interior wall away from supply registers and sunlight, all stages tested.', item_es: tr('Filtro MERV 8 o mejor instalado con puerta de acceso con empaque; termostato en muro interior lejos de rejillas de suministro y del sol, todas las etapas probadas.'), prov: v(['hvac-basc-furnace-replace', 'hvac-basc-hp-replace']) },
    { id: 'no_venting_refrigerant', item: 'Refrigerant recovered, never vented, by an EPA 608-certified technician; recovery cylinder and leak repairs logged.', item_es: tr('Refrigerante recuperado, nunca liberado al aire, por un técnico certificado EPA 608; cilindro de recuperación y reparaciones de fugas registrados.'), prov: v(['hvac-epa-608', 'hvac-ecfr-40-82f', 'hvac-ufgs-23-81-00']) },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Load calculation and equipment selection submitted and match the plans', item_es: PENDING_ES, ref: '312' },
      { item: 'Ducts supported, sealed and clear of combustibles where required', item_es: PENDING_ES, ref: '603' },
      { item: 'Refrigerant lines protected, supported and insulated; wall penetrations sealed', item_es: PENDING_ES, ref: '1107' },
      { item: 'Vent and combustion-air routes roughed in per plan', item_es: PENDING_ES, ref: '801' },
    ],
    equipment_set: [
      { item: 'Equipment type and size match the approved selection; nameplate visible', item_es: PENDING_ES, ref: '304' },
      { item: 'Service access, working space and attic/platform path provided', item_es: PENDING_ES, ref: '306' },
      { item: 'Condensate trapped and drained to an approved place; overflow protection in place', item_es: PENDING_ES, ref: '307' },
      { item: 'Outdoor unit level on pad or stand with clearances per manufacturer', item_es: PENDING_ES },
      { item: 'Electrical disconnect within sight of the unit', item_es: PENDING_ES },
    ],
    gas_refrigerant_test: [
      { item: 'Refrigerant piping holds the field pressure test; gauge on site', item_es: PENDING_ES, ref: '1108' },
      { item: 'Evacuation reading recorded before charging', item_es: PENDING_ES },
      { item: 'Locking caps on outdoor service ports', item_es: PENDING_ES, ref: 'M1411.6' },
    ],
    final: [
      { item: 'Vent connected and terminated with required clearances; combustion air provided', item_es: PENDING_ES, ref: '701' },
      { item: 'Thermostat and controls operate heating, cooling and fan', item_es: PENDING_ES },
      { item: 'Commissioning sheet completed: charge, airflow, temperature rise or split', item_es: PENDING_ES },
      { item: 'CO alarm present where required', item_es: PENDING_ES },
      { item: 'Equipment manuals and warranty registration left with the owner', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'M-HV-HEATPUMP-SPLIT', name: 'Air-source heat pump split system, ~3 ton (outdoor unit + air handler), set and connected', name_es: 'Bomba de calor dividida aire-aire, ~3 toneladas (unidad exterior + manejadora), colocada y conectada', unit: 'EA', csi: '23 81 26',
      material_cost_cents: { v: 520000, prov: est('Mid-efficiency 3-ton heat pump + matched air handler, distributor spot pricing, national baseline 2026') }, labor_hours_per_unit: { v: 14, prov: est('2-person crew, ~1 day set, pad, connect, evacuate and charge; excludes duct and line set') },
      equipment_cost_cents: { v: 0, prov: est('hand tools, gauges and vacuum pump owned') }, waste_pct: { v: 0, prov: est('counted unit') } },
    { code: 'M-HV-COND-PUMP', name: 'Condensate pump with discharge tubing, installed', name_es: 'Bomba de condensado con tubo de descarga, instalada', unit: 'EA', csi: '23 81 00',
      material_cost_cents: { v: 9500, prov: est('Residential condensate pump with safety switch + vinyl tubing') }, labor_hours_per_unit: { v: 1, prov: est('mount, run discharge, wire safety switch') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted unit') } },
    { code: 'M-HV-OVERFLOW-EA', name: 'Condensate overflow protection — secondary pan or float switch, installed and tested', name_es: 'Protección contra desborde de condensado — charola secundaria o interruptor de flotador, instalada y probada', unit: 'EA', csi: '23 81 00',
      material_cost_cents: { v: 6000, prov: est('Float switch or secondary pan, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('set pan/switch, wire into control circuit, trip-test') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted unit') } },
    { code: 'M-HV-ERV', name: 'ERV/HRV balanced ventilator, residential, with controls (ducts by others)', name_es: 'Ventilador ERV/HRV balanceado, residencial, con controles (ductos por otros)', unit: 'EA', csi: '23 72 00',
      material_cost_cents: { v: 140000, prov: est('Residential ERV/HRV core unit + wall control, national baseline 2026') }, labor_hours_per_unit: { v: 8, prov: est('hang unit, connect four duct collars, condensate (HRV), control wiring, set airflow') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('counted unit') } },
    { code: 'M-HV-STARTUP', name: 'Startup and commissioning per system — charge, airflow, static pressure, combustion check, report', name_es: 'Arranque y puesta en marcha por sistema — carga, flujo de aire, presión estática, revisión de combustión, reporte', unit: 'EA', csi: '23 08 00',
      material_cost_cents: { v: 2500, prov: est('filter, test consumables, refrigerant top-off allowance') }, labor_hours_per_unit: { v: 3, prov: est('one technician runs ENERGY STAR-style commissioning checklist on one system') },
      equipment_cost_cents: { v: 0, prov: est('instruments owned') }, waste_pct: { v: 0, prov: est('service item') } },
  ],
  quantity_rules: [
    { code: 'M-REFRIG-LINE-LF', assumption: 'Forced-air unit on plans with cooling — assume ≈25 LF of line set from condenser to coil until routed on the plans', when: { facts_any: ['fau'] }, qty: { basis: { fixture: 'fau' }, mul: 25 } },
    { code: 'M-HV-OVERFLOW-EA', assumption: 'One overflow switch / secondary pan per forced-air unit cooling coil — delete if the unit sits on an unfinished basement floor drain', when: { facts_any: ['fau'] }, qty: { basis: { fixture: 'fau' } } },
    { code: 'M-HV-STARTUP', assumption: 'One startup & commissioning visit per forced-air system on the plans', when: { facts_any: ['fau'] }, qty: { basis: { fixture: 'fau' } } },
  ],
  dependency_hints: [
    { after_trades: ['framing'], note: 'Duct and line-set rough-in starts after framing is complete and passed; equipment pads after grading.' },
    { before_phase: 'insulation', note: 'Mechanical rough-in and duct leakage tests pass before insulation and drywall close the walls and ceilings.' },
    { after_trades: ['electrical', 'gas_piping'], note: 'Startup waits for the disconnect circuit and gas line to be complete and tested.' },
  ],
});
