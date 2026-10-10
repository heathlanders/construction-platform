// ClockScreen.tsx — Employee clock in/out for W2 hourly workers
//
// Primary mobile interface for field workers using clock_in_out time tracking mode.
// On load: checks org settings mode, loads active punch + today's history + projects.
// Clock actions hit the API directly (timestamp accuracy is critical).
// Offline: actions fail gracefully with a clear message — retry when reconnected.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi } from '@/lib/api';
import { capturePunchLocation } from '@/lib/location';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Clock'>;

interface TimePunch {
  id: string;
  project_id: string | null;
  clock_in_at: string;
  clock_out_at: string | null;
  hours_worked: number | null;
  auto_clocked_out: boolean;
  notes: string | null;
  version: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface PunchListResponse {
  time_punches: TimePunch[];
}

interface ProjectsResponse {
  projects: Project[];
}

interface ClockInResponse {
  time_punch: TimePunch;
}

interface ClockOutResponse {
  time_punch: TimePunch;
}

interface OrgSettingsResponse {
  settings: { time_tracking_mode: string };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatElapsed(clockInIso: string): string {
  const ms = Date.now() - new Date(clockInIso).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function weekStartISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d.toISOString().slice(0, 10);
}

export function ClockScreen({ navigation }: Props) {
  const { t } = useTranslation('field');
  const { t: tc } = useTranslation('common');
  const { palette } = useTheme();

  const [mode, setMode] = useState<'manual' | 'clock_in_out' | null>(null);
  const [activePunch, setActivePunch] = useState<TimePunch | null>(null);
  const [todayPunches, setTodayPunches] = useState<TimePunch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekByDay, setWeekByDay] = useState<Record<string, number>>({});
  const [todayTotal, setTodayTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);

  // Project picker state
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clock_in' | 'clock_out' | 'switch' | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Live elapsed timer
  const [elapsed, setElapsed] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activePunch) {
      setElapsed(formatElapsed(activePunch.clock_in_at));
      timerRef.current = setInterval(
        () => setElapsed(formatElapsed(activePunch.clock_in_at)),
        30000,
      );
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed('');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activePunch]);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [settingsRes, punchesRes, weekRes, projectsRes] = await Promise.all([
        mobileApi<OrgSettingsResponse>('/settings/org'),
        mobileApi<PunchListResponse>(`/time-punches?date_from=${todayISO()}&date_to=${todayISO()}&limit=50`),
        mobileApi<PunchListResponse>(`/time-punches?date_from=${weekStartISO()}&date_to=${todayISO()}&limit=100`),
        mobileApi<ProjectsResponse>('/projects?status=active&limit=100'),
      ]);

      setMode(settingsRes.settings.time_tracking_mode as 'manual' | 'clock_in_out');
      setProjects(projectsRes.projects ?? []);

      const punches = punchesRes.time_punches ?? [];
      const open = punches.find((p) => p.clock_out_at === null) ?? null;
      setActivePunch(open);
      setTodayPunches(punches.filter((p) => p.clock_out_at !== null));

      const todayHrs = punches
        .filter((p) => p.hours_worked != null)
        .reduce((s, p) => s + Number(p.hours_worked), 0);
      setTodayTotal(todayHrs);

      const weekPunches = weekRes.time_punches ?? [];
      const weekHrs = weekPunches
        .filter((p) => p.hours_worked != null)
        .reduce((s, p) => s + Number(p.hours_worked), 0);
      setWeekTotal(weekHrs);

      // Per-day totals for the week grid (keyed by clock-in date).
      const byDay: Record<string, number> = {};
      for (const p of weekPunches) {
        if (p.hours_worked == null) continue;
        const dayKey = p.clock_in_at.slice(0, 10);
        byDay[dayKey] = (byDay[dayKey] ?? 0) + Number(p.hours_worked);
      }
      setWeekByDay(byDay);
    } catch (err) {
      if (!quiet) {
        Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tc]);

  useEffect(() => { void loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadData(true);
  };

  // ─── Clock In ──────────────────────────────────────────────────────────────

  const doClockIn = async (project: Project | null) => {
    setActing(true);
    try {
      const loc = await capturePunchLocation();
      await mobileApi<ClockInResponse>('/time-punches/clock-in', {
        method: 'POST',
        body: JSON.stringify({ project_id: project?.id ?? undefined, ...(loc ?? {}) }),
      });
      setSelectedProject(null);
      await loadData(true);
    } catch (err) {
      Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
    } finally {
      setActing(false);
    }
  };

  const handleClockIn = () => {
    if (projects.length === 0) {
      void doClockIn(null);
      return;
    }
    setPendingAction('clock_in');
    setShowProjectPicker(true);
  };

  // ─── Clock Out ─────────────────────────────────────────────────────────────

  const doClockOut = async (projectOverride?: Project | null) => {
    if (!activePunch) return;
    // If punch has no project and no override provided, require project
    if (!activePunch.project_id && !projectOverride) {
      setPendingAction('clock_out');
      setShowProjectPicker(true);
      return;
    }
    setActing(true);
    try {
      await mobileApi<ClockOutResponse>('/time-punches/clock-out', {
        method: 'POST',
        body: JSON.stringify({
          punch_id: activePunch.id,
          project_id: projectOverride?.id ?? undefined,
          version: activePunch.version,
        }),
      });
      setSelectedProject(null);
      await loadData(true);
    } catch (err) {
      Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
    } finally {
      setActing(false);
    }
  };

  const handleClockOut = () => {
    if (!activePunch?.project_id) {
      // Need project selection before clock-out
      setPendingAction('clock_out');
      setShowProjectPicker(true);
      return;
    }
    Alert.alert(
      t('time_punches.clock_out'),
      activePunch.project_id
        ? `Clock out of ${projects.find((p) => p.id === activePunch.project_id)?.name ?? 'current project'}?`
        : t('time_punches.clock_out'),
      [
        { text: tc('cancel'), style: 'cancel' },
        { text: t('time_punches.clock_out'), style: 'destructive', onPress: () => void doClockOut() },
      ],
    );
  };

  // ─── Switch Project ────────────────────────────────────────────────────────

  const doSwitchProject = async (newProject: Project) => {
    if (!activePunch) return;
    setActing(true);
    try {
      // Clock out of current punch
      await mobileApi<ClockOutResponse>('/time-punches/clock-out', {
        method: 'POST',
        body: JSON.stringify({ punch_id: activePunch.id, version: activePunch.version }),
      });
      // Clock in to new project
      const loc = await capturePunchLocation();
      await mobileApi<ClockInResponse>('/time-punches/clock-in', {
        method: 'POST',
        body: JSON.stringify({ project_id: newProject.id, ...(loc ?? {}) }),
      });
      setSelectedProject(null);
      await loadData(true);
    } catch (err) {
      Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
    } finally {
      setActing(false);
    }
  };

  // ─── Project picker confirm ────────────────────────────────────────────────

  const confirmProjectSelection = (project: Project) => {
    setShowProjectPicker(false);
    if (pendingAction === 'clock_in') {
      void doClockIn(project);
    } else if (pendingAction === 'clock_out') {
      void doClockOut(project);
    } else if (pendingAction === 'switch') {
      void doSwitchProject(project);
    }
    setPendingAction(null);
  };

  const activeProjectName = activePunch?.project_id
    ? projects.find((p) => p.id === activePunch.project_id)?.name ?? '—'
    : null;

  // ─── Project picker modal ──────────────────────────────────────────────────

  if (showProjectPicker) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={[styles.pickerHeader, { backgroundColor: palette.headerBg }]}>
          <Text style={[styles.pickerTitle, { color: palette.headerText }]}>{t('time_punches.select_project')}</Text>
          <TouchableOpacity onPress={() => { setShowProjectPicker(false); setPendingAction(null); }}>
            <Text style={[styles.cancelLink, { color: palette.headerText }]}>{tc('cancel')}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.projectRow, { backgroundColor: palette.surface }]} onPress={() => confirmProjectSelection(item)}>
              <Text style={[styles.projectName, { color: palette.text }]}>{item.name}</Text>
              <Text style={[styles.projectChevron, { color: palette.textMuted }]}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: palette.border }]} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: palette.textMuted }]}>{t('time_punches.no_active_projects')}</Text>
          }
          contentContainerStyle={styles.pickerList}
        />
        {pendingAction === 'clock_out' && (
          <TouchableOpacity style={[styles.skipButton, { backgroundColor: palette.surfaceAlt, borderTopColor: palette.border }]} onPress={() => {
            setShowProjectPicker(false);
            if (pendingAction === 'clock_out') void doClockOut(null);
            setPendingAction(null);
          }}>
            <Text style={[styles.skipText, { color: palette.textMuted }]}>{t('time_punches.clock_out_without_project')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  // ─── Manual mode redirect ──────────────────────────────────────────────────

  if (mode === 'manual') {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <Text style={[styles.modeTitle, { color: palette.text }]}>{t('time_punches.manual_mode_title')}</Text>
        <Text style={[styles.modeSubtitle, { color: palette.textMuted }]}>{t('time_punches.manual_mode_body')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: palette.accent }]}>← {tc('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main clock view ───────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Status card ── */}
      <View style={[
        styles.statusCard,
        { backgroundColor: palette.surface, borderColor: activePunch ? STATUS.success.fg : palette.border },
      ]}>
        {activePunch ? (
          <>
            <View style={styles.statusRow}>
              <View style={[styles.activeDot, { backgroundColor: STATUS.success.fg }]} />
              <Text style={[styles.statusLabel, { color: STATUS.success.fg }]}>{t('time_hub.clocked_in')}</Text>
            </View>
            {activeProjectName && (
              <Text style={[styles.projectLabel, { color: palette.text }]}>{activeProjectName}</Text>
            )}
            <Text style={[styles.elapsedText, { color: palette.textMuted }]}>
              {t('time_punches.clocked_in_since', {
                time: formatTime(activePunch.clock_in_at),
                duration: elapsed,
              })}
            </Text>

            {acting ? (
              <ActivityIndicator style={styles.buttonSpinner} color={palette.accent} />
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.switchButton, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                  onPress={() => { setPendingAction('switch'); setShowProjectPicker(true); }}
                  disabled={acting}
                >
                  <Text style={[styles.switchButtonText, { color: palette.text }]}>{t('time_punches.switch_project')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.clockOutButton, { backgroundColor: STATUS.danger.fg }]}
                  onPress={handleClockOut}
                  disabled={acting}
                >
                  <Text style={styles.clockOutText}>{t('time_punches.clock_out')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.idleLabel, { color: palette.textMuted }]}>{t('time_punches.not_clocked_in')}</Text>
            {acting ? (
              <ActivityIndicator style={styles.buttonSpinner} color={palette.accent} />
            ) : (
              <TouchableOpacity style={[styles.clockInButton, { backgroundColor: palette.accent }]} onPress={handleClockIn} disabled={acting}>
                <Text style={styles.clockInText}>{t('time_punches.clock_in')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* ── Today total ── */}
      {(todayPunches.length > 0 || activePunch) && (
        <Text style={[styles.todayTotal, { color: palette.textMuted }]}>
          {t('time_punches.today_total', { hours: todayTotal.toFixed(2) })}
        </Text>
      )}

      {/* ── Today punch list ── */}
      {(todayPunches.length > 0) && (
        <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('time_punches.punch_history_today')}</Text>
          {todayPunches.map((p) => {
            const proj = projects.find((pr) => pr.id === p.project_id);
            return (
              <View key={p.id} style={[styles.punchRow, { borderTopColor: palette.border }]}>
                <View style={styles.punchInfo}>
                  <Text style={[styles.punchProject, { color: palette.text }]}>{proj?.name ?? '—'}</Text>
                  <Text style={[styles.punchTimes, { color: palette.textMuted }]}>
                    {formatTime(p.clock_in_at)} — {p.clock_out_at ? formatTime(p.clock_out_at) : '…'}
                    {p.auto_clocked_out ? '  (auto)' : ''}
                  </Text>
                </View>
                <Text style={[styles.punchHours, { color: palette.text }]}>
                  {Number(p.hours_worked ?? 0).toFixed(2)}h
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Week summary ── */}
      <View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.weekHeader}>
          <Text style={[styles.sectionTitle, { color: palette.textMuted }]}>{t('time_punches.this_week')}</Text>
          <Text style={[styles.weekTotal, { color: palette.text }]}>
            {t('time_punches.week_total', { hours: weekTotal.toFixed(1) })}
          </Text>
        </View>
        <View style={styles.weekGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay() + i);
            const key = d.toISOString().slice(0, 10);
            const isToday = key === todayISO();
            const dayHrs = weekByDay[key] ?? 0;
            return (
              <View key={`${day}-${i}`} style={[styles.dayCell, isToday && { backgroundColor: palette.surfaceAlt }]}>
                <Text style={[styles.dayLabel, { color: isToday ? palette.accent : palette.textMuted }]}>{day}</Text>
                <Text style={[styles.dayHours, { color: isToday ? palette.accent : palette.textMuted, fontWeight: isToday ? '600' : '400' }]}>
                  {dayHrs > 0 ? `${dayHrs.toFixed(1)}h` : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Status card
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  activeDot: { width: 10, height: 10, borderRadius: 5, marginEnd: 8 },
  statusLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  projectLabel: { fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 2 },
  elapsedText: { fontSize: 13, marginBottom: 16 },
  idleLabel: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  buttonSpinner: { marginTop: 12 },

  actionRow: { flexDirection: 'row', gap: 10 },
  switchButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchButtonText: { fontSize: 14, fontWeight: '600' },
  clockOutButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clockOutText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  clockInButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clockInText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  todayTotal: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 8,
  },

  // Sections
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },

  // Punch rows
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  punchInfo: { flex: 1 },
  punchProject: { fontSize: 14, fontWeight: '500' },
  punchTimes: { fontSize: 12, marginTop: 2 },
  punchHours: { fontSize: 14, fontWeight: '600' },

  // Week grid
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weekTotal: { fontSize: 13, fontWeight: '600' },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', flex: 1, paddingVertical: 6, borderRadius: 8 },
  dayLabel: { fontSize: 11, fontWeight: '500' },
  dayHours: { fontSize: 12, marginTop: 4 },

  // Project picker
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
  },
  pickerTitle: { fontSize: 17, fontWeight: '600' },
  cancelLink: { fontSize: 15 },
  pickerList: { paddingHorizontal: 0 },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  projectName: { fontSize: 16 },
  projectChevron: { fontSize: 20 },
  separator: { height: 1 },
  emptyText: { textAlign: 'center', padding: 32 },
  skipButton: { padding: 16, alignItems: 'center', borderTopWidth: 1 },
  skipText: { fontSize: 14 },

  // Manual mode
  modeTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  modeSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  backButton: { marginTop: 24, padding: 12 },
  backButtonText: { fontSize: 14 },
});
