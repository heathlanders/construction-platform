// lib/trades/taxonomy.ts — canonical construction subcontractor trade taxonomy.
//
// SINGLE SOURCE OF TRUTH for every trade the platform knows about (T-64). Every other
// trade-enumerating surface derives from (or must stay consistent with) this list:
//   - tradeToPermitTrade() (lib/jurisdictions/trade-map.ts) reads permit_trade from here
//   - blueprint TradeType (lib/blueprint-templates/types.ts) is the 13-key legacy subset
//   - vendors.trade_type values should be keys (or aliases) from this list
//   - GET /v1/trades serves this list to web/mobile pickers
//
// Design rules:
//   - `key` is stable snake_case; NEVER rename a key (free-text trade_type columns store it).
//   - `permit_trade` collapses onto the 4-trade codes engine (T-59): electrical | plumbing |
//     mechanical | building. `null` = professional/logistics service with no AHJ permit path
//     (surveying, testing, cleaning …) — buildTaskSteps() yields no code-gated steps for those.
//   - `default_phase` is the construction phase the trade's work typically lands in
//     (PhaseType from blueprint-templates); scheduling hint only, tasks can override.
//   - `csi_division` = primary CSI MasterFormat division/section prefix.
//   - `aliases` are accepted lookup synonyms (e.g. 'mechanical' → hvac, 'striping' →
//     pavement_marking). Aliases must not collide with any key.

import type { Trade } from '../jurisdictions/types.js';

export type TradeCategory =
  | 'sitework'          // Div 31–33 — earthwork, utilities, paving, landscape
  | 'concrete_masonry'  // Div 3–4
  | 'structural'        // Div 5–6 rough structure
  | 'envelope'          // Div 7–8 — roofing, waterproofing, cladding, openings
  | 'electrical_systems'// Div 26–28 + solar/EV/generators
  | 'plumbing_systems'  // Div 21–22 + gas/med-gas/process piping
  | 'mechanical_systems'// Div 23/25 + refrigeration/controls/TAB
  | 'interior'          // Div 9–12 finishes
  | 'specialty'         // Div 10–14, 41+ — equipment, pools, abatement, logistics
  | 'heavy_civil'       // NAICS 237 — pipelines, power/telecom lines, roads, bridges, marine, rail
  | 'services';         // professional/inspection services (vendor-only, no permit)

export interface TradeDef {
  key: string;
  label: string;
  /** Spanish display label (P-09 — ES is a launch gate; trade names are not safety content). */
  label_es: string;
  category: TradeCategory;
  csi_division: string;
  default_phase:
    | 'site_prep' | 'foundation' | 'framing' | 'roofing' | 'rough_in' | 'inspections'
    | 'insulation' | 'drywall' | 'finishes_interior' | 'finishes_exterior' | 'sitework'
    | 'commissioning' | 'punch';
  permit_trade: Trade | null;
  /** Legacy blueprint TradeType key (the original 13) — kept stable for backward compat. */
  legacy?: boolean;
  /** Umbrella/roll-up keys (general, finishes …) that group finer trades below them. */
  umbrella?: boolean;
  aliases?: string[];
}

const T = (d: TradeDef): TradeDef => d;

export const TRADE_TAXONOMY: readonly TradeDef[] = [
  // ── Sitework / Civil (Div 31–33) ─────────────────────────────────────────────
  T({ key: 'civil', label: 'Civil / Sitework (General)', label_es: 'Obra civil / Sitio (general)', category: 'sitework', csi_division: '33', default_phase: 'site_prep', permit_trade: 'building', legacy: true, umbrella: true }),
  T({ key: 'demolition', label: 'Demolition', label_es: 'Demolición', category: 'sitework', csi_division: '02 41', default_phase: 'site_prep', permit_trade: 'building', aliases: ['demo'] }),
  T({ key: 'excavation', label: 'Excavation / Earthwork / Grading', label_es: 'Excavación y nivelación', category: 'sitework', csi_division: '31 23', default_phase: 'site_prep', permit_trade: 'building', aliases: ['earthwork', 'grading', 'trenching', 'rock_excavation', 'hydro_excavation'] }),
  T({ key: 'erosion_control', label: 'Erosion & Sediment Control', label_es: 'Control de erosión y sedimentos', category: 'sitework', csi_division: '31 25', default_phase: 'site_prep', permit_trade: 'building' }),
  T({ key: 'shoring_underpinning', label: 'Shoring / Underpinning', label_es: 'Apuntalamiento / Recalce', category: 'sitework', csi_division: '31 50', default_phase: 'site_prep', permit_trade: 'building', aliases: ['shoring'] }),
  T({ key: 'deep_foundations', label: 'Deep Foundations (Piles / Caissons / Helical)', label_es: 'Cimentaciones profundas (pilotes / caissons)', category: 'sitework', csi_division: '31 60', default_phase: 'foundation', permit_trade: 'building', aliases: ['piling', 'caissons'] }),
  T({ key: 'dewatering', label: 'Dewatering', label_es: 'Abatimiento de agua (bombeo)', category: 'sitework', csi_division: '31 23 19', default_phase: 'site_prep', permit_trade: 'building' }),
  T({ key: 'site_utilities', label: 'Site Utilities (Water / Sewer / Storm)', label_es: 'Servicios de sitio (agua / drenaje / pluvial)', category: 'sitework', csi_division: '33 10', default_phase: 'site_prep', permit_trade: 'plumbing', aliases: ['underground_utilities'] }),
  T({ key: 'septic', label: 'Septic Systems', label_es: 'Sistemas sépticos', category: 'sitework', csi_division: '33 34', default_phase: 'sitework', permit_trade: 'plumbing' }),
  T({ key: 'well_drilling', label: 'Well Drilling', label_es: 'Perforación de pozos', category: 'sitework', csi_division: '33 21', default_phase: 'site_prep', permit_trade: 'plumbing' }),
  T({ key: 'asphalt_paving', label: 'Asphalt Paving', label_es: 'Pavimentación de asfalto', category: 'sitework', csi_division: '32 12', default_phase: 'sitework', permit_trade: 'building', aliases: ['paving', 'blacktop'] }),
  T({ key: 'concrete_flatwork', label: 'Concrete Flatwork (Drives / Walks / Curb & Gutter)', label_es: 'Losas de concreto (entradas / banquetas)', category: 'sitework', csi_division: '32 13', default_phase: 'sitework', permit_trade: 'building', aliases: ['flatwork', 'curb_gutter'] }),
  T({ key: 'pavement_marking', label: 'Pavement Marking / Striping', label_es: 'Señalización de pavimento / Rayado', category: 'sitework', csi_division: '32 17 23', default_phase: 'sitework', permit_trade: null, aliases: ['striping', 'parking_lot_striping', 'line_painting'] }),
  T({ key: 'fencing', label: 'Fencing & Gates', label_es: 'Cercas y portones', category: 'sitework', csi_division: '32 31', default_phase: 'sitework', permit_trade: 'building' }),
  T({ key: 'landscaping', label: 'Landscaping', label_es: 'Jardinería / Paisajismo', category: 'sitework', csi_division: '32 90', default_phase: 'sitework', permit_trade: null, aliases: ['landscape_lighting'] }),
  T({ key: 'irrigation', label: 'Irrigation', label_es: 'Riego', category: 'sitework', csi_division: '32 84', default_phase: 'sitework', permit_trade: 'plumbing' }),
  T({ key: 'retaining_walls', label: 'Retaining Walls', label_es: 'Muros de contención', category: 'sitework', csi_division: '32 32', default_phase: 'sitework', permit_trade: 'building', aliases: ['segmental_retaining_wall'] }),
  T({ key: 'site_furnishings', label: 'Site Furnishings', label_es: 'Mobiliario de sitio', category: 'sitework', csi_division: '32 33', default_phase: 'sitework', permit_trade: null }),
  T({ key: 'hardscape_pavers', label: 'Hardscape / Pavers (Patios / Walks / Outdoor Kitchens)', label_es: 'Hardscape / Adoquines (patios / andadores / cocinas exteriores)', category: 'sitework', csi_division: '32 14', default_phase: 'sitework', permit_trade: null, aliases: ['hardscape', 'pavers', 'paver_patio', 'outdoor_kitchen'] }),
  T({ key: 'tree_service', label: 'Tree Service / Land Clearing', label_es: 'Servicio de árboles / Desmonte', category: 'sitework', csi_division: '31 13', default_phase: 'site_prep', permit_trade: null, aliases: ['arborist', 'tree_removal', 'land_clearing', 'stump_grinding'] }),
  T({ key: 'docks_marine_residential', label: 'Docks / Boat Lifts / Shoreline (Residential)', label_es: 'Muelles / Elevadores de botes / Riberas (residencial)', category: 'sitework', csi_division: '35 51', default_phase: 'sitework', permit_trade: null, aliases: ['dock', 'boat_lift', 'pier', 'shoreline_protection'] }),
  T({ key: 'gate_operators', label: 'Automatic Gates / Gate Operators', label_es: 'Portones automáticos / Operadores de portón', category: 'sitework', csi_division: '32 31', default_phase: 'sitework', permit_trade: 'electrical', aliases: ['gate_operator', 'automatic_gate', 'gate_automation'] }),

  // ── Concrete / Masonry (Div 3–4) ─────────────────────────────────────────────
  T({ key: 'concrete', label: 'Concrete (Footings / Foundations / Slabs)', label_es: 'Concreto (zapatas / cimentaciones / losas)', category: 'concrete_masonry', csi_division: '03 30', default_phase: 'foundation', permit_trade: 'building', legacy: true, aliases: ['cement_mason', 'concrete_finishing'] }),
  T({ key: 'concrete_pumping', label: 'Concrete Pumping', label_es: 'Bombeo de concreto', category: 'concrete_masonry', csi_division: '03 30', default_phase: 'foundation', permit_trade: null }),
  T({ key: 'rebar', label: 'Reinforcing Steel (Rebar)', label_es: 'Acero de refuerzo (varilla)', category: 'concrete_masonry', csi_division: '03 20', default_phase: 'foundation', permit_trade: 'building', aliases: ['reinforcing_steel'] }),
  T({ key: 'post_tensioning', label: 'Post-Tensioning', label_es: 'Postensado', category: 'concrete_masonry', csi_division: '03 38', default_phase: 'foundation', permit_trade: 'building' }),
  T({ key: 'shotcrete', label: 'Shotcrete / Gunite', label_es: 'Concreto lanzado (shotcrete / gunite)', category: 'concrete_masonry', csi_division: '03 37', default_phase: 'foundation', permit_trade: 'building', aliases: ['gunite'] }),
  T({ key: 'concrete_cutting', label: 'Concrete Cutting / Coring', label_es: 'Corte / Perforación de concreto', category: 'concrete_masonry', csi_division: '03 81', default_phase: 'foundation', permit_trade: null, aliases: ['coring'] }),
  T({ key: 'concrete_polishing', label: 'Concrete Polishing / Staining / Sealing', label_es: 'Pulido / Teñido / Sellado de concreto', category: 'concrete_masonry', csi_division: '03 35', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'masonry', label: 'Masonry (Brick / Block / Stone)', label_es: 'Mampostería (ladrillo / bloque / piedra)', category: 'concrete_masonry', csi_division: '04 20', default_phase: 'framing', permit_trade: 'building', aliases: ['brick', 'block', 'stone'] }),
  T({ key: 'precast_erection', label: 'Precast Concrete Erection', label_es: 'Montaje de concreto prefabricado', category: 'concrete_masonry', csi_division: '03 41', default_phase: 'framing', permit_trade: 'building', aliases: ['precast'] }),
  T({ key: 'formwork', label: 'Concrete Formwork / ICF', label_es: 'Cimbra para concreto / ICF', category: 'concrete_masonry', csi_division: '03 10', default_phase: 'foundation', permit_trade: 'building', aliases: ['forming', 'concrete_forming', 'forms', 'icf'] }),
  T({ key: 'foundation_repair', label: 'Foundation Repair / Piering / Leveling', label_es: 'Reparación de cimentación / Pilotes / Nivelación', category: 'concrete_masonry', csi_division: '31 60', default_phase: 'foundation', permit_trade: 'building', aliases: ['piering', 'helical_piers', 'push_piers', 'house_leveling', 'wall_anchors'] }),
  T({ key: 'concrete_repair_lifting', label: 'Concrete Repair / Lifting (Mudjacking / Polyjacking)', label_es: 'Reparación / Nivelación de concreto (inyección)', category: 'concrete_masonry', csi_division: '03 01 30', default_phase: 'sitework', permit_trade: null, aliases: ['mudjacking', 'polyjacking', 'slabjacking', 'concrete_leveling', 'concrete_repair', 'concrete_restoration'] }),
  T({ key: 'chimney', label: 'Chimney (Masonry / Liners / Sweep)', label_es: 'Chimeneas (mampostería / ductos / limpieza)', category: 'concrete_masonry', csi_division: '04 57', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['chimney_sweep', 'chimney_liner', 'chimney_repair', 'flue'] }),

  // ── Structural / Rough (Div 5–6) ─────────────────────────────────────────────
  T({ key: 'structural', label: 'Structural (General)', label_es: 'Estructural (general)', category: 'structural', csi_division: '05', default_phase: 'framing', permit_trade: 'building', legacy: true, umbrella: true }),
  T({ key: 'framing', label: 'Rough Carpentry / Framing (Wood)', label_es: 'Estructura de madera / Armazón', category: 'structural', csi_division: '06 10', default_phase: 'framing', permit_trade: 'building', legacy: true, aliases: ['rough_carpentry'] }),
  T({ key: 'structural_steel', label: 'Structural Steel Erection', label_es: 'Montaje de acero estructural', category: 'structural', csi_division: '05 12', default_phase: 'framing', permit_trade: 'building', aliases: ['steel_erection', 'steel_joists'] }),
  T({ key: 'metal_decking', label: 'Metal Decking', label_es: 'Lámina de entrepiso metálica', category: 'structural', csi_division: '05 30', default_phase: 'framing', permit_trade: 'building' }),
  T({ key: 'misc_metals', label: 'Miscellaneous / Ornamental Metals (Rails / Stairs)', label_es: 'Metales misceláneos (barandales / escaleras)', category: 'structural', csi_division: '05 50', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['ornamental_metals'] }),
  T({ key: 'welding', label: 'Welding', label_es: 'Soldadura', category: 'structural', csi_division: '05 05', default_phase: 'framing', permit_trade: 'building' }),
  T({ key: 'truss_setting', label: 'Truss Supply & Setting', label_es: 'Suministro y montaje de armaduras (trusses)', category: 'structural', csi_division: '06 17', default_phase: 'framing', permit_trade: 'building', aliases: ['trusses'] }),
  T({ key: 'panelized_sips', label: 'Panelized / SIPs', label_es: 'Paneles / SIPs', category: 'structural', csi_division: '06 12', default_phase: 'framing', permit_trade: 'building', aliases: ['sips'] }),
  T({ key: 'post_frame', label: 'Post-Frame Construction', label_es: 'Construcción de marco de postes (post-frame)', category: 'structural', csi_division: '06 13', default_phase: 'framing', permit_trade: 'building', aliases: ['pole_barn_framing'] }),
  T({ key: 'heavy_timber', label: 'Heavy Timber / Mass Timber', label_es: 'Madera pesada / Madera masiva', category: 'structural', csi_division: '06 13', default_phase: 'framing', permit_trade: 'building', aliases: ['mass_timber', 'timber_framing'] }),
  T({ key: 'pemb', label: 'Pre-Engineered Metal Buildings', label_es: 'Edificios metálicos preingenierizados', category: 'structural', csi_division: '13 34 19', default_phase: 'framing', permit_trade: 'building', aliases: ['metal_building', 'steel_building', 'pre_engineered_building', 'pemb_erection'] }),
  T({ key: 'decks', label: 'Decks & Porches', label_es: 'Terrazas (decks) y porches', category: 'structural', csi_division: '06 15', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['deck', 'deck_builder', 'porch', 'composite_decking'] }),
  T({ key: 'manufactured_modular', label: 'Manufactured / Modular Home Set', label_es: 'Instalación de casas prefabricadas / modulares', category: 'structural', csi_division: '13 42', default_phase: 'framing', permit_trade: 'building', aliases: ['modular', 'manufactured_home', 'mobile_home_setup', 'modular_set'] }),
  T({ key: 'house_moving', label: 'Building Moving / House Raising', label_es: 'Traslado / Elevación de casas', category: 'structural', csi_division: '02 41', default_phase: 'site_prep', permit_trade: 'building', aliases: ['house_raising', 'structure_moving', 'building_moving', 'house_lifting'] }),

  // ── Envelope (Div 7–8) ───────────────────────────────────────────────────────
  T({ key: 'roofing', label: 'Roofing', label_es: 'Techado', category: 'envelope', csi_division: '07 30', default_phase: 'roofing', permit_trade: 'building', legacy: true, aliases: ['roof_coating', 'green_roof'] }),
  T({ key: 'sheet_metal_flashing', label: 'Sheet Metal / Flashing', label_es: 'Hojalatería / Botaguas', category: 'envelope', csi_division: '07 62', default_phase: 'roofing', permit_trade: 'building', aliases: ['flashing'] }),
  T({ key: 'gutters', label: 'Gutters & Downspouts', label_es: 'Canalones y bajantes', category: 'envelope', csi_division: '07 71', default_phase: 'finishes_exterior', permit_trade: null }),
  T({ key: 'waterproofing', label: 'Waterproofing / Dampproofing', label_es: 'Impermeabilización', category: 'envelope', csi_division: '07 10', default_phase: 'foundation', permit_trade: 'building', aliases: ['dampproofing', 'basement_waterproofing', 'crawlspace_encapsulation'] }),
  T({ key: 'air_barrier', label: 'Air / Vapor Barrier', label_es: 'Barrera de aire / vapor', category: 'envelope', csi_division: '07 27', default_phase: 'insulation', permit_trade: 'building', aliases: ['vapor_barrier', 'house_wrap'] }),
  T({ key: 'insulation', label: 'Insulation (Batt / Blown / Rigid)', label_es: 'Aislamiento (colchoneta / soplado / rígido)', category: 'envelope', csi_division: '07 21', default_phase: 'insulation', permit_trade: 'building', legacy: true }),
  T({ key: 'spray_foam', label: 'Spray Foam Insulation', label_es: 'Aislamiento de espuma en aerosol', category: 'envelope', csi_division: '07 21 29', default_phase: 'insulation', permit_trade: 'building' }),
  T({ key: 'fireproofing', label: 'Spray-Applied Fireproofing', label_es: 'Ignifugado aplicado por aspersión', category: 'envelope', csi_division: '07 81', default_phase: 'framing', permit_trade: 'building' }),
  T({ key: 'firestopping', label: 'Firestopping', label_es: 'Sellado cortafuego', category: 'envelope', csi_division: '07 84', default_phase: 'framing', permit_trade: 'building' }),
  T({ key: 'siding', label: 'Siding (Vinyl / Fiber Cement / Wood)', label_es: 'Revestimiento exterior (vinilo / fibrocemento / madera)', category: 'envelope', csi_division: '07 46', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['cladding'] }),
  T({ key: 'stucco_eifs', label: 'Stucco / EIFS', label_es: 'Estuco / EIFS', category: 'envelope', csi_division: '09 24', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['stucco', 'eifs'] }),
  T({ key: 'curtain_wall', label: 'Curtain Wall / Storefront', label_es: 'Muro cortina / Fachada comercial', category: 'envelope', csi_division: '08 44', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['storefront'] }),
  T({ key: 'glazing', label: 'Glazing / Glass', label_es: 'Cristalería / Vidrio', category: 'envelope', csi_division: '08 80', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['glass', 'shower_doors', 'mirrors', 'window_film'] }),
  T({ key: 'windows', label: 'Window Installation', label_es: 'Instalación de ventanas', category: 'envelope', csi_division: '08 50', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['window_install'] }),
  T({ key: 'exterior_doors', label: 'Exterior Doors', label_es: 'Puertas exteriores', category: 'envelope', csi_division: '08 10', default_phase: 'finishes_exterior', permit_trade: 'building' }),
  T({ key: 'overhead_doors', label: 'Overhead / Garage Doors', label_es: 'Puertas de cochera / seccionales', category: 'envelope', csi_division: '08 36', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['garage_doors'] }),
  T({ key: 'skylights', label: 'Skylights', label_es: 'Tragaluces', category: 'envelope', csi_division: '08 62', default_phase: 'roofing', permit_trade: 'building' }),
  T({ key: 'caulking_sealants', label: 'Caulking / Joint Sealants', label_es: 'Calafateo / Selladores de juntas', category: 'envelope', csi_division: '07 92', default_phase: 'finishes_exterior', permit_trade: null, aliases: ['sealants'] }),
  T({ key: 'metal_panels', label: 'Architectural Metal Panels / ACM / Rainscreen', label_es: 'Paneles metálicos arquitectónicos / ACM / Fachada ventilada', category: 'envelope', csi_division: '07 42', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['acm', 'rainscreen', 'metal_wall_panels', 'composite_panels'] }),
  T({ key: 'patio_covers_awnings', label: 'Patio Covers / Pergolas / Awnings / Sunrooms', label_es: 'Cubiertas de patio / Pérgolas / Toldos / Solariums', category: 'envelope', csi_division: '10 73', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['pergola', 'awning', 'sunroom', 'screen_room', 'patio_cover', 'carport'] }),

  // ── Electrical systems (Div 26–28) ───────────────────────────────────────────
  T({ key: 'electrical', label: 'Electrical', label_es: 'Eléctrico', category: 'electrical_systems', csi_division: '26', default_phase: 'rough_in', permit_trade: 'electrical', legacy: true }),
  T({ key: 'low_voltage', label: 'Low Voltage / Structured Cabling', label_es: 'Baja tensión / Cableado estructurado', category: 'electrical_systems', csi_division: '27', default_phase: 'rough_in', permit_trade: 'electrical', aliases: ['data_cabling', 'structured_cabling', 'das', 'fiber', 'nurse_call', 'intercom'] }),
  T({ key: 'fire_alarm', label: 'Fire Alarm', label_es: 'Alarma contra incendios', category: 'electrical_systems', csi_division: '28 46', default_phase: 'rough_in', permit_trade: 'electrical' }),
  T({ key: 'security_access', label: 'Security / Access Control / CCTV', label_es: 'Seguridad / Control de acceso / CCTV', category: 'electrical_systems', csi_division: '28', default_phase: 'rough_in', permit_trade: 'electrical', aliases: ['security', 'access_control', 'cctv', 'locksmith'] }),
  T({ key: 'av_automation', label: 'AV / Home Automation', label_es: 'AV / Automatización del hogar', category: 'electrical_systems', csi_division: '27 41', default_phase: 'finishes_interior', permit_trade: 'electrical', aliases: ['audio_visual', 'home_automation'] }),
  T({ key: 'solar_pv', label: 'Solar PV', label_es: 'Solar fotovoltaico', category: 'electrical_systems', csi_division: '26 31', default_phase: 'finishes_exterior', permit_trade: 'electrical', aliases: ['solar', 'photovoltaic'] }),
  T({ key: 'ev_charging', label: 'EV Charging', label_es: 'Carga de vehículos eléctricos', category: 'electrical_systems', csi_division: '26 27', default_phase: 'sitework', permit_trade: 'electrical' }),
  T({ key: 'generators', label: 'Generators / Backup Power', label_es: 'Generadores / Energía de respaldo', category: 'electrical_systems', csi_division: '26 32', default_phase: 'commissioning', permit_trade: 'electrical', aliases: ['backup_power'] }),
  T({ key: 'battery_storage', label: 'Battery Energy Storage (ESS)', label_es: 'Almacenamiento de energía en baterías (ESS)', category: 'electrical_systems', csi_division: '26 33', default_phase: 'rough_in', permit_trade: 'electrical', aliases: ['ess', 'bess', 'home_battery', 'energy_storage'] }),
  T({ key: 'lightning_protection', label: 'Lightning Protection', label_es: 'Protección contra rayos (pararrayos)', category: 'electrical_systems', csi_division: '26 41', default_phase: 'finishes_exterior', permit_trade: null, aliases: ['lightning_rods', 'lps'] }),

  // ── Plumbing systems (Div 21–22) ─────────────────────────────────────────────
  T({ key: 'plumbing', label: 'Plumbing', label_es: 'Plomería', category: 'plumbing_systems', csi_division: '22', default_phase: 'rough_in', permit_trade: 'plumbing', legacy: true, aliases: ['water_heater', 'backflow', 'repiping'] }),
  T({ key: 'fire_sprinkler', label: 'Fire Sprinkler / Suppression', label_es: 'Rociadores contra incendios', category: 'plumbing_systems', csi_division: '21 13', default_phase: 'rough_in', permit_trade: 'plumbing', aliases: ['fire_suppression', 'sprinkler'] }),
  T({ key: 'gas_piping', label: 'Gas Piping', label_es: 'Tubería de gas', category: 'plumbing_systems', csi_division: '23 11', default_phase: 'rough_in', permit_trade: 'plumbing' }),
  T({ key: 'medical_gas', label: 'Medical Gas', label_es: 'Gases medicinales', category: 'plumbing_systems', csi_division: '22 62', default_phase: 'rough_in', permit_trade: 'plumbing' }),
  T({ key: 'process_piping', label: 'Process Piping', label_es: 'Tubería de proceso', category: 'plumbing_systems', csi_division: '40', default_phase: 'rough_in', permit_trade: 'plumbing' }),
  T({ key: 'water_treatment', label: 'Water Treatment / Filtration', label_es: 'Tratamiento / Filtración de agua', category: 'plumbing_systems', csi_division: '22 31', default_phase: 'commissioning', permit_trade: 'plumbing' }),
  T({ key: 'fire_protection_special', label: 'Special Fire Protection (Kitchen Hood / Clean Agent / Extinguishers)', label_es: 'Protección especial contra incendios (campanas / agente limpio / extintores)', category: 'plumbing_systems', csi_division: '21 22', default_phase: 'rough_in', permit_trade: 'building', aliases: ['kitchen_hood_suppression', 'hood_suppression', 'clean_agent', 'fire_extinguishers', 'extinguisher_service', 'special_hazards'] }),
  T({ key: 'trenchless_sewer', label: 'Sewer & Drain (Trenchless / Lining / Jetting)', label_es: 'Drenaje y alcantarillado (sin zanja / encamisado / hidrolavado)', category: 'plumbing_systems', csi_division: '33 01 30', default_phase: 'sitework', permit_trade: 'plumbing', aliases: ['pipe_lining', 'cipp', 'pipe_bursting', 'sewer_repair', 'drain_cleaning', 'hydro_jetting', 'sewer_camera'] }),

  // ── Mechanical systems (Div 23 / 25) ─────────────────────────────────────────
  T({ key: 'hvac', label: 'HVAC / Mechanical', label_es: 'HVAC / Mecánico', category: 'mechanical_systems', csi_division: '23', default_phase: 'rough_in', permit_trade: 'mechanical', legacy: true, aliases: ['mechanical', 'chiller', 'cooling_tower', 'duct_cleaning'] }),
  T({ key: 'ductwork', label: 'Sheet Metal Ductwork', label_es: 'Ductos de lámina', category: 'mechanical_systems', csi_division: '23 31', default_phase: 'rough_in', permit_trade: 'mechanical' }),
  T({ key: 'refrigeration', label: 'Commercial Refrigeration', label_es: 'Refrigeración comercial', category: 'mechanical_systems', csi_division: '23 60', default_phase: 'rough_in', permit_trade: 'mechanical' }),
  T({ key: 'boilers_hydronic', label: 'Boilers / Hydronic', label_es: 'Calderas / Hidrónico', category: 'mechanical_systems', csi_division: '23 52', default_phase: 'rough_in', permit_trade: 'mechanical', aliases: ['hydronic', 'boilers'] }),
  T({ key: 'geothermal', label: 'Geothermal', label_es: 'Geotérmico', category: 'mechanical_systems', csi_division: '23 21', default_phase: 'rough_in', permit_trade: 'mechanical' }),
  T({ key: 'mechanical_insulation', label: 'Mechanical / Pipe Insulation', label_es: 'Aislamiento mecánico / de tubería', category: 'mechanical_systems', csi_division: '23 07', default_phase: 'insulation', permit_trade: 'mechanical', aliases: ['pipe_insulation'] }),
  T({ key: 'test_balance', label: 'Test & Balance (TAB)', label_es: 'Prueba y balanceo (TAB)', category: 'mechanical_systems', csi_division: '23 05 93', default_phase: 'commissioning', permit_trade: 'mechanical', aliases: ['tab'] }),
  T({ key: 'controls_bms', label: 'Building Controls / BMS', label_es: 'Controles de edificio / BMS', category: 'mechanical_systems', csi_division: '25', default_phase: 'commissioning', permit_trade: 'mechanical', aliases: ['bms', 'building_automation'] }),
  T({ key: 'kitchen_exhaust', label: 'Commercial Kitchen Exhaust (Type I Hood / Grease Duct)', label_es: 'Extracción de cocina comercial (campana tipo I / ducto de grasa)', category: 'mechanical_systems', csi_division: '23 38 13', default_phase: 'rough_in', permit_trade: 'mechanical', aliases: ['kitchen_hood', 'grease_duct', 'type_i_hood', 'hood_cleaning'] }),
  T({ key: 'elevator', label: 'Elevator / Escalator / Conveying', label_es: 'Elevadores / Transporte vertical', category: 'mechanical_systems', csi_division: '14 20', default_phase: 'rough_in', permit_trade: 'building', aliases: ['escalator', 'conveying', 'wheelchair_lift', 'dumbwaiter'] }),

  // ── Interior (Div 9–12) ──────────────────────────────────────────────────────
  T({ key: 'drywall', label: 'Drywall / Gypsum Board', label_es: 'Tablaroca / Panel de yeso', category: 'interior', csi_division: '09 21', default_phase: 'drywall', permit_trade: 'building', legacy: true, aliases: ['gypsum'] }),
  T({ key: 'metal_stud_framing', label: 'Metal Stud Framing', label_es: 'Estructura de postes metálicos', category: 'interior', csi_division: '09 22', default_phase: 'framing', permit_trade: 'building' }),
  T({ key: 'plaster', label: 'Plaster / Veneer Plaster', label_es: 'Yeso / Aplanado', category: 'interior', csi_division: '09 23', default_phase: 'drywall', permit_trade: 'building' }),
  T({ key: 'acoustical_ceilings', label: 'Acoustical Ceilings', label_es: 'Plafones acústicos', category: 'interior', csi_division: '09 51', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['ceilings'] }),
  T({ key: 'painting', label: 'Painting', label_es: 'Pintura', category: 'interior', csi_division: '09 91', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'wallcovering', label: 'Wallcovering', label_es: 'Recubrimientos de pared', category: 'interior', csi_division: '09 72', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'flooring_carpet', label: 'Flooring — Carpet', label_es: 'Pisos — Alfombra', category: 'interior', csi_division: '09 68', default_phase: 'finishes_interior', permit_trade: null, aliases: ['carpet'] }),
  T({ key: 'flooring_wood', label: 'Flooring — Hardwood', label_es: 'Pisos — Madera', category: 'interior', csi_division: '09 64', default_phase: 'finishes_interior', permit_trade: null, aliases: ['hardwood_flooring'] }),
  T({ key: 'flooring_resilient', label: 'Flooring — Resilient / LVP', label_es: 'Pisos — Vinílico / LVP', category: 'interior', csi_division: '09 65', default_phase: 'finishes_interior', permit_trade: null, aliases: ['lvp', 'vinyl_flooring'] }),
  T({ key: 'flooring_epoxy', label: 'Flooring — Epoxy / Resinous', label_es: 'Pisos — Epóxico', category: 'interior', csi_division: '09 67', default_phase: 'finishes_interior', permit_trade: null, aliases: ['epoxy_flooring'] }),
  T({ key: 'terrazzo', label: 'Terrazzo', label_es: 'Terrazo', category: 'interior', csi_division: '09 66', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'tile', label: 'Tile (Floor / Wall / Shower)', label_es: 'Azulejo / Loseta (pisos / muros / regaderas)', category: 'interior', csi_division: '09 30', default_phase: 'finishes_interior', permit_trade: null, aliases: ['ceramic_tile'] }),
  T({ key: 'countertops', label: 'Countertops', label_es: 'Cubiertas / Encimeras', category: 'interior', csi_division: '12 36', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'cabinetry', label: 'Cabinet Installation / Casework', label_es: 'Instalación de gabinetes', category: 'interior', csi_division: '12 32', default_phase: 'finishes_interior', permit_trade: null, aliases: ['cabinets', 'casework', 'cabinet_installation'] }),
  T({ key: 'millwork', label: 'Architectural Millwork', label_es: 'Carpintería arquitectónica', category: 'interior', csi_division: '06 40', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'finish_carpentry', label: 'Finish Carpentry / Trim', label_es: 'Carpintería de acabado / Molduras', category: 'interior', csi_division: '06 20', default_phase: 'finishes_interior', permit_trade: null, aliases: ['trim_carpentry'] }),
  T({ key: 'doors_hardware', label: 'Interior Doors & Hardware', label_es: 'Puertas interiores y herrajes', category: 'interior', csi_division: '08 14', default_phase: 'finishes_interior', permit_trade: null, aliases: ['door_hardware', 'automatic_doors', 'entrance_doors'] }),
  T({ key: 'stairs_railings', label: 'Stairs & Railings', label_es: 'Escaleras y barandales', category: 'interior', csi_division: '05 51', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['railings'] }),
  T({ key: 'toilet_partitions', label: 'Toilet Partitions & Accessories', label_es: 'Mamparas y accesorios de baño', category: 'interior', csi_division: '10 21', default_phase: 'finishes_interior', permit_trade: null, aliases: ['bath_accessories'] }),
  T({ key: 'window_treatments', label: 'Window Treatments', label_es: 'Persianas / Cortinas', category: 'interior', csi_division: '12 20', default_phase: 'finishes_interior', permit_trade: null, aliases: ['blinds'] }),
  T({ key: 'appliances', label: 'Appliance Installation', label_es: 'Instalación de electrodomésticos', category: 'interior', csi_division: '11 31', default_phase: 'finishes_interior', permit_trade: null, aliases: ['appliance_install'] }),
  T({ key: 'underlayment_leveling', label: 'Floor Underlayment / Self-Leveling (Gypcrete)', label_es: 'Bases de piso / Autonivelantes (gypcrete)', category: 'interior', csi_division: '03 54', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['gypcrete', 'self_leveling', 'floor_leveling', 'lightweight_topping'] }),
  T({ key: 'access_flooring', label: 'Raised Access Flooring', label_es: 'Piso técnico elevado', category: 'interior', csi_division: '09 69', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['raised_floor', 'access_floor'] }),
  T({ key: 'closets_storage', label: 'Closets / Storage Systems', label_es: 'Clósets / Sistemas de almacenamiento', category: 'interior', csi_division: '10 56', default_phase: 'finishes_interior', permit_trade: null, aliases: ['closets', 'closet_systems', 'garage_storage', 'shelving'] }),
  T({ key: 'finishes', label: 'Finishes (General)', label_es: 'Acabados (general)', category: 'interior', csi_division: '09', default_phase: 'finishes_interior', permit_trade: 'building', legacy: true, umbrella: true }),
  T({ key: 'architectural', label: 'Architectural (General)', label_es: 'Arquitectónico (general)', category: 'interior', csi_division: '09', default_phase: 'finishes_interior', permit_trade: 'building', legacy: true, umbrella: true }),
  T({ key: 'general', label: 'General / Multi-Trade', label_es: 'General / Multioficio', category: 'specialty', csi_division: '01', default_phase: 'commissioning', permit_trade: 'building', legacy: true, umbrella: true }),

  // ── Specialty (Div 10–14, 41+) ───────────────────────────────────────────────
  T({ key: 'pools_spas', label: 'Pools / Spas', label_es: 'Albercas / Spas', category: 'specialty', csi_division: '13 11', default_phase: 'sitework', permit_trade: 'building', aliases: ['pool', 'spa', 'fountain', 'water_feature'] }),
  T({ key: 'fireplaces', label: 'Fireplaces / Hearth', label_es: 'Chimeneas', category: 'specialty', csi_division: '10 30', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['hearth'] }),
  T({ key: 'central_vacuum', label: 'Central Vacuum', label_es: 'Aspiradora central', category: 'specialty', csi_division: '11 24', default_phase: 'rough_in', permit_trade: 'building' }),
  T({ key: 'signage', label: 'Signage', label_es: 'Señalización / Letreros', category: 'specialty', csi_division: '10 14', default_phase: 'finishes_exterior', permit_trade: 'building', aliases: ['signs'] }),
  T({ key: 'scaffolding', label: 'Scaffolding', label_es: 'Andamios', category: 'specialty', csi_division: '01 54', default_phase: 'framing', permit_trade: null }),
  T({ key: 'crane_service', label: 'Crane Service', label_es: 'Servicio de grúa', category: 'specialty', csi_division: '01 54 19', default_phase: 'framing', permit_trade: null, aliases: ['crane'] }),
  T({ key: 'abatement', label: 'Abatement (Asbestos / Lead / Mold)', label_es: 'Remoción de riesgos (asbesto / plomo / moho)', category: 'specialty', csi_division: '02 80', default_phase: 'site_prep', permit_trade: 'building', aliases: ['asbestos', 'mold_remediation', 'lead_paint', 'lead_abatement'] }),
  T({ key: 'radon_mitigation', label: 'Radon Mitigation', label_es: 'Mitigación de radón', category: 'specialty', csi_division: '31 21', default_phase: 'foundation', permit_trade: 'building', aliases: ['radon'] }),
  T({ key: 'pest_control', label: 'Pest Control / Termite Pretreatment', label_es: 'Control de plagas / Pretratamiento de termitas', category: 'specialty', csi_division: '31 31', default_phase: 'foundation', permit_trade: null, aliases: ['termite'] }),
  T({ key: 'final_clean', label: 'Final / Construction Cleaning', label_es: 'Limpieza final de obra', category: 'specialty', csi_division: '01 74', default_phase: 'punch', permit_trade: null, aliases: ['cleaning', 'pressure_washing'] }),
  T({ key: 'hauling', label: 'Hauling / Dumpsters', label_es: 'Acarreo / Contenedores', category: 'specialty', csi_division: '01 74 19', default_phase: 'punch', permit_trade: null, aliases: ['dumpsters', 'waste_removal'] }),
  T({ key: 'traffic_control', label: 'Traffic Control', label_es: 'Control de tráfico', category: 'specialty', csi_division: '01 55', default_phase: 'site_prep', permit_trade: null }),
  T({ key: 'loading_dock_equipment', label: 'Loading Dock Equipment', label_es: 'Equipo de andén de carga', category: 'specialty', csi_division: '11 13', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['dock_equipment'] }),
  T({ key: 'kitchen_equipment', label: 'Commercial Kitchen Equipment', label_es: 'Equipo de cocina comercial', category: 'specialty', csi_division: '11 40', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['foodservice_equipment'] }),
  T({ key: 'cold_storage', label: 'Cold Storage / Walk-Ins', label_es: 'Cámaras frías', category: 'specialty', csi_division: '11 41', default_phase: 'finishes_interior', permit_trade: 'mechanical', aliases: ['walk_in_cooler'] }),
  T({ key: 'lab_casework', label: 'Laboratory Casework / Equipment', label_es: 'Mobiliario de laboratorio', category: 'specialty', csi_division: '11 53', default_phase: 'finishes_interior', permit_trade: null }),
  T({ key: 'gym_theatrical', label: 'Gym / Theatrical Equipment', label_es: 'Equipo de gimnasio / teatro', category: 'specialty', csi_division: '11 66', default_phase: 'finishes_interior', permit_trade: null, aliases: ['gym_equipment'] }),
  T({ key: 'sport_courts_turf', label: 'Sport Courts / Synthetic Turf', label_es: 'Canchas deportivas / Pasto sintético', category: 'specialty', csi_division: '32 18', default_phase: 'sitework', permit_trade: null, aliases: ['turf', 'sport_court'] }),
  T({ key: 'playground_equipment', label: 'Playground Equipment', label_es: 'Juegos infantiles', category: 'specialty', csi_division: '11 68', default_phase: 'sitework', permit_trade: 'building', aliases: ['playground'] }),
  T({ key: 'remodeling', label: 'Remodeling / Renovation (Residential)', label_es: 'Remodelación / Renovación (residencial)', category: 'specialty', csi_division: '01', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['remodel', 'renovation', 'handyman', 'home_improvement', 'kitchen_remodel', 'bath_remodel'] }),
  T({ key: 'restoration', label: 'Restoration (Water / Fire / Storm Damage)', label_es: 'Restauración (daños por agua / fuego / tormenta)', category: 'specialty', csi_division: '02 41', default_phase: 'site_prep', permit_trade: null, aliases: ['water_damage', 'fire_damage', 'storm_damage', 'water_mitigation', 'mitigation', 'disaster_restoration'] }),
  T({ key: 'specialties', label: 'Div 10 Specialties (Accessories / Lockers / Extinguisher Cabinets)', label_es: 'Especialidades Div. 10 (accesorios / lockers / gabinetes de extintor)', category: 'specialty', csi_division: '10', default_phase: 'finishes_interior', permit_trade: null, aliases: ['div_10', 'division_10', 'lockers', 'corner_guards', 'flagpoles', 'fire_extinguisher_cabinets', 'mailboxes'] }),
  T({ key: 'operable_partitions', label: 'Operable / Folding Partitions', label_es: 'Mamparas plegables / móviles', category: 'specialty', csi_division: '10 22 39', default_phase: 'finishes_interior', permit_trade: 'building', aliases: ['folding_partitions', 'movable_walls', 'demountable_partitions'] }),
  T({ key: 'furniture_ffe', label: 'Furniture / FF&E Installation / Seating', label_es: 'Instalación de mobiliario (FF&E) / Butacas', category: 'specialty', csi_division: '12', default_phase: 'finishes_interior', permit_trade: null, aliases: ['ffe', 'furniture_install', 'fixed_seating', 'bleachers', 'office_furniture'] }),
  T({ key: 'material_handling', label: 'Material Handling (Conveyors / Cranes / Hoists / Racking)', label_es: 'Manejo de materiales (bandas / grúas viajeras / polipastos / racks)', category: 'specialty', csi_division: '41', default_phase: 'rough_in', permit_trade: 'building', aliases: ['conveyors', 'overhead_crane', 'bridge_crane', 'hoists', 'pallet_racking'] }),
  T({ key: 'special_construction', label: 'Special Construction (Vaults / Cleanrooms / Safe Rooms / Greenhouses)', label_es: 'Construcción especial (bóvedas / cuartos limpios / refugios / invernaderos)', category: 'specialty', csi_division: '13', default_phase: 'framing', permit_trade: 'building', aliases: ['cleanroom', 'vault', 'safe_room', 'storm_shelter', 'greenhouse', 'detention_equipment'] }),
  T({ key: 'rigging_millwright', label: 'Rigging / Millwright / Machinery Moving', label_es: 'Maniobras / Montaje de maquinaria (millwright)', category: 'specialty', csi_division: '41', default_phase: 'rough_in', permit_trade: null, aliases: ['millwright', 'rigging', 'machinery_moving', 'equipment_setting'] }),
  T({ key: 'industrial_coatings', label: 'Industrial Coatings / Abrasive Blasting', label_es: 'Recubrimientos industriales / Chorro abrasivo', category: 'specialty', csi_division: '09 96', default_phase: 'finishes_exterior', permit_trade: null, aliases: ['sandblasting', 'media_blasting', 'protective_coatings', 'tank_coating', 'high_performance_coatings'] }),

  // ── Heavy civil (NAICS 237) — DOT/owner-inspected, no AHJ building permit path ─
  T({ key: 'pipeline', label: 'Pipeline (Oil / Gas Transmission)', label_es: 'Ductos (petróleo / gas de transmisión)', category: 'heavy_civil', csi_division: '33 52', default_phase: 'site_prep', permit_trade: null, aliases: ['oil_gas_pipeline', 'gas_pipeline', 'transmission_pipeline'] }),
  T({ key: 'power_line', label: 'Power Line / Utility Electric / Substation', label_es: 'Líneas eléctricas / Subestaciones', category: 'heavy_civil', csi_division: '33 71', default_phase: 'site_prep', permit_trade: null, aliases: ['lineman', 'utility_line', 'substation', 'overhead_line', 'underground_electric'] }),
  T({ key: 'telecom_outside_plant', label: 'Telecom Outside Plant (Fiber / Cable)', label_es: 'Planta externa de telecomunicaciones (fibra / cable)', category: 'heavy_civil', csi_division: '33 81', default_phase: 'site_prep', permit_trade: null, aliases: ['osp', 'fiber_outside_plant', 'broadband_construction', 'cable_construction'] }),
  T({ key: 'directional_drilling', label: 'Horizontal Directional Drilling / Boring', label_es: 'Perforación direccional / Barrenado horizontal', category: 'heavy_civil', csi_division: '33 05 07', default_phase: 'site_prep', permit_trade: null, aliases: ['hdd', 'boring', 'directional_boring', 'auger_boring'] }),
  T({ key: 'highway_bridge', label: 'Highway / Street / Bridge Construction', label_es: 'Construcción de carreteras / calles / puentes', category: 'heavy_civil', csi_division: '34 71', default_phase: 'sitework', permit_trade: null, aliases: ['road_construction', 'bridge', 'highway', 'concrete_paving', 'street_construction'] }),
  T({ key: 'guardrail_barriers', label: 'Guardrail / Barriers / Attenuators', label_es: 'Defensas metálicas / Barreras / Amortiguadores', category: 'heavy_civil', csi_division: '34 71 13', default_phase: 'sitework', permit_trade: null, aliases: ['guardrail', 'guard_rail', 'crash_barrier', 'jersey_barrier'] }),
  T({ key: 'traffic_signals_lighting', label: 'Traffic Signals / Street Lighting / ITS', label_es: 'Semáforos / Alumbrado público / ITS', category: 'heavy_civil', csi_division: '34 41', default_phase: 'sitework', permit_trade: null, aliases: ['traffic_signals', 'street_lighting', 'its', 'signal_construction'] }),
  T({ key: 'marine_dredging', label: 'Marine Construction / Dredging (Commercial)', label_es: 'Construcción marítima / Dragado (comercial)', category: 'heavy_civil', csi_division: '35', default_phase: 'site_prep', permit_trade: null, aliases: ['dredging', 'marine_construction', 'seawall', 'bulkhead'] }),
  T({ key: 'tunneling', label: 'Tunneling / Microtunneling', label_es: 'Túneles / Microtúneles', category: 'heavy_civil', csi_division: '31 71', default_phase: 'site_prep', permit_trade: null, aliases: ['microtunneling', 'tunnel_boring'] }),
  T({ key: 'rail_track', label: 'Railroad Track Construction', label_es: 'Construcción de vías férreas', category: 'heavy_civil', csi_division: '34 11', default_phase: 'sitework', permit_trade: null, aliases: ['railroad', 'rail', 'track_work'] }),
  T({ key: 'environmental_remediation', label: 'Environmental Remediation (Soil / Groundwater / UST)', label_es: 'Remediación ambiental (suelo / agua subterránea / tanques)', category: 'heavy_civil', csi_division: '02 61', default_phase: 'site_prep', permit_trade: null, aliases: ['soil_remediation', 'groundwater_remediation', 'brownfield', 'ust_removal', 'tank_removal'] }),
  T({ key: 'ground_improvement', label: 'Ground Improvement / Soil Stabilization / Grouting', label_es: 'Mejoramiento de suelo / Estabilización / Inyecciones', category: 'heavy_civil', csi_division: '31 32', default_phase: 'site_prep', permit_trade: null, aliases: ['soil_stabilization', 'grouting', 'compaction_grouting', 'stone_columns', 'geogrid'] }),

  // ── Professional / inspection services (vendor-only — no permit path) ────────
  T({ key: 'surveying', label: 'Surveying / Staking', label_es: 'Topografía / Trazo', category: 'services', csi_division: '02 21', default_phase: 'site_prep', permit_trade: null, aliases: ['surveyor'] }),
  T({ key: 'geotech', label: 'Geotechnical Engineering / Soils', label_es: 'Geotecnia / Estudios de suelo', category: 'services', csi_division: '02 32', default_phase: 'site_prep', permit_trade: null, aliases: ['soils_testing'] }),
  T({ key: 'special_inspection', label: 'Special Inspection', label_es: 'Inspección especial', category: 'services', csi_division: '01 45', default_phase: 'inspections', permit_trade: null }),
  T({ key: 'materials_testing', label: 'Materials Testing', label_es: 'Pruebas de materiales', category: 'services', csi_division: '01 45', default_phase: 'inspections', permit_trade: null }),
  T({ key: 'commissioning_agent', label: 'Commissioning Agent', label_es: 'Agente de comisionamiento', category: 'services', csi_division: '01 91', default_phase: 'commissioning', permit_trade: null, aliases: ['cx_agent'] }),
  T({ key: 'energy_rating', label: 'Energy Rating (HERS / Blower Door)', label_es: 'Certificación energética (HERS)', category: 'services', csi_division: '01 91', default_phase: 'commissioning', permit_trade: null, aliases: ['hers_rater', 'blower_door'] }),
  T({ key: 'home_inspection', label: 'Home / Property Inspection', label_es: 'Inspección de vivienda / propiedad', category: 'services', csi_division: '01 45', default_phase: 'inspections', permit_trade: null, aliases: ['home_inspector', 'property_inspection'] }),
  T({ key: 'utility_locating', label: 'Utility Locating / GPR Scanning', label_es: 'Localización de servicios / Escaneo GPR', category: 'services', csi_division: '02 21', default_phase: 'site_prep', permit_trade: null, aliases: ['locates', 'private_locator', 'gpr_scanning', 'concrete_scanning'] }),
  T({ key: 'architect', label: 'Architect', label_es: 'Arquitecto', category: 'services', csi_division: '01', default_phase: 'site_prep', permit_trade: null, aliases: ['architecture', 'architect_of_record'] }),
  T({ key: 'engineering', label: 'Engineering (Structural / Civil / MEP)', label_es: 'Ingeniería (estructural / civil / MEP)', category: 'services', csi_division: '01', default_phase: 'site_prep', permit_trade: null, aliases: ['engineer', 'structural_engineer', 'civil_engineer', 'mep_engineer'] }),
  T({ key: 'interior_design', label: 'Interior Design', label_es: 'Diseño de interiores', category: 'services', csi_division: '01', default_phase: 'finishes_interior', permit_trade: null, aliases: ['interior_designer', 'kitchen_designer'] }),
  T({ key: 'construction_management', label: "Construction Management / Owner's Rep", label_es: 'Gerencia de construcción / Representante del dueño', category: 'services', csi_division: '01 31', default_phase: 'site_prep', permit_trade: null, aliases: ['cm', 'owners_rep', 'construction_manager'] }),
  T({ key: 'estimating_services', label: 'Estimating / Takeoff Services', label_es: 'Servicios de presupuestos / cuantificación', category: 'services', csi_division: '01', default_phase: 'site_prep', permit_trade: null, aliases: ['estimator', 'takeoff_services', 'quantity_surveyor'] }),
  T({ key: 'permit_expediting', label: 'Permit Expediting', label_es: 'Gestoría de permisos', category: 'services', csi_division: '01 41', default_phase: 'site_prep', permit_trade: null, aliases: ['permit_expediter', 'permit_runner', 'permit_services'] }),
  T({ key: 'environmental_consulting', label: 'Environmental Consulting / Industrial Hygiene', label_es: 'Consultoría ambiental / Higiene industrial', category: 'services', csi_division: '02 26', default_phase: 'site_prep', permit_trade: null, aliases: ['phase_i_esa', 'environmental_consultant', 'industrial_hygienist'] }),
  T({ key: 'safety_consulting', label: 'Safety Consulting', label_es: 'Consultoría de seguridad', category: 'services', csi_division: '01 35', default_phase: 'site_prep', permit_trade: null, aliases: ['safety_consultant', 'site_safety'] }),
  T({ key: 'reality_capture', label: 'Reality Capture (Drone / Laser Scan / BIM)', label_es: 'Captura de realidad (dron / escaneo láser / BIM)', category: 'services', csi_division: '01', default_phase: 'site_prep', permit_trade: null, aliases: ['drone', 'laser_scanning', 'bim', 'photogrammetry'] }),
  T({ key: 'equipment_rental', label: 'Equipment Rental', label_es: 'Renta de equipo', category: 'services', csi_division: '01 54', default_phase: 'site_prep', permit_trade: null, aliases: ['rental', 'equipment_rentals', 'tool_rental'] }),
  T({ key: 'site_services', label: 'Site Services (Portable Toilets / Temp Fence / Temp Power)', label_es: 'Servicios de obra (sanitarios / cerca temporal / energía temporal)', category: 'services', csi_division: '01 50', default_phase: 'site_prep', permit_trade: null, aliases: ['portable_toilets', 'temporary_fencing', 'temp_power', 'site_trailers'] }),
];

// ── Derived lookups ────────────────────────────────────────────────────────────

export const TRADE_BY_KEY: ReadonlyMap<string, TradeDef> = new Map(
  TRADE_TAXONOMY.map((d) => [d.key, d]),
);

/** alias (lowercase) → canonical key */
export const TRADE_ALIAS_MAP: ReadonlyMap<string, string> = new Map(
  TRADE_TAXONOMY.flatMap((d) => (d.aliases ?? []).map((a) => [a.toLowerCase(), d.key] as const)),
);

export const TRADE_KEYS: readonly string[] = TRADE_TAXONOMY.map((d) => d.key);

/** Resolve a raw trade string (key or alias, any case/whitespace) to its TradeDef, or null. */
export function tradeDef(raw: string | null | undefined): TradeDef | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const direct = TRADE_BY_KEY.get(t);
  if (direct) return direct;
  const viaAlias = TRADE_ALIAS_MAP.get(t);
  return viaAlias ? TRADE_BY_KEY.get(viaAlias) ?? null : null;
}

/** Normalize a raw trade string to its canonical key (aliases collapse), or null. */
export function normalizeTradeKey(raw: string | null | undefined): string | null {
  return tradeDef(raw)?.key ?? null;
}
