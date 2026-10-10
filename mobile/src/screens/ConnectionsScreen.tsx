// screens/ConnectionsScreen.tsx — Cross-tenant GC↔Sub connections list (P-02 mobile surface).
// OWNER/PM-facing, API-only (online). Tap → ConnectionDetail (accept/decline for the sub side).
// 402 ADDON_REQUIRED renders an upgrade note (PR-08) — deeper workflows stay web.

import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mobileApi, ApiError } from '../lib/api';
import { useTheme } from '@/lib/theme-context';
import { STATUS, type StatusTone } from '@/lib/theme';
import { Text, Card, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface Connection {
  id: string;
  gc_tenant_id: string;
  sub_tenant_id: string;
  gc_tenant_name?: string | null;
  sub_tenant_name?: string | null;
  status: string;
  scope_description?: string | null;
  created_at: string;
}

export const CONNECTION_STATUS_TONE: Record<string, StatusTone> = {
  pending: 'warning',
  active: 'success',
  completed: 'action',
  revoked: 'danger',
  rejected: 'neutral',
};

const STATUS_FILTERS = ['active', 'pending', 'completed', 'revoked', 'rejected'] as const;

export function ConnectionsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('connections');
  const { palette } = useTheme();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addonBlocked, setAddonBlocked] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await mobileApi<{ connections: Connection[] }>('/connections?limit=100');
      setConnections(data.connections ?? []);
      setAddonBlocked(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) setAddonBlocked(true);
      else console.warn('connections load failed', e);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

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

  if (addonBlocked) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background, padding: 24 }]}>
        <Text variant="subheading" style={styles.upgradeTitle}>{t('upgrade_title')}</Text>
        <Text variant="body" muted style={{ textAlign: 'center' }}>{t('upgrade_body')}</Text>
      </View>
    );
  }

  const filtered = connections.filter((c) => c.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View style={[styles.chipRow, { borderBottomColor: palette.border }]}>
        {STATUS_FILTERS.map((s) => {
          const active = filter === s;
          const count = connections.filter((c) => c.status === s).length;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setFilter(s)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              style={[
                styles.chip,
                { borderColor: active ? palette.accent : palette.border, backgroundColor: active ? palette.accent + '22' : 'transparent' },
              ]}
            >
              <Text variant="caption" color={active ? palette.accent : palette.textMuted}>
                {t(`status_${s}`)}{count > 0 ? ` ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="🔗" title={t(`no_${filter}`)} />}
        renderItem={({ item }) => {
          const tone = CONNECTION_STATUS_TONE[item.status] ?? 'neutral';
          return (
            <Card
              style={styles.card}
              onPress={() =>
                navigation.navigate('ConnectionDetail', {
                  connectionId: item.id,
                  counterpartyName: item.gc_tenant_name && item.sub_tenant_name
                    ? `${item.gc_tenant_name} ↔ ${item.sub_tenant_name}`
                    : undefined,
                })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.names}>
                  <Text variant="subheading" numberOfLines={1}>
                    {item.gc_tenant_name ?? '—'} ↔ {item.sub_tenant_name ?? '—'}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: STATUS[tone].fg }]} />
              </View>
              {item.scope_description ? (
                <Text variant="caption" muted numberOfLines={2} style={styles.meta}>{item.scope_description}</Text>
              ) : null}
              <Text variant="caption" muted style={styles.meta}>
                {t(`status_${item.status}`)}  ·  {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  names: { flex: 1, minWidth: 0 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  meta: { marginTop: 6 },
  upgradeTitle: { marginBottom: 8 },
});
