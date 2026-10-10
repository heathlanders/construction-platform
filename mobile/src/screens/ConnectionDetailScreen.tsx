// screens/ConnectionDetailScreen.tsx — Cross-tenant connection detail (P-02 mobile surface).
// Summary + shared-event thread (labels + whitelisted payload snippets only) + Accept/Decline
// for the invited sub's OWNER/PM while pending. Deeper workflows (permissions, closeout,
// RFI/invoice responses) stay web. API-only (online).

import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mobileApi, ApiError } from '../lib/api';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { useCurrentUser } from '@/lib/user-context';
import { hasRole } from '@/lib/tileManifest';
import { Text, Card, Button, EmptyState } from '@/components/ui';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { CONNECTION_STATUS_TONE } from './ConnectionsScreen';

type DetailRoute = RouteProp<RootStackParamList, 'ConnectionDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ConnectionDetail {
  id: string;
  status: string;
  created_at: string;
  gc_tenant_name: string | null;
  sub_tenant_name: string | null;
  scope_description: string | null;
  contract_value_cents: number | null;
  project_name: string | null;
  your_side: 'gc' | 'sub';
  my_project: { id: string; name: string; status: string } | null;
  closed_reason: string | null;
}

interface SharedEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// event_type prefix → i18n family label key (mirrors the web realtime FAMILY_KEYS).
const FAMILY_KEYS: [string, string][] = [
  ['rfi.', 'ev_rfi'],
  ['change_order.', 'ev_change_order'],
  ['submittal.', 'ev_submittal'],
  ['invoice.', 'ev_invoice'],
  ['lien_waiver.', 'ev_lien_waiver'],
  ['daily_report.', 'ev_daily_report'],
  ['labor.', 'ev_labor'],
  ['message.sent', 'ev_message'],
  ['note.posted', 'ev_message'],
  ['milestone.', 'ev_milestone'],
  ['schedule.', 'ev_schedule'],
  ['project.location', 'ev_location'],
  ['connection.', 'ev_connection'],
];

function familyKey(eventType: string): string {
  for (const [prefix, key] of FAMILY_KEYS) if (eventType.startsWith(prefix)) return key;
  return 'ev_generic';
}

// Short human snippet from the WHITELISTED payload (safe by construction — nothing beyond
// what the bridge whitelist already shares crosses here).
function eventSnippet(p: Record<string, unknown>): string {
  const v = p.subject ?? p.title ?? p.message ?? p.note ?? p.project_name ?? p.description ?? null;
  return typeof v === 'string' ? v : '';
}

const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function ConnectionDetailScreen(): React.ReactElement {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { connectionId } = route.params;
  const { t } = useTranslation('connections');
  const { palette } = useTheme();
  const { role } = useCurrentUser();
  const canRespond = hasRole(role, ['owner', 'project_manager']);

  const [conn, setConn] = useState<ConnectionDetail | null>(null);
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await mobileApi<{ connection: ConnectionDetail }>(`/connections/${connectionId}`);
      setConn(d.connection);
      const ev = await mobileApi<{ events: SharedEvent[]; pagination: { has_more: boolean; next_cursor: string | null } }>(
        `/connections/${connectionId}/events?limit=20`,
      );
      setEvents(ev.events ?? []);
      setNextCursor(ev.pagination?.has_more ? ev.pagination.next_cursor : null);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('detail_error'));
    }
  }, [connectionId, t]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    try {
      const ev = await mobileApi<{ events: SharedEvent[]; pagination: { has_more: boolean; next_cursor: string | null } }>(
        `/connections/${connectionId}/events?limit=20&cursor=${nextCursor}`,
      );
      setEvents((cur) => [...cur, ...(ev.events ?? [])]);
      setNextCursor(ev.pagination?.has_more ? ev.pagination.next_cursor : null);
    } catch { /* keep what we have */ }
  }, [connectionId, nextCursor]);

  const respond = useCallback((action: 'accept' | 'decline') => {
    Alert.alert(
      t(action === 'accept' ? 'accept_title' : 'decline_title'),
      t(action === 'accept' ? 'accept_confirm' : 'decline_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t(action === 'accept' ? 'accept_btn' : 'decline_btn'),
          style: action === 'decline' ? 'destructive' : 'default',
          onPress: async () => {
            setActing(true);
            try {
              await mobileApi(`/connections/${connectionId}/${action}`, {
                method: 'POST',
                body: JSON.stringify({}),
              });
              await load();
            } catch (e) {
              Alert.alert(t('action_failed'), e instanceof ApiError ? e.message : String(e));
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  }, [connectionId, load, t]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  if (error || !conn) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background, padding: 24 }]}>
        <Text variant="body" muted>{error || t('detail_error')}</Text>
      </View>
    );
  }

  const tone = CONNECTION_STATUS_TONE[conn.status] ?? 'neutral';
  const showRespond = conn.your_side === 'sub' && conn.status === 'pending' && canRespond;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Summary */}
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="subheading" numberOfLines={2}>
              {conn.gc_tenant_name ?? '—'} ↔ {conn.sub_tenant_name ?? '—'}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: STATUS[tone].bg }]}>
            <Text variant="caption" color={STATUS[tone].fg}>{t(`status_${conn.status}`)}</Text>
          </View>
        </View>
        {conn.scope_description ? (
          <Text variant="body" style={styles.meta}>{conn.scope_description}</Text>
        ) : null}
        {conn.contract_value_cents != null ? (
          <Text variant="caption" muted style={styles.meta}>
            {t('contract_value')}: {fmtMoney(conn.contract_value_cents)}
          </Text>
        ) : null}
        {conn.project_name ? (
          <Text variant="caption" muted style={styles.meta}>{t('gc_project')}: {conn.project_name}</Text>
        ) : null}
        {conn.my_project ? (
          <Text variant="caption" muted style={styles.meta}>{t('my_project')}: {conn.my_project.name}</Text>
        ) : null}
        {conn.closed_reason ? (
          <Text variant="caption" muted style={styles.meta}>{t('closed_reason')}: {conn.closed_reason.replace(/_/g, ' ')}</Text>
        ) : null}

        {showRespond && (
          <View style={styles.actionRow}>
            <Button
              title={t('accept_btn')}
              onPress={() => respond('accept')}
              disabled={acting}
              style={{ flex: 1 }}
            />
            <Button
              title={t('decline_btn')}
              variant="secondary"
              onPress={() => respond('decline')}
              disabled={acting}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Card>

      {/* Shared event thread */}
      <Text variant="subheading" style={styles.sectionTitle}>{t('activity_title')}</Text>
      {events.length === 0 ? (
        <EmptyState icon="🕊️" title={t('no_events')} />
      ) : (
        events.map((ev) => {
          const snippet = eventSnippet(ev.payload);
          return (
            <Card key={ev.id} style={styles.eventCard}>
              <View style={styles.headerRow}>
                <Text variant="body">{t(familyKey(ev.event_type))}</Text>
                <Text variant="caption" muted>{new Date(ev.created_at).toLocaleDateString()}</Text>
              </View>
              {snippet ? (
                <Text variant="caption" muted numberOfLines={2} style={styles.meta}>{snippet}</Text>
              ) : null}
            </Card>
          );
        })
      )}
      {nextCursor && (
        <Button title={t('load_more')} variant="secondary" onPress={loadMore} style={styles.loadMore} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  meta: { marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  sectionTitle: { marginBottom: 10 },
  eventCard: { marginBottom: 10 },
  loadMore: { marginTop: 8 },
});
