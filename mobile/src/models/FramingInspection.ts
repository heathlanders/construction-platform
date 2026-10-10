import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v8). Pull-only; the writable half is its correction items.
export class FramingInspection extends Model {
  static table = 'framing_inspections';

  @field('project_id') project_id!: string;
  @field('section') section!: string;
  @field('inspection_date') inspection_date!: string | null;
  @field('status') status!: string;
  @field('inspector_name') inspector_name!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
