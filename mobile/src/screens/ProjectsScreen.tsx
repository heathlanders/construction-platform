import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { database } from '@/lib/database';
import { Project } from '@/models/Project';
import { mobileApi } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useCurrentUser } from '@/lib/user-context';
import { useTheme } from '@/lib/theme-context';
import { tilesForRole, type TileDef } from '@/lib/tileManifest';
import { loadPrefs } from '@/lib/preferences';
import { Card, StatusBadge, EmptyState } from '@/components/ui';

interface ServerProject {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  version: number;
}

interface ProjectsListResponse {
  // API GET /v1/projects returns { projects, pagination } — NOT { data }.
  projects: ServerProject[];
  pagination?: { has_more: boolean; next_cursor: string | null };
}

type Props = NativeStackScreenProps<RootStackParamList, 'Projects'>;

const STATUS_KEY_MAP: Record<string, string> = {
  active: 'status_active',
  completed: 'status_completed',
  on_hold: 'status_on_hold',
  cancelled: 'status_cancelled',
};

async function syncProjects(): Promise<void> {
  try {
    const res = await mobileApi<ProjectsListResponse>('/projects');
    const serverProjects = res.projects ?? [];
    const col = database.get<Project>('projects');

    await database.write(async () => {
      const allLocal = await col.query().fetch();

      for (const sp of serverProjects) {
        const existing = allLocal.find((r) => r.server_id === sp.id);

        if (existing) {
          // T-12: only overwrite if server version >= local version.
          // Prevents a stale pull from clobbering a pending local edit.
          if (sp.version >= existing.version) {
            await existing.update((r) => {
              r.name = sp.name;
              r.status = sp.status;
              r.start_date = sp.start_date ?? null;
              r.end_date = sp.end_date ?? null;
              r.address = sp.address ?? null;
              r.city = sp.city ?? null;
              r.state = sp.state ?? null;
              r.version = sp.version;
              r.sync_status = 'synced';
              r.synced_at = new Date().toISOString();
            });
          }
        } else {
          await col.create((r) => {
            r.server_id = sp.id;
            r.name = sp.name;
            r.status = sp.status;
            r.start_date = sp.start_date ?? null;
            r.end_date = sp.end_date ?? null;
            r.address = sp.address ?? null;
            r.city = sp.city ?? null;
            r.state = sp.state ?? null;
            r.version = sp.version;
            r.sync_status = 'synced';
            r.synced_at = new Date().toISOString();
            r.is_deleted = false;
          });
        }
      }

      // Prune locals the server no longer returns (soft-deleted/merged server-side).
      // Only touch already-synced rows — never a pending local-only create.
      const serverIds = new Set(serverProjects.map((sp) => sp.id));
      for (const r of allLocal) {
        if (r.server_id && !serverIds.has(r.server_id) && r.sync_status === 'synced' && !r.is_deleted) {
          await r.update((x) => { x.is_deleted = true; });
        }
      }
    });
  } catch (e) {
    // Sync failure is non-fatal — app stays functional from local DB — but log it
    // so a silent shape/contract drift (e.g. wrong response field) isn't invisible.
    console.warn('[ProjectsScreen] syncProjects failed:', e);
  }
}

export function ProjectsScreen({ navigation }: Props) {
  const { t } = useTranslation(['projects', 'common']);
  const { user, role } = useCurrentUser();
  const { palette } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const loadLocal = useCallback(async () => {
    const all = await database.get<Project>('projects').query().fetch();
    setProjects(all.filter((p) => !p.is_deleted));
  }, []);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    await loadLocal();
    await syncProjects();
    await loadLocal();
    setLoading(false);
  }, [loadLocal]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncProjects();
    await loadLocal();
    setRefreshing(false);
  }, [loadLocal]);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

  useEffect(() => {
    if (!user) return;
    void loadPrefs(user.user_id).then((p) => setHidden(new Set(p.hiddenTiles)));
  }, [user]);

  // Role quick-actions strip (the "different home per role"): global tiles this role is allowed,
  // minus the user's hidden-tile preference.
  const quickActions = tilesForRole(role, 'global').filter((tile) => !hidden.has(tile.key));

  const openQuick = (tile: TileDef) => navigation.navigate(tile.route as any);

  const QuickStrip = () =>
    quickActions.length === 0 ? null : (
      <View style={styles.strip}>
        {quickActions.map((tile) => (
          <TouchableOpacity
            key={tile.key}
            style={[styles.chip, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => openQuick(tile)}
            accessibilityRole="button"
            accessibilityLabel={t(`${tile.ns}:${tile.key}`)}
          >
            <Text style={styles.chipIcon}>{tile.icon}</Text>
            <Text style={[styles.chipLabel, { color: palette.text }]} numberOfLines={1}>
              {t(`${tile.ns}:${tile.key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: palette.background }}
      data={projects}
      keyExtractor={(item) => item.id}
      contentContainerStyle={projects.length === 0 ? styles.emptyContainer : styles.list}
      ListHeaderComponent={<QuickStrip />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<EmptyState icon="📋" title={t('no_projects')} />}
      renderItem={({ item }) => {
        const statusKey = STATUS_KEY_MAP[item.status] ?? 'status_active';
        const location = [item.city, item.state].filter(Boolean).join(', ');
        return (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('ProjectDetail', {
                projectId: item.server_id,
                projectName: item.name,
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.projectName, { color: palette.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <StatusBadge status={item.status} label={t(statusKey)} />
            </View>
            {location ? <Text style={[styles.location, { color: palette.textMuted }]}>{location}</Text> : null}
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, padding: 16 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  card: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  projectName: { flex: 1, fontSize: 16, fontWeight: '600' },
  location: { marginTop: 6, fontSize: 13 },
});
