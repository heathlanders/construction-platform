import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline WRITE table (schema v8, tier 2). A correction is raised AND cleared at the
// wall — the whole life of the record happens on site.
export class FramingCorrectionItem extends Model {
  static table = 'framing_correction_items';

  @field('framing_inspection_id') framing_inspection_id!: string;
  @field('description') description!: string;
  @field('location') location!: string | null;
  @field('severity') severity!: string;
  @field('status') status!: string;
  @field('notes') notes!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
