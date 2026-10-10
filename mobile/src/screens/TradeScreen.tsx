// screens/TradeScreen.tsx — Electrical panels/circuits + plumbing systems/fixtures
// Read-only view for field techs; creates available for foreman/owner
// Locked decisions: A-13 (i18n), T-09

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
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { pullAll, runSyncSweep } from '@/lib/sync';
import type { ElectricalPanel as PanelModel } from '@/models/ElectricalPanel';
import type { ElectricalCircuit as CircuitModel } from '@/models/ElectricalCircuit';
import type { PlumbingSystem as SystemModel } from '@/models/PlumbingSystem';
import type { PlumbingFixture as FixtureModel } from '@/models/PlumbingFixture';
import { useCurrentUser } from '../lib/user-context';
import { hasRole } from '../lib/tileManifest';
import { useTheme } from '@/lib/theme-context';
import { statusColor } from '@/lib/theme';
import { Text, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

const CIRCUIT_STATUSES = ['planned', 'roughed_in', 'complete'] as const;
const FIXTURE_STATUSES = ['planned', 'rough_in', 'trimmed', 'complete'] as const;

type TradeRouteProp = RouteProp<RootStackParamList, 'Trade'>;

interface ElectricalPanel {
  id: string;
  name: string;
  amperage: number | null;
  voltage: number | null;
  location: string | null;
}

interface ElectricalCircuit {
  /** WatermelonDB row id — used for local writes, never sent to the API. */
  local_id: string;
  /** Captured offline / not yet accepted by the server. */
  pending: boolean;
  id: string;
  panel_id: string;
  circuit_number: number;
  description: string | null;
  amperage: number | null;
  status: string;
  version: number;
}

interface PlumbingSystem {
  id: string;
  name: string;
  // Nullable now that these come from the cache — the column is nullable server-side,
  // and `notes` isn't rendered on this screen so it isn't cached at all.
  system_type: string | null;
  version: number;
}

interface PlumbingFixture {
  local_id: string;
  pending: boolean;
  id: string;
  system_id: string;
  fixture_type: string | null;
  location: string | null;
  status: string;
  version: number;
}

export function TradeScreen(): React.ReactElement {
  const route = useRoute<TradeRouteProp>();
  const { projectId } = route.params;
  const { t: te } = useTranslation('trade-electrical');
  const { t: tp } = useTranslation('trade-plumbing');
  const { t: tc } = useTranslation('common');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canEdit = hasRole(role, ['owner', 'project_manager', 'foreman']);

  const [tab, setTab] = useState<'electrical' | 'plumbing'>('electrical');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [panels, setPanels] = useState<ElectricalPanel[]>([]);
  const [circuits, setCircuits] = useState<ElectricalCircuit[]>([]);
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const [systems, setSystems] = useState<PlumbingSystem[]>([]);
  const [fixtures, setFixtures] = useState<PlumbingFixture[]>([]);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  // Both tabs render from the local cache (schema v9). They were API-only, so the whole
  // screen was blank in a house with no signal — which is where an electrician stands.
  // `local_id` is carried so a status flip can write to WatermelonDB by row id.
  useEffect(() => {
    const subs = [
      database.collections.get<PanelModel>('electrical_panels')
        .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
        .observeWithColumns(['name', 'amperage', 'voltage', 'location'])
        .subscribe((rows) => setPanels(rows.map((r) => ({
          id: r.server_id, name: r.name, amperage: r.amperage, voltage: r.voltage,
          location: r.location, version: r.version,
        })))),
      database.collections.get<CircuitModel>('electrical_circuits')
        .query(Q.where('is_deleted', false))
        .observeWithColumns(['status', 'description', 'amperage', 'sync_status'])
        .subscribe((rows) => setCircuits(rows.map((r) => ({
          id: r.server_id, local_id: r.id, pending: r.sync_status !== 'synced',
          panel_id: r.panel_id, circuit_number: r.circuit_number, description: r.description,
          amperage: r.amperage, status: r.status, version: r.version,
        })))),
      database.collections.get<SystemModel>('plumbing_systems')
        .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
        .observeWithColumns(['name', 'system_type'])
        .subscribe((rows) => setSystems(rows.map((r) => ({
          id: r.server_id, name: r.name, system_type: r.system_type, version: r.version,
        })))),
      database.collections.get<FixtureModel>('plumbing_fixtures')
        .query(Q.where('is_deleted', false))
        .observeWithColumns(['status', 'location', 'fixture_type', 'sync_status'])
        .subscribe((rows) => setFixtures(rows.map((r) => ({
          id: r.server_id, local_id: r.id, pending: r.sync_status !== 'synced',
          system_id: r.system_id, fixture_type: r.fixture_type, location: r.location,
          status: r.status, version: r.version,
        })))),
    ];
    setLoading(false);
    return () => subs.forEach((x) => x.unsubscribe());
  }, [projectId]);

  const loadAll = useCallback(async () => { await pullAll(); }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  // ── Status writes (OWNER/PM/FOREMAN; optimistic-locked, 409 → reload) ──────
  // Writes to WatermelonDB and lets the batch push carry it. Previously this PATCHed
  // directly and fell back to the upload queue — where a 409 counts as a server verdict
  // and the edit is DROPPED. On the sync path the same 409 becomes a resolvable conflict.
  const patchCircuit = useCallback(async (c: ElectricalCircuit, status: string) => {
    try {
      await database.write(async () => {
        const row = await database.get<CircuitModel>('electrical_circuits').find(c.local_id);
        await row.update((r) => { r.status = status; r.sync_status = 'pending'; });
      });
      void runSyncSweep();
    } catch {
      Alert.alert(tc('update_failed'), '');
    }
  }, [tc]);

  const changeCircuit = useCallback((c: ElectricalCircuit) => {
    if (!canEdit) return;
    Alert.alert(tc('update_status'), `#${c.circuit_number}`, [
      ...CIRCUIT_STATUSES.filter((s) => s !== c.status).map((s) => ({
        text: te(`electrical.circuit_status.${s}`), onPress: () => void patchCircuit(c, s),
      })),
      { text: tc('cancel'), style: 'cancel' as const },
    ]);
  }, [canEdit, tc, te, patchCircuit]);

  const patchFixture = useCallback(async (f: PlumbingFixture, status: string) => {
    try {
      await database.write(async () => {
        const row = await database.get<FixtureModel>('plumbing_fixtures').find(f.local_id);
        await row.update((r) => { r.status = status; r.sync_status = 'pending'; });
      });
      void runSyncSweep();
    } catch {
      Alert.alert(tc('update_failed'), '');
    }
  }, [tc]);

  const changeFixture = useCallback((f: PlumbingFixture) => {
    if (!canEdit) return;
    Alert.alert(tc('update_status'), f.fixture_type ?? '', [
      ...FIXTURE_STATUSES.filter((s) => s !== f.status).map((s) => ({
        text: tp(`plumbing.fixture_status.${s}`), onPress: () => void patchFixture(f, s),
      })),
      { text: tc('cancel'), style: 'cancel' as const },
    ]);
  }, [canEdit, tc, tp, patchFixture]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const cardStyle = { backgroundColor: palette.surface, borderColor: palette.border };

  const renderElectrical = () => (
    <View>
      {panels.length === 0 ? (
        <EmptyState icon="⚡" title={te('electrical.no_panels')} />
      ) : (
        panels.map(panel => {
          const panelCircuits = circuits.filter(c => c.panel_id === panel.id);
          const isExpanded = expandedPanel === panel.id;
          return (
            <View key={panel.id} style={[styles.card, cardStyle]}>
              <TouchableOpacity
                onPress={() => setExpandedPanel(isExpanded ? null : panel.id)}
                style={styles.cardHeader}
                accessibilityRole="button"
              >
                <View style={styles.cardHeaderLeft}>
                  <Text variant="subheading">{panel.name}</Text>
                  <Text variant="caption" muted style={styles.cardSubtitle}>
                    {panel.amperage ? `${panel.amperage}A` : '—'}
                    {panel.voltage ? ` / ${panel.voltage}V` : ''}
                    {panel.location ? ` · ${panel.location}` : ''}
                  </Text>
                </View>
                <Text variant="caption" muted style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.circuitsContainer, { borderTopColor: palette.border }]}>
                  <Text variant="label" muted style={styles.subSectionTitle}>
                    {te('electrical.circuits_title')} ({panelCircuits.length})
                  </Text>
                  {panelCircuits.length === 0 ? (
                    <Text variant="caption" muted style={styles.emptySmall}>{te('electrical.no_circuits')}</Text>
                  ) : (
                    panelCircuits.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.circuitRow, { borderTopColor: palette.border }]}
                        onPress={() => changeCircuit(c)}
                        disabled={!canEdit}
                        activeOpacity={canEdit ? 0.6 : 1}
                      >
                        <Text variant="caption" style={styles.circuitNumber}>#{c.circuit_number}</Text>
                        <Text variant="caption" muted style={styles.circuitDesc} numberOfLines={1}>
                          {c.description ?? '—'}
                          {c.amperage ? ` (${c.amperage}A)` : ''}
                        </Text>
                        <View style={[styles.statusDot, { backgroundColor: statusColor(c.status).fg }]} />
                        <Text variant="micro" muted style={styles.circuitStatus}>
                          {te(`electrical.circuit_status.${c.status}`)}
                        </Text>
                        {canEdit && <Text variant="caption" color={palette.accent} style={styles.editMark}>✎</Text>}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  const renderPlumbing = () => (
    <View>
      {systems.length === 0 ? (
        <EmptyState icon="🚿" title={tp('plumbing.no_systems')} />
      ) : (
        systems.map(sys => {
          const sysFixtures = fixtures.filter(f => f.system_id === sys.id);
          const isExpanded = expandedSystem === sys.id;
          return (
            <View key={sys.id} style={[styles.card, cardStyle]}>
              <TouchableOpacity
                onPress={() => setExpandedSystem(isExpanded ? null : sys.id)}
                style={styles.cardHeader}
                accessibilityRole="button"
              >
                <View style={styles.cardHeaderLeft}>
                  <Text variant="subheading">{sys.name}</Text>
                  <Text variant="caption" muted style={styles.cardSubtitle}>
                    {tp(`plumbing.system_types.${sys.system_type}`)}
                  </Text>
                </View>
                <Text variant="caption" muted style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.circuitsContainer, { borderTopColor: palette.border }]}>
                  <Text variant="label" muted style={styles.subSectionTitle}>
                    {tp('plumbing.fixtures_title')} ({sysFixtures.length})
                  </Text>
                  {sysFixtures.length === 0 ? (
                    <Text variant="caption" muted style={styles.emptySmall}>{tp('plumbing.no_fixtures')}</Text>
                  ) : (
                    sysFixtures.map(f => (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.circuitRow, { borderTopColor: palette.border }]}
                        onPress={() => changeFixture(f)}
                        disabled={!canEdit}
                        activeOpacity={canEdit ? 0.6 : 1}
                      >
                        <Text variant="caption" muted style={styles.circuitDesc} numberOfLines={1}>
                          {f.fixture_type}
                          {f.location ? ` · ${f.location}` : ''}
                        </Text>
                        <View style={[styles.statusDot, { backgroundColor: statusColor(f.status).fg }]} />
                        <Text variant="micro" muted style={styles.circuitStatus}>
                          {tp(`plumbing.fixture_status.${f.status}`)}
                        </Text>
                        {canEdit && <Text variant="caption" color={palette.accent} style={styles.editMark}>✎</Text>}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'electrical' && { borderBottomColor: palette.accent }]}
          onPress={() => setTab('electrical')}
        >
          <Text variant="body" color={tab === 'electrical' ? palette.accent : palette.textMuted}>
            {te('electrical.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'plumbing' && { borderBottomColor: palette.accent }]}
          onPress={() => setTab('plumbing')}
        >
          <Text variant="body" color={tab === 'plumbing' ? palette.accent : palette.textMuted}>
            {tp('plumbing.title')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {tab === 'electrical' ? renderElectrical() : renderPlumbing()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  content: { padding: 16 },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardHeaderLeft: { flex: 1 },
  cardSubtitle: { marginTop: 2 },
  chevron: { marginStart: 8 },
  circuitsContainer: {
    borderTopWidth: 1,
    padding: 14,
    paddingTop: 10,
  },
  subSectionTitle: {
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  circuitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 8,
  },
  circuitNumber: { width: 32 },
  circuitDesc: { flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  circuitStatus: { width: 80, textAlign: 'right' },
  editMark: { marginStart: 6 },
  emptySmall: { paddingVertical: 8 },
});
