// Trade Knowledge Pack — medical_gas (Medical Gas). Wave 13 — NEW-TRADE pattern (no hand recipe, no
// template tasks; the plumbing family recipe adds only generic DWV/water steps).
// Dossier: docs/trade-packs/dossiers/medical_gas.md. Sources: UFGS 22 60 70 (Gas and Vacuum Systems for
// Healthcare Facilities), 29 CFR 1926 (D, E, J, L, X, Z, AA), and — reference only — NFPA 99 Ch. 5,
// ASSE Series 6000, IPC 1202 and IFC 5306 (section numbers + our paraphrase, no tables or values).
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['medical_gas-ufgs-22-60-70'], confidence: 'verified' as const, last_verified: D };
const nfpa99 = { src: ['nfpa-fa', 'medical_gas-nfpa-99'], confidence: 'verified' as const, last_verified: D };
const asse = { src: ['medical_gas-asse-6000', 'medical_gas-ufgs-22-60-70'], confidence: 'verified' as const, last_verified: D };
const icc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (id: string) => ({ src: [id], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const N99 = 'NFPA 99';
const tr = (text: string) => ({ status: 'translated' as const, text });

export default definePack({
  key: 'medical_gas',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Piped medical gas and vacuum for hospitals, clinics and dental offices (oxygen, nitrous, medical/dental air, vacuum, WAGD): certified installers braze oxygen-clean copper under a nitrogen purge, add zone valves, alarms and labeled outlets, test it, and an independent verifier certifies it before patient use.',
    summary_es: 'Gases medicinales y vacío por tubería para hospitales, clínicas y consultorios dentales (oxígeno, óxido nitroso, aire, vacío, WAGD): instaladores certificados sueldan cobre limpio para oxígeno con purga de nitrógeno, colocan válvulas de zona, alarmas y tomas rotuladas, lo prueban, y un verificador independiente lo certifica antes de usarse con pacientes.',
    glossary: [
      { term: 'Station outlet / inlet', term_es: 'Toma / entrada de estación', def: 'The wall or ceiling fitting where staff plug in equipment — outlets give gas, inlets take vacuum. Each is gas-specific so the wrong hose cannot connect.', def_es: 'La conexión en pared o techo donde el personal conecta equipos; las tomas dan gas y las entradas toman vacío. Cada una es específica para su gas.' },
      { term: 'Zone valve box', term_es: 'Caja de válvulas de zona', def: 'Recessed box with a glass or plastic cover holding the shutoff valves and gauges for one area, so staff can shut gas off to that area in an emergency.', def_es: 'Caja empotrada con tapa transparente que contiene las válvulas de cierre y manómetros de un área, para cortar el gas en una emergencia.' },
      { term: 'Area alarm panel', term_es: 'Panel de alarma de área', def: 'Panel that warns staff when pressure or vacuum in their area goes too high or too low.', def_es: 'Panel que avisa al personal cuando la presión o el vacío de su área sube o baja demasiado.' },
      { term: 'Cleaned for oxygen service', term_es: 'Limpio para servicio de oxígeno', def: 'Copper tube and fittings cleaned at the factory of oil and debris, capped and marked; oil in an oxygen line can ignite.', def_es: 'Tubo y conexiones de cobre limpiados de aceite y residuos en fábrica, tapados y marcados; el aceite en una línea de oxígeno puede encenderse.' },
      { term: 'Nitrogen purge', term_es: 'Purga de nitrógeno', def: 'A low flow of nitrogen through the tube while brazing so no black copper oxide scale forms inside the pipe.', def_es: 'Un flujo bajo de nitrógeno por el tubo mientras se suelda, para que no se forme óxido de cobre negro dentro del tubo.' },
      { term: 'Cross-connection test', term_es: 'Prueba de conexión cruzada', def: 'Test that proves each outlet is piped to the right gas — one system pressurized at a time and every outlet checked.', def_es: 'Prueba que confirma que cada toma está conectada al gas correcto, presurizando un sistema a la vez y revisando cada toma.' },
      { term: 'Verifier (ASSE 6030)', term_es: 'Verificador (ASSE 6030)', def: 'Independent certified tester, not the installer, who runs the final tests and certifies the system before it is used on patients.', def_es: 'Probador certificado independiente, distinto del instalador, que hace las pruebas finales y certifica el sistema antes de usarlo con pacientes.' },
      { term: 'WAGD', term_es: 'WAGD (evacuación de gases anestésicos)', def: 'Waste anesthetic gas disposal — vacuum that carries exhaled anesthetic gas out of the operating room.', def_es: 'Evacuación de gases anestésicos residuales: vacío que saca del quirófano el gas anestésico exhalado.' },
      { term: 'Standing pressure test', term_es: 'Prueba de presión sostenida', def: 'The piping is held at test pressure for a set time (often 24 hours) and the gauge must not drop beyond the allowed change.', def_es: 'La tubería se mantiene a presión de prueba por un tiempo fijo (a menudo 24 horas) y el manómetro no debe bajar más de lo permitido.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'medgas_rough_in',
      example_title: 'Rough-in medical gas piping',
      when: { title_re: '\\bmed(?:ical)?[- ]?gas\\b|\\boxygen\\s+pip|\\bvacuum\\s+pip|\\bnitrous\\b|\\bwagd\\b|\\bdental\\s+(?:air|vac)' },
      steps: [
        {
          title: 'Confirm certified crew and brazer qualification',
          instruction: 'Before any medical gas work starts, confirm every installer and brazer holds a current ASSE 6010 card and that the brazing procedure and each brazer’s test joints have been witnessed and accepted for this project. Keep copies of the cards and brazer records in the job file for the inspector and verifier.',
          tools: ['job file / binder'],
          materials: ['ASSE 6010 certificates', 'brazing procedure and brazer qualification records'],
          safety_ids: ['brazing_fire'],
          qa_ids: ['installers_certified', 'brazers_qualified'],
          code_refs: [
            { section: '1202', note: 'Medical gas and vacuum piping installed per NFPA 99' },
            { section: '5.1', note: 'Category 1 piped gas and vacuum systems — qualified installers', code_type: N99 },
          ],
        },
        {
          title: 'Receive and protect oxygen-clean tube and fittings',
          instruction: 'Accept only hard-drawn copper tube and fittings marked as cleaned for oxygen service, with caps and bags intact. Store them off the floor and away from oil, grease and dirt. Keep ends capped until the moment of cutting; reject or re-clean anything that arrives open or contaminated.',
          tools: ['clean gloves', 'storage racks'],
          materials: ['oxygen-clean copper tube (Type K or L)', 'oxygen-clean brazed fittings', 'end caps'],
          safety_ids: ['oxygen_oil', 'cylinder_handling'],
          qa_ids: ['oxygen_clean_material', 'ends_capped'],
        },
        {
          title: 'Braze joints under a nitrogen purge',
          instruction: 'Cut with a clean wheel cutter, deburr without oil, and braze with the approved filler while flowing nitrogen through the pipe so no oxide forms inside. Move or shield combustibles first, keep an extinguisher at hand and a fire watch where required. Make threaded joints only where allowed, with oxygen-rated sealant on male threads only.',
          tools: ['oxy-fuel or air-fuel brazing torch', 'nitrogen cylinder with regulator and flowmeter', 'tubing cutter', 'deburring tool', 'fire extinguisher'],
          materials: ['copper-phosphorus brazing alloy', 'oil-free dry nitrogen', 'oxygen-rated thread sealant'],
          safety_ids: ['brazing_fire', 'brazing_fumes', 'radiant_eye', 'nitrogen_asphyxia', 'oxygen_oil', 'cylinder_storage'],
          qa_ids: ['nitrogen_purge_brazing', 'joint_fill'],
          code_refs: [{ section: '5.1.10', note: 'Distribution piping — materials, cleaning and brazed joints', code_type: N99 }],
        },
        {
          title: 'Hang, sleeve and label the piping',
          instruction: 'Support the tubing at the code spacing, run branches full size to each outlet drop, and fit bushings where the pipe passes through metal studs. Keep piping where it cannot be damaged. Label every run with the gas name and flow direction in the required colors, close enough that a label is visible from any point along the pipe.',
          tools: ['drill', 'band saw or porta-band', 'ladder or lift', 'label printer'],
          materials: ['pipe hangers and clamps', 'grommets / bushings for metal studs', 'color-coded pipe labels'],
          safety_ids: ['ladder', 'aerial_lift', 'silica_coring'],
          qa_ids: ['supports_bushings', 'pipe_labels'],
          code_refs: [{ section: '5.1.11', note: 'Labeling and identification of piping and valves', code_type: N99 }],
        },
        {
          title: 'Set zone valve boxes and outlet rough-ins',
          instruction: 'Set zone valve boxes on the corridor side of the area they serve and at the required mounting height, and rough in the outlet and inlet back boxes for each gas. Keep everything capped and exposed for the rough-in inspection; do not close walls until it passes.',
          tools: ['level', 'drill', 'tape measure'],
          materials: ['zone valve box with valves and gauge ports', 'station outlet/inlet rough-in assemblies'],
          safety_ids: ['brazing_fire', 'ladder'],
          qa_ids: ['zone_valves_located', 'ends_capped'],
          gating_inspection_type: 'rough_in',
          code_refs: [
            { section: '1202', note: 'Medical gas piping inspected per NFPA 99 requirements' },
            { section: '5.1', note: 'Zone valves and station outlets for Category 1 systems', code_type: N99 },
          ],
        },
        {
          title: 'Run the installer tests',
          instruction: 'Using oil-free dry nitrogen, blow down each line, pressure-test it, then run the cross-connection test one system at a time, the piping purge and the standing pressure test (standing vacuum for vacuum piping). Record every reading, gauge and time on the report; fix and retest any failure before the inspector arrives.',
          tools: ['calibrated test gauges', 'nitrogen cylinders with regulators', 'outlet adapters for each gas', 'test caps'],
          materials: ['oil-free dry nitrogen', 'test report forms'],
          safety_ids: ['test_pressure', 'nitrogen_asphyxia', 'cylinder_handling'],
          qa_ids: ['installer_tests_recorded', 'cross_connection_clear'],
          gating_inspection_type: 'gas_test',
          code_refs: [{ section: '5.1.12', note: 'Performance criteria and testing — installer tests', code_type: N99 }],
        },
      ],
    },
    {
      id: 'medgas_trim_verify',
      example_title: 'Medical gas zone valves, alarms and verification',
      priority: 1,
      when: { title_re: '\\bzone\\s+valve|\\b(?:area|master)\\s+alarm|\\bmed(?:ical)?[- ]?gas\\b.*\\b(?:trim|alarm|verif|certif|final|start[- ]?up)|\\b(?:asse\\s*)?6030\\b' },
      steps: [
        {
          title: 'Trim outlets and label zone valves',
          instruction: 'Install the gas-specific outlet and inlet finish assemblies and check that each one accepts only its own gas connector. Mark each zone valve and box with the gas and the rooms it controls, plus the caution notice not to close it except in an emergency.',
          tools: ['screwdrivers', 'gas-specific test adapters'],
          materials: ['station outlet/inlet finish assemblies', 'zone valve labels and caution signs'],
          safety_ids: ['oxygen_oil'],
          qa_ids: ['outlets_gas_specific', 'zone_valves_located'],
          code_refs: [{ section: '5.1.11', note: 'Valve and outlet identification', code_type: N99 }],
        },
        {
          title: 'Connect and test the alarms',
          instruction: 'Connect the area and master alarm sensors and panels for each gas, and have the electrician de-energize, wire and power them. Raise and lower the pressure or vacuum at each sensor and check that the correct panel shows the correct signal for the correct area.',
          tools: ['test gauges', 'meter'],
          materials: ['area alarm panels', 'alarm sensors and wiring'],
          safety_ids: ['ladder'],
          qa_ids: ['alarms_tested'],
          code_refs: [{ section: '5.1.9', note: 'Warning systems — master, area and local alarms', code_type: N99 }],
        },
        {
          title: 'Independent verification and certification',
          instruction: 'Give the ASSE 6030 verifier the installer test reports, then support the verifier’s tests: standing pressure, cross-connection, alarms, purge, particulate, purity, operating pressure and gas concentration. Correct anything that fails and have it re-verified. No outlet goes into patient use until the verifier’s written certification is in hand.',
          tools: ['outlet adapters', 'radios'],
          materials: ['installer test reports', 'source gas supply for verification'],
          safety_ids: ['oxygen_enriched', 'nitrogen_asphyxia', 'test_pressure'],
          qa_ids: ['verifier_certified', 'purity_particulate'],
          gating_inspection_type: 'final',
          code_refs: [
            { section: '5.1.12', note: 'Verification testing before the system is put in use', code_type: N99 },
            { section: '5306', note: 'Medical gas systems per NFPA 99', code_type: 'IFC' },
          ],
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '1202', note: 'Medical gas and vacuum piping per NFPA 99', prov: icc },
      { section: '5.1.10', note: 'Distribution piping — cleaned materials, brazing under purge', code_type: N99, prov: nfpa99 },
      { section: '5.1.11', note: 'Labeling and identification', code_type: N99, prov: nfpa99 },
    ],
    gas_test: [{ section: '5.1.12', note: 'Installer performance tests', code_type: N99, prov: nfpa99 }],
    final: [
      { section: '5.1.12', note: 'Independent verification before patient use', code_type: N99, prov: nfpa99 },
      { section: '5.1.9', note: 'Warning systems (alarms)', code_type: N99, prov: nfpa99 },
      { section: '5306', note: 'Medical gas systems — compliance with NFPA 99', code_type: 'IFC', prov: icc },
    ],
  },
  equipment: [
    { when: { building_types: ['commercial', 'industrial'] }, type: 'scissor_lift', reason: 'Overhead medical gas mains above corridor ceilings', optional: true },
  ],
  hazards: [
    { id: 'brazing_fire', hazard: 'Fire from the brazing torch in walls, ceilings or an occupied building', hazard_es: PENDING_ES, controls: ['Get a hot-work permit; move combustibles away or shield them before lighting the torch', 'Keep a charged extinguisher at the work and a fire watch after brazing'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 4, ppe: ['brazing gloves', 'flame-resistant sleeves'], prov: osha('ecfr-1926-j') },
    { id: 'oxygen_oil', hazard: 'Fire or explosion when oxygen contacts oil or grease on fittings, tools or gloves', hazard_es: PENDING_ES, controls: ['Keep oxygen piping, fittings, regulators and tools free of oil; never handle with oily gloves', 'Use only oxygen-rated thread sealant and lubricants'], controls_es: PENDING_ES, osha_ref: '1926.350(i)', severity: 4, prov: osha('ecfr-1926-j') },
    { id: 'oxygen_enriched', hazard: 'Clothing or materials igniting easily in an oxygen-enriched area during tie-ins and verification', hazard_es: PENDING_ES, controls: ['Never vent oxygen into a closed room or onto clothing; ventilate the area', 'No hot work or ignition sources while oxygen lines are open'], controls_es: PENDING_ES, osha_ref: '1926.350(i)', severity: 4, prov: osha('ecfr-1926-j') },
    { id: 'nitrogen_asphyxia', hazard: 'Nitrogen from purging and testing displacing the oxygen in a small room, chase or ceiling space', hazard_es: PENDING_ES, controls: ['Vent purge and test gas to a ventilated area, never into a closed space', 'Evaluate tight spaces before entry; use an oxygen monitor where nitrogen can collect'], controls_es: PENDING_ES, osha_ref: '1926.1203(a)', severity: 4, prov: osha('ecfr-1926-aa') },
    { id: 'cylinder_handling', hazard: 'Gas cylinder falling, or its valve breaking off, while moved or in use', hazard_es: PENDING_ES, controls: ['Keep cylinders chained upright on a cart or wall', 'Put valve caps on before moving; never lift by the cap'], controls_es: PENDING_ES, osha_ref: '1926.350(a)(9)', severity: 3, prov: osha('ecfr-1926-j') },
    { id: 'cylinder_storage', hazard: 'Fire spreading between stored oxygen and fuel-gas cylinders', hazard_es: PENDING_ES, controls: ['Store oxygen apart from fuel-gas cylinders and combustibles, or behind a fire-rated barrier', 'Close valves on cylinders not in use'], controls_es: PENDING_ES, osha_ref: '1926.350(a)(10)', severity: 3, prov: osha('ecfr-1926-j') },
    { id: 'brazing_fumes', hazard: 'Breathing metal fumes from brazing brass or bronze fittings in enclosed rooms', hazard_es: PENDING_ES, controls: ['Provide general or local exhaust ventilation when brazing in enclosed spaces', 'Read the alloy’s safety data sheet; keep your head out of the plume'], controls_es: PENDING_ES, osha_ref: '1926.353(c)(1)', severity: 2, prov: osha('ecfr-1926-j') },
    { id: 'radiant_eye', hazard: 'Eye injury from torch glare and brazing flux spatter', hazard_es: PENDING_ES, controls: ['Wear the filter shade suited to torch brazing', 'Wear safety glasses under the goggles'], controls_es: PENDING_ES, osha_ref: '1926.102(c)(1)', severity: 2, ppe: ['shaded brazing goggles'], prov: osha('ecfr-1926-e') },
    { id: 'test_pressure', hazard: 'Cap, plug or adapter blowing off under test pressure', hazard_es: PENDING_ES, controls: ['Use a regulator on every nitrogen cylinder and test only with oil-free nitrogen', 'Stand clear of caps and adapters while pressurizing'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 3, ppe: ['safety glasses'], prov: osha('ecfr-1926-e') },
    { id: 'ladder', hazard: 'Fall from a ladder while running piping overhead', hazard_es: PENDING_ES, controls: ['Set ladders on firm footing and extend 3 ft above any landing', 'Keep three points of contact; do not overreach'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('ecfr-1926-x') },
    { id: 'aerial_lift', hazard: 'Fall or crush in a scissor or boom lift while installing mains', hazard_es: PENDING_ES, controls: ['Only trained operators; keep guardrails closed', 'Wear a harness with a lanyard tied to the boom in a boom lift'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(v)', severity: 3, prov: osha('ecfr-1926-l') },
    { id: 'silica_coring', hazard: 'Silica dust from core drilling slabs and walls for risers', hazard_es: PENDING_ES, controls: ['Core with water feed or a dust-collecting shroud', 'Follow the silica exposure control plan'], controls_es: PENDING_ES, osha_ref: '1926.1153(c)(1)', severity: 2, ppe: ['respirator where required'], prov: osha('ecfr-1926-z') },
  ],
  qa_checklist: [
    { id: 'installers_certified', phase: 'rough_in', item: 'Every installer and brazer on the job holds a current ASSE 6010 certificate; copies in the job file.', item_es: tr('Cada instalador y soldador en la obra tiene certificado ASSE 6010 vigente; copias en el archivo de la obra.'), prov: asse },
    { id: 'brazers_qualified', phase: 'rough_in', item: 'Brazing procedure and each brazer’s test joints witnessed and accepted before project brazing starts.', item_es: tr('Procedimiento de soldadura y uniones de prueba de cada soldador presenciados y aceptados antes de soldar en el proyecto.'), prov: ufgs },
    { id: 'oxygen_clean_material', item: 'Tube and fittings marked cleaned for oxygen service, arrived capped and bagged; no cast fittings.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'ends_capped', item: 'All open tube ends, outlets and stub-outs capped at the end of each day.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'nitrogen_purge_brazing', item: 'Nitrogen purge flowing through every joint while brazed; no oxide scale found on spot camera checks.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'joint_fill', item: 'Brazing alloy fully penetrates each joint to the fitting depth with a continuous fillet.', item_es: tr('La aleación de soldadura penetra completamente cada unión hasta la profundidad del accesorio, con filete continuo.'), prov: ufgs },
    { id: 'supports_bushings', item: 'Piping supported at code spacing, branches full size to each drop, bushings at every metal stud.', item_es: tr('Tubería soportada según la separación del código, ramales de tamaño completo hasta cada bajada y bujes en cada montante metálico.'), prov: ufgs },
    { id: 'pipe_labels', item: 'Every pipe labeled with gas name and flow arrow in the required colors, visible along the whole run.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'zone_valves_located', item: 'Zone valve boxes on the corridor side of the area served, at the required height, labeled with gas and rooms controlled.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'installer_tests_recorded', phase: 'inspections', item: 'Blow-down, initial pressure, cross-connection, purge and standing pressure/vacuum tests done with oil-free nitrogen and recorded.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'cross_connection_clear', phase: 'inspections', item: 'Cross-connection test shows gas only at the outlets of the system under test, one system at a time.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'outlets_gas_specific', item: 'Each outlet/inlet accepts only its own gas connector and matches its label.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'alarms_tested', phase: 'commissioning', item: 'Each area and master alarm signal tested at its sensor and shows on the correct panel for the correct area.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'purity_particulate', phase: 'commissioning', item: 'Verifier particulate, purity and concentration results within NFPA 99 limits for every system.', item_es: PENDING_ES, safety: true, prov: { src: ['medical_gas-ufgs-22-60-70', 'medical_gas-nfpa-99'], confidence: 'verified', last_verified: D } },
    { id: 'verifier_certified', phase: 'commissioning', item: 'Written certification from an independent ASSE 6030 verifier received before any outlet is used on a patient.', item_es: PENDING_ES, safety: true, prov: asse },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Installer and brazer certificates on site', item_es: tr('Certificados de instaladores y soldadores en la obra'), ref: 'ASSE 6010' },
      { item: 'Oxygen-clean copper, brazed joints, piping exposed and capped', item_es: PENDING_ES, ref: 'NFPA 99 5.1.10' },
      { item: 'Supports, bushings and pipe labels in place', item_es: tr('Soportes, bujes y etiquetas de tubería instalados'), ref: 'NFPA 99 5.1.11' },
    ],
    gas_test: [
      { item: 'Installer test reports: blow-down, pressure, cross-connection, purge, standing pressure', item_es: PENDING_ES, ref: 'NFPA 99 5.1.12' },
      { item: 'Gauge on the system holding the standing test', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Zone valves, outlets and alarms labeled and working', item_es: PENDING_ES, ref: 'NFPA 99 5.1.9 / 5.1.11' },
      { item: 'Independent ASSE 6030 verifier certification on file', item_es: PENDING_ES, ref: 'NFPA 99 5.1.12' },
    ],
  },
  assemblies: [
    { code: 'P-MG-PIPE-LF', name: 'Medical gas piping — oxygen-clean copper Type L, 1/2–3/4 in., brazed under nitrogen, with hangers and labels, per LF', name_es: 'Tubería de gases medicinales — cobre tipo L limpio para oxígeno, 1/2–3/4 pulg, soldado con nitrógeno, por pie lineal', unit: 'LF', csi: '22 62 13',
      material_cost_cents: { v: 1100, prov: est('oxygen-clean ACR/medical copper + fittings + hangers + labels share, national baseline 2026') }, labor_hours_per_unit: { v: 0.3, prov: est('certified installer brazing under purge, typical clinic branch runs') },
      equipment_cost_cents: { v: 50, prov: est('nitrogen and torch gas share') }, waste_pct: { v: 10, prov: est('tube offcuts') } },
    { code: 'P-MG-OUTLET-EA', name: 'Medical gas station outlet or vacuum inlet — rough-in and finish, each', name_es: 'Toma de gas medicinal o entrada de vacío — preinstalación y acabado, c/u', unit: 'EA', csi: '22 62 13',
      material_cost_cents: { v: 22000, prov: est('gas-specific outlet rough-in + finish assembly, national baseline 2026') }, labor_hours_per_unit: { v: 2.0, prov: est('set back box, braze pigtail, trim and test') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'P-MG-ZVB-EA', name: 'Zone valve box — recessed, 3 services with valves and gauges, each', name_es: 'Caja de válvulas de zona — empotrada, 3 servicios con válvulas y manómetros, c/u', unit: 'EA', csi: '22 62 13',
      material_cost_cents: { v: 120000, prov: est('3-gas zone valve box with extensions and gauges, national baseline 2026') }, labor_hours_per_unit: { v: 5.0, prov: est('set box, braze extensions, label') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'P-MG-ALARM-EA', name: 'Medical gas area alarm panel with sensors, each', name_es: 'Panel de alarma de área para gases medicinales con sensores, c/u', unit: 'EA', csi: '22 62 13',
      material_cost_cents: { v: 150000, prov: est('multi-gas area alarm panel + sensors, national baseline 2026; low-voltage wiring by electrician') }, labor_hours_per_unit: { v: 4.0, prov: est('mount panel, pipe sensors, test with electrician') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'P-MG-VERIFY-EA', name: 'Independent ASSE 6030 verification and certification — allowance per small facility, each', name_es: 'Verificación y certificación independiente ASSE 6030 — partida por instalación pequeña, c/u', unit: 'EA', csi: '22 62 13',
      material_cost_cents: { v: 350000, prov: est('third-party verifier fee for a clinic or dental office; scales with outlet count and systems') }, labor_hours_per_unit: { v: 6.0, prov: est('installer support during verification and retests') },
      equipment_cost_cents: { v: 0, prov: est('verifier brings own analyzers') }, waste_pct: { v: 0, prov: est('none') } },
  ],
  quantity_rules: [
    { code: 'P-MG-VERIFY-EA', assumption: 'Medical gas on the schedule — one independent verification per facility', when: { building_types: ['commercial', 'industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'P-MG-ZVB-EA', assumption: 'Assume one zone valve box until the plans show the zone count', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'P-MG-ALARM-EA', assumption: 'Assume one area alarm panel per zone until the plans show the count', when: { building_types: ['commercial'] }, qty: { basis: 'const', mul: 1 } },
  ],
  dependency_hints: [
    { after_trades: ['metal_stud_framing'], before_phase: 'drywall', note: 'Medical gas rough-in, installer tests and the rough-in inspection happen after stud framing and before walls are closed.' },
  ],
});
