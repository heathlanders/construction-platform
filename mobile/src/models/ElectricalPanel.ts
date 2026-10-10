import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v9). Pull-only — a panel is designed, not discovered.
export class ElectricalPanel extends Model {
  static table = 'electrical_panels';

  @field('project_id') project_id!: string;
  @field('name') name!: string;
  @field('amperage') amperage!: number | null;
  @field('voltage') voltage!: number | null;
  @field('location') location!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
