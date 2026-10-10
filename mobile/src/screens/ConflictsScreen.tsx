// ConflictsScreen.tsx — inbox of unresolved sync conflicts (T-13/T-14).
//
// Registry-driven: lists every table in CONFLICT_TABLES whose local rows are flagged
// sync_status='conflict' (set by the sync sweep when a push comes back with one).
// Tap a row → the single ConflictResolve screen. Tier-3 (safety) sorts first.
// Held conflicts never block other records (T-14).

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Q } from '@nozbe/watermelondb';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Model } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { CONFLICT_TABLES, displayValue } from '@/lib/conflict-registry';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { EmptyState } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Conflicts'>;

// One row shape for every table — the registry supplies the labels.
interface ConflictRow { table: string; tier: 2 | 3; labelKey: string; id: string; primary: string; secondary: string }

type AnyRow = Model & Record<string, unknown> & { is_deleted: boolean };

export function ConflictsScreen({ navigation }: Props) {
  const { t } = useTranslation('field');
  const { palette } = useTheme();
  const [rows, setRows] = useState<ConflictRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const perTable = await Promise.all(
      CONFLICT_TABLES.map(async (def) => {
        let found: AnyRow[] = [];
        try {
          found = await database.collections.get<AnyRow>(def.table)
            .query(Q.where('sync_status', 'conflict')).fetch();
        } catch {
          return [] as ConflictRow[]; // table not in the local schema — skip
        }
        // The registry's first field is the most meaningful summary line.
        const summary = def.fields[0];
        return found.filter((r) => !r.is_deleted).map<ConflictRow>((r) => ({
          table: def.table,
          tier: def.tier,
          labelKey: def.labelKey,
          id: r.id,
          primary: String(r[def.titleKey] ?? ''),
          secondary: summary ? displayValue(summary, r[summary.key]) : '',
        }));
      }),
    );
    const all = perTable.flat();
    // Tier 3 (safety-critical) first — it blocks until an authorized user acts.
    setRows([...all.filter((r) => r.tier === 3), ...all.filter((r) => r.tier !== 3)]);
    setLoading(false);
  }, []);

  // Reload on focus so resolving one and coming back updates the list.
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={rows}
        keyExtractor={(r) => `${r.table}:${r.id}`}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
        ListEmptyComponent={<EmptyState icon="✓" title={t('conflicts.none')} />}
        renderItem={({ item }) => {
          const isSafety = item.tier === 3;
          const tag = t(item.labelKey);
          return (
            <TouchableOpacity
              style={[
                styles.row,
                { backgroundColor: palette.surface, borderColor: STATUS.danger.fg + '55' },
                isSafety && { borderColor: STATUS.danger.fg, borderLeftWidth: 4 },
              ]}
              onPress={() => navigation.navigate('ConflictResolve', { localId: item.id, table: item.table })}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTag, { color: palette.textMuted }]}>{tag}</Text>
                <Text style={[styles.rowDate, { color: palette.text }]} numberOfLines={1}>{item.primary}</Text>
                <Text style={[styles.rowSub, { color: palette.textMuted }]} numberOfLines={1}>{item.secondary}</Text>
              </View>
              <Text style={[styles.rowBadge, { color: STATUS.danger.fg }]}>{t('conflicts.resolve')} ›</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 16, marginBottom: 8, borderWidth: 1 },
  rowInfo: { flex: 1, paddingRight: 8 },
  rowTag: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  rowDate: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  rowBadge: { fontSize: 14, fontWeight: '600' },
});
