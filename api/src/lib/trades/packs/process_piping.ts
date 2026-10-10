// Trade Knowledge Pack — process_piping (Process Piping & Compressed Air). Wave 13 — NEW-TRADE pattern
// (not in HAND_RECIPE_KEYS; the plumbing family recipe is generic DWV/supply work).
// Dossier: docs/trade-packs/dossiers/process_piping.md. Sources: UFGS 40 05 13 (Part 3 — supports,
// vents/drains, identification, hydrostatic + pneumatic tests, flushing), DOE/Compressed Air Challenge
// sourcebook (header slope, top takeoffs, drain legs), 29 CFR 1926 (C, D, E, H, I, J, L, X), and — reference
// only — ASME B31.3 (test paragraphs), ASME A13.1 (pipe identification), IPC (potable tie-in backflow, support).
// Note: the IPC does not govern compressed-air or chemical process piping; it applies where process water
// ties into the potable supply. Industrial process systems are usually engineered to ASME B31.3 (or B31.9
// for building-services compressed air) and witnessed by the owner/engineer.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const ufgs = { src: ['process_piping-ufgs-40-05-13'], confidence: 'verified' as const, last_verified: D };
const doe = { src: ['process_piping-doe-ca-sourcebook'], confidence: 'verified' as const, last_verified: D };
const b313 = { src: ['process_piping-asme-b31-3'], confidence: 'verified' as const, last_verified: D };
const a131 = { src: ['process_piping-asme-a13-1'], confidence: 'verified' as const, last_verified: D };
const ipc = { src: ['icc-pa'], confidence: 'verified' as const, last_verified: D };
const osha = (id: string) => ({ src: [id], confidence: 'verified' as const, last_verified: D });
const est = (note: string) => ({ src: ['platform-baseline'], confidence: 'estimate' as const, last_verified: D, note });
const B313 = 'ASME B31.3';

export default definePack({
  key: 'process_piping',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Industrial piping that is not the building plumbing — compressed-air mains and drops, process and cooling water, and chemical lines — laid out from the P&IDs and line list, supported and sloped to drains, joined, labeled, pressure-tested (water whenever possible), flushed clean and handed over with test records.',
    summary_es: 'Tubería industrial que no es la plomería del edificio — redes y bajantes de aire comprimido, agua de proceso y de enfriamiento, y líneas químicas — trazada según los diagramas P&ID y la lista de líneas, soportada y con pendiente hacia drenajes, unida, rotulada, probada a presión (con agua siempre que se pueda), lavada y entregada con los registros de prueba.',
    glossary: [
      { term: 'P&ID', term_es: 'P&ID (diagrama de tuberías e instrumentos)', def: 'Piping and instrumentation diagram — the drawing that shows every line, valve and instrument in the system.', def_es: 'Diagrama de tuberías e instrumentación — el plano que muestra cada línea, válvula e instrumento del sistema.' },
      { term: 'Line list', term_es: 'Lista de líneas', def: 'Table of every pipe line with its service, size, material, design pressure and test pressure.', def_es: 'Tabla de cada línea con su servicio, diámetro, material, presión de diseño y presión de prueba.' },
      { term: 'Header', term_es: 'Cabezal (línea principal)', def: 'The main pipe that feeds the branches; in compressed air it runs overhead, often as a loop.', def_es: 'El tubo principal que alimenta los ramales; en aire comprimido va elevado, muchas veces en anillo.' },
      { term: 'Drop', term_es: 'Bajante', def: 'Branch that comes down from the header to a work station or machine.', def_es: 'Ramal que baja del cabezal hasta una estación de trabajo o máquina.' },
      { term: 'Drain leg', term_es: 'Pierna de drenaje', def: 'Short capped pipe off the bottom of a header or drop that collects condensate for a drain valve or trap.', def_es: 'Tramo corto tapado bajo el cabezal o la bajante que junta el condensado para una válvula o trampa de drenaje.' },
      { term: 'FRL', term_es: 'FRL (filtro, regulador, lubricador)', def: 'Filter-regulator-lubricator set at the point of use that cleans the air and sets tool pressure.', def_es: 'Conjunto de filtro, regulador y lubricador en el punto de uso que limpia el aire y fija la presión de la herramienta.' },
      { term: 'Hydrostatic test', term_es: 'Prueba hidrostática', def: 'Pressure test with water; a leak just drips, so it is the safe default.', def_es: 'Prueba de presión con agua; una fuga solo gotea, por eso es la opción segura por defecto.' },
      { term: 'Pneumatic test', term_es: 'Prueba neumática', def: 'Pressure test with air or inert gas; stored energy can make a failure violent, so it is used only when water cannot be.', def_es: 'Prueba de presión con aire o gas inerte; la energía acumulada puede hacer violenta una falla, por eso solo se usa cuando no se puede usar agua.' },
      { term: 'Turnover package', term_es: 'Paquete de entrega', def: 'Binder of test records, flushing logs, material certs and marked-up drawings handed to the owner.', def_es: 'Carpeta con registros de pruebas, de lavado, certificados de material y planos marcados que se entrega al dueño.' },
    ],
  },
  est_bucket: 'plumbing',
  recipes: [
    {
      id: 'process_piping_install',
      example_title: 'Compressed air & process piping rough-in',
      when: { title_re: '\\b(?:compressed[- ]air|process\\s+(?:pip|water|line)|chemical\\s+(?:pip|line)|cooling\\s+water|air\\s+(?:header|main|drop)s?\\b)' },
      steps: [
        {
          title: 'Check P&IDs, line list and materials',
          instruction: 'Walk the P&IDs and line list: service, size, material, design and test pressure for each line. Check delivered pipe, fittings and valves against the list (material marks, ratings, certs) and keep chemical-service materials apart so nothing gets mixed up. Mark routes, high points, low points and equipment connections on site.',
          tools: ['tape measure', 'laser level', 'marker'],
          materials: ['P&IDs and line list', 'material certifications'],
          safety_ids: ['chemical_exposure'],
          qa_ids: ['materials_match_list'],
        },
        {
          title: 'Hang supports and set the header slope',
          instruction: 'Install hangers and supports at the spacing the spec sets for each pipe material and size, with dielectric or protective barriers where the spec calls for them. Hang compressed-air headers with a slight slope away from the compressor toward drain legs; slope liquid lines to low-point drains and add vents at the high points.',
          tools: ['rotary hammer drill', 'threaded-rod cutter', 'level', 'scissor lift or ladder'],
          materials: ['hangers and threaded rod', 'anchors', 'strut and clamps', 'isolation pads / dielectric barriers'],
          safety_ids: ['aerial_lift', 'ladder', 'eye_injury'],
          qa_ids: ['supports_spacing', 'header_slope', 'vents_drains'],
        },
        {
          title: 'Join the piping and take off the drops',
          instruction: 'Make up joints by the method the line list calls for — threaded, welded, press or grooved — with that system’s procedure and qualified welders on welded lines. Take every compressed-air branch and drop off the top or side of the header, never the bottom; put a drain leg with a valve or trap at the bottom of each drop and header low point. Cap open ends at day’s end.',
          tools: ['pipe threader', 'pipe wrenches', 'welder', 'press tool', 'grooving tool', 'band saw / pipe cutter', 'reamer'],
          materials: ['pipe and fittings per line list', 'joint compound / gaskets', 'ball valves', 'drain valves or condensate traps', 'caps and plugs'],
          safety_ids: ['hot_work', 'power_threader', 'eye_injury'],
          qa_ids: ['top_takeoffs', 'drain_legs', 'joints_per_procedure'],
        },
        {
          title: 'Tie in backflow protection and equipment',
          instruction: 'Where process or cooling water connects to the building’s drinking-water supply, install the backflow preventer the code and spec call for before any process equipment. Set isolation valves at each machine and leave equipment connections ready but not pressurized. Leave the work exposed for the rough-in inspection.',
          tools: ['pipe wrenches', 'adjustable wrench'],
          materials: ['backflow preventer', 'isolation valves', 'unions or flanges at equipment'],
          safety_ids: ['line_break', 'chemical_exposure'],
          qa_ids: ['backflow_installed'],
          gating_inspection_type: 'rough_in',
          code_refs: [
            { section: '608', note: 'Protection of potable water supply — backflow at process connections', code_type: 'IPC' },
            { section: '308', note: 'Piping support', code_type: 'IPC' },
          ],
        },
      ],
    },
    {
      id: 'process_piping_test_turnover',
      example_title: 'Process piping & compressed air pressure testing',
      priority: 1,
      when: { title_re: '\\b(?:pressure|leak|pneumatic|hydro(?:static)?)[- ]?test|\\bflush|\\bcommission|\\bturnover|\\bstart[- ]?up' },
      steps: [
        {
          title: 'Prepare the test boundary',
          instruction: 'Write the test plan from the line list: which lines, test medium, test pressure and hold time. Isolate or remove instruments, regulators, FRLs and equipment that the test would damage; blind or cap the boundary. Put a calibrated gauge on the system and, for any air test, a relief valve set just above test pressure on every section.',
          tools: ['calibrated test gauge', 'test pump or regulated air / nitrogen source', 'blinds and caps'],
          materials: ['test plan and record sheet', 'pressure relief valve', 'blinds, caps and plugs'],
          safety_ids: ['test_release', 'line_break'],
          qa_ids: ['test_plan', 'relief_on_air_test'],
        },
        {
          title: 'Pressure-test — water by default',
          instruction: 'Test with water unless the line list says the service cannot take it. Vent air out at the high points, raise to test pressure, hold for the specified time and walk every joint. Use an air or nitrogen test only where approved: clear and barricade the area, raise pressure in stages (about half first, check joints, then small steps), then drop to design pressure for the joint check. Record start and end readings.',
          tools: ['calibrated test gauge', 'test pump', 'regulated air / nitrogen source', 'leak-check solution', 'barricade tape'],
          materials: ['clean test water', 'test tags', 'leak-check solution'],
          safety_ids: ['test_release', 'pneumatic_test', 'hose_whip', 'eye_injury'],
          qa_ids: ['test_held', 'pneumatic_staged'],
          code_refs: [
            { section: '345.4', note: 'Hydrostatic leak test', code_type: B313 },
            { section: '345.5', note: 'Pneumatic leak test — when water cannot be used', code_type: B313 },
          ],
        },
        {
          title: 'Flush, clean and dry',
          instruction: 'Flush liquid lines at the flow velocity the spec sets with temporary strainers ahead of equipment, until the water runs clean; dispose of flush water as the spec and local rules allow. Blow compressed-air lines out to a safe discharge point to clear chips and scale, and drain all low points. Reinstall instruments, regulators and FRLs.',
          tools: ['temporary hoses and strainers', 'flow meter', 'adjustable wrench'],
          materials: ['temporary strainers', 'flush-water disposal plan'],
          safety_ids: ['air_blowdown', 'chemical_exposure'],
          qa_ids: ['flushed_clean'],
        },
        {
          title: 'Label and hand over',
          instruction: 'Label every line with its contents and flow arrows at valves, branches, wall penetrations and along long runs, using the identification scheme the spec names. Tag valves to the valve list. Assemble the turnover package — test and flush records, material certs, marked-up drawings — and walk the system with the owner or inspector.',
          tools: ['label printer', 'marker'],
          materials: ['pipe markers with flow arrows', 'valve tags', 'turnover binder'],
          safety_ids: ['ladder', 'aerial_lift'],
          qa_ids: ['pipe_labels', 'turnover_complete'],
          gating_inspection_type: 'final',
          code_refs: [{ section: '312', note: 'Tests and inspections of piping systems', code_type: 'IPC' }],
        },
      ],
    },
  ],
  code_refs: {
    rough_in: [
      { section: '608', note: 'Backflow protection where process water ties to the potable supply', code_type: 'IPC', prov: ipc },
      { section: '308', note: 'Piping support', code_type: 'IPC', prov: ipc },
    ],
    final: [
      { section: '312', note: 'Tests and inspections of piping systems', code_type: 'IPC', prov: ipc },
      { section: '345', note: 'Leak testing of process piping', code_type: B313, prov: b313 },
    ],
  },
  equipment: [
    { when: { building_types: ['industrial', 'commercial'] }, type: 'scissor_lift', reason: 'Overhead headers and drops in high-bay plants', optional: true },
    { when: { title_re: 'pressure|test' }, type: 'air_compressor', reason: 'Air source for an approved pneumatic test or line blowdown', optional: true },
    { when: { title_re: 'rough|install|header|drop' }, type: 'welder', reason: 'Welded steel or stainless process lines', optional: true },
    { when: { building_types: ['industrial'] }, type: 'forklift', reason: 'Move pipe bundles and set the compressor or receiver', optional: true },
  ],
  hazards: [
    { id: 'pneumatic_test', hazard: 'Violent failure of piping or fittings during an air or gas pressure test (stored energy)', hazard_es: PENDING_ES, controls: ['Test with water unless an air test is approved in writing', 'Relief valve on every section, raise pressure in stages, barricade the area and keep people out of line with caps and blinds'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, ppe: ['safety glasses', 'face shield'], prov: osha('ecfr-1926-c') },
    { id: 'test_release', hazard: 'Cap, blind or test fitting blowing off under test pressure', hazard_es: PENDING_ES, controls: ['Never exceed the rated pressure of hoses, valves and fittings in the test rig', 'Stand clear of caps while pressurizing; bleed down before tightening anything'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(5)', severity: 3, ppe: ['safety glasses'], prov: osha('ecfr-1926-i') },
    { id: 'hose_whip', hazard: 'Air hose whipping if a hose or coupling fails on the test rig or temporary supply', hazard_es: PENDING_ES, controls: ['Safety device (excess-flow valve) at the source on hoses over 1/2 in. inside diameter', 'Pin or whip-check couplings'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(7)', severity: 3, prov: osha('ecfr-1926-i') },
    { id: 'air_blowdown', hazard: 'Flying debris and noise when blowing out lines or cleaning with compressed air', hazard_es: PENDING_ES, controls: ['Blow lines to a safe, guarded discharge point away from people', 'Never clean with air above 30 psi or point it at anyone; use chip guarding and eye protection'], controls_es: PENDING_ES, osha_ref: '1926.302(b)(4)', severity: 3, ppe: ['safety glasses', 'face shield', 'hearing protection'], prov: osha('ecfr-1926-i') },
    { id: 'air_receiver', hazard: 'Receiver over-pressure or rupture if the safety valve is blocked or missing', hazard_es: PENDING_ES, controls: ['Visible gauge and spring-loaded safety valve on every receiver, with no valve between receiver and safety valve', 'Drain valve at the lowest point; keep drains and handholes accessible'], controls_es: PENDING_ES, osha_ref: '1926.306(b)(3)', severity: 4, prov: osha('ecfr-1926-i') },
    { id: 'line_break', hazard: 'Unexpected release when opening or tying into a line that is still pressurized or holds product', hazard_es: PENDING_ES, controls: ['Get the owner’s line-break permit; isolate, lock and tag valves; depressurize and drain before opening', 'Stand to the side when breaking flanges'], controls_es: PENDING_ES, osha_ref: '1926.21(b)(2)', severity: 4, ppe: ['face shield', 'chemical gloves'], prov: osha('ecfr-1926-c') },
    { id: 'chemical_exposure', hazard: 'Burns or exposure from chemical residue in existing lines or from cleaning agents', hazard_es: PENDING_ES, controls: ['Read the safety data sheet for every product the line carried or the crew uses', 'Wear the gloves, goggles and face shield the SDS calls for; keep an eyewash nearby'], controls_es: PENDING_ES, osha_ref: '1926.59', severity: 3, ppe: ['chemical goggles', 'chemical gloves'], prov: osha('ecfr-1926-d') },
    { id: 'hot_work', hazard: 'Fire from welding or cutting pipe near combustibles or product lines', hazard_es: PENDING_ES, controls: ['Hot-work permit; move or shield combustibles before welding', 'Fire watch and extinguisher at hand'], controls_es: PENDING_ES, osha_ref: '1926.352(a)', severity: 3, ppe: ['welding gloves', 'welding helmet'], prov: osha('ecfr-1926-j') },
    { id: 'aerial_lift', hazard: 'Fall or tip-over from an aerial lift while hanging overhead headers', hazard_es: PENDING_ES, controls: ['Only trained operators; test controls before use each day', 'Stand on the platform floor and stay tied off where the lift type requires it'], controls_es: PENDING_ES, osha_ref: '1926.453(b)(2)(i)', severity: 4, prov: osha('ecfr-1926-l') },
    { id: 'ladder', hazard: 'Fall from a ladder while setting supports or labels', hazard_es: PENDING_ES, controls: ['Extend ladders 3 ft above the landing on firm footing', 'Keep three points of contact; do not overreach'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('ecfr-1926-x') },
    { id: 'power_threader', hazard: 'Hands or clothing caught in a power pipe threader or grooving machine', hazard_es: PENDING_ES, controls: ['Keep guards in place and use the foot switch', 'No gloves, loose sleeves or jewelry near rotating parts'], controls_es: PENDING_ES, osha_ref: '1926.300(b)(1)', severity: 3, prov: osha('ecfr-1926-i') },
    { id: 'eye_injury', hazard: 'Metal chips and burrs from cutting, reaming and drilling', hazard_es: PENDING_ES, controls: ['Safety glasses when cutting, reaming or drilling', 'Deburr pipe ends with the reamer, not by hand'], controls_es: PENDING_ES, osha_ref: '1926.102(a)(1)', severity: 2, ppe: ['safety glasses'], prov: osha('ecfr-1926-e') },
  ],
  qa_checklist: [
    { id: 'materials_match_list', phase: 'rough_in', item: 'Pipe, fittings and valves match the line list for material, rating and size; certs on file.', item_es: { status: 'translated', text: 'Tubos, conexiones y válvulas coinciden con la lista de líneas en material, clase y diámetro; certificados archivados.' }, prov: ufgs },
    { id: 'supports_spacing', item: 'Hangers and supports at the spec spacing for each material and size, with barriers where required; no sagging runs.', item_es: { status: 'translated', text: 'Colgadores y soportes a la separación del pliego para cada material y diámetro, con aislantes donde se pidan; sin tramos colgados.' }, prov: ufgs },
    { id: 'header_slope', item: 'Compressed-air headers sloped away from the compressor toward drain legs.', item_es: { status: 'translated', text: 'Cabezales de aire comprimido con pendiente alejándose del compresor hacia las piernas de drenaje.' }, prov: doe },
    { id: 'vents_drains', item: 'Vents at liquid-line high points and drains at every low point, whether or not drawn.', item_es: { status: 'translated', text: 'Venteos en los puntos altos de líneas de líquido y drenajes en cada punto bajo, aunque no estén dibujados.' }, prov: ufgs },
    { id: 'top_takeoffs', item: 'Every compressed-air branch and drop taken off the top or side of the header, none off the bottom.', item_es: { status: 'translated', text: 'Cada ramal y bajante de aire comprimido sale por arriba o por el costado del cabezal, ninguno por abajo.' }, prov: doe },
    { id: 'drain_legs', item: 'Drain leg with a valve or trap at the bottom of each drop and header low point.', item_es: { status: 'translated', text: 'Pierna de drenaje con válvula o trampa al pie de cada bajante y en cada punto bajo del cabezal.' }, prov: doe },
    { id: 'joints_per_procedure', item: 'Joints made by the method on the line list; welds by qualified welders to the written procedure.', item_es: { status: 'translated', text: 'Uniones hechas con el método de la lista de líneas; soldaduras por soldadores calificados según el procedimiento escrito.' }, prov: { src: ['process_piping-ufgs-40-05-13', 'process_piping-asme-b31-3'], confidence: 'verified', last_verified: D } },
    { id: 'backflow_installed', phase: 'rough_in', item: 'Backflow preventer of the required type at every process connection to the potable supply.', item_es: PENDING_ES, safety: true, prov: ipc },
    { id: 'test_plan', item: 'Written test plan lists lines, medium, test pressure and hold time before any test starts.', item_es: PENDING_ES, safety: true, prov: { src: ['process_piping-ufgs-40-05-13', 'process_piping-asme-b31-3'], confidence: 'verified', last_verified: D } },
    { id: 'relief_on_air_test', item: 'Pressure relief device set just above test pressure on every section under an air or gas test.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'pneumatic_staged', item: 'Air tests only where water cannot be used; pressure raised in stages with joints checked at each stage, area barricaded.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'test_held', phase: 'commissioning', item: 'Test held at the specified pressure for the specified time on a calibrated gauge with no drop and no visible leaks.', item_es: PENDING_ES, safety: true, prov: ufgs },
    { id: 'flushed_clean', item: 'Liquid lines flushed at the specified velocity until clean, with temporary strainers ahead of equipment.', item_es: { status: 'translated', text: 'Líneas de líquido lavadas a la velocidad especificada hasta salir limpias, con filtros temporales antes de los equipos.' }, prov: ufgs },
    { id: 'pipe_labels', item: 'Lines labeled with contents and flow arrows at valves, branches, penetrations and along long runs.', item_es: PENDING_ES, safety: true, prov: a131 },
    { id: 'turnover_complete', item: 'Turnover package complete: test and flush records, material certs, valve list and marked-up drawings.', item_es: { status: 'translated', text: 'Paquete de entrega completo: registros de prueba y lavado, certificados de material, lista de válvulas y planos marcados.' }, prov: ufgs },
  ],
  inspection_checklists: {
    rough_in: [
      { item: 'Supports, slope, vents and drains in place and exposed', item_es: PENDING_ES, ref: 'IPC 308' },
      { item: 'Backflow preventer at every process connection to potable water', item_es: PENDING_ES, ref: 'IPC 608' },
      { item: 'Compressed-air drops off the top of the header with drain legs below', item_es: PENDING_ES },
    ],
    final: [
      { item: 'Signed pressure-test records for every line on the line list', item_es: PENDING_ES, ref: 'ASME B31.3 345' },
      { item: 'Flushing records and strainers removed or cleaned', item_es: PENDING_ES },
      { item: 'Pipe identification and valve tags in place', item_es: PENDING_ES, ref: 'ASME A13.1' },
    ],
  },
  assemblies: [
    { code: 'P-PRC-AIR-PIPE-LF', name: 'Compressed-air header pipe, 1-1/2 in. aluminum push/press system, installed with supports, per LF', name_es: 'Tubería de cabezal de aire comprimido, aluminio 1-1/2 pulg. a presión, instalada con soportes, por pie lineal', unit: 'LF', csi: '22 15 00',
      material_cost_cents: { v: 2400, prov: est('aluminum compressed-air pipe + share of fittings and hangers, national baseline 2026; black steel is cheaper material, more labor') }, labor_hours_per_unit: { v: 0.15, prov: est('overhead header install from a lift incl. supports') },
      equipment_cost_cents: { v: 150, prov: est('scissor lift share') }, waste_pct: { v: 5, prov: est('offcuts') } },
    { code: 'P-PRC-AIR-DROP', name: 'Compressed-air drop with ball valve, drain leg and FRL at point of use, each', name_es: 'Bajante de aire comprimido con válvula de bola, pierna de drenaje y FRL en el punto de uso, c/u', unit: 'EA', csi: '22 15 00',
      material_cost_cents: { v: 22000, prov: est('drop pipe + top takeoff + ball valve + drain valve + FRL unit + quick coupler, national baseline 2026') }, labor_hours_per_unit: { v: 2.0, prov: est('take off header, run drop, set FRL') },
      equipment_cost_cents: { v: 500, prov: est('lift share') }, waste_pct: { v: 5, prov: est('fittings') } },
    { code: 'P-PRC-COMP-SET', name: 'Air compressor + receiver set allowance — set, pipe to header, drain to separator (excl. electrical), each', name_es: 'Partida para instalación de compresor y tanque — colocar, conectar al cabezal, drenaje al separador (sin eléctrico), c/u', unit: 'EA', csi: '22 15 00',
      material_cost_cents: { v: 150000, prov: est('install materials only (piping, valves, flex connector, oil-water separator, pad mounts); compressor itself usually owner-furnished or priced separately') }, labor_hours_per_unit: { v: 16.0, prov: est('two-person day: set, level, pipe, drain') },
      equipment_cost_cents: { v: 30000, prov: est('forklift / rigging share') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'P-PRC-TEST-SYS', name: 'Process piping pressure test, flush and records, per system', name_es: 'Prueba de presión, lavado y registros de tubería de proceso, por sistema', unit: 'EA', csi: '40 05 13',
      material_cost_cents: { v: 5000, prov: est('blinds, caps, relief valve, test water, tags') }, labor_hours_per_unit: { v: 8.0, prov: est('plan, isolate, fill/vent, hold, flush, paperwork for one system') },
      equipment_cost_cents: { v: 7500, prov: est('test pump / compressor and gauge share') }, waste_pct: { v: 0, prov: est('none') } },
    { code: 'P-PRC-LABEL', name: 'Pipe identification marker with flow arrow, each', name_es: 'Rótulo de identificación de tubería con flecha de flujo, c/u', unit: 'EA', csi: '40 05 13',
      material_cost_cents: { v: 800, prov: est('pre-printed self-adhesive or snap-on marker + arrow, national baseline 2026') }, labor_hours_per_unit: { v: 0.1, prov: est('clean pipe, apply marker') },
      equipment_cost_cents: { v: 0, prov: est('tools only') }, waste_pct: { v: 5, prov: est('spares') } },
  ],
  quantity_rules: [
    { code: 'P-PRC-TEST-SYS', assumption: 'Industrial building — one process / compressed-air system test and flush (add one per separate system)', when: { building_types: ['industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'P-PRC-COMP-SET', assumption: 'Industrial building — one compressor + receiver set (remove if the owner installs it)', when: { building_types: ['industrial'] }, qty: { basis: 'const', mul: 1 } },
    { code: 'P-PRC-AIR-DROP', assumption: 'Industrial building — assume 6 compressed-air drops; replace with the count from the P&IDs', when: { building_types: ['industrial'] }, qty: { basis: 'const', mul: 6 } },
  ],
  dependency_hints: [
    { after_trades: ['structural_steel'], before_phase: 'commissioning', note: 'Overhead headers hang from the finished structure; testing and flushing come before equipment start-up.' },
  ],
});
