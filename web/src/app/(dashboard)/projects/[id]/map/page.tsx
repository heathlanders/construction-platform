'use client';

// Single-project site map (Doc 20 Phase 3 — spec §5b): site marker + AHJ jurisdiction info +
// on-site assets (assignment coords) + manual pin-drop correction (PATCH /v1/projects/:id/location,
// OWNER/PM). MapLibre GL + OSM raster (same $0 basemap as the portfolio map).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import maplibregl, { type Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Project {
  id: string;
  name: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county_fips: string | null;
  county_name: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  geocode_status: string | null;
  version: number;
}

interface Ahj {
  ahj_name?: string | null;
  ahj_level?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface AssetPin {
  id: string;
  asset_number: string;
  name: string;
  asset_category: string;
  status: string;
  project_id: string;
}

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

const EDIT_ROLES = ['owner', 'project_manager'];

export default function ProjectSiteMapPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('projects');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [ahj, setAhj] = useState<Ahj | null>(null);
  const [assets, setAssets] = useState<AssetPin[]>([]);
  const [role, setRole] = useState<string>('');
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const canEdit = EDIT_ROLES.includes(role);

  // ─── Data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/v1/projects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.project) setProject(d.project as Project); })
      .catch(() => {});
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRole(String(d?.role ?? '').toLowerCase()))
      .catch(() => {});
    fetch('/api/v1/assets/map')
      .then((r) => (r.ok ? r.json() : null)) // 402 (Starter/Pro) → null → section hidden
      .then((d) => {
        if (Array.isArray(d?.assets)) setAssets((d.assets as AssetPin[]).filter((a) => a.project_id === id));
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!project?.state) return;
    const params = new URLSearchParams({ state: project.state });
    if (project.city) params.set('city', project.city);
    if (project.county_fips) params.set('county_fips', project.county_fips);
    fetch(`/api/jurisdictions/ahj?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAhj((d?.ahj as Ahj) ?? null))
      .catch(() => {});
  }, [project?.state, project?.city, project?.county_fips]);

  const lat = project?.latitude === null || project?.latitude === undefined ? null : Number(project.latitude);
  const lng = project?.longitude === null || project?.longitude === undefined ? null : Number(project.longitude);

  // ─── Map init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current || !project) return;
    const hasCoords = lat !== null && lng !== null;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: hasCoords ? [lng!, lat!] : [-98.5, 39.5],
      zoom: hasCoords ? 15 : 3,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    if (hasCoords) {
      const marker = new maplibregl.Marker({ color: '#2563eb', draggable: canEdit })
        .setLngLat([lng!, lat!])
        .addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLngLat();
        setPending({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = marker;
    }

    // No coords yet (failed/pending geocode): OWNER/PM click-to-place.
    map.on('click', (e) => {
      if (!canEdit) return;
      if (!markerRef.current) {
        const marker = new maplibregl.Marker({ color: '#2563eb', draggable: true })
          .setLngLat(e.lngLat)
          .addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLngLat();
          setPending({ lat: p.lat, lng: p.lng });
        });
        markerRef.current = marker;
        setPending({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, canEdit]);

  const savePin = useCallback(async () => {
    if (!project || !pending) return;
    setSaving(true);
    setNotice('');
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: pending.lat, longitude: pending.lng, version: project.version }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409) { setNotice(t('map.site.conflict')); return; }
      if (!res.ok) { setNotice(data?.error?.message ?? t('map.site.save_failed')); return; }
      setProject(data.project as Project);
      setPending(null);
      setNotice(t('map.site.saved'));
      setTimeout(() => setNotice(''), 3000);
    } catch {
      setNotice(t('map.site.save_failed'));
    } finally {
      setSaving(false);
    }
  }, [project, pending, t]);

  const discardPin = useCallback(() => {
    setPending(null);
    const m = markerRef.current;
    if (m && lat !== null && lng !== null) m.setLngLat([lng, lat]);
  }, [lat, lng]);

  if (!project) {
    return <div className="p-6 text-sm text-gray-400">{t('map.loading')}</div>;
  }

  const addressLine = [project.address, project.city, project.state, project.zip].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-white">
        <div className="mr-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href={`/projects/${project.id}`} className="hover:text-gray-900">{project.name}</Link>
            <span>/</span>
            <span className="text-gray-900">{t('map.site.title')}</span>
          </div>
          {addressLine && <p className="text-xs text-gray-500 mt-0.5">{addressLine}</p>}
        </div>
        {project.geocode_status === 'approximate' && (
          <span className="text-xs px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">
            {t('map.approximate')}
          </span>
        )}
        {project.geocode_status === 'failed' && lat === null && (
          <span className="text-xs px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700">
            {t('map.site.no_location', { context: canEdit ? 'editor' : undefined })}
          </span>
        )}
        {pending && canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={savePin}
              disabled={saving}
              className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t('map.site.saving') : t('map.site.save_pin')}
            </button>
            <button onClick={discardPin} className="px-3 py-1.5 text-xs rounded border bg-white hover:bg-gray-50">
              {t('map.site.discard')}
            </button>
          </div>
        )}
        {notice && <span className="text-xs text-gray-600">{notice}</span>}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="relative flex-1 min-w-0">
          <div ref={containerRef} className="absolute inset-0" />
        </div>

        {/* Info rail: AHJ + on-site assets */}
        <aside className="w-80 shrink-0 border-l overflow-y-auto bg-white p-4 space-y-5">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              {t('map.site.jurisdiction')}
            </h2>
            {project.county_name || project.state ? (
              <p className="text-sm text-gray-800 mb-1">
                {[project.city, project.county_name, project.state].filter(Boolean).join(', ')}
              </p>
            ) : (
              <p className="text-sm text-gray-500">{t('map.site.no_jurisdiction')}</p>
            )}
            {ahj?.ahj_name && (
              <div className="mt-2 rounded border border-green-200 bg-green-50 p-3 text-sm">
                <p className="font-medium text-green-900">{ahj.ahj_name}</p>
                {ahj.ahj_level && <p className="text-xs text-green-800 capitalize">{t('map.site.ahj_level', { level: ahj.ahj_level })}</p>}
                {ahj.phone && <p className="text-xs text-green-800 mt-1">{ahj.phone}</p>}
                {ahj.address && <p className="text-xs text-green-800">{ahj.address}</p>}
              </div>
            )}
          </section>

          {assets.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {t('map.site.assets_on_site', { count: assets.length })}
              </h2>
              <ul className="space-y-1">
                {assets.map((a) => (
                  <li key={a.id} className="text-sm">
                    <Link href={`/assets/${a.id}`} className="text-blue-600 hover:underline">
                      {a.asset_number}
                    </Link>{' '}
                    <span className="text-gray-700">{a.name}</span>
                    <span className="text-xs text-gray-500"> · {a.asset_category.replace(/_/g, ' ')} · {a.status.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {canEdit && (
            <p className="text-xs text-gray-400">
              {lat === null ? t('map.site.place_hint') : t('map.site.drag_hint')}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
