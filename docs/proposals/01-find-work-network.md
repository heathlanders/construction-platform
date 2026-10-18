# Proposal 01: Find Work Network (free software, paid work)

**Status:** **accepted** 2026-10-18 (ADR-0001 = PR-09/PR-10); build not started
**Launch markets (owner, 2026-10-18):** Dane County WI, Rock County WI, Milwaukee County WI, Chicago (Cook County IL)
**Owner:** Heath Landers
**Context:** `MARKETING_STRATEGY.md` §0.1 and §4b
**Related decision:** `docs/decisions/0001-free-software-paid-work.md` (draft, not yet accepted)

## Problem

Finding work is the hardest part of running a trade business. Today contractors rent leads from Angi, Thumbtack and Bark. Those leads are shared, opaquely priced and often fake. The FTC fined HomeAdvisor $7.2M over exactly this ([FTC](https://ftc.gov/news-events/news/press-releases/2023/01/ftc-order-requires-homeadvisor-pay-72-million-stop-deceptively-marketing-its-leads-home-improvement)).

The Jobsite already does the hard operations work, but none of it helps a contractor find the next job.

## Bet

- Make the business software **free**.
- Make **finding work** the product.
- Earn money when contractors **get paid**, through payments processed on the platform and a fee on work the platform sourced. **Never charge per lead.**

Free software brings in contractors (the supply side). The marketplace cold-start problem is avoided by starting with **sources of work that need no network**: public permits and public bids.

## Phases

The phases are ordered so that each one is useful on its own, and later phases build on earlier ones.

| # | Phase | Delivers | Network needed? | Rough size |
|---|---|---|---|---|
| 0 | Manual validation | Proof that tradespeople want the feed | No | 2 weeks, no code |
| 1 | **Work Feed MVP**: permits + SAM.gov | "New jobs in your trade near you," in-app plus a weekly email | No | Large |
| 2 | Attribution + lead source | Ad testing, plus a "where my jobs come from" report | No | Small |
| 3 | Payments (Stripe Connect) | Revenue line 1; it also enables fee collection | No | Large, risky (money) |
| 4 | Network bid invitations | GCs invite matched subs across tenants | Yes (GCs) | Large, cross-tenant |
| 5 | Overflow referrals | Peer-to-peer job passing with a finder's fee | Yes (peers) | Medium |
| 6 | Public profiles + reviews + code SEO pages | Owned inbound demand | No | Medium |
| 7 | Exclusive homeowner marketplace | Routed Design Studio requests | Yes (homeowners) | Large; gated on metrics |

The pricing transition (free tier, fair-use caps) runs in parallel once the ADR is accepted.

---

## Launch-market data sources (checked 2026-10-18)

**Main finding: permit data quality is uneven.** Chicago and Milwaukee publish machine-readable permits. **Dane and Rock counties do not.** In the home market the feed has to lean on **public bids**, plus a public-records request for permits, and on network tiers B–D (§0.1 of `MARKETING_STRATEGY.md`).

| Market | Permits | Public bids | Feed quality |
|---|---|---|---|
| **Chicago** | ✅ Socrata `ydr8-5enu`, updated daily. It includes `work_description`, `reported_cost`, `contact_n_*` (the GC and other contractors) and lat/lng. | City and Cook County portals (unverified); SAM.gov | **High.** Trade classification from the description; GC names make a "pitch the GC" lead. |
| **Milwaukee County** (City of Milwaukee) | ✅ CKAN datastore API, resource `828e9630-d7cb-42e4-960e-964eae916397` ([dataset](https://data.milwaukee.gov/dataset/buildingpermits)), described as monthly but last modified 2026-10-17. Fields: Date Opened/Issued, Address, Record ID, Permit Type, Status, Construction Total Cost, Use of Building, Dwelling units impact. **No contractor field and no work description.** Suburban municipalities were not checked. | [VendorNet](https://VendorNet.wi.gov) (free; state and some municipalities, for jobs over $25k); Milwaukee County and city sites (unverified) | **Medium.** Trade can only be inferred from Permit Type + Use; no GC to pitch. |
| **Dane County** (Madison + unincorporated) | ❌ **No open permit dataset found.** Madison's old Socrata portal no longer resolves, and its ArcGIS Hub has no permit layer. Madison permits are searchable one record at a time in [Accela Citizen Access](https://aca-prod.accela.com/madison/Welcome.aspx) (no bulk API; scraping raises terms-of-service risk). Unincorporated county zoning permits live as Laserfiche documents ([Dane County Permits](https://danecounty.gov/permits-and-licenses)). | ✅ **Good.** City of Madison posts on VendorNet + DemandStar (free subscription), with construction ads in the Wisconsin State Journal and on BidExpress ([Madison vendor guide](https://cityofmadison.com/finance/documents/purchasing/VendorsGuide.pdf)). Dane County posts all solicitations on its OpenGov e-procurement portal, and Public Works keeps a separate bid history ([Dane County Public Works](https://publicworks.danecounty.gov/Current-Projects)). | **Bids: medium. Permits: none** until data access is secured. |
| **Rock County** (Janesville, Beloit) | ❌ No open permit data found; only Census aggregate counts ([FRED](https://fred.stlouisfed.org/series/BPPRIV055105)). | VendorNet; city sites (unverified) | **Low.** Rely on bids + network tiers. |
| Statewide WI | DSPS commercial plan review has a public lookup ([eSLA](https://esla.wi.gov/publiclookup)), but it needs a DIS number, so it is **not a feed**. | VendorNet; [UW System procurement](https://www.wisconsin.edu/procurement/information-for-vendors/) | — |

**Actions to unlock Dane and Rock permits:**
1. File **public-records requests** (Wisconsin's open-records law) with the City of Madison Building Inspection, Janesville and Beloit for a recurring export of issued permits with contractor and description fields.
2. Ask each city's IT department whether a scheduled export or an API to their Accela instance is possible.
3. Never scrape Accela without written permission.

**Bid sources to verify:**
- Whether **DemandStar**, **OpenGov** and **BidExpress** offer API or RSS access, and their terms. BidExpress may require a paid subscription (unverified).
- VendorNet has no documented public API. Start with the free email notices into a parsing inbox and check its terms.

---

## Phase 0: Manual validation (no code)

**Goal:** prove contractors act on public work data before building ingestion.

1. Pull the last 30 days of permits by hand for **Chicago + Milwaukee**, and the last 30 days of **bids** for Dane, Rock and Milwaukee (VendorNet, Madison/DemandStar, the Dane County OpenGov portal). Send the Madison and Janesville records requests in week 1.
   *(Original two-market plan, kept for reference:)*
   - **Chicago** is verified usable. Its Socrata dataset `ydr8-5enu` (`https://data.cityofchicago.org/resource/ydr8-5enu.json`) has these fields:
     - `permit_type`, `work_type`, `work_description`
     - `reported_cost`, `issue_date`
     - `contact_1..7_type/name/city/state/zipcode`, which includes the general contractor
     - `latitude`/`longitude`, `community_area`
   - The second market should be the founder's home market (Madison / Dane County WI). Its open-data availability is **unverified**; check the city and county portals first.
2. Pull SAM.gov construction solicitations for one state.
   - Endpoint: `https://api.sam.gov/opportunities/v2/search`.
   - Required: `api_key`, `postedFrom`/`postedTo` (MM/dd/yyyy, at most a 1-year range).
   - NAICS filter: `ncode`, e.g. 236/237/238 prefixes.
   - The free key expires every 90 days ([GSA docs](https://open.gsa.gov/api/get-opportunities-public-api/)).
3. Filter the results for electrical, plumbing and concrete. Email a weekly digest to 5–10 design-partner contractors.
4. Interview each partner. Three questions (from `MARKETING_STRATEGY.md` quick win 0b):
   - Would you route customer payments through us if the software were free?
   - Would you pay a % only on jobs we found for you?
   - Would you pass overflow jobs to peers for a finder's fee?

**Exit criteria:** across 4 weekly digests, ≥5 contractors receive them, ≥30% click through, and **≥1 contractor contacts a GC or owner or bids on an item**. If no one acts, stop and re-think before Phase 1.

---

## Phase 1: Work Feed MVP

### Data model (migration 0069+; verify the next free number at build time)

**`work_opportunities`** is platform-scoped public data with **no RLS**.
- **Why no RLS:** it holds only public records and no tenant-owned rows. The precedent is `zip_county`, `counties` and `code_editions` (Doc 16) and `tenant_discovery_profiles` (0042).
- **Columns:**
  - `id`, `source_key`, `external_id` (UNIQUE `(source_key, external_id)`), `kind` ('permit'|'solicitation')
  - `title`, `description`
  - `address`, `city`, `state_code`, `zip`, `county_fips`, `latitude`, `longitude`
  - `value_cents` (T-02; nullable)
  - `posted_at`, `response_deadline`
  - `business_contacts` JSONB (**business names and roles only**, see Privacy)
  - `trades TEXT[]` (canonical T-64 keys), `classification` JSONB (rule hits, for explainability)
  - `raw` JSONB
  - `ingested_at`, `updated_at`
- **Indexes:** `(state_code, county_fips, posted_at DESC)`, a GIN index on `trades`, and `(source_key, posted_at)`.

**`work_sources`** (no RLS) is the source registry.
- **Columns:** `key`, `kind`, `jurisdiction` (state/county/city), `url`, `field_map` JSONB, `enabled`, `last_run_at`, `last_error`.
- Adding a city should be a row plus a field map, not code. This mirrors the T-64/T-65 "one data entry per thing" principle.

**`work_opportunity_actions`** is tenant-scoped, with **RLS enabled + forced + WITH CHECK** (A-03).
- **Columns:** `opportunity_id`, `status` ('saved'|'dismissed'|'pursuing'|'bid'|'won'|'lost', TEXT+CHECK per T-53), `notes`, `estimate_id?`, `project_id?`, `version` (T-12), universal columns.
- This is the tenant's private pipeline state on public records. It also produces the success metric: feed → won job.

**Service area.** `tenant_discovery_profiles` has only `states CHAR(2)[]` today. Phase 1 adds `service_counties CHAR(5)[]`, plus an optional `home_lat/lng` + `radius_mi`.
- The profile is opt-in for *being discovered*. The feed needs a service area even when a contractor isn't discoverable.
- **Decision needed (D1):** extend that table, or create a separate tenant-scoped `work_preferences` table with RLS. **Recommendation:** a separate RLS table. Feed preferences are private, and the discovery directory's whitelist-by-construction design should stay narrow.

### Ingestion

- **Runner.** Run ingestion as a CLI script on a host timer at first (`api/src/scripts/ingest-work-sources.ts`, with `--source`, `--since`, `--apply`), mirroring `import-zip-county.ts`.
  - **Why not pg-boss now:** T-10 requires every job envelope to carry `tenant_id`, and platform ingestion has no tenant. That creates an ambiguity which would otherwise need a new locked decision.
  - **Decision needed (D2):** keep the host timer, or later add a documented platform-job envelope exception.
- **Behavior per source:** fetch the window since the last cursor, map fields via `field_map`, geocode when lat/lng is missing (reuse the `geocode-worker` Census logic), resolve `county_fips` via `zip_county`, classify, and upsert on `(source_key, external_id)`.
- **v1 sources:**
  - Chicago (verified).
  - 2–4 more Socrata cities (NYC, Austin, Seattle and SF are commonly cited; **verify each dataset id and field names before adding a row**).
  - SAM.gov, at most daily. Its rate limits are undocumented for public keys, and the 90-day key renewal needs an ops reminder.
  - The founder's market, if Phase 0 confirms it is available.

### Classification (deterministic, no runtime AI, in keeping with the platform's engines)

- **Permits:** match `permit_type` + `work_type` + `work_description` against per-trade keyword rules.
  - Proposed home: a new optional pack field `work_keywords` on Trade Knowledge Packs (Doc 23), so each trade owns its own matchers.
  - Fallback: taxonomy aliases, then `general`.
  - Chicago's descriptions are structured text (e.g. "ELECTRICAL WORK UNDER THIS PERMIT = NO", "ROOFTOP PACKAGED UNIT"), which suits rules.
- **SAM.gov:** NAICS code → taxonomy keys. The taxonomy was reviewed against NAICS (Doc 21 Phase 7), but **no NAICS field exists on `TradeDef` today**. Add `naics?: string[]` to the taxonomy, with a guard test.
- Store the rule hits in `classification`, so "why am I seeing this?" is answerable in the UI.
- Optional later: local-LLM classification behind an env gate, the same pattern as blueprint vision (parser wins; vision only adds).

### API (`/v1`, `withTenantContext` for the actions table)

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/work-feed` | Matched to the tenant's trades and service area; filters `kind`, `trade`, `min_value`, `since`; cursor pagination (T-01, max 100) |
| GET | `/v1/work-feed/:id` | Opportunity detail plus the tenant's action |
| PUT | `/v1/work-feed/:id/action` | Save / dismiss / pursuing / bid / won / lost (optimistic lock) |
| POST | `/v1/work-feed/:id/estimate` | Create a draft estimate prefilled from the opportunity (address, value, trade). This hands off to the existing estimating engine. |
| GET/PUT | `/v1/work-preferences` | Trades, service counties or radius, digest frequency, language |

Roles: read for any org user; actions for OWNER/PM/ESTIMATOR. **No tier gate**; under the ADR the feed is free.

### Delivery

- **Web:** a `/work` dashboard page with a list, a map toggle (reusing the MapLibre project map) and filters. Chrome is EN+ES (P-09). The opportunity text itself is English public data, the same convention as task titles.
- **Mobile:** a "Work" tile, read-only list plus save/dismiss. It is API-only and online at first (the PermitList pattern).
- **Email digest:** new code; **no digest or scheduled per-user email pattern exists yet**. Add a weekly `work_feed.digest_scan` cron that fans out per tenant (the `cross_tenant.labor_summary_scan` pattern in `api/src/index.ts`, which gives the envelope a tenant), sent through SendGrid in the user's language.
- **Push:** an optional "new high-value match" notification through the existing notifications pipeline.

### Privacy and compliance

- Permit records can name **individual homeowners**. Store and display **business contacts only**: GC, architect, owner entity when it is a business. Drop person-name fields at ingest.
- Show source attribution and a link on every record, and record the source licence and terms in `work_sources`.
- Contacting people found in public records can trigger TCPA (calls/texts) and CAN-SPAM (email) rules. The UI should steer toward **bidding to the GC or AHJ-listed contractor**, not cold-calling homeowners. Get a legal review before launch; this is an open question, not legal advice.

### Tests

- Field-map fixtures per source.
- Classifier golden tests (sample descriptions → trade keys).
- Idempotent upsert.
- RLS isolation on `work_opportunity_actions`; run `/rls-audit`.
- Feed matching by trade and county.
- A `list-limit-callers` guard for the new list route.
- The digest fan-out carries `tenant_id`.

### Success metrics

- Weekly active feed users divided by tenants.
- Saves per user.
- **Opportunities moved to `bid`, and then to `won` with a value.** This is the north-star metric and the basis for any later success fee.

---

## Phase 2: Attribution and lead source (needed for ad testing)

- Add `tenants.signup_attribution` JSONB (utm_source, medium, campaign, referrer, landing page), captured at `POST /v1/auth/signup` (`api/src/routes/v1/auth.ts` ~L122 creates the tenant; **no attribution is stored today**).
- Add a `lead_source TEXT` on `projects`, `estimates` and `design_requests`. The value list comes from one enum module: google_business, lsa, nextdoor, referral, work_feed, network_bid, angi, thumbtack, other.
- A report shows jobs, value and conversion by lead source, using estimates → awarded → invoices. This is the "where my jobs come from" feature (`MARKETING_STRATEGY.md` §4b Part 2).

---

## Phase 3: Payments through Stripe Connect (revenue line 1)

- **Facts:** `invoices.stripe_payment_intent_id` exists in the schema, but **no code creates PaymentIntents for customer invoices and no Connect usage exists**. Stripe is used only for platform subscriptions and webhooks. This phase is entirely new.
- **Scope:**
  - Connected-account onboarding per tenant.
  - "Pay this invoice" links (card + ACH) from invoices and proposals.
  - Deposits on accepted Design Studio proposals.
  - An application fee per payment.
  - Webhooks reuse the T-18/T-19/T-20 pattern.
- **Hand-offs and gates:** money movement plus KYC makes this **risky**. Use `billing-agent` and the `stripe:connect-recommend` skill to choose the Connect charge type, and use `reviewer` before merge.
- **Decision needed (D3):** the platform fee level and whether ACH is priced differently.

---

## Phase 4: Network bid invitations (cross-tenant; ultrathink rule applies)

- Today the bridge has families for rfi, change_order, submittal, invoice, lien_waiver, daily_report and labor (`RESERVED_EVENT_PREFIXES`, `api/src/lib/cross-tenant/bridge.ts` ~L477). **There is no bid/RFQ family.**
- **Proposal:**
  - A GC marks a `bid_package` "open to network."
  - The platform matches discoverable subs by trade and service area.
  - Matched subs receive a `bid.invited` event and reply with `bid.submitted`.
  - The GC sends `bid.awarded`.
  - Payloads are whitelisted and sub data never lands in GC tables (A-07, rule 11).
- **Monetization hook:** a success fee is charged when an awarded network bid is paid via Phase 3.
- **Decision needed (D4):** should GC-side discovery search stay behind the cross-tenant add-on (PR-08)? Under the free model, the recommendation is to make it free, because it is the network growth engine.

## Phase 5: Overflow referrals

- A contractor refers a job (customer + scope) to a peer tenant through the bridge. The peer accepts or declines. A finder's fee is set at referral time and settled on the job's paid invoice via Connect, with an optional platform cut.
- New family: `referral.offered/accepted/declined/completed`.

## Phase 6: Public profiles, reviews and SEO pages

- **Public profiles:** today `web/src/middleware.ts` `OPEN_PATHS` contains only `/portal/studio/start`. Add a public route group for opt-in tenant profiles: trades, service area, reviews, and a "Start a project" Design Studio button.
- **Review requests:** sent after an invoice is paid, linking to Google and to the on-platform profile.
- **Code SEO pages:** programmatic code/permit pages per state × county × trade, generated from the jurisdiction engine. Each page must carry real AHJ and inspection data to avoid thin content.

## Phase 7: Exclusive homeowner marketplace

- Route unassigned Design Studio requests (`design_requests.channel = 'marketplace'`, which is already reserved) to **one opted-in pro at a time**, with a success fee only on paid jobs.
- **Gate:** start only when, in a metro, there are ≥30 active pros in a trade *and* Phase 1–5 win data shows conversion. Homeowner acquisition spend is where lead-seller economics go wrong.

---

## Decisions needed

| # | Decision | Recommendation |
|---|---|---|
| ADR-0001 | Free software, paid work: reverse PR-01..08, P-03, P-05 | ✅ **Accepted 2026-10-18** (PR-09) |
| D1 | Where feed preferences live | A separate tenant-scoped RLS `work_preferences` table |
| D2 | Ingestion runner for platform-level data | Host timer + CLI script now; formal T-10 exception later if needed |
| D3 | Platform payment fee | Benchmark against Joist/Square (2.6%+10¢ in person, 2.9%+30¢ online: [GetApp](https://www.getapp.co.uk/software/2047614/joist)) after Phase 0 interviews |
| D4 | GC discovery search add-on gate | ✅ **Free (PR-10)**; code change pending |
| D5 | First metro(s) | ✅ **Dane, Rock and Milwaukee counties (WI) + Chicago**. See launch-market data sources. |
| D6 | How to get Dane and Rock permit data | Public-records requests + a city data-sharing ask; no scraping |
| D7 | Bid-notice ingestion method (VendorNet, DemandStar, OpenGov, BidExpress) | Verify API/terms first; fall back to a parsed email-notice inbox |

## Risks

- **Classification precision.** Wrong-trade matches erode trust fast. Mitigate with golden tests, "why am I seeing this?", and dismiss feedback that tunes the rules.
- **Data coverage.** Many jurisdictions have no open permit API. Coverage will be uneven, so market it city by city.
- **Revenue lag.** Payments revenue needs volume, and free users cost hosting. Mitigate with fair-use caps and by making Phase 3 the first revenue milestone.
- **Fee leakage** off-platform on sourced work. Collect fees in the payment flow and keep the fee small.
- **Legal:** public-records contact use, payments/KYC, and possibly money-transmitter questions for referral-fee settlement. Get counsel before Phases 3 and 5 launch.

## Not in scope

Changing the operations modules. The locked-decision edits themselves, which wait for ADR acceptance. Any paid lead data vendors.

## When building starts

- Branch per phase from a fresh `main`, e.g. `feat/work-feed` for Phase 1 and `feat/signup-attribution` for Phase 2.
- Run `/plan` first; the work touches more than 2 files.
