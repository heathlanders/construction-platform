// screens/TaskListScreen.tsx — project schedule tasks, grouped by phase (API-only read).
// Tap a task → TaskDetail (codes + QA photos + edit). Mirrors PermitListScreen.
// Locked decisions: A-13 (i18n), T-09.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mobileApi } from '../lib/api';
import { useTheme } from '@/lib/theme-context';
import { statusColor } from '@/lib/theme';
import { Screen, Card, Text, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RouteP = RouteProp<RootStackParamList, 'Tasks'>;
type NavP = NativeStackNavigationProp<RootStackParamList, 'Tasks'>;

export interface ScheduleTask {
  id: string;
  title: string;
  status: string;
  percent_complete: number;
  trade_type: string | null;
  phase: string | null;
}

const PHASE_ORDER = [
  'site_prep', 'foundation', 'framing', 'roofing', 'rough_in', 'inspections',
  'insulation', 'drywall', 'finishes_interior', 'finishes_exterior', 'sitework', 'commissioning', 'punch',
];

export function TaskListScreen(): React.ReactElement {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { projectId } = route.params;
  const { t } = useTranslation('tasks');
  const { palette } = useTheme();

  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await mobileApi<{ schedule_tasks: ScheduleTask[] }>(`/schedule-tasks?project_id=${projectId}&limit=200`);
      setTasks(data.schedule_tasks ?? []);
    } catch { /* offline */ }
  }, [projectId]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }, [load]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  // Group by phase, ordered.
  const byPhase = new Map<string, ScheduleTask[]>();
  for (const task of tasks) {
    const p = task.phase && PHASE_ORDER.includes(task.phase) ? task.phase : 'unassigned';
    const list = byPhase.get(p) ?? [];
    list.push(task);
    byPhase.set(p, list);
  }
  const phases = [...PHASE_ORDER, 'unassigned'].filter((p) => byPhase.has(p));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {tasks.length === 0 ? (
        <EmptyState icon="🗒️" title={t('no_tasks', { defaultValue: 'No tasks yet.' })} />
      ) : (
        phases.map((phase) => (
          <View key={phase} style={styles.phaseGroup}>
            <Text variant="label" muted style={styles.phaseLabel}>
              {t(`phase_${phase}`, { defaultValue: phase.replace(/_/g, ' ') })}
            </Text>
            {byPhase.get(phase)!.map((task) => (
              <Card
                key={task.id}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id, taskTitle: task.title })}
                style={styles.taskCard}
              >
                <View style={[styles.statusDot, { backgroundColor: statusColor(task.status).fg }]} />
                <View style={styles.taskBody}>
                  <Text variant="subheading">{task.title}</Text>
                  <Text variant="caption" muted style={styles.taskMeta}>
                    {(task.trade_type ?? 'general')} · {task.percent_complete}%
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  phaseGroup: { marginBottom: 18 },
  phaseLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  taskBody: { flex: 1 },
  taskMeta: { marginTop: 2, textTransform: 'capitalize' },
});
