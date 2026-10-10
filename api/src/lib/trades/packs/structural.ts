// Trade Knowledge Pack — structural (Structural General). Wave 23, UMBRELLA pattern: identity +
// glossary only, no recipes/hazards/QA. The structural branch of task-buildout/building.ts keeps
// producing steps; trade depth lives in the child packs. Dossier: docs/trade-packs/dossiers/structural.md.
import { definePack } from './schema.js';

export default definePack({
  key: 'structural',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Roll-up key for the structural frame that carries gravity, wind and seismic loads. Detailed knowledge lives in the structural packs — framing, structural_steel, metal_decking, misc_metals, welding, truss_setting, heavy_timber, post_frame, pemb, panelized_sips — plus concrete, rebar and masonry.',
    summary_es: 'Clave general para la estructura que soporta cargas de gravedad, viento y sismo. El detalle está en los paquetes estructurales: framing, structural_steel, metal_decking, misc_metals, welding, truss_setting, heavy_timber, post_frame, pemb, panelized_sips, además de concrete, rebar y masonry.',
    glossary: [
      { term: 'Load path', term_es: 'Trayectoria de cargas', def: 'Continuous chain of members and connections that carries loads from the roof down to the foundation.', def_es: 'Cadena continua de elementos y conexiones que lleva las cargas del techo hasta la cimentación.' },
      { term: 'Dead load', term_es: 'Carga muerta', def: 'Permanent weight of the building itself: framing, finishes, fixed equipment.', def_es: 'Peso permanente del propio edificio: estructura, acabados, equipo fijo.' },
      { term: 'Live load', term_es: 'Carga viva', def: 'Movable weight from people, furniture, stored goods and snow.', def_es: 'Peso variable de personas, muebles, mercancía y nieve.' },
      { term: 'Header', term_es: 'Cabezal (dintel)', def: 'Beam over an opening that carries the load above it to the sides.', def_es: 'Viga sobre un vano que lleva la carga de arriba hacia los lados.' },
      { term: 'Shear wall', term_es: 'Muro de cortante', def: 'Wall designed to resist sideways wind or earthquake forces.', def_es: 'Muro diseñado para resistir fuerzas laterales de viento o sismo.' },
      { term: 'Moment frame', term_es: 'Marco rígido (resistente a momento)', def: 'Frame whose rigid beam-column joints resist sideways forces without braces or shear walls.', def_es: 'Marco cuyas uniones rígidas viga-columna resisten fuerzas laterales sin contravientos ni muros de cortante.' },
      { term: 'Diaphragm', term_es: 'Diafragma', def: 'Floor or roof deck that spreads sideways loads to the shear walls or frames.', def_es: 'Piso o cubierta que reparte las cargas laterales hacia los muros de cortante o marcos.' },
      { term: 'Hold-down', term_es: 'Anclaje de sujeción (hold-down)', def: 'Connector that ties the end of a shear wall to the foundation against uplift.', def_es: 'Conector que amarra el extremo de un muro de cortante a la cimentación contra el levantamiento.' },
      { term: 'Special inspection', term_es: 'Inspección especial', def: 'Third-party inspection of critical structural work such as welds, bolts or high-strength concrete.', def_es: 'Inspección por un tercero de trabajos estructurales críticos como soldaduras, pernos o concreto de alta resistencia.' },
    ],
  },
  recipes: [],
});
