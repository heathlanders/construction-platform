import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline WRITE table (schema v9, tier 2). planned → rough_in → trimmed → complete.
export class PlumbingFixture extends Model {
  static table = 'plumbing_fixtures';

  @field('system_id') system_id!: string;
  @field('fixture_type') fixture_type!: string | null;
  @field('location') location!: string | null;
  @field('status') status!: string;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
