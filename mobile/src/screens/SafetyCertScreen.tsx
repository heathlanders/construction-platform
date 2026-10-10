// screens/SafetyCertScreen.tsx — org-wide worker safety certifications: list (expiry) + create
// API-only (online). Org/user-scoped (no project_id) → reached as a GLOBAL tile.
// Closes Doc 19 §4 P0 #1 — gives the field T-57 operator-cert visibility (no mobile view before).
// Create roles (API W): OWNER/PM/SAFETY_OFFICER — UI gates via hasRole(); API still enforces.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Q } from '@nozbe/watermelondb';
import { mobileApi } from '@/lib/api';
import { database } from '@/lib/database';
import { pullAll } from '@/lib/sync';
import type { SafetyCertification as SafetyCertificationModel } from '@/models/SafetyCertification';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { Text, Card, Button, StatusBadge, EmptyState } from '@/components/ui';

/** Flattened view of a cached `safety_certifications` row (server ids). */
interface Cert {
  id: string;
  user_id: string;
  cert_type: string;
  issued_at: string | null;
  expires_at: string | null;
}

const USERS_CACHE_KEY = 'opt:users:roster';
interface OrgUser { id: string; first_name: string; last_name: string; }

const CREATE_ROLES: Role[] = ['owner', 'project_manager', 'safety_officer'];
const CERT_PRESETS = ['OSHA_10', 'OSHA_30', 'First Aid', 'CPR', 'Forklift', 'CDL_A', 'CDL_B', 'Crane', 'Aerial Lift'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// expiry buckets → domain status strings routed through statusColor():
// expired → danger · expiring ≤30d → warning · valid → success · none → neutral
function expiryState(expires_at: string | null): 'expired' | 'expiring' | 'valid' | 'none' {
  if (!expires_at) return 'none';
  const days = (new Date(expires_at).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

export function SafetyCertScreen() {
  const { t } = useTranslation('safety_certs');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canCreate = hasRole(role, CREATE_ROLES);

  const [certs, setCerts] = useState<Cert[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [userId, setUserId] = useState<string | null>(null);
  const [certType, setCertType] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const userName = useMemo(() => {
    const u = users.find((x) => x.id === userId);
    return u ? `${u.first_name} ${u.last_name}` : null;
  }, [users, userId]);

  // Certs render from the local cache (schema v3) — expiry stays checkable with no
  // signal. Reactive, so a sync pull refreshes the list without a re-fetch.
  useEffect(() => {
    const sub = database.collections
      .get<SafetyCertificationModel>('safety_certifications')
      // observeWithColumns — this is a pull-only cache, so the common update is a PULL
      // rewriting an existing row (a renewed expiry date). A plain .observe() would keep
      // showing the stale date, on the one screen whose entire job is expiry.
      .query(Q.where('is_deleted', false))
      .observeWithColumns(['cert_type', 'issued_at', 'expires_at', 'user_id'])
      .subscribe((rows) => {
        setCerts(
          rows
            .map((r) => ({
              id: r.server_id,
              user_id: r.user_id,
              cert_type: r.cert_type,
              issued_at: r.issued_at,
              expires_at: r.expires_at,
            }))
            .sort((a, b) => (a.expires_at ?? '9999').localeCompare(b.expires_at ?? '9999')),
        );
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, []);

  // Worker names aren't part of the cert row, so cache the org roster separately
  // (same AsyncStorage pattern as the cost-code / budget-line pickers).
  const load = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(USERS_CACHE_KEY);
      if (cached) setUsers(JSON.parse(cached) as OrgUser[]);
    } catch { /* ignore a bad cache blob */ }

    try {
      const u = await mobileApi<{ users: OrgUser[] }>(`/users?limit=100`, { method: 'GET' });
      setUsers(u.users);
      await AsyncStorage.setItem(USERS_CACHE_KEY, JSON.stringify(u.users));
    } catch {
      // offline — the cached roster (if any) stands
    }

    try {
      await pullAll(); // one batched delta pull refreshes the cert cache
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); void load(); }, [load]);

  async function submit() {
    if (!userId) { Alert.alert(t('required'), t('error_user_required')); return; }
    if (!certType.trim()) { Alert.alert(t('required'), t('error_type_required')); return; }
    if (issuedAt && !DATE_RE.test(issuedAt)) { Alert.alert(t('required'), t('error_date_format')); return; }
    if (expiresAt && !DATE_RE.test(expiresAt)) { Alert.alert(t('required'), t('error_date_format')); return; }
    setSubmitting(true);
    try {
      await mobileApi('/safety-certifications', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          cert_type: certType.trim(),
          issued_at: issuedAt || undefined,
          expires_at: expiresAt || undefined,
        }),
      });
      setUserId(null); setCertType(''); setIssuedAt(''); setExpiresAt('');
      setModalVisible(false);
      void load();
    } catch {
      Alert.alert(t('error_title'), t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function nameFor(uid: string): string {
    const u = users.find((x) => x.id === uid);
    return u ? `${u.first_name} ${u.last_name}` : t('unknown_worker');
  }

  function renderItem({ item }: { item: Cert }) {
    const state = expiryState(item.expires_at);
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text variant="bodyStrong" style={styles.certType} numberOfLines={1}>{item.cert_type}</Text>
          <StatusBadge status={state} label={t(`exp.${state}`)} />
        </View>
        <Text variant="body" style={styles.worker}>{nameFor(item.user_id)}</Text>
        <Text variant="caption" muted>
          {item.expires_at ? `${t('expires')} ${formatDate(item.expires_at)}` : t('no_expiry')}
        </Text>
      </Card>
    );
  }

  if (loading) {
    return <View style={[styles.center, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  const inputStyle = { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {canCreate && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: palette.accent }]} onPress={() => setModalVisible(true)} accessibilityLabel={t('new_button')}>
          <Text variant="bodyStrong" color="#ffffff">{t('new_button')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={certs}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🎓" title={t('empty')} />}
      />

      {/* Create */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text variant="title" style={styles.modalTitle}>{t('modal_title')}</Text>

            <Text variant="label" style={styles.label}>{t('worker_label')}</Text>
            <TouchableOpacity style={[styles.pickerBtn, inputStyle]} onPress={() => setUserPickerOpen(true)}>
              <Text variant="body" muted={!userName}>{userName ?? t('worker_placeholder')}</Text>
            </TouchableOpacity>

            <Text variant="label" style={styles.label}>{t('type_label')}</Text>
            <View style={styles.chips}>
              {CERT_PRESETS.map((p) => {
                const active = certType === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, { borderColor: palette.border }, active && { backgroundColor: palette.accent, borderColor: palette.accent }]}
                    onPress={() => setCertType(p)}
                  >
                    <Text variant="caption" color={active ? '#ffffff' : palette.textMuted}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={[styles.inputSingle, inputStyle]}
              placeholder={t('type_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={certType}
              onChangeText={setCertType}
              accessibilityLabel={t('type_label')}
            />

            <Text variant="label" style={styles.label}>{t('issued_label')}</Text>
            <TextInput style={[styles.inputSingle, inputStyle]} placeholder="YYYY-MM-DD" placeholderTextColor={palette.textMuted} value={issuedAt} onChangeText={setIssuedAt} autoCapitalize="none" />

            <Text variant="label" style={styles.label}>{t('expires_label')}</Text>
            <TextInput style={[styles.inputSingle, inputStyle]} placeholder="YYYY-MM-DD" placeholderTextColor={palette.textMuted} value={expiresAt} onChangeText={setExpiresAt} autoCapitalize="none" />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => setModalVisible(false)} style={styles.actionCancel} />
              <Button title={submitting ? t('submitting') : t('submit')} onPress={submit} loading={submitting} disabled={submitting} style={styles.actionSubmit} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* User picker */}
      <Modal visible={userPickerOpen} animationType="fade" transparent onRequestClose={() => setUserPickerOpen(false)}>
        <TouchableOpacity style={[styles.sheetBackdrop, { backgroundColor: palette.overlay }]} activeOpacity={1} onPress={() => setUserPickerOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
            <Text variant="heading" style={styles.sheetTitle}>{t('worker_label')}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {users.map((u) => (
                <TouchableOpacity key={u.id} style={[styles.sheetRow, { borderBottomColor: palette.border }]} onPress={() => { setUserId(u.id); setUserPickerOpen(false); }}>
                  <Text variant="body">{u.first_name} {u.last_name}</Text>
                </TouchableOpacity>
              ))}
              {users.length === 0 && <Text variant="body" muted style={styles.emptyText}>{t('no_workers')}</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { padding: 12 },

  list: { padding: 12, gap: 10, paddingBottom: 80 },

  card: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  certType: { flex: 1 },
  worker: { marginBottom: 2 },

  fab: {
    position: 'absolute', bottom: 20, right: 16, zIndex: 10,
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },

  modal: { padding: 24, paddingTop: 40 },
  modalTitle: { marginBottom: 24 },
  label: { marginBottom: 6, marginTop: 14 },
  pickerBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  inputSingle: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionCancel: { flex: 1 },
  actionSubmit: { flex: 2 },

  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 32 },
  sheetTitle: { marginBottom: 12 },
  sheetRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
