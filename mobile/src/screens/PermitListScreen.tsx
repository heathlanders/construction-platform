// screens/PermitListScreen.tsx — Trade-aware AHJ permit list for a project.
// Read-only list; tap a permit to view its inspection milestones (PermitDetailScreen).
// API-only (online), mirrors TradeScreen. Locked decisions: A-13 (i18n), T-09.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { pullAll } from '@/lib/sync';
import type { Permit as PermitModel } from '@/models/Permit';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, Badge, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

type PermitsRouteProp = RouteProp<RootStackParamList, 'Permits'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface Permit {
  id: string;
  permit_type: string;
  permit_number: string | null;
  building_type: string;
  code_type: string | null;
  code_edition: string | null;
  nec_edition: string | null;
  status: string;
  ahj_name: string | null;
  ahj_level: string | null;
  ahj_phone: string | null;
  jurisdiction_notes: string | null;
  applied_date: string | null;
}

// Permit lifecycle status → semantic tone (canonical STATUS colors; no literal hex).
const PERMIT_STATUS_TONE: Record<string, StatusTone> = {
  draft: 'neutral',
  submitted: 'info',
  approved: 'success',
  active: 'success',
  failed_inspection: 'danger',
  closed: 'action',
  voided: 'neutral',
};

// Trade colors are literal by design (mirror the web rule).
const PERMIT_TYPE_COLORS: Record<string, string> = {
  electrical: '#B45309',
  plumbing:   '#0369A1',
  mechanical: '#0F766E',
  building:   '#57534E',
};

export function permitCodeLabel(p: Permit): string {
  if (p.code_type && p.code_edition) return `${p.code_type} ${p.code_edition}`;
  if (p.nec_edition) return `NEC ${p.nec_edition}`;
  return '—';
}

export function PermitListScreen(): React.ReactElement {
  const route = useRoute<PermitsRouteProp>();
  const navigation = useNavigation<Nav>();
  const { projectId } = route.params;
  const { t } = useTranslation('permits');
  const { palette } = useTheme();

  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Renders from the local cache (schema v6), so the permit list is there at the site
  // with no signal. observeWithColumns, not observe() — a pulled status change has to
  // reach the screen (a bare .observe() is silent on field edits).
  useEffect(() => {
    const sub = database.collections
      .get<PermitModel>('permits')
      .query(Q.where('project_id', projectId), Q.where('is_deleted', false))
      .observeWithColumns(['status', 'permit_number', 'code_type', 'code_edition', 'nec_edition', 'applied_date'])
      .subscribe((rows) => {
        setPermits(rows.map((r) => ({
          id: r.server_id,          // server id — every downstream call uses it, never Model.id
          permit_type: r.permit_type,
          permit_number: r.permit_number,
          building_type: r.building_type ?? '',
          code_type: r.code_type,
          code_edition: r.code_edition,
          nec_edition: r.nec_edition,
          status: r.status,
          ahj_name: r.ahj_name,
          ahj_level: r.ahj_level,
          ahj_phone: r.ahj_phone,
          jurisdiction_notes: r.jurisdiction_notes,
          applied_date: r.applied_date,
        })));
        setLoading(false);
      });
    return () => sub.unsubscribe();
  }, [projectId]);

  const load = useCallback(async () => {
    // One batched delta pull for every offline table; silently no-ops with no signal.
    await pullAll();
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      data={permits}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<EmptyState icon="📋" title={t('no_permits')} />}
      renderItem={({ item }) => {
        const typeColor = PERMIT_TYPE_COLORS[item.permit_type] ?? '#6B7280';
        return (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('PermitDetail', {
                permitId: item.id,
                permitNumber: item.permit_number ?? t('pending'),
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text variant="subheading">{item.permit_number ?? t('pending')}</Text>
              <View style={[styles.statusDot, { backgroundColor: STATUS[PERMIT_STATUS_TONE[item.status] ?? 'neutral'].fg }]} />
            </View>
            <View style={styles.badgeRow}>
              <Badge label={t(`type_${item.permit_type}`)} colors={{ fg: typeColor, bg: typeColor + '22' }} />
              <Text variant="caption" color={palette.accent}>{permitCodeLabel(item)}</Text>
            </View>
            <Text variant="caption" muted style={styles.meta}>
              {t(`status_${item.status}`)}
              {item.ahj_name ? `  ·  ${item.ahj_name}` : ''}
            </Text>
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  meta: { marginTop: 8, textTransform: 'capitalize' },
});
