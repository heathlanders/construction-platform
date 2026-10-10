// Trade Knowledge Pack — water_treatment (Water Treatment / Filtration). Wave 13 — NEW-TRADE pattern
// (no hand recipe, no template tasks). Dossier: docs/trade-packs/dossiers/water_treatment.md.
// Plumbing family (IPC, reference only). Product certification = NSF/ANSI 44/53/55/58 (reference only —
// names only). Guidance: CDC home water treatment, EPA private wells, WI DNR + WSLH well testing.
// The rough-in loop alone is P-PL-SOFTENER-LOOP-EA (plumbing pack) — not duplicated here.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const ipc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const nec = { src: ['nfpa-fa'], confidence: 'verified' as const, last_verified: D };
const cdc = { src: ['water_treatment-cdc-home-treatment', 'water_treatment-cdc-well-treatment'], confidence: 'derived' as const, last_verified: D, note: 'Practice drawn from CDC home-treatment and well-water guidance; follow the installed unit’s instructions.' };
const testing = { src: ['water_treatment-epa-protect-home-water', 'well_drilling-wi-dnr-well-test', 'water_treatment-wslh-homeowner-tests'], confidence: 'verified' as const, last_verified: D };
const wqa = { src: ['water_treatment-wqa', 'water_treatment-cdc-home-treatment'], confidence: 'derived' as const, last_verified: D, note: 'Common industry practice (WQA / maker instructions); confirm against the unit’s manual.' };
const ro = { src: ['water_treatment-epa-watersense-pou-ro', 'water_treatment-nsf-58'], confidence: 'derived' as const, last_verified: D, note: 'EPA WaterSense POU RO page + NSF/ANSI 58 (reference only).' };

export default definePack({
  key: 'water_treatment',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Tests the water, then sizes, installs and starts up home treatment equipment — softeners, iron filters, whole-house filters, UV disinfection and under-sink reverse osmosis — with a bypass, air-gapped drain, bonding jumper, sanitizing, a retest and owner maintenance instructions.',
    summary_es: 'Analiza el agua y luego dimensiona, instala y pone en marcha equipos de tratamiento — suavizadores, filtros de hierro, filtros para toda la casa, desinfección UV y ósmosis inversa bajo el fregadero — con derivación, desagüe con espacio de aire, puente de unión, sanitización, nueva prueba e instrucciones de mantenimiento.',
    glossary: [
      { term: 'Hardness (grains per gallon)', term_es: 'Dureza (granos por galón)', def: 'Amount of calcium and magnesium in the water; the main number used to size a softener.', def_es: 'Cantidad de calcio y magnesio en el agua; el dato principal para dimensionar un suavizador.' },
      { term: 'Water softener (ion exchange)', term_es: 'Suavizador de agua (intercambio iónico)', def: 'Tank of resin beads that trades hardness minerals for sodium or potassium, then cleans itself with brine.', def_es: 'Tanque con resina que cambia los minerales de dureza por sodio o potasio y luego se limpia con salmuera.' },
      { term: 'Regeneration', term_es: 'Regeneración', def: 'The automatic cycle that backwashes and recharges the resin or filter media and sends the rinse to the drain.', def_es: 'El ciclo automático que retrolava y recarga la resina o el medio filtrante y manda el enjuague al desagüe.' },
      { term: 'Bypass valve', term_es: 'Válvula de derivación (bypass)', def: 'Valve set that sends water around the equipment so it can be serviced without shutting off the house.', def_es: 'Juego de válvulas que manda el agua alrededor del equipo para darle servicio sin cortar el agua de la casa.' },
      { term: 'Air gap', term_es: 'Espacio de aire', def: 'Open vertical space between the drain line end and the drain it empties into, so dirty water can never be pulled back.', def_es: 'Espacio vertical abierto entre el final de la línea de desagüe y el drenaje que la recibe, para que el agua sucia nunca regrese.' },
      { term: 'Reverse osmosis (RO)', term_es: 'Ósmosis inversa (OI)', def: 'Under-sink system that pushes water through a fine membrane for drinking water and sends the reject water to the drain.', def_es: 'Sistema bajo el fregadero que pasa el agua por una membrana muy fina para agua de beber y manda el agua de rechazo al desagüe.' },
      { term: 'UV disinfection', term_es: 'Desinfección UV', def: 'Lamp in a quartz sleeve that kills bacteria and other germs as water flows past; needs clear, pre-filtered water.', def_es: 'Lámpara dentro de una funda de cuarzo que mata bacterias y otros gérmenes al pasar el agua; necesita agua clara y prefiltrada.' },
      { term: 'Bonding jumper', term_es: 'Puente de unión', def: 'Wire clamped across the equipment so the metal water pipe stays electrically continuous when the unit is bypassed or removed.', def_es: 'Cable sujeto de un lado al otro del equipo para que la tubería metálica de agua siga eléctricamente continua cuando el equipo se deriva o se quita.' },
      { term: 'Iron / manganese filter', term_es: 'Filtro de hierro / manganeso', def: 'Backwashing filter that oxidizes and traps iron, manganese or rotten-egg sulfur smell before the softener.', def_es: 'Filtro con retrolavado que oxida y atrapa hierro, manganeso u olor a huevo podrido antes del suavizador.' },
      { term: 'Certified to NSF/ANSI', term_es: 'Certificado según NSF/ANSI', def: 'Product tested by a lab to a published standard (softeners, health-effect filters, UV, RO) for the claims on its label.', def_es: 'Producto probado por un laboratorio según una norma publicada (suavizadores, filtros, UV, OI) para lo que dice su etiqueta.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'whole_house_treatment',
      example_title: 'Install water softener and iron filter',
      when: { title_re: 'water\\s+soft|softener|iron\\s+filter|UV\\s+(?:disinfection|sterili)|water\\s+(?:treatment|filter|filtration|conditioning)' },
      steps: [
        {
          title: 'Test the water before choosing equipment',
          instruction: 'Get a lab test of the raw water before anything is bought: hardness, iron, manganese, pH and, for a well, total coliform bacteria and nitrate (plus arsenic or other local concerns). For a private well in Wisconsin, use a state-certified lab such as the State Lab of Hygiene. Match each problem to a treatment certified for it, and treat bacteria with disinfection only after fixing any well defect.',
          tools: ['lab sample bottles and cooler', 'field hardness / iron test kit'],
          materials: [],
          safety_ids: ['chemical_handling'],
          qa_ids: ['raw_water_tested', 'certified_equipment'],
        },
        {
          title: 'Size the equipment and lay out the loop',
          instruction: 'Size the softener from hardness (adding iron), people in the home and daily use, and check that peak flow will not overrun the valve. Set the order: sediment or iron filter first, then softener, then UV last. Place the loop after the pressure tank, ahead of the water heater, with outdoor hose bibs left on untreated water, and plan a drain and a receptacle within reach.',
          tools: ['tape measure', 'flow calculator or maker sizing chart'],
          materials: [],
          safety_ids: ['material_storage'],
          qa_ids: ['sized_for_flow', 'treatment_order'],
        },
        {
          title: 'Rough in the bypass and the air-gapped drain',
          instruction: 'Shut off and drain the supply, cut in the inlet, outlet and 3-valve or maker bypass, and support the piping. Run the regeneration and backwash drain lines to a standpipe, floor drain or laundry tub through an air gap — never solid into a trap or sewer — and route the brine overflow separately by gravity. Use lead-free fittings and keep torches away from plastic valve bodies.',
          tools: ['pipe cutter', 'torch or press tool', 'pipe wrenches'],
          materials: ['bypass valve set', 'lead-free fittings', 'drain tubing', 'air-gap fitting or standpipe'],
          safety_ids: ['torch_fire', 'hand_tools', 'wet_floor'],
          qa_ids: ['drain_air_gap', 'bypass_works'],
          gating_inspection_type: 'rough_in',
          code_refs: [{ section: '802', note: 'Indirect waste: equipment discharge drains through an air gap or air break' }, { section: '608.1', note: 'Protect the potable supply from contamination and backflow' }],
        },
        {
          title: 'Set the tanks, connect and bond across the equipment',
          instruction: 'Set tanks level on a firm, dry base out of freezing and direct sun, load media per the maker, and connect to the bypass. Clamp a bonding jumper across the equipment so metal water piping stays continuous when it is bypassed or removed. Plug controls and UV ballasts into a GFCI-protected receptacle, never an extension cord.',
          tools: ['level', 'funnel', 'wrench'],
          materials: ['softener / filter tanks and media', 'bonding jumper and listed ground clamps', 'salt or potassium chloride'],
          safety_ids: ['shock', 'lifting_salt', 'material_storage'],
          qa_ids: ['bonding_jumper', 'gfci_power'],
          code_refs: [{ section: '250.68(B)', note: 'Bonding jumper around water meters or filtering devices keeps the grounding path', code_type: 'NEC' }],
        },
        {
          title: 'Start up, leak-check and backwash',
          instruction: 'Open the supply slowly with the unit in bypass, purge air, then bring each unit on line and run a manual backwash and regeneration until the drain runs clear. Check every joint for leaks at working pressure, set the time of day, hardness and regeneration settings, and confirm the brine draw.',
          tools: ['pressure gauge', 'hardness test strips'],
          materials: [],
          safety_ids: ['wet_floor', 'shock'],
          qa_ids: ['no_leaks', 'programmed'],
          gating_inspection_type: 'water_supply',
          code_refs: [{ section: '608.1', note: 'Potable water kept protected through the treated system' }],
        },
        {
          title: 'Sanitize, retest and hand over to the owner',
          instruction: 'Sanitize the softener and filters per the maker. For UV, install the lamp, check the sleeve is clean and the alarm works, then disinfect the plumbing downstream once. After the flush, test treated water (hardness, iron and bacteria where treated) and give the owner the results, manuals, bypass instructions and the service schedule: salt, filter cartridges, yearly UV lamp and sleeve, yearly water test.',
          tools: ['chlorine test strips', 'sample bottles'],
          materials: ['maker-approved sanitizer or unscented household bleach'],
          safety_ids: ['chemical_handling', 'chemical_eye', 'chlorine_vapor'],
          qa_ids: ['sanitized', 'treated_retest', 'owner_handoff'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '610', note: 'Disinfect new or repaired potable water piping before use' }],
        },
      ],
    },
    {
      id: 'ro_point_of_use',
      example_title: 'Install under-sink reverse osmosis system',
      priority: 10,
      when: { title_re: 'reverse\\s+osmosis|\\bRO\\b|drinking\\s+water\\s+(?:filter|system|unit)' },
      steps: [
        {
          title: 'Confirm the water test and the certified unit',
          instruction: 'Check the water test shows the problem the unit is meant to fix, and that the unit is certified to NSF/ANSI 58 for it. RO is not a disinfection system — bacteria-positive water needs disinfection first.',
          tools: [],
          materials: ['RO unit certified for the target contaminant'],
          safety_ids: [],
          qa_ids: ['raw_water_tested', 'certified_equipment'],
        },
        {
          title: 'Mount the unit, feed and storage tank',
          instruction: 'Mount the filter head under the sink or in the basement, tap the cold supply with the maker’s feed valve, and set the storage tank. Drill the sink or counter for the dedicated faucet with the countertop deck protected and dust off the cabinet.',
          tools: ['drill and hole saw', 'tube cutter', 'wrenches'],
          materials: ['feed valve', 'RO tubing', 'storage tank', 'dedicated faucet'],
          safety_ids: ['hand_tools', 'chemical_eye'],
          qa_ids: ['no_leaks'],
        },
        {
          title: 'Connect the drain through an air gap',
          instruction: 'Run the reject water through an air-gap faucet or listed air-gap device to a drain saddle on the tailpiece above the trap. Do not loop the drain tubing below the saddle or run it uphill.',
          tools: ['drill', 'tube cutter'],
          materials: ['drain saddle', 'air-gap faucet or device'],
          safety_ids: ['hand_tools'],
          qa_ids: ['drain_air_gap'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '611', note: 'Drinking water treatment units: certified, discharge through an air gap' }],
        },
        {
          title: 'Flush, check and hand over',
          instruction: 'Sanitize per the maker, fill and dump the first tanks of water, check for leaks, and measure dissolved solids in and out to confirm the membrane works. Give the owner the cartridge and membrane schedule and log the install date on the unit.',
          tools: ['TDS meter'],
          materials: [],
          safety_ids: ['chemical_handling', 'wet_floor'],
          qa_ids: ['ro_performance', 'owner_handoff'],
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '802', note: 'Indirect waste — treatment equipment drains discharge through an air gap or air break', prov: ipc },
      { section: '608.1', note: 'Potable water supply protected from contamination and backflow', prov: ipc },
    ],
    water_supply: [
      { section: '608.1', note: 'Treated potable water kept protected from cross-connection', prov: ipc },
      { section: '250.68(B)', note: 'Bonding jumper around filtering devices keeps the water-pipe grounding path', code_type: 'NEC', prov: nec },
    ],
    final: [
      { section: '611', note: 'Drinking water treatment units — certified to the referenced standard, air-gapped discharge', prov: ipc },
      { section: '610', note: 'Disinfection of new or repaired potable water piping', prov: ipc },
    ],
  },
  hazards: [
    { id: 'chemical_handling', hazard: 'Skin and eye burns from sanitizers, chlorine, permanganate or other regenerant chemicals', hazard_es: PENDING_ES, controls: ['Read the SDS and label before use; keep the SDS on site', 'Never mix chlorine with acids, ammonia or other cleaners', 'Store chemicals in their labeled containers away from heat'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['nitrile gloves', 'chemical goggles'], prov: osha('d') },
    { id: 'chemical_eye', hazard: 'Splash of sanitizer, brine or pressurized water into the eyes while dosing or opening housings', hazard_es: PENDING_ES, controls: ['Wear goggles when mixing, pouring or opening filter housings', 'Release pressure before unscrewing a housing'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['chemical goggles'], prov: osha('e') },
    { id: 'chlorine_vapor', hazard: 'Breathing chlorine vapor while sanitizing in a small, closed mechanical room', hazard_es: PENDING_ES, controls: ['Ventilate the room or open a door while sanitizing', 'Leave the area if eyes or throat burn'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, prov: osha('d') },
    { id: 'shock', hazard: 'Electric shock from control valves, UV ballasts or receptacles near water and wet floors', hazard_es: PENDING_ES, controls: ['Unplug or de-energize the unit before opening the control or UV housing', 'Use a GFCI-protected receptacle; keep cords off wet floors'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'torch_fire', hazard: 'Fire from a soldering torch near framing, insulation or plastic valve bodies', hazard_es: PENDING_ES, controls: ['Move or shield combustibles and use a heat shield', 'Keep an extinguisher at hand and check the area after soldering'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, prov: osha('j') },
    { id: 'hand_tools', hazard: 'Cuts and punctures from pipe cutters, hole saws and drills', hazard_es: PENDING_ES, controls: ['Use tools in good repair with sharp blades', 'Clamp work and keep hands clear of the cut'], controls_es: PENDING_ES, osha_ref: '1926.301(a)', severity: 2, ppe: ['cut-resistant gloves', 'safety glasses'], prov: osha('i') },
    { id: 'lifting_salt', hazard: 'Back strain carrying 40–50 lb salt bags and media into basements and down stairs', hazard_es: PENDING_ES, controls: ['Use a hand truck and two-person carries on stairs', 'Lift with the legs, keep the load close'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 2, prov: osha('h') },
    { id: 'material_storage', hazard: 'Stacked salt, media bags or tanks sliding or tipping', hazard_es: PENDING_ES, controls: ['Stack bags and tanks stable and blocked, not against weak walls', 'Keep aisles and stairs clear'], controls_es: PENDING_ES, osha_ref: '1926.250(a)(1)', severity: 2, prov: osha('h') },
    { id: 'wet_floor', hazard: 'Slips on water and brine during drain-down, backwash and startup', hazard_es: PENDING_ES, controls: ['Lay drop cloths and keep a wet-vac handy', 'Clean up spills right away'], controls_es: PENDING_ES, osha_ref: '1926.25(a)', severity: 2, prov: osha('c') },
  ],
  qa_checklist: [
    { id: 'raw_water_tested', item: 'Raw water lab-tested before purchase (hardness, iron, manganese, pH; bacteria and nitrate for a well); results on file.', item_es: PENDING_ES, safety: true, prov: testing },
    { id: 'certified_equipment', item: 'Each unit certified to the matching NSF/ANSI standard for the contaminant it is meant to treat.', item_es: { status: 'translated', text: 'Cada equipo certificado según la norma NSF/ANSI correspondiente al contaminante que debe tratar.' }, prov: { src: ['water_treatment-nsf-58', 'water_treatment-cdc-home-treatment'], confidence: 'derived', last_verified: D, note: 'Standard names only (44/53/55/58).' } },
    { id: 'sized_for_flow', item: 'Softener capacity sized from hardness (plus iron), occupants and use; valve rated for the home’s peak flow.', item_es: { status: 'translated', text: 'Capacidad del suavizador según dureza (más hierro), ocupantes y consumo; válvula clasificada para el flujo máximo de la casa.' }, prov: wqa },
    { id: 'treatment_order', item: 'Treatment order correct: sediment/iron filter, then softener, then UV last; hose bibs left untreated.', item_es: { status: 'translated', text: 'Orden de tratamiento correcto: filtro de sedimento/hierro, luego suavizador y al final UV; llaves exteriores sin tratar.' }, prov: wqa },
    { id: 'drain_air_gap', item: 'Regeneration, backwash and RO reject drains end above the receptor through an air gap or listed device; no solid connection to the sewer.', item_es: PENDING_ES, safety: true, prov: ipc },
    { id: 'bypass_works', item: 'Bypass valves operate and isolate the equipment without shutting off the house.', item_es: { status: 'translated', text: 'Las válvulas de derivación funcionan y aíslan el equipo sin cortar el agua de la casa.' }, prov: wqa },
    { id: 'bonding_jumper', item: 'Bonding jumper with listed clamps installed across the equipment on metal water piping.', item_es: PENDING_ES, safety: true, prov: nec },
    { id: 'gfci_power', item: 'Controls and UV ballast plugged into a GFCI-protected receptacle; no extension cords.', item_es: PENDING_ES, safety: true, prov: osha('k') },
    { id: 'no_leaks', item: 'All joints dry at working pressure after startup and one full regeneration.', item_es: { status: 'translated', text: 'Todas las uniones secas a presión de trabajo después del arranque y una regeneración completa.' }, prov: wqa },
    { id: 'programmed', item: 'Control set for time of day, measured hardness and regeneration schedule; brine draw confirmed.', item_es: { status: 'translated', text: 'Control ajustado a la hora, la dureza medida y el programa de regeneración; succión de salmuera confirmada.' }, prov: wqa },
    { id: 'sanitized', item: 'Equipment sanitized per the maker; for UV, downstream plumbing disinfected once and flushed; lamp alarm tested.', item_es: PENDING_ES, safety: true, prov: cdc },
    { id: 'treated_retest', item: 'Treated water retested after flushing (hardness, iron, and bacteria where treated); results given to the owner.', item_es: PENDING_ES, safety: true, prov: testing },
    { id: 'ro_performance', item: 'RO dissolved-solids reading in and out recorded; reduction within the unit’s rating.', item_es: { status: 'translated', text: 'Lectura de sólidos disueltos de entrada y salida de la OI registrada; reducción dentro de la clasificación del equipo.' }, prov: ro },
    { id: 'owner_handoff', item: 'Owner given manuals, bypass instructions and service schedule (salt, cartridges, membrane, yearly UV lamp/sleeve, yearly water test).', item_es: { status: 'translated', text: 'Al dueño se le entregan manuales, instrucciones de derivación y programa de servicio (sal, cartuchos, membrana, lámpara/funda UV anual, prueba de agua anual).' }, prov: cdc },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Equipment drain lines end through an air gap above the standpipe, floor drain or tub', item_es: PENDING_ES, ref: 'IPC 802' },
      { item: 'Bypass and isolation valves installed; piping supported and lead-free', item_es: PENDING_ES, ref: 'IPC 608.1' },
    ],
    water_supply: [
      { item: 'Treatment system holds working pressure with no leaks', item_es: PENDING_ES },
      { item: 'Bonding jumper installed across the equipment on metal piping', item_es: PENDING_ES, ref: 'NEC 250.68(B)' },
    ],
    final: [
      { item: 'Units certified for their claims; labels and manuals left with the owner', item_es: PENDING_ES, ref: 'IPC 611' },
      { item: 'System disinfected and flushed; treated-water test results on site', item_es: PENDING_ES, ref: 'IPC 610' },
    ],
  },
  assemblies: [
    { code: 'P-WT-SOFTENER-EA', name: 'Water softener, metered, ~32k–48k grain, installed on an existing loop, each', name_es: 'Suavizador de agua con medidor, ~32k–48k granos, instalado en una preparación existente, c/u', unit: 'EA', csi: '22 31 00',
      description: 'Equipment + set, connect, bond, start up. Rough-in loop is P-PL-SOFTENER-LOOP-EA.',
      material_cost_cents: { v: 110000, prov: est('metered residential softener + resin + first salt fill, distributor/retail spot 2026') }, labor_hours_per_unit: { v: 3, prov: est('set, connect to bypass, bond, program, regenerate, leak-check') },
      equipment_cost_cents: { v: 0, prov: est('hand tools + hand truck') }, waste_pct: { v: 0, prov: est('packaged unit') } },
    { code: 'P-WT-IRON-FILTER-EA', name: 'Backwashing iron / manganese / sulfur filter, residential, each', name_es: 'Filtro con retrolavado para hierro / manganeso / azufre, residencial, c/u', unit: 'EA', csi: '22 32 00',
      material_cost_cents: { v: 150000, prov: est('air-injection or oxidizing-media backwash filter with control valve, 2026') }, labor_hours_per_unit: { v: 4, prov: est('cut in ahead of softener, drain with air gap, load media, backwash, program') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 3, prov: est('fittings and tubing offcuts') } },
    { code: 'P-WT-UV-EA', name: 'Whole-house UV disinfection system with sediment prefilter (~10–12 gpm), each', name_es: 'Sistema de desinfección UV para toda la casa con prefiltro de sedimento (~10–12 gpm), c/u', unit: 'EA', csi: '22 32 00',
      material_cost_cents: { v: 110000, prov: est('UV chamber, lamp, quartz sleeve, ballast w/ alarm, 5-micron prefilter housing, 2026') }, labor_hours_per_unit: { v: 3.5, prov: est('mount last in line, wire to GFCI, disinfect downstream plumbing, test alarm') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 3, prov: est('fittings offcuts') } },
    { code: 'P-WT-RO-EA', name: 'Under-sink reverse osmosis drinking-water system with air-gap faucet, each', name_es: 'Sistema de ósmosis inversa bajo el fregadero con grifo con espacio de aire, c/u', unit: 'EA', csi: '22 32 00',
      material_cost_cents: { v: 40000, prov: est('NSF 58-certified POU RO unit, tank and air-gap faucet, retail spot 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('mount, feed valve, drill faucet, drain saddle, sanitize, flush') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 0, prov: est('kit') } },
    { code: 'P-WT-WHOLE-FILTER-EA', name: 'Whole-house sediment + carbon cartridge filter set with bypass, each', name_es: 'Juego de filtros de cartucho de sedimento + carbón para toda la casa con derivación, c/u', unit: 'EA', csi: '22 32 00',
      material_cost_cents: { v: 35000, prov: est('two big-housing cartridge filters, mounting bracket, gauges, first cartridges, 2026') }, labor_hours_per_unit: { v: 2, prov: est('cut in on main, bracket, bypass, bond, leak-check') },
      equipment_cost_cents: { v: 0, prov: est('hand tools') }, waste_pct: { v: 3, prov: est('pipe offcuts') } },
    { code: 'P-WT-LAB-TEST-EA', name: 'Certified-lab water test, before and after treatment (sample collection + lab fee), each', name_es: 'Análisis de agua en laboratorio certificado, antes y después del tratamiento (toma de muestra + tarifa), c/u', unit: 'EA', csi: '22 32 00',
      description: 'Homeowner-package style panel; WSLH listed $450 for a broad well package on retrieval date.',
      material_cost_cents: { v: 30000, prov: { src: ['water_treatment-wslh-test-prices', 'platform-baseline'], confidence: 'estimate', last_verified: D, note: 'Blend of a basic bacteria/nitrate/hardness/iron panel pre + post; broad WSLH homeowner package is $450 alone.' } }, labor_hours_per_unit: { v: 1, prov: est('collect samples twice, ship, review results with owner') },
      equipment_cost_cents: { v: 0, prov: est('none') }, waste_pct: { v: 0, prov: est('none') } },
  ],
  quantity_rules: [],
  dependency_hints: [
    { after_trades: ['plumbing', 'well_drilling'], before_phase: 'punch', note: 'Install treatment after the well and plumbing rough-in are tested; disinfect and retest before final occupancy.' },
  ],
});
