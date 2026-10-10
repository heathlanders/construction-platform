// Trade Knowledge Pack — architectural (Architectural General). Wave 23, UMBRELLA pattern: identity +
// glossary only, no recipes/hazards/QA. Interior and envelope depth lives in the child packs.
// Dossier: docs/trade-packs/dossiers/architectural.md.
import { definePack } from './schema.js';

export default definePack({
  key: 'architectural',
  schema_version: 1,
  pack_version: '1.0.0',
  status: 'draft',
  identity: {
    summary: 'Roll-up key for architectural scope — the walls, ceilings, openings and finishes shown on the A-sheets. Detailed knowledge lives in the interior and envelope packs: drywall, metal_stud_framing, acoustical_ceilings, doors_hardware, millwork, toilet_partitions, specialties, windows, glazing, curtain_wall, siding and roofing.',
    summary_es: 'Clave general para el alcance arquitectónico: muros, plafones, vanos y acabados indicados en las hojas A. El detalle está en los paquetes de interiores y envolvente: drywall, metal_stud_framing, acoustical_ceilings, doors_hardware, millwork, toilet_partitions, specialties, windows, glazing, curtain_wall, siding y roofing.',
    glossary: [
      { term: 'Finish schedule', term_es: 'Tabla de acabados', def: 'Table on the drawings listing the floor, base, wall and ceiling finish for each room.', def_es: 'Tabla en los planos que indica el acabado de piso, zoclo, muros y plafón de cada cuarto.' },
      { term: 'Reflected ceiling plan (RCP)', term_es: 'Plano de plafones reflejado', def: 'Plan view of the ceiling showing grid, heights, lights and diffusers as if seen in a mirror on the floor.', def_es: 'Vista en planta del plafón con retícula, alturas, luminarias y difusores, como vista en un espejo en el piso.' },
      { term: 'Partition type', term_es: 'Tipo de muro divisorio', def: 'Tagged wall assembly on the plans defining studs, board layers, insulation and height.', def_es: 'Ensamble de muro marcado en planos que define montantes, capas de panel, aislamiento y altura.' },
      { term: 'Fire-rated assembly', term_es: 'Ensamble con resistencia al fuego', def: 'Wall, floor or ceiling built to a tested design that resists fire for a set number of hours.', def_es: 'Muro, piso o plafón construido según un diseño probado que resiste el fuego por cierto número de horas.' },
      { term: 'Door schedule', term_es: 'Tabla de puertas', def: 'Table listing each door with size, type, frame, rating and hardware set.', def_es: 'Tabla que indica cada puerta con medida, tipo, marco, clasificación y juego de herrajes.' },
      { term: 'Elevation', term_es: 'Alzado', def: 'Drawing of a wall or building face seen straight on, showing heights and finishes.', def_es: 'Dibujo de un muro o fachada visto de frente, con alturas y acabados.' },
      { term: 'STC rating', term_es: 'Clasificación STC', def: 'Number rating how well a wall or floor blocks airborne sound; higher is quieter.', def_es: 'Número que califica qué tan bien un muro o piso bloquea el sonido aéreo; más alto es más silencioso.' },
      { term: 'Accessible route', term_es: 'Ruta accesible', def: 'Continuous path that people using wheelchairs can travel, with limits on slope, width and thresholds.', def_es: 'Recorrido continuo que pueden usar personas en silla de ruedas, con límites de pendiente, ancho y umbrales.' },
    ],
  },
  recipes: [],
});
