// screens/CrewListScreen.tsx — project crew assignments: who's on the job.
// Server-side only. POST/PATCH/DELETE gated OWNER/PM/FOREMAN (UI gate; API enforces).

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
import { mobileApi } from '@/lib/api';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Text, Button } from '@/components/ui';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Crew'>;

interface Assignment {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  user_role: string | null;
  start_date: string | null;
  end_date: string | null;
  role_on_task: string | null;
  version: number;
}

interface OrgUser {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const EDIT_ROLES: Role[] = ['owner', 'project_manager', 'foreman'];

function fullName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(' ') || '—';
}

export function CrewListScreen({ route }: Props) {
  const { projectId, projectName } = route.params;
  const { t } = useTranslation('crew');
  const { role } = useCurrentUser();
  const { palette } = useTheme();
  const canEdit = hasRole(role, EDIT_ROLES);

  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OrgUser | null>(null);
  const [roleOnTask, setRoleOnTask] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mobileApi<{ crew_assignments: Assignment[] }>(
        `/crew-assignments?project_id=${projectId}&limit=100`,
        { method: 'GET' },
      );
      setItems(res.crew_assignments);
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

  async function openModal() {
    setModalVisible(true);
    if (users.length === 0) {
      try {
        const res = await mobileApi<{ users: OrgUser[] }>('/users?limit=100', { method: 'GET' });
        // Hide users already assigned + portal roles.
        setUsers(res.users.filter((u) => !u.role?.includes('portal')));
      } catch { /* offline — picker empty */ }
    }
  }

  function closeModal() {
    setModalVisible(false);
    setSelectedUser(null); setRoleOnTask(''); setStartDate(''); setEndDate('');
  }

  async function assign() {
    if (!selectedUser) { Alert.alert(t('required'), t('error_user_required')); return; }
    setSubmitting(true);
    try {
      await mobileApi('/crew-assignments', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          user_id: selectedUser.id,
          role_on_task: roleOnTask.trim() || undefined,
          start_date: startDate.trim() || undefined,
          end_date: endDate.trim() || undefined,
        }),
      });
      closeModal();
      void load();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmRemove(a: Assignment) {
    if (!canEdit) return;
    Alert.alert(t('remove_title'), fullName(a.first_name, a.last_name), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileApi(`/crew-assignments/${a.id}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((x) => x.id !== a.id));
          } catch {
            Alert.alert(t('error_title'), t('error_submit_failed'));
          }
        },
      },
    ]);
  }

  function renderItem({ item }: { item: Assignment }) {
    const dates = item.start_date || item.end_date
      ? `${item.start_date ?? '…'} → ${item.end_date ?? '…'}`
      : t('no_dates');
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
        onPress={() => confirmRemove(item)}
        disabled={!canEdit}
        activeOpacity={canEdit ? 0.6 : 1}
      >
        <View style={[styles.avatar, { backgroundColor: palette.accent }]}>
          <Text variant="heading" color="#fff">{(item.first_name?.[0] ?? '?').toUpperCase()}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text variant="subheading">{fullName(item.first_name, item.last_name)}</Text>
          <Text variant="caption" muted style={styles.meta}>
            {item.role_on_task || (item.user_role ? item.user_role.replace(/_/g, ' ') : '—')} · {dates}
          </Text>
        </View>
        {canEdit && <Text variant="heading" color={STATUS.danger.fg} style={styles.removeMark}>✕</Text>}
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
          onPress={openModal}
          accessibilityLabel={t('assign_button')}
        >
          <Text variant="bodyStrong" color="#fff">{t('assign_button')}</Text>
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
            <Text variant="title">{t('assign_button')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{projectName}</Text>

            <Text variant="label" style={styles.label}>{t('worker_label')}</Text>
            <View style={styles.chips}>
              {users.length === 0 && <Text variant="body" muted>{t('no_workers')}</Text>}
              {users.map((u) => {
                const active = selectedUser?.id === u.id;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[
                      styles.chip,
                      { borderColor: palette.border, backgroundColor: palette.surface },
                      active && { backgroundColor: palette.accent, borderColor: palette.accent },
                    ]}
                    onPress={() => setSelectedUser(u)}
                  >
                    <Text variant="caption" color={active ? '#fff' : palette.text}>{u.first_name} {u.last_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text variant="label" style={styles.label}>{t('role_label')}</Text>
            <TextInput
              style={[styles.inputSingle, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              placeholder={t('role_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={roleOnTask}
              onChangeText={setRoleOnTask}
            />

            <Text variant="label" style={styles.label}>{t('start_label')}</Text>
            <TextInput
              style={[styles.inputSingle, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.textMuted}
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
            />

            <Text variant="label" style={styles.label}>{t('end_label')}</Text>
            <TextInput
              style={[styles.inputSingle, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.textMuted}
              value={endDate}
              onChangeText={setEndDate}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={closeModal} style={{ flex: 1 }} fullWidth />
              <Button
                title={submitting ? t('assigning') : t('assign')}
                onPress={assign}
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
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  meta: { marginTop: 3, textTransform: 'capitalize' },
  removeMark: { paddingHorizontal: 4 },
  fab: { position: 'absolute', bottom: 20, right: 16, zIndex: 10, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  modal: { padding: 24, paddingTop: 40 },
  modalProject: { marginBottom: 24, marginTop: 4 },
  label: { marginBottom: 6 },
  inputSingle: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  modalActions: { flexDirection: 'row', gap: 12 },
});
