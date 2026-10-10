import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v7). Pull-only: scheduling a pour is an office act, and
// the field need is somewhere to hang the QA tests.
export class ConcretePour extends Model {
  static table = 'concrete_pours';

  @field('project_id') project_id!: string;
  @field('pour_type') pour_type!: string;
  @field('volume_cy') volume_cy!: number | null;
  @field('mix_design') mix_design!: string | null;
  @field('pour_date') pour_date!: string | null;
  @field('status') status!: string;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
