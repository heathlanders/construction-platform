import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class DailyReport extends Model {
  static table = 'daily_reports';

  @field('project_id') project_id!: string;
  @field('report_date') report_date!: string;
  @field('notes') notes!: string | null;
  @field('conditions') conditions!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
