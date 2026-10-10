// Trade Knowledge Pack — traffic_signals_lighting (Traffic Signals / Street Lighting / ITS). Wave 19 —
// NEW-TRADE pattern, heavy_civil, permit_trade null → no gating inspections and no code_refs (the work is
// DOT / municipal-inspected, not AHJ-permitted); DOT hold points live in inspection_checklists.
// Dossier: docs/trade-packs/dossiers/traffic_signals_lighting.md. Sources: FHWA MUTCD 11th ed. Part 4,
// WisDOT Standard Specifications 2025 §§531, 651–659, WisDOT Average Unit Price List (FY 2023–2025),
// FHWA Lighting Handbook (2012), 29 CFR 1926 Subparts G, K, L, M, O, P, CC.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const osha = (sub: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const aup = (note: string) => ({ src: ['excavation-wisdot-aup'], confidence: 'derived' as const, last_verified: D, note });
const ss = (n: '531' | '651' | '652' | '653' | '654' | '655' | '656' | '657' | '658' | '659') =>
  ({ src: [`traffic_signals_lighting-wisdot-ss-${n}`], confidence: 'verified' as const, last_verified: D });
const mutcd = { src: ['traffic_signals_lighting-mutcd-part4'], confidence: 'verified' as const, last_verified: D };
const tr = (text: string) => ({ status: 'translated' as const, text });

const SIGNAL = 'traffic\\s+signal|signali[sz]ed|signal\\s+(?:pole|head|face|cabinet|install|modif|rebuild)|mast\\s+arm|monotube|pedestrian\\s+(?:signal|push)|ped\\s+signal|\\bITS\\b|ramp\\s+meter';
const LIGHTING = 'street\\s*light|roadway\\s+light|highway\\s+light|site\\s+light|parking\\s+(?:lot\\s+)?light|light(?:ing)?\\s+(?:pole|unit|standard)|luminaire|underdeck\\s+light|walkway\\s+light';
// Labor hours below assume a ≈$95/hr burdened electrician/lineworker crew rate when splitting the WisDOT
// furnished-and-installed averages into material / labor / equipment.

export default definePack({
  key: 'traffic_signals_lighting',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Builds traffic signals, street and roadway lighting and roadside ITS gear: drilled pole bases, conduit and pull boxes, signal poles with mast arms, signal and pedestrian heads, light poles and luminaires, cabinet wiring, grounding, testing and turn-on. Signal timing and lighting design come from the agency or its engineer.',
    summary_es: 'Construye semáforos, alumbrado público y de carreteras y equipos ITS en la vía: bases perforadas para postes, ductos y cajas de registro, postes de semáforo con brazo, cabezas vehiculares y peatonales, postes y luminarias, cableado de gabinetes, puesta a tierra, pruebas y encendido. La programación de tiempos y el diseño de iluminación los define la agencia o su ingeniero.',
    glossary: [
      { term: 'Mast arm (monotube arm)', term_es: 'Brazo del semáforo (brazo monotubo)', def: 'The horizontal arm bolted to a signal pole that holds the signal heads out over the traffic lanes.', def_es: 'El brazo horizontal atornillado al poste que sostiene las cabezas del semáforo sobre los carriles.' },
      { term: 'Signal head (signal face)', term_es: 'Cabeza del semáforo (cara)', def: 'The housing with the red, yellow and green (or arrow) lenses for one approach.', def_es: 'La caja con los lentes rojo, amarillo y verde (o flechas) para un acceso.' },
      { term: 'Drilled shaft base', term_es: 'Base de pilote perforado', def: 'A round concrete foundation poured in an augered hole, with a rebar cage and anchor rods cast in to bolt the pole to.', def_es: 'Una cimentación redonda de concreto colada en un hoyo perforado, con jaula de varilla y pernos de anclaje para fijar el poste.' },
      { term: 'Anchor rod assembly', term_es: 'Conjunto de pernos de anclaje', def: 'The set of threaded rods held in a template so they come out of the base plumb, at the right height and in the bolt pattern of the pole.', def_es: 'El juego de varillas roscadas sujetas con plantilla para que salgan de la base a plomo, a la altura correcta y con el patrón del poste.' },
      { term: 'Pull box', term_es: 'Caja de registro (caja de jalado)', def: 'A buried box with a lid where conduit runs meet, so cable can be pulled and slack stored.', def_es: 'Una caja enterrada con tapa donde se juntan los ductos, para jalar el cable y guardar la reserva.' },
      { term: 'Controller cabinet', term_es: 'Gabinete del controlador', def: 'The roadside cabinet holding the signal controller, detector cards and the field terminals for every signal and push-button wire.', def_es: 'El gabinete en la vía que contiene el controlador, las tarjetas de detección y las terminales de cada cable de semáforo y botón.' },
      { term: 'Detector loop', term_es: 'Lazo detector', def: 'A wire loop sawed into the pavement (or a camera/radar unit) that tells the controller a vehicle is waiting.', def_es: 'Un lazo de cable cortado en el pavimento (o una cámara o radar) que avisa al controlador que hay un vehículo esperando.' },
      { term: 'Transformer (breakaway) base', term_es: 'Base de transformador (desprendible)', def: 'A cast aluminum base between a light pole and its concrete base that breaks away when hit, with a door for the splices and fuses.', def_es: 'Una base de aluminio fundido entre el poste y su base de concreto que se desprende al ser golpeada, con puerta para empalmes y fusibles.' },
      { term: 'Megger test', term_es: 'Prueba de megóhmetro', def: 'An insulation-resistance test of every conductor before hookup, to catch nicked or wet cable.', def_es: 'Una prueba de resistencia de aislamiento de cada conductor antes de conectar, para detectar cable dañado o mojado.' },
      { term: 'Turn-on (signal activation)', term_es: 'Encendido (activación del semáforo)', def: 'The moment the agency accepts the inspected signal and it switches from covered or flashing to normal stop-and-go operation.', def_es: 'El momento en que la agencia acepta el semáforo inspeccionado y pasa de cubierto o intermitente a operación normal.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'signalized_intersection',
      example_title: 'Traffic signal installation — mast arm poles, heads and cabinet',
      when: { title_re: SIGNAL },
      priority: 10,
      steps: [
        {
          title: 'Set traffic control, locate utilities and stake bases',
          instruction: 'Set the approved work-zone traffic control before anyone works in the road. Confirm the one-call (811) marks and hand-expose any line near a base or conduit route. Stake every pole base, cabinet base and pull box from the plans and check overhead power-line clearance at each pole and arm location.',
          tools: ['signal plans', 'marking paint', 'measuring wheel', 'vacuum excavation or shovel'],
          materials: ['work-zone signs, cones and drums per the traffic control plan', 'offset stakes'],
          safety_ids: ['work_zone_traffic', 'utility_strike', 'overhead_lines'],
          qa_ids: ['locates_confirmed'],
        },
        {
          title: 'Drill and pour the signal pole bases',
          instruction: 'Auger each shaft to the plan depth and diameter, plumb, casing it where the soil caves or water comes in. Set the rebar cage and the anchor rod assembly in its template at the plan height and orientation, with conduit sweeps in place, then pour in one continuous lift. Protect the rod threads and cure the base before any pole goes on it.',
          detail: 'Twisted, out-of-plumb or wrong-pattern anchor rods mean the base comes out and is redone — check the template before the pour, not after.',
          tools: ['drill rig with auger', 'casing', 'level', 'anchor rod template'],
          materials: ['rebar cage', 'anchor rod assembly', 'conduit sweeps', 'concrete'],
          safety_ids: ['open_shaft', 'utility_strike', 'work_zone_traffic', 'backing_vehicles'],
          qa_ids: ['anchor_rods_true', 'base_cured'],
        },
        {
          title: 'Trench or bore conduit and set pull boxes',
          instruction: 'Trench to line and grade, or bore under pavement and sidewalk without disturbing them. Use one conduit size per run, cap open ends, and pull tracer wire in runs left for future cable. Set pull boxes on drain rock at final grade. Get the open trench inspected before backfilling in compacted layers.',
          tools: ['trencher or backhoe', 'directional bore or jack-and-bore rig', 'plate compactor'],
          materials: ['rigid conduit (nonmetallic or galvanized steel)', 'pull boxes with frames and lids', 'drain rock', 'tracer wire', 'select backfill'],
          safety_ids: ['trench_cave_in', 'utility_strike', 'work_zone_traffic'],
          qa_ids: ['conduit_inspected_before_backfill', 'pull_box_grade'],
        },
        {
          title: 'Erect poles and mast arms, then hang the heads covered',
          instruction: 'With the base cured, set the pole on its leveling nuts, plumb it and tighten the anchor nuts to the specified procedure. Fly the mast arm and bolt it with the approved high-strength bolts. Hang the signal heads soon after the arm goes up to damp vibration, aim them at their lanes, and keep every face hooded or turned away until turn-on.',
          tools: ['crane or boom truck', 'aerial lift (bucket truck)', 'torque wrench / turn-of-nut marks', 'tag lines'],
          materials: ['signal pole and mast arm', 'high-strength bolt assemblies', 'signal heads and mounting hardware', 'head covers'],
          safety_ids: ['suspended_load', 'overhead_lines', 'aerial_lift_fall', 'work_zone_traffic'],
          qa_ids: ['pole_plumb_bolts', 'heads_covered', 'head_height_aim'],
        },
        {
          title: 'Pull cable, wire the cabinet and ground the system',
          instruction: 'Pull signal, detector and push-button cable in continuous lengths — splice only at pole or base access points, never in pull boxes — leaving the specified slack. Terminate by phase with the conductors color-identified, ground spare conductors in the cabinet, and bond every pole and the service to the grounding electrodes. Megger every conductor before final hookup.',
          tools: ['cable puller', 'megohmmeter (insulation tester)', 'crimpers and terminal tools', 'exothermic weld kit'],
          materials: ['multi-conductor signal cable', 'loop lead-in / detector cable', 'ground rods and grounding conductor', 'labels'],
          safety_ids: ['energized_circuits', 'lockout', 'aerial_lift_fall'],
          qa_ids: ['no_pull_box_splices', 'megger_passed', 'grounding_complete'],
        },
        {
          title: 'Signal inspection, turn-on and burn-in',
          instruction: 'Request the agency signal inspection ahead of time and fix every punch item before turn-on. At turn-on, the controller starts per the timing the agency issued; remove the head covers only when the signal goes live, and change from flash to normal operation at the start of the major-street green. Run the signal for the required continuous period and hand over as-built drawings.',
          tools: ['laptop / controller programming cable', 'radio', 'stopwatch'],
          materials: ['as-built drawings', 'cabinet wiring diagram'],
          safety_ids: ['work_zone_traffic', 'energized_circuits'],
          qa_ids: ['timing_from_agency', 'turn_on_sequence', 'burn_in_complete'],
        },
      ],
    },
    {
      id: 'street_lighting',
      example_title: 'Street lighting — install light poles and LED luminaires',
      when: { title_re: LIGHTING },
      priority: 20,
      steps: [
        {
          title: 'Locate, stake and plan the circuit',
          instruction: 'Confirm the 811 marks, stake each light base and the service or control cabinet from the lighting plan, and check overhead line clearance at each pole. Set traffic control for any work in or next to the road.',
          tools: ['lighting plans', 'marking paint', 'measuring wheel'],
          materials: ['offset stakes', 'work-zone signs and cones as needed'],
          safety_ids: ['utility_strike', 'overhead_lines', 'work_zone_traffic'],
          qa_ids: ['locates_confirmed'],
        },
        {
          title: 'Build the light pole bases',
          instruction: 'Auger or form each base to the plan size, set the anchor rods in a template at the right projection and bolt circle with the conduit sweep in place, and pour. Leave the top level and let it cure before setting a pole.',
          tools: ['auger or mini excavator', 'anchor rod template', 'level'],
          materials: ['anchor rods', 'conduit sweep', 'concrete', 'rebar where detailed'],
          safety_ids: ['open_shaft', 'utility_strike', 'backing_vehicles'],
          qa_ids: ['anchor_rods_true', 'base_cured'],
        },
        {
          title: 'Run conduit or cable-in-duct and pull wire',
          instruction: 'Trench or plow the conduit or cable-in-duct at the specified depth, set pull boxes at grade, and inspect before backfilling. Pull the lighting conductors in continuous lengths and splice only in pole hand holes or transformer bases, leaving a neat service loop.',
          tools: ['trencher or cable plow', 'cable puller', 'plate compactor'],
          materials: ['conduit or cable-in-duct', 'lighting wire', 'pull boxes', 'select backfill'],
          safety_ids: ['trench_cave_in', 'utility_strike'],
          qa_ids: ['conduit_inspected_before_backfill', 'no_pull_box_splices'],
        },
        {
          title: 'Set poles, arms and luminaires',
          instruction: 'Bolt the breakaway (transformer) base and pole to the anchor rods, plumb the pole and tighten. Mount the arm and luminaire level along the road with the specified rake, handling the fixture with clean gloves. Fuse each luminaire at the hand hole in breakaway fuse holders and bond the equipment ground to the pole or base lug.',
          tools: ['boom truck or crane', 'aerial lift (bucket truck)', 'torque wrench', 'tag lines'],
          materials: ['transformer base', 'light pole', 'luminaire arm', 'LED luminaire', 'breakaway fuse holders and fuses'],
          safety_ids: ['suspended_load', 'overhead_lines', 'aerial_lift_fall'],
          qa_ids: ['pole_plumb_bolts', 'luminaire_level_fused', 'grounding_complete'],
        },
        {
          title: 'Test, energize and burn in',
          instruction: 'Megger the circuits with loads disconnected, confirm every circuit is continuous and wired to the layout, then energize through the service after the utility connection. Run the system the required consecutive nights, replace anything that fails and restart its burn-in, and turn in as-builts.',
          tools: ['megohmmeter (insulation tester)', 'multimeter', 'ground resistance tester'],
          materials: ['as-built drawings', 'circuit identification plaques'],
          safety_ids: ['energized_circuits', 'lockout'],
          qa_ids: ['megger_passed', 'burn_in_complete'],
        },
      ],
    },
  ],
  equipment: [
    { when: { title_re: `${SIGNAL}|${LIGHTING}` }, step_re: 'conduit|trench', type: 'trencher', reason: 'Cut narrow conduit trenches between bases and pull boxes', optional: true },
    { when: { title_re: `${SIGNAL}|${LIGHTING}` }, step_re: 'conduit|trench|pour|build the light', type: 'backhoe', reason: 'Dig pull-box holes and light bases, backfill trenches' },
    { when: { title_re: `${SIGNAL}|${LIGHTING}` }, step_re: 'erect|set poles|mast arm', type: 'crane', reason: 'Set signal poles and fly mast arms; boom truck for light poles' },
    { when: { title_re: `${SIGNAL}|${LIGHTING}` }, step_re: 'erect|set poles|wire the cabinet', type: 'boom_lift', reason: 'Bucket-truck access to hang and aim heads, mount luminaires and terminate cable at height' },
    { when: { title_re: `${SIGNAL}|${LIGHTING}` }, step_re: 'conduit|trench', type: 'compactor', reason: 'Compact trench backfill in layers' },
    { when: { title_re: `${SIGNAL}|${LIGHTING}` }, step_re: 'drill and pour|build the light', type: 'dump_truck', reason: 'Haul drilled-shaft spoil off site', optional: true },
  ],
  hazards: [
    { id: 'work_zone_traffic', hazard: 'Struck by passing traffic while working in or beside live lanes', hazard_es: PENDING_ES, controls: ['Set the approved temporary traffic control plan before work starts, with signs, channelizing devices and flaggers per MUTCD Part 6', 'Flaggers trained and wearing high-visibility garments', 'Keep crews and equipment inside the protected work area; never turn your back to traffic'], controls_es: PENDING_ES, osha_ref: '1926.201(a)', severity: 4, ppe: ['high-visibility vest (Class 2/3)', 'hard hat'], prov: { src: ['ecfr-1926-g', 'asphalt_paving-mutcd-part6'], confidence: 'verified', last_verified: D } },
    { id: 'energized_circuits', hazard: 'Electric shock from energized service, signal or lighting circuits', hazard_es: PENDING_ES, controls: ['Do not work where you could contact an energized circuit unless it is de-energized and grounded or guarded by insulation', 'Treat every conductor as live until tested', 'Only qualified electricians terminate, test and energize'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, ppe: ['rated insulating gloves for the voltage', 'safety glasses'], prov: osha('k') },
    { id: 'lockout', hazard: 'A de-energized circuit being switched back on by another person or the utility', hazard_es: PENDING_ES, controls: ['Lock and tag the service disconnect or cabinet breaker before work', 'Test for absence of voltage after locking out', 'Remove locks and tags only by the person who placed them'], controls_es: PENDING_ES, osha_ref: '1926.417', severity: 4, prov: osha('k') },
    { id: 'overhead_lines', hazard: 'Crane, boom truck, aerial lift or pole contacting an overhead power line', hazard_es: PENDING_ES, controls: ['Identify the work zone and every power line within 20 ft of where the equipment, load or pole could reach', 'Keep 20 ft clearance (more for higher voltage) or have the utility de-energize and ground the line', 'Use a dedicated spotter and a planning meeting when working near lines'], controls_es: PENDING_ES, osha_ref: '1926.1408(a)', severity: 4, prov: osha('cc') },
    { id: 'suspended_load', hazard: 'Struck or crushed by a pole or mast arm being lifted, swung or set', hazard_es: PENDING_ES, controls: ['No one under or in the fall zone of a suspended pole or arm', 'Control the load with tag lines', 'Use a rigging plan and inspected slings rated for the load'], controls_es: PENDING_ES, osha_ref: '1926.1425(b)', severity: 4, ppe: ['hard hat', 'gloves'], prov: osha('cc') },
    { id: 'aerial_lift_fall', hazard: 'Falling or being thrown from a bucket truck or aerial lift', hazard_es: PENDING_ES, controls: ['Test lift controls each day before use', 'Wear a harness or restraint with the lanyard tied to the boom or basket', 'Stand on the basket floor — never on the rail or a ladder in the bucket; set outriggers on pads'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 3, ppe: ['harness or restraint belt with lanyard', 'hard hat'], prov: osha('l') },
    { id: 'utility_strike', hazard: 'Striking a buried gas, electric, fiber or water line while drilling, trenching or boring', hazard_es: PENDING_ES, controls: ['Call 811 and wait for marks before any digging, drilling or boring', 'Hand- or vacuum-expose lines within the tolerance zone', 'Stop and call the owner if an unmarked line is found'], controls_es: PENDING_ES, osha_ref: '1926.651(b)(1)', severity: 4, prov: osha('p') },
    { id: 'trench_cave_in', hazard: 'Cave-in of a conduit trench or pull-box excavation on a worker', hazard_es: PENDING_ES, controls: ['Slope, shore or box any excavation 5 ft or deeper before entry', 'Keep spoil at least 2 ft from the edge', 'Competent person inspects excavations daily and after rain'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'open_shaft', hazard: 'Falling into an open drilled shaft or base hole', hazard_es: PENDING_ES, controls: ['Cover or barricade every open shaft whenever the crew steps away', 'Pour or cover holes the same day where traffic or pedestrians pass'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(7)(ii)', severity: 3, prov: osha('m') },
    { id: 'backing_vehicles', hazard: 'Run over by a backing drill rig, concrete truck or dump truck', hazard_es: PENDING_ES, controls: ['Vehicles with an obstructed rear view back only with a working reverse alarm or a spotter', 'Keep people out of the backing path'], controls_es: PENDING_ES, osha_ref: '1926.601(b)(4)', severity: 3, prov: osha('o') },
  ],
  qa_checklist: [
    { id: 'locates_confirmed', item: 'One-call (811) ticket active and marks confirmed at every base, pull box and conduit route; conflicting lines exposed before drilling or boring.', item_es: PENDING_ES, safety: true, prov: { src: ['ecfr-1926-p', 'traffic_signals_lighting-wisdot-ss-531'], confidence: 'verified', last_verified: D } },
    { id: 'anchor_rods_true', item: 'Anchor rods set in a template: plumb, correct projection, bolt circle and orientation, threads protected, never welded; shaft plumb within 1/8 in. per ft.', item_es: tr('Pernos de anclaje colocados con plantilla: a plomo, con la proyección, círculo de pernos y orientación correctos, roscas protegidas, nunca soldados; pozo a plomo dentro de 1/8 pulg. por pie.'), prov: ss('531') },
    { id: 'base_cured', item: 'Base poured in one continuous lift with a level top; no pole erected until the concrete reaches the specified strength or cure time.', item_es: tr('Base colada en una sola colada continua con la parte superior nivelada; ningún poste se monta hasta que el concreto alcance la resistencia o tiempo de curado especificados.'), prov: ss('531') },
    { id: 'conduit_inspected_before_backfill', item: 'Conduit trench true to line and grade, one size per run, ends capped, tracer wire in future runs — inspected before any backfill; backfill in compacted layers 12 in. or less.', item_es: tr('Zanja del ducto a línea y nivel, un solo tamaño por tramo, extremos tapados, cable trazador en tramos futuros — inspeccionada antes de rellenar; relleno compactado en capas de 12 pulg. o menos.'), prov: { src: ['traffic_signals_lighting-wisdot-ss-652', 'traffic_signals_lighting-wisdot-ss-651'], confidence: 'verified', last_verified: D } },
    { id: 'pull_box_grade', item: 'Pull boxes set at final grade on drain rock with frame and solid lid marked for the system (electric or communications).', item_es: tr('Cajas de registro a nivel final sobre piedra de drenaje con marco y tapa sólida marcada según el sistema (eléctrico o comunicaciones).'), prov: ss('653') },
    { id: 'pole_plumb_bolts', item: 'Pole plumb after erection; high-strength bolts stored dry, pre-installation tested and tightened by the approved procedure; no field welding without approval.', item_es: tr('Poste a plomo después de montarlo; tornillos de alta resistencia guardados secos, probados antes de instalar y apretados con el procedimiento aprobado; sin soldadura en campo sin aprobación.'), prov: ss('657') },
    { id: 'heads_covered', item: 'Signal and pedestrian faces hooded or turned away from traffic from the day they are hung until the signal is accepted and turned on.', item_es: PENDING_ES, safety: true, prov: { src: ['traffic_signals_lighting-wisdot-ss-658', 'traffic_signals_lighting-mutcd-part4'], confidence: 'verified', last_verified: D } },
    { id: 'head_height_aim', item: 'Heads over the roadway at least 15 ft clear to the bottom of the housing, aimed at their lanes, mounting voids sealed and faces fixed so they cannot turn.', item_es: tr('Cabezas sobre la calzada con al menos 15 pies libres hasta el fondo de la caja, apuntadas a sus carriles, huecos del montaje sellados y caras fijas para que no giren.'), prov: { src: ['traffic_signals_lighting-mutcd-part4', 'traffic_signals_lighting-wisdot-ss-658'], confidence: 'verified', last_verified: D } },
    { id: 'no_pull_box_splices', item: 'Conductors continuous between terminations; splices only at pole or base access points (none in pull boxes or conduit); specified slack left at poles, heads, cabinet and pull boxes.', item_es: tr('Conductores continuos entre terminaciones; empalmes solo en registros de poste o base (ninguno en cajas de registro ni ductos); reserva especificada en postes, cabezas, gabinete y cajas.'), prov: ss('655') },
    { id: 'megger_passed', item: 'Every conductor meggered with loads disconnected — to ground and between conductors — and results submitted; circuits shown continuous, free of shorts and wired to the layout.', item_es: tr('Cada conductor probado con megóhmetro con cargas desconectadas — a tierra y entre conductores — y resultados entregados; circuitos continuos, sin cortos y cableados según el diagrama.'), prov: ss('651') },
    { id: 'grounding_complete', item: 'Equipment grounding conductor bonded to every pole or transformer-base lug and the cabinet bus; electrode connections exothermically welded.', item_es: PENDING_ES, safety: true, prov: { src: ['traffic_signals_lighting-wisdot-ss-651', 'traffic_signals_lighting-wisdot-ss-656', 'traffic_signals_lighting-wisdot-ss-659'], confidence: 'verified', last_verified: D } },
    { id: 'luminaire_level_fused', item: 'Luminaires level along the road with the specified rake, installed clean; each fused individually in a breakaway fuse holder at the hand hole.', item_es: tr('Luminarias niveladas a lo largo de la vía con la inclinación especificada, instaladas limpias; cada una con fusible propio en portafusibles desprendible en el registro del poste.'), prov: ss('659') },
    { id: 'timing_from_agency', item: 'Controller programmed only with the timing plan issued by the agency or its engineer (yellow change and red clearance included) — never field-guessed.', item_es: PENDING_ES, safety: true, prov: mutcd },
    { id: 'turn_on_sequence', item: 'Turn-on authorized after inspection punch items are fixed; covers removed at turn-on and flash-to-normal change made at the start of the major-street green.', item_es: PENDING_ES, safety: true, prov: { src: ['traffic_signals_lighting-mutcd-part4', 'traffic_signals_lighting-wisdot-ss-651'], confidence: 'verified', last_verified: D } },
    { id: 'burn_in_complete', item: 'Burn-in run completed without failure (WisDOT: 72 consecutive hours for signals, 20 consecutive nights for lighting); failed parts replaced and re-run; as-builts handed over.', item_es: tr('Periodo de prueba en operación completado sin fallas (WisDOT: 72 horas seguidas para semáforos, 20 noches seguidas para alumbrado); partes falladas reemplazadas y probadas de nuevo.'), prov: ss('651') },
  ],
  inspection_checklists: {
    pole_base_anchor_bolt: [
      { item: 'Shaft depth and diameter per plans, plumb, casing in place where soil caves or water enters', item_es: tr('Profundidad y diámetro del pozo según planos, a plomo, con ademe donde el suelo se derrumba o entra agua'), ref: 'WisDOT 531.3.2' },
      { item: 'Rebar cage clearance, anchor rod template orientation, projection and bolt circle checked before the pour', item_es: tr('Recubrimiento de la jaula, orientación de la plantilla de pernos, proyección y círculo de pernos revisados antes de colar'), ref: 'WisDOT 531.3.3' },
      { item: 'Conduit sweeps and ground rod placed as detailed', item_es: tr('Codos de ducto y varilla de tierra colocados según detalle'), ref: 'WisDOT 531.3.3' },
      { item: 'Concrete strength or cure time reached before the pole is erected', item_es: tr('Resistencia o tiempo de curado del concreto alcanzado antes de montar el poste'), ref: 'WisDOT 531.3.3' },
    ],
    conduit_pull_box: [
      { item: 'Open trench inspected: line, grade, depth, conduit size per run, ends capped', item_es: tr('Zanja abierta inspeccionada: línea, nivel, profundidad, tamaño del ducto por tramo, extremos tapados'), ref: 'WisDOT 652.3' },
      { item: 'Tracer wire installed and anchored at each access point', item_es: tr('Cable trazador instalado y anclado en cada punto de acceso'), ref: 'WisDOT 652.3.1.1' },
      { item: 'Pull boxes at grade on drain rock with correct lids; backfill compacted in layers', item_es: tr('Cajas de registro a nivel sobre piedra de drenaje con tapas correctas; relleno compactado en capas'), ref: 'WisDOT 653.3' },
    ],
    signal_turn_on_acceptance: [
      { item: 'Signal inspection requested ahead (WisDOT: 5 business days) and all punch items corrected', item_es: tr('Inspección del semáforo solicitada con anticipación (WisDOT: 5 días hábiles) y todas las observaciones corregidas'), ref: 'WisDOT 651.3.3' },
      { item: 'Megger results submitted; every circuit tested and operating as designed', item_es: tr('Resultados del megóhmetro entregados; cada circuito probado y operando según diseño'), ref: 'WisDOT 651.3.3' },
      { item: 'Heads aimed and at the required clearance; ped heads and push buttons placed and signed', item_es: tr('Cabezas apuntadas y a la altura libre requerida; cabezas peatonales y botones colocados y señalizados'), ref: 'MUTCD 4D.09' },
      { item: 'Agency timing loaded; flash-to-normal at the start of major-street green; covers removed at turn-on', item_es: PENDING_ES, ref: 'MUTCD 4G.04' },
      { item: 'Continuous operation run completed with all special functions (e.g. preemption) working', item_es: tr('Periodo de operación continua completado con todas las funciones especiales (p. ej., preferencia) funcionando'), ref: 'WisDOT 651.3.3' },
    ],
    lighting_ground_burn_in: [
      { item: 'Equipment ground bonded at every pole or transformer base; electrode welds made', item_es: PENDING_ES, ref: 'WisDOT 659.3.2' },
      { item: 'Each luminaire fused at the hand hole; splices only in hand holes or bases', item_es: tr('Cada luminaria con fusible en el registro del poste; empalmes solo en registros o bases'), ref: 'WisDOT 659.3.2' },
      { item: 'Insulation-resistance test passed before energizing', item_es: tr('Prueba de resistencia de aislamiento aprobada antes de energizar'), ref: 'WisDOT 651.3.3' },
      { item: 'Night burn-in run completed without failures; circuit plaques installed', item_es: tr('Periodo de prueba nocturno completado sin fallas; placas de identificación de circuito instaladas'), ref: 'WisDOT 651.3.3' },
    ],
  },
  assemblies: [
    { code: 'HC-SIG-MAST-POLE-EA', name: 'Steel signal pole with ≈30 ft monotube mast arm — furnish and erect, each', name_es: 'Poste de semáforo de acero con brazo monotubo de ≈30 pies — suministrar y montar, c/u', unit: 'EA', csi: '34 41 13',
      description: 'Pole + arm only; drilled-shaft base, heads, cable and cabinet are separate lines.',
      material_cost_cents: { v: 1500000, prov: aup('WisDOT 657.0350 Poles Type 10 FY23–24 avg ≈ $10,851 + 657.0530 Monotube Arms 30-FT FY23–25 avg ≈ $6,762 = ≈ $17,600 furnished and erected; ≈ $15,000 taken as material.') },
      labor_hours_per_unit: { v: 16, prov: aup('Balance of the WisDOT 657 averages: ≈16 crew-hr at ≈$95/hr burdened to set, plumb, bolt and fly the arm.') },
      equipment_cost_cents: { v: 60000, prov: aup('Crane / boom truck + bucket truck share of the WisDOT 657 averages.') },
      waste_pct: { v: 0, prov: est('fabricated item') } },
    { code: 'HC-SIG-DRILLED-BASE-EA', name: 'Drilled-shaft concrete base for a mast-arm signal pole, with anchor rods, each', name_es: 'Base de concreto en pozo perforado para poste de semáforo con brazo, con pernos de anclaje, c/u', unit: 'EA', csi: '34 41 13',
      description: 'Augered shaft, rebar cage, anchor rod assembly, conduit sweeps and concrete; spoil haul included.',
      material_cost_cents: { v: 300000, prov: aup('WisDOT 654.0110 Concrete Bases Type 10 FY23–25 avg ≈ $7,560; ≈ $3,000 taken as concrete, cage and anchor assembly.') },
      labor_hours_per_unit: { v: 20, prov: aup('≈20 crew-hr at ≈$95/hr of the WisDOT 654.0110 average (drill, set cage and template, pour, strip).') },
      equipment_cost_cents: { v: 220000, prov: aup('Drill rig, casing and truck share of the WisDOT 654.0110 average.') },
      waste_pct: { v: 5, prov: est('concrete over-order on an augered shaft') } },
    { code: 'HC-SIG-HEAD-3S-EA', name: 'Vehicle signal face, 3-section 12 in. LED, with mounting hardware share — install and aim, each', name_es: 'Cara de semáforo vehicular, 3 secciones 12 pulg. LED, con parte del herraje — instalar y apuntar, c/u', unit: 'EA', csi: '34 41 13',
      material_cost_cents: { v: 68000, prov: aup('WisDOT 658.0173 Traffic Signal Face 3S 12-Inch FY23–25 avg ≈ $871; ≈ $680 taken as material.') },
      labor_hours_per_unit: { v: 1.5, prov: aup('Remainder of the WisDOT 658.0173 average: ≈1.5 crew-hr to hang, aim and cover.') },
      equipment_cost_cents: { v: 5000, prov: aup('Bucket truck time share of the WisDOT 658.0173 average.') },
      waste_pct: { v: 0, prov: est('manufactured item') } },
    { code: 'HC-SIG-LIGHT-UNIT-EA', name: 'Street light unit — concrete base, breakaway base, ≈30 ft aluminum pole, arm and LED luminaire, each', name_es: 'Unidad de alumbrado — base de concreto y desprendible, poste de aluminio ≈30 pies, brazo y luminaria LED, c/u', unit: 'EA', csi: '34 41 33',
      description: 'Complete roadway light unit except feeder conduit and wire (separate LF lines).',
      material_cost_cents: { v: 400000, prov: aup('Sum of WisDOT FY23–25 avgs ≈ $5,140: 657.0322 Poles Type 5-Aluminum ≈ $2,297, 657.0615 Luminaire Arm 8-FT ≈ $482, 659.11xx Luminaires Utility LED ≈ $352, 657.0210 Transformer Base ≈ $724, 654.0102 Concrete Base Type 2 ≈ $1,282; ≈ $4,000 taken as material.') },
      labor_hours_per_unit: { v: 8, prov: aup('≈8 crew-hr at ≈$95/hr of the summed WisDOT averages (base, set pole, arm, luminaire, fuse and bond).') },
      equipment_cost_cents: { v: 35000, prov: aup('Auger / boom truck / bucket truck share of the summed WisDOT averages.') },
      waste_pct: { v: 0, prov: est('manufactured assemblies; base concrete waste is minor') } },
    { code: 'HC-SIG-CONDUIT-2IN-LF', name: '2 in. Schedule 40 PVC conduit in trench with tracer wire, backfilled, per LF', name_es: 'Ducto de PVC cédula 40 de 2 pulg. en zanja con cable trazador, rellenado, por pie lineal', unit: 'LF', csi: '34 41 13',
      material_cost_cents: { v: 280, prov: aup('WisDOT 652.0225 Conduit Rigid Nonmetallic Sch 40 2-Inch FY23–25 avg ≈ $10.91/LF; ≈ $2.80 taken as conduit, fittings and tracer wire.') },
      labor_hours_per_unit: { v: 0.06, prov: aup('≈0.06 crew-hr/LF at ≈$95/hr of the WisDOT 652.0225 average (trench, lay, inspect, backfill).') },
      equipment_cost_cents: { v: 200, prov: aup('Trencher/backhoe + compactor share of the WisDOT 652.0225 average.') },
      waste_pct: { v: 5, prov: est('conduit cut-offs and fittings') } },
    { code: 'HC-SIG-PULLBOX-EA', name: 'Non-conductive pull box ≈24 × 36 in. on drain rock with frame and lid, each', name_es: 'Caja de registro no conductora de ≈24 × 36 pulg. sobre piedra de drenaje con marco y tapa, c/u', unit: 'EA', csi: '34 41 13',
      material_cost_cents: { v: 145000, prov: aup('WisDOT 653.0154 Pull Boxes Non-Conductive 24x36-Inch FY23–25 avg ≈ $2,034; ≈ $1,450 taken as material.') },
      labor_hours_per_unit: { v: 4, prov: aup('≈4 crew-hr at ≈$95/hr of the WisDOT 653.0154 average.') },
      equipment_cost_cents: { v: 15000, prov: aup('Backhoe share of the WisDOT 653.0154 average.') },
      waste_pct: { v: 0, prov: est('manufactured item') } },
  ],
  quantity_rules: [
    { code: 'HC-SIG-LIGHT-UNIT-EA', assumption: 'Parking-lot / site lighting allowance: ≈4 pole-mounted light units for the ≈1,500 SY default paved lot — replace with the photometric plan count', when: { facts_any: ['asphalt_paving'], building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 4 } },
    { code: 'HC-SIG-CONDUIT-2IN-LF', assumption: 'Feeder conduit for the ≈4 default site light poles ≈ 300 LF (≈75 LF per pole back to the panel) — measure the site plan', when: { facts_any: ['asphalt_paving'], building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 300 } },
  ],
  dependency_hints: [
    { after_trades: ['traffic_control'], note: 'Work-zone traffic control is set before any signal or lighting work in or beside live lanes.' },
    { after_trades: ['excavation', 'site_utilities'], note: 'Bases, conduit and pull boxes go in after rough grading and underground utilities, before curb, sidewalk and final paving.' },
  ],
});
