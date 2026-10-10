-- 0020_codes_reference_store
--
-- National scale-out of the jurisdiction / codes engine (Doc 16 — Codes Engine National Plan).
-- Moves reference data out of inline TypeScript into a Postgres storage engine built to hold a
-- large, growing volume of code/geography/AHJ data.
--
-- These four tables are PLATFORM-SCOPED REFERENCE DATA — they hold NO tenant-owned rows, so they
-- are intentionally EXEMPT from RLS (same as tenants / platform_admins / tenant_subscriptions).
-- The jurisdiction engine (api/src/lib/jurisdictions/) stays pure: a DB-backed in-memory cache
-- loads code_editions + jurisdiction_layers at boot; zip_county is queried on demand.
--
-- Provenance / versioning (Doc 16 D-3): curated tables carry source + last_verified. Permits keep
-- their frozen jurisdiction snapshot (migration 0019), so edits here never rewrite issued permits.

-- ── code_editions: code family + edition per state per trade (runtime source of truth) ───────
-- Replaces the inline electrical/plumbing/mechanical/building-codes/*-editions.ts libs.
CREATE TABLE IF NOT EXISTS code_editions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade         TEXT NOT NULL CHECK (trade IN ('electrical','plumbing','mechanical','building')),
  state_code    CHAR(2) NOT NULL,
  code_type     TEXT NOT NULL,                       -- 'NEC','IPC','UPC','IMC','UMC','IRC','IBC'
  code_edition  TEXT,                                -- e.g. '2020','2021'
  nec_edition   TEXT,                                -- electrical only; NULL otherwise
  notes         TEXT,                                -- amendment / home-rule notes (appended in cascade)
  source        TEXT,
  last_verified DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trade, state_code)
);
CREATE INDEX IF NOT EXISTS idx_code_editions_state ON code_editions(state_code);

-- ── zip_county: full US ZIP↔county crosswalk (~41k ZIPs, multi-county aware) ──────────────────
-- A ZIP can span multiple counties; primary county = MAX(ratio) per zip. Queried on demand.
CREATE TABLE IF NOT EXISTS zip_county (
  zip          CHAR(5) NOT NULL,
  county_fips  CHAR(5) NOT NULL,
  county_name  TEXT NOT NULL,
  state_code   CHAR(2) NOT NULL,
  primary_city TEXT,
  ratio        NUMERIC,                              -- HUD res_ratio; primary = max(ratio) per zip
  PRIMARY KEY (zip, county_fips)
);
CREATE INDEX IF NOT EXISTS idx_zip_county_zip ON zip_county(zip);

-- ── counties: FIPS reference (~3,143) — validation + UI pickers ───────────────────────────────
CREATE TABLE IF NOT EXISTS counties (
  county_fips CHAR(5) PRIMARY KEY,
  county_name TEXT NOT NULL,
  state_code  CHAR(2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state_code);

-- ── jurisdiction_layers: sparse city/county/state override layers (AHJ + amendments) ──────────
-- Replaces seed/wi-*.ts. ahj = AhjMetadata; codes = Partial<Record<Trade, TradeCodeOverride>>
-- (includes sequence_ops). city_name normalized (lowercased, prefixes stripped) by the loader.
CREATE TABLE IF NOT EXISTS jurisdiction_layers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level         TEXT NOT NULL CHECK (level IN ('state','county','city')),
  state_code    CHAR(2),
  county_fips   CHAR(5),
  county_name   TEXT,
  city_name     TEXT,
  ahj           JSONB,
  codes         JSONB,
  notes         TEXT,
  source        TEXT,
  last_verified DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_layers_match
  ON jurisdiction_layers(state_code, county_fips, city_name);

-- NO RLS on any of the four tables — platform reference data, not tenant-scoped (mirrors tenants).
