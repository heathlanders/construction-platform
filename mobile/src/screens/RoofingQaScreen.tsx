// screens/RoofingQaScreen.tsx — roofing QA checks for one system, OFFLINE-first.
//
// Dry-in, seam welds and fastener pulls are checked ON the roof. Writes go to
// WatermelonDB (`roofing_qa_records`, schema v8) as `pending` and ride the batch push;
// a conflict is Tier 2 and lands in the shared resolve inbox.
// Write roles (API): OWNER / PM / FOREMAN.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert,
  TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { pullAll, runSyncSweep } from '@/lib/sync';
import type { RoofingQaRecord as QaModel } from '@/models/RoofingQaRecord';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, Button, Badge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RoofingQa'>;
const WRITE_ROLES: Role[] = ['owner', 'project_manager', 'foreman'];

// Mirrors the API's QA_TYPES enum.
const QA_TYPES = ['deck', 'underlayment_dry_in', 'flashing', 'seam_weld', 'fastener_pull', 'water_test', 'final'] as const;
type QaType = (typeof QA_TYPES)[number];
const RESULTS = ['pass', 'fail', 'pending'] as const;
const RESULT_TONE: Record<string, StatusTone> = { pass: 'success', fail: 'danger', pending: 'neutral' };

interface Row { id: string; local_id: string; pending: boolean; qa_type: string; result: string; measured_value: number | null; unit: string | null; inspection_date: string | null }

export function RoofingQaScreen({ route }: Props): React.JSX.Element {
  const { systemId, systemLabel } = route.params;
  const { t } = useTranslation('structural');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canWrite = hasRole(role, WRITE_ROLES);

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [qaType, setQaType] = useState<QaType>('underlayment_dry_in');
  const [result, setResult] = useState<string>('pass');
  const [measured, setMeasured] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sub = database.collections
      .get<QaModel>('roofing_qa_records')
      .query(Q.where('roofing_system_id', systemId), Q.where('is_deleted', false))
      .observeWithColumns(['qa_type', 'result', 'measured_value', 'inspection_date', 'sync_status'])
      .subscribe((rows) => {
        setItems(rows.map((r) => ({
          id: r.server_id, local_id: r.id, pending: r.sync_status !== 'synced',
          qa_type: r.qa_type, result: r.result, measured_value: r.measured_value,
          unit: r.unit, inspection_date: r.inspection_date,
        })).sort((a, b) => (b.inspection_date ?? '').localeCompare(a.inspection_date ?? '')));
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [systemId]);

  const load = useCallback(async () => {
    try { await pullAll(); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function submit(): Promise<void> {
    setSubmitting(true);
    try {
      const m = parseFloat(measured);
      await database.write(async () => {
        await database.get<QaModel>('roofing_qa_records').create((r) => {
          r.roofing_system_id = systemId;
          r.qa_type = qaType;
          r.inspection_date = new Date().toISOString().slice(0, 10);
          r.result = result;
          r.measured_value = isNaN(m) ? null : m;
          // Only the pull-out test carries a load; the rest are pass/fail observations.
          r.unit = qaType === 'fastener_pull' && !isNaN(m) ? 'lbf' : null;
          r.inspector_name = null;
          r.notes = null;
          r.server_id = ''; r.version = 1; r.sync_status = 'pending'; r.synced_at = null; r.is_deleted = false;
        });
      });
      void runSyncSweep();
      setMeasured(''); setQaType('underlayment_dry_in'); setResult('pass');
      setModalVisible(false);
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return <View style={[styles.center, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {canWrite && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: palette.accent }]} onPress={() => setModalVisible(true)} accessibilityLabel={t('new_check')}>
          <Text variant="bodyStrong" color="#ffffff">{t('new_check')}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(i) => i.local_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.accent} />}
        ListEmptyComponent={<EmptyState icon="🏠" title={t('no_checks')} />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardHeader}>
              <Text variant="bodyStrong" style={styles.cardTitle}>{t(`qa_${item.qa_type}`)}</Text>
              <Badge label={t(`result_${item.result}`)} colors={STATUS[RESULT_TONE[item.result] ?? 'neutral']} />
            </View>
            <Text variant="caption" muted>
              {item.pending ? '• ' : ''}
              {item.measured_value != null ? `${item.measured_value}${item.unit ? ` ${item.unit}` : ''}  ·  ` : ''}
              {item.inspection_date ?? '—'}
            </Text>
          </Card>
        )}
      />
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <Text variant="title">{t('new_check')}</Text>
            <Text variant="body" muted style={styles.modalSub}>{systemLabel}</Text>

            <Text variant="label" style={styles.label}>{t('check_type')}</Text>
            <View style={styles.chipRow}>
              {QA_TYPES.map((q) => (
                <TouchableOpacity key={q}
                  style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.surface }, qaType === q && { borderColor: palette.accent, backgroundColor: palette.accent + '22' }]}
                  onPress={() => setQaType(q)}>
                  <Text variant="caption">{t(`qa_${q}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="label" style={styles.label}>{t('result_label')}</Text>
            <View style={styles.chipRow}>
              {RESULTS.map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.surface }, result === r && { borderColor: STATUS[RESULT_TONE[r]].fg, backgroundColor: STATUS[RESULT_TONE[r]].bg }]}
                  onPress={() => setResult(r)}>
                  <Text variant="caption">{t(`result_${r}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {qaType === 'fastener_pull' && (
              <>
                <Text variant="label" style={styles.label}>{t('pull_value')}</Text>
                <TextInput style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                  value={measured} onChangeText={setMeasured} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={palette.textMuted} />
              </>
            )}

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => setModalVisible(false)} style={styles.actionBtn} />
              <Button title={submitting ? t('submitting') : t('submit')} onPress={submit} loading={submitting} disabled={submitting} style={styles.actionBtn} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 12, gap: 10, paddingBottom: 80 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  cardTitle: { flex: 1 },
  fab: { position: 'absolute', bottom: 20, right: 16, zIndex: 10, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  modal: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  modalSub: { marginBottom: 20, marginTop: 4 },
  label: { marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionBtn: { flex: 1 },
});
