import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v8). Pull-only — installing a roof system is an office
// record; the field need is the QA checks that hang off it.
export class RoofingSystem extends Model {
  static table = 'roofing_systems';

  @field('project_id') project_id!: string;
  @field('roof_type') roof_type!: string;
  @field('total_squares') total_squares!: number | null;
  @field('manufacturer') manufacturer!: string | null;
  @field('warranty_years') warranty_years!: number | null;
  @field('status') status!: string;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
