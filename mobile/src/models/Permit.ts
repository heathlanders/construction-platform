import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v6). Written only by the sync pull — permit lifecycle
// (submit / approve / void) stays an office action behind tier gates and jurisdiction
// resolution, so this table is never pushed. What the field needs is the permit and its
// AHJ milestones to be READABLE at the site; the writable half is the inspection result,
// which lives on `inspections`.
export class Permit extends Model {
  static table = 'permits';

  @field('project_id') project_id!: string;
  @field('permit_type') permit_type!: string;
  @field('permit_number') permit_number!: string | null;
  @field('building_type') building_type!: string | null;
  @field('status') status!: string;
  @field('code_type') code_type!: string | null;
  @field('code_edition') code_edition!: string | null;
  @field('nec_edition') nec_edition!: string | null;
  @field('ahj_name') ahj_name!: string | null;
  @field('ahj_level') ahj_level!: string | null;
  @field('ahj_phone') ahj_phone!: string | null;
  @field('jurisdiction_notes') jurisdiction_notes!: string | null;
  @field('applied_date') applied_date!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
