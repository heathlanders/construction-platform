// screens/SettingsScreen.tsx — per-user layout / language / appearance preferences.
// Layout: show/hide the tiles this ROLE is allowed (permission gate always wins — a hidden tile
// can never reveal an action the role isn't allowed). Language: EN/ES. Appearance: System/Light/Dark.
// Persists to AsyncStorage via preferences.ts (keyed by user_id). API-only concerns: none (local).

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/lib/user-context';
import { useTheme } from '@/lib/theme-context';
import { tilesForRole, hasRole, type TileDef } from '@/lib/tileManifest';
import { mobileApi, ApiError } from '@/lib/api';
import { loadPrefs, savePrefs, type UserPreferences } from '@/lib/preferences';
import { applyLanguage } from '@/lib/i18n';
import { NotificationPrefs } from '@/components/NotificationPrefs';
import { ProfileEditor } from '@/components/ProfileEditor';
import type { ThemeMode } from '@/lib/theme';

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

export function SettingsScreen(): React.ReactElement {
  const { t } = useTranslation(['settings', 'projects', 'common', 'notif_prefs', 'profile']);
  const { user, role } = useCurrentUser();
  const { palette, mode, setMode } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  // Owner-only org time-tracking mode (tenant_settings.time_tracking_mode).
  const isOwner = hasRole(role, ['owner']);
  const [ttMode, setTtMode] = useState<'manual' | 'clock_in_out'>('manual');
  const [ttVersion, setTtVersion] = useState(0);
  const [ttSaving, setTtSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadPrefs(user.user_id).then(setPrefs);
  }, [user]);

  useEffect(() => {
    if (!isOwner) return;
    void mobileApi<{ settings: { time_tracking_mode: string; version: number } }>('/settings/org')
      .then((r) => { setTtMode((r.settings.time_tracking_mode as 'manual' | 'clock_in_out') ?? 'manual'); setTtVersion(r.settings.version ?? 0); })
      .catch(() => { /* keep defaults */ });
  }, [isOwner]);

  const saveTtMode = async (next: 'manual' | 'clock_in_out') => {
    if (next === ttMode || ttSaving) return;
    const prev = ttMode;
    setTtMode(next);
    setTtSaving(true);
    const patch = (version: number) =>
      mobileApi<{ settings: { version: number } }>('/settings/org', {
        method: 'PATCH',
        body: JSON.stringify({ time_tracking_mode: next, version }),
      });
    try {
      const r = await patch(ttVersion);
      setTtVersion(r.settings.version ?? ttVersion + 1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Re-fetch current version and retry once.
        try {
          const fresh = await mobileApi<{ settings: { version: number } }>('/settings/org');
          const r = await patch(fresh.settings.version ?? 0);
          setTtVersion(r.settings.version ?? 0);
        } catch { setTtMode(prev); }
      } else { setTtMode(prev); }
    } finally { setTtSaving(false); }
  };

  const projectTiles = tilesForRole(role, 'project');
  const globalTiles = tilesForRole(role, 'global');

  const update = async (patch: Partial<UserPreferences>) => {
    if (!user) return;
    const next = await savePrefs(user.user_id, patch);
    setPrefs(next);
    return next;
  };

  const toggleTile = async (key: string, show: boolean) => {
    const current = prefs?.hiddenTiles ?? [];
    const hiddenTiles = show ? current.filter((k) => k !== key) : [...new Set([...current, key])];
    await update({ hiddenTiles });
  };

  const setLanguage = async (language: 'en' | 'es') => {
    await update({ language });
    applyLanguage(language);
  };

  if (!user || !prefs) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  const hidden = new Set(prefs.hiddenTiles);

  const TileRow = ({ tile }: { tile: TileDef }) => (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <Text style={styles.rowIcon}>{tile.icon}</Text>
      <Text style={[styles.rowLabel, { color: palette.text }]}>
        {t(`${tile.ns}:${tile.key}`)}
      </Text>
      <Switch
        value={!hidden.has(tile.key)}
        onValueChange={(v) => toggleTile(tile.key, v)}
        accessibilityLabel={t(`${tile.ns}:${tile.key}`)}
      />
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.content}>
      {/* Profile */}
      <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('profile:title')}</Text>
      <ProfileEditor />

      {/* Appearance */}
      <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('settings:theme')}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={styles.segmented}>
          {THEME_MODES.map((m) => {
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.segment,
                  { borderColor: palette.border },
                  active && { backgroundColor: palette.accent, borderColor: palette.accent },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.segmentText, { color: active ? '#fff' : palette.text }]}>
                  {t(`settings:theme_${m}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Language */}
      <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('settings:language')}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={styles.segmented}>
          {(['en', 'es'] as const).map((lng) => {
            const active = prefs.language === lng;
            return (
              <TouchableOpacity
                key={lng}
                onPress={() => setLanguage(lng)}
                style={[
                  styles.segment,
                  { borderColor: palette.border },
                  active && { backgroundColor: palette.accent, borderColor: palette.accent },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.segmentText, { color: active ? '#fff' : palette.text }]}>
                  {t(lng === 'en' ? 'settings:english' : 'settings:spanish')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Time tracking — owner only */}
      {isOwner ? (
        <>
          <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('settings:time_tracking')}</Text>
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <View style={styles.segmented}>
              {(['manual', 'clock_in_out'] as const).map((m) => {
                const active = ttMode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => void saveTtMode(m)}
                    disabled={ttSaving}
                    style={[
                      styles.segment,
                      { borderColor: palette.border },
                      active && { backgroundColor: palette.accent, borderColor: palette.accent },
                    ]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.segmentText, { color: active ? '#fff' : palette.text }]}>
                      {t(m === 'manual' ? 'settings:mode_manual' : 'settings:mode_clock')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text style={[styles.hint, { color: palette.textMuted }]}>{t('settings:mode_hint')}</Text>
        </>
      ) : null}

      {/* Updates */}
      <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('settings:updates')}</Text>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <View style={[styles.row, { borderBottomColor: palette.border, borderBottomWidth: 0 }]}>
          <Text style={[styles.rowLabel, { color: palette.text }]}>{t('settings:show_updates')}</Text>
          <Switch
            value={!prefs.hideUpdateMessages}
            onValueChange={(v) => void update({ hideUpdateMessages: !v })}
            accessibilityLabel={t('settings:show_updates')}
          />
        </View>
      </View>

      {/* Notifications */}
      <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('notif_prefs:title')}</Text>
      <NotificationPrefs />

      {/* Layout */}
      <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{t('settings:layout')}</Text>
      <Text style={[styles.hint, { color: palette.textMuted }]}>{t('settings:layout_hint')}</Text>

      {globalTiles.length > 0 ? (
        <>
          <Text style={[styles.subLabel, { color: palette.textMuted }]}>{t('settings:section_global')}</Text>
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            {globalTiles.map((tile) => <TileRow key={tile.key} tile={tile} />)}
          </View>
        </>
      ) : null}

      {projectTiles.length > 0 ? (
        <>
          <Text style={[styles.subLabel, { color: palette.textMuted }]}>{t('settings:section_project')}</Text>
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            {projectTiles.map((tile) => <TileRow key={tile.key} tile={tile} />)}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  subLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  hint: { fontSize: 12, marginBottom: 8, lineHeight: 16 },
  card: { borderRadius: 10, paddingHorizontal: 14, marginBottom: 4, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  segmented: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
  segment: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
});
