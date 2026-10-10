// Trade Knowledge Pack — construction_management (Construction Management / Owner's Rep). Wave 22,
// SERVICES pattern: permit_trade null → no gates, no code_refs, no recipes, no assemblies. A CM or
// owner's rep does not build anything; the pack carries identity, deliverable QA (schedule, cost,
// change orders, RFIs/submittals, pay-app review with Wisconsin lien handling, closeout), on-site
// hazards for a CM walking an active job, and descriptive review checklists. These deliverables map to
// the platform's own RFI, submittal, change-order, budget, invoice and project-overview features.
// Dossier: docs/trade-packs/dossiers/construction_management.md. Sources: CMAA public overview, UFGS
// 01 20 00 / 01 32 01.00 10 / 01 33 00 / 01 78 00, Wis. Stat. 779.02 + 779.06, 29 CFR 1926 E/M/O/P/X.
import { definePack, PENDING_ES } from './schema.js';

const D = '2026-10-08';
const v = (src: string[], note?: string) => ({ src, confidence: 'verified' as const, last_verified: D, ...(note ? { note } : {}) });
const osha = (sub: string, note?: string) => v([`ecfr-1926-${sub}`], note);
const tr = (text: string) => ({ status: 'translated' as const, text });
const SCHED = 'construction_management-ufgs-01-32-01';
const SUBM = 'construction_management-ufgs-01-33-00';
const PAY = 'construction_management-ufgs-01-20-00';
const CLOSE = 'construction_management-ufgs-01-78-00';
const CMAA = 'construction_management-cmaa';
const LIEN = 'construction_management-wi-779-02';
const LIEN6 = 'construction_management-wi-779-06';

export default definePack({
  key: 'construction_management',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Construction manager or owner\'s representative who manages schedule, cost, quality and scope for the owner: keeps the master schedule, budget and change-order log, tracks RFIs and submittals, runs meetings, reviews pay applications and lien waivers, and drives closeout (O&M manuals, warranties, as-builts, occupancy). Does not perform the work.',
    summary_es: 'Gerente de construcción o representante del dueño que administra cronograma, costo, calidad y alcance para el dueño: mantiene el cronograma maestro, el presupuesto y el registro de órdenes de cambio, da seguimiento a RFI y entregas técnicas, dirige juntas, revisa solicitudes de pago y renuncias de gravamen, y conduce el cierre (manuales, garantías, planos finales, ocupación). No ejecuta la obra.',
    glossary: [
      { term: 'Owner\'s representative', term_es: 'Representante del dueño', def: 'Person or firm hired by the owner to manage the project on the owner\'s behalf — schedule, budget, contractor coordination — without doing the construction.', def_es: 'Persona o empresa contratada por el dueño para administrar el proyecto en su nombre — cronograma, presupuesto, coordinación de contratistas — sin construir.' },
      { term: 'Master schedule', term_es: 'Cronograma maestro', def: 'The logic-linked project schedule (activities, durations, predecessors) updated on a fixed cycle to show progress and the critical path.', def_es: 'El cronograma del proyecto con actividades, duraciones y predecesoras enlazadas, actualizado en un ciclo fijo para mostrar el avance y la ruta crítica.' },
      { term: 'Change order (CO)', term_es: 'Orden de cambio', def: 'Signed change to the contract price, time or scope. Each one is logged from request through pricing, review and approval.', def_es: 'Cambio firmado al precio, plazo o alcance del contrato. Cada una se registra desde la solicitud hasta la cotización, revisión y aprobación.' },
      { term: 'RFI (request for information)', term_es: 'Solicitud de información (RFI)', def: 'Written question from the contractor to the designer about the drawings or specs, numbered and tracked to a written answer.', def_es: 'Pregunta escrita del contratista al diseñador sobre planos o especificaciones, numerada y rastreada hasta su respuesta escrita.' },
      { term: 'Submittal register', term_es: 'Registro de entregas técnicas', def: 'List of every shop drawing, product data and sample the specs require, with due dates, reviewer and status.', def_es: 'Lista de cada plano de taller, ficha de producto y muestra que piden las especificaciones, con fechas, revisor y estado.' },
      { term: 'Schedule of values', term_es: 'Desglose de valores', def: 'Breakdown of the contract price by work item; each pay application bills percent complete against it.', def_es: 'Desglose del precio del contrato por partida; cada solicitud de pago cobra el porcentaje de avance contra él.' },
      { term: 'Pay application', term_es: 'Solicitud de pago', def: 'The contractor\'s monthly request for payment, with progress by line item, retainage, and supporting documents such as lien waivers.', def_es: 'Solicitud mensual de pago del contratista, con avance por partida, retención y documentos de respaldo como renuncias de gravamen.' },
      { term: 'Lien waiver', term_es: 'Renuncia de gravamen', def: 'Signed release in which a contractor, sub or supplier gives up lien rights for amounts paid, collected with each payment.', def_es: 'Liberación firmada en la que un contratista, subcontratista o proveedor renuncia a su derecho de gravamen por lo pagado; se recaba con cada pago.' },
      { term: 'Retainage', term_es: 'Retención', def: 'Percentage held back from each payment until the work is complete and closeout items are delivered.', def_es: 'Porcentaje retenido de cada pago hasta que la obra se termina y se entregan los documentos de cierre.' },
      { term: 'Closeout', term_es: 'Cierre del proyecto', def: 'Final phase: punch list, O&M manuals, warranties, as-built drawings, certificate of occupancy, final payment and release of retainage.', def_es: 'Fase final: lista de pendientes, manuales de operación, garantías, planos finales, certificado de ocupación, pago final y liberación de la retención.' },
    ],
  },
  est_bucket: 'general',
  recipes: [],
  hazards: [
    { id: 'open_edges', hazard: 'Fall from unprotected slab edges, stair openings or shafts during a site walk or progress photo', hazard_es: PENDING_ES, controls: ['Stay behind guardrails at any edge 6 ft or more above a lower level; never step past one for a better view', 'Walk the job with the superintendent and ask where open edges are before going up'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(1)', severity: 4, prov: osha('m') },
    { id: 'floor_holes', hazard: 'Falling through a floor or roof hole, or a skylight, hidden under loose material', hazard_es: PENDING_ES, controls: ['Look for secured, marked hole covers before walking a deck or roof', 'Do not step on loose plywood, insulation or debris that could hide an opening'], controls_es: PENDING_ES, osha_ref: '1926.501(b)(4)(i)', severity: 4, prov: osha('m') },
    { id: 'backing_equipment', hazard: 'Struck by a loader, skid steer or truck backing up while walking the site', hazard_es: PENDING_ES, controls: ['Use the marked pedestrian route and stay out of equipment swing and travel paths', 'Make eye contact with the operator or spotter before crossing behind a machine'], controls_es: PENDING_ES, osha_ref: '1926.602(a)(9)(ii)', severity: 4, ppe: ['high-visibility vest'], prov: osha('o') },
    { id: 'falling_objects', hazard: 'Head injury from tools or material falling from work overhead', hazard_es: PENDING_ES, controls: ['Wear a hard hat everywhere on the active site', 'Do not stand under crews working overhead or under a hoisted load'], controls_es: PENDING_ES, osha_ref: '1926.100(a)', severity: 3, ppe: ['hard hat', 'safety glasses', 'safety-toe boots'], prov: osha('e') },
    { id: 'trench_entry', hazard: 'Cave-in when stepping into a trench or footing excavation to look at work', hazard_es: PENDING_ES, controls: ['Never enter an excavation 5 ft or deeper unless it is sloped, benched, shored or shielded', 'Observe from the top of the cut, or ask the competent person to confirm protection first'], controls_es: PENDING_ES, osha_ref: '1926.652(a)(1)', severity: 4, prov: osha('p') },
    { id: 'ladder_access', hazard: 'Fall while climbing a portable ladder to an upper level', hazard_es: PENDING_ES, controls: ['Use only ladders whose rails extend at least 3 ft above the landing', 'Keep three points of contact and carry tablets or plans in a bag, not in your hands'], controls_es: PENDING_ES, osha_ref: '1926.1053(b)(1)', severity: 3, prov: osha('x') },
  ],
  qa_checklist: [
    { id: 'baseline_schedule', item: 'Baseline master schedule accepted before significant work: every activity logic-linked (only the start and finish activities open-ended) and no work activity longer than about 20 workdays.', item_es: tr('Cronograma maestro base aceptado antes del trabajo principal: cada actividad enlazada (solo la de inicio y la de fin sin predecesora o sucesora) y ninguna actividad de obra mayor de unos 20 días hábiles.'), prov: v([SCHED], '§3.3.2 OD ≤20 workdays / 30 calendar days; §3.3.11 two open-ended activities.') },
    { id: 'schedule_updates', item: 'Schedule updated on the agreed cycle (usually monthly with the pay app) with actual dates, remaining durations and a narrative of critical-path changes; reviewed in an update meeting.', item_es: tr('Cronograma actualizado en el ciclo acordado (normalmente mensual con la solicitud de pago) con fechas reales, duraciones restantes y una explicación de cambios en la ruta crítica; revisado en una junta de actualización.'), prov: v([SCHED], '§3.6 periodic schedule update + update meetings.') },
    { id: 'budget_report', item: 'Monthly cost report reconciles original budget, approved changes, pending changes, committed cost, cost to date and forecast at completion, with variances explained.', item_es: tr('Reporte mensual de costos que concilia presupuesto original, cambios aprobados, cambios pendientes, costo comprometido, costo a la fecha y pronóstico al término, con variaciones explicadas.'), prov: v([CMAA], 'Cost management is one of the CM service areas; report layout is a common practice baseline.') },
    { id: 'change_order_log', item: 'Every change is logged from request to decision: reason, priced proposal reviewed against the contract unit prices or a fair estimate, time impact, and signed approval before the work is paid.', item_es: tr('Cada cambio se registra desde la solicitud hasta la decisión: motivo, cotización revisada contra precios unitarios del contrato o una estimación justa, impacto en plazo y aprobación firmada antes de pagar el trabajo.'), prov: v([PAY, CMAA], 'UFGS 01 20 00 §1.5 modification pricing; CMAA scope control.') },
    { id: 'rfi_submittal_logs', item: 'RFI log and submittal register kept current: number, date sent, reviewer, due date, status; resubmittals numbered with a suffix (18 → 18.1); overdue items raised at the weekly meeting.', item_es: tr('Registro de RFI y registro de entregas técnicas al día: número, fecha de envío, revisor, fecha límite, estado; reenvíos numerados con sufijo (18 → 18.1); pendientes vencidos se tratan en la junta semanal.'), prov: v([SUBM], '§1.9 submittal register; §1.6 resubmittal numbering; §1.11 scheduling.') },
    { id: 'meeting_minutes', item: 'Minutes issued within a few days of each meeting listing attendees, decisions, and open action items with an owner and due date; open items carried forward until closed.', item_es: tr('Minutas emitidas pocos días después de cada junta con asistentes, decisiones y pendientes con responsable y fecha; los pendientes se arrastran hasta cerrarse.'), prov: v([CMAA]) },
    { id: 'pay_app_review', item: 'Pay application checked against the schedule of values and observed progress: no front-loading, retainage correct, stored materials documented, updated schedule and submittal register attached.', item_es: tr('Solicitud de pago revisada contra el desglose de valores y el avance observado: sin cobros adelantados, retención correcta, materiales almacenados documentados, cronograma y registro de entregas actualizados anexos.'), prov: v([PAY], '§1.3–1.4 cost breakdown reviewed for unbalanced items; §1.6.1 pay request package.') },
    { id: 'lien_waivers', item: 'Lien waivers collected from the prime and from every sub or supplier that served a lien notice, matching the amounts paid on the previous application, before releasing the next payment.', item_es: tr('Renuncias de gravamen recabadas del contratista principal y de cada subcontratista o proveedor que entregó aviso de gravamen, por los montos pagados en la solicitud anterior, antes de liberar el siguiente pago.'), prov: v([LIEN, PAY], 'UFGS 01 20 00 §1.6.1 c subcontractor/supplier payment certification. Wisconsin: 779.02(2)(b) 60-day notices identify who can lien; 779.02(5) payments are a trust fund for subs.') },
    { id: 'wi_lien_notices', item: 'Wisconsin jobs: prime contractor lien notice is in the owner contract, every 60-day sub/supplier notice received is logged and copied to the construction lender within 10 days.', item_es: tr('Obras en Wisconsin: el aviso de gravamen del contratista principal está en el contrato con el dueño; cada aviso de 60 días de subcontratistas o proveedores se registra y se copia al prestamista de la obra dentro de 10 días.'), prov: v([LIEN, LIEN6], '779.02(2)(a) prime notice; 779.02(2)(b) 60-day notice, owner forwards to lender within 10 days. 779.06: claim within 6 months of last work, 30-day notice of intent first.') },
    { id: 'closeout_package', item: 'Closeout package complete before final payment and retainage release: punch list closed, O&M manuals, warranties with start dates, as-built drawings, attic stock, final lien waivers and certificate of occupancy.', item_es: tr('Paquete de cierre completo antes del pago final y la liberación de la retención: lista de pendientes cerrada, manuales de operación, garantías con fecha de inicio, planos finales, refacciones, renuncias finales de gravamen y certificado de ocupación.'), prov: v([CLOSE, PAY], 'UFGS 01 78 00 §1.5 record drawings, §1.7 spare parts, §1.9 warranty, §3.7 O&M; 01 20 00 §1.6.3 final invoice.') },
  ],
  inspection_checklists: {
    pay_application_review: [
      { item: 'Line items and percentages match the approved schedule of values and what was seen on site', item_es: tr('Partidas y porcentajes coinciden con el desglose de valores aprobado y con lo observado en obra') },
      { item: 'Approved change orders added as their own lines; pending changes not billed', item_es: tr('Órdenes de cambio aprobadas agregadas como partidas propias; cambios pendientes no cobrados') },
      { item: 'Retainage withheld at the contract rate', item_es: tr('Retención aplicada a la tasa del contrato') },
      { item: 'Conditional waivers for this payment and unconditional waivers for the last one, from the prime and noticed subs/suppliers', item_es: tr('Renuncias condicionales por este pago e incondicionales por el anterior, del contratista principal y de subcontratistas/proveedores con aviso'), ref: 'Wis. Stat. 779.02' },
      { item: 'Updated schedule and submittal register attached', item_es: tr('Cronograma y registro de entregas técnicas actualizados anexos') },
    ],
    monthly_owner_report: [
      { item: 'Progress summary with photos and percent complete', item_es: tr('Resumen de avance con fotos y porcentaje completado') },
      { item: 'Schedule status: forecast completion vs. contract date and critical-path changes', item_es: tr('Estado del cronograma: término pronosticado contra fecha del contrato y cambios en la ruta crítica') },
      { item: 'Budget status: approved and pending changes, forecast at completion, contingency remaining', item_es: tr('Estado del presupuesto: cambios aprobados y pendientes, pronóstico al término, contingencia restante') },
      { item: 'Open RFIs, submittals and owner decisions needed, with dates', item_es: tr('RFI, entregas técnicas y decisiones del dueño pendientes, con fechas') },
      { item: 'Safety and quality issues and inspections passed or failed', item_es: tr('Temas de seguridad y calidad e inspecciones aprobadas o rechazadas') },
    ],
    closeout: [
      { item: 'Punch list walked and every item signed off', item_es: tr('Lista de pendientes recorrida y cada partida aprobada') },
      { item: 'O&M manuals and training delivered for each system', item_es: tr('Manuales de operación y capacitación entregados por cada sistema') },
      { item: 'Warranties collected with start date = acceptance date', item_es: tr('Garantías recabadas con fecha de inicio = fecha de aceptación') },
      { item: 'As-built / record drawings received', item_es: tr('Planos finales (as-built) recibidos') },
      { item: 'Certificate of occupancy (or final inspection) issued', item_es: tr('Certificado de ocupación (o inspección final) emitido') },
      { item: 'Final unconditional lien waivers received before retainage release', item_es: tr('Renuncias de gravamen finales incondicionales recibidas antes de liberar la retención'), ref: 'Wis. Stat. 779.06' },
    ],
  },
});
