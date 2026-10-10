import React, { useEffect, useState } from 'react';
import { View, Text as RNText, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mobileApi } from '@/lib/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { useCurrentUser } from '@/lib/user-context';
import { useTheme } from '@/lib/theme-context';
import { tilesForRole, type TileDef } from '@/lib/tileManifest';
import { loadPrefs } from '@/lib/preferences';
import { Screen, Card, Text } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId, projectName } = route.params;
  const { t } = useTranslation('projects');
  const { t: tc } = useTranslation('common');
  const { user, role } = useCurrentUser();
  const { palette } = useTheme();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // Site coords for the directions handoff (Doc 20 Phase 3 mobile). Online-only fetch —
  // no coords (offline / not geocoded) simply hides the button.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    void loadPrefs(user.user_id).then((p) => setHidden(new Set(p.hiddenTiles)));
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    mobileApi<{ project?: { latitude?: string | number | null; longitude?: string | number | null } }>(
      `/projects/${projectId}`,
    )
      .then((d) => {
        const lat = d.project?.latitude, lng = d.project?.longitude;
        if (!cancelled && lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
          setCoords({ lat: Number(lat), lng: Number(lng) });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  const openDirections = () => {
    if (!coords) return;
    // Universal Google Maps directions URL — opens the native maps app on Android/iOS.
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`);
  };

  // Role gate (permission) first, then subtract the user's hidden-tile preference.
  // Starting from the role-allowed set means a preference can only ever remove a tile.
  const tiles = tilesForRole(role, 'project').filter((tile) => !hidden.has(tile.key));

  const open = (tile: TileDef) => {
    const params = tile.noProjectParams
      ? {}
      : tile.needsProjectName
        ? { projectId, projectName }
        : { projectId };
    navigation.navigate(tile.route as any, params as any);
  };

  return (
    <Screen scroll>
      <Card style={styles.header}>
        <Text variant="title">{projectName}</Text>
        {coords && (
          <TouchableOpacity
            onPress={openDirections}
            style={[styles.directionsBtn, { borderColor: palette.border }]}
            accessibilityRole="button"
            accessibilityLabel={tc('nav.directions')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RNText style={styles.directionsText}>🧭 {tc('nav.directions')}</RNText>
          </TouchableOpacity>
        )}
      </Card>

      <Text variant="label" muted style={styles.sectionLabel}>{t('detail')}</Text>

      <View style={styles.grid}>
        {tiles.map((tile) => (
          <TouchableOpacity
            key={tile.key}
            style={[styles.tile, { backgroundColor: palette.surface, borderLeftColor: tile.color }]}
            onPress={() => open(tile)}
            accessibilityRole="button"
            accessibilityLabel={t(tile.key)}
          >
            <RNText style={styles.tileIcon}>{tile.icon}</RNText>
            <RNText style={[styles.tileLabel, { color: tile.color }]}>{t(tile.key)}</RNText>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: { gap: 12 },
  directionsBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  directionsText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    padding: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tileIcon: { fontSize: 20 },
  tileLabel: { fontSize: 16, fontWeight: '600' },
});
