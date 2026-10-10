// screens/FramingCorrectionsScreen.tsx — corrections raised by a framing inspection,
// OFFLINE-first.
//
// A correction is raised AND cleared at the wall, so the whole life of the record happens
// on site. Writes go to WatermelonDB (`framing_correction_items`, schema v8) as `pending`
// and ride the batch push; a conflict is Tier 2.
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
import type { FramingCorrectionItem as ItemModel } from '@/models/FramingCorrectionItem';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, Button, Badge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'FramingCorrections'>;
const WRITE_ROLES: Role[] = ['owner', 'project_manager', 'foreman'];

const SEVERITIES = ['minor', 'major', 'safety'] as const;
const STATUSES = ['open', 'in_progress', 'resolved'] as const;
const SEVERITY_TONE: Record<string, StatusTone> = { minor: 'neutral', major: 'warning', safety: 'danger' };
const STATUS_TONE: Record<string, StatusTone> = { open: 'danger', in_progress: 'warning', resolved: 'success' };

interface Row { id: string; local_id: string; pending: boolean; description: string; location: string | null; severity: string; status: string }

export function FramingCorrectionsScreen({ route }: Props): React.JSX.Element {
  const { inspectionId, inspectionLabel } = route.params;
  const { t } = useTranslation('structural');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canWrite = hasRole(role, WRITE_ROLES);

  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFor, setStatusFor] = useState<Row | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<string>('minor');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sub = database.collections
      .get<ItemModel>('framing_correction_items')
      .query(Q.where('framing_inspection_id', inspectionId), Q.where('is_deleted', false))
      .observeWithColumns(['description', 'location', 'severity', 'status', 'sync_status'])
      .subscribe((rows) => {
        setItems(rows.map((r) => ({
          id: r.server_id, local_id: r.id, pending: r.sync_status !== 'synced',
          description: r.description, location: r.location, severity: r.severity, status: r.status,
        })));
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [inspectionId]);

  const load = useCallback(async () => {
    try { await pullAll(); } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function setStatus(item: Row, status: string): Promise<void> {
    setStatusFor(null);
    if (status === item.status) return;
    try {
      await database.write(async () => {
        const row = await database.get<ItemModel>('framing_correction_items').find(item.local_id);
        await row.update((r) => { r.status = status; r.sync_status = 'pending'; });
      });
      void runSyncSweep();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    }
  }

  async function submit(): Promise<void> {
    if (!description.trim()) { Alert.alert(t('required'), t('error_description_required')); return; }
    setSubmitting(true);
    try {
      await database.write(async () => {
        await database.get<ItemModel>('framing_correction_items').create((r) => {
          r.framing_inspection_id = inspectionId;
          r.description = description.trim();
          r.location = location.trim() || null;
          r.severity = severity;
          r.status = 'open';
          r.notes = null;
          r.server_id = ''; r.version = 1; r.sync_status = 'pending'; r.synced_at = null; r.is_deleted = false;
        });
      });
      void runSyncSweep();
      setDescription(''); setLocation(''); setSeverity('minor');
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
        <TouchableOpacity style={[styles.fab, { backgroundColor: palette.accent }]} onPress={() => setModalVisible(true)} accessibilityLabel={t('new_correction')}>
          <Text variant="bodyStrong" color="#ffffff">{t('new_correction')}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={items}
        keyExtractor={(i) => i.local_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={palette.accent} />}
        ListEmptyComponent={<EmptyState icon="🪵" title={t('no_corrections')} />}
        renderItem={({ item }) => (
          // Tapping a row clears it — that IS the field action here, so it gets the whole
          // card rather than a secondary control.
          <Card onPress={canWrite ? () => setStatusFor(item) : undefined}>
            <View style={styles.cardHeader}>
              <Text variant="bodyStrong" style={styles.cardTitle}>{item.description}</Text>
              <Badge label={t(`cor_status_${item.status}`)} colors={STATUS[STATUS_TONE[item.status] ?? 'neutral']} />
            </View>
            <Text variant="caption" muted>
              {item.pending ? '• ' : ''}
              {t(`cor_severity_${item.severity}`)}
              {item.location ? `  ·  ${item.location}` : ''}
            </Text>
          </Card>
        )}
      />

      <Modal visible={!!statusFor} animationType="fade" transparent onRequestClose={() => setStatusFor(null)}>
        <TouchableOpacity style={[styles.sheetBackdrop, { backgroundColor: palette.overlay }]} activeOpacity={1} onPress={() => setStatusFor(null)}>
          <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
            <Text variant="heading" style={styles.sheetTitle}>{t('set_status')}</Text>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={styles.sheetRow} onPress={() => statusFor && setStatus(statusFor, s)}>
                <View style={[styles.dot, { backgroundColor: STATUS[STATUS_TONE[s]].fg }]} />
                <Text variant="body">{t(`cor_status_${s}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <Text variant="title">{t('new_correction')}</Text>
            <Text variant="body" muted style={styles.modalSub}>{inspectionLabel}</Text>

            <Text variant="label" style={styles.label}>{t('correction_description')}</Text>
            <TextInput style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              value={description} onChangeText={setDescription} placeholder={t('correction_placeholder')} placeholderTextColor={palette.textMuted} />

            <Text variant="label" style={styles.label}>{t('correction_location')}</Text>
            <TextInput style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              value={location} onChangeText={setLocation} placeholder={t('location_placeholder')} placeholderTextColor={palette.textMuted} />

            <Text variant="label" style={styles.label}>{t('correction_severity')}</Text>
            <View style={styles.chipRow}>
              {SEVERITIES.map((sv) => (
                <TouchableOpacity key={sv}
                  style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.surface }, severity === sv && { borderColor: STATUS[SEVERITY_TONE[sv]].fg, backgroundColor: STATUS[SEVERITY_TONE[sv]].bg }]}
                  onPress={() => setSeverity(sv)}>
                  <Text variant="caption">{t(`cor_severity_${sv}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 36 },
  sheetTitle: { marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
