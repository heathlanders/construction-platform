// Trade Knowledge Pack — finishes (Finishes General). Wave 23, UMBRELLA pattern: identity + glossary
// only, no recipes/hazards/QA. The finishes branch of task-buildout/building.ts keeps producing steps;
// trade depth lives in the child packs. Dossier: docs/trade-packs/dossiers/finishes.md.
import { definePack } from './schema.js';

export default definePack({
  key: 'finishes',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Roll-up key for interior finish work after drywall. Detailed knowledge lives in the finish packs — painting, wallcovering, tile, flooring_carpet, flooring_wood, flooring_resilient, flooring_epoxy, terrazzo, underlayment_leveling, countertops, cabinetry, finish_carpentry, millwork and window_treatments.',
    summary_es: 'Clave general para los acabados interiores después del panel de yeso. El detalle está en los paquetes de acabados: painting, wallcovering, tile, flooring_carpet, flooring_wood, flooring_resilient, flooring_epoxy, terrazzo, underlayment_leveling, countertops, cabinetry, finish_carpentry, millwork y window_treatments.',
    glossary: [
      { term: 'Substrate', term_es: 'Sustrato (superficie base)', def: 'Surface a finish is applied to, such as drywall, a concrete slab or underlayment.', def_es: 'Superficie sobre la que se aplica un acabado, como panel de yeso, losa de concreto o bajo piso.' },
      { term: 'Cure time', term_es: 'Tiempo de curado', def: 'Wait time before a coating, adhesive or slab is ready for the next step or for traffic.', def_es: 'Tiempo de espera antes de que un recubrimiento, adhesivo o losa esté listo para el siguiente paso o para tránsito.' },
      { term: 'Moisture test', term_es: 'Prueba de humedad', def: 'Check of slab or wood moisture before installing flooring, compared with the maker\'s limit.', def_es: 'Revisión de la humedad de la losa o la madera antes de instalar pisos, comparada con el límite del fabricante.' },
      { term: 'Transition strip', term_es: 'Perfil de transición', def: 'Trim piece where two floor finishes or heights meet.', def_es: 'Moldura donde se juntan dos acabados o alturas de piso.' },
      { term: 'Sheen', term_es: 'Brillo (acabado de pintura)', def: 'Gloss level of paint: flat, eggshell, satin, semi-gloss or gloss.', def_es: 'Nivel de brillo de la pintura: mate, cascarón de huevo, satinado, semibrillante o brillante.' },
      { term: 'Drywall finish level', term_es: 'Nivel de acabado del panel de yeso', def: 'Grade (0–5) of taping and mud on drywall, chosen to suit the paint and lighting.', def_es: 'Grado (0–5) de cinta y compuesto en el panel de yeso, según la pintura y la iluminación.' },
      { term: 'Attic stock', term_es: 'Material de reserva', def: 'Extra finish material left with the owner for future repairs.', def_es: 'Material de acabado adicional que se deja al dueño para reparaciones futuras.' },
      { term: 'Mockup', term_es: 'Muestra de obra (mockup)', def: 'Sample area finished first so the owner can approve color, pattern and quality.', def_es: 'Área de muestra que se termina primero para que el dueño apruebe color, patrón y calidad.' },
    ],
  },
  recipes: [],
});
