// NearMeScreen — Project Map Phase 4 (Doc 20 §5c): field "near me" view.
// GPS → projects sorted by distance, radius filter, list + map toggle, Directions handoff.
// Offline: pins cached in AsyncStorage (map:pins:{user}); no network → cached list (map degrades).
//
// NATIVE BOUNDARY: the map view uses @maplibre/maplibre-react-native (native module — ships in
// the 1.2.0 APK, not OTA). The import is a guarded runtime require so the screen NEVER crashes
// if the module is somehow absent — it falls back to list-only.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text as RNText, TouchableOpacity, StyleSheet, Linking, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { mobileApi } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useTheme } from '@/lib/theme-context';
import { Screen, Text, EmptyState, StatusBadge } from '@/components/ui';

// Guarded native require — null when the module isn't linked (pre-1.2.0 runtime).
let MapLibreGL: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@maplibre/maplibre-react-native');
  MapLibreGL = mod?.default ?? mod; // v10 CJS interop: components live on the default export
  MapLibreGL?.setAccessToken?.(null); // OSM tiles — no token
} catch {
  MapLibreGL = null;
}

const OSM_STYLE = JSON.stringify({
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
});

interface MapPin {
  id: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  geocode_status: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'NearMe'>;

const RADII = [10, 25, 50, 0] as const; // miles; 0 = all

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function NearMeScreen({ navigation }: Props) {
  const { t } = useTranslation('nearme');
  const { palette } = useTheme();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(25);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const cacheKey = useRef<string>('map:pins:anon');

  const load = useCallback(async () => {
    setLoading(true);
    const user = await getUser();
    cacheKey.current = `map:pins:${user?.user_id ?? 'anon'}`;
    try {
      const d = await mobileApi<{ projects: MapPin[] }>('/projects/map');
      const fresh = d.projects ?? [];
      setPins(fresh);
      setOffline(false);
      await AsyncStorage.setItem(cacheKey.current, JSON.stringify(fresh));
    } catch {
      // Offline / API unreachable → cached pins (list still works; tiles won't load).
      try {
        const cached = await AsyncStorage.getItem(cacheKey.current);
        if (cached) setPins(JSON.parse(cached) as MapPin[]);
      } catch { /* ignore */ }
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch { /* no GPS → unsorted list */ }
    })();
  }, [load]);

  const rows = useMemo(() => {
    const withDist = pins.map((p) => ({
      ...p,
      dist: me ? haversineMiles(me.lat, me.lng, p.latitude, p.longitude) : null,
    }));
    const filtered = radius > 0 && me ? withDist.filter((p) => (p.dist ?? 0) <= radius) : withDist;
    return filtered.sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));
  }, [pins, me, radius]);

  const directions = (p: MapPin) =>
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`);

  const mapAvailable = MapLibreGL !== null && !offline;

  return (
    <Screen>
      {/* Radius chips + view toggle */}
      <View style={styles.toolbar}>
        <View style={styles.chips}>
          {RADII.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRadius(r)}
              style={[styles.chip, { borderColor: palette.border }, radius === r && styles.chipActive]}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <RNText style={[styles.chipText, radius === r && styles.chipTextActive]}>
                {r === 0 ? t('all') : t('miles', { count: r })}
              </RNText>
            </TouchableOpacity>
          ))}
        </View>
        {mapAvailable && (
          <TouchableOpacity
            onPress={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
            style={[styles.chip, { borderColor: palette.border }]}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <RNText style={styles.chipText}>{view === 'list' ? '🗺 ' + t('map_view') : '☰ ' + t('list_view')}</RNText>
          </TouchableOpacity>
        )}
      </View>

      {offline && (
        <View style={styles.offlineBar}>
          <RNText style={styles.offlineText}>{t('offline_cached')}</RNText>
        </View>
      )}
      {!me && !loading && (
        <View style={styles.offlineBar}>
          <RNText style={styles.offlineText}>{t('no_gps')}</RNText>
        </View>
      )}

      {view === 'map' && mapAvailable ? (
        <View style={styles.mapWrap}>
          <MapLibreGL.MapView style={styles.map} styleJSON={OSM_STYLE} attributionEnabled>
            <MapLibreGL.Camera
              defaultSettings={{
                centerCoordinate: me ? [me.lng, me.lat] : [-98.5, 39.5],
                zoomLevel: me ? 9 : 3,
              }}
            />
            {me && (
              <MapLibreGL.PointAnnotation id="me" coordinate={[me.lng, me.lat]}>
                <View style={styles.meDot} />
              </MapLibreGL.PointAnnotation>
            )}
            {rows.map((p) => (
              <MapLibreGL.PointAnnotation
                key={p.id}
                id={p.id}
                coordinate={[p.longitude, p.latitude]}
                onSelected={() => directions(p)}
              >
                <View style={styles.pin} />
              </MapLibreGL.PointAnnotation>
            ))}
          </MapLibreGL.MapView>
        </View>
      ) : loading ? (
        <EmptyState icon="🧭" title={t('loading')} />
      ) : rows.length === 0 ? (
        <EmptyState icon="🗺" title={t('empty')} message={radius > 0 ? t('empty_radius_hint') : t('empty_hint')} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(p) => p.id}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id, projectName: p.name })}
            >
              <View style={styles.rowMain}>
                <Text variant="body" style={styles.rowName}>{p.name}</Text>
                <View style={styles.rowMeta}>
                  <StatusBadge status={p.status} />
                  {p.dist !== null && (
                    <RNText style={[styles.dist, { color: palette.textMuted }]}>
                      {t('away', { miles: p.dist < 10 ? p.dist.toFixed(1) : Math.round(p.dist) })}
                    </RNText>
                  )}
                  {p.geocode_status === 'approximate' && (
                    <RNText style={[styles.approx, { color: palette.textMuted }]}>{t('approximate')}</RNText>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => directions(p)}
                style={[styles.dirBtn, { borderColor: palette.border }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t('directions')}
              >
                <RNText style={styles.dirText}>🧭</RNText>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  chipActive: { backgroundColor: '#1e3a5f', borderColor: '#1e3a5f' },
  chipText: { fontSize: 12, color: '#374151' },
  chipTextActive: { color: '#ffffff' },
  offlineBar: { backgroundColor: '#fef3c7', borderRadius: 6, padding: 8, marginBottom: 8 },
  offlineText: { fontSize: 12, color: '#92400e' },
  mapWrap: { flex: 1, borderRadius: 10, overflow: 'hidden', minHeight: 400 },
  map: { flex: 1 },
  meDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563eb', borderWidth: 2, borderColor: '#fff' },
  pin: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#dc2626', borderWidth: 2, borderColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 8 },
  rowMain: { flex: 1 },
  rowName: { fontWeight: '600', marginBottom: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dist: { fontSize: 12 },
  approx: { fontSize: 11, fontStyle: 'italic' },
  dirBtn: { borderWidth: 1, borderRadius: 8, padding: 10, marginLeft: 10 },
  dirText: { fontSize: 18 },
});
