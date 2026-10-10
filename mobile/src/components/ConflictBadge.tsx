// ConflictBadge.tsx — header button that surfaces unresolved sync conflicts.
//
// Counts every CONFLICT-capable table (T-13/T-14) and renders a ⚠️ button only when
// there are any. Tapping opens the Conflicts inbox.
//
// ⚠️ Driven by `CONFLICT_TABLES`, NOT a hand-written list of models. It used to name
// three models explicitly, so when `inspections` became conflict-capable (§B3) its
// conflicts were invisible: no badge → nobody opens the inbox → the row sits in
// `sync_status='conflict'` forever, which is the exact silent-stall B3 set out to end.
// A table that can conflict but can't be seen is worse than one that can't conflict.
// Add a table to the registry and it counts here automatically.

import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { STATUS } from '@/lib/theme';
import { CONFLICT_TABLES } from '@/lib/conflict-registry';
import type { RootStackParamList } from '@/navigation/AppNavigator';

export function ConflictBadge() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const count = Object.values(counts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const subs: { unsubscribe: () => void }[] = [];
    for (const def of CONFLICT_TABLES) {
      try {
        subs.push(
          database.collections
            .get(def.table)
            .query(Q.where('sync_status', 'conflict'))
            .observeCount()
            .subscribe((n) => setCounts((c) => (c[def.table] === n ? c : { ...c, [def.table]: n }))),
        );
      } catch {
        // Table absent from the local schema (older install) — skip it, keep the rest.
      }
    }
    return () => subs.forEach((s) => s.unsubscribe());
  }, []);

  if (count === 0) return null;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Conflicts')}
      style={styles.btn}
      accessibilityLabel="Sync conflicts"
    >
      <Text style={styles.icon}>⚠️</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { marginEnd: 2, padding: 6 },
  icon: { fontSize: 20 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: STATUS.danger.fg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
