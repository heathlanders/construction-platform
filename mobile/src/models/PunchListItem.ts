import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class PunchListItem extends Model {
  static table = 'punch_list_items';

  @field('project_id') project_id!: string;
  @field('title') title!: string;
  @field('description') description!: string | null;
  @field('status') status!: string;
  @field('due_date') due_date!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
