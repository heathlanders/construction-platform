# Handoff: Find Work pivot, marketing strategy, and email setup (2026-10-18)

**Branch:** `docs/find-work-pivot`. **Nothing is committed.** All changes below are in the working tree.
**Status:** planning only, docs only. No code changed.

---

## 1. What we decided

| Decision | Detail | Where recorded |
|---|---|---|
| **Business software is free; we earn when contractors get paid** (PR-09) | The owner: "finding work is the most difficult part of the trades … should be basically free. gotta be able to find jobs and get paid otherwise whats the point." Revenue = a fee on payments processed through the platform (Stripe Connect) + a success fee only on paid jobs the platform sourced. **Never per lead.** Supersedes PR-01..08, P-03, P-05. | `docs/LOCKED_DECISIONS.md`, `docs/decisions/0001-free-software-paid-work.md` |
| **GC search of the sub directory is free** (PR-10) | The cross-tenant add-on gate is to be removed. | Same files |
| **Launch markets** | Dane County WI, Rock County WI, Milwaukee County WI, Chicago | `docs/proposals/01-find-work-network.md` |
| **First "find work" feature = a work feed** | Matched public permits and public bids, delivered in-app and as a weekly email | Proposal 01, Phase 1 |

**Important:** the code still enforces the old paid tiers. Changing that is the separate "pricing migration" (see §5).

## 2. Files created or changed

| File | Change |
|---|---|
| `MARKETING_STRATEGY.md` (new) | Full marketing research: competitors, GitHub comparables, audience, channels, messaging, quick wins, growth levers, and an **advertising test method (§4b)**. Revised at the top (§0) for the free-software direction. |
| `docs/proposals/01-find-work-network.md` (new) | The phased build plan (Phases 0–7), data model, launch-market data sources, decisions, risks. |
| `docs/decisions/0001-free-software-paid-work.md` (new) | ADR, **accepted**. |
| `docs/LOCKED_DECISIONS.md` | Adds PR-09 and PR-10; marks PR-01..08, P-03 and P-05 superseded. |
| `docs/Pricing_Tier_Enforcement_Matrix.md` | Adds a "superseded / target state" banner. |
| `billing/CLAUDE.md` | Describes the new pricing model and notes that Stripe Connect is not built. |
| `docs/handoffs/2026-10-18-find-work-pivot.md` (new) | This file. |

## 3. What the work-feed data is for (plain version)

- **Permits** are public records that a funded job is about to start. Subs use them to pitch the GC before trades are hired. The strongest cases are new builds, big remodels, and late-hired trades (drywall, flooring, paint, landscaping).
- **Public bids** are government jobs open to bidding, filtered to each contractor's trade and area.
- Contractors save a job, start an estimate, and mark it bid, won or lost. That tells us which work came from us, which is the basis for any success fee, and whether the feed works at all.

## 4. Data source findings for the launch markets (checked 2026-10-18)

| Market | Permits | Bids |
|---|---|---|
| Chicago | ✅ **Good.** Socrata dataset `ydr8-5enu`, daily, with work description, cost and GC names | Not yet checked |
| Milwaukee | ✅ **Usable.** CKAN API, resource `828e9630-d7cb-42e4-960e-964eae916397`. Has permit type, cost and address; **no GC or description** | VendorNet |
| Dane County / Madison | ❌ **No open data.** Madison permits only in the Accela portal one record at a time (no API; **don't scrape**); county permits are Laserfiche documents | ✅ VendorNet, DemandStar, BidExpress (Madison); OpenGov portal (Dane County) |
| Rock County | ❌ **None found** | VendorNet |

**Plan for Dane and Rock permits:** public-records requests to Madison Building Inspection, Janesville and Beloit for a recurring permit export, plus an ask to each city's IT about a data feed. Source links are in Proposal 01.

## 5. Open items / next steps (in order)

1. **Email setup (the owner does this; about 20 minutes)**: see §6.
2. **Phase 0 manual test (no code, about 4 weeks)**:
   - Hand-pull last month's Chicago and Milwaukee permits, plus Dane and Rock bids.
   - Send a weekly list to 5–10 contractors who agreed to it.
   - Track who calls a GC or bids.
   - Ask 3 pricing questions: would you take payments through us; would you pay a % only on jobs we found; would you pass overflow jobs for a fee.
   - **Need from the owner:** 5–10 contractors with trade, county and language (EN or ES).
3. **Records-request letters** to Madison, Janesville and Beloit. Claude offered to draft them.
4. **Weekly digest script**, on branch `feat/work-digest-pilot` once the email setup is done. One script runs every Monday: pull permits → filter per contractor → send EN/ES emails through Brevo. It needs an unsubscribe link and a mailing address (CAN-SPAM).
5. **Commit this branch** (`docs/find-work-pivot`) after review.
6. **Docs not yet updated for PR-09:** `KEY_NUMBERS.md`, `PROJECT_MASTER_REFERENCE.md`, and the `.docx` pricing and GTM specs.
7. **Later code work:**
   - The pricing migration: remove seat and project limits, keep fair-use caps, make GC discovery search free (PR-10).
   - Signup and lead-source tracking (Phase 2).
   - Stripe Connect payments (Phase 3; risky; needs review).
8. **Decisions still open:**
   - T-55 (permit milestones) and T-56 (assets Business+) tier gates under the free model.
   - Fair-use cap numbers.
   - Whether to grandfather existing tenants.
   - The payment fee level.
   - The bid-notice ingestion method.

## 6. Email setup: what we found and what to do

**Findings:**
- `thejobsite.app` has **no MX records**, so it can't receive email right now. (DNS is on Cloudflare.)
- The owner's existing email account is on another provider or domain. **Not yet confirmed which.**
- **SendGrid's free plan ended** for new signups on 2025-05-27 ([Twilio changelog](https://www.twilio.com/en-us/changelog/sendgrid-free-plan)); paid plans start at about $19.95/mo. SendGrid is still the locked provider (A-15) for the app's own emails. Moving the app off SendGrid would be a separate decision.

**Recommended free setup (Option A):**

| Piece | Role | Free limit |
|---|---|---|
| Cloudflare Email Routing | Receive `jobs@`, `bids@` → forward to the owner's Gmail | Free; receive only |
| Brevo | Send as `@thejobsite.app` (Gmail + script) | 300/day, no card |
| Gmail "Send mail as" | Reply as `jobs@` from Gmail | Free |

Option B is Zoho Mail Forever Free (5 users, 5 GB). It has **no IMAP/SMTP**, so the script still needs Brevo.

**Steps for the owner:**
1. Cloudflare → `thejobsite.app` → Email → **Email Routing → Enable**, and accept the DNS records.
2. Add routes `jobs@thejobsite.app` and `bids@thejobsite.app` → Gmail, then click the confirmation emails.
3. Create a free Brevo account → **add domain `thejobsite.app`** → paste its DKIM and verification records into Cloudflare DNS → Verify.
   - ⚠️ **Keep only one SPF record.** Merge Cloudflare's and Brevo's into one, e.g. `v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all`. Use the exact values each dashboard shows.
4. Brevo → SMTP & API → generate an **SMTP key**.
5. Gmail → Settings → Accounts and Import → **Send mail as** `jobs@thejobsite.app`. Use SMTP `smtp-relay.brevo.com`, port 587, with the Brevo login and SMTP key.
6. Put the SMTP key in the server `.env` directly; **never paste it in chat**.

**Test:** send to `jobs@thejobsite.app` from another account. It should arrive in Gmail, and the reply should show the `jobs@` sender. Then ask Claude to re-check the DNS records (`dig MX/TXT thejobsite.app`).

## 7. Known research gaps

- Reddit was not reachable from this environment. Pain points are drawn from forums and review sites; pull them manually before finalizing messaging.
- No paid SEO tool was available, so keywords are unvalidated seeds. Use Google Keyword Planner and Google Trends (free).
- Not yet verified: API or terms for the bid portals (DemandStar, OpenGov, BidExpress); suburban Milwaukee permits; Chicago and Cook County bid portals.
- `Platform_GTM_Strategy_v1_0.docx` is missing from the repo, and `Platform_Competitive_Analysis_v1_0.docx` is corrupt (not a valid zip).
