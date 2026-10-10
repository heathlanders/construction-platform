// screens/PermitDetailScreen.tsx — Permit detail + AHJ inspection milestones.
// Field users with role OWNER/PROJECT_MANAGER/FOREMAN can record an inspection result
// (pass/fail/partial), date, and inspector name. PATCH uses optimistic locking (T-12).
// API-only (online). Locked decisions: A-13 (i18n), T-09, T-12.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { pullAll, runSyncSweep } from '@/lib/sync';
import type { Permit as PermitModel } from '@/models/Permit';
import type { Inspection as InspectionModel } from '@/models/Inspection';
import { hasRole, type Role } from '../lib/tileManifest';
import { useCurrentUser } from '../lib/user-context';
import { useTheme } from '@/lib/theme-context';
import { statusColor, STATUS } from '@/lib/theme';
import { Text, Card, Button, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { permitCodeLabel, type Permit } from './PermitListScreen';

type PermitDetailRouteProp = RouteProp<RootStackParamList, 'PermitDetail'>;

interface Inspection {
  id: string;
  /** WatermelonDB row id — used for the local write, never sent to the API. */
  local_id: string;
  /** Captured offline / not yet accepted by the server. */
  pending: boolean;
  permit_id: string | null;
  sequence_order: number | null;
  inspection_type: string | null;
  title: string;
  inspection_date: string | null;
  inspector_name: string | null;
  status: string;
  result: string | null;
  correction_notice: string | null;
  version: number;
}

// Lowercase to match the JWT role claim (the old UPPERCASE array never matched → canEdit was always false).
const EDIT_ROLES: Role[] = ['owner', 'project_manager', 'foreman'];

const RESULTS = ['pass', 'fail', 'partial'] as const;
type ResultValue = (typeof RESULTS)[number];

function toIsoDate(yyyymmdd: string): string | null {
  // Accept YYYY-MM-DD → noon UTC ISO; return null if blank/invalid.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyymmdd)) return null;
  const d = new Date(`${yyyymmdd}T12:00:00.000Z`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function InspectionRow({
  inspection, canEdit, onUpdated,
}: {
  inspection: Inspection;
  canEdit: boolean;
  onUpdated: () => void;
}) {
  const { t } = useTranslation('permits');
  const { palette } = useTheme();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(inspection.inspection_date ? inspection.inspection_date.slice(0, 10) : '');
  const [inspector, setInspector] = useState(inspection.inspector_name ?? '');
  const [result, setResult] = useState<ResultValue | ''>((inspection.result as ResultValue) ?? '');
  const [saving, setSaving] = useState(false);

  // Writes LOCALLY (sync_status='pending') and lets the batch push carry it. An AHJ
  // inspection is witnessed standing at the work with the inspector — the one moment
  // you can least count on a signal — and a 409 now lands in the shared conflict inbox
  // (inspections are Tier 2) instead of an alert the worker can only dismiss.
  const save = async () => {
    setSaving(true);
    try {
      const iso = date ? toIsoDate(date) : null;
      await database.write(async () => {
        const row = await database.get<InspectionModel>('inspections').find(inspection.local_id);
        await row.update((r) => {
          r.inspection_date = iso;
          r.inspector_name = inspector || null;
          r.result = result || null;
          // The API mirrors result → status (pass→passed, fail→failed, partial→
          // requires_action); do the same locally or the dot lies until the next pull.
          if (result) r.status = result === 'pass' ? 'passed' : result === 'fail' ? 'failed' : 'requires_action';
          r.sync_status = 'pending';
        });
      });
      void runSyncSweep();
      onUpdated();
      setEditing(false);
    } catch (e) {
      Alert.alert(t('update_failed'), e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface };

  return (
    <Card style={styles.inspCard}>
      <View style={styles.inspHeader}>
        <Text variant="subheading" style={styles.inspTitle}>{inspection.title}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor(inspection.status).fg }]} />
      </View>
      <Text variant="caption" muted style={styles.inspMeta}>
        {inspection.pending ? '• ' : ''}
        {inspection.inspection_date ? inspection.inspection_date.slice(0, 10) : t('no_date')}
        {inspection.inspector_name ? `  ·  ${inspection.inspector_name}` : ''}
        {inspection.result ? `  ·  ${t(`result_${inspection.result}`)}` : ''}
      </Text>

      {!editing && inspection.correction_notice ? (
        <Text variant="caption" color={STATUS.danger.fg} style={[styles.correction, { backgroundColor: STATUS.danger.bg }]}>{inspection.correction_notice}</Text>
      ) : null}

      {canEdit && !editing ? (
        <TouchableOpacity onPress={() => setEditing(true)} accessibilityRole="button" hitSlop={10}>
          <Text variant="bodyStrong" color={palette.accent} style={styles.editLink}>{t('record_result')}</Text>
        </TouchableOpacity>
      ) : null}

      {editing ? (
        <View style={[styles.editBox, { borderTopColor: palette.border }]}>
          <Text variant="caption" muted style={styles.fieldLabel}>{t('inspection_date')}</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            style={[styles.input, inputStyle]}
          />

          <Text variant="caption" muted style={styles.fieldLabel}>{t('inspector_name')}</Text>
          <TextInput
            value={inspector}
            onChangeText={setInspector}
            placeholder={t('inspector_placeholder')}
            placeholderTextColor={palette.textMuted}
            style={[styles.input, inputStyle]}
          />

          <Text variant="caption" muted style={styles.fieldLabel}>{t('result')}</Text>
          <View style={styles.resultRow}>
            {RESULTS.map((r) => {
              const active = result === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setResult(r)}
                  style={[styles.resultBtn, { borderColor: palette.border }, active && { backgroundColor: palette.accent, borderColor: palette.accent }]}
                  accessibilityRole="button"
                >
                  <Text variant="caption" color={active ? '#ffffff' : palette.textMuted}>
                    {t(`result_${r}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actionRow}>
            <Button title={t('cancel')} variant="ghost" onPress={() => setEditing(false)} />
            <Button title={saving ? t('saving') : t('save')} onPress={save} loading={saving} disabled={saving} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

export function PermitDetailScreen(): React.ReactElement {
  const route = useRoute<PermitDetailRouteProp>();
  const { permitId } = route.params;
  const { t } = useTranslation('permits');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canEdit = hasRole(role, EDIT_ROLES);

  const [permit, setPermit] = useState<Permit | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Both halves render from the local cache so the screen is alive at the site:
  // the permit is pull-only, its milestones are the writable `inspections` table.
  useEffect(() => {
    const sub = database.collections
      .get<PermitModel>('permits')
      .query(Q.where('server_id', permitId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'permit_number', 'ahj_name', 'jurisdiction_notes'])
      .subscribe((rows) => {
        const r = rows[0];
        setPermit(r ? {
          id: r.server_id, permit_type: r.permit_type, permit_number: r.permit_number,
          building_type: r.building_type ?? '', code_type: r.code_type, code_edition: r.code_edition,
          nec_edition: r.nec_edition, status: r.status, ahj_name: r.ahj_name, ahj_level: r.ahj_level,
          ahj_phone: r.ahj_phone, jurisdiction_notes: r.jurisdiction_notes, applied_date: r.applied_date,
        } : null);
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [permitId]);

  useEffect(() => {
    const sub = database.collections
      .get<InspectionModel>('inspections')
      .query(Q.where('permit_id', permitId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'result', 'inspection_date', 'inspector_name', 'correction_notice', 'sync_status'])
      .subscribe((rows) => {
        setInspections(
          rows
            .map((r) => ({
              id: r.server_id,
              local_id: r.id,
              pending: r.sync_status !== 'synced',
              permit_id: r.permit_id,
              sequence_order: r.sequence_order,
              inspection_type: r.inspection_type,
              title: r.title,
              inspection_date: r.inspection_date,
              inspector_name: r.inspector_name,
              status: r.status,
              result: r.result,
              correction_notice: r.correction_notice,
              version: r.version,
            }))
            .sort((a, b) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0)),
        );
      });
    return () => sub.unsubscribe();
  }, [permitId]);

  const load = useCallback(async () => { await pullAll(); }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  // The local query is reactive — nothing to merge by hand after a save.
  const updateInspection = () => {};

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {permit ? (
        <Card style={styles.summary}>
          <Text variant="heading">{permit.permit_number ?? t('pending')}</Text>
          <Text variant="caption" style={styles.summaryMeta}>
            {t(`type_${permit.permit_type}`)}  ·  {permitCodeLabel(permit)}  ·  {t(`status_${permit.status}`)}
          </Text>
          {permit.ahj_name ? (
            <Text variant="caption" muted style={styles.summaryAhj}>
              {permit.ahj_name}
              {permit.ahj_level ? `  (${t(`ahj_level_${permit.ahj_level}`, { defaultValue: permit.ahj_level })})` : ''}
              {permit.ahj_phone ? `  ·  ${permit.ahj_phone}` : ''}
            </Text>
          ) : null}
          {permit.jurisdiction_notes ? (
            <Text variant="caption" color={STATUS.warning.fg} style={styles.summaryNotes}>{permit.jurisdiction_notes}</Text>
          ) : null}
        </Card>
      ) : null}

      <Text variant="label" muted style={styles.sectionLabel}>{t('inspections_title')}</Text>

      {inspections.length === 0 ? (
        <EmptyState icon="🔍" title={t('no_inspections')} />
      ) : (
        inspections.map((insp) => (
          <InspectionRow key={insp.local_id} inspection={insp} canEdit={canEdit} onUpdated={updateInspection} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { marginBottom: 16 },
  summaryMeta: { marginTop: 6, textTransform: 'capitalize' },
  summaryAhj: { marginTop: 4 },
  summaryNotes: { marginTop: 6, lineHeight: 16 },
  sectionLabel: { textTransform: 'uppercase', marginBottom: 8 },
  inspCard: { marginBottom: 12 },
  inspHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inspTitle: { flex: 1, paddingRight: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  inspMeta: { marginTop: 6, textTransform: 'capitalize' },
  correction: { borderRadius: 6, padding: 8, marginTop: 8, overflow: 'hidden' },
  editLink: { marginTop: 10 },
  editBox: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  fieldLabel: { marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  resultRow: { flexDirection: 'row', gap: 8 },
  resultBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
});
