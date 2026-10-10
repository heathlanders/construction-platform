// ConflictResolveScreen.tsx — side-by-side, field-level conflict resolve (T-14).
//
// ONE screen for every conflict-capable table, driven by `lib/conflict-registry.ts`.
// (It used to be three near-identical ~220-line screens — time entries, punch items,
// safety incidents — which is why a new offline table couldn't get a conflict path.)
//
// Shows the worker's local row vs the server's, field by field. Only fields that
// DIFFER need a choice ("Keep Mine" / "Use Server") and ALL of them must be resolved
// before submit (T-14). On submit the merged values are PATCHed at the server's
// version, the local record goes back to synced, and the stash is cleared. A
// re-conflict (server moved again) re-stashes and re-renders instead of looping.
// Tier-3 tables (safety) only allow an authorized role to resolve.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Model } from '@nozbe/watermelondb';
import { database } from '@/lib/database';
import { mobileApi, ApiError } from '@/lib/api';
import { getConflictFor, saveConflictFor, clearConflictFor, type ServerSnapshot } from '@/lib/conflicts';
import {
  conflictDef, differingFields, displayValue, mergeChoices, allResolved, canResolve,
  type Choice, type ConflictTableDef,
} from '@/lib/conflict-registry';
import { useCurrentUser } from '@/lib/user-context';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useTheme } from '@/lib/theme-context';
import { STATUS } from '@/lib/theme';
import { Button } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'ConflictResolve'>;

/** WatermelonDB row read generically — the registry says which columns matter. */
type AnyRow = Model & Record<string, unknown> & {
  server_id: string; version: number; sync_status: string; synced_at: string | null;
};

export function ConflictResolveScreen({ route, navigation }: Props) {
  const { localId, table } = route.params;
  const { t } = useTranslation('field');
  const { t: tc } = useTranslation('common');
  const { palette } = useTheme();
  const { role } = useCurrentUser();

  const def: ConflictTableDef | undefined = conflictDef(table);

  const [record, setRecord] = useState<AnyRow | null>(null);
  const [server, setServer] = useState<ServerSnapshot | null>(null);
  const [choices, setChoices] = useState<Record<string, Choice | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!def) { setLoading(false); return; }
      try {
        const rec = await database.get<AnyRow>(def.table).find(localId);
        const snap = await getConflictFor(def.table, localId);
        setRecord(rec);
        setServer(snap);
      } catch {
        setRecord(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [def, localId]);

  const local = (record ?? {}) as Record<string, unknown>;
  const snapshot = (server ?? {}) as Record<string, unknown>;

  const differing = useMemo(
    () => (def && record && server ? differingFields(def.fields, local, snapshot) : []),
    [def, record, server, local, snapshot],
  );
  const ready = def && record && server
    ? allResolved(def.fields, local, snapshot, choices)
    : false;

  const mayResolve = def ? canResolve(def, role) : false;

  const resolve = useCallback(async () => {
    if (!def || !record || !server || !ready) return;
    setSaving(true);
    try {
      const merged = mergeChoices(def.fields, local, snapshot, choices);

      const res = await mobileApi<Record<string, { id: string; version: number }>>(
        `${def.endpoint}/${server.id}`,
        { method: 'PATCH', body: JSON.stringify({ version: server.version, ...merged }) },
      );
      const updated = res[def.responseKey];

      await database.write(async () => {
        await record.update((r) => {
          const row = r as unknown as Record<string, unknown>;
          for (const f of def.fields) row[f.key] = merged[f.key];
          row.version = updated?.version ?? server.version + 1;
          row.sync_status = 'synced';
          row.synced_at = new Date().toISOString();
        });
      });
      await clearConflictFor(def.table, localId);
      Alert.alert('', t('conflicts.resolved_ok'));
      navigation.goBack();
    } catch (err) {
      // Server moved again under us — re-stash the newer snapshot and re-render
      // rather than looping on a stale version.
      const newer = err instanceof ApiError && err.status === 409
        ? (err.body as { server_record?: ServerSnapshot })?.server_record
        : undefined;
      if (newer) {
        await saveConflictFor(def.table, localId, newer);
        setServer(newer);
        setChoices({});
        Alert.alert(t('conflicts.title'), t('conflicts.changed_again'));
      } else {
        Alert.alert(tc('error'), err instanceof Error ? err.message : tc('error'));
      }
    } finally {
      setSaving(false);
    }
  }, [def, record, server, ready, local, snapshot, choices, localId, navigation, t, tc]);

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><ActivityIndicator size="large" color={palette.accent} /></View>;
  }
  if (!def || !record || !server) {
    return <View style={[styles.centered, { backgroundColor: palette.background }]}><Text style={[styles.muted, { color: palette.textMuted }]}>{t('conflicts.gone')}</Text></View>;
  }

  const title = String(local[def.titleKey] ?? '').slice(0, 40);

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.intro, { color: palette.text }]}>{t('conflicts.intro')}</Text>
      <Text style={[styles.dateLine, { color: palette.text }]}>{title}</Text>

      {def.tier === 3 && !mayResolve && (
        // T-13 Tier 3: safety-critical rows stay blocked until an authorized user acts.
        <Text style={[styles.blocked, { color: STATUS.danger.fg }]}>{t('conflicts.safety_blocked')}</Text>
      )}

      {differing.length === 0 ? (
        <Text style={[styles.muted, { color: palette.textMuted }]}>{t('conflicts.no_diff')}</Text>
      ) : (
        differing.map((f) => {
          const pick = choices[f.key];
          return (
            <View key={f.key} style={[styles.fieldCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.fieldLabel, { color: palette.textMuted }]}>{t(f.labelKey)}</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  disabled={!mayResolve}
                  style={[
                    styles.option,
                    { borderColor: palette.border, backgroundColor: palette.surfaceAlt },
                    pick === 'mine' && { borderColor: palette.accent, backgroundColor: palette.accent + '22' },
                  ]}
                  onPress={() => setChoices((c) => ({ ...c, [f.key]: 'mine' }))}
                >
                  <Text style={[styles.optionTag, { color: palette.textMuted }]}>{t('conflicts.mine')}</Text>
                  <Text style={[styles.optionVal, { color: palette.textMuted }, pick === 'mine' && { color: palette.text, fontWeight: '600' }]} numberOfLines={2}>
                    {displayValue(f, local[f.key])}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!mayResolve}
                  style={[
                    styles.option,
                    { borderColor: palette.border, backgroundColor: palette.surfaceAlt },
                    pick === 'server' && { borderColor: STATUS.warning.fg, backgroundColor: STATUS.warning.fg + '22' },
                  ]}
                  onPress={() => setChoices((c) => ({ ...c, [f.key]: 'server' }))}
                >
                  <Text style={[styles.optionTag, { color: palette.textMuted }]}>{t('conflicts.server')}</Text>
                  <Text style={[styles.optionVal, { color: palette.textMuted }, pick === 'server' && { color: palette.text, fontWeight: '600' }]} numberOfLines={2}>
                    {displayValue(f, snapshot[f.key])}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <Button
        title={ready ? t('conflicts.apply') : t('conflicts.must_resolve_all')}
        onPress={resolve}
        disabled={!ready || !mayResolve}
        loading={saving}
        fullWidth
        style={styles.submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { fontSize: 14, textAlign: 'center' },
  intro: { fontSize: 14, marginBottom: 4 },
  dateLine: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  blocked: { fontSize: 13, fontWeight: '700', marginBottom: 12 },

  fieldCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  optionsRow: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, borderWidth: 2, borderRadius: 10, padding: 12 },
  optionTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  optionVal: { fontSize: 16 },

  submit: { marginTop: 12 },
});
