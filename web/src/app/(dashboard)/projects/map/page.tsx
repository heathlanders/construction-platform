'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import maplibregl, { type Map as MlMap, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTenantChannel } from '@/lib/use-tenant-channel';

interface MapPin {
  id: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  geocode_status: string;
  county_name: string | null;
  city: string | null;
  state: string | null;
  percent_complete: number | null;
}

interface AssetPin {
  id: string;
  asset_number: string;
  name: string;
  asset_category: string;
  status: string;
  project_id: string;
  project_name: string;
  latitude: number;
  longitude: number;
}

interface CrewSite {
  project_id: string;
  project_name: string;
  latitude: number;
  longitude: number;
  clocked_in_count: number;
  workers: string[];
}

// Precise (GPS-captured) on-the-clock worker — Phase 6a / OQ-17 additive.
interface CrewWorker {
  punch_id: string;
  worker: string;
  latitude: number;
  longitude: number;
  project_name: string | null;
}

// Cross-tenant site pin (Doc 20 Phase 6b) — counterparty project.location events off the bridge.
interface CrossPin {
  connection_id: string;
  counterparty_name: string;
  project_name: string | null;
  lat: number;
  lng: number;
  status: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#3b82f6',
  completed: '#22c55e',
  on_hold: '#f59e0b',
  cancelled: '#ef4444',
};
const DEFAULT_COLOR = '#94a3b8';
const STATUS_KEYS = ['active', 'completed', 'on_hold', 'cancelled'] as const;

// $0 basemap — OpenStreetMap raster tiles, no key (pre-launch; see Project_Map spec §9).
const OSM_STYLE: maplibregl.StyleSpecification = {
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
};

function toGeoJSON(pins: MapPin[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      properties: {
        id: p.id, name: p.name, status: p.status,
        jurisdiction: [p.county_name, p.state].filter(Boolean).join(', '),
      },
    })),
  };
}

function assetsGeoJSON(assets: AssetPin[]): GeoJSON.FeatureCollection {
  // Spread co-located assets (same project coords) in a small ring so they don't stack invisibly.
  const byKey = new Map<string, number>();
  return {
    type: 'FeatureCollection',
    features: assets.map((a) => {
      const key = `${a.latitude},${a.longitude}`;
      const n = byKey.get(key) ?? 0;
      byKey.set(key, n + 1);
      const angle = (n * 2 * Math.PI) / 8;
      const r = n === 0 ? 0 : 0.0006 * (1 + Math.floor(n / 8));
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.longitude + r * Math.cos(angle), a.latitude + r * Math.sin(angle)] },
        properties: { id: a.id, label: `${a.asset_number} ${a.name}`, category: a.asset_category },
      };
    }),
  };
}

function crewGeoJSON(sites: CrewSite[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: sites.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
      properties: { project_id: s.project_id, count: s.clocked_in_count, workers: s.workers.join(', ') },
    })),
  };
}

function crossGeoJSON(pins: CrossPin[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        connection_id: p.connection_id,
        label: `${p.project_name ?? ''} · ${p.counterparty_name}`.replace(/^ · /, ''),
      },
    })),
  };
}

function crewWorkersGeoJSON(workers: CrewWorker[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: workers.map((w) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [w.longitude, w.latitude] },
      properties: { label: w.worker + (w.project_name ? ` · ${w.project_name}` : '') },
    })),
  };
}

type LayerKey = 'assets' | 'crew' | 'jurisdiction' | 'cross_tenant';

export default function ProjectMapPage() {
  const { t } = useTranslation('projects');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const mapReady = useRef(false);

  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ─── Layers (Doc 20 Phase 5) ─────────────────────────────────────────────
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ assets: false, crew: false, jurisdiction: false, cross_tenant: false });
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const [assets, setAssets] = useState<AssetPin[]>([]);
  const [crew, setCrew] = useState<CrewSite[]>([]);
  const [crewWorkers, setCrewWorkers] = useState<CrewWorker[]>([]);
  const [assetsGated, setAssetsGated] = useState(false); // 402 → Business+ upsell note
  const [crossPins, setCrossPins] = useState<CrossPin[]>([]);
  const [crossGated, setCrossGated] = useState(false); // 402 → cross_tenant add-on note

  const loadCrossPins = useCallback(() => {
    return fetch('/api/v1/connections/map')
      .then(async (r) => {
        if (r.status === 402) { setCrossGated(true); setCrossPins([]); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => { if (d?.pins) { setCrossGated(false); setCrossPins(d.pins as CrossPin[]); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!layers.cross_tenant) return;
    void loadCrossPins();
  }, [layers.cross_tenant, loadCrossPins]);

  // Realtime: a counterparty pin move arrives as a shared.event → refetch the layer.
  useTenantChannel((data) => {
    if (data.event_type === 'project.location' && layersRef.current.cross_tenant) void loadCrossPins();
  });

  useEffect(() => {
    if (!layers.assets) return;
    let cancelled = false;
    fetch('/api/v1/assets/map')
      .then(async (r) => {
        if (r.status === 402) { if (!cancelled) { setAssetsGated(true); setAssets([]); } return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => { if (!cancelled && d?.assets) { setAssetsGated(false); setAssets(d.assets as AssetPin[]); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [layers.assets]);

  useEffect(() => {
    if (!layers.crew) return;
    let cancelled = false;
    const load = () =>
      fetch('/api/v1/crew/map')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled || !d) return;
          if (d.sites) setCrew(d.sites as CrewSite[]);
          if (d.workers) setCrewWorkers(d.workers as CrewWorker[]);
        })
        .catch(() => {});
    load();
    const iv = setInterval(load, 60_000); // crew moves — refresh like the clock board
    return () => { cancelled = true; clearInterval(iv); };
  }, [layers.crew]);

  // ─── Data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    fetch(`/api/v1/projects/map${qs}`)
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => {
        if (!cancelled) setPins(d.projects ?? []);
      })
      .catch(() => !cancelled && setPins([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? pins.filter((p) => p.name.toLowerCase().includes(q)) : pins;
  }, [pins, search]);

  const selected = useMemo(
    () => visible.find((p) => p.id === selectedId) ?? null,
    [visible, selectedId],
  );

  const fitAll = useCallback((list: MapPin[]) => {
    const map = mapRef.current;
    if (!map || list.length === 0) return;
    const b = new maplibregl.LngLatBounds();
    list.forEach((p) => b.extend([p.longitude, p.latitude]));
    map.fitBounds(b, { padding: 64, maxZoom: 12, duration: 600 });
  }, []);

  // ─── Map init (once) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [-98.5, 39.5], // continental US
      zoom: 3,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('projects', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 12,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'projects',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#2563eb',
          'circle-opacity': 0.85,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'projects',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
        paint: { 'text-color': '#ffffff' },
      });
      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: 'projects',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'active', STATUS_COLORS.active,
            'completed', STATUS_COLORS.completed,
            'on_hold', STATUS_COLORS.on_hold,
            'cancelled', STATUS_COLORS.cancelled,
            DEFAULT_COLOR,
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Jurisdiction layer: county/state label under each pin (hidden until toggled).
      map.addLayer({
        id: 'jurisdiction-labels',
        type: 'symbol',
        source: 'projects',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'jurisdiction'],
          'text-size': 10,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          visibility: 'none',
        },
        paint: { 'text-color': '#374151', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
      });

      // Assets layer (Business+): amber squares at the assigned project's coords.
      map.addSource('assets', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'assets-pins',
        type: 'circle',
        source: 'assets',
        layout: { visibility: 'none' },
        paint: {
          'circle-color': '#d97706',
          'circle-radius': 5,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'assets-labels',
        type: 'symbol',
        source: 'assets',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 9,
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-optional': true,
          visibility: 'none',
        },
        paint: { 'text-color': '#92400e', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
      });

      // Crew layer (degraded — Doc 20 §6): green ring + on-the-clock count at project coords.
      map.addSource('crew', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'crew-pins',
        type: 'circle',
        source: 'crew',
        layout: { visibility: 'none' },
        paint: {
          'circle-color': '#16a34a',
          'circle-opacity': 0.25,
          'circle-radius': 14,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#16a34a',
        },
      });
      map.addLayer({
        id: 'crew-count',
        type: 'symbol',
        source: 'crew',
        layout: { 'text-field': ['to-string', ['get', 'count']], 'text-size': 11, visibility: 'none' },
        paint: { 'text-color': '#14532d' },
      });

      // Cross-tenant sites (Phase 6b): purple pins from counterparty project.location events.
      map.addSource('cross-tenant', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'cross-tenant-pins',
        type: 'circle',
        source: 'cross-tenant',
        layout: { visibility: 'none' },
        paint: {
          'circle-color': '#7c3aed',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'cross-tenant-labels',
        type: 'symbol',
        source: 'cross-tenant',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-optional': true,
          visibility: 'none',
        },
        paint: { 'text-color': '#5b21b6', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
      });

      // Precise workers (Phase 6a): solid green dots + name labels at GPS-captured punch coords.
      map.addSource('crew-workers', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'crew-worker-dots',
        type: 'circle',
        source: 'crew-workers',
        layout: { visibility: 'none' },
        paint: {
          'circle-color': '#16a34a',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'crew-worker-labels',
        type: 'symbol',
        source: 'crew-workers',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 10,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-optional': true,
          visibility: 'none',
        },
        paint: { 'text-color': '#14532d', 'text-halo-color': '#ffffff', 'text-halo-width': 1.2 },
      });

      // Click a cluster → zoom in.
      map.on('click', 'clusters', async (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        const clusterId = f.properties?.cluster_id;
        const src = map.getSource('projects') as GeoJSONSource;
        try {
          const zoom = await src.getClusterExpansionZoom(clusterId);
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        } catch {
          /* ignore */
        }
      });
      // Click a pin → select it.
      map.on('click', 'unclustered', (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelectedId(id);
      });
      for (const layer of ['clusters', 'unclustered']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }

      mapReady.current = true;
      const src = map.getSource('projects') as GeoJSONSource | undefined;
      src?.setData(toGeoJSON(pins));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapReady.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push data to the source whenever the visible set changes; fit on first load.
  const fittedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    const src = map.getSource('projects') as GeoJSONSource | undefined;
    src?.setData(toGeoJSON(visible));
    if (!fittedRef.current && visible.length > 0) {
      fittedRef.current = true;
      fitAll(visible);
    }
  }, [visible, fitAll]);

  // Push layer data + sync layer visibility with the toggles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    (map.getSource('assets') as GeoJSONSource | undefined)?.setData(assetsGeoJSON(layers.assets ? assets : []));
    (map.getSource('crew') as GeoJSONSource | undefined)?.setData(crewGeoJSON(layers.crew ? crew : []));
    (map.getSource('crew-workers') as GeoJSONSource | undefined)?.setData(crewWorkersGeoJSON(layers.crew ? crewWorkers : []));
    (map.getSource('cross-tenant') as GeoJSONSource | undefined)?.setData(crossGeoJSON(layers.cross_tenant ? crossPins : []));
    const vis = (ids: string[], on: boolean) =>
      ids.forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'));
    vis(['assets-pins', 'assets-labels'], layers.assets);
    vis(['crew-pins', 'crew-count', 'crew-worker-dots', 'crew-worker-labels'], layers.crew);
    vis(['jurisdiction-labels'], layers.jurisdiction);
    vis(['cross-tenant-pins', 'cross-tenant-labels'], layers.cross_tenant);
  }, [layers, assets, crew, crewWorkers, crossPins, visible]);

  const selectRow = useCallback((p: MapPin) => {
    setSelectedId(p.id);
    mapRef.current?.flyTo({ center: [p.longitude, p.latitude], zoom: 13, duration: 700 });
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header + filters */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-white">
        <div className="mr-auto">
          <h1 className="text-lg font-semibold">{t('map.title')}</h1>
          <p className="text-xs text-gray-500">{t('map.subtitle')}</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('map.search_placeholder')}
          className="border rounded px-3 py-1.5 text-sm w-48"
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">{t('map.filter_status')}:</span>
          <button
            onClick={() => setStatus('')}
            className={`px-2.5 py-1 text-xs rounded-full border ${status === '' ? 'bg-gray-900 text-white' : 'bg-white'}`}
          >
            {t('map.all')}
          </button>
          {STATUS_KEYS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1 text-xs rounded-full border ${status === s ? 'text-white' : 'bg-white'}`}
              style={status === s ? { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] } : undefined}
            >
              {t(`map.status.${s}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">{t('map.layers')}:</span>
          {(['assets', 'crew', 'jurisdiction', 'cross_tenant'] as LayerKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))}
              className={`px-2.5 py-1 text-xs rounded-full border ${layers[k] ? 'bg-gray-900 text-white' : 'bg-white'}`}
            >
              {t(`map.layer_${k}`)}
            </button>
          ))}
        </div>
        <button
          onClick={() => fitAll(visible)}
          className="px-3 py-1.5 text-xs rounded border bg-white hover:bg-gray-50"
        >
          {t('map.fit_all')}
        </button>
      </div>
      {layers.assets && assetsGated && (
        <div className="px-4 py-1.5 text-xs bg-amber-50 border-b border-amber-200 text-amber-800">
          {t('map.assets_gated')}
        </div>
      )}
      {layers.cross_tenant && crossGated && (
        <div className="px-4 py-1.5 text-xs bg-amber-50 border-b border-amber-200 text-amber-800">
          {t('map.cross_tenant_gated')}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* List panel (synced with the map) */}
        <aside className="w-72 shrink-0 border-r overflow-y-auto bg-white">
          <div className="px-3 py-2 text-xs text-gray-500 border-b">
            {t(visible.length === 1 ? 'map.list_count' : 'map.list_count_plural', { count: visible.length })}
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-500">{t('map.loading')}</div>
          ) : visible.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              <p>{t('map.empty')}</p>
              <p className="mt-2 text-xs">{t('map.empty_hint')}</p>
            </div>
          ) : (
            <ul>
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => selectRow(p)}
                    className={`w-full text-left px-3 py-2 border-b hover:bg-gray-50 ${selectedId === p.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[p.status] ?? DEFAULT_COLOR }}
                      />
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <div className="pl-4.5 text-xs text-gray-500">
                      {t(`map.status.${p.status}`, { defaultValue: p.status })}
                      {p.percent_complete !== null && ` · ${t('map.percent_complete', { pct: p.percent_complete })}`}
                      {p.geocode_status === 'approximate' && ` · ${t('map.approximate')}`}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Map */}
        <div className="relative flex-1 min-w-0">
          <div ref={containerRef} className="absolute inset-0" />

          {/* Legend */}
          <div className="absolute bottom-6 left-3 bg-white/95 rounded shadow px-3 py-2 text-xs">
            <div className="font-medium mb-1">{t('map.legend')}</div>
            {STATUS_KEYS.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                <span>{t(`map.status.${s}`)}</span>
              </div>
            ))}
          </div>

          {/* Slide-over mini-card */}
          {selected && (
            <div className="absolute top-3 right-3 w-72 bg-white rounded-lg shadow-lg border p-4">
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                aria-label="close"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[selected.status] ?? DEFAULT_COLOR }}
                />
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {t(`map.status.${selected.status}`, { defaultValue: selected.status })}
                </span>
              </div>
              <h2 className="text-base font-semibold mb-1">{selected.name}</h2>
              {selected.percent_complete !== null && (
                <p className="text-sm text-gray-600 mb-1">
                  {t('map.percent_complete', { pct: selected.percent_complete })}
                </p>
              )}
              {(selected.city || selected.county_name || selected.state) && (
                <p className="text-xs text-gray-500 mb-1">
                  {[selected.city, selected.county_name, selected.state].filter(Boolean).join(', ')}
                </p>
              )}
              {selected.geocode_status === 'approximate' && (
                <p className="text-xs text-amber-600 mb-2">{t('map.approximate')}</p>
              )}
              {layers.crew && (() => {
                const site = crew.find((c) => c.project_id === selected.id);
                return site ? (
                  <p className="text-xs text-green-700 mb-1">
                    {t('map.clocked_in', { count: site.clocked_in_count })} — {site.workers.slice(0, 4).join(', ')}
                    {site.workers.length > 4 ? '…' : ''}
                  </p>
                ) : null;
              })()}
              <Link
                href={`/projects/${selected.id}`}
                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
              >
                {t('map.open_project')} →
              </Link>
              <Link
                href={`/projects/${selected.id}/map`}
                className="inline-block mt-2 ml-3 text-sm text-blue-600 hover:underline"
              >
                {t('map.site_map')} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
