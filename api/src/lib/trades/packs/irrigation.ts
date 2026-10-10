// Trade Knowledge Pack — irrigation (lawn / landscape sprinkler + drip systems). Wave 04 — NEW-TRADE pattern
// (no hand recipe). Dossier: docs/trade-packs/dossiers/irrigation.md. Sources: UFGS 32 84 23 (Underground
// Sprinkler Systems), EPA WaterSense (controllers, Sprinkler Spruce-Up), Wis. Admin. Code SPS 382 (cross
// connection control, assembly registration + annual testing), WI DSPS tester registration, Rain Bird homeowner
// installation guide, Irrigation Association BMPs (reference only), IPC 608 / 312.10 / 305 (reference only),
// 29 CFR 1926 (P, I, O, D, K, C, E).
// The AHJ concern is the backflow preventer on the potable tap (plumbing family, gate water_supply).
// WI refs carry code_type 'WI SPS' so they don't render under the family code (IPC/UPC).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const WI = 'WI SPS';
const ufgs = { src: ['irrigation-ufgs-32-84-23'], confidence: 'verified' as const, last_verified: D };
const sps = { src: ['plumbing-wi-sps382'], confidence: 'verified' as const, last_verified: D };
const ipc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const rb = { src: ['irrigation-rainbird-homeowner-guide'], confidence: 'derived' as const, last_verified: D, note: 'Common manufacturer installation practice — follow the instructions for the products installed.' };
const ws = (id: string) => ({ src: [id], confidence: 'verified' as const, last_verified: D });
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'irrigation',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Installs lawn and landscape irrigation: the tap off the potable supply with its backflow preventer, valve manifolds, mainline and laterals, spray and rotor heads or drip zones, controller with rain/smart sensor, flushing and pressure testing, coverage check, as-built zone map and the fall blow-out plan in freeze climates.',
    summary_es: 'Instala riego para césped y jardín: la toma del agua potable con su dispositivo antirretorno, válvulas de zona, tubería principal y laterales, aspersores y rotores o zonas de goteo, controlador con sensor de lluvia o inteligente, lavado y prueba de presión, revisión de cobertura, plano de zonas final y el plan de purga con aire para el otoño en climas con heladas.',
    glossary: [
      { term: 'Backflow preventer', term_es: 'Dispositivo antirretorno (prevención de reflujo)', def: 'Device on the irrigation tap that stops yard water, fertilizer or chemicals from flowing back into the drinking-water pipes.', def_es: 'Dispositivo en la toma de riego que impide que el agua del jardín, fertilizante o químicos regresen a la tubería de agua potable.' },
      { term: 'PVB (pressure vacuum breaker)', term_es: 'PVB (rompedor de vacío a presión)', def: 'Testable backflow assembly common on lawn systems; set higher than the highest head.', def_es: 'Ensamble antirretorno comprobable, común en sistemas de césped; se instala más alto que el aspersor más alto.' },
      { term: 'RPZ (reduced pressure zone)', term_es: 'RPZ (zona de presión reducida)', def: 'Backflow assembly for high-hazard connections, such as a system that injects fertilizer; never set in a pit.', def_es: 'Ensamble antirretorno para conexiones de alto riesgo, como un sistema que inyecta fertilizante; nunca se instala en una fosa.' },
      { term: 'Zone', term_es: 'Zona', def: 'Group of heads or drip lines run by one valve; sized to the water flow and pressure available.', def_es: 'Grupo de aspersores o líneas de goteo controlado por una válvula; dimensionado según el caudal y la presión disponibles.' },
      { term: 'Head-to-head coverage', term_es: 'Cobertura cabeza a cabeza', def: 'Spacing heads so each one throws water all the way to the next one, so there are no dry spots.', def_es: 'Separar los aspersores para que cada uno lance agua hasta el siguiente, sin dejar zonas secas.' },
      { term: 'Valve manifold', term_es: 'Colector de válvulas', def: 'Cluster of zone valves in a valve box, fed by the mainline.', def_es: 'Grupo de válvulas de zona dentro de una caja de válvulas, alimentado por la tubería principal.' },
      { term: 'Dripline / emitter', term_es: 'Línea de goteo / emisor', def: 'Low-flow tubing or fittings that drip water at the roots of beds, shrubs and trees.', def_es: 'Tubería o accesorios de bajo caudal que gotean agua en las raíces de camas, arbustos y árboles.' },
      { term: 'Blow-out (winterization)', term_es: 'Purga con aire (preparación para el invierno)', def: 'Pushing water out of the pipes with compressed air in the fall so freezing does not crack them.', def_es: 'Sacar el agua de la tubería con aire comprimido en otoño para que la helada no la rompa.' },
      { term: 'Smart controller', term_es: 'Controlador inteligente', def: 'Timer that adjusts watering from local weather or soil moisture data instead of a fixed schedule.', def_es: 'Programador que ajusta el riego con datos del clima local o la humedad del suelo en vez de un horario fijo.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'sprinkler_system_install',
      example_title: 'Install lawn sprinkler system',
      when: { title_re: '\\b(?:irrigation|sprinklers?|sprinkling|lawn\\s+watering)\\b' },
      steps: [
        {
          title: 'Locate utilities and lay out zones',
          instruction: 'Call 811 and wait for locates; mark private lines (well, septic, low-voltage, gas to a grill) yourself. Measure static pressure and flow at the tap. Lay out heads head-to-head, split zones by plant type, sun and slope, keep sprays and rotors on separate zones, and keep each zone within the flow you measured.',
          tools: ['pressure gauge', 'flow gauge or bucket and stopwatch', 'measuring wheel', 'marking paint and flags'],
          materials: ['irrigation design / head layout'],
          safety_ids: ['utility_strike'],
          qa_ids: ['utility_locate', 'flow_pressure_matched', 'head_to_head'],
        },
        {
          title: 'Tap the supply and set the backflow preventer',
          instruction: 'Shut off the water, tee off the supply downstream of the meter, and install an isolation valve and drain. Set the backflow assembly the code and the hazard call for: a pressure vacuum breaker at least 12 in. above the highest head, or a reduced-pressure assembly above grade (never in a pit) if fertilizer or chemicals will be injected. Add a blow-out port downstream of the assembly. Leave the work open for the plumbing inspection.',
          tools: ['pipe cutter', 'torch or press tool per pipe type', 'pipe wrenches'],
          materials: ['tee and isolation valve', 'backflow assembly listed for the hazard', 'drain valve', 'blow-out port', 'pipe insulation for exposed piping'],
          safety_ids: ['solvent_vapor', 'cave_in'],
          qa_ids: ['backflow_type', 'blowout_port', 'backflow_registered_tested'],
          gating_inspection_type: 'water_supply',
          code_refs: [
            { section: '608.17.5', note: 'Lawn irrigation supply protected by a listed backflow device; RPZ if chemicals added (608.16.5 in 2018)' },
            { section: '382.41', note: 'Every cross connection protected by a listed method sized to the hazard', code_type: WI },
            { section: '382.20(1)(c)', note: 'Testable backflow assemblies registered with DSPS within 7 days of install', code_type: WI },
          ],
        },
        {
          title: 'Trench, set valves and run pipe',
          instruction: 'Trench or pull pipe to the design depth; hand dig near every locate mark and around big tree roots. Set the valve manifold in a valve box with room to service each valve. Run the mainline first, then laterals to each head, keeping lines apart and sloped toward the drains. Lay direct-burial wire beside the pipe with a loop at each valve, make waterproof splices only in boxes, and record wire colors by zone.',
          tools: ['trencher or vibratory plow', 'shovel', 'PVC cutter', 'wire strippers'],
          materials: ['PVC or poly mainline and laterals', 'fittings', 'primer and solvent cement', 'zone valves', 'valve boxes', 'direct-burial irrigation wire', 'waterproof wire connectors'],
          safety_ids: ['utility_strike', 'trencher_moving_parts', 'raised_boom', 'equipment_struck', 'solvent_vapor', 'heat_illness', 'noise'],
          qa_ids: ['pipe_depth', 'valve_box_access', 'wire_splices'],
        },
        {
          title: 'Flush, pressure test and set heads',
          instruction: 'Before any head goes on, run each zone open to flush dirt out of the pipe. With the heads still off and trenches open, hold the mainline at working pressure and walk it for leaks. Install heads on swing pipe or risers, set them plumb and level with finished grade, then backfill in lifts and tamp so the heads do not settle.',
          tools: ['pressure gauge', 'shovel', 'hand tamper'],
          materials: ['spray and rotor heads', 'nozzles', 'swing pipe or risers'],
          safety_ids: ['heat_illness'],
          qa_ids: ['flush_before_heads', 'pressure_test'],
        },
        {
          title: 'Mount and wire the controller',
          instruction: 'Mount the controller where the owner can reach it and plug it into a GFCI-protected outlet, or have an electrician provide the circuit. Land the zone wires and the common, add the rain or soil-moisture sensor (or set up the weather-based smart controller), and program a starting schedule per zone.',
          tools: ['drill/driver', 'wire strippers', 'GFCI tester'],
          materials: ['controller (WaterSense-labeled smart controller where specified)', 'rain / freeze or soil-moisture sensor', 'conduit and fittings'],
          safety_ids: ['controller_shock'],
          qa_ids: ['smart_controller_sensor'],
        },
        {
          title: 'Coverage check, handoff and winterization plan',
          instruction: 'Run every zone through a full cycle, adjust arcs and radius so water lands on lawn and beds, not on pavement or the house, and fix dry spots. Get the backflow assembly tested by a certified tester before it goes into service. Leave the owner an as-built zone map, the controller chart, and the fall blow-out and spring start-up procedure.',
          tools: ['nozzle adjustment tool', 'catch cups (optional)'],
          materials: ['as-built zone map', 'controller chart', 'backflow test report'],
          safety_ids: ['heat_illness', 'blowout_air'],
          qa_ids: ['coverage_audit', 'backflow_registered_tested', 'asbuilt_zone_map', 'winterization_plan'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '312.10', note: 'Backflow assemblies inspected and tested at install and on schedule' },
            { section: '382.22(8)', note: 'Assembly tested at install, after repair and yearly by a registered tester', code_type: WI },
          ],
        },
      ],
    },
    {
      id: 'drip_zone_install',
      example_title: 'Install drip irrigation zone for planting beds',
      priority: 10,
      when: { title_re: '\\b(?:drip(?:line)?|micro[- ]?irrigation|micro[- ]?spray|emitters?|bubblers?)\\b' },
      steps: [
        {
          title: 'Confirm backflow protection and set the drip valve',
          instruction: 'A drip zone still feeds from potable water: confirm the system backflow preventer covers it, or install one before connecting. Set the drip zone valve with a filter and a pressure regulator matched to the dripline, in a valve box you can reach.',
          tools: ['pipe cutter', 'pressure gauge'],
          materials: ['zone valve', 'drip filter', 'pressure regulator', 'valve box'],
          safety_ids: ['utility_strike', 'solvent_vapor'],
          qa_ids: ['backflow_type', 'valve_box_access'],
          gating_inspection_type: 'water_supply',
          code_refs: [{ section: '608.17.5', note: 'Irrigation supply protected against backflow before any zone is connected' }],
        },
        {
          title: 'Lay dripline and emitters',
          instruction: 'Run supply tubing to the beds and lay dripline or point emitters at the root zone, staking the tubing so it stays put. Stay within the maker’s maximum run length and emitter count for the tubing size. Flush each line open before capping the ends, then cover with mulch or bury to the design depth.',
          tools: ['tubing cutter', 'hole punch', 'stakes'],
          materials: ['dripline or supply tubing', 'emitters / bubblers', 'fittings', 'end caps or flush valves', 'tubing stakes'],
          safety_ids: ['heat_illness'],
          qa_ids: ['flush_before_heads'],
        },
        {
          title: 'Test, program and hand off',
          instruction: 'Run the zone and check every emitter is dripping and there are no blown fittings. Program a schedule suited to the plants, add the zone to the as-built map, and include it in the fall blow-out plan.',
          tools: ['controller'],
          materials: ['as-built zone map'],
          safety_ids: ['heat_illness'],
          qa_ids: ['coverage_audit', 'asbuilt_zone_map', 'winterization_plan'],
          gating_inspection_type: 'final',
        },
      ],
    },
  ],
  code_refs: {
    water_supply: [
      { section: '608.1', note: 'Potable water supply protected against backflow', prov: ipc },
      { section: '608.17.5', note: 'Lawn irrigation supply: check valve, vacuum breaker or RPZ; RPZ where chemicals are injected', prov: ipc },
      { section: '382.41', note: 'Cross connections protected by a listed method for the hazard level', code_type: WI, prov: sps },
      { section: '382.20(1)(c)', note: 'Testable backflow assemblies registered with DSPS within 7 days', code_type: WI, prov: sps },
      { section: '305', note: 'Protect piping from freezing and damage', prov: ipc },
    ],
    final: [
      { section: '312.10', note: 'Backflow assemblies inspected and tested', prov: ipc },
      { section: '382.22(8)', note: 'Performance test at install, after repair and at least yearly by a registered tester', code_type: WI, prov: sps },
    ],
  },
  equipment: [
    { when: { title_re: '\\b(?:irrigation|sprinklers?|drip)\\b' }, type: 'trencher', reason: 'Cut narrow lateral and mainline trenches fast with little lawn damage' },
    { when: { title_re: '\\b(?:irrigation|sprinklers?)\\b' }, type: 'skid_steer', reason: 'Pull pipe with a vibratory plow attachment on large lawns', optional: true },
    { when: { title_re: '\\b(?:winteriz|blow[- ]?out|irrigation|sprinklers?)' }, type: 'air_compressor', reason: 'Blow water out of the lines for winter in freeze climates', optional: true },
  ],
  hazards: [
    { id: 'utility_strike', hazard: 'Hitting buried power, gas, water or communication lines with a trencher, plow or shovel', hazard_es: PENDING_ES, controls: ['Call 811 and wait for locates before trenching or plowing', 'Hand dig near every mark; mark private lines (well, septic, landscape lighting) yourself'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'trencher_moving_parts', hazard: 'Caught in the trencher digging chain or plow drive', hazard_es: PENDING_ES, controls: ['Keep guards in place; stop the engine and let the chain stop before clearing roots or rocks', 'Keep hands, feet and loose clothing clear; nobody walks beside the boom'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(2)', severity: 4, ppe: ['steel-toe boots', 'gloves'], prov: osha('i') },
    { id: 'raised_boom', hazard: 'Crushed by a raised trencher boom or plow blade that drops during service', hazard_es: PENDING_ES, controls: ['Lower the boom to the ground or block it before working under or near it'], controls_es: PENDING_ES, osha_ref: '1926.600(a)(3)(i)', severity: 3, prov: osha('o') },
    { id: 'equipment_struck', hazard: 'Struck by a skid steer or ride-on trencher backing up', hazard_es: PENDING_ES, controls: ['Working reverse alarm or a spotter when the rear view is blocked', 'Stay out of the travel path'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 3, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'cave_in', hazard: 'Cave-in of a deep hole at the meter, curb stop or main tap', hazard_es: PENDING_ES, controls: ['Slope, shore or shield any excavation 5 ft or deeper before entering', 'Competent person inspects the hole daily and after rain'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, ppe: ['hard hat'], prov: osha('p') },
    { id: 'solvent_vapor', hazard: 'Breathing PVC primer and solvent cement vapors in pits, valve boxes or basements', hazard_es: PENDING_ES, controls: ['Work with good air movement; cap cans when not in use', 'Keep flames and sparks away from primer and cement'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['chemical-resistant gloves', 'safety glasses'], prov: osha('d') },
    { id: 'controller_shock', hazard: 'Electric shock at the controller outlet or power tools used outdoors', hazard_es: PENDING_ES, controls: ['Use GFCI-protected outlets and cords outdoors', 'Leave new 120 V circuits to a licensed electrician'], controls_es: PENDING_ES, osha_ref: '1926.404(b)(1)(ii)', severity: 3, prov: osha('k') },
    { id: 'heat_illness', hazard: 'Heat illness trenching and setting heads in full summer sun', hazard_es: PENDING_ES, controls: ['Train the crew on heat illness signs; provide water, shade and rest breaks', 'Start early and acclimatize new workers'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, prov: osha('c') },
    { id: 'blowout_air', hazard: 'Eye injury from heads, caps or debris blown off during an air blow-out', hazard_es: PENDING_ES, controls: ['Wear safety glasses; stand clear of heads while a zone is under air', 'Keep air pressure within the system and backflow maker’s limits; never blow air through the backflow assembly'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('e') },
    { id: 'noise', hazard: 'Hearing damage from trenchers, plows and compressors', hazard_es: PENDING_ES, controls: ['Wear hearing protection when running or working next to trenchers and compressors'], controls_es: PENDING_ES, osha_ref: '1926.52(a)', severity: 2, ppe: ['ear plugs or muffs'], prov: osha('d') },
  ],
  qa_checklist: [
    { id: 'utility_locate', phase: 'sitework', item: 'Utility locate ticket active and marks visible before trenching; private lines (well, septic, low-voltage) marked by hand.', item_es: PENDING_ES, safety: true, prov: osha('p') },
    { id: 'flow_pressure_matched', phase: 'sitework', item: 'Static pressure and available flow measured at the tap; every zone’s total flow stays within it.', item_es: tr('Presión estática y caudal disponible medidos en la toma; el caudal total de cada zona no los supera.'), prov: { src: ['irrigation-rainbird-homeowner-guide', 'irrigation-ia-bmp'], confidence: 'derived', last_verified: D, note: 'Zones calculated from GPM/PSI at the point of connection (manufacturer guide); hydraulic design concept per IA BMPs (reference).' } },
    { id: 'head_to_head', phase: 'sitework', item: 'Heads spaced head-to-head; sprays and rotors not mixed on the same zone.', item_es: tr('Aspersores separados cabeza a cabeza; difusores y rotores no se mezclan en la misma zona.'), prov: rb },
    { id: 'backflow_type', phase: 'sitework', item: 'Backflow assembly listed for the hazard: PVB at least 12 in. above the highest head, or RPZ above grade (not in a pit) where fertilizer or chemicals are injected; no valve downstream of an atmospheric vacuum breaker.', item_es: PENDING_ES, safety: true, prov: { src: ['icc-pa', 'irrigation-ufgs-32-84-23', 'plumbing-wi-sps382'], confidence: 'derived', last_verified: D, note: 'IPC 608.17.5 device types (ref only); UFGS 3.2.7 placement heights and no-pit rule; SPS 382.41 hazard-based selection.' } },
    { id: 'backflow_registered_tested', phase: 'sitework', item: 'Testable backflow assembly tested by a certified/registered tester before use (and yearly after); in WI registered with DSPS within 7 days and the test report filed.', item_es: PENDING_ES, safety: true, prov: { src: ['plumbing-wi-sps382', 'irrigation-wi-dsps-ccc-tester'], confidence: 'verified', last_verified: D, note: 'SPS 382.20(1)(c) registration; 382.22(8) testing intervals and registered tester.' } },
    { id: 'blowout_port', phase: 'sitework', item: 'Blow-out port installed downstream of the backflow assembly, plus isolation valve and drain at the tap.', item_es: tr('Puerto de purga instalado después del dispositivo antirretorno, además de válvula de aislamiento y drenaje en la toma.'), prov: rb },
    { id: 'pipe_depth', phase: 'sitework', item: 'Mainline and laterals at the design cover depth — deep enough to clear mowers and core aeration — sloped toward drains so the system can be fully drained or blown out.', item_es: tr('Tubería principal y laterales a la profundidad de diseño — suficiente para librar cortadoras y aireadoras — con pendiente hacia los drenajes para poder vaciar o purgar todo el sistema.'), prov: { src: ['irrigation-ufgs-32-84-23', 'irrigation-rainbird-homeowner-guide'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.2 cover, slope toward drain valves, system drainable (3.2.4.3); manufacturer guide trench depths.' } },
    { id: 'valve_box_access', phase: 'sitework', item: 'Every valve in a valve box at grade with room to service and replace it; lid visible and not buried.', item_es: tr('Cada válvula dentro de una caja a nivel de terreno con espacio para darle servicio o cambiarla; tapa visible y sin enterrar.'), prov: ufgs },
    { id: 'wire_splices', phase: 'sitework', item: 'Direct-burial wire beside the pipe, slack loop at each valve, waterproof splices only inside valve boxes, wire colors recorded by zone.', item_es: tr('Cable de enterrado directo junto al tubo, bucle de holgura en cada válvula, empalmes impermeables solo dentro de cajas de válvulas, colores de cable anotados por zona.'), prov: { src: ['irrigation-ufgs-32-84-23', 'irrigation-rainbird-homeowner-guide'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.8 wires, loops, waterproof splices; manufacturer guide: record zone wire colors.' } },
    { id: 'flush_before_heads', phase: 'sitework', item: 'Each zone (and each drip line) flushed clean before heads, nozzles or end caps go on.', item_es: tr('Cada zona (y cada línea de goteo) lavada antes de colocar aspersores, boquillas o tapones finales.'), prov: { src: ['irrigation-ufgs-32-84-23', 'irrigation-rainbird-homeowner-guide'], confidence: 'verified', last_verified: D } },
    { id: 'pressure_test', phase: 'sitework', item: 'Mainline held at working pressure with trenches open and checked for leaks before backfill (UFGS jobs: hydrostatic test as specified); heads then set plumb and flush with finished grade.', item_es: tr('Tubería principal mantenida a presión de trabajo con zanjas abiertas y revisada por fugas antes de rellenar (obras UFGS: prueba hidrostática según especificación); luego aspersores a plomo y al ras del terreno terminado.'), prov: ufgs },
    { id: 'smart_controller_sensor', phase: 'sitework', item: 'Weather-based or soil-moisture (WaterSense-labeled where specified) controller, or a rain/freeze sensor, installed and working on a GFCI-protected outlet.', item_es: tr('Controlador basado en clima o humedad del suelo (con etiqueta WaterSense donde se especifique), o sensor de lluvia/helada, instalado y funcionando en un tomacorriente con GFCI.'), prov: ws('irrigation-epa-watersense-controllers') },
    { id: 'coverage_audit', phase: 'sitework', item: 'Every zone run a full cycle: no broken heads or leaks, no dry spots, and no water thrown on pavement, walls or the house.', item_es: tr('Cada zona operada un ciclo completo: sin aspersores rotos ni fugas, sin zonas secas y sin agua lanzada sobre pavimento, muros o la casa.'), prov: { src: ['irrigation-epa-sprinkler-spruce-up', 'irrigation-ufgs-32-84-23'], confidence: 'verified', last_verified: D, note: 'WaterSense inspect / direct; UFGS 3.5.3 operation test through a full programmed cycle.' } },
    { id: 'asbuilt_zone_map', phase: 'sitework', item: 'As-built zone map (valves, heads, mainline, wire runs) and controller chart left with the owner.', item_es: tr('Plano final de zonas (válvulas, aspersores, tubería principal, recorrido de cables) y tabla del controlador entregados al propietario.'), prov: ufgs },
    { id: 'winterization_plan', phase: 'sitework', item: 'In freeze climates (e.g. Wisconsin) the system is drainable and the owner has the fall blow-out and spring start-up procedure; backflow assembly drained or removed for winter.', item_es: tr('En climas con heladas (p. ej. Wisconsin) el sistema se puede vaciar y el propietario tiene el procedimiento de purga en otoño y arranque en primavera; dispositivo antirretorno vaciado o retirado en invierno.'), prov: { src: ['irrigation-ufgs-32-84-23', 'irrigation-rainbird-homeowner-guide'], confidence: 'derived', last_verified: D, note: 'UFGS 3.2.4.3 system drainable in freeze areas; manufacturer guide: blow-out port for freeze-prone regions.' } },
  ],
  inspection_checklists: {
    water_supply: [
      { item: 'Backflow assembly type matches the hazard (RPZ where chemicals are injected) and is a listed device', item_es: PENDING_ES, ref: 'IPC 608.17.5 / WI SPS 382.41' },
      { item: 'PVB set above the highest head; RPZ above grade, not in a pit, relief port able to drain', item_es: PENDING_ES },
      { item: 'Isolation valve, drain and blow-out port downstream of the assembly', item_es: PENDING_ES },
      { item: 'Assembly registered with DSPS (WI) within 7 days of installation', item_es: PENDING_ES, ref: 'WI SPS 382.20(1)(c)' },
    ],
    final: [
      { item: 'Backflow assembly performance test passed by a registered tester; report filed', item_es: PENDING_ES, ref: 'WI SPS 382.22(8)' },
      { item: 'Controller on GFCI-protected power; rain or smart sensor working', item_es: PENDING_ES },
      { item: 'As-built zone map and winterization procedure handed to the owner', item_es: PENDING_ES },
    ],
  },
  assemblies: [
    { code: 'P-IRR-ZONE-SPRAY-EA', name: 'Sprinkler zone, spray or rotor — valve, ~6–8 heads, laterals and wire', name_es: 'Zona de aspersores, difusores o rotores — válvula, ~6–8 aspersores, laterales y cable', unit: 'EA', csi: '32 84 23',
      description: 'One residential zone: zone valve, heads with swing pipe, ~150 LF lateral, fittings, wire share. Mainline, backflow and controller are separate lines.',
      material_cost_cents: { v: 35000, prov: est('Valve + 6–8 heads + ~150 LF 1 in. PVC/poly + fittings + wire share, national baseline 2026.') },
      labor_hours_per_unit: { v: 6, prov: est('Trench/pull, glue or crimp, set heads, backfill, adjust — two-person crew share.') },
      equipment_cost_cents: { v: 6000, prov: est('Walk-behind trencher or vibratory plow day share per zone.') },
      waste_pct: { v: 5, prov: est('Pipe and fitting over-order.') } },
    { code: 'P-IRR-ZONE-DRIP-EA', name: 'Drip irrigation zone — valve with filter and regulator, ~200 LF dripline and emitters', name_es: 'Zona de riego por goteo — válvula con filtro y regulador, ~200 pies lineales de línea de goteo y emisores', unit: 'EA', csi: '32 84 13',
      material_cost_cents: { v: 22000, prov: est('Drip control kit (valve, filter, regulator) + ~200 LF dripline/tubing + emitters, stakes and fittings, 2026.') },
      labor_hours_per_unit: { v: 4, prov: est('Set valve, lay and stake tubing, punch emitters, flush and test.') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools only.') },
      waste_pct: { v: 10, prov: est('Tubing cut-offs.') } },
    { code: 'P-IRR-TAP-EA', name: 'Irrigation tap off the potable supply — tee, isolation valve, drain and blow-out port', name_es: 'Toma de riego en el agua potable — te, válvula de aislamiento, drenaje y puerto de purga', unit: 'EA', csi: '22 11 16',
      material_cost_cents: { v: 9000, prov: est('Copper/PEX tee, ball valve, drain, blow-out fitting, sleeve through wall, 2026.') },
      labor_hours_per_unit: { v: 2, prov: est('Shut down, cut in tee, pipe out through the wall or curb box.') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools only.') },
      waste_pct: { v: 0, prov: est('Single connection.') } },
    { code: 'P-IRR-BFP-PVB-EA', name: 'Backflow preventer, 1 in. pressure vacuum breaker, installed with initial test', name_es: 'Dispositivo antirretorno, rompedor de vacío a presión de 1 pulg., instalado con prueba inicial', unit: 'EA', csi: '22 11 19',
      description: 'Use an RPZ instead where fertilizer or chemicals are injected (price higher).',
      material_cost_cents: { v: 28000, prov: est('1 in. PVB assembly + unions, riser piping and insulation cover, 2026.') },
      labor_hours_per_unit: { v: 3, prov: est('Set assembly above the highest head, pipe in, register.') },
      equipment_cost_cents: { v: 9000, prov: est('Initial performance test by a registered tester (subcontracted service charge).') },
      waste_pct: { v: 0, prov: est('Single unit.') } },
    { code: 'P-IRR-CTRL-SMART-EA', name: 'Smart irrigation controller with rain/freeze sensor, mounted and programmed', name_es: 'Controlador de riego inteligente con sensor de lluvia/helada, instalado y programado', unit: 'EA', csi: '32 84 23',
      material_cost_cents: { v: 25000, prov: est('WaterSense-type weather-based controller (4–8 zone) + wired or wireless rain/freeze sensor, 2026.') },
      labor_hours_per_unit: { v: 2, prov: est('Mount, land zone wires and common, set up Wi-Fi/weather, program.') },
      equipment_cost_cents: { v: 0, prov: est('Hand tools only.') },
      waste_pct: { v: 0, prov: est('Single unit.') } },
    { code: 'P-IRR-WINTERIZE-EA', name: 'Irrigation winterization — compressed-air blow-out per system', name_es: 'Preparación para el invierno — purga con aire comprimido por sistema', unit: 'EA', csi: '32 84 23',
      material_cost_cents: { v: 0, prov: est('No material.') },
      labor_hours_per_unit: { v: 1, prov: est('Shut off, drain backflow, blow each zone, set controller to off — typical residential system.') },
      equipment_cost_cents: { v: 2500, prov: est('Towable or large portable compressor share per stop.') },
      waste_pct: { v: 0, prov: est('Service only.') } },
  ],
  quantity_rules: [
    { code: 'P-IRR-TAP-EA', assumption: 'One irrigation tap per single-family home — seeded only when irrigation is on the project schedule; confirm on site', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'P-IRR-BFP-PVB-EA', assumption: 'One backflow assembly per single-family irrigation system (PVB assumed; switch to RPZ if chemicals are injected) — only when irrigation is scheduled', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
    { code: 'P-IRR-CTRL-SMART-EA', assumption: 'One controller per single-family irrigation system — only when irrigation is scheduled; add zones from the design (no blueprint basis for lawn area)', when: { building_types: ['residential_sf'] }, qty: { basis: 'const' } },
  ],
  dependency_hints: [
    { after_trades: ['plumbing'], note: 'Needs the house water supply stub set; trench after rough grading and before final seeding or sod.' },
    { before_phase: 'punch', note: 'Adjust heads to finished grade and run the coverage check before punch-out and owner handoff.' },
  ],
});
