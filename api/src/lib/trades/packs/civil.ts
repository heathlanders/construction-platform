// Trade Knowledge Pack — civil (Civil / Sitework General). Wave 23, UMBRELLA pattern: identity +
// glossary only, no recipes/hazards/QA. The hand recipe in task-buildout/building.ts produces the
// steps for the 3 template tasks tagged civil; sitework depth lives in the child packs.
// Dossier: docs/trade-packs/dossiers/civil.md.
import { definePack } from './schema.js';

export default definePack({
  key: 'civil',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Roll-up key for civil and sitework scope: clearing, earthwork, utilities, drainage and paving. Detailed knowledge lives in the sitework packs — excavation, demolition, erosion_control, dewatering, site_utilities, shoring_underpinning, deep_foundations, asphalt_paving, concrete_flatwork, retaining_walls, fencing and landscaping.',
    summary_es: 'Clave general para la obra civil y del sitio: desmonte, movimiento de tierras, servicios, drenaje y pavimentos. El detalle está en los paquetes de sitio: excavation, demolition, erosion_control, dewatering, site_utilities, shoring_underpinning, deep_foundations, asphalt_paving, concrete_flatwork, retaining_walls, fencing y landscaping.',
    glossary: [
      { term: 'Grading', term_es: 'Nivelación (rasante)', def: 'Shaping the ground to the elevations and slopes on the grading plan.', def_es: 'Dar forma al terreno según las cotas y pendientes del plano de nivelación.' },
      { term: 'Cut and fill', term_es: 'Corte y relleno', def: 'Removing soil from high areas and placing it in low areas to reach design grade.', def_es: 'Quitar tierra de las zonas altas y colocarla en las bajas para llegar a la rasante de diseño.' },
      { term: 'Subgrade', term_es: 'Subrasante', def: 'Prepared native soil that supports the base course, slab or pavement.', def_es: 'Suelo natural preparado que soporta la base, la losa o el pavimento.' },
      { term: 'Compaction', term_es: 'Compactación', def: 'Densifying soil or base in lifts so it does not settle; checked with density tests.', def_es: 'Densificar suelo o base por capas para que no se asiente; se verifica con pruebas de densidad.' },
      { term: 'Aggregate base', term_es: 'Base de agregado', def: 'Layer of crushed stone placed and compacted over subgrade under paving or slabs.', def_es: 'Capa de piedra triturada colocada y compactada sobre la subrasante bajo pavimentos o losas.' },
      { term: 'Storm sewer', term_es: 'Drenaje pluvial', def: 'Pipes and structures that carry rainwater runoff away from the site.', def_es: 'Tuberías y estructuras que retiran el agua de lluvia del sitio.' },
      { term: 'Invert', term_es: 'Cota de fondo (invert)', def: 'Elevation of the inside bottom of a pipe or structure.', def_es: 'Elevación del fondo interior de un tubo o estructura.' },
      { term: 'Benchmark', term_es: 'Banco de nivel', def: 'Fixed point of known elevation used to set grades on the site.', def_es: 'Punto fijo de elevación conocida que se usa para marcar niveles en el sitio.' },
    ],
  },
  recipes: [],
});
