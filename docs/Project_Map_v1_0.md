# Project Map — Feature Specification v1.0
**"The Operating System for Construction" — Google-Maps-style Portfolio & Field Map**

> **Status:** Phases 1–5 + 6a BUILT and shipped (1.2.0 APK live). **Phase 6b cross-tenant site layer BUILT (2026-07-18, PR #27)** — `project.location` bridge events (accept / pin-drop / geocode) → `GET /v1/connections/map` (T-45 membership in WHERE, whitelisted payload, addon 402) → purple "Connected sites" portfolio-map layer. Sub sees GC sites; GC side empty until sub→GC publishing (deferred). Remaining: geofence enforcement (OQ-17 product decision). Created 2026-07-17.
> **Scope:** A map surface (web + mobile) to see every project geographically, filter/cluster,
> drill into a site, and — for the field — find nearest jobs and get directions. Enterprise value:
> a multi-project GC sees its whole portfolio on one map.
> **Decisions in force:** A-03 (RLS), A-06/T-05 (no direct key exposure principle), T-02 (cents N/A),
> T-03 (UUIDs), T-12 (optimistic lock on new writable cols), P-02 (cross-tenant), OQ-09 (US-only launch),
> OQ-17 (GPS/geofence — partial dependency for crew layer).
> **No tier gate on the map itself.** Asset layer inherits Business+ (T-56); crew layer inherits time
> tracking (no gate).

---

## 0. Scope decisions (settled 2026-07-17)

| Decision | Choice | Note |
|----------|--------|------|
| Platforms | **Web + mobile, equal priority** | Office portfolio (web) + field near-me (mobile) both v1. |
| Layers v1 | **Projects + Assets + Jurisdiction/AHJ + Crew** | Projects is the base; others are toggles. |
| Geocoding | **US Census Geocoder** | Free, no key, US-only. Fallback → county centroid. |
| Map render | **MapLibre GL (web) + MapLibre RN (mobile) + OSM tiles** | $0, no key, no billing account. |
| Cross-tenant | **Included in v1** | GC sees connected Subs' site locations via the bridge. Note: P-02 makes cross-tenant user-accessible at v1.1 platform-wide — this layer ships behind the same connection gate. |
| Real-traffic tile hosting | **TABLED** | OSM public tiles for pre-launch/Example Builders pilot only. Self-host / MapTiler / Protomaps before scale — see §9. |

---

## 1. Data model changes

### `projects` — add geocode columns (migration TBD)
| Column | Type | Notes |
|--------|------|-------|
| latitude | NUMERIC(9,6) | Nullable. Set by geocode worker. |
| longitude | NUMERIC(9,6) | Nullable. |
| geocode_status | TEXT | CHECK ('pending','exact','approximate','failed'). `approximate` = county-centroid fallback. |
| geocoded_at | TIMESTAMPTZ | Last successful geocode. |

Index: `(tenant_id, latitude, longitude) WHERE deleted_at IS NULL` (bbox queries).
No `version` change needed (worker-set, not client-writable).

### `time_punches` — add capture coords (crew layer; migration TBD)
| Column | Type | Notes |
|--------|------|-------|
| clock_in_lat / clock_in_lng | NUMERIC(9,6) | Nullable. Captured at clock-in when device grants GPS. |

> **Dependency:** crew layer needs a location on the punch. This is the additive, non-enforcing half
> of OQ-17 (geofence enforcement stays deferred). Capture only — no blocking. If GPS denied, punch
> still succeeds with null coords → not shown on map.

### `company_assets` — already has `home_location` TEXT (yard address)
Geocode it the same way (reuse worker) OR derive asset map position from its active
`asset_project_assignments` → project coords. v1: use project-assignment coords (already geocoded);
geocoding free-text `home_location` is a fast-follow.

---

## 2. Geocoding (server-side, US Census)

- **Provider:** US Census Geocoding Services (`geocoding.geo.census.gov`). Free, no key, no billing.
  One-line address → lat/lng + matched county FIPS (bonus: can cross-check `projects.county_fips`).
- **Worker:** `api/src/workers/geocode-worker.ts`, job `geocode.project` (+ later `geocode.asset`).
  - Fires on project **create** and on address-field **PATCH**.
  - Envelope carries `tenant_id` (T-10), runs under `withTenantContext()` (T-42).
  - Success → store lat/lng, `geocode_status='exact'`, `geocoded_at=NOW()`.
  - Miss → fallback to **county centroid** (jurisdiction engine / `counties` table has FIPS; centroid
    from a static FIPS→centroid table or `zip_county` primary city) → `geocode_status='approximate'`.
  - Hard fail → `geocode_status='failed'`, surfaced in UI as "location not set" + manual pin-drop.
- **Caching:** geocode once, store forever. Only new/changed addresses hit the API → near-zero load.
- **Backfill:** `api/src/scripts/backfill-project-geocode.ts` (dry-run → `--apply`), mirrors
  `backfill-project-names.ts`. Iterates tenants (RLS), geocodes any `latitude IS NULL`.
- **Caveat:** Census is US-only + higher rural miss rate. Acceptable — US-only at launch (OQ-09).
  Manual pin-drop (drag marker → save lat/lng) is the escape hatch for misses.

---

## 3. Map rendering (MapLibre GL + OSM)

- **Web:** `maplibre-gl` (npm). Native clustering via GeoJSON source `cluster: true` — no supercluster
  dep. Renders OSM raster tiles (or a free vector style).
- **Mobile:** `@maplibre/maplibre-react-native`. **Native module → EAS build required** (not OTA-shippable).
  First map release crosses a native boundary → users need the new APK (like the 1.1.0 bump).
- **Tiles:** OpenStreetMap public tile server for pre-launch. `attribution` required (© OpenStreetMap).
- **No API key, no client-side secret** — sidesteps the Google-key-exposure problem entirely.

---

## 4. API

All `/v1`, `withTenantContext`, `User-Agent`, JWT. Read = any authed org user (map is read-only).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/v1/projects/map` | Lightweight pins for the viewport. Query: `bbox=minLng,minLat,maxLng,maxLat`, `status`, `trade`, `pm`, `layers`. Returns **slim** `{id,name,status,lat,lng,pct,geocode_status}` — NOT the full project payload. |
| GET | `/v1/assets/map` | Asset positions (Business+ gate). From active project assignments' coords. |
| GET | `/v1/crew/map` | Clocked-in punches with coords (open punches, today). Ties to `time-punches`. |
| GET | `/v1/map/cross-tenant` | Connected Subs' project sites (connection-gated, T-45). Slim payload, no internal Sub data. |
| PATCH | `/v1/projects/:id/location` | Manual pin-drop / correction → sets lat/lng, `geocode_status='exact'`, `geocoded_at`. Optimistic lock. OWNER/PM. |

Bbox filtering server-side keeps payloads small at enterprise scale. `layers` param lets one call
scope what's returned.

---

## 5. Views & front-end actions

### 5a. Web — Portfolio map (office: Owner, PM)
- Route `web/src/app/(dashboard)/projects/map/page.tsx`. Top-level "🗺 Map" nav entry.
- All projects as status-colored pins (`project_status` → color, reuse Overview `STATUS_COLORS`).
- **Cluster** when zoomed out (enterprise = 100s of pins).
- **Split view:** map ↔ project list, synced (hover list row → highlight pin; click pin → scroll list).
- Pin click → **slide-over** mini-card (Session 25-26 pattern): name, status, PM, %complete, address,
  deep-link "Open project".
- **Filter chips:** status · trade module · assigned PM · date range.
- **Layer toggles:** Projects / Assets / Crew / Jurisdiction.
- **"Fit to all"** button (auto-zoom bounds to every pin).
- Search box: address or project name → recenter.
- Bounding-box / radius select → filter list to visible pins.
- i18n `projects.map.*` chrome EN+ES.

### 5b. Web — Single-project map tab
- Small map on project detail: site marker + AHJ jurisdiction info (already have county/city snapshot)
  + on-site assets (assignment coords). Manual pin-drop correction here (PATCH `/location`).

### 5c. Mobile — Near-me (field: Foreman, Field Tech)
- Bottom-nav "Map" entry (role-gated via `tileManifest`).
- GPS → projects sorted by distance, radius filter, list + map toggle.
- Tap pin → card → **"Directions"** hand-off to native Google/Apple Maps (free; no in-app routing).
- **Offline:** cache last-known pins in WatermelonDB; tiles degrade (show cached region / list only).
  Full offline tiles = out of scope v1.

### 5d. Mobile — Single-project map
- Site marker + directions handoff on the project detail screen.

### Front-end action inventory
pan/zoom/cluster · search (address+project) · filter chips · layer toggles · pin→slide-over ·
list↔map sync · fit-bounds · radius/bbox select · manual pin-drop (web) · directions handoff (mobile) ·
"near me" GPS sort (mobile)

---

## 6. Layers detail

| Layer | Source | Gate | Dependency |
|-------|--------|------|-----------|
| **Projects** | `projects.lat/lng` | none | geocode worker |
| **Assets** | active `asset_project_assignments` → project coords | Business+ (T-56) | asset module |
| **Jurisdiction/AHJ** | permit / project jurisdiction snapshot (county/city + AHJ block) | none | jurisdiction engine (built) |
| **Crew / clocked-in** | open `time_punches` w/ `clock_in_lat/lng` | none | **needs punch GPS capture (§1) — OQ-17 additive half** |

Crew is the only layer with a new capture dependency. If we punt punch-GPS, crew layer degrades to
"projects with someone clocked in" (marker on project coords, no precise worker location) — still useful,
zero new capture. Recommend shipping that degraded crew first, precise-GPS crew as fast-follow.

---

## 7. Cross-tenant (included v1, connection-gated)

- GC sees connected Subs' **site locations only** — name + coords + status, NO internal Sub data
  (T-17 payload-scoping principle).
- Flows through the bridge: Sub project geo published to `shared_project_events`
  (`event_type: 'project.location'`), read by the GC after connection-membership validation (T-45).
- Sub data NEVER lands in GC tables (A-07). Map query for the GC joins its own projects + the
  connection-scoped shared events.
- Same connection gate as the rest of cross-tenant — surfaces only where a `tenant_connections` row
  is `active`.
- ⚠️ P-02 makes cross-tenant user-accessible at v1.1 platform-wide. This layer is built now but rides
  the same enablement flag — do not expose ahead of the platform-wide cross-tenant switch.

---

## 8. RLS / security

- `/v1/projects/map` is a normal tenant-scoped query — own projects only, RLS enforced.
- Cross-tenant map path uses the bridge + connection validation, never a raw cross-tenant join.
- No client-side map key (MapLibre + OSM) → nothing to leak.
- Manual pin-drop PATCH is OWNER/PM, optimistic-locked, audited (`project.location_updated`).

---

## 9. Real-traffic tile hosting — TABLED (revisit before scale)

OSM's public tile server is **not for production traffic** (usage policy caps + no SLA). Fine for
pre-launch / Example Builders pilot. Before real load, pick one — decision deferred:
- **Self-host tiles** — add a tile container to the Docker stack (Protomaps single-file, or tileserver-gl).
  Truly free, full control, more ops.
- **MapTiler free tier** — ~100k loads/mo, needs a key (re-introduces key management).
- **Protomaps on object storage** — single `.pmtiles` file on DO Spaces/S3, served range-request, $0-ish.

Geocoding (Census) has no such limit — stays free at scale.

---

## 10. Phased build

| Phase | Scope |
|-------|-------|
| **1 — Foundation** ✅ BUILT | `projects` geocode cols + `geocode-worker` (Census + county fallback) + backfill script + manual pin-drop PATCH. Migration 0036. |
| **2 — Web portfolio** ✅ BUILT | `/v1/projects/map` (bbox/status/trade/pm filter) + MapLibre page (`projects/map/page.tsx`, OSM raster, native GeoJSON clustering) + slide-over + list↔map sync + status filter chips + search + fit-to-all + legend + i18n `projects.map.*` (EN+ES) + sidebar "Map" nav. |
| **3 — Single-project map** ✅ BUILT | Web `projects/[id]/map` page (site marker, AHJ box via `/jurisdictions/ahj`, on-site assets, OWNER/PM drag/click pin-drop → PATCH `/location`) + "🗺 Site Map" project tile; mobile `ProjectDetailScreen` 🧭 Directions handoff (Google Maps URL, coords from `GET /projects/:id` — now returns lat/lng/geocode_status). |
| **4 — Mobile near-me** ✅ BUILT | `NearMeScreen` (GPS distance sort, 10/25/50/all-mi radius chips, list↔map toggle, Directions, AsyncStorage offline pin cache; MapLibre RN v10 behind a guarded require) + `nav.map` manifest action. **1.2.0 APK** published to get.thejobsite.app (runtime bump — devices reinstall once; MapLibre config plugin DROPPED: its withPodfile call breaks this SDK, Android autolinks without it). |
| **5 — Layers** ✅ BUILT | `GET /v1/assets/map` (active assignments → project coords, Business+ 402) + `GET /v1/crew/map` (DEGRADED crew: open punches grouped per project + counts/names, 60s refresh) + jurisdiction county/state labels (slim payload now carries county/city/state). Portfolio-map layer toggles + co-located asset ring-spread + crew rings + slide-over jurisdiction/crew info. Tests `map-layers.test.ts` (4). |
| **6 — Crew GPS + cross-tenant** — **6a BUILT** | ✅ 6a: `time_punches.clock_in_lat/lng` (migration 0038, capture-only, never blocks a punch), web browser-GPS + mobile expo-location capture at clock-in (silent best-effort, 4s timeout), `/v1/crew/map` adds precise `workers[]` (GPS punches, project optional), portfolio crew layer renders worker dots + name labels alongside the degraded rings. ✅ 6b cross-tenant site layer (PR #27, 2026-07-18): `publishProjectLocationForProject` in `bridge.ts` fires on accept + `PATCH /projects/:id/location` + geocode-worker; `GET /v1/connections/map` = latest counterparty `project.location` pin per active connection; web `cross_tenant` layer + gated banner + realtime refetch. Remaining: geofence ENFORCEMENT (OQ-17 deferred decision) + sub→GC location publishing. |

---

## 11. Open questions

| # | Question | Lean |
|---|----------|------|
| MQ-1 | County-centroid source for `approximate` fallback. | **RESOLVED** — add `centroid_lat`/`centroid_lng` to existing `counties` table (no-RLS ref, Domain 16); ingest from Census **Gazetteer county file** via a script mirroring `import-zip-county.ts`. |
| MQ-2 | Precise crew-GPS now, or ship degraded crew (project-marker) first? | Degraded first; GPS in Phase 6. |
| MQ-3 | Geocode free-text `asset.home_location`, or derive asset position from project assignment only? | Assignment-only v1; geocode home_location fast-follow. |
| MQ-4 | Offline map tiles on mobile (cached region) v1 or later? | Later — list + cached pins v1, no offline tiles. |

---

*Spec version: 1.0 — 2026-07-17 — PLANNING*
