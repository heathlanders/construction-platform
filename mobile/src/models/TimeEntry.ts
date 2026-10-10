import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class TimeEntry extends Model {
  static table = 'time_entries';

  @field('project_id') project_id!: string;
  @field('user_id') user_id!: string;
  @field('date') date!: string;
  @field('hours_worked') hours_worked!: number;
  @field('hourly_rate_cents') hourly_rate_cents!: number | null;
  @field('budget_line_item_id') budget_line_item_id!: string | null;
  @field('cost_code_id') cost_code_id!: string | null;
  @field('notes') notes!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
