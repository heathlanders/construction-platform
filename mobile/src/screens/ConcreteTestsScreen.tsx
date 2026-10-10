// screens/ConcreteTestsScreen.tsx — ACI concrete QA tests for one pour, OFFLINE-first.
//
// Slump, air content and temperature are measured while the truck is still at the pour;
// cylinder breaks are logged against that same pour at 7 and 28 days. None of those
// moments is guaranteed a signal, and a measurement you couldn't write down is a
// measurement that gets re-taken or invented later.
//
// Writes go to WatermelonDB (`concrete_test_records`, schema v7) as `pending` and ride
// the batch push; a conflict is Tier 2 and lands in the shared resolve inbox.
// Write roles (API W): OWNER / PM / FOREMAN.

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
import type { ConcreteTestRecord as TestModel } from '@/models/ConcreteTestRecord';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, Button, Badge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ConcreteTests'>;

const WRITE_ROLES: Role[] = ['owner', 'project_manager', 'foreman'];

// Mirrors the API's TEST_TYPES enum.
const TEST_TYPES = ['slump', 'air_content', 'temperature', 'cylinder_compressive', 'other'] as const;
type TestType = (typeof TEST_TYPES)[number];

// The unit is implied by the test — asking a worker to type "psi" is a chance to get it
// wrong. Cylinder breaks are the only ones with a meaningful age.
const UNIT_FOR: Record<TestType, string> = {
  slump: 'in',
  air_content: 'pct',
  temperature: 'F',
  cylinder_compressive: 'psi',
  other: '',
};

const RESULT_TONE: Record<string, StatusTone> = { pass: 'success', fail: 'danger', pending: 'neutral' };

interface TestRow {
  id: string;
  local_id: string;
  pending: boolean;
  test_type: string;
  test_date: string | null;
  measured_value: number | null;
  specified_value: number | null;
  unit: string | null;
  result: string;
  age_days: number | null;
}

export function ConcreteTestsScreen({ route }: Props): React.JSX.Element {
  const { pourId, pourLabel } = route.params;
  const { t } = useTranslation('structural');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canWrite = hasRole(role, WRITE_ROLES);

  const [items, setItems] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [testType, setTestType] = useState<TestType>('slump');
  const [measured, setMeasured] = useState('');
  const [specified, setSpecified] = useState('');
  const [ageDays, setAgeDays] = useState('');
  const [sampleId, setSampleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sub = database.collections
      .get<TestModel>('concrete_test_records')
      .query(Q.where('pour_id', pourId), Q.where('is_deleted', false))
      .observeWithColumns(['test_type', 'measured_value', 'specified_value', 'result', 'test_date', 'sync_status'])
      .subscribe((rows) => {
        setItems(rows.map((r) => ({
          id: r.server_id,
          local_id: r.id,
          pending: r.sync_status !== 'synced',
          test_type: r.test_type,
          test_date: r.test_date,
          measured_value: r.measured_value,
          specified_value: r.specified_value,
          unit: r.unit,
          result: r.result,
          age_days: r.age_days,
        })).sort((a, b) => (b.test_date ?? '').localeCompare(a.test_date ?? '')));
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [pourId]);

  const load = useCallback(async () => {
    try { await pullAll(); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); void load(); }, [load]);

  function resetForm(): void {
    setTestType('slump'); setMeasured(''); setSpecified(''); setAgeDays(''); setSampleId('');
  }

  async function submit(): Promise<void> {
    const m = parseFloat(measured);
    if (isNaN(m)) { Alert.alert(t('required'), t('error_measured_required')); return; }
    const spec = parseFloat(specified);

    // Mirrors the server's auto pass/fail for cylinder breaks (measured >= specified).
    // Every other test type is a reading someone else judges, so it stays `pending`
    // rather than being silently graded here.
    const result = testType === 'cylinder_compressive' && !isNaN(spec)
      ? (m >= spec ? 'pass' : 'fail')
      : 'pending';

    setSubmitting(true);
    try {
      await database.write(async () => {
        await database.get<TestModel>('concrete_test_records').create((r) => {
          r.pour_id = pourId;
          r.test_type = testType;
          r.test_date = new Date().toISOString().slice(0, 10);
          r.age_days = ageDays.trim() ? parseInt(ageDays, 10) : null;
          r.specified_value = isNaN(spec) ? null : spec;
          r.measured_value = m;
          r.unit = UNIT_FOR[testType] || null;
          r.result = result;
          r.sample_id = sampleId.trim() || null;
          r.lab_name = null;
          r.notes = null;
          r.server_id = '';
          r.version = 1;
          r.sync_status = 'pending';
          r.synced_at = null;
          r.is_deleted = false;
        });
      });
      void runSyncSweep();
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function renderItem({ item }: { item: TestRow }): React.JSX.Element {
    return (
      <Card>
        <View style={styles.cardHeader}>
          <Text variant="bodyStrong" style={styles.cardTitle}>{t(`test_${item.test_type}`)}</Text>
          <Badge label={t(`result_${item.result}`)} colors={STATUS[RESULT_TONE[item.result] ?? 'neutral']} />
        </View>
        <Text variant="caption" muted>
          {item.pending ? '• ' : ''}
          {item.measured_value != null ? `${item.measured_value}${item.unit ? ` ${item.unit}` : ''}` : '—'}
          {item.specified_value != null ? `  ·  ${t('specified')} ${item.specified_value}` : ''}
          {item.age_days != null ? `  ·  ${t('age_days_short', { days: item.age_days })}` : ''}
          {item.test_date ? `  ·  ${item.test_date}` : ''}
        </Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const showAge = testType === 'cylinder_compressive';

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {canWrite && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: palette.accent }]}
          onPress={() => setModalVisible(true)}
          accessibilityLabel={t('new_test')}
        >
          <Text variant="bodyStrong" color="#ffffff">{t('new_test')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.local_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />}
        ListEmptyComponent={<EmptyState icon="🧪" title={t('no_tests')} />}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <Text variant="title">{t('new_test')}</Text>
            <Text variant="body" muted style={styles.modalSub}>{pourLabel}</Text>

            <Text variant="label" style={styles.label}>{t('test_type')}</Text>
            <View style={styles.chipRow}>
              {TEST_TYPES.map((tt) => (
                <TouchableOpacity
                  key={tt}
                  style={[
                    styles.chip,
                    { borderColor: palette.border, backgroundColor: palette.surface },
                    testType === tt && { borderColor: palette.accent, backgroundColor: palette.accent + '22' },
                  ]}
                  onPress={() => setTestType(tt)}
                >
                  <Text variant="caption">{t(`test_${tt}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="label" style={styles.label}>
              {t('measured')}{UNIT_FOR[testType] ? ` (${UNIT_FOR[testType]})` : ''}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              value={measured} onChangeText={setMeasured} keyboardType="decimal-pad"
              placeholder="0" placeholderTextColor={palette.textMuted}
              accessibilityLabel={t('measured')}
            />

            <Text variant="label" style={styles.label}>{t('specified_optional')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              value={specified} onChangeText={setSpecified} keyboardType="decimal-pad"
              placeholder="0" placeholderTextColor={palette.textMuted}
            />

            {showAge && (
              <>
                <Text variant="label" style={styles.label}>{t('age_days')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                  value={ageDays} onChangeText={setAgeDays} keyboardType="number-pad"
                  placeholder="28" placeholderTextColor={palette.textMuted}
                />
              </>
            )}

            <Text variant="label" style={styles.label}>{t('sample_id')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              value={sampleId} onChangeText={setSampleId}
              placeholder={t('sample_placeholder')} placeholderTextColor={palette.textMuted}
            />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => { resetForm(); setModalVisible(false); }} style={styles.actionBtn} />
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
  fab: {
    position: 'absolute', bottom: 20, right: 16, zIndex: 10,
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  modal: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  modalSub: { marginBottom: 20, marginTop: 4 },
  label: { marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionBtn: { flex: 1 },
});
