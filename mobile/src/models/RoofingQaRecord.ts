import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline WRITE table (schema v8, tier 2). Dry-in, seam welds and fastener pulls are
// checked ON the roof — not somewhere with signal.
export class RoofingQaRecord extends Model {
  static table = 'roofing_qa_records';

  @field('roofing_system_id') roofing_system_id!: string;
  @field('qa_type') qa_type!: string;
  @field('inspection_date') inspection_date!: string | null;
  @field('result') result!: string;
  @field('measured_value') measured_value!: number | null;
  @field('unit') unit!: string | null;
  @field('inspector_name') inspector_name!: string | null;
  @field('notes') notes!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
