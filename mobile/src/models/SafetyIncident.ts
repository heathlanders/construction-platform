import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class SafetyIncident extends Model {
  static table = 'safety_incidents';

  // snake_case JS property names match the other models AND avoid colliding with
  // WatermelonDB's built-in Model.syncStatus accessor (a camelCase `syncStatus`
  // @field overrides it → TS2610). Keep this consistent across all models.
  @field('project_id') project_id!: string;
  @field('incident_date') incident_date!: string;
  @field('description') description!: string;
  @field('severity') severity!: string; // near_miss | first_aid | recordable | lost_time | fatality
  @field('status') status!: string;     // open | under_investigation | closed
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string; // pending | synced
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
