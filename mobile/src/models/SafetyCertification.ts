import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline READ cache (schema v3) — cert expiry must be checkable in the field
// with no signal (T-57 operator-cert gating is enforced server-side).
// Writes still go straight to the API. snake_case per the model convention.
export class SafetyCertification extends Model {
  static table = 'safety_certifications';

  @field('user_id') user_id!: string;
  @field('cert_type') cert_type!: string;
  @field('issued_at') issued_at!: string | null;
  @field('expires_at') expires_at!: string | null;
  @field('document_path') document_path!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
