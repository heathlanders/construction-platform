import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// Offline WRITE table (schema v7, tier 2). Slump, air content and temperature are
// measured while the truck is at the pour; a cylinder break is logged against that same
// pour weeks later. Neither moment is guaranteed to have a signal.
export class ConcreteTestRecord extends Model {
  static table = 'concrete_test_records';

  @field('pour_id') pour_id!: string;
  @field('test_type') test_type!: string;
  @field('test_date') test_date!: string | null;
  @field('age_days') age_days!: number | null;
  @field('specified_value') specified_value!: number | null;
  @field('measured_value') measured_value!: number | null;
  @field('unit') unit!: string | null;
  @field('result') result!: string;
  @field('sample_id') sample_id!: string | null;
  @field('lab_name') lab_name!: string | null;
  @field('notes') notes!: string | null;
  @field('server_id') server_id!: string;
  @field('version') version!: number;
  @field('sync_status') sync_status!: string;
  @field('synced_at') synced_at!: string | null;
  @field('is_deleted') is_deleted!: boolean;
}
