// Trade Knowledge Pack — commissioning_agent (Commissioning Agent / Cx Authority — independent
// verification that building systems are installed, started, tested and handed over per the owner's
// project requirements). Wave 21 — SERVICES, NEW-TRADE pattern (no hand recipe; permit_trade null →
// no gates, no code refs). Template tasks: commercial 'Building systems commissioning & owner
// training', industrial 'Facility systems commissioning & operator training'.
// Complements test_balance (TAB report is an INPUT) and controls_bms (point-to-point checkout and BAS
// trend review are the controls contractor's work; the Cx agent witnesses and samples them).
// Dossier: docs/trade-packs/dossiers/commissioning_agent.md. Sources: UFGS 01 91 00, WBDG Building
// Commissioning, GSA Building Commissioning Guide, 29 CFR 1926 (C, E, K, M, X); ASHRAE Guideline 0 /
// Standard 202 and IECC C408 named only (reference, no code_refs on a no-permit service).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['commissioning_agent-ufgs-01-91-00'], confidence: 'derived' as const, last_verified: D, note: 'UFGS 01 91 00 deliverable structure; page body not script-readable — paraphrased, human to confirm.' };
const cx = { src: ['commissioning_agent-wbdg-cx', 'commissioning_agent-gsa-cx-guide'], confidence: 'derived' as const, last_verified: D, note: 'Cx process deliverables (WBDG / GSA); paraphrased.' };
const g0 = { src: ['commissioning_agent-ashrae-g0-s202', 'commissioning_agent-wbdg-cx'], confidence: 'derived' as const, last_verified: D, note: 'Process vocabulary named in ASHRAE Guideline 0 / Std 202 (reference only); described from public WBDG summary.' };
const osha = (sub: string, note?: string) => ({ src: [`ecfr-1926-${sub}`], confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const tr = (text: string) => ({ status: 'translated' as const, text });

const CX = 'commission|\\bCx\\b|functional\\s*(?:performance\\s*)?test|operator\\s*training|owner\\s*training|systems\\s*manual';

export default definePack({
  key: 'commissioning_agent',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Independent commissioning agent hired by the owner to verify HVAC, controls, plumbing, electrical and life-safety systems are installed, started, tested and documented per the owner\'s project requirements: Cx plan, pre-functional checklist sampling, functional tests, issues log, training, systems manual and seasonal/warranty review. Installs nothing.',
    summary_es: 'Agente de puesta en servicio independiente que verifica para el propietario que HVAC, controles, plomería, electricidad y seguridad humana estén instalados, arrancados, probados y documentados según sus requisitos: plan Cx, muestreo de listas prefuncionales, pruebas funcionales, registro de problemas, capacitación, manual de sistemas y revisión estacional. No instala nada.',
    glossary: [
      { term: 'Owner\'s Project Requirements (OPR)', term_es: 'Requisitos del proyecto del propietario (OPR)', def: 'Written statement of what the owner needs the building and its systems to do — the yardstick every test is judged against.', def_es: 'Documento que describe lo que el propietario necesita que hagan el edificio y sus sistemas; es la medida con que se juzga cada prueba.' },
      { term: 'Basis of Design (BoD)', term_es: 'Bases de diseño (BoD)', def: 'The designer\'s explanation of how the systems meet the OPR — assumptions, criteria and system choices.', def_es: 'Explicación del diseñador de cómo los sistemas cumplen los OPR: supuestos, criterios y selección de sistemas.' },
      { term: 'Commissioning plan (Cx plan)', term_es: 'Plan de puesta en servicio (plan Cx)', def: 'Document that sets the Cx team, systems in scope, schedule, checklists, test procedures and how issues get tracked.', def_es: 'Documento que define el equipo Cx, los sistemas incluidos, el calendario, las listas de verificación, los procedimientos de prueba y cómo se registran los problemas.' },
      { term: 'Pre-functional checklist', term_es: 'Lista de verificación prefuncional', def: 'Contractor-completed checklist proving a piece of equipment is installed, connected and started correctly before it is functionally tested.', def_es: 'Lista que llena el contratista para demostrar que un equipo está instalado, conectado y arrancado correctamente antes de la prueba funcional.' },
      { term: 'Functional performance test (FPT)', term_es: 'Prueba funcional de desempeño (FPT)', def: 'Scripted test that runs a system through its modes, sequences and failure responses to prove it works as designed.', def_es: 'Prueba con guion que hace pasar un sistema por sus modos, secuencias y respuestas a fallas para demostrar que funciona según el diseño.' },
      { term: 'Issues log', term_es: 'Registro de problemas', def: 'Running list of every deficiency found, who owns it, and when it was fixed and verified.', def_es: 'Lista continua de cada deficiencia encontrada, quién es responsable y cuándo se corrigió y verificó.' },
      { term: 'Systems manual', term_es: 'Manual de sistemas', def: 'Turnover binder or file set explaining how the systems are meant to run: OPR, BoD, sequences, setpoints, test results and O&M data.', def_es: 'Carpeta o archivos de entrega que explican cómo deben funcionar los sistemas: OPR, BoD, secuencias, puntos de ajuste, resultados de pruebas y datos de operación y mantenimiento.' },
      { term: 'Seasonal testing', term_es: 'Pruebas estacionales', def: 'Functional tests deferred until weather lets heating or cooling run at real load.', def_es: 'Pruebas funcionales aplazadas hasta que el clima permita operar la calefacción o el enfriamiento con carga real.' },
      { term: 'Warranty review', term_es: 'Revisión de garantía', def: 'Walk-through and trend check near the end of the warranty period (commonly about 10 months) to catch problems before coverage ends.', def_es: 'Recorrido y revisión de tendencias cerca del final del periodo de garantía (comúnmente unos 10 meses) para detectar problemas antes de que termine la cobertura.' },
      { term: 'TAB report', term_es: 'Informe TAB', def: 'Test, adjust and balance report from the balancer — airflow and water flow readings the Cx agent spot-checks before functional testing.', def_es: 'Informe de prueba, ajuste y balanceo del balanceador: lecturas de flujo de aire y agua que el agente Cx verifica por muestreo antes de las pruebas funcionales.' },
    ],
  },
  est_bucket: 'general',
  recipes: [
    {
      id: 'cx_building_systems',
      example_title: 'Building systems commissioning & owner training',
      when: { title_re: CX },
      priority: 10,
      steps: [
        {
          title: 'Confirm the Cx plan, OPR and test scope',
          instruction: 'Issue or update the Cx plan: systems in scope, Cx team contacts, schedule, checklists and test scripts. Confirm the OPR and basis of design are current and that each test script measures against them. Hold the Cx kickoff with the contractors who start, balance and program the equipment.',
          tools: ['Cx plan', 'OPR and basis of design', 'approved submittals and sequences'],
          materials: ['meeting sign-in sheet'],
          safety_ids: [],
          qa_ids: ['cx_plan_current', 'opr_bod_on_file'],
        },
        {
          title: 'Verify pre-functional checklists and start-up',
          instruction: 'Collect the contractors\' completed pre-functional checklists and start-up reports for each piece of equipment. Walk a sample in the field — nameplate, connections, rotation, filters, labels, access — and log anything that does not match. Do not start functional testing on equipment whose checklist is open.',
          detail: 'Equipment is often energized during this walk — keep panel covers closed and do not operate disconnects; ask the installing contractor to open or run equipment.',
          tools: ['flashlight', 'camera', 'checklist forms or Cx software on a tablet'],
          materials: [],
          safety_ids: ['energized_equipment', 'ladder_access', 'roof_edge'],
          qa_ids: ['prefunctional_complete'],
        },
        {
          title: 'Confirm prerequisites: TAB report and controls checkout',
          instruction: 'Before functional testing, receive the TAB report and the controls contractor\'s point-to-point checkout. Spot-check a sample of air and water flows and sensor readings against the reports; if the sample fails, return the report for correction rather than testing on bad data.',
          tools: ['calibrated thermometer', 'manometer', 'flow hood or test data from the balancer'],
          materials: ['TAB report', 'controls point-to-point checkout sheets'],
          safety_ids: ['rotating_equipment', 'noise'],
          qa_ids: ['prereqs_verified'],
        },
        {
          title: 'Direct the functional performance tests',
          instruction: 'Run each test script with the installing contractor operating the equipment: normal modes, setpoint changes, staging, economizer, power loss and restart, alarms and safeties. Record the actual result for every step as pass or fail. Life-safety interlocks are witnessed with the fire alarm contractor and the owner\'s representative.',
          detail: 'The contractor operates equipment and locks out anything opened; the Cx agent observes, records and verifies.',
          tools: ['test scripts', 'laptop or tablet with BAS read access', 'radio', 'calibrated thermometer'],
          materials: ['functional test forms'],
          safety_ids: ['energized_equipment', 'rotating_equipment', 'hot_surfaces', 'noise', 'roof_edge'],
          qa_ids: ['fpt_recorded', 'life_safety_witnessed'],
        },
        {
          title: 'Track and close the issues log',
          instruction: 'Enter every failed step and field deficiency on the issues log with owner, due date and status. Retest each correction and record the date it was verified. Report open issues at each Cx meeting until the log is closed or the owner accepts the remaining items in writing.',
          tools: ['issues log (spreadsheet or Cx software)'],
          materials: [],
          safety_ids: [],
          qa_ids: ['issues_log_closed'],
        },
        {
          title: 'Train operators, deliver the systems manual and Cx report',
          instruction: 'Confirm each contractor delivers the operator training the specs require and that attendance is signed. Assemble the systems manual — OPR, BoD, sequences, setpoints, test results, O&M data — and issue the Cx report summarizing what was tested, what failed and how it was resolved.',
          tools: ['training agenda'],
          materials: ['training sign-in sheets', 'systems manual', 'Cx report'],
          safety_ids: [],
          qa_ids: ['training_recorded', 'systems_manual_delivered', 'cx_report_issued'],
        },
        {
          title: 'Run seasonal tests and the warranty-period review',
          instruction: 'Schedule the deferred heating or cooling tests for the first season with real load. Near the end of the warranty period, walk the systems with the operators, review trend data for drift and overrides, and log warranty items for the contractors before coverage ends.',
          tools: ['test scripts', 'BAS trend data'],
          materials: ['seasonal test forms', 'warranty review report'],
          safety_ids: ['roof_edge', 'hot_surfaces'],
          qa_ids: ['seasonal_warranty_done'],
        },
      ],
    },
  ],
  qa_checklist: [
    { id: 'opr_bod_on_file', item: 'OPR and basis of design are written, current and accepted by the owner; test scripts reference them.', item_es: tr('OPR y bases de diseño por escrito, vigentes y aceptados por el propietario; los guiones de prueba hacen referencia a ellos.'), prov: g0 },
    { id: 'cx_plan_current', item: 'Cx plan lists every system in scope, the Cx team, the schedule, checklists and test procedures, and is updated as the job changes.', item_es: tr('El plan Cx enumera cada sistema incluido, el equipo Cx, el calendario, las listas y los procedimientos de prueba, y se actualiza conforme cambia la obra.'), prov: ufgs },
    { id: 'prefunctional_complete', item: 'Pre-functional checklist and start-up report signed for every piece of commissioned equipment before its functional test; field sample matches.', item_es: tr('Lista prefuncional e informe de arranque firmados para cada equipo comisionado antes de su prueba funcional; la muestra en campo coincide.'), prov: ufgs },
    { id: 'prereqs_verified', item: 'TAB report and controls point-to-point checkout received and a sample spot-checked within tolerance before functional testing starts.', item_es: tr('Informe TAB y verificación punto por punto de controles recibidos y una muestra comprobada dentro de tolerancia antes de iniciar las pruebas funcionales.'), prov: ufgs },
    { id: 'fpt_recorded', item: 'Every functional test step has a recorded actual result (pass/fail), date and witnesses — no blank or "OK" entries without readings.', item_es: tr('Cada paso de prueba funcional tiene resultado real registrado (aprobado/reprobado), fecha y testigos; sin casillas vacías ni "OK" sin lecturas.'), prov: ufgs },
    { id: 'life_safety_witnessed', item: 'Smoke control, fire alarm interlocks and equipment safety shutdowns tested and witnessed; results on file.', item_es: PENDING_ES, safety: true, prov: cx },
    { id: 'issues_log_closed', item: 'Issues log shows owner, due date and verified-closed date for every item; remaining items accepted by the owner in writing.', item_es: tr('El registro de problemas muestra responsable, fecha límite y fecha de cierre verificado de cada punto; los pendientes aceptados por escrito por el propietario.'), prov: cx },
    { id: 'training_recorded', item: 'Operator training delivered for each system with agenda, trainer and signed attendance on file.', item_es: tr('Capacitación de operadores impartida para cada sistema con agenda, instructor y asistencia firmada en archivo.'), prov: ufgs },
    { id: 'systems_manual_delivered', item: 'Systems manual delivered: OPR, BoD, sequences, setpoints, test results, O&M data and as-builts in the owner\'s format.', item_es: tr('Manual de sistemas entregado: OPR, BoD, secuencias, puntos de ajuste, resultados de pruebas, datos de operación y mantenimiento y planos finales en el formato del propietario.'), prov: cx },
    { id: 'cx_report_issued', item: 'Final Cx report issued summarizing systems tested, deficiencies found, resolutions and any deferred or seasonal tests.', item_es: tr('Informe final Cx emitido con el resumen de sistemas probados, deficiencias encontradas, soluciones y pruebas aplazadas o estacionales.'), prov: ufgs },
    { id: 'seasonal_warranty_done', item: 'Deferred seasonal tests completed and the warranty-period review held before coverage ends; findings sent to the contractors.', item_es: tr('Pruebas estacionales aplazadas completadas y revisión de garantía realizada antes de que termine la cobertura; hallazgos enviados a los contratistas.'), prov: ufgs },
  ],
  hazards: [
    { id: 'energized_equipment', hazard: 'Shock or arc flash near open starters, VFDs, control panels and disconnects during field verification and testing', hazard_es: PENDING_ES, controls: ['Never open panels or operate disconnects — the installing contractor does', 'Stay clear of energized parts and keep covers in place while observing'], controls_es: PENDING_ES, osha_ref: '1926.416(a)(1)', severity: 4, prov: osha('k') },
    { id: 'rotating_equipment', hazard: 'Fan, pump or damper starting unexpectedly while equipment is inspected or commanded during a test', hazard_es: PENDING_ES, controls: ['Confirm the equipment is locked and tagged before anyone reaches inside', 'Announce commands by radio and clear the area before equipment is started from the BAS'], controls_es: PENDING_ES, osha_ref: '1926.417(b)', severity: 4, prov: osha('k') },
    { id: 'roof_edge', hazard: 'Fall from a roof edge or through a skylight while checking rooftop units and exhaust fans', hazard_es: PENDING_ES, controls: ['Use guardrails or personal fall arrest within 6 ft of an unprotected edge', 'Stay away from skylights and roof openings unless covered'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, ppe: ['harness + lanyard where required'], prov: osha('m') },
    { id: 'ladder_access', hazard: 'Ladder fall while looking above ceilings at terminal units, valves and sensors', hazard_es: PENDING_ES, controls: ['Extend the ladder 3 ft above any landing it is used to reach', 'Keep three points of contact; never stand on the top step'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
    { id: 'hot_surfaces', hazard: 'Burns from boilers, steam and hot water piping and equipment surfaces during testing', hazard_es: PENDING_ES, controls: ['Treat piping and equipment as hot until confirmed cool', 'Let the contractor open test ports and valves on pressurized systems'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 3, ppe: ['gloves'], prov: osha('c', 'General hazard-training duty; no construction-specific rule for hot piping.') },
    { id: 'noise', hazard: 'Hearing damage in running mechanical rooms, chiller plants and generator tests', hazard_es: PENDING_ES, controls: ['Wear ear plugs or muffs in mechanical rooms with equipment running and during generator load tests'], controls_es: PENDING_ES, osha_ref: '1926.101(a)', severity: 2, ppe: ['hearing protection'], prov: osha('e') },
  ],
  inspection_checklists: {
    cx_functional_test_readiness: [
      { item: 'Pre-functional checklists and start-up reports signed for the system.', item_es: tr('Listas prefuncionales e informes de arranque firmados para el sistema.') },
      { item: 'TAB report accepted and controls point-to-point checkout complete.', item_es: tr('Informe TAB aceptado y verificación punto por punto de controles completa.') },
      { item: 'Test script approved; contractor operator and owner representative scheduled.', item_es: tr('Guion de prueba aprobado; operador del contratista y representante del propietario programados.') },
    ],
    cx_turnover_acceptance: [
      { item: 'Issues log closed or open items accepted by the owner in writing.', item_es: tr('Registro de problemas cerrado o pendientes aceptados por escrito por el propietario.') },
      { item: 'Training records, systems manual and Cx report delivered.', item_es: tr('Registros de capacitación, manual de sistemas e informe Cx entregados.') },
      { item: 'Energy-code commissioning documentation provided where the jurisdiction adopts it.', item_es: tr('Documentación de puesta en servicio del código de energía entregada donde la jurisdicción la adopta.'), ref: 'IECC C408 (reference)' },
    ],
  },
  dependency_hints: [
    { after_trades: ['test_balance', 'controls_bms'], before_phase: 'punch', note: 'Functional testing needs the accepted TAB report and controls checkout first; Cx closes before punch/turnover.' },
  ],
});
