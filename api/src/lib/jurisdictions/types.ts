// Jurisdiction / AHJ resolution engine — type definitions.
//
// Deterministic (no AI). Resolves the governing model code + inspection sequence + the
// Authority Having Jurisdiction (AHJ) for ANY US location via a most-specific-wins cascade:
//   city → county → state → national default.
//
// Design split (critical): "which code applies" and "which AHJ enforces it" are SEPARATE,
// independently-layered facts. In WI the codes are largely state-administered (UDC SPS 320-325,
// SPS 382-387 plumbing, NEC via SPS 316) while the AHJ (permit office, fees, local amendments)
// is municipal. A layer may set codes, an AHJ, both, or neither.

export type Trade = 'electrical' | 'plumbing' | 'mechanical' | 'building';
export const TRADES: readonly Trade[] = ['electrical', 'plumbing', 'mechanical', 'building'] as const;

export type GeoLevel = 'national' | 'state' | 'county' | 'city';

// Building occupancy — identical union across all 4 trade libs.
export type BuildingType = 'residential_sf' | 'residential_mf' | 'commercial' | 'industrial';

// Trade-neutral inspection step. Superset of all 4 trade libs' InspectionStep shapes — they
// already carry sequence_order/inspection_type/title/description/csi_division/
// estimated_duration_days/required_for_building_types, so they map 1:1.
export interface InspectionStepDef {
  sequence_order: number;
  inspection_type: string;
  title: string;
  description?: string;
  csi_division: string;
  estimated_duration_days: number;
  required_for_building_types?: BuildingType[]; // empty/undefined = all building types
}

// Ordered mutations a layer applies to the inherited inspection sequence.
export type SequenceOp =
  | { op: 'add'; step: InspectionStepDef }
  | { op: 'remove'; inspection_type: string }
  | { op: 'modify'; inspection_type: string; patch: Partial<InspectionStepDef> }
  | { op: 'replace_all'; steps: InspectionStepDef[] };

// Per-trade code facts a layer can assert. All optional — sparse overrides.
export interface TradeCodeOverride {
  code_type?: string;        // 'NEC' | 'IPC' | 'UPC' | 'IMC' | 'UMC' | 'IRC' | 'IBC'
  code_edition?: string;     // '2020', '2021', ...
  nec_edition?: string;      // electrical only
  amendments_notes?: string; // APPENDED up the cascade (never replaces inherited notes)
  sequence_ops?: SequenceOp[];
}

export interface AhjMetadata {
  ahj_name: string;
  ahj_level: GeoLevel;       // who actually enforces (city/county/state)
  permit_office?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  fee_notes?: string;
  submittal_requirements?: string[];
}

// A single geographic layer. Sparse — only set the fields it overrides.
// Match keys are validated against `level` at load time (see registry.ts).
export interface JurisdictionLayer {
  level: GeoLevel;
  state_code?: string;       // 'WI'
  county_fips?: string;      // '55025' (Dane) — preferred county match key
  county_name?: string;      // 'Dane' — fallback when FIPS absent
  city_name?: string;        // 'Madison' — normalized (lowercased, trimmed) on load
  ahj?: AhjMetadata;
  codes?: Partial<Record<Trade, TradeCodeOverride>>;
  notes?: string;            // general jurisdiction note (applies to all trades)
}

export interface NormalizedGeo {
  state_code: string;          // upper, CHAR(2)
  county_fips: string | null;  // CHAR(5)
  county_name: string | null;  // canonical-cased
  city_name: string | null;    // normalized (lower)
}

export interface ResolvedTradeCode {
  code_type: string;
  code_edition: string | null;
  nec_edition: string | null;
  jurisdiction_notes: string | null; // merged amendments, most-general → most-local
  steps: InspectionStepDef[];         // merged + renumbered 1..N
}

export interface ResolvedJurisdiction {
  geo: NormalizedGeo;
  jurisdiction_key: string;           // canonical key, e.g. 'WI/55025/madison'
  matched_levels: GeoLevel[];         // override layers that contributed, general → local
  ahj: AhjMetadata | null;            // most-local AHJ found; null → fall back to model default
  trades: Record<Trade, ResolvedTradeCode>;
}
