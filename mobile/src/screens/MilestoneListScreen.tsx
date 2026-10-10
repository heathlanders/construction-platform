// screens/MilestoneListScreen.tsx — project milestones browse + create + mark complete
// Server-side only (read-heavy). PATCH/POST allow OWNER/PM/FOREMAN (UI gate; API enforces).

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
import { STATUS } from '@/lib/theme';
import { Text, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Milestones'>;

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  version: number;
}

const EDIT_ROLES: Role[] = ['owner', 'project_manager', 'foreman'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MilestoneListScreen({ route }: Props) {
  const { projectId, projectName } = route.params;
  const { t } = useTranslation('milestones');
  const { role } = useCurrentUser();
  const { palette } = useTheme();
  const canEdit = hasRole(role, EDIT_ROLES);

  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mobileApi<{ milestones: Milestone[] }>(
        `/milestones?project_id=${projectId}&limit=100`,
        { method: 'GET' },
      );
      setItems(res.milestones);
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

  async function submitNew() {
    if (!title.trim()) { Alert.alert(t('required'), t('error_title_required')); return; }
    setSubmitting(true);
    try {
      await mobileApi('/milestones', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId, title: title.trim(), due_date: dueDate.trim() || undefined }),
      });
      setTitle(''); setDueDate(''); setModalVisible(false);
      void load();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleComplete(m: Milestone) {
    if (!canEdit) return;
    setBusyId(m.id);
    const completed_at = m.completed_at ? null : new Date().toISOString();
    try {
      const res = await mobileApi<{ milestone: Milestone }>(`/milestones/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed_at, version: m.version }),
      });
      setItems((prev) => prev.map((x) => x.id === m.id
        ? { ...x, completed_at: res.milestone.completed_at, version: res.milestone.version } : x));
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) { Alert.alert(t('conflict_title'), t('conflict_body')); void load(); }
      else Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setBusyId(null);
    }
  }

  function renderItem({ item }: { item: Milestone }) {
    const done = !!item.completed_at;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
        onPress={() => toggleComplete(item)}
        disabled={!canEdit || busyId === item.id}
        activeOpacity={canEdit ? 0.6 : 1}
      >
        <View style={[
          styles.checkbox,
          { borderColor: palette.border },
          done && { backgroundColor: STATUS.success.fg, borderColor: STATUS.success.fg },
        ]}>
          {busyId === item.id
            ? <ActivityIndicator size="small" color={palette.accent} />
            : done ? <Text variant="bodyStrong" color="#fff">✓</Text> : null}
        </View>
        <View style={styles.cardBody}>
          <Text
            variant="subheading"
            muted={done}
            numberOfLines={2}
            style={done ? styles.titleDone : undefined}
          >
            {item.title}
          </Text>
          <Text variant="caption" muted style={styles.meta}>
            {done
              ? `${t('completed')} ${formatDate(item.completed_at as string)}`
              : item.due_date ? `${t('due')} ${formatDate(item.due_date)}` : t('no_due')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {canEdit && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: palette.accent }]}
          onPress={() => setModalVisible(true)}
          accessibilityLabel={t('new_button')}
        >
          <Text variant="bodyStrong" color="#fff">{t('new_button')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.center}><Text variant="body" muted>{t('empty')}</Text></View>}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title">{t('modal_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{projectName}</Text>

            <Text variant="label" style={styles.label}>{t('title_label')}</Text>
            <TextInput
              style={[styles.input, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              placeholder={t('title_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={title}
              onChangeText={setTitle}
              multiline
              numberOfLines={2}
            />

            <Text variant="label" style={styles.label}>{t('due_label')}</Text>
            <TextInput
              style={[styles.inputSingle, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.textMuted}
              value={dueDate}
              onChangeText={setDueDate}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={() => { setTitle(''); setDueDate(''); setModalVisible(false); }}
                style={{ flex: 1 }}
                fullWidth
              />
              <Button
                title={submitting ? t('submitting') : t('submit')}
                onPress={submitNew}
                loading={submitting}
                disabled={submitting}
                style={{ flex: 2 }}
                fullWidth
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 12, gap: 10, paddingBottom: 80 },
  card: { borderRadius: 10, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  titleDone: { textDecorationLine: 'line-through' },
  meta: { marginTop: 4 },
  fab: { position: 'absolute', bottom: 20, right: 16, zIndex: 10, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  modal: { padding: 24, paddingTop: 40 },
  modalProject: { marginBottom: 24, marginTop: 4 },
  label: { marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 60, textAlignVertical: 'top', marginBottom: 20 },
  inputSingle: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
});
