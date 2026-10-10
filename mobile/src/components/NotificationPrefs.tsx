// components/NotificationPrefs.tsx — per-user notification preference grid (5 categories × push/email/sms).
// GET /v1/notifications/preferences (absent row = enabled by default); PUT to upsert one toggle.
// T-40: safety alerts cannot be disabled — those switches are locked ON. Rendered inline in Settings
// (no navigation — Settings is a tab; a Home-stack push from a tab is unreliable). EN+ES chrome.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileApi } from '@/lib/api';
import { useTheme } from '@/lib/theme-context';

const CATEGORIES = ['project', 'financial', 'system', 'cross_tenant', 'safety'] as const;
const CHANNELS = ['push', 'email', 'sms'] as const;
type Category = (typeof CATEGORIES)[number];
type Channel = (typeof CHANNELS)[number];

interface PrefRow { category: string; channel: string; enabled: boolean; }
type PrefMap = Record<string, boolean>; // `${category}:${channel}` -> enabled

const keyOf = (c: Category, ch: Channel) => `${c}:${ch}`;

export function NotificationPrefs(): React.ReactElement {
  const { t } = useTranslation('notif_prefs');
  const { palette } = useTheme();
  const [map, setMap] = useState<PrefMap | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { preferences } = await mobileApi<{ preferences: PrefRow[] }>('/notifications/preferences');
      const next: PrefMap = {};
      for (const p of preferences) next[`${p.category}:${p.channel}`] = p.enabled;
      setMap(next);
    } catch {
      setMap({}); // default everything on
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Absent row = enabled (server only stores explicit prefs). Safety always on (T-40).
  const isOn = (c: Category, ch: Channel) => (c === 'safety' ? true : map?.[keyOf(c, ch)] !== false);

  const toggle = async (c: Category, ch: Channel, value: boolean) => {
    if (c === 'safety') return; // locked
    const k = keyOf(c, ch);
    setMap((m) => ({ ...(m ?? {}), [k]: value })); // optimistic
    setSaving(k);
    try {
      await mobileApi('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ category: c, channel: ch, enabled: value }),
      });
    } catch (e) {
      setMap((m) => ({ ...(m ?? {}), [k]: !value })); // revert
      Alert.alert(t('save_failed', { defaultValue: 'Could not save' }), e instanceof Error ? e.message : '');
    } finally { setSaving(null); }
  };

  if (!map) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }

  return (
    <View>
      <Text style={[styles.hint, { color: palette.textMuted }]}>{t('hint', { defaultValue: 'Choose how you are notified.' })}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        {/* header */}
        <View style={[styles.row, styles.headerRow, { borderBottomColor: palette.border }]}>
          <Text style={[styles.catCell, styles.headerText, { color: palette.textMuted }]} />
          {CHANNELS.map((ch) => (
            <Text key={ch} style={[styles.chanCell, styles.headerText, { color: palette.textMuted }]}>
              {t(`chan_${ch}`, { defaultValue: ch })}
            </Text>
          ))}
        </View>
        {CATEGORIES.map((c, i) => (
          <View key={c} style={[styles.row, { borderBottomColor: palette.border, borderBottomWidth: i === CATEGORIES.length - 1 ? 0 : StyleSheet.hairlineWidth }]}>
            <View style={styles.catCell}>
              <Text style={[styles.catLabel, { color: palette.text }]}>{t(`cat_${c}`, { defaultValue: c })}</Text>
              {c === 'safety' ? <Text style={[styles.locked, { color: palette.textMuted }]}>{t('safety_locked', { defaultValue: 'Always on' })}</Text> : null}
            </View>
            {CHANNELS.map((ch) => (
              <View key={ch} style={styles.chanCell}>
                <Switch
                  value={isOn(c, ch)}
                  disabled={c === 'safety' || saving === keyOf(c, ch)}
                  onValueChange={(v) => toggle(c, ch, v)}
                  accessibilityLabel={`${t(`cat_${c}`)} ${t(`chan_${ch}`)}`}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 24, alignItems: 'center' },
  hint: { fontSize: 12, marginBottom: 8, lineHeight: 16 },
  card: { borderRadius: 10, paddingHorizontal: 14, marginBottom: 4, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { paddingVertical: 8 },
  headerText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  catCell: { flex: 1.6, justifyContent: 'center' },
  catLabel: { fontSize: 14, fontWeight: '500' },
  locked: { fontSize: 10, marginTop: 1 },
  chanCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
