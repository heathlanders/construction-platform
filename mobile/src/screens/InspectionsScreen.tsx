// screens/InspectionsScreen.tsx — standalone (non-permit) inspections: list + create + status edit
// Fully OFFLINE-first (WatermelonDB `inspections`, schema v3 — §B1): the list renders from
// the local cache and create / status-change write locally as `pending`, then ride the batch
// push. A conflict lands in the shared registry-driven resolve inbox (Tier 2, T-13/T-14).
// Closes Doc 19 §4 P0 #1 (mobile had only permit-embedded inspection edit before).
// Write roles (API W): OWNER/PM/FOREMAN/SAFETY_OFFICER — UI gates via hasRole(); API still enforces.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { pullAll, runSyncSweep } from '@/lib/sync';
import type { Inspection as InspectionModel } from '@/models/Inspection';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { statusColor } from '@/lib/theme';
import { Text, Card, Button, StatusBadge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Inspections'>;

/** Flattened view of a cached `inspections` row (server ids — never the local Model.id). */
interface Inspection {
  id: string;
  /** WatermelonDB row id — used for local writes (never sent to the API). */
  local_id: string;
  /** Captured offline / not yet accepted by the server. */
  pending: boolean;
  title: string;
  status: string;
  inspection_date: string | null;
  inspector_name: string | null;
  trade_type: string | null;
  notes: string | null;
  version: number;
}

const STATUSES = ['scheduled', 'passed', 'failed', 'requires_action'] as const;

const EDIT_ROLES: Role[] = ['owner', 'project_manager', 'foreman', 'safety_officer'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InspectionsScreen({ route }: Props) {
  const { projectId, projectName } = route.params;
  const { t } = useTranslation('inspections');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canEdit = hasRole(role, EDIT_ROLES);

  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [inspector, setInspector] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFor, setStatusFor] = useState<Inspection | null>(null);

  // Render from the local cache — reactive, so a sync pull refreshes the list
  // without a re-fetch and the screen still works with no signal.
  //
  // ⚠️ observeWithColumns, NOT observe(). A plain query .observe() only emits when the
  // record SET changes — it is silent on a field edit of a row already in the list. So
  // a status change (or the `•` pending marker) did not re-render: the worker tapped
  // "PASSED", the sheet closed, and the card still read SCHEDULED. Any column mapped
  // into the view below has to be listed here or its changes are invisible.
  useEffect(() => {
    const sub = database.collections
      .get<InspectionModel>('inspections')
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'sync_status', 'title', 'inspection_date', 'inspector_name', 'notes', 'version'])
      .subscribe((rows) => {
        setItems(
          rows
            .map((r) => ({
              id: r.server_id,
              local_id: r.id,
              pending: r.sync_status !== 'synced',
              title: r.title,
              status: r.status,
              inspection_date: r.inspection_date,
              inspector_name: r.inspector_name,
              trade_type: r.trade_type,
              notes: r.notes,
              version: r.version,
            }))
            .sort((a, b) => (b.inspection_date ?? '').localeCompare(a.inspection_date ?? '')),
        );
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [projectId]);

  // Freshness: one batched delta pull (all offline tables). Silently no-ops offline.
  const load = useCallback(async () => {
    try {
      await pullAll();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  async function submit() {
    if (!title.trim()) {
      Alert.alert(t('required'), t('error_title_required'));
      return;
    }
    setSubmitting(true);
    try {
      // Offline-first: write locally as `pending`; the sweep pushes it (server_id is
      // minted at push time, so a retry can't duplicate the row).
      await database.write(async () => {
        await database.collections.get<InspectionModel>('inspections').create((r) => {
          r.project_id = projectId;
          r.title = title.trim();
          r.status = 'scheduled';
          r.inspection_date = null;
          r.inspector_name = inspector.trim() || null;
          r.notes = null;
          r.trade_type = null;
          r.server_id = '';
          r.version = 1;
          r.sync_status = 'pending';
          r.synced_at = null;
          r.is_deleted = false;
        });
      });
      setTitle('');
      setInspector('');
      setModalVisible(false);
      void runSyncSweep(); // best-effort immediate push; silent offline
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(insp: Inspection, status: string) {
    setStatusFor(null);
    if (status === insp.status) return;
    try {
      // Local write + flag pending; the sweep pushes it and routes any 409 to the
      // conflict inbox (T-13 Tier 2) instead of losing the field worker's change.
      await database.write(async () => {
        const row = await database.get<InspectionModel>('inspections').find(insp.local_id);
        await row.update((r) => { r.status = status; r.sync_status = 'pending'; });
      });
      void runSyncSweep();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    }
  }

  function renderItem({ item }: { item: Inspection }) {
    return (
      <Card
        style={styles.card}
        onPress={canEdit ? () => setStatusFor(item) : undefined}
      >
        <View style={styles.cardHeader}>
          <Text variant="bodyStrong" style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <StatusBadge status={item.status} label={t(`status.${item.status}`)} />
        </View>
        <Text variant="caption" muted>
          {item.pending ? '• ' : ''}
          {item.inspection_date ? formatDate(item.inspection_date) : t('no_date')}
          {item.inspector_name ? ` · ${item.inspector_name}` : ''}
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

  const inputStyle = { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {canEdit && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: palette.accent }]}
          onPress={() => setModalVisible(true)}
          accessibilityLabel={t('new_button')}
        >
          <Text variant="bodyStrong" color="#ffffff">{t('new_button')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🔍" title={t('empty')} />}
      />

      {/* Create */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title">{t('modal_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{projectName}</Text>

            <Text variant="label" style={styles.label}>{t('title_label')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder={t('title_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={title}
              onChangeText={setTitle}
              accessibilityLabel={t('title_label')}
            />

            <Text variant="label" style={styles.label}>{t('inspector_label')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder={t('inspector_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={inspector}
              onChangeText={setInspector}
              accessibilityLabel={t('inspector_label')}
            />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => { setTitle(''); setInspector(''); setModalVisible(false); }} style={styles.actionCancel} />
              <Button title={submitting ? t('submitting') : t('submit')} onPress={submit} loading={submitting} disabled={submitting} style={styles.actionSubmit} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Status picker */}
      <Modal visible={!!statusFor} animationType="fade" transparent onRequestClose={() => setStatusFor(null)}>
        <TouchableOpacity style={[styles.sheetBackdrop, { backgroundColor: palette.overlay }]} activeOpacity={1} onPress={() => setStatusFor(null)}>
          <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
            <Text variant="heading" style={styles.sheetTitle}>{t('set_status')}</Text>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={styles.sheetRow} onPress={() => statusFor && setStatus(statusFor, s)}>
                <View style={[styles.dot, { backgroundColor: statusColor(s).fg }]} />
                <Text variant="body">{t(`status.${s}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  list: { padding: 12, gap: 10, paddingBottom: 80 },

  card: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  cardTitle: { flex: 1 },

  fab: {
    position: 'absolute', bottom: 20, right: 16, zIndex: 10,
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },

  modal: { padding: 24, paddingTop: 40 },
  modalProject: { marginBottom: 24, marginTop: 4 },
  label: { marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionCancel: { flex: 1 },
  actionSubmit: { flex: 2 },

  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32 },
  sheetTitle: { marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
