import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class Project extends Model {
  static table = 'projects';

  @field('name') name!: string;
  @field('status') status!: string;
  @field('start_date') start_date!: string | null;
  @field('end_date') end_date!: string | null;
  @field('address') address!: string | null;
  @field('city') city!: string | null;
  @field('state') state!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
