import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v4) — pulled, never pushed (`readOnly` on the server's
// SYNC_TABLES too). This is what makes the yard flow work with no signal: the QR scan
// resolves an asset_number locally, so the fuel / inspection / damage capture queues
// are actually reachable offline. Checkout stays online-only (T-57 cert enforcement).
export class CompanyAsset extends Model {
  static table = 'company_assets';

  @field('asset_number') asset_number!: string;
  @field('name') name!: string;
  @field('asset_category') asset_category!: string;
  @field('asset_type') asset_type!: string | null;
  @field('make') make!: string | null;
  @field('model') model!: string | null;
  @field('year') year!: number | null;
  @field('status') status!: string;
  @field('condition') condition!: string | null;
  @field('home_location') home_location!: string | null;
  @field('meter_type') meter_type!: string;
  @field('current_meter_reading') current_meter_reading!: number | null;
  @field('requires_operator_cert') requires_operator_cert!: boolean;
  @field('required_cert_type') required_cert_type!: string | null;
  @field('ownership_type') ownership_type!: string;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
