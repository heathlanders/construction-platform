// screens/RfiListScreen.tsx — RFI browse + create
// Server-side only (no offline storage for RFIs — read-heavy, not field-critical)

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
import { mobileApi, ApiError } from '@/lib/api';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { statusColor, STATUS } from '@/lib/theme';
import { Text, Card, Button, StatusBadge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Rfis'>;

interface Rfi {
  id: string;
  number: number;
  subject: string;
  status: string;
  due_date: string | null;
  created_at: string;
  version: number;
}

const STATUSES = ['draft', 'open', 'answered', 'closed'] as const;

// PATCH /rfis allows OWNER/PM/ESTIMATOR/FOREMAN (UI gate; API enforces).
const EDIT_ROLES: Role[] = ['owner', 'project_manager', 'estimator', 'foreman'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RfiListScreen({ route }: Props) {
  const { projectId, projectName } = route.params;
  const { t } = useTranslation('rfi');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canEdit = hasRole(role, EDIT_ROLES);

  const [rfis, setRfis] = useState<Rfi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit/answer
  const [editing, setEditing] = useState<Rfi | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editStatus, setEditStatus] = useState<string>('draft');
  const [editDue, setEditDue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  function openEdit(rfi: Rfi) {
    setEditing(rfi);
    setEditSubject(rfi.subject);
    setEditStatus(rfi.status);
    setEditDue(rfi.due_date ?? '');
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editSubject.trim()) { Alert.alert(t('required'), t('error_subject_required')); return; }
    setSavingEdit(true);
    try {
      await mobileApi(`/rfis/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subject: editSubject.trim(),
          status: editStatus,
          due_date: editDue.trim() || null,
          version: editing.version,
        }),
      });
      setEditing(null);
      void load();
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) {
        Alert.alert(t('conflict_title'), t('conflict_body'));
        setEditing(null);
        void load();
      } else {
        Alert.alert(t('error_title'), t('error_submit_failed'));
      }
    } finally {
      setSavingEdit(false);
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await mobileApi<{ rfis: Rfi[] }>(
        `/rfis?project_id=${projectId}&limit=50`,
        { method: 'GET' },
      );
      setRfis(res.rfis);
    } catch {
      // offline — keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  async function submitRfi() {
    if (!subject.trim()) {
      Alert.alert(t('required'), t('error_subject_required'));
      return;
    }
    setSubmitting(true);
    try {
      await mobileApi('/rfis', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, subject: subject.trim() }),
      });
      setSubject('');
      setModalVisible(false);
      void load();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function renderItem({ item }: { item: Rfi }) {
    return (
      <Card style={styles.card} onPress={() => openEdit(item)}>
        <View style={styles.cardHeader}>
          <Text variant="label">RFI #{item.number}</Text>
          <StatusBadge status={item.status} label={t(`status.${item.status}`)} />
        </View>
        <Text variant="body" numberOfLines={2}>{item.subject}</Text>
        <Text variant="caption" muted style={styles.meta}>
          {item.due_date ? `Due ${formatDate(item.due_date)}` : `Created ${formatDate(item.created_at)}`}
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
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: palette.accent }]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={t('new_button')}
      >
        <Text variant="bodyStrong" color="#ffffff">{t('new_button')}</Text>
      </TouchableOpacity>

      <FlatList
        data={rfis}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="❓" title={t('empty')} />}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: palette.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title">{t('modal_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{projectName}</Text>

            <Text variant="label" style={styles.label}>{t('subject_label')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder={t('subject_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={subject}
              onChangeText={setSubject}
              multiline
              numberOfLines={3}
              accessibilityLabel={t('subject_label')}
            />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => { setSubject(''); setModalVisible(false); }} style={styles.actionCancel} />
              <Button title={submitting ? t('submitting') : t('submit')} onPress={submitRfi} loading={submitting} disabled={submitting} style={styles.actionSubmit} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit / answer */}
      <Modal visible={!!editing} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title">{t('edit_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{editing ? `RFI #${editing.number}` : ''}</Text>

            {!canEdit && (
              <Text variant="caption" color={STATUS.warning.fg} style={[styles.readOnly, { backgroundColor: STATUS.warning.bg, borderColor: STATUS.warning.fg }]}>{t('read_only')}</Text>
            )}

            <Text variant="label" style={styles.label}>{t('subject_label')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              value={editSubject}
              onChangeText={setEditSubject}
              editable={canEdit}
              placeholderTextColor={palette.textMuted}
              multiline
              numberOfLines={3}
              accessibilityLabel={t('subject_label')}
            />

            <Text variant="label" style={styles.label}>{t('status_label')}</Text>
            <View style={styles.chips}>
              {STATUSES.map((s) => {
                const c = statusColor(s).fg;
                const active = editStatus === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, { borderColor: palette.border }, active && { backgroundColor: c, borderColor: c }]}
                    disabled={!canEdit}
                    onPress={() => setEditStatus(s)}
                  >
                    <Text variant="caption" color={active ? '#ffffff' : palette.textMuted}>{t(`status.${s}`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text variant="label" style={styles.label}>{t('due_date_label')}</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              value={editDue}
              onChangeText={setEditDue}
              editable={canEdit}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              accessibilityLabel={t('due_date_label')}
            />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => setEditing(null)} style={styles.actionCancel} />
              {canEdit && (
                <Button title={savingEdit ? t('saving') : t('save')} onPress={saveEdit} loading={savingEdit} disabled={savingEdit} style={styles.actionSubmit} />
              )}
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

  card: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  meta: { marginTop: 6 },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    zIndex: 10,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  modal: { padding: 24, paddingTop: 40 },
  modalProject: { marginBottom: 24, marginTop: 4 },
  label: { marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  readOnly: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 16, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionCancel: { flex: 1 },
  actionSubmit: { flex: 2 },
});
