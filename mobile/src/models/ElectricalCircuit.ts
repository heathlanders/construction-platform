import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline WRITE table (schema v9, tier 2). The status flips as the work gets done.
export class ElectricalCircuit extends Model {
  static table = 'electrical_circuits';

  @field('panel_id') panel_id!: string;
  @field('circuit_number') circuit_number!: number;
  @field('description') description!: string | null;
  @field('amperage') amperage!: number | null;
  @field('status') status!: string;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
