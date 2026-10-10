// screens/StructuralScreen.tsx — Roofing / Concrete / Framing field view (read-only).
// Tabbed, API-only, mirrors TradeScreen. Field crews view structural/envelope trade work
// that is inspected under the building permit. Locked decisions: A-13 (i18n), T-09.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { mobileApi, ApiError } from '../lib/api';
import { database } from '@/lib/database';
import { pullAll } from '@/lib/sync';
import type { ConcretePour as ConcretePourModel } from '@/models/ConcretePour';
import type { RoofingSystem as RoofingSystemModel } from '@/models/RoofingSystem';
import type { FramingInspection as FramingInspectionModel } from '@/models/FramingInspection';
import { enqueueStatusUpdate } from '../lib/status-queue';
import { useCurrentUser } from '../lib/user-context';
import { hasRole } from '../lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

const ROOFING_STATUSES = ['planned', 'tear_off', 'decking', 'underlayment', 'installed', 'inspected', 'complete'] as const;
const CONCRETE_STATUSES = ['planned', 'in_progress', 'complete', 'failed'] as const;
const FRAMING_STATUSES = ['pending', 'passed', 'failed', 'requires_correction'] as const;

type StructuralRouteProp = RouteProp<RootStackParamList, 'Structural'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface RoofingSystem {
  id: string;
  roof_type: string;
  manufacturer: string | null;
  product_line: string | null;
  total_squares: number | null;
  status: string;
  version: number;
}
interface ConcretePour {
  id: string;
  pour_type: string;
  pour_date: string | null;
  volume_cy: number | null;
  slump_inches: number | null;
  status: string;
  version: number;
}
interface FramingInspection {
  id: string;
  section: string;
  inspection_date: string | null;
  inspector_name: string | null;
  status: string;
  version: number;
}

// Trade-progress statuses → semantic tone (canonical STATUS colors; no literal hex).
const ROOFING_TONE: Record<string, StatusTone> = {
  planned: 'neutral', tear_off: 'warning', decking: 'warning', underlayment: 'info',
  installed: 'info', inspected: 'action', complete: 'success',
};
const CONCRETE_TONE: Record<string, StatusTone> = {
  planned: 'neutral', in_progress: 'warning', complete: 'success', failed: 'danger',
};
const FRAMING_TONE: Record<string, StatusTone> = {
  pending: 'warning', passed: 'success', failed: 'danger', requires_correction: 'action',
};

function toneColor(map: Record<string, StatusTone>, status: string): string {
  return STATUS[map[status] ?? 'neutral'].fg;
}

type Tab = 'roofing' | 'concrete' | 'framing';

export function StructuralScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<StructuralRouteProp>();
  const { projectId } = route.params;
  const { t } = useTranslation('structural');
  const { t: tc } = useTranslation('common');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canEdit = hasRole(role, ['owner', 'project_manager', 'foreman']);

  const [tab, setTab] = useState<Tab>('roofing');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [roofing, setRoofing] = useState<RoofingSystem[]>([]);
  const [concrete, setConcrete] = useState<ConcretePour[]>([]);
  const [framing, setFraming] = useState<FramingInspection[]>([]);

  // Concrete renders from the LOCAL cache. Caching the pours without pointing the screen
  // at them left this tab empty offline — and the QA-test capture is only reachable
  // through a pour card, so the whole offline path was dead behind a working cache.
  // (Same shape as the asset yard: the capture existed, the way in didn't.)
  useEffect(() => {
    const sub = database.collections
      .get<ConcretePourModel>('concrete_pours')
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'pour_type', 'pour_date', 'volume_cy'])
      .subscribe((rows) => {
        setConcrete(rows.map((r) => ({
          id: r.server_id,
          pour_type: r.pour_type,
          pour_date: r.pour_date,
          volume_cy: r.volume_cy,
          slump_inches: null,   // not cached — the QA test record is the field's source for this
          status: r.status,
          version: r.version,
        })));
      });
    return () => sub.unsubscribe();
  }, [projectId]);

  useEffect(() => {
    const sub = database.collections
      .get<RoofingSystemModel>('roofing_systems')
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'roof_type', 'total_squares', 'manufacturer'])
      .subscribe((rows) => {
        setRoofing(rows.map((r) => ({
          id: r.server_id, roof_type: r.roof_type, manufacturer: r.manufacturer,
          product_line: null, total_squares: r.total_squares, status: r.status, version: r.version,
        })));
      });
    return () => sub.unsubscribe();
  }, [projectId]);

  useEffect(() => {
    const sub = database.collections
      .get<FramingInspectionModel>('framing_inspections')
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'section', 'inspection_date', 'inspector_name'])
      .subscribe((rows) => {
        setFraming(rows.map((r) => ({
          id: r.server_id, section: r.section, inspection_date: r.inspection_date,
          inspector_name: r.inspector_name, status: r.status, version: r.version,
        })));
      });
    return () => sub.unsubscribe();
  }, [projectId]);

  // All three tabs render from the local cache now, so one batched pull refreshes the
  // whole screen — and none of them is dead with no signal.
  const load = useCallback(async () => { await pullAll(); }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  // ── Status write (OWNER/PM/FOREMAN; optimistic-locked, 409 → reload) ───────
  const changeStatus = useCallback((opts: {
    label: string; current: string; statuses: readonly string[];
    endpoint: string; resKey: string; id: string; version: number;
    labelFor: (s: string) => string;
    setLocal: (status: string, version: number) => void;
  }) => {
    if (!canEdit) return;
    Alert.alert(tc('update_status'), opts.label, [
      ...opts.statuses.filter((s) => s !== opts.current).map((s) => ({
        text: opts.labelFor(s),
        onPress: async () => {
          try {
            const res = await mobileApi<Record<string, { status: string; version: number }>>(
              `${opts.endpoint}/${opts.id}`,
              { method: 'PATCH', body: JSON.stringify({ status: s, version: opts.version }) },
            );
            const row = res[opts.resKey];
            opts.setLocal(row.status, row.version);
          } catch (err) {
            if (err instanceof ApiError) {
              if (err.status === 409) { Alert.alert('', tc('version_conflict')); await load(); }
              else Alert.alert(tc('update_failed'), err.message);
            } else {
              // Offline — queue the PATCH + update locally; flushes on reconnect.
              await enqueueStatusUpdate({ endpoint: opts.endpoint, id: opts.id, status: s, version: opts.version });
              opts.setLocal(s, opts.version);
              Alert.alert('', tc('saved_offline'));
            }
          }
        },
      })),
      { text: tc('cancel'), style: 'cancel' as const },
    ]);
  }, [canEdit, tc, load]);

  const TabButton = ({ value, label }: { value: Tab; label: string }) => (
    <TouchableOpacity
      onPress={() => setTab(value)}
      style={[styles.tab, tab === value && { borderBottomWidth: 2, borderBottomColor: palette.accent }]}
      accessibilityRole="button"
    >
      <Text variant="body" color={tab === value ? palette.accent : palette.textMuted}>{label}</Text>
    </TouchableOpacity>
  );

  const Dot = ({ color }: { color: string }) => <View style={[styles.dot, { backgroundColor: color }]} />;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.tabBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TabButton value="roofing" label={t('roofing')} />
        <TabButton value="concrete" label={t('concrete')} />
        <TabButton value="framing" label={t('framing')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === 'roofing' && (
          roofing.length === 0 ? <EmptyState icon="🏠" title={t('none')} /> :
          roofing.map((r) => (
            <Card
              key={r.id}
              style={styles.card}
              onPress={canEdit ? () => changeStatus({
                label: t(`roof_${r.roof_type}`), current: r.status, statuses: ROOFING_STATUSES,
                endpoint: '/roofing-systems', resKey: 'roofing_system', id: r.id, version: r.version,
                labelFor: (s) => t(`rstatus_${s}`),
                setLocal: (status, version) => setRoofing((prev) => prev.map((x) => x.id === r.id ? { ...x, status, version } : x)),
              }) : undefined}
            >
              <View style={styles.cardHeader}>
                <Text variant="subheading" style={styles.cardTitle}>{t(`roof_${r.roof_type}`)}</Text>
                <Dot color={toneColor(ROOFING_TONE, r.status)} />
                {canEdit && <Text variant="caption" color={palette.accent}>✎</Text>}
              </View>
              <Text variant="caption" muted style={styles.cardMeta}>
                {[r.manufacturer, r.product_line].filter(Boolean).join(' ') || '—'}
                {r.total_squares != null ? `  ·  ${r.total_squares} sq` : ''}
              </Text>
              <Text variant="micro" style={styles.cardStatus}>{t(`rstatus_${r.status}`)}</Text>
              <TouchableOpacity
                style={styles.qaLink}
                onPress={() => navigation.navigate('RoofingQa', { systemId: r.id, systemLabel: t(`roof_${r.roof_type}`) })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="caption" color={palette.accent}>{t('qa_checks')} ›</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        {tab === 'concrete' && (
          concrete.length === 0 ? <EmptyState icon="🧱" title={t('none')} /> :
          concrete.map((c) => (
            <Card
              key={c.id}
              style={styles.card}
              onPress={canEdit ? () => changeStatus({
                label: t(`pour_${c.pour_type}`), current: c.status, statuses: CONCRETE_STATUSES,
                endpoint: '/concrete-pours', resKey: 'concrete_pour', id: c.id, version: c.version,
                labelFor: (s) => t(`cstatus_${s}`),
                setLocal: (status, version) => setConcrete((prev) => prev.map((x) => x.id === c.id ? { ...x, status, version } : x)),
              }) : undefined}
            >
              <View style={styles.cardHeader}>
                <Text variant="subheading" style={styles.cardTitle}>{t(`pour_${c.pour_type}`)}</Text>
                <Dot color={toneColor(CONCRETE_TONE, c.status)} />
                {canEdit && <Text variant="caption" color={palette.accent}>✎</Text>}
              </View>
              <Text variant="caption" muted style={styles.cardMeta}>
                {c.pour_date ?? '—'}
                {c.volume_cy != null ? `  ·  ${c.volume_cy} CY` : ''}
                {c.slump_inches != null ? `  ·  ${c.slump_inches}" slump` : ''}
              </Text>
              <Text variant="micro" style={styles.cardStatus}>{t(`cstatus_${c.status}`)}</Text>
              {/* The QA tests are the field's frequent action here — slump/air/temp are
                  taken while the truck is on site — so give them their own target rather
                  than burying them behind the status editor. */}
              <TouchableOpacity
                style={styles.qaLink}
                onPress={() => navigation.navigate('ConcreteTests', { pourId: c.id, pourLabel: t(`pour_${c.pour_type}`) })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="caption" color={palette.accent}>{t('qa_tests')} ›</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        {tab === 'framing' && (
          framing.length === 0 ? <EmptyState icon="🪵" title={t('none')} /> :
          framing.map((f) => (
            <Card
              key={f.id}
              style={styles.card}
              onPress={canEdit ? () => changeStatus({
                label: t(`section_${f.section}`), current: f.status, statuses: FRAMING_STATUSES,
                endpoint: '/framing-inspections', resKey: 'framing_inspection', id: f.id, version: f.version,
                labelFor: (s) => t(`fstatus_${s}`),
                setLocal: (status, version) => setFraming((prev) => prev.map((x) => x.id === f.id ? { ...x, status, version } : x)),
              }) : undefined}
            >
              <View style={styles.cardHeader}>
                <Text variant="subheading" style={styles.cardTitle}>{t(`section_${f.section}`)}</Text>
                <Dot color={toneColor(FRAMING_TONE, f.status)} />
                {canEdit && <Text variant="caption" color={palette.accent}>✎</Text>}
              </View>
              <Text variant="caption" muted style={styles.cardMeta}>
                {f.inspection_date ?? '—'}
                {f.inspector_name ? `  ·  ${f.inspector_name}` : ''}
              </Text>
              <Text variant="micro" style={styles.cardStatus}>{t(`fstatus_${f.status}`)}</Text>
              <TouchableOpacity
                style={styles.qaLink}
                onPress={() => navigation.navigate('FramingCorrections', { inspectionId: f.id, inspectionLabel: t(`section_${f.section}`) })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="caption" color={palette.accent}>{t('corrections')} ›</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  cardTitle: { flex: 1, paddingRight: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  cardMeta: { marginTop: 6 },
  qaLink: { marginTop: 10, alignSelf: 'flex-start' },
  cardStatus: { marginTop: 4 },
});
