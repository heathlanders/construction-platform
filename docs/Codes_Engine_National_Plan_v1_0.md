# Codes Engine — National Scale-Out Plan v1.0
**"The Operating System for Construction" — Jurisdiction & Codes Engine, all 50 states + DC**

> **Status:** Planning doc — approved scope (Session 36, 2026-06-21), not yet built.
> **Goal:** Take the jurisdiction/codes engine from the Wisconsin/Dane-County pilot to a
> flexible, dynamic engine covering the entire United States, backed by a storage system
> built to hold a large and growing volume of reference data.
> **Locked context:** A-11 (Fastify), A-02/A-03 (Postgres + RLS), T-59 (one trade-aware
> permits table), jurisdiction engine (migration 0019, memory `jurisdiction_engine`).

---

## 0. Decisions locked (Session 36)

| # | Decision | Rationale |
|---|----------|-----------|
| D-1 | **Reference data lives in Postgres platform-scoped (NO-RLS) tables.** | "Storage engine for a lot of data." Editable without deploy, queryable, admin-UI-able, grows to any size. Mirrors `tenants`/`platform_admins`/`tenant_subscriptions` (no RLS). |
| D-2 | **Bulk geo + storage refactor first.** | Build the store + ingest the full US ZIP→county crosswalk + verify 51 state editions. AHJ/amendment curation rides on top as ongoing data-ops. |
| D-3 | **Versioned + manual review for data freshness.** | Every reference row carries `source` + `last_verified`. Updates are deliberate, reviewed entries. Permits keep their frozen snapshot. No auto-scraping in v1. |

---

## 1. Current state (ground truth — Session 36 audit)

All code data is **inline TypeScript** (~188 KB, zero DB). The engine itself is well-built;
the gap is **data coverage + storage scale**, not engine design.

| Layer | What exists | US coverage |
|-------|-------------|-------------|
| **Trade code editions** | `electrical/plumbing/mechanical/building-codes/*-editions.ts` — code family + edition + amendment notes | **All 51** (50 states + DC) ✅ |
| **National inspection sequences** | `*-codes/inspection-sequences.ts` — 5-step (E/P/M), 7-step (building) | All building types ✅ |
| **Jurisdiction engine** | `jurisdictions/` — pure cascade city→county→state→national, sparse overrides, append amendment notes, sequence-ops (add/remove/modify/replace_all) | Architecturally national ✅ |
| **Local override layers** | `jurisdictions/seed/wi-*.ts` | **WI only** — 5 layers (state + Dane + Madison/Stoughton/Windsor) |
| **ZIP→county** | `jurisdictions/zip-county.ts` | **21 ZIPs** (Madison area) |
| **AHJ contact blocks** | inside seed layers | **4 cities** |

**Permits freeze the resolved snapshot** (`jurisdiction_key`, geo, `ahj_level`) at creation —
historical continuity is already correct (migration 0019). Keep this.

---

## 2. The real problem: data, in two very different sizes

The engine's cascade + sparse-override model already scales. What does not scale is
**hand-written TypeScript holding bulk data**, and what does not yet exist is the **data itself**.

| Data layer | US scale | Source | Difficulty |
|------------|----------|--------|------------|
| State code editions | 51 × 4 trades = ~204 rows | already have it | **done** |
| **ZIP → county crosswalk** | **~41,000 ZIPs / 3,143 counties** | public — HUD USPS crosswalk / Census | bulk ingest, easy, one-time |
| **Local AHJ contacts + home-rule amendments** | **~19,500 incorporated places** | **no clean national dataset** — curate per jurisdiction | perpetual data-ops |

Consequence for "works for the entire US":
- **Achievable now (Phases 1–3):** full ZIP→county so any US address auto-resolves a county,
  on top of national-default codes that already answer every US permit. The *engine* becomes
  national.
- **Forever-growing (Phase 4+):** accurate local AHJ + amendments. The engine already supports
  it via sparse overrides; the bottleneck is **data sourcing, not code.** National defaults are
  the safety net everywhere unseeded.

Inline TS cannot hold 41k ZIPs + thousands of AHJs: JS bundle bloat, multi-thousand-line diffs,
deploy-to-edit. Hence D-1 (Postgres).

---

## 3. Target architecture

**Invariant: the engine stays pure.** `resolveJurisdiction()` / `merge.ts` cascade logic do not
change. Only the **loader** changes — from inline TS imports to a DB-backed in-memory cache.
Public route response shapes are unchanged → **no web/mobile changes required.**

```
                 ┌─────────────────────────── Postgres (platform-scoped, NO RLS) ─────────┐
                 │ code_editions   jurisdiction_layers   zip_county   counties            │
                 └───────────────┬───────────────────────────┬───────────────────────────┘
   boot / refresh()              │ (small, hot)               │ (41k, cold — on-demand query)
                                 ▼                            ▼
                       reference-store.ts (in-memory cache)   deriveCountyFromZip()
                                 │                            │
   registry.findLayers() ◀───────┤      default-layer.resolveDefaultTradeCode() ◀──┘
                                 ▼
                       resolveJurisdiction()  ← PURE, unchanged
                                 ▼
        /v1/jurisdictions/*,  POST /v1/permits,  blueprint permit-milestone injection
```

- **Hot tables cached in memory at boot** (`code_editions` ~204 rows, `jurisdiction_layers`
  thousands): load once, `refresh()` to reload after edits. Keeps resolution I/O-free and fast.
- **`zip_county` (~41k) queried on demand**: ZIP lookup happens only at permit/project creation
  (low frequency). The engine never needed ZIP — callers resolve county *before* calling the
  engine, so this stays outside the pure core.

---

## 4. Schema (migration 0020)

Four platform-scoped tables. **No RLS** (reference data, not tenant-owned — mirror `tenants`).
Every curated table carries `source` + `last_verified` (D-3).

```sql
-- Replaces the 4 *-editions.ts libs. Runtime source of truth for code family/edition per state.
CREATE TABLE code_editions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade         TEXT NOT NULL CHECK (trade IN ('electrical','plumbing','mechanical','building')),
  state_code    CHAR(2) NOT NULL,
  code_type     TEXT NOT NULL,            -- 'NEC','IPC','UPC','IMC','UMC','IRC','IBC'
  code_edition  TEXT,                     -- '2020','2021'
  nec_edition   TEXT,                     -- electrical only; NULL otherwise
  notes         TEXT,                     -- amendment / home-rule notes (appended in cascade)
  source        TEXT,
  last_verified DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trade, state_code)
);

-- Full US ZIP↔county crosswalk. Multi-county aware (a ZIP can span counties).
CREATE TABLE zip_county (
  zip          CHAR(5) NOT NULL,
  county_fips  CHAR(5) NOT NULL,
  county_name  TEXT NOT NULL,
  state_code   CHAR(2) NOT NULL,
  primary_city TEXT,
  ratio        NUMERIC,                   -- HUD res_ratio; primary county = max(ratio) per zip
  PRIMARY KEY (zip, county_fips)
);
CREATE INDEX idx_zip_county_zip ON zip_county(zip);

-- FIPS reference (~3,143). Validation + UI pickers.
CREATE TABLE counties (
  county_fips CHAR(5) PRIMARY KEY,
  county_name TEXT NOT NULL,
  state_code  CHAR(2) NOT NULL
);
CREATE INDEX idx_counties_state ON counties(state_code);

-- Replaces seed/*.ts override layers. AHJ + amendments + sequence_ops as JSONB.
CREATE TABLE jurisdiction_layers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level         TEXT NOT NULL CHECK (level IN ('state','county','city')),
  state_code    CHAR(2),
  county_fips   CHAR(5),
  county_name   TEXT,
  city_name     TEXT,                     -- normalized (lowercased, prefixes stripped)
  ahj           JSONB,                    -- AhjMetadata
  codes         JSONB,                    -- Partial<Record<Trade, TradeCodeOverride>>
  notes         TEXT,
  source        TEXT,
  last_verified DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_jurisdiction_layers_match ON jurisdiction_layers(state_code, county_fips, city_name);

-- NO RLS on any of the four — platform reference data, accessed by validated requests.
```

National default **inspection sequences** stay in TS (`*-codes/inspection-sequences.ts`) — they
are the baseline; local deviations ride in `jurisdiction_layers.codes.<trade>.sequence_ops`,
already supported by `merge.ts`.

---

## 5. Phased delivery

### Phase 1 — Storage schema ✅ DONE (Session 36, 2026-06-21)
- ✅ Migration `0020_codes_reference_store` written + applied (the four tables above, no RLS).
  Verified in DB: all four tables exist with `relrowsecurity = f`, `relforcerowsecurity = f`.
- ✅ Prisma models added (`CodeEdition`, `ZipCounty`, `County`, `JurisdictionLayer`); `prisma validate`
  clean; client regenerated.
- ✅ `docs/Schema_Reference.md` Domain 16 added + index summary rows. Plan status updated.

### Phase 2 — Loader swap + migrate existing data (behavior-preserving) ✅ DONE (Session 37, 2026-06-22)
- ✅ New `api/src/lib/jurisdictions/reference-store.ts`:
  - `loadReferenceCache()` at boot — pulls `code_editions` + `jurisdiction_layers` into memory
    (sync getters `getCachedEdition`/`getCachedLayers`; layer normalization moved here from registry).
  - `refreshReferenceCache()` — reload after edits.
  - `lookupZipCounty(zip)` — on-demand `zip_county` query (primary = max ratio).
- ✅ Repointed, **cascade/merge untouched**:
  - `registry.ts` `findLayers()`/`listStateJurisdictions()` → `getCachedLayers()` (was `SEED_LAYERS`).
  - `default-layer.ts` → code family/edition/notes from `getCachedEdition()`; inspection sequences
    still TS (national defaults). `resolveJurisdiction()` stays pure + synchronous.
  - `zip-county.ts` `deriveCountyFromZip()`/`repairOcrZip()` → **async**, DB-backed via `lookupZipCounty`.
    Callers updated (`permits.ts`, `blueprint-worker.ts` `buildLocationSuggestion` now async) — all
    were already in async contexts.
- ✅ Boot: `index.ts` `await loadReferenceCache()` before `listen()`.
- ✅ Shared pure builder `api/src/lib/jurisdictions/ts-seed-source.ts` (one source for CLI seeds + test seeder).
  Seed scripts in `api/src/scripts/`: `seed-code-editions.ts` (4 libs → `code_editions` 204 rows +
  `counties` baseline), `seed-jurisdiction-layers.ts` (`seed/wi-*.ts` → 5 layers),
  `seed-zip-county.ts` (WI pilot → 18 ZIPs). npm: `seed:code-editions` / `seed:jurisdiction-layers` /
  `seed:zip-county` (dry-run; `-- --apply` to write) + `seed:codes-reference` (all three, apply).
- ✅ Tests: `jurisdictions.test.ts` + `blueprint-ocr.test.ts` `beforeAll` seed the test DB
  (`test/seed-reference.ts`) + `loadReferenceCache()`; async zip fns awaited. 26/26 pass against the
  real test DB — parity confirmed (WI AHJ cascade, sequence_ops, editions, ZIP repair).
- ✅ Dev DB seeded + api rebuilt; live in-container resolve verified (WI Madison cascade + SPS316
  notes + erosion_control + edition 2015; TX national fallback NEC/IBC, no AHJ).
- **Routes + response shapes unchanged.** TS `*-editions.ts` libs kept as seed source (also still read
  by the read-only `*-codes` routes) — retire in a later cleanup.

### Phase 3 — Bulk US geo ingest ✅ DONE (Session 37, 2026-06-22)
- ✅ `api/src/scripts/import-zip-county.ts` — pure header-indexed parsers (`parseCounties`,
  `parseZctaCounty`) + batched upsert. `npm run import:zip-county -- --fetch [--apply]`
  (or `--zcta=<path> --counties=<path>` for local files).
- **Source = free, no-auth Census data** (HUD's USPS crosswalk is API-token-gated):
  - `counties` ← Census `national_county2020.txt` (3,235 rows; `county_fips`=STATEFP+COUNTYFP).
  - `zip_county` ← Census **ZCTA↔county 2020 relationship file** (46,960 pairs / 33,791 ZIPs).
    Primary county per ZIP = max **land-area** ratio (`AREALAND_PART / Σpart`); HUD's
    residential-address ratio is marginally better but token-gated. ZCTA ≈ ZIP (PO-box-only ZIPs
    absent — no buildable address). Multi-county ZIPs keep every row.
  - Seeded `primary_city` hints (WI pilot) preserved via `COALESCE` on upsert.
- ✅ Applied to dev DB; live verified: 90210→Los Angeles County CA, 10001→New York County NY,
  53527→Dane (Cottage Grove hint kept), 00000→null. Unit test `import-zip-county.test.ts` (4 cases,
  no network/DB). **"Works for the entire US" is now true at the engine level** — any US address
  auto-resolves a county on top of the national-default codes that already answer every permit.
- Note: the shared test DB == dev DB, so the `jurisdictions.test.ts` "non-existent zip" case uses
  `00000` (a real ZIP would now resolve after the import).

### Phase 4 — Curation layer ✅ DONE (Session 38, 2026-06-23)
- ✅ Super-admin CRUD (API + web) on `jurisdiction_layers` + `code_editions`, no deploy needed.
  - **API** `api/src/routes/v1/admin-jurisdictions.ts` (new, registered after `adminRoutes`):
    layers `GET (list, ?state/?level) / GET :id / POST / PATCH / DELETE` + `GET …/validate`
    (dry-runs `normalizeLayer` over every row → bad-row list); editions `GET (list) / PUT`
    (upsert on `(trade,state_code)`) `/ PATCH :id / DELETE :id`. Zod schemas mirror `types.ts`
    (`AhjMetadata`/`TradeCodeOverride`/`SequenceOp`); per-level key rule enforced at WRITE
    (state→state_code; county→+fips|name; city→+city_name) so a bad row can't insert then crash
    the reload. Each write: one txn → row + PLATFORM audit (same client; `SET LOCAL
    app.current_tenant_id='PLATFORM'` to pass audit_log's FORCE-RLS WITH CHECK) → COMMIT →
    `await refreshReferenceCache()`. Refresh failure → 2xx `cache_refreshed:false` (write is
    durable; engine self-heals on next boot). New rows stamp `source='admin-curation'`
    (`ADMIN_SOURCE_TAG`, distinct from seed tags) + `last_verified` (default CURRENT_DATE).
    Hard delete (no `deleted_at`).
  - **Auth fix:** shared `requireSuperAdmin` (`middleware/auth.ts`) now sets `req.jwt` after verify;
    `admin.ts` migrated to it (its local guard only READ `req.jwt`, which nothing set → those
    routes had been silently 403ing — latent, untested). The audit_log RLS WITH-CHECK failure on
    `tenant_id='PLATFORM'` writes was the same latent bug.
  - **Web** new `(admin)/jurisdictions/page.tsx` (tabbed Layers/Editions, list + slide-over, AHJ
    fields + raw-JSON `codes`/`sequence_ops`, Validate button, `cache_refreshed` warning banner) +
    nav item + 5 proxies under `web/src/app/api/admin/{jurisdiction-layers,code-editions}/`.
    English-only (matches the existing 4 admin pages).
  - Tests: `api/src/test/admin-jurisdictions.test.ts` (11 cases — auth gate, create→resolve wiring,
    per-level 422, sequence_ops round-trip, merged-PATCH 422, delete, edition upsert/cache,
    audit). Self-cleans by `source='admin-curation'` (test DB == dev DB). Full API suite 146/146.
- Perpetual data-ops layer — bulk AHJ curation is ongoing; the CRUD tooling is the deliverable.
- **Pre-existing gaps flagged (NOT fixed here):** (1) no super-admin login exists anywhere
  (`platform_admins` unused; no `/v1/admin/login`) → admin pages usable only with an injected
  `SUPER_ADMIN` cookie; (2) the `(admin)` route group strips from the path so pages resolve at
  root (`/jurisdictions`) while the layout nav + `tenants/[id]` links use `/admin/*` → those
  hrefs 404. Both predate Phase 4 and affect all admin pages equally.

---

## 6. Risks & honest caveats

| Risk | Mitigation |
|------|------------|
| **No clean national AHJ / amendment dataset** | National defaults cover every unseeded jurisdiction. Curate top metros first (Phase 4). Be explicit in UI that AHJ details are "best known / verify with local office" where `last_verified` is old/absent. |
| **Multi-county ZIPs** | Store all rows, pick max-`ratio` as primary; `projects.county_fips` user override already exists for corrections. |
| **Stale code editions** | `source` + `last_verified` per row; manual review (D-3). Permits freeze snapshot, so staleness never rewrites issued permits. |
| **Cache vs DB drift** | Single `refreshReferenceCache()` path; call it on any admin write. Boot always loads fresh. |
| **RLS mistake on reference tables** | Reference tables are intentionally NO-RLS (platform-scoped, like `tenants`). Document + verify in rls-audit that they are *meant* to be exempt — they hold no tenant data. |

---

## 7. Scope summary

| Item | Touch |
|------|-------|
| Migration 0020 (4 tables, no RLS) | new |
| `reference-store.ts` (cache + zip lookup) | new |
| `registry.ts`, `default-layer.ts`, `zip-county.ts` | repoint loader (no cascade change) |
| Seed scripts (editions, layers) | new |
| `import-zip-county.ts` + npm script | new |
| 4 `*-codes/*-editions.ts` TS libs | become seed source → retired after Phase 2 |
| `*-codes/inspection-sequences.ts` | unchanged (national defaults) |
| Engine cascade/merge, all routes, web, mobile | **unchanged** |

---

## 8. File locations (to be created/changed)

| Path | Role |
|------|------|
| `prisma/migrations/0020_codes_reference_store/migration.sql` | 4 reference tables (no RLS) |
| `api/src/lib/jurisdictions/reference-store.ts` | DB-backed cache + `lookupZipCounty` (new) |
| `api/src/lib/jurisdictions/registry.ts` | `findLayers` ← cache (repoint) |
| `api/src/lib/jurisdictions/default-layer.ts` | `resolveDefaultTradeCode` ← cache (repoint) |
| `api/src/lib/jurisdictions/zip-county.ts` | `deriveCountyFromZip`/`repairOcrZip` → DB (repoint) |
| `api/src/scripts/seed-code-editions.ts` | migrate 4 TS libs → `code_editions` (new) |
| `api/src/scripts/seed-jurisdiction-layers.ts` | migrate `seed/wi-*.ts` → `jurisdiction_layers` (new) |
| `api/src/scripts/import-zip-county.ts` | HUD crosswalk → `zip_county` + `counties` (new) |
| `api/src/lib/{electrical,plumbing,mechanical,building}-codes/*-editions.ts` | seed source, then retire |
| `docs/Schema_Reference.md` | add Domain 16: Codes Reference |

---

*Plan version: 1.0 — Session 36 — 2026-06-21*
