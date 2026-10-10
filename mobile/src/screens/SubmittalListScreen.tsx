// screens/SubmittalListScreen.tsx — Submittal browse + create + status edit
// Server-side only (read-heavy, not field-critical — mirrors RfiListScreen).
// PATCH /submittals allows OWNER/PM/ESTIMATOR (UI gate; API enforces).

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

type Props = NativeStackScreenProps<RootStackParamList, 'Submittals'>;

interface Submittal {
  id: string;
  number: number;
  title: string;
  status: string;
  spec_section: string | null;
  created_at: string;
  version: number;
}

const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'rejected', 'resubmit'] as const;

const EDIT_ROLES: Role[] = ['owner', 'project_manager', 'estimator'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SubmittalListScreen({ route }: Props) {
  const { projectId, projectName } = route.params;
  const { t } = useTranslation('submittals');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canEdit = hasRole(role, EDIT_ROLES);

  const [items, setItems] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [specSection, setSpecSection] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Submittal | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<string>('draft');
  const [editSpec, setEditSpec] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mobileApi<{ submittals: Submittal[] }>(
        `/submittals?project_id=${projectId}&limit=50`,
        { method: 'GET' },
      );
      setItems(res.submittals);
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

  function openEdit(s: Submittal) {
    setEditing(s);
    setEditTitle(s.title);
    setEditStatus(s.status);
    setEditSpec(s.spec_section ?? '');
  }

  async function submitNew() {
    if (!title.trim()) { Alert.alert(t('required'), t('error_title_required')); return; }
    setSubmitting(true);
    try {
      await mobileApi('/submittals', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, title: title.trim(), spec_section: specSection.trim() || undefined }),
      });
      setTitle(''); setSpecSection(''); setModalVisible(false);
      void load();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editTitle.trim()) { Alert.alert(t('required'), t('error_title_required')); return; }
    setSavingEdit(true);
    try {
      await mobileApi(`/submittals/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          status: editStatus,
          spec_section: editSpec.trim() || null,
          version: editing.version,
        }),
      });
      setEditing(null);
      void load();
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) { Alert.alert(t('conflict_title'), t('conflict_body')); setEditing(null); void load(); }
      else Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSavingEdit(false);
    }
  }

  function renderItem({ item }: { item: Submittal }) {
    return (
      <Card style={styles.card} onPress={() => openEdit(item)}>
        <View style={styles.cardHeader}>
          <Text variant="label">#{item.number}{item.spec_section ? ` · ${item.spec_section}` : ''}</Text>
          <StatusBadge status={item.status} label={t(`status.${item.status}`)} />
        </View>
        <Text variant="body" numberOfLines={2}>{item.title}</Text>
        <Text variant="caption" muted style={styles.meta}>{`Created ${formatDate(item.created_at)}`}</Text>
      </Card>
    );
  }

  if (loading) {
    return <View style={[styles.center, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  const inputStyle = { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {canEdit && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: palette.accent }]} onPress={() => setModalVisible(true)} accessibilityLabel={t('new_button')}>
          <Text variant="bodyStrong" color="#ffffff">{t('new_button')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📑" title={t('empty')} />}
      />

      {/* Create */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title">{t('modal_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{projectName}</Text>

            <Text variant="label" style={styles.label}>{t('title_label')}</Text>
            <TextInput style={[styles.input, inputStyle]} placeholder={t('title_placeholder')} placeholderTextColor={palette.textMuted} value={title} onChangeText={setTitle} multiline numberOfLines={3} />

            <Text variant="label" style={styles.label}>{t('spec_label')}</Text>
            <TextInput style={[styles.inputSingle, inputStyle]} placeholder="03300" placeholderTextColor={palette.textMuted} value={specSection} onChangeText={setSpecSection} autoCapitalize="none" />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => { setTitle(''); setSpecSection(''); setModalVisible(false); }} style={styles.actionCancel} />
              <Button title={submitting ? t('submitting') : t('submit')} onPress={submitNew} loading={submitting} disabled={submitting} style={styles.actionSubmit} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit */}
      <Modal visible={!!editing} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title">{t('edit_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{editing ? `#${editing.number}` : ''}</Text>

            {!canEdit && (
              <Text variant="caption" color={STATUS.warning.fg} style={[styles.readOnly, { backgroundColor: STATUS.warning.bg, borderColor: STATUS.warning.fg }]}>{t('read_only')}</Text>
            )}

            <Text variant="label" style={styles.label}>{t('title_label')}</Text>
            <TextInput style={[styles.input, inputStyle]} value={editTitle} onChangeText={setEditTitle} editable={canEdit} placeholderTextColor={palette.textMuted} multiline numberOfLines={3} />

            <Text variant="label" style={styles.label}>{t('status_label')}</Text>
            <View style={styles.chips}>
              {STATUSES.map((s) => {
                const c = statusColor(s).fg;
                const active = editStatus === s;
                return (
                  <TouchableOpacity key={s} style={[styles.chip, { borderColor: palette.border }, active && { backgroundColor: c, borderColor: c }]} disabled={!canEdit} onPress={() => setEditStatus(s)}>
                    <Text variant="caption" color={active ? '#ffffff' : palette.textMuted}>{t(`status.${s}`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text variant="label" style={styles.label}>{t('spec_label')}</Text>
            <TextInput style={[styles.inputSingle, inputStyle]} value={editSpec} onChangeText={setEditSpec} editable={canEdit} placeholder="03300" placeholderTextColor={palette.textMuted} autoCapitalize="none" />

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
  fab: { position: 'absolute', bottom: 20, right: 16, zIndex: 10, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  modal: { padding: 24, paddingTop: 40 },
  modalProject: { marginBottom: 24, marginTop: 4 },
  label: { marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  inputSingle: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  readOnly: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 16, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionCancel: { flex: 1 },
  actionSubmit: { flex: 2 },
});
