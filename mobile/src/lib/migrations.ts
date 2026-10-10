// lib/migrations.ts — WatermelonDB schema migrations.
//
// ⚠️ Without a migration for a version bump WatermelonDB falls back to an UNSAFE
// RESET of the local database — silently destroying any `pending` offline rows a
// field worker hasn't synced yet. Every schema.ts version bump MUST add a step here.
//
// History: schema shipped at v2 with no migrations file, so every live install is
// at v2 (an older v1 install was already reset when v2 shipped). v3 is the first
// real migration.

import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      // v9 — electrical + plumbing: the panels/systems as read caches, the circuit and
      // fixture STATUS as offline writes (that flip happens at the panel, not at a desk).
      toVersion: 9,
      steps: [
        createTable({
          name: 'electrical_panels',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'amperage', type: 'number', isOptional: true },
            { name: 'voltage', type: 'number', isOptional: true },
            { name: 'location', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'electrical_circuits',
          columns: [
            { name: 'panel_id', type: 'string' },
            { name: 'circuit_number', type: 'number' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'amperage', type: 'number', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'plumbing_systems',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'system_type', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'plumbing_fixtures',
          columns: [
            { name: 'system_id', type: 'string' },
            { name: 'fixture_type', type: 'string', isOptional: true },
            { name: 'location', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      // v8 — the rest of the Structural screen offline: roofing QA (checked on the roof)
      // and framing corrections (raised AND cleared at the wall), each with its parent
      // as a pull-only cache.
      toVersion: 8,
      steps: [
        createTable({
          name: 'roofing_systems',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'roof_type', type: 'string' },
            { name: 'total_squares', type: 'number', isOptional: true },
            { name: 'manufacturer', type: 'string', isOptional: true },
            { name: 'warranty_years', type: 'number', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'roofing_qa_records',
          columns: [
            { name: 'roofing_system_id', type: 'string' },
            { name: 'qa_type', type: 'string' },
            { name: 'inspection_date', type: 'string', isOptional: true },
            { name: 'result', type: 'string' },
            { name: 'measured_value', type: 'number', isOptional: true },
            { name: 'unit', type: 'string', isOptional: true },
            { name: 'inspector_name', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'framing_inspections',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'section', type: 'string' },
            { name: 'inspection_date', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'inspector_name', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'framing_correction_items',
          columns: [
            { name: 'framing_inspection_id', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'location', type: 'string', isOptional: true },
            { name: 'severity', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      // v7 — concrete pours (read cache) + concrete QA tests (offline write): slump,
      // air and temperature are measured while the truck is at the pour.
      toVersion: 7,
      steps: [
        createTable({
          name: 'concrete_pours',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'pour_type', type: 'string' },
            { name: 'volume_cy', type: 'number', isOptional: true },
            { name: 'mix_design', type: 'string', isOptional: true },
            { name: 'pour_date', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'concrete_test_records',
          columns: [
            { name: 'pour_id', type: 'string' },
            { name: 'test_type', type: 'string' },
            { name: 'test_date', type: 'string', isOptional: true },
            { name: 'age_days', type: 'number', isOptional: true },
            { name: 'specified_value', type: 'number', isOptional: true },
            { name: 'measured_value', type: 'number', isOptional: true },
            { name: 'unit', type: 'string', isOptional: true },
            { name: 'result', type: 'string' },
            { name: 'sample_id', type: 'string', isOptional: true },
            { name: 'lab_name', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      // v6 — permits read cache + the AHJ milestone fields on inspections, so an
      // inspection result can be recorded at the site with no signal.
      toVersion: 6,
      steps: [
        createTable({
          name: 'permits',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'permit_type', type: 'string' },
            { name: 'permit_number', type: 'string', isOptional: true },
            { name: 'building_type', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'code_type', type: 'string', isOptional: true },
            { name: 'code_edition', type: 'string', isOptional: true },
            { name: 'nec_edition', type: 'string', isOptional: true },
            { name: 'ahj_name', type: 'string', isOptional: true },
            { name: 'ahj_level', type: 'string', isOptional: true },
            { name: 'ahj_phone', type: 'string', isOptional: true },
            { name: 'jurisdiction_notes', type: 'string', isOptional: true },
            { name: 'applied_date', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        addColumns({
          table: 'inspections',
          columns: [
            { name: 'permit_id', type: 'string', isOptional: true },
            { name: 'inspection_type', type: 'string', isOptional: true },
            { name: 'sequence_order', type: 'number', isOptional: true },
            { name: 'result', type: 'string', isOptional: true },
            { name: 'correction_notice', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      // v5 — jsa_records: offline JSA capture (a toolbox talk happens in the field,
      // with no signal, which is the whole point of the record).
      toVersion: 5,
      steps: [
        createTable({
          name: 'jsa_records',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'conducted_at', type: 'string' },
            { name: 'attendees_json', type: 'string' },
            { name: 'hazards_json', type: 'string' },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      // v4 — company_assets read cache (§B1): makes the offline yard flow reachable.
      toVersion: 4,
      steps: [
        createTable({
          name: 'company_assets',
          columns: [
            { name: 'asset_number', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'asset_category', type: 'string' },
            { name: 'asset_type', type: 'string', isOptional: true },
            { name: 'make', type: 'string', isOptional: true },
            { name: 'model', type: 'string', isOptional: true },
            { name: 'year', type: 'number', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'condition', type: 'string', isOptional: true },
            { name: 'home_location', type: 'string', isOptional: true },
            { name: 'meter_type', type: 'string' },
            { name: 'current_meter_reading', type: 'number', isOptional: true },
            { name: 'requires_operator_cert', type: 'boolean' },
            { name: 'required_cert_type', type: 'string', isOptional: true },
            { name: 'ownership_type', type: 'string' },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      // v3 — offline read-cache tables (§B1): inspections + safety certifications.
      toVersion: 3,
      steps: [
        createTable({
          name: 'inspections',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'inspection_date', type: 'string', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'inspector_name', type: 'string', isOptional: true },
            { name: 'trade_type', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'safety_certifications',
          columns: [
            { name: 'user_id', type: 'string' },
            { name: 'cert_type', type: 'string' },
            { name: 'issued_at', type: 'string', isOptional: true },
            { name: 'expires_at', type: 'string', isOptional: true },
            { name: 'document_path', type: 'string', isOptional: true },
            { name: 'server_id', type: 'string' },
            { name: 'version', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: 'synced_at', type: 'string', isOptional: true },
            { name: 'is_deleted', type: 'boolean' },
          ],
        }),
      ],
    },
  ],
});
