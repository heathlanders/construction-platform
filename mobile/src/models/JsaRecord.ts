import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Job Safety Analysis — offline WRITE table (schema v5). A JSA is the pre-task safety
// meeting held standing on the site, so it has to be capturable with no signal.
//
// `attendees` / `hazards` are JSONB on the server; SQLite has no JSON column type, so
// they live here as JSON TEXT and are parsed at the sync boundary (see sync-core.ts).
// Fields are snake_case to match the @field column names (never camelCase on a
// WatermelonDB model — it collides with the built-in accessors).
export class JsaRecord extends Model {
  static table = 'jsa_records';

  @field('project_id') project_id!: string;
  @field('title') title!: string;
  @field('conducted_at') conducted_at!: string;
  @field('attendees_json') attendees_json!: string;
  @field('hazards_json') hazards_json!: string;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}

export interface JsaAttendee { user_id?: string; name: string; signature_at?: string }
export interface JsaHazard {
  description: string; controls?: string; severity?: 'low' | 'medium' | 'high' | 'critical';
  // Provenance when the hazard came from a Trade Knowledge Pack suggestion (GET /v1/trades/hazards).
  osha_ref?: string; hazard_id?: string; pack_version?: string; source?: 'pack' | 'manual'; ppe?: string[];
}

/** Tolerant parse — a corrupt/empty blob must not blank a safety record's whole screen. */
export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}
