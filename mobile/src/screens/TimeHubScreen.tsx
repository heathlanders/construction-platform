// TimeHubScreen.tsx — unified ADP-style "Time" surface (single bottom tab).
//
// One place for everything time-related, adapting to the tenant's capture mode
// (tenant_settings.time_tracking_mode, read from GET /settings/org):
//   • clock_in_out → punch in/out card (live elapsed, project picker, switch, today list)
//   • manual       → "Add Hours" with TWO entry modes:
//                      – Day:  one date + hours against a project
//                      – Week: a 7-day grid (Mon–Sun) → one time_entry per day with hours
// Both modes also show: this-week day grid, today's items, and the weekly Timecard
// card (open + submit FSM, total/OT, history) that turns logged time into an approval.
//
// Offline-first for manual entries: writes WatermelonDB first (sync_status='pending'),
// then best-effort POST /time-entries (same pattern as TimeEntryScreen). Clock punches
// and timecards are online-only (timestamp accuracy / not in the offline set).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi } from '@/lib/api';
import { capturePunchLocation } from '@/lib/location';
import { getUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { TimeEntry } from '@/models/TimeEntry';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { StatusBadge } from '@/components/ui';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole } from '@/lib/tileManifest';
import { CalendarPicker } from '@/components/CalendarPicker';
import { PunchEditor, type EditablePunch } from '@/components/PunchEditor';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TimeHub'>;

type Mode = 'manual' | 'clock_in_out';

interface Project { id: string; name: string; status: string }

interface TimePunch {
  id: string;
  project_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  hours_worked: number | null;
  auto_clocked_out: boolean;
  version: number;
}
interface TimeEntryRow {
  id: string;
  project_id: string;
  date: string;
  hours_worked: number | string;
  notes: string | null;
}
type TimecardStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
interface Timecard {
  id: string; week_start: string; status: TimecardStatus;
  total_hours: number | string; overtime_hours: number | string;
  rejection_note: string | null; version: number;
}

// ── date helpers (ISO Monday week, matching timecards.week_start) ──────────────
function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function mondayISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}
/** 7 ISO dates Mon..Sun for the week containing `monday`. */
function weekDates(monday: string): string[] {
  const base = new Date(`${monday}T00:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}
function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtLongDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function formatElapsed(iso: string): string {
  const total = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

export function TimeHubScreen(_: Props) {
  const { t } = useTranslation('field');
  const { t: tc } = useTranslation('common');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  // UX gate mirrors the API: clock = WORKER_ROLES; manual add = time-entry write roles (incl. field_tech, self-only).
  const canClock = hasRole(role, ['owner', 'project_manager', 'foreman', 'field_tech']);
  const canAdd = hasRole(role, ['owner', 'project_manager', 'foreman', 'accountant', 'field_tech']);

  const [mode, setMode] = useState<Mode>('manual');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);   // this week (manual)
  const [punches, setPunches] = useState<TimePunch[]>([]);      // this week (clock)
  const [activePunch, setActivePunch] = useState<TimePunch | null>(null);
  const [card, setCard] = useState<Timecard | null>(null);
  const [rejectedCard, setRejectedCard] = useState<Timecard | null>(null);
  const [cardHistory, setCardHistory] = useState<Timecard[]>([]);

  const monday = mondayISO();
  const days = weekDates(monday);

  // ── live elapsed timer for the active punch ──
  const [elapsed, setElapsed] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activePunch) {
      setElapsed(formatElapsed(activePunch.clock_in_at));
      timerRef.current = setInterval(() => setElapsed(formatElapsed(activePunch.clock_in_at)), 30000);
    } else { if (timerRef.current) clearInterval(timerRef.current); setElapsed(''); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activePunch]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const user = await getUser();
      if (!user) throw new Error(tc('error'));

      const settings = await mobileApi<{ settings: { time_tracking_mode: string } }>('/settings/org')
        .catch(() => ({ settings: { time_tracking_mode: 'manual' } }));
      const m = (settings.settings.time_tracking_mode as Mode) ?? 'manual';
      setMode(m);

      const [projRes, cardRes] = await Promise.all([
        mobileApi<{ projects: Project[] }>('/projects?status=active&limit=100').catch(() => ({ projects: [] })),
        mobileApi<{ timecards: Timecard[] }>(`/timecards?user_id=${user.user_id}&limit=50`).catch(() => ({ timecards: [] })),
      ]);
      setProjects(projRes.projects ?? []);

      const cards = cardRes.timecards ?? [];
      setCard(cards.find((c) => String(c.week_start).slice(0, 10) === monday && c.status !== 'rejected') ?? null);
      setRejectedCard(cards.find((c) => String(c.week_start).slice(0, 10) === monday && c.status === 'rejected') ?? null);
      setCardHistory(cards);

      if (m === 'clock_in_out') {
        const pRes = await mobileApi<{ time_punches: TimePunch[] }>(
          `/time-punches?date_from=${monday}&date_to=${todayISO()}&limit=100`,
        ).catch(() => ({ time_punches: [] }));
        const all = pRes.time_punches ?? [];
        setActivePunch(all.find((p) => p.clock_out_at === null) ?? null);
        setPunches(all);
        setEntries([]);
      } else {
        const eRes = await mobileApi<{ time_entries: TimeEntryRow[] }>(
          `/time-entries?user_id=${user.user_id}&limit=100`,
        ).catch(() => ({ time_entries: [] }));
        const wk = new Set(days);
        setEntries((eRes.time_entries ?? []).filter((e) => wk.has(String(e.date).slice(0, 10))));
        setActivePunch(null);
        setPunches([]);
      }
    } catch (err) {
      if (!quiet) Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
    } finally { setLoading(false); setRefreshing(false); }
  }, [tc, monday]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); void load(true); };

  // ── per-day hours for the week grid (manual: entries, clock: punches) ──
  const byDay: Record<string, number> = {};
  for (const e of entries) {
    const k = String(e.date).slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + Number(e.hours_worked);
  }
  for (const p of punches) {
    if (p.hours_worked == null) continue;
    const k = p.clock_in_at.slice(0, 10);
    byDay[k] = (byDay[k] ?? 0) + Number(p.hours_worked);
  }
  const weekTotal = Object.values(byDay).reduce((s, n) => s + n, 0);

  // ── clock in/out ──
  const projName = (id: string | null) => projects.find((p) => p.id === id)?.name ?? '—';
  const [pickProjFor, setPickProjFor] = useState<null | 'clock_in' | 'switch'>(null);

  const doClockIn = async (project: Project | null) => {
    setActing(true);
    try {
      const loc = await capturePunchLocation();
      await mobileApi('/time-punches/clock-in', { method: 'POST', body: JSON.stringify({ project_id: project?.id ?? undefined, ...(loc ?? {}) }) });
      await load(true);
    } catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
    finally { setActing(false); }
  };
  const doClockOut = async () => {
    if (!activePunch) return;
    setActing(true);
    try {
      await mobileApi('/time-punches/clock-out', {
        method: 'POST',
        body: JSON.stringify({ punch_id: activePunch.id, version: activePunch.version }),
      });
      await load(true);
    } catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
    finally { setActing(false); }
  };
  const doSwitch = async (project: Project) => {
    if (!activePunch) return;
    setActing(true);
    try {
      await mobileApi('/time-punches/clock-out', { method: 'POST', body: JSON.stringify({ punch_id: activePunch.id, version: activePunch.version }) });
      const loc = await capturePunchLocation();
      await mobileApi('/time-punches/clock-in', { method: 'POST', body: JSON.stringify({ project_id: project.id, ...(loc ?? {}) }) });
      await load(true);
    } catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
    finally { setActing(false); }
  };

  // ── timecard open/submit ──
  const openWeek = async () => {
    setActing(true);
    try { await mobileApi('/timecards', { method: 'POST', body: JSON.stringify({ week_start: monday }) }); await load(true); }
    catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
    finally { setActing(false); }
  };
  const submitCard = (c: Timecard) => {
    Alert.alert(t('timecards.title'), t('timecards.confirm_submit'), [
      { text: tc('cancel'), style: 'cancel' },
      { text: t('timecards.submit'), onPress: async () => {
        setActing(true);
        try { await mobileApi(`/timecards/${c.id}/submit`, { method: 'POST', body: JSON.stringify({ version: c.version }) }); await load(true); }
        catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
        finally { setActing(false); }
      } },
    ]);
  };

  // ── Add-hours modal (manual mode) ──
  const [showAdd, setShowAdd] = useState(false);
  const [punchEditor, setPunchEditor] = useState<{ mode: 'add' | 'edit'; punch: EditablePunch | null } | null>(null);

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  const cardBg = { backgroundColor: palette.surface, borderColor: palette.border };

  const renderBadge = (status: TimecardStatus) => (
    <StatusBadge status={status} label={t(`timecards.status.${status}`)} />
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ───────── Capture card ───────── */}
      {mode === 'clock_in_out' && canClock ? (
        <View style={[styles.capCard, activePunch ? [styles.capActive, cardBg, { borderColor: STATUS.success.fg }] : [styles.capIdle, cardBg]]}>
          {activePunch ? (
            <>
              <View style={styles.statusRow}><View style={[styles.dot, { backgroundColor: STATUS.success.fg }]} /><Text style={[styles.clockedLabel, { color: STATUS.success.fg }]}>{t('time_hub.clocked_in')}</Text></View>
              <Text style={[styles.projName, { color: palette.text }]}>{projName(activePunch.project_id)}</Text>
              <Text style={[styles.elapsed, { color: palette.textMuted }]}>
                {t('time_punches.clocked_in_since', { time: formatTime(activePunch.clock_in_at), duration: elapsed })}
              </Text>
              {acting ? <ActivityIndicator color={palette.accent} style={{ marginTop: 12 }} /> : (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.switchBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]} onPress={() => setPickProjFor('switch')} disabled={acting}>
                    <Text style={[styles.switchText, { color: palette.text }]}>{t('time_punches.switch_project')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.clockOutBtn, { backgroundColor: STATUS.danger.fg }]} onPress={doClockOut} disabled={acting}>
                    <Text style={styles.clockOutText}>{t('time_punches.clock_out')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.idleLabel, { color: palette.textMuted }]}>{t('time_punches.not_clocked_in')}</Text>
              {acting ? <ActivityIndicator color={palette.accent} /> : (
                <TouchableOpacity style={[styles.clockInBtn, { backgroundColor: palette.accent }]}
                  onPress={() => (projects.length ? setPickProjFor('clock_in') : doClockIn(null))} disabled={acting}>
                  <Text style={styles.clockInText}>{t('time_punches.clock_in')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : mode === 'manual' && canAdd ? (
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: palette.accent }]} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>＋ {t('time_hub.add_hours')}</Text>
        </TouchableOpacity>
      ) : null}

      {/* ───────── Week grid ───────── */}
      <View style={[styles.section, cardBg]}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('time_hub.this_week')}</Text>
          <Text style={[styles.weekTotal, { color: palette.text }]}>{t('time_hub.week_total', { hours: weekTotal.toFixed(1) })}</Text>
        </View>
        <View style={styles.weekGrid}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((lbl, i) => {
            const key = days[i];
            const isToday = key === todayISO();
            const h = byDay[key] ?? 0;
            return (
              <View key={key} style={[styles.dayCell, isToday && { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.dayLbl, { color: isToday ? palette.accent : palette.textMuted }]}>{lbl}</Text>
                <Text style={[styles.dayHrs, { color: h > 0 ? palette.text : palette.textMuted }]}>{h > 0 ? `${h.toFixed(1)}` : '—'}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ───────── Today's punches (clock mode) — tap a closed punch to correct it ───────── */}
      {mode === 'clock_in_out' && canClock && (
        <View style={[styles.section, cardBg]}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('time_punches.punch_history_today')}</Text>
            <TouchableOpacity onPress={() => setPunchEditor({ mode: 'add', punch: null })}>
              <Text style={[styles.linkBtn, { color: palette.accent }]}>＋ {t('punch.add_short')}</Text>
            </TouchableOpacity>
          </View>
          {punches.filter((p) => p.clock_in_at.slice(0, 10) === todayISO()).length === 0 ? (
            <Text style={[styles.empty, { color: palette.textMuted }]}>{t('punch.none_today')}</Text>
          ) : (
            punches.filter((p) => p.clock_in_at.slice(0, 10) === todayISO()).map((p) => {
              const closed = p.clock_out_at !== null;
              const Row: React.ComponentType<any> = closed ? TouchableOpacity : View;
              return (
                <Row key={p.id} style={[styles.rowItem, { borderTopColor: palette.border }]}
                  {...(closed ? { onPress: () => setPunchEditor({ mode: 'edit', punch: {
                    id: p.id, version: p.version, clock_in_at: p.clock_in_at, clock_out_at: p.clock_out_at, project_id: p.project_id,
                  } }) } : {})}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowMain, { color: palette.text }]}>{projName(p.project_id)}</Text>
                    <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                      {formatTime(p.clock_in_at)} — {p.clock_out_at ? formatTime(p.clock_out_at) : '…'}{p.auto_clocked_out ? '  (auto)' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.rowHrs, { color: palette.text }]}>{Number(p.hours_worked ?? 0).toFixed(2)}h</Text>
                  {closed ? <Text style={{ color: palette.textMuted, marginStart: 8 }}>›</Text> : null}
                </Row>
              );
            })
          )}
        </View>
      )}
      {mode === 'manual' && entries.filter((e) => String(e.date).slice(0, 10) === todayISO()).length > 0 && (
        <View style={[styles.section, cardBg]}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('time_hub.today_entries')}</Text>
          {entries.filter((e) => String(e.date).slice(0, 10) === todayISO()).map((e) => (
            <View key={e.id} style={[styles.rowItem, { borderTopColor: palette.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowMain, { color: palette.text }]}>{projName(e.project_id)}</Text>
                {e.notes ? <Text style={[styles.rowSub, { color: palette.textMuted }]} numberOfLines={1}>{e.notes}</Text> : null}
              </View>
              <Text style={[styles.rowHrs, { color: palette.text }]}>{Number(e.hours_worked).toFixed(2)}h</Text>
            </View>
          ))}
        </View>
      )}

      {/* ───────── Weekly timecard ───────── */}
      <View style={[styles.section, cardBg]}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('timecards.title')}</Text>
          {card && renderBadge(card.status)}
        </View>
        <Text style={[styles.weekOf, { color: palette.text }]}>{t('timecards.week_of', { date: fmtDate(monday) })}</Text>
        {card ? (
          <>
            <View style={styles.hoursRow}>
              <View style={[styles.hoursCol, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.hoursVal, { color: palette.text }]}>{Number(card.total_hours).toFixed(2)}</Text>
                <Text style={[styles.hoursLbl, { color: palette.textMuted }]}>{t('timecards.total_hours')}</Text>
              </View>
              <View style={[styles.hoursCol, { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.hoursVal, { color: palette.text }]}>{Number(card.overtime_hours).toFixed(2)}</Text>
                <Text style={[styles.hoursLbl, { color: palette.textMuted }]}>{t('timecards.overtime_hours')}</Text>
              </View>
            </View>
            {card.status === 'draft' && (acting ? <ActivityIndicator color={palette.accent} /> :
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: palette.accent }]} onPress={() => submitCard(card)}>
                <Text style={styles.primaryBtnText}>{t('timecards.submit')}</Text>
              </TouchableOpacity>)}
            {card.status === 'submitted' && <Text style={[styles.note, { color: STATUS.warning.fg }]}>{t('timecards.submitted_note')}</Text>}
            {card.status === 'approved' && <Text style={[styles.note, { color: STATUS.success.fg }]}>{t('timecards.approved_note')}</Text>}
          </>
        ) : (
          <>
            <Text style={[styles.empty, { color: palette.textMuted }]}>{t('timecards.no_card')}</Text>
            {rejectedCard && <Text style={[styles.rejected, { color: STATUS.danger.fg }]}>{t('timecards.rejected_note', { note: rejectedCard.rejection_note ?? '' })}</Text>}
            {acting ? <ActivityIndicator color={palette.accent} /> :
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: palette.accent }]} onPress={openWeek}>
                <Text style={styles.primaryBtnText}>{rejectedCard ? t('timecards.reopen') : t('timecards.open_week')}</Text>
              </TouchableOpacity>}
          </>
        )}
      </View>

      {/* ───────── History ───────── */}
      {cardHistory.length > 0 && (
        <View style={[styles.section, cardBg]}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('timecards.history')}</Text>
          {cardHistory.map((c) => (
            <View key={c.id} style={[styles.rowItem, { borderTopColor: palette.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowMain, { color: palette.text }]}>{fmtDate(String(c.week_start).slice(0, 10))}</Text>
                <Text style={[styles.rowSub, { color: palette.textMuted }]}>
                  {Number(c.total_hours).toFixed(2)} {t('timecards.hours_unit')}{Number(c.overtime_hours) > 0 ? `  ·  OT ${Number(c.overtime_hours).toFixed(2)}` : ''}
                </Text>
              </View>
              {renderBadge(c.status)}
            </View>
          ))}
        </View>
      )}

      {/* clock-mode project picker */}
      <ProjectPickerModal
        visible={pickProjFor !== null}
        projects={projects}
        palette={palette}
        title={t('time_hub.select_project')}
        cancelLabel={tc('cancel')}
        emptyLabel={t('time_punches.no_active_projects')}
        onPick={(p) => {
          const action = pickProjFor; setPickProjFor(null);
          if (action === 'clock_in') void doClockIn(p);
          else if (action === 'switch') void doSwitch(p);
        }}
        onCancel={() => setPickProjFor(null)}
      />

      {/* manual-mode add-hours modal */}
      <AddHoursModal
        visible={showAdd}
        projects={projects}
        weekDays={days}
        palette={palette}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); void load(true); }}
      />

      {/* clock-mode add / edit / delete a punch */}
      <PunchEditor
        visible={punchEditor !== null}
        mode={punchEditor?.mode ?? 'add'}
        punch={punchEditor?.punch ?? null}
        projects={projects}
        palette={palette}
        onClose={() => setPunchEditor(null)}
        onSaved={() => { setPunchEditor(null); void load(true); }}
      />
    </ScrollView>
  );
}

// ─────────────────────────── Project picker modal ───────────────────────────
function ProjectPickerModal({
  visible, projects, palette, title, cancelLabel, emptyLabel, onPick, onCancel,
}: {
  visible: boolean; projects: Project[]; palette: any; title: string;
  cancelLabel: string; emptyLabel: string; onPick: (p: Project) => void; onCancel: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: palette.surface }]}>
          <View style={[styles.modalHead, { borderBottomColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>{title}</Text>
            <TouchableOpacity onPress={onCancel}><Text style={[styles.cancelLink, { color: palette.accent }]}>{cancelLabel}</Text></TouchableOpacity>
          </View>
          <FlatList
            data={projects}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.optRow, { borderBottomColor: palette.border }]} onPress={() => onPick(item)}>
                <Text style={[styles.optText, { color: palette.text }]}>{item.name}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 20 }}>›</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[styles.empty, { color: palette.textMuted, padding: 24 }]}>{emptyLabel}</Text>}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────── Add-hours modal ───────────────────────────
// Employee-simple: project (OPTIONAL) + date + hours (+ notes). No rate / cost-code /
// budget — pay rate is an admin setting (user_payroll_settings), not employee-entered.
// Day mode: one date + hours. Week mode: a 7-day grid (Mon–Sun) → one entry per day.
function AddHoursModal({
  visible, projects, weekDays, palette, onClose, onSaved,
}: {
  visible: boolean; projects: Project[]; weekDays: string[]; palette: any;
  onClose: () => void; onSaved: () => void;
}) {
  const { t } = useTranslation('field');
  const { t: tc } = useTranslation('common');

  const [tab, setTab] = useState<'day' | 'week'>('day');
  const [project, setProject] = useState<Project | null>(null);
  const [pickProj, setPickProj] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [weekHours, setWeekHours] = useState<string[]>(['', '', '', '', '', '', '']);
  const [saving, setSaving] = useState(false);
  const [showCal, setShowCal] = useState(false);

  // reset on open
  useEffect(() => {
    if (visible) {
      setTab('day'); setProject(null); setDate(todayISO()); setHours('');
      setNotes(''); setWeekHours(['', '', '', '', '', '', '']); setShowCal(false);
    }
  }, [visible]);

  async function createEntry(d: string, h: number, user: { user_id: string }) {
    let localId: string | null = null;
    await database.write(async () => {
      const e = await database.get<TimeEntry>('time_entries').create((r) => {
        r.project_id = project?.id ?? '';  // '' = no project (column is non-optional string)
        r.user_id = user.user_id;
        r.date = d;
        r.hours_worked = h;
        r.hourly_rate_cents = null;   // rate is admin-set (user_payroll_settings), resolved server-side
        r.cost_code_id = null;
        r.budget_line_item_id = null;
        r.notes = notes.trim() || null;
        r.server_id = '';
        r.version = 1;
        r.sync_status = 'pending';
        r.synced_at = null;
        r.is_deleted = false;
      });
      localId = e.id;
    });
    try {
      const res = await mobileApi<{ time_entry: { id: string; version: number } }>('/time-entries', {
        method: 'POST',
        body: JSON.stringify({
          project_id: project?.id ?? undefined, user_id: user.user_id, date: d, hours_worked: h,
          notes: notes.trim() || null,
        }),
      });
      if (localId) {
        const e = await database.get<TimeEntry>('time_entries').find(localId);
        await database.write(async () => {
          await e.update((r) => {
            r.server_id = res.time_entry.id; r.version = res.time_entry.version;
            r.sync_status = 'synced'; r.synced_at = new Date().toISOString();
          });
        });
      }
    } catch { /* offline — stays pending */ }
  }

  const save = async () => {
    const user = await getUser();
    if (!user) return;

    if (tab === 'day') {
      const h = parseFloat(hours);
      if (isNaN(h) || h <= 0) { Alert.alert('', t('time_hub.hours_required')); return; }
      setSaving(true);
      try { await createEntry(date, h, user); Alert.alert('', t('time_logged')); onSaved(); }
      catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
      finally { setSaving(false); }
    } else {
      const items = weekDays.map((d, i) => ({ d, h: parseFloat(weekHours[i]) })).filter((x) => !isNaN(x.h) && x.h > 0);
      if (items.length === 0) { Alert.alert('', t('time_hub.hours_required')); return; }
      setSaving(true);
      try {
        for (const it of items) await createEntry(it.d, it.h, user);
        Alert.alert('', t('time_hub.week_logged', { count: items.length }));
        onSaved();
      } catch (err) { Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error')); }
      finally { setSaving(false); }
    }
  };

  const weekSum = weekHours.reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={[styles.modalHead, { borderBottomColor: palette.border, backgroundColor: palette.headerBg, paddingTop: 52 }]}>
          <Text style={[styles.modalTitle, { color: '#fff' }]}>{t('time_hub.add_hours')}</Text>
          <TouchableOpacity onPress={onClose}><Text style={[styles.cancelLink, { color: '#cbd5e1' }]}>{tc('cancel')}</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Day/Week tabs */}
          <View style={[styles.segRow, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {(['day', 'week'] as const).map((x) => (
              <TouchableOpacity key={x} style={[styles.seg, tab === x && { backgroundColor: palette.accent }]} onPress={() => setTab(x)}>
                <Text style={[styles.segText, { color: tab === x ? '#fff' : palette.text }]}>{t(`time_hub.tab_${x}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'day' ? (
            <>
              <Text style={[styles.fLabel, { color: palette.textMuted }]}>{t('date')}</Text>
              <TouchableOpacity style={[styles.select, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setShowCal(true)}>
                <Text style={{ color: palette.text }}>{fmtLongDate(date)}</Text>
                <Text style={{ color: palette.textMuted, fontSize: 18 }}>📅</Text>
              </TouchableOpacity>
              <Text style={[styles.fLabel, { color: palette.textMuted }]}>{t('hours')}</Text>
              <TextInput style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                value={hours} onChangeText={setHours} placeholder="8.0" placeholderTextColor={palette.textMuted} keyboardType="decimal-pad" />
            </>
          ) : (
            <>
              <Text style={[styles.fLabel, { color: palette.textMuted }]}>{t('time_hub.hours_per_day')}</Text>
              {weekDays.map((d, i) => (
                <View key={d} style={styles.weekInputRow}>
                  <Text style={[styles.weekInputDay, { color: palette.text }]}>{dayNames[i]} <Text style={{ color: palette.textMuted, fontSize: 12 }}>{fmtDate(d)}</Text></Text>
                  <TextInput style={[styles.weekInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                    value={weekHours[i]} placeholder="0" placeholderTextColor={palette.textMuted} keyboardType="decimal-pad"
                    onChangeText={(v) => setWeekHours((prev) => prev.map((p, j) => (j === i ? v : p)))} />
                </View>
              ))}
              <Text style={[styles.weekSum, { color: palette.text }]}>{t('time_hub.week_total', { hours: weekSum.toFixed(1) })}</Text>
            </>
          )}

          {/* Project — OPTIONAL */}
          <Text style={[styles.fLabel, { color: palette.textMuted }]}>{t('time_hub.project_optional')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.select, { flex: 1, backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setPickProj(true)}>
              <Text style={{ color: project ? palette.text : palette.textMuted }} numberOfLines={1}>{project?.name ?? t('time_hub.no_project')}</Text>
              <Text style={{ color: palette.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
            {project ? (
              <TouchableOpacity style={[styles.clearBtn, { borderColor: palette.border }]} onPress={() => setProject(null)}>
                <Text style={{ color: palette.textMuted }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.fLabel, { color: palette.textMuted }]}>{t('notes')}</Text>
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
            value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: palette.accent, marginTop: 20 }, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t('submit')}</Text>}
          </TouchableOpacity>
        </ScrollView>

        <ProjectPickerModal visible={pickProj} projects={projects} palette={palette}
          title={t('time_hub.select_project')} cancelLabel={tc('cancel')} emptyLabel={t('time_punches.no_active_projects')}
          onPick={(p) => { setProject(p); setPickProj(false); }} onCancel={() => setPickProj(false)} />

        <CalendarPicker visible={showCal} value={date} palette={palette}
          onSelect={(d) => setDate(d)} onClose={() => setShowCal(false)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // capture
  capCard: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2 },
  capActive: {},
  capIdle: { borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginEnd: 8 },
  clockedLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  projName: { fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 2 },
  elapsed: { fontSize: 13, marginBottom: 16 },
  idleLabel: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  switchBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  switchText: { fontSize: 14, fontWeight: '600' },
  clockOutBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  clockOutText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  clockInBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  clockInText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  addBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // sections
  section: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  weekTotal: { fontSize: 13, fontWeight: '600' },
  weekOf: { fontSize: 17, fontWeight: '600', marginBottom: 14 },

  weekGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', flex: 1, paddingVertical: 6, borderRadius: 8 },
  dayLbl: { fontSize: 11, fontWeight: '500' },
  dayHrs: { fontSize: 12, marginTop: 4, fontWeight: '500' },

  rowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: 1 },
  linkBtn: { fontSize: 14, fontWeight: '700' },
  rowMain: { fontSize: 14, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowHrs: { fontSize: 14, fontWeight: '600' },

  hoursRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  hoursCol: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  hoursVal: { fontSize: 26, fontWeight: '700' },
  hoursLbl: { fontSize: 12, marginTop: 2 },
  primaryBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  rejected: { fontSize: 13, marginBottom: 12, textAlign: 'center' },

  // modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  cancelLink: { fontSize: 15 },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1 },
  optText: { fontSize: 16 },

  // add form
  segRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 4, marginBottom: 8, gap: 4 },
  seg: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segText: { fontSize: 14, fontWeight: '600' },
  fLabel: { fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  textArea: { height: 80 },
  select: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  weekInputDay: { fontSize: 15, fontWeight: '500' },
  weekInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, width: 90, textAlign: 'right' },
  weekSum: { fontSize: 14, fontWeight: '600', textAlign: 'right', marginTop: 6 },
  clearBtn: { width: 46, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
