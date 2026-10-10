import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v9). Pull-only.
export class PlumbingSystem extends Model {
  static table = 'plumbing_systems';

  @field('project_id') project_id!: string;
  @field('name') name!: string;
  @field('system_type') system_type!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
