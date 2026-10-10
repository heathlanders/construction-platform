// intake/common-steps.ts — request-level steps shared by every trade (site, timeline & budget).
//
// Versioned independently of trade modules (design_requests.common_intake_version). The HOA question
// only shows for work that touches the outside. Photos are NOT here — each module declares its own
// photo roles (a patio wants the yard, a kitchen wants the room).

import type { StepDef, TradeIntakeModule } from './types.js';

export const COMMON_INTAKE_VERSION = 1;

export function commonSteps(location: TradeIntakeModule['location'] | 'mixed'): StepDef[] {
  const exterior = location !== 'interior';
  return [
    {
      id: 'site',
      title: { en: 'About the property', es: 'Sobre la propiedad' },
      fields: [
        {
          id: 'property_type', type: 'choice', required: true,
          label: { en: 'Type of property', es: 'Tipo de propiedad' },
          options: [
            { value: 'house', label: { en: 'House', es: 'Casa' } },
            { value: 'townhome', label: { en: 'Townhome', es: 'Casa adosada' } },
            { value: 'condo', label: { en: 'Condo / apartment', es: 'Condominio / apartamento' } },
            { value: 'commercial', label: { en: 'Business / commercial', es: 'Negocio / comercial' } },
          ],
        },
        {
          id: 'ownership', type: 'choice', required: true,
          label: { en: 'Do you own or rent?', es: '¿Es dueño o renta?' },
          options: [
            { value: 'own', label: { en: 'I own it', es: 'Soy dueño' } },
            { value: 'rent', label: { en: 'I rent', es: 'Rento' } },
          ],
        },
        ...(exterior ? [{
          id: 'hoa', type: 'choice' as const, required: true,
          label: { en: 'Is there an HOA (homeowners association)?', es: '¿Hay una asociación de propietarios (HOA)?' },
          options: [
            { value: 'yes', label: { en: 'Yes', es: 'Sí' } },
            { value: 'no', label: { en: 'No', es: 'No' } },
            { value: 'unsure', label: { en: 'Not sure', es: 'No estoy seguro' } },
          ],
        }] : []),
        {
          id: 'access_notes', type: 'text', max_len: 500,
          label: { en: 'Access notes (gates, pets, parking)', es: 'Notas de acceso (portones, mascotas, estacionamiento)' },
        },
      ],
    },
    {
      id: 'timeline_budget',
      title: { en: 'Timing and budget', es: 'Fechas y presupuesto' },
      fields: [
        {
          id: 'timeline', type: 'choice', required: true,
          label: { en: 'When would you like it done?', es: '¿Cuándo le gustaría hacerlo?' },
          options: [
            { value: 'asap', label: { en: 'As soon as possible', es: 'Lo antes posible' } },
            { value: '1_3_months', label: { en: 'In 1–3 months', es: 'En 1 a 3 meses' } },
            { value: '3_6_months', label: { en: 'In 3–6 months', es: 'En 3 a 6 meses' } },
            { value: 'planning', label: { en: 'Just planning', es: 'Solo estoy planeando' } },
          ],
        },
        {
          id: 'budget_band', type: 'choice',
          label: { en: 'Rough budget (optional)', es: 'Presupuesto aproximado (opcional)' },
          options: [
            { value: 'under_5k', label: { en: 'Under $5,000', es: 'Menos de $5,000' } },
            { value: '5k_15k', label: { en: '$5,000–$15,000', es: '$5,000 a $15,000' } },
            { value: '15k_50k', label: { en: '$15,000–$50,000', es: '$15,000 a $50,000' } },
            { value: 'over_50k', label: { en: 'Over $50,000', es: 'Más de $50,000' } },
            { value: 'unsure', label: { en: 'Not sure yet', es: 'Aún no sé' } },
          ],
        },
      ],
    },
  ];
}
