import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline WRITE table (tier 2). Creates + status/result edits land locally as `pending`
// and ride the batch push; a 409 goes to the registry-driven conflict inbox.
// Fields are snake_case to match the @field column names (the reserved-accessor
// collision rule — never camelCase on a WatermelonDB model).
export class Inspection extends Model {
  static table = 'inspections';

  @field('project_id') project_id!: string;
  @field('title') title!: string;
  @field('inspection_date') inspection_date!: string | null;
  @field('status') status!: string;
  @field('notes') notes!: string | null;
  @field('inspector_name') inspector_name!: string | null;
  @field('trade_type') trade_type!: string | null;
  // AHJ milestone fields (schema v6). permit_id/inspection_type/sequence_order are
  // pull-only — the server rejects them on a push, so an inspection can't be re-parented
  // onto another permit from a phone. result/correction_notice are field-writable.
  @field('permit_id') permit_id!: string | null;
  @field('inspection_type') inspection_type!: string | null;
  @field('sequence_order') sequence_order!: number | null;
  @field('result') result!: string | null;
  @field('correction_notice') correction_notice!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
