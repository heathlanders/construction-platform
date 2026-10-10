// Trade Knowledge Pack — plumbing (Plumbing). Wave 02, COMPLEMENT pattern: the phase-keyed hand recipe
// in task-buildout/plumbing.ts keeps producing the work steps (under-slab DWV → rough DWV & vents →
// rough water supply → gas → set fixtures & trim) for every plumbing-family trade; this pack adds
// glossary, hazards, QA, inspection checklists, extra code refs, equipment hints and assemblies the
// catalog lacks (expansion tank, PRV, water-heater changeout, sump pump, softener loop, frost-free bib).
// Dossier: docs/trade-packs/dossiers/plumbing.md. Sources: UFGS 22 00 00, Wis. Admin. Code SPS 382,
// IPC (reference only), 2010 ADA Standards, 29 CFR 1926 Subparts D, I, J, P, X, Z, AA.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = (note?: string) => ({ src: ['plumbing-ufgs-22-00-00'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const sps = (note?: string) => ({ src: ['plumbing-wi-sps382'], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const ipc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const ada = { src: ['plumbing-ada-2010'], confidence: 'verified' as const, last_verified: D };
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'plumbing',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Drain, waste and vent (DWV) piping, building drain and sewer connection, hot and cold water supply, water heaters, backflow protection and fixture setting for houses and light commercial buildings — tested and inspected before it is covered.',
    summary_es: 'Tubería de drenaje, desagüe y ventilación (DWV), drenaje del edificio y conexión al alcantarillado, suministro de agua fría y caliente, calentadores de agua, protección contra contraflujo e instalación de muebles sanitarios en casas y comercios ligeros, probados e inspeccionados antes de taparse.',
    glossary: [
      { term: 'DWV', term_es: 'DWV (drenaje, desagüe y ventilación)', def: 'Drain, waste and vent: the gravity piping that carries wastewater out and lets air in.', def_es: 'Drenaje, desagüe y ventilación: la tubería por gravedad que saca el agua residual y deja entrar aire.' },
      { term: 'Trap', term_es: 'Trampa (sifón)', def: 'U-shaped fitting that holds water to block sewer gas from coming back into the room.', def_es: 'Conexión en forma de U que retiene agua para impedir que el gas del drenaje regrese al cuarto.' },
      { term: 'Vent', term_es: 'Ventila (respiradero)', def: 'Pipe that lets air into the drain system so traps do not siphon dry.', def_es: 'Tubo que deja entrar aire al drenaje para que las trampas no se vacíen por sifonaje.' },
      { term: 'Cleanout', term_es: 'Registro de limpieza', def: 'Removable plug that gives access to snake a drain line.', def_es: 'Tapón removible que da acceso para destapar una línea de drenaje.' },
      { term: 'Fall (slope)', term_es: 'Caída (pendiente)', def: 'How much a horizontal drain drops per foot so it drains by gravity.', def_es: 'Cuánto baja un drenaje horizontal por cada pie para que corra por gravedad.' },
      { term: 'Stub-out', term_es: 'Salida (preparación)', def: 'Capped pipe end left through the wall or floor where a fixture will connect.', def_es: 'Extremo de tubo tapado que sale del muro o piso donde se conectará un mueble sanitario.' },
      { term: 'T&P valve', term_es: 'Válvula de alivio T&P', def: 'Temperature and pressure relief valve on a water heater that opens before the tank can burst.', def_es: 'Válvula de alivio de temperatura y presión del calentador que abre antes de que el tanque reviente.' },
      { term: 'Expansion tank', term_es: 'Tanque de expansión', def: 'Small pre-charged tank that absorbs water growth as it heats in a closed system.', def_es: 'Tanque pequeño precargado que absorbe el aumento de volumen del agua al calentarse en un sistema cerrado.' },
      { term: 'Backflow preventer', term_es: 'Preventor de contraflujo', def: 'Device that stops dirty water from being pulled back into the drinking water.', def_es: 'Dispositivo que impide que agua contaminada regrese al agua potable.' },
      { term: 'Nail plate', term_es: 'Placa protectora (anticlavos)', def: 'Steel plate over a pipe in a stud or joist so drywall screws and nails cannot hit it.', def_es: 'Placa de acero sobre un tubo en un montante o vigueta para que tornillos y clavos no lo perforen.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [],
  code_refs: {
    underground: [
      { section: '306', note: 'Trenching, excavation and backfill around piping', prov: ipc },
      { section: '704.1', note: 'Minimum slope of horizontal drainage piping', prov: ipc },
      { section: '312.2', note: 'Drainage and vent water test', prov: ipc },
      { section: '382.21(2)', note: 'Wisconsin test methods for sewer, building drain and DWV', code_type: 'WI SPS', prov: sps() },
    ],
    rough_in: [
      { section: '305', note: 'Protecting pipe from damage, freezing and corrosion', prov: ipc },
      { section: '307', note: 'Cutting and notching framing for piping', prov: ipc },
      { section: '308', note: 'Piping support and hanger spacing', prov: ipc },
      { section: '708', note: 'Cleanout locations and access', prov: ipc },
      { section: '312.3', note: 'Drainage and vent air test', prov: ipc },
      { section: '382.30(5)', note: 'Wisconsin minimum pitch of horizontal drains', code_type: 'WI SPS', prov: sps() },
      { section: '382.35', note: 'Wisconsin cleanout requirements', code_type: 'WI SPS', prov: sps() },
    ],
    water_supply: [
      { section: '604.8', note: 'Pressure-reducing valve where street pressure is high', prov: ipc },
      { section: '607.3', note: 'Thermal expansion control on closed systems', prov: ipc },
      { section: '608', note: 'Protecting potable water from backflow', prov: ipc },
      { section: '610', note: 'Disinfecting new potable water piping', prov: ipc },
      { section: '382.41', note: 'Wisconsin cross connection control', code_type: 'WI SPS', prov: sps() },
    ],
    final: [
      { section: '405', note: 'Fixture installation, clearances and setting', prov: ipc },
      { section: '504', note: 'Water heater safety devices and relief discharge', prov: ipc },
      { section: '312.10', note: 'Testing backflow prevention assemblies', prov: ipc },
      { section: '604', note: 'Water closets — clearances and grab bar space', code_type: 'ADA 2010', prov: ada },
      { section: '606', note: 'Lavatories and sinks — knee clearance, pipe protection', code_type: 'ADA 2010', prov: ada },
    ],
  },
  equipment: [
    { when: { title_re: 'under-?slab|underground|sewer|groundwork' }, type: 'compactor', reason: 'Compact bedding and backfill in lifts around under-slab and sewer piping', optional: true },
    { when: { title_re: 'under-?slab|underground|sewer' }, type: 'skid_steer', reason: 'Backfill trenches and move stone bedding', optional: true },
  ],
  hazards: [
    { id: 'trench_cave_in', hazard: 'Trench wall collapse burying a worker laying sewer or under-slab pipe', hazard_es: PENDING_ES, controls: ['Slope, bench, shore or shield any trench 5 ft or deeper unless it is in stable rock', 'A competent person inspects the trench daily and after rain before anyone enters'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, ppe: ['hard hat', 'high-visibility vest'], prov: osha('p') },
    { id: 'trench_egress', hazard: 'Trapped in a trench with no quick way out', hazard_es: PENDING_ES, controls: ['Provide a ladder, ramp or stairway in trenches 4 ft or deeper', 'Keep it within 25 ft of travel from every worker'], controls_es: PENDING_ES, osha_ref: '1926.651(c)(2)', severity: 3, prov: osha('p') },
    { id: 'spoil_edge', hazard: 'Spoil piles, pipe or equipment rolling into the trench', hazard_es: PENDING_ES, controls: ['Keep spoil and stacked pipe at least 2 ft back from the edge or use retaining devices', 'Chock pipe and keep machines back from the edge'], controls_es: PENDING_ES, osha_ref: '1926.651(j)(2)', severity: 3, prov: osha('p') },
    { id: 'sewer_gas', hazard: 'Sewer gas or low oxygen in a trench, manhole or tie-in pit (hydrogen sulfide, methane)', hazard_es: PENDING_ES, controls: ['Test the air before entry when a hazardous atmosphere could exist in excavations over 4 ft deep', 'Ventilate; keep rescue gear ready; never enter to rescue without protection'], controls_es: PENDING_ES, osha_ref: '1926.651(g)(1)(i)', severity: 4, prov: osha('p') },
    { id: 'confined_space', hazard: 'Entering crawlspaces, pits, tanks or manholes that may be permit-required confined spaces', hazard_es: PENDING_ES, controls: ['A competent person identifies confined spaces and permit spaces before work starts', 'Follow the permit, monitoring, attendant and rescue plan for any permit space'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('aa') },
    { id: 'hot_work_fire', hazard: 'Fire from soldering or brazing torches near framing, insulation or house wrap', hazard_es: PENDING_ES, controls: ['Keep a charged fire extinguisher at the torch work', 'Use a heat shield behind joints; watch the area for smoldering after the last joint'], controls_es: PENDING_ES, osha_ref: '1926.352(d)', severity: 3, ppe: ['safety glasses', 'leather gloves'], prov: osha('j') },
    { id: 'solvent_vapors', hazard: 'Breathing primer and solvent-cement vapors in closed rooms and crawlspaces', hazard_es: PENDING_ES, controls: ['Ventilate the work area; keep lids on cans when not in use', 'No torches or sparks near open primer or cement'], controls_es: PENDING_ES, osha_ref: '1926.55(a)', severity: 2, ppe: ['chemical-resistant gloves', 'safety glasses'], prov: osha('d') },
    { id: 'lead_exposure', hazard: 'Lead from old solder, lead pipe or painted surfaces disturbed during remodel and repipe', hazard_es: PENDING_ES, controls: ['Assess lead exposure before cutting or torching old lead materials', 'Use wet methods and HEPA cleanup; wash hands before eating'], controls_es: PENDING_ES, osha_ref: '1926.62(d)', severity: 3, prov: osha('z') },
    { id: 'silica_core_drill', hazard: 'Silica dust from core drilling or cutting concrete for pipe penetrations', hazard_es: PENDING_ES, controls: ['Core drill and saw with water feed or a shroud and HEPA vacuum as the task table allows', 'Use respirators when the control table requires them'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 3, ppe: ['safety glasses', 'respirator when required'], prov: osha('z') },
    { id: 'ladder', hazard: 'Falls from ladders while hanging pipe or working in attics', hazard_es: PENDING_ES, controls: ['Extend a portable ladder 3 ft above the landing it reaches', 'Face the ladder and keep three points of contact'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 2, prov: osha('x') },
    { id: 'power_tools', hazard: 'Cuts and kickback from reciprocating saws, drills and pipe threaders', hazard_es: PENDING_ES, controls: ['Keep guards on power tools that are built to take them', 'Brace right-angle drills against binding; unplug before changing bits or blades'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 2, ppe: ['safety glasses', 'gloves'], prov: osha('i') },
  ],
  qa_checklist: [
    { id: 'dwv_slope', phase: 'rough_in', item: 'Horizontal branch drains 2 in. and smaller run at least 1/4 in. per foot, larger branches at least 1/8 in. per foot; no back-pitch or sags.', item_es: tr('Los ramales horizontales de 2 pulg o menos tienen al menos 1/4 pulg de caída por pie y los más grandes al menos 1/8 pulg por pie; sin contrapendiente ni panzas.'), prov: sps('SPS 382.30(5)(a); IPC 704.1 is the model-code equivalent (reference only)') },
    { id: 'dwv_water_test', phase: 'rough_in', item: 'DWV holds a water test of at least a 10 ft head for 15 minutes (or 5 psi air for 15 minutes) with no drop before any pipe is covered.', item_es: tr('El DWV sostiene una prueba de agua de al menos 10 pies de columna por 15 minutos (o aire a 5 psi por 15 minutos) sin bajar, antes de tapar cualquier tubo.'), prov: sps('SPS 382.21(2)(g); AHJ may set its own method') },
    { id: 'sewer_test', phase: 'site_prep', item: 'Building sewer tested from the street connection with a 10 ft water head or 3 psi air held 15 minutes, before or after backfill as the AHJ allows.', item_es: tr('El albañal del edificio se prueba desde la conexión a la calle con 10 pies de columna de agua o aire a 3 psi por 15 minutos, antes o después de rellenar según permita la autoridad.'), prov: sps('SPS 382.21(2)(b)') },
    { id: 'supply_test', phase: 'rough_in', item: 'Water distribution piping holds a water test at no less than working pressure with no leaks; gauge reading recorded.', item_es: tr('La tubería de distribución de agua sostiene una prueba con agua a no menos de la presión de trabajo sin fugas; se anota la lectura del manómetro.'), prov: sps('SPS 382.21(2)(f)') },
    { id: 'cleanouts', phase: 'rough_in', item: 'Cleanouts installed at the base of stacks and at direction changes per code, and reachable after finishes (access panel or grade-level plug).', item_es: tr('Registros de limpieza instalados en la base de las bajantes y en los cambios de dirección según el código, y accesibles después de los acabados (panel de acceso o tapón a nivel).'), prov: { src: ['plumbing-wi-sps382', 'plumbing-ufgs-22-00-00'], confidence: 'verified', last_verified: D, note: 'SPS 382.35; UFGS 3.1.10 pipe cleanouts' } },
    { id: 'every_fixture_vented', phase: 'rough_in', item: 'Every trap is vented within the allowed trap-arm length; no air admittance valve used where the AHJ does not accept it.', item_es: tr('Cada trampa está ventilada dentro de la longitud permitida del brazo de trampa; no se usan válvulas de admisión de aire donde la autoridad no las acepta.'), prov: sps('SPS 382.31 vents; IPC Ch. 9 equivalent (reference only)') },
    { id: 'pipe_support', phase: 'rough_in', item: 'Pipe hung and strapped at the spacing for its material; no pipe resting on ducts, wires or other pipes.', item_es: tr('Tubería colgada y sujeta con el espaciamiento que corresponde a su material; ningún tubo apoyado sobre ductos, cables u otros tubos.'), prov: { src: ['plumbing-wi-sps382', 'plumbing-ufgs-22-00-00'], confidence: 'verified', last_verified: D, note: 'SPS 382.60 hangers and supports; UFGS 3.1.8.3' } },
    { id: 'nail_plates', phase: 'rough_in', item: 'Steel nail plates over every pipe bored or notched through studs or joists close to the face of the framing.', item_es: tr('Placas protectoras de acero sobre cada tubo que pasa por montantes o viguetas cerca de la cara del armazón.'), prov: { ...ipc, note: 'IPC 305 protection of components (reference only)' } },
    { id: 'freeze_protection', phase: 'rough_in', item: 'No water piping in exterior walls, unheated attics or crawlspaces unless insulated or heat-traced as designed; hose bibs are frost-free with the stem sloped to drain.', item_es: tr('No hay tubería de agua en muros exteriores, áticos o sótanos sin calefacción a menos que esté aislada o con cable calefactor según diseño; las llaves de manguera son anticongelantes con el vástago inclinado para drenar.'), prov: { src: ['icc-pa', 'plumbing-ufgs-22-00-00'], confidence: 'verified', last_verified: D, note: 'IPC 305 freezing (reference); UFGS 2.3.3 frostproof wall hydrants' } },
    { id: 'backflow_tested', phase: 'commissioning', item: 'Backflow assemblies tested by a certified tester with calibrated gauges; signed report on file. Hose bibs carry vacuum breakers.', item_es: tr('Los ensambles de contraflujo los prueba un técnico certificado con manómetros calibrados; el reporte firmado queda archivado. Las llaves de manguera llevan rompedor de vacío.'), prov: ufgs('3.9.1.1 test of backflow prevention assemblies') },
    { id: 'th_relief_discharge', phase: 'finishes_interior', item: 'Water heater T&P valve has no valve between it and the tank, and its full-size discharge pipe runs down to a safe, visible point (not a direct drain connection).', item_es: PENDING_ES, safety: true, prov: ufgs('3.2.1 relief valves; IPC 504 equivalent (reference only)') },
    { id: 'expansion_tank_set', phase: 'finishes_interior', item: 'Expansion tank on the cold supply between the heater and its shutoff, air charge set to match incoming water pressure.', item_es: tr('Tanque de expansión en la alimentación fría entre el calentador y su llave de paso, con la carga de aire ajustada a la presión del agua de entrada.'), prov: ufgs('3.2.5 expansion tank') },
    { id: 'dielectric', phase: 'finishes_interior', item: 'Dielectric unions or flanges where metal pipe meets the water heater; heat traps on inlet and outlet where the heater has none.', item_es: tr('Uniones o bridas dieléctricas donde el tubo metálico se conecta al calentador; trampas de calor en entrada y salida si el calentador no las trae.'), prov: ufgs('3.2.3 heat traps; 3.2.4 connections to water heaters') },
    { id: 'shower_pan_flood', phase: 'finishes_interior', item: 'Shower pan flood-tested: drain plugged below weep holes, 1 in. of water held 24 hours with no drop.', item_es: tr('Charola de regadera probada por inundación: desagüe tapado debajo de los orificios de drenaje, 1 pulg de agua por 24 horas sin bajar.'), prov: ufgs('3.9.1.2 shower pans') },
    { id: 'flush_disinfect', phase: 'commissioning', item: 'New potable piping flushed and disinfected before use; aerators cleaned; every fixture runs hot on the left and drains freely with no leaks.', item_es: tr('La tubería potable nueva se lava y desinfecta antes de usarse; se limpian los aireadores; cada mueble da agua caliente a la izquierda y desagua libre sin fugas.'), prov: { src: ['plumbing-ufgs-22-00-00', 'icc-pa'], confidence: 'verified', last_verified: D, note: 'UFGS 3.9.3 flushing / 3.9.5 disinfection; IPC 610 (reference only)' } },
  ],
  inspection_checklists: {
    underground: [
      { item: 'Pipe bedded on firm, rock-free base and graded with even fall to the building drain or sewer', item_es: tr('Tubo asentado sobre base firme sin piedras y con caída uniforme hacia el drenaje del edificio o el albañal'), ref: 'IPC 306' },
      { item: 'Under-slab DWV filled to a 10 ft head (or air test) and holding for the inspector', item_es: tr('DWV bajo losa lleno a 10 pies de columna (o prueba de aire) y sosteniendo para el inspector'), ref: 'SPS 382.21(2)' },
      { item: 'Trench protected or sloped; ladder in place for the inspector to enter', item_es: PENDING_ES, ref: '1926.652' },
      { item: 'Sleeves or wraps where pipe passes through footings and the slab', item_es: tr('Camisas o forros donde el tubo atraviesa zapatas y la losa'), ref: 'IPC 305' },
    ],
    rough_in: [
      { item: 'DWV under water or air test, gauge or standpipe visible', item_es: tr('DWV bajo prueba de agua o aire, con manómetro o tubo de columna visible'), ref: 'IPC 312' },
      { item: 'Drain slope, cleanouts and vent connections checked at each fixture', item_es: tr('Pendiente de drenaje, registros y conexiones de ventila revisados en cada mueble'), ref: 'IPC 704.1 / 708' },
      { item: 'Framing cut and bored within limits; nail plates installed', item_es: tr('Cortes y perforaciones en el armazón dentro de los límites; placas protectoras instaladas'), ref: 'IPC 307' },
      { item: 'Pipe supported; vent terminals through roof flashed', item_es: tr('Tubería soportada; salidas de ventila por el techo con tapajuntas'), ref: 'IPC 308' },
    ],
    water_supply: [
      { item: 'Supply piping under test at or above working pressure, no drop', item_es: tr('Tubería de suministro bajo prueba a la presión de trabajo o más, sin bajar'), ref: 'IPC 312.5' },
      { item: 'Backflow protection at hose bibs, boiler fill and irrigation connections', item_es: tr('Protección contra contraflujo en llaves de manguera, llenado de caldera y conexiones de riego'), ref: 'IPC 608' },
      { item: 'PRV where street pressure is high; expansion control where the system is closed', item_es: tr('Válvula reductora donde la presión de la calle es alta; control de expansión donde el sistema es cerrado'), ref: 'IPC 604.8 / 607.3' },
      { item: 'Shutoffs at the meter, water heater and each fixture', item_es: tr('Llaves de paso en el medidor, el calentador y cada mueble'), ref: 'IPC 606' },
    ],
    final: [
      { item: 'Fixtures set, secured, sealed and trapped; clearances to walls and other fixtures met', item_es: tr('Muebles colocados, fijos, sellados y con trampa; se cumplen las distancias a muros y otros muebles'), ref: 'IPC 405' },
      { item: 'Water heater T&P discharge, expansion tank, venting and seismic/drain pan as required', item_es: PENDING_ES, ref: 'IPC 504' },
      { item: 'Accessible restrooms: grab bar space, lavatory knee clearance, insulated or covered pipes under sinks', item_es: tr('Baños accesibles: espacio para barras de apoyo, espacio libre para rodillas en lavabo, tubos aislados o cubiertos bajo lavabos'), ref: 'ADA 604 / 606' },
      { item: 'Backflow test reports and fixture flow labels on site', item_es: tr('Reportes de prueba de contraflujo y etiquetas de caudal de muebles en obra'), ref: 'IPC 312.10' },
    ],
  },
  assemblies: [
    { code: 'P-PL-EXP-TANK-EA', name: 'Thermal expansion tank, 2 gal, on water heater cold supply, each', name_es: 'Tanque de expansión térmica de 2 gal en la alimentación fría del calentador, c/u', unit: 'EA', csi: '22 12 13',
      material_cost_cents: { v: 6000, prov: est('2-gal potable expansion tank + tee + fittings, national baseline 2026') }, labor_hours_per_unit: { v: 0.75, prov: est('cut in tee, mount/strap tank, set air charge') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted unit') } },
    { code: 'P-PL-PRV-EA', name: 'Water pressure-reducing valve, 3/4–1 in., with unions, each', name_es: 'Válvula reductora de presión de agua de 3/4 a 1 pulg con uniones, c/u', unit: 'EA', csi: '22 05 23',
      material_cost_cents: { v: 11000, prov: est('lead-free PRV with union ends + fittings, national baseline 2026') }, labor_hours_per_unit: { v: 1.5, prov: est('shut down, cut in after meter, set outlet pressure, test') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted unit') } },
    { code: 'P-PL-WH-CHANGEOUT-EA', name: 'Water heater changeout labor + connection kit (heater itself priced by P-FIX-WH), each', name_es: 'Mano de obra de reemplazo de calentador + juego de conexiones (el calentador va en P-FIX-WH), c/u', unit: 'EA', csi: '22 33 00',
      material_cost_cents: { v: 7500, prov: est('flex connectors, T&P discharge pipe, drain pan, dielectric fittings, gas/vent fittings share, 2026') }, labor_hours_per_unit: { v: 3.5, prov: est('drain + disconnect old unit, set new, reconnect, test relief and venting') },
      equipment_cost_cents: { v: 3000, prov: est('haul-away / disposal fee + hand truck') }, waste_pct: { v: 0, prov: est('kit') } },
    { code: 'P-PL-SUMP-PUMP-EA', name: 'Sump pump, 1/3 HP submersible, with check valve and discharge to exterior, in existing pit, each', name_es: 'Bomba de sumidero sumergible de 1/3 HP con válvula de retención y descarga al exterior, en fosa existente, c/u', unit: 'EA', csi: '22 14 29',
      material_cost_cents: { v: 25000, prov: est('1/3 HP submersible pump + check valve + PVC discharge + wall penetration, 2026') }, labor_hours_per_unit: { v: 3, prov: est('set pump, run discharge, seal wall, test cycle') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('discharge pipe offcuts') } },
    { code: 'P-PL-SOFTENER-LOOP-EA', name: 'Water softener rough-in loop (bypass valves, drain standpipe, capped connections), each', name_es: 'Preparación para suavizador de agua (válvulas de derivación, tubo de desagüe, conexiones tapadas), c/u', unit: 'EA', csi: '22 31 00',
      material_cost_cents: { v: 9000, prov: est('3-valve bypass, fittings, standpipe + air gap fitting, 2026') }, labor_hours_per_unit: { v: 2.5, prov: est('loop off main after hose-bib branch, drain with air gap') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 5, prov: est('pipe offcuts') } },
    { code: 'P-PL-HOSEBIB-FF-EA', name: 'Frost-free wall hydrant (hose bib) with vacuum breaker, each', name_es: 'Llave de manguera anticongelante con rompedor de vacío, c/u', unit: 'EA', csi: '22 41 00',
      material_cost_cents: { v: 4500, prov: est('8–12 in. frost-free sillcock with integral vacuum breaker + fittings, 2026') }, labor_hours_per_unit: { v: 1.25, prov: est('bore rim, pitch to drain, connect and seal exterior') },
      equipment_cost_cents: { v: 0, prov: est('hand tools only') }, waste_pct: { v: 0, prov: est('counted unit') } },
  ],
  quantity_rules: [
    { code: 'P-PL-EXP-TANK-EA', assumption: 'One expansion tank per scheduled water heater (closed system with PRV or check valve) — remove if the service is open', qty: { basis: { fixture: 'water_heater' } } },
    { code: 'P-PL-HOSEBIB-FF-EA', assumption: 'Single-family house — assume 2 frost-free hose bibs (front and back) until the plan locations are counted', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 2 } },
    { code: 'P-CLEANOUT', assumption: 'Single-family house — assume 3 cleanouts (building drain at wall + 2 stack bases) until the DWV layout is read', when: { building_types: ['residential_sf'] }, qty: { basis: 'const', mul: 3 } },
  ],
  dependency_hints: [
    { after_trades: ['excavation'], note: 'Under-slab and sewer piping goes in after excavation and before the slab pour; the underground test must pass first.' },
    { after_trades: ['framing'], note: 'Rough DWV and supply start once framing is complete and before insulation and drywall cover the walls.' },
    { before_phase: 'insulation', note: 'Rough-in and water supply inspections must pass before insulation and drywall.' },
  ],
});
