// screens/JSAScreen.tsx — Job Safety Analysis: list + capture, fully OFFLINE-first.
//
// A JSA is the pre-task hazard briefing, run standing on the site with the crew — which
// is precisely where there's no signal. Web has had it since v1.0; mobile had nothing,
// so the Safety Officer (a P0 mobile role) couldn't produce their core artifact in the
// field. Writes go to WatermelonDB (`jsa_records`, schema v5) as `pending` and ride the
// batch push; a conflict is Tier 3 (T-13) and waits for an authorized resolver.
//
// Write roles (API W): OWNER/PM/SAFETY_OFFICER/FOREMAN — UI gates via hasRole(), the
// API still enforces.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
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
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { pullAll, runSyncSweep } from '@/lib/sync';
import { parseJsonArray, type JsaRecord as JsaModel, type JsaAttendee, type JsaHazard } from '@/models/JsaRecord';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole, type Role } from '@/lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, Button, Badge, EmptyState } from '@/components/ui';
import { CalendarPicker } from '@/components/CalendarPicker';
import { loadHazardSuggestions, toJsaHazard, type ApiHazard } from '@/lib/hazard-suggestions';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'JSA'>;

const WRITE_ROLES: Role[] = ['owner', 'project_manager', 'safety_officer', 'foreman'];

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
type Severity = (typeof SEVERITIES)[number];

// Hazard severity is its own scale (not the OSHA incident one) — map to canonical tones
// rather than inventing hex, per the design-kit rule.
const SEVERITY_TONE: Record<Severity, StatusTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

interface Jsa {
  id: string;
  local_id: string;
  pending: boolean;
  title: string;
  conducted_at: string;
  attendees: JsaAttendee[];
  hazards: JsaHazard[];
}

/** Badge tone = the WORST hazard on the record — a critical hazard shouldn't read grey. */
function worstTone(hazards: JsaHazard[]): StatusTone {
  const order: Severity[] = ['critical', 'high', 'medium', 'low'];
  const worst = order.find((s) => hazards.some((h) => (h.severity ?? 'medium') === s));
  return SEVERITY_TONE[worst ?? 'medium'];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function JSAScreen({ route }: Props): React.JSX.Element {
  const { projectId, projectName } = route.params;
  const { t, i18n } = useTranslation('jsa');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canWrite = hasRole(role, WRITE_ROLES);

  const [items, setItems] = useState<Jsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [conductedAt, setConductedAt] = useState(todayISO());
  const [showCal, setShowCal] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendees, setAttendees] = useState<JsaAttendee[]>([]);
  const [hazardDesc, setHazardDesc] = useState('');
  const [hazardControls, setHazardControls] = useState('');
  const [hazardSeverity, setHazardSeverity] = useState<Severity>('medium');
  const [hazards, setHazards] = useState<JsaHazard[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<ApiHazard[] | null>(null);
  const [suggestMsg, setSuggestMsg] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Local cache is the source of truth — observeWithColumns so an in-place edit (or a
  // sync_status flip → the `•` pending marker) actually reaches the screen.
  useEffect(() => {
    const sub = database.collections
      .get<JsaModel>('jsa_records')
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['title', 'conducted_at', 'attendees_json', 'hazards_json', 'sync_status', 'version'])
      .subscribe((rows) => {
        setItems(
          rows
            .map((r) => ({
              id: r.server_id,
              local_id: r.id,
              pending: r.sync_status !== 'synced',
              title: r.title,
              conducted_at: r.conducted_at,
              attendees: parseJsonArray<JsaAttendee>(r.attendees_json),
              hazards: parseJsonArray<JsaHazard>(r.hazards_json),
            }))
            .sort((a, b) => b.conducted_at.localeCompare(a.conducted_at)),
        );
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [projectId]);

  const load = useCallback(async () => {
    try {
      await pullAll();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); void load(); }, [load]);

  function resetForm(): void {
    setTitle('');
    setConductedAt(todayISO());
    setAttendeeName('');
    setAttendees([]);
    setHazardDesc('');
    setHazardControls('');
    setHazardSeverity('medium');
    setHazards([]);
    setSuggestions(null);
    setSuggestMsg(null);
  }

  function addAttendee(): void {
    const name = attendeeName.trim();
    if (!name) return;
    setAttendees((prev) => [...prev, { name }]);
    setAttendeeName('');
  }

  async function suggest(): Promise<void> {
    setSuggestLoading(true); setSuggestMsg(null);
    try {
      const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
      const r = await loadHazardSuggestions(projectId, conductedAt, lang);
      setSuggestions(r.hazards);
      if (r.trades.length === 0) setSuggestMsg(t('suggest_no_trades'));
      else if (r.hazards.length === 0) setSuggestMsg(t('suggest_none'));
      else if (r.fromCache) setSuggestMsg(t('suggest_cached'));
    } catch {
      setSuggestMsg(t('suggest_failed'));
    } finally {
      setSuggestLoading(false);
    }
  }

  function addHazard(): void {
    const description = hazardDesc.trim();
    if (!description) return;
    setHazards((prev) => [...prev, { description, controls: hazardControls.trim() || undefined, severity: hazardSeverity }]);
    setHazardDesc('');
    setHazardControls('');
    setHazardSeverity('medium');
  }

  async function submit(): Promise<void> {
    if (!title.trim()) {
      Alert.alert(t('required'), t('error_title_required'));
      return;
    }
    // A JSA with no hazards identified is not a JSA — it's a signature sheet. Block it
    // here rather than let a blank record become the compliance artifact.
    if (hazards.length === 0) {
      Alert.alert(t('required'), t('error_hazard_required'));
      return;
    }
    setSubmitting(true);
    try {
      await database.write(async () => {
        await database.get<JsaModel>('jsa_records').create((r) => {
          r.project_id = projectId;
          r.title = title.trim();
          r.conducted_at = conductedAt;
          r.attendees_json = JSON.stringify(attendees);
          r.hazards_json = JSON.stringify(hazards);
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

  function renderItem({ item }: { item: Jsa }): React.JSX.Element {
    const open = expanded === item.local_id;
    return (
      <Card onPress={() => setExpanded(open ? null : item.local_id)}>
        <View style={styles.cardHeader}>
          <Text variant="bodyStrong" style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Badge label={t('hazard_count', { count: item.hazards.length })} colors={STATUS[worstTone(item.hazards)]} />
        </View>
        <Text variant="caption" muted>
          {item.pending ? '• ' : ''}
          {item.conducted_at}
          {item.attendees.length ? ` · ${t('attendee_count', { count: item.attendees.length })}` : ''}
        </Text>

        {open && (
          <View style={styles.details}>
            {item.attendees.length > 0 && (
              <>
                <Text variant="label" style={styles.detailLabel}>{t('attendees')}</Text>
                <Text variant="body">{item.attendees.map((a) => a.name).join(', ')}</Text>
              </>
            )}
            <Text variant="label" style={styles.detailLabel}>{t('hazards')}</Text>
            {item.hazards.map((h, i) => (
              <View key={`${h.description}-${i}`} style={styles.hazardRow}>
                <View style={[styles.sevDot, { backgroundColor: STATUS[SEVERITY_TONE[(h.severity ?? 'medium') as Severity]].fg }]} />
                <View style={{ flex: 1 }}>
                  <Text variant="body">{h.description}</Text>
                  {h.controls ? <Text variant="caption" muted>{t('controls')}: {h.controls}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
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

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {canWrite && (
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
        keyExtractor={(i) => i.local_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.accent} />}
        ListEmptyComponent={<EmptyState icon="🦺" title={t('empty')} />}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <Text variant="title">{t('modal_title')}</Text>
            <Text variant="body" muted style={styles.modalProject}>{projectName}</Text>

            <Text variant="label" style={styles.label}>{t('title_label')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              placeholder={t('title_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={title}
              onChangeText={setTitle}
              accessibilityLabel={t('title_label')}
            />

            <Text variant="label" style={styles.label}>{t('conducted_at')}</Text>
            <TouchableOpacity
              style={[styles.select, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => setShowCal(true)}
            >
              <Text variant="body">{conductedAt}</Text>
              <Text variant="body" muted>📅</Text>
            </TouchableOpacity>

            {/* Attendees */}
            <Text variant="label" style={styles.label}>{t('attendees')}</Text>
            {attendees.map((a, i) => (
              <View key={`${a.name}-${i}`} style={styles.chipRow}>
                <Text variant="body" style={{ flex: 1 }}>{a.name}</Text>
                <TouchableOpacity onPress={() => setAttendees((p) => p.filter((_, j) => j !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text variant="body" muted>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, styles.addInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                placeholder={t('attendee_placeholder')}
                placeholderTextColor={palette.textMuted}
                value={attendeeName}
                onChangeText={setAttendeeName}
                onSubmitEditing={addAttendee}
                returnKeyType="done"
              />
              <Button title={t('add')} variant="secondary" onPress={addAttendee} style={styles.addBtn} />
            </View>

            {/* Hazards */}
            <Text variant="label" style={styles.label}>{t('hazards')}</Text>
            {hazards.map((h, i) => (
              <View key={`${h.description}-${i}`} style={styles.chipRow}>
                <View style={[styles.sevDot, { backgroundColor: STATUS[SEVERITY_TONE[(h.severity ?? 'medium') as Severity]].fg }]} />
                <View style={{ flex: 1 }}>
                  <Text variant="body">{h.description}</Text>
                  {h.controls ? <Text variant="caption" muted>{h.controls}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => setHazards((p) => p.filter((_, j) => j !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text variant="body" muted>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Button
              title={suggestLoading ? t('suggest_loading') : t('suggest_hazards')}
              variant="secondary"
              onPress={suggest}
              disabled={suggestLoading}
              style={styles.addHazardBtn}
            />
            {suggestMsg ? <Text variant="caption" muted>{suggestMsg}</Text> : null}
            {(suggestions ?? []).map((h) => {
              const added = hazards.some((x) => x.hazard_id === h.hazard_id);
              return (
                <View key={h.hazard_id} style={[styles.suggestRow, { borderColor: palette.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{h.hazard ?? h.hazard_en}</Text>
                    <Text variant="caption" muted>{h.controls ?? h.controls_en.join('; ')}</Text>
                    <Text variant="caption" muted>
                      OSHA {h.osha_ref} · {t(`severity.${h.severity_label}`)}{h.es_pending && i18n.language?.startsWith('es') ? ` · ${t('es_pending')}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    disabled={added}
                    onPress={() => setHazards((p) => [...p, toJsaHazard(h)])}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={t('suggest_add')}
                  >
                    <Text variant="bodyStrong" color={added ? palette.textMuted : palette.accent}>{added ? t('suggest_added') : t('suggest_add')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
              placeholder={t('hazard_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={hazardDesc}
              onChangeText={setHazardDesc}
            />
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text, marginTop: 8 }]}
              placeholder={t('controls_placeholder')}
              placeholderTextColor={palette.textMuted}
              value={hazardControls}
              onChangeText={setHazardControls}
            />
            <View style={styles.sevRow}>
              {SEVERITIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sevChip,
                    { borderColor: palette.border, backgroundColor: palette.surface },
                    hazardSeverity === s && { borderColor: STATUS[SEVERITY_TONE[s]].fg, backgroundColor: STATUS[SEVERITY_TONE[s]].bg },
                  ]}
                  onPress={() => setHazardSeverity(s)}
                >
                  <Text variant="caption">{t(`severity.${s}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title={t('add_hazard')} variant="secondary" onPress={addHazard} style={styles.addHazardBtn} />

            <View style={styles.modalActions}>
              <Button title={t('cancel')} variant="secondary" onPress={() => { resetForm(); setModalVisible(false); }} style={styles.actionCancel} />
              <Button
                title={submitting ? t('submitting') : t('submit')}
                onPress={submit}
                loading={submitting}
                disabled={submitting}
                style={styles.actionSubmit}
              />
            </View>
          </ScrollView>

          <CalendarPicker
            visible={showCal}
            value={conductedAt}
            palette={palette}
            onSelect={(d) => setConductedAt(d)}
            onClose={() => setShowCal(false)}
          />
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
  details: { marginTop: 12, gap: 4 },
  detailLabel: { marginTop: 8 },
  hazardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  sevDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  fab: {
    position: 'absolute', bottom: 20, right: 16, zIndex: 10,
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  modal: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  modalProject: { marginBottom: 20, marginTop: 4 },
  label: { marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  select: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: { flex: 1 },
  addBtn: { minWidth: 88 },
  sevRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sevChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 6 },
  addHazardBtn: { marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionCancel: { flex: 1 },
  actionSubmit: { flex: 1 },
});
