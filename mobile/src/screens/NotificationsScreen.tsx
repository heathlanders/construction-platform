// screens/NotificationsScreen.tsx — in-app notification inbox
// Locked decisions: T-38, T-40, T-41
// Unread count from Redis (badge); read_at set on view; safety notifications highlighted
// No offline storage for notifications — server-side only (append-only log T-41)

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mobileApi } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useTheme } from '@/lib/theme-context';
import { EmptyState } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  created_at: string;
  data?: Record<string, unknown> | null; // deep-link payload (e.g. connection_id)
}

const CATEGORY_COLORS: Record<string, string> = {
  safety:       '#dc2626',
  financial:    '#1d4ed8',
  project:      '#059669',
  system:       '#6b7280',
  cross_tenant: '#7c3aed',
};

function useFormatRelative() {
  const { t } = useTranslation('notifications');
  return (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t('time_minutes_ago', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('time_hours_ago', { count: hrs });
    return t('time_days_ago', { count: Math.floor(hrs / 24) });
  };
}

export function NotificationsScreen({ navigation }: Props) {
  const { t } = useTranslation('notifications');
  const { palette } = useTheme();
  const formatRelative = useFormatRelative();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await mobileApi<{ notifications: Notification[]; unread_count: number }>(
        '/notifications?limit=50',
        { method: 'GET' },
      );
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch {
      // Offline or error — keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  async function markAllRead() {
    try {
      await mobileApi('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* non-fatal */ }
  }

  function renderItem({ item }: { item: Notification }) {
    const categoryColor = CATEGORY_COLORS[item.category] ?? '#6b7280';
    const isSafety = item.category === 'safety';
    const isUnread = item.read_at === null;
    // Deep-link: cross-tenant notifications carry connection_id in data → ConnectionDetail.
    const connectionId = typeof item.data?.connection_id === 'string' ? item.data.connection_id : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Wrapper = (connectionId ? TouchableOpacity : View) as React.ComponentType<any>;
    // This screen mounts BOTH in the HomeStack and as the Alerts tab. Navigating via the
    // 'HomeTab' parent route works from both contexts: from the tab, the Tab navigator
    // resolves it directly; from the stack, the dispatch bubbles up to the Tab parent.
    const openConnection = (id: string) =>
      (navigation as unknown as { navigate: (r: string, p: unknown) => void })
        .navigate('HomeTab', { screen: 'ConnectionDetail', params: { connectionId: id } });
    return (
      <Wrapper
        {...(connectionId
          ? { onPress: () => openConnection(connectionId), accessibilityRole: 'button' as const }
          : {})}
        style={[
        styles.notif,
        { backgroundColor: palette.surface, borderColor: palette.border },
        isUnread && { backgroundColor: palette.surfaceAlt, borderLeftWidth: 3, borderLeftColor: palette.accent },
        isSafety && { backgroundColor: palette.surfaceAlt, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
      ]}>
        <View style={styles.notifHeader}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.notifTitle, { color: palette.text }]} numberOfLines={1}>{item.title}</Text>
          {isUnread && <View style={[styles.unreadDot, { backgroundColor: palette.accent }]} />}
          <Text style={[styles.timestamp, { color: palette.textMuted }]}>{formatRelative(item.created_at)}</Text>
        </View>
        <Text style={[styles.notifBody, { color: palette.textMuted }]} numberOfLines={3}>{item.body}</Text>
        <View style={styles.categoryTag}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {item.category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </Wrapper>
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
      {/* Header bar with mark-all-read */}
      {unreadCount > 0 && (
        <View style={[styles.headerBar, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          <Text style={[styles.unreadLabel, { color: palette.textMuted }]}>{t('unread_count', { count: unreadCount })}</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAllText, { color: palette.accent }]}>{t('mark_all_read')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🔔" title={t('empty')} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  unreadLabel: { fontSize: 13 },
  markAllText: { fontSize: 13, fontWeight: '500' },

  list: { padding: 12, gap: 8 },

  notif: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },

  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  timestamp: { fontSize: 11 },

  notifBody: { fontSize: 13, lineHeight: 18, marginBottom: 6 },

  categoryTag: {},
  categoryText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
});
