// Trade Knowledge Pack — general (General / Multi-Trade). Wave 23, UMBRELLA pattern: identity +
// glossary only, no recipes/hazards/QA. 25 blueprint template tasks carry this key and the hand
// recipe in task-buildout/building.ts produces their steps — knowledge here would attach to every
// one of them, so trade-specific depth lives in the child packs. Dossier: docs/trade-packs/dossiers/general.md.
import { definePack } from './schema.js';

export default definePack({
  key: 'general',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Roll-up key for general-contractor and multi-trade work: general conditions, inspections, coordination, closeout and punch. Trade knowledge lives in the finer packs — e.g. final_clean, scaffolding, hauling, traffic_control, remodeling, restoration, specialties, construction_management and commissioning_agent.',
    summary_es: 'Clave general para el trabajo del contratista general y de varios oficios: condiciones generales, inspecciones, coordinación, cierre y lista de pendientes. El conocimiento de cada oficio está en los paquetes específicos, como final_clean, scaffolding, hauling, traffic_control, remodeling, restoration, specialties, construction_management y commissioning_agent.',
    glossary: [
      { term: 'General conditions', term_es: 'Condiciones generales', def: 'Job-wide costs and duties not tied to one trade: supervision, temporary facilities, cleanup, insurance.', def_es: 'Costos y obligaciones de toda la obra que no son de un solo oficio: supervisión, instalaciones temporales, limpieza, seguros.' },
      { term: 'Submittal', term_es: 'Entrega para aprobación (submittal)', def: 'Product data, shop drawings or samples sent to the designer for approval before ordering or installing.', def_es: 'Fichas de producto, planos de taller o muestras enviados al diseñador para aprobación antes de pedir o instalar.' },
      { term: 'RFI', term_es: 'Solicitud de información (RFI)', def: 'Written question to the designer when the drawings or specs are unclear or conflict.', def_es: 'Pregunta por escrito al diseñador cuando los planos o especificaciones no son claros o se contradicen.' },
      { term: 'Change order', term_es: 'Orden de cambio', def: 'Signed agreement that changes the contract scope, price or schedule.', def_es: 'Acuerdo firmado que modifica el alcance, el precio o el plazo del contrato.' },
      { term: 'Punch list', term_es: 'Lista de pendientes', def: 'List of incomplete or defective items to fix before final acceptance.', def_es: 'Lista de trabajos incompletos o defectuosos que se corrigen antes de la aceptación final.' },
      { term: 'Substantial completion', term_es: 'Terminación sustancial', def: 'Point when the building can be used for its purpose even if minor punch items remain.', def_es: 'Momento en que el edificio ya puede usarse para su fin aunque queden pendientes menores.' },
      { term: 'Certificate of occupancy (CO)', term_es: 'Certificado de ocupación', def: 'Document from the building department allowing people to occupy the building.', def_es: 'Documento del departamento de construcción que permite ocupar el edificio.' },
      { term: 'Schedule of values', term_es: 'Desglose de valores', def: 'Breakdown of the contract price by work item, used to bill progress payments.', def_es: 'Desglose del precio del contrato por partida, usado para facturar pagos por avance.' },
      { term: 'Retainage', term_es: 'Retención', def: 'Portion of each payment held back until the work is complete and accepted.', def_es: 'Parte de cada pago que se retiene hasta que el trabajo se termina y se acepta.' },
    ],
  },
  recipes: [],
});
