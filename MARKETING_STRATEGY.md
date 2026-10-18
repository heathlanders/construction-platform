# Marketing Strategy: The Jobsite, helping tradespeople find new work

*Researched 2026-10-18. Internal facts come from this repository. Every external claim links to its source. Figures from third-party blogs or vendors are estimates, and the doc says so where it uses them.*

---

## 0. Direction (revised 2026-10-18, owner input)

> *"Finding work is the most difficult part of the trades. That's the goal: help them find work. Managing the business in software might as well be free."* (owner)

That flips the strategy. **Business-management software becomes the free hook; finding work becomes the product.** The rest of this doc is updated to match. Section 0.1 is the new core, and the original analysis follows it.

### 0.1 The model: free software, paid work

**Why it can work.** Free operations software is the supply-side acquisition engine. Contractors join for the free tool, and every one of them becomes inventory for the work network. The usual cold-start problem of a marketplace (no contractors, so no homeowners, so no contractors) is broken by **starting with sources of work that don't need homeowners or any network to exist yet** (tier A below).

**The work engine.** These are the sources of work, ordered by how soon they can deliver without network effects:

| Tier | Source of work | Who it serves | Needs liquidity? | Already in repo |
|---|---|---|---|---|
| **A** | **Public demand feed**: recently issued **building permits** from city open-data portals ([public Socrata APIs](https://apify.com/prometheusagency/us-building-permits)), plus **federal construction solicitations** from SAM.gov (free API key, filterable by NAICS: [SAM.gov API](https://apify.com/thoob/sam-opportunities-feed.md)). State and local procurement feeds vary by jurisdiction, so treat them as a hypothesis to validate. | Subs (who pulled the permit? that GC needs your trade), specialty trades, gov-capable firms | **No.** Useful on day one, even with one user. | Trade taxonomy reviewed against NAICS (Doc 21); ZIP→county, geocoder and project map; the jurisdiction engine knows the AHJ |
| **B** | **GC → Sub bid invitations across the network.** Free software brings GCs, GCs post bid packages, and matched subs get invited. This is the BuildingConnected playbook, which has been free for GCs and reached a 1.5M+ network ([ClockShark](https://www.clockshark.com/Blog/buildingconnected-review)). | Subs | Some: it needs GCs on the platform. Free software is the lever. | `bid_packages`, `vendor_bids`, the discovery directory, the Sub Portal, the cross-tenant bridge |
| **C** | **Contractor-to-contractor overflow and referrals.** A busy or wrong-trade contractor passes the job to a trusted peer and earns a finder's fee on completion. Finder's fees of $100–$1,000 are already a trade custom ([Builder Market](https://blog.thebuildermarket.com/blog/affiliate-programs-vs-direct-referral-bonuses-contractors)), and Referly is a small existing tool for this ([Software Advice](https://www.softwareadvice.com.au/software/548709/Referly)). | Every trade | Some: peer groups of 10–20 are enough | Discovery directory + the 183-trade taxonomy ("not my trade → route to the right key") |
| **D** | **Owned demand, converted.** A public profile page, reviews, Google Business Profile and Nextdoor, plus a **Design Studio link** that turns "how much for a patio?" into a scoped, priced request. | Residential trades | No | Design Studio (concrete only); profiles and reviews are **not built** |
| **E** | **Homeowner marketplace**: unassigned Design Studio requests routed to opted-in pros, **exclusive, one pro at a time**. Angi itself moved to "homeowner choice," where every lead is picked by the homeowner, in January 2025 ([Angi Q3-25 8-K](https://www.sec.gov/Archives/edgar/data/1705110/000170511025000132/q32025earningsrelease.htm)). | Residential trades | **Yes.** It needs homeowner acquisition spend. | `design_requests.channel = 'marketplace'` is reserved |

**Recommended order:** A → B → C → D → E.
- A gives a "find work" reason to sign up on day one.
- B and C compound as free users accumulate.
- E is last because buying homeowner demand is how Angi-style unit economics go wrong.

**How it makes money when the software is free.** Never charge per lead; that is the model the whole market hates (§2.2).

| Revenue line | Mechanism | Evidence / precedent |
|---|---|---|
| **1. Payments take rate** (primary) | Invoices, deposits and progress payments are paid through the platform, at card or ACH fees plus a small margin. | Joist and Square give the software away and earn on processing at 2.6% + 10¢ in person and 2.9% + 30¢ online ([GetApp: Joist](https://www.getapp.co.uk/software/2047614/joist)) |
| **2. Success fee on platform-sourced work only** | A % or flat fee charged **only when a job that came from tier B, C or E is won and paid**, collected through the payment flow. Work the contractor brought in themselves is always free. | Pitch it as the opposite of pay-per-lead: *"you pay when you get paid."* Collecting at payment time limits off-platform leakage. |
| **3. Referral fee split** (tier C) | The platform takes a small cut of the peer finder's fee | Builds on an existing trade custom |
| **4. Optional "Work Pro" upgrade** | Wider radius, instant permit and solicitation alerts, priority placement in GC search | Keep the base work feed free, or it reads as lead selling again |

**What "free" still has to cap.** Hosting, storage (T-29 quotas) and AI renders (Design Studio usage is metered in `ai_usage_events`) cost real money. The free tier needs fair-use limits on storage and render counts. Unlimited users and projects are fine.

> ✅ **Accepted 2026-10-18:** locked as PR-09/PR-10; the superseded rows are marked in LOCKED_DECISIONS. *(Original note:)* ⚠️ **This reverses locked decisions.** PR-01..PR-08 (paid tiers), P-03 and P-05 (credit-card trial), and `docs/Pricing_Tier_Enforcement_Matrix.md` all assume paid seats and project limits. Per the project's own rules, a reversal must be flagged and every affected doc updated deliberately. **This file does not touch them.** If you confirm the direction, the next step is a Decision/ADR plus updates to LOCKED_DECISIONS, the Pricing doc, tier enforcement and billing.

### 0.2 Original TL;DR (still valid analysis; positioning superseded by 0.1)

- **The Jobsite is not a lead marketplace.** It is a multi-tenant operations platform for GCs and trade contractors: estimating, scheduling, permits, time and payroll, field mobile, EN+ES. It already contains **four lead-adjacent features** that no lead seller offers together:
  1. a **client-intake "Design Studio"**: AI-guided wizard, concept render and budget range, then a draft estimate and proposal;
  2. an **opt-in GC↔Sub discovery directory**;
  3. a **free Sub Portal** that GCs invite subs into;
  4. **fast deterministic estimates and proposal PDFs**.
- **The market gap is real and documented.**
  - Shared leads that are sold to several pros at once, opaque per-lead pricing, and fake leads ([FTC v. HomeAdvisor, $7.2M](https://ftc.gov/news-events/news/press-releases/2023/01/ftc-order-requires-homeadvisor-pay-72-million-stop-deceptively-marketing-its-leads-home-improvement)).
  - Angi's own network leads fell 81% YoY in Q3 2025 ([Angi 8-K](https://www.sec.gov/Archives/edgar/data/1705110/000170511025000132/q32025earningsrelease.htm)).
  - Contractors are told to "build something you own" ([Adapt Digital](https://adaptdigitalsolutions.com/contractor-lead-generation-how-i-get-customers-for-my-construction-business/)).
- **Positioning:** *"Stop renting leads. Own your pipeline."* The Jobsite turns the demand a contractor already has into won jobs: referrals, Google Business Profile, Nextdoor, GC relationships. It does this with a branded intake link, a same-day estimate and proposal, and a GC network that invites subs for free. **Zero per-lead fees.**
- **Beachhead:** small residential electrical, plumbing and concrete/flatwork contractors. Those are the v1.0 modules (P-01) and the only Design Studio trade built so far. Lead with **bilingual EN+ES** (P-09).

---

## 1. What this repo does, and its competitive position

### 1.1 Product summary (from repo)

| Area | What exists | Where |
|---|---|---|
| Core | Multi-tenant SaaS for GCs and trade subs, with RLS isolation. "The Operating System for Construction." Brand: **The Jobsite**, `thejobsite.app` (P-11). | `CLAUDE.md`, `docs/PROJECT_MASTER_REFERENCE.md` |
| Trades | The v1.0 launch modules are GC + Electrical + Plumbing (P-01). The canonical taxonomy has **183 trades** in 11 categories. | `api/src/lib/trades/taxonomy.ts`, `docs/Trade_Taxonomy_v1_0.md` |
| Pricing | Starter $149/mo, Professional $349/mo, Business $749/mo, Enterprise $1,499+. 14-day trial. The pitch is "underserved by Procore ($375+/mo)". | `docs/LOCKED_DECISIONS.md` PR-01..08 |
| Field ops | Offline-first mobile app (time, daily reports, punch, safety, JSA, inspections, QA). Clock in/out, timecards, payroll export. | `mobile/CLAUDE.md`, `docs/Time_Tracking_Payroll_v1_0.md` |
| Preconstruction | Blueprint Intelligence: PDF/OCR to a full task schedule in under 30 s. Deterministic estimating engine with cost catalog and branded **proposal PDF + emailed link**. | `docs/Blueprint_Intelligence_v1_0.md`, `docs/Estimating_Engine_v1_0.md` |
| Compliance | Jurisdiction/codes engine with AHJ permits and inspection milestones. Task build-out steps with code refs. Trade Knowledge Packs (hazards, QA). | `docs/Codes_Engine_National_Plan_v1_0.md`, `docs/Trade_Knowledge_Packs_v1_0.md` |
| Language | Spanish is a v1.0 launch gate (P-09). Web and mobile chrome are EN+ES throughout. | `.claude/skills/i18n/SKILL.md` |

### 1.2 Features relevant to lead generation and job discovery

| Feature | Status | Lead-gen relevance |
|---|---|---|
| **Design Studio** (client visualizer) | P1–P4 built 2026-10-06. Only one trade so far (`concrete_flatwork`). The cloud image provider is not chosen. | A contractor sends a homeowner a link. The homeowner photographs the space, answers a guided wizard (EN/ES), sees a concept render and a **budget range**, and submits. The contractor verifies and sends a proposal; the client accepts in the portal and it becomes a project. **This is a branded lead-capture and conversion funnel.** The `design_requests.channel` column already reserves `'marketplace'`. |
| **Discovery directory** (cross-tenant §3.3) | Shipped 2026-07-19. Opt-in, off by default. | Subs publish a profile with trade keys and state. GCs search by `q`, trade and state. This is the B2B "get found by GCs" loop. It is currently gated behind the cross-tenant add-on for the *searching* side. |
| **Free Sub Portal** (P-04) | Built | Called the "primary acquisition engine" in the docs: a GC invites subs free, and subs convert to paid. Every GC customer seeds new subs. |
| **Estimate → proposal PDF → 7-day link** | Built | Speed-to-quote. The proposal email is branded and the line items are defensible (`assumptions[]`). |
| **Blueprint → schedule + estimate** | Built | Subs can respond to GC bid packages faster. |
| **Project map** | Built | A portfolio view only. Not a public-facing lead map. |
| **Public contractor profile / SEO page** | **Absent** | Biggest gap: there is no indexable page a homeowner can land on. |
| **Review collection** | **Absent** | Reviews drive GBP, LSA ranking and Nextdoor. |
| **Permit-data lead feed** | **Absent**, though the infrastructure exists | The codes/ZIP→county engine and the `geocode-worker` could ingest open permit data (see §7). |

### 1.3 Existing marketing copy and positioning in the repo

- Tagline: *"The Operating System for Construction."*
- Position: 3.7M US construction businesses are underserved by Procore ($375+/mo). The moat is the **GC↔Sub collaboration bridge "no competitor has."** (`docs/PROJECT_MASTER_REFERENCE.md` §1)
- The docs reference a GTM doc (`Platform_GTM_Strategy_v1_0.docx`, with ICP, 9 channels and a design-partner program), but **that file is not in this repo**. `Platform_Competitive_Analysis_v1_0.docx` is present but is **not a valid zip/docx** and could not be read. The open questions are OQ-11 (how to find the first 10 design partners) and OQ-12 (a Spanish-speaking design partner).
- **Gap:** all current positioning is *operations*. Nothing in the copy speaks to "find more work." This strategy adds that angle without changing the product.

### 1.4 Competitive position in one line

The lead sellers (Angi, Thumbtack, Bark) sell *access to strangers*. The FSM tools (Jobber, Housecall Pro) run *jobs you already have*. Procore and BuildingConnected serve *commercial GCs*. **The Jobsite can own the middle: the conversion layer plus the GC↔Sub network, for small and mid trade contractors, bilingual, with no per-lead fees.**

---

## 2. Comparable projects and competitors

### 2.1 GitHub (open-source comparables)

The open-source field is **thin**. No trades lead-gen or marketplace repo has meaningful traction; most results are student or demo projects with 0–5★. That is a signal in itself: the incumbents are commercial SaaS, not OSS. Stars, forks and last-push dates below are from GitHub search on 2026-10-18.

| Repo | ★ / forks / last push | What it is | How it positions | Takeaway |
|---|---|---|---|---|
| [invoiceninja/invoiceninja](https://github.com/invoiceninja/invoiceninja) | 10,291★ / 2,758 / 2026-10-17 | Invoice, quote, project and time tracking (source-available) | "Invoice, quote, project and time-tracking app"; hosted at [invoiceninja.com](https://invoiceninja.com) | Proves a free or self-host tier plus a hosted paid tier builds a big funnel among small service businesses. |
| [sharetribe/sharetribe](https://github.com/sharetribe/sharetribe) / [web-template](https://github.com/sharetribe/web-template) | 2,447★ / 1,323 (legacy); 69★ / 275 (template, active) | Marketplace software (Sharetribe Go → Flex) | "Create your own unique marketplace"; [sharetribe.com](https://www.sharetribe.com) publishes "how to build a site like Bark" content ([link](https://www.sharetribe.com/create/how-to-build-website-like-bark.com.md)) | If a homeowner marketplace is ever built, this is the reference architecture. Their SEO-content approach ("build X like Y") is worth copying. |
| [OCA/field-service](https://github.com/OCA/field-service) | 200★ / 318 / 2026-10-13 | Odoo field-service addons | Modular ERP addons; community at [odoo-community.org](https://odoo-community.org/psc-teams/field-service-126) | ERP-integrated FSM. No lead generation. |
| [Beveren-Software-Inc/Field_Service_Management](https://github.com/Beveren-Software-Inc/Field_Service_Management) | 24★ / 23 / 2026-10-06 | ERPNext FSM | "100% open-source FSM for ERPNext"; [beverensoftware.com](https://beverensoftware.com/) | Operations only. |
| [niko4244/openfieldpro](https://github.com/niko4244/openfieldpro) | 5★ / 7 / 2026-10-16 | Self-hostable FSM, "lead-to-payment operations" (Fastify + Next.js + Expo, the **same stack as this repo**) | CRM, scheduling, estimates, invoicing, reviews | Closest technical twin. It frames itself around *lead-to-payment*, which is the framing The Jobsite should borrow. |
| [mhklogs/fixnear-marketplace-template](https://github.com/mhklogs/fixnear-marketplace-template) | Low / MIT / 2026-09-29 | Home-services marketplace template: contractor directory, **multi-step lead wizard**, lead pipeline, AI chat | "Homeowner wants to trust a stranger… contractor wants qualified leads instead of a phone tree" | Shows the wizard-intake idea is in the air. The Jobsite's Design Studio is far deeper (priced range, render, proposal). |
| [adamyala/312LEADS](https://github.com/adamyala/312LEADS) | 2★ / 2014 | Chicago public data → contractor leads | Civic-data lead gen | Validates the **permit-data lead** idea (§7). Many current paid Apify actors do the same ([example](https://apify.com/prometheusagency/us-building-permits)). |

### 2.2 Commercial landscape (how trades find work today)

| Platform | Model and cost to the pro | Documented pain points |
|---|---|---|
| **Angi / HomeAdvisor (Angi Leads)** | About $300/yr membership plus $15–$85+ per lead; leads are shared ([Hook Agency](https://hookagency.com/blog/angies-list-reviews/), [sidehusl](https://sidehusl.com/contractors-3-million-payday-a-cautionary-tale/)) | FTC order: leads misrepresented on quality, area and conversion; hidden subscription costs; $7.2M penalty ([FTC](https://ftc.gov/news-events/news/press-releases/2023/01/ftc-order-requires-homeadvisor-pay-72-million-stop-deceptively-marketing-its-leads-home-improvement), [TechCrunch](https://techcrunch.com/2023/01/23/the-ftc-fines-homeadvisor-up-to-7-2m-for-lying-about-lead-quality-and-other-matters)). Network leads fell 81% YoY after the 2025 "homeowner choice" change ([Angi Q3-25 8-K](https://www.sec.gov/Archives/edgar/data/1705110/000170511025000132/q32025earningsrelease.htm)). |
| **Thumbtack** | Pay per lead, about $10–$100+; no fixed published rate ([LeadCapture](https://leadcapture.io/blog/thumbtack-lead-cost/)) | Pros report that most leads never reply, the same lead goes to 3–4 pros, and charges now land on arrival with less refunding ([Thumbtack community](https://community.thumbtack.com/discussion/comment/6211), [community thread](https://community.thumbtack.com/discussion/1554/leads)). |
| **Bark** | Credits at about $1.80 each; 3–20+ credits per lead (about $5–$36) ([sidehusl](https://sidehusl.com/bark/)) | Opaque pricing, credit-expiry changes, fake or old leads ([Hook Agency](https://hookagency.com/blog/bark-reviews-contractors/), [UK Business Forums](https://www.ukbusinessforums.co.uk/goto/post?id=2741929)). |
| **Houzz Pro** | From about $399/mo ([Capterra](https://www.capterra.com/p/199689/Houzz-Pro/pricing/)) | Marketplace leads included, but some users report paying more than £4,200/yr for poorly matched leads ([Capterra UK](https://www.capterra.co.uk/software/199689/houzz-pro)). |
| **Google Local Services Ads** | Pay per valid lead, exclusive. 2026 benchmarks put it at about $39–$69 per lead for electrical and plumbing ([CD Calculators](https://cdcalculators.com/local-service-ads-calculator/), [Jobber Academy](https://academy.getjobber.com/local-services-ads)) | Rising cost; ranking depends on **reviews and responsiveness**. |
| **Google Business Profile / Nextdoor** | Free ([Nextdoor Business](https://business.nextdoor.com/en-us/blog/guide-to-claiming-your-nextdoor-business-page)) | Requires reviews and recommendations, which is effort, not money. |
| **BuildingConnected (Autodesk)** | Free for GCs (1.5M+ network); paid Bid Board Pro for subs ([ClockShark review](https://www.clockshark.com/Blog/buildingconnected-review)) | Subs say "no bid invites." The fix is a complete profile and keyword-rich scope ([BC support](https://support.buildingconnected.com/hc/en-us/articles/360012458693-Why-am-I-not-getting-bid-invites-and-what-can-I-do-about-it)). |
| **The Blue Book / Dodge / ConstructConnect** | About $150–$800/mo for Blue Book; ConstructConnect has a free Bid Center ([Dodge](https://www.construction.com/7-best-subcontractor-lead-services-in-2026/), [DownToBid](https://downtobid.com/blog/blue-book-construction-pricing)) | Commercial-skewed and expensive for small subs. |
| **Jobber / Housecall Pro** (FSM, not lead sellers) | $39–$599/mo for Jobber; $59–$329/mo for HCP ([Software Advice](https://www.softwareadvice.com/construction/housecall-profile/vs/jobber/), [Tofu](https://tofu.com/blog/jobber-vs-housecall-pro)) | Very strong content marketing ("best lead generation websites for contractors" ranks on page 1: [Jobber](https://getjobber.com/academy/best-lead-generation-websites-for-contractors/), [HCP](https://housecallpro.com/resources/lead-generation-websites-for-contractors/)). |
| **Procore** | $10k–$80k/yr, priced on annual construction volume, with 10–14% renewal hikes ([Projul](https://projul.com/blog/procore-pricing-analysis-2026/), [OneCrew](https://www.getonecrew.com/post/procore-pricing)) | Opaque, overwhelming, priced out of small contractors. |

### 2.3 Top 5 to differentiate against

| Competitor | The Jobsite's differentiator |
|---|---|
| **Angi / Thumbtack / Bark** | **No per-lead fee.** The contractor sends *their own* branded Design Studio link to referrals, GBP visitors and Nextdoor contacts, and the homeowner arrives already scoped, with photos and a budget expectation. Leads are owned and exclusive by construction. |
| **Jobber / Housecall Pro** | Built for *construction* (permits, AHJ inspections, codes, blueprints, GC↔Sub bridge), not just service calls. Bilingual crew app. A homeowner-facing visualizer with a priced range. |
| **BuildingConnected / Blue Book** | Residential and small-commercial focus. The sub gets a *full operating system* and a free portal when a GC invites them, not just a bid board. Trade-key discovery across 183 trades. |
| **Houzz Pro** | Similar price, but no marketplace lead fees, plus estimates that use real burdened labor, codes and permits. |
| **Procore** | Transparent flat tiers from $149, with no volume-based pricing. |

---

## 3. Target audience

### 3.1 Primary ICP (beachhead)

**Residential trade contractor owner-operators in electrical, plumbing and concrete/flatwork, with 1–20 people, in the US Sun Belt and Midwest. Bilingual crews and Spanish-first owners are explicitly included.**

Why these trades:
- Electrical and plumbing are the v1.0 modules (P-01) and have the deepest code, permit and inspection support (T-59).
- Concrete flatwork is the **only** Design Studio trade built, so the full intake → render → range → proposal demo works for it today.

Why bilingual:
- Hispanic owners held about 212k US construction firms but only about 2.4% of revenue, meaning many small firms ([CPWR Chart Book](https://elcosh.org/document/1059/287/d000038/sect8.html)).
- Latino-owned construction businesses were the only growing segment from 2007 to 2012 ([NewsTaco / Census SBO](https://newstaco.com/2018/01/02/number-hispanic-construction-business-owners-rises-every-age-group/)).
- Almost no competitor ships full EN+ES (P-09 is locked here).

### 3.2 Secondary ICP

- **Small residential GCs and remodelers.** Each one onboards subs through the free Sub Portal, and that viral loop is P-04.
- **Specialty subs who want GC work** (fire sprinkler, low voltage, drywall, flooring). They use the discovery directory, a ready-made "get found by GCs" pitch.

### 3.3 Pain points, in their language

| Pain | Evidence |
|---|---|
| "I pay for leads that 4 other guys also got." | [FTC](https://ftc.gov/news-events/news/press-releases/2023/01/ftc-order-requires-homeadvisor-pay-72-million-stop-deceptively-marketing-its-leads-home-improvement), [Thumbtack community](https://community.thumbtack.com/discussion/comment/6211) |
| "Half the leads are fake or never answer." | [Thumbtack community](https://community.thumbtack.com/discussion/1554/leads), [Hook Agency on Bark](https://hookagency.com/blog/bark-reviews-contractors/) |
| "I can't tell what a lead will cost." | [sidehusl on Bark](https://sidehusl.com/bark/), [LeadCapture](https://leadcapture.io/blog/thumbtack-lead-cost/) |
| "Customers don't know what they want or what it costs." This is tire-kickers and vague requests. | `docs/Client_Visualizer_v1_0.md` §Context (the product thesis) |
| "Quoting eats my evenings." | `docs/Estimating_Engine_v1_0.md` (deterministic pricing that seeds lines from blueprint facts) |
| "GCs never send me bid invites." | [BuildingConnected support](https://support.buildingconnected.com/hc/en-us/articles/360012458693-Why-am-I-not-getting-bid-invites-and-what-can-I-do-about-it) |
| "Procore is built for $50M GCs." | [Projul](https://projul.com/blog/procore-pricing-analysis-2026/) |

> **Research gap:** Reddit (r/Plumbing, r/electricians, r/Contractor, r/ContractorUK) could not be fetched from this environment: web search does not index it reliably and direct fetch was blocked. **Free alternative:** search manually in the browser, e.g. `site:reddit.com/r/electricians thumbtack` on Google, or use `reddit.com/r/<sub>/search?q=angi&restrict_sr=1&sort=top`. Paste the top 20 threads into a sheet and tag pain themes. Do this before finalizing messaging.

---

## 4. Acquisition channels, ranked by effort vs. impact

Scores run 1–5 for **Impact** (expected paying contractors) and **Effort** (time and cost).

| # | Channel | Impact | Effort | Why |
|---|---|---|---|---|
| 1 | **GC → Sub viral loop (free Sub Portal + discovery)** | 5 | 2 | Already built (P-04). Every GC customer invites 5–30 subs at no cost to them. Instrument it: invite → activation → paid conversion. |
| 2 | **"Own your leads" content + SEO** (Angi/Thumbtack alternatives, lead cost calculators, permit and code explainers by trade × state) | 5 | 3 | Jobber and HCP prove that "lead generation for contractors" content ranks ([Jobber](https://getjobber.com/academy/best-lead-generation-websites-for-contractors/), [HCP](https://www.housecallpro.com/resources/angi-formerly-angies-list-competitors-sites-like-angi/)). The repo has a unique **programmatic SEO asset**: the jurisdiction/codes engine (state × trade → code edition, AHJ, inspection sequence) can generate thousands of genuinely useful pages, e.g. "Electrical permit inspections in Dane County, WI." |
| 3 | **Local Facebook groups + Nextdoor (contractor and homeowner groups)** | 4 | 2 | Facebook is tradespeople's #1 social platform ([HVP survey](https://www.hvpmag.co.uk/Survey-85-of-tradespeople-dont-know-how-to-use-social-media-effectively/12225)). Neighbors ask for plumbers in neighborhood groups ([ServiceTitan](https://www.servicetitan.com/blog/social-media-for-tradesmen)). Nextdoor pages are free ([Nextdoor](https://business.nextdoor.com/en-us/blog/guide-to-claiming-your-nextdoor-business-page)). Pitch it as *"post your Design Studio link when someone asks for a quote."* |
| 4 | **YouTube / short-form demos (EN and ES)** | 4 | 3 | Trust spreads peer-to-peer on the jobsite ([Cleverence](https://www.cleverence.com/articles/business-blogs/influencer-marketing-for-trade-reaching-the-modern-contractor-4927)). Show a 60-second "blueprint PDF → full schedule in 30 s" clip and a "client photo → render → price range" clip. Sponsor small trade creators rather than big ones. |
| 5 | **Trade associations, local chapters** (ASA, ABC, IEC, PHCC, local HBA/NAHB) | 4 | 3 | Monthly chapter meetings with speaker slots ([ASA wiki](https://en.wikipedia.org/wiki/American_Subcontractors_Association)). National sponsorship costs $5k–$25k ([ASA sponsorship](https://asaonline.com/assets/pdf/ASA+Silver+Sponsorship+10-2024)), so **start with free chapter talks**, not sponsorships. |
| 6 | **Supply houses and distributors** (electrical and plumbing counters) | 3 | 2 | Every small contractor visits one weekly. Counter flyers, QR codes and "contractor breakfast" demos are cheap and local. *(Hypothesis: no source found; validate with design partners.)* |
| 7 | **Hispanic contractor networks** (Spanish-language radio, local Hispanic chambers, Spanish Facebook groups) | 4 | 3 | The underserved bilingual segment (§3.1) plus OQ-12. EN+ES is a real moat here. |
| 8 | **Google Ads / LSA *for The Jobsite itself*** | 3 | 4 | Expensive B2B clicks. Use later and only on high-intent terms ("angi alternative," "contractor estimating software"). |
| 9 | **Review sites** (Capterra, G2, Software Advice) | 3 | 2 | Buyers compare there (every competitor link above came from these). Free listings; ask the first 10 customers to review. |
| 10 | **Paid lead-seller conquesting** (ads at people searching Angi complaints) | 2 | 3 | Works only once the landing page and proof exist. |

### Keyword targets (seed list)

Seeds:
- *angi alternative for contractors*
- *thumbtack alternative*
- *homeadvisor alternative*
- *how to get more plumbing customers*
- *how to get electrical jobs without angi*
- *contractor estimating software*
- *electrical estimating software small business*
- *plumbing estimate template*
- *construction proposal template*
- *how to get on GC bid lists*
- *subcontractor bid invitations*
- *concrete patio cost calculator*
- *driveway cost estimator* (homeowner-side, which feeds Design Studio)
- *software para contratistas en español*
- *app para contratistas*
- *[trade] permit inspection [county/state]* (programmatic, from the codes engine)

These terms come from competitor content and the search results above, **not from measured search volume.**

> **Tool gap:** no paid SEO tool (Ahrefs or Semrush) was available, so no volumes or difficulty scores are listed. **Free alternatives:** Google Keyword Planner (free with a Google Ads account, no spend required), Google Trends, Google Search Console once the site is live, and the "People also ask" and autocomplete results. Validate these seeds there before committing to content.

---

## 4b. How to figure out advertising (a repeatable method)

"Advertising" means two different things here. **Part 1** is advertising The Jobsite to contractors. **Part 2** is helping contractors advertise themselves, which is a "find work" feature.

### Part 1: Advertising The Jobsite. Research, set the math, test small, then scale.

**Step 1: Copy what already works (free, about 2 hours).**
- **Meta Ad Library** ([facebook.com/ads/library](https://www.facebook.com/ads/library)): free and needs no account. It shows every active ad on Facebook and Instagram, and you can search by brand or keyword ([Segwise guide](https://segwise.ai/blog/meta-ad-library-competitor-research)).
  - Search brands: Jobber, Housecall Pro, Joist, Thumbtack for Pros, Angi Pros, Buildertrend.
  - Search keywords: "contractor software", "more jobs", "leads", "contratistas".
  - **An ad that has run for months is almost certainly profitable.** Longevity is the only free performance signal, because the library shows no spend or results ([Billo](https://billo.app/blog/meta-ad-library/)).
- **Google Ads Transparency Center** ([adstransparency.google.com](https://adstransparency.google.com)): free, covering Search, YouTube and Maps ads from the last year. It searches by advertiser or domain only, not by keyword ([PPC Land](https://ppc.land/a-deep-dive-into-the-google-ads-transparency-center/)). Look up getjobber.com, housecallpro.com, angi.com and thumbtack.com.
- Write every long-running ad into a sheet with these columns: competitor, platform, hook, offer, format, months live, and language. Expect 3–5 recurring hooks; those are the market's proven angles.

**Step 2: Know your break-even before spending a dollar.** With free software, ad spend is repaid by payments and success-fee revenue (§0.1), not subscriptions.

```
Allowed CAC = monthly revenue per active contractor × expected months retained × gross margin
Revenue/contractor (payments) = monthly volume processed × platform margin over card cost
```

*Illustration only; these numbers are assumptions, not data:* $15k/mo processed × 0.5% margin = $75/mo; × 24 months × 80% = about **$1,440 allowed CAC**. If only 40% of signups ever process payments, the allowed cost **per signup** is about $575. Replace the assumptions with design-partner answers from quick win 0b.

**Step 3: Small, controlled tests.** Spend $300–$500 per channel over 2 weeks, test one message per ad set, and measure **cost per *activated* contractor** (signed up, then created an estimate or opened the work feed), **not** cost per click.

| Test | Why test it | Benchmark to beat | Notes |
|---|---|---|---|
| **Meta (FB/IG) lead or signup ads**, EN and ES, targeted at small-business owners with construction interests in 2–3 metro areas | Cheapest traffic; Facebook is tradespeople's #1 social platform ([HVP](https://www.hvpmag.co.uk/Survey-85-of-tradespeople-dont-know-how-to-use-social-media-effectively/12225)) | All-industry lead campaigns run about $1.88 CPC / $22 CPL; B2B SaaS about $63 CPL ([Focus Digital](https://focus-digital.co/average-cost-per-lead-on-facebook-july-2026-report/), [AdManage](https://admanage.ai/blog/facebook-ads-cost-per-lead-benchmarks)) | Video of the work feed ("12 new permits in your trade this week") beats feature lists. Run Spanish creative as its own ad set. |
| **Google Search on high-intent terms only**: "angi alternative," "thumbtack for pros alternative," "contractor estimating software," "software para contratistas" | Captures people already shopping | Average 2026 CPC is about $5.42 across industries ([WordStream](https://www.wordstream.com/blog/2026-google-ads-benchmarks)). Homeowner-service keywords (plumber near me) cost $10–$30, and **those are not our keywords** ([Hook Agency](https://hookagency.com/blog/google-ads-cost-for-contractors/)) | Check volume and CPC for our terms in Keyword Planner (free) first. Use exact match only, and add negative keywords for homeowner searches. |
| **YouTube in-stream** on trade channels (placements) | Peer trust; demos show well | Use the same activation metric | A 30-second "permit → bid → paid" story |
| **Boosted posts in local contractor FB groups / Nextdoor** | Very cheap; tests messaging | — | Run this before paid campaigns as a free message test |

**Step 4: Decide with a rule, not a feeling.**
- **Kill** a test at 2× the target cost per activated contractor.
- **Iterate** it, with one new hook or one new audience, between 1× and 2×.
- **Scale** it by 20–30% a week while it stays under 1×.
- Revisit the CAC math monthly using real retention.

**Tracking needed (gap).** Every ad link needs UTM tags, and signup has to store `utm_source/campaign` on the tenant so cost per activated contractor can be computed. **The repo has no signup-attribution field today.** It's a small product change, not made here. Free tooling for now: UTM links, Google Analytics 4, and Meta Pixel / Conversions API.

### Part 2: Helping contractors advertise themselves (a find-work feature)

The platform already sees what contractors can't: **which jobs closed and what they paid** (estimates → awarded → invoices). Add a **lead source** to each design request, estimate and project (Google, LSA, Nextdoor, referral, Jobsite work feed, Angi, …). Then show contractors a simple report:

> *"Last 90 days: Google Business Profile brought 9 jobs worth $41k; Thumbtack cost $640 for 1 job worth $900."*

That turns "where should I advertise?" into an answer from their own data. Pair it with built-in **review requests** after a paid invoice, since reviews drive Google Local Services Ads ranking and cost ([Jobber Academy](https://academy.getjobber.com/local-services-ads)). This isn't built yet. It's a strong retention hook and fits the free-software, paid-work model.

---

## 5. Messaging and value proposition

**Core promise (revised per §0.1):**
> **Find work. Run it free.**
> Every new permit and public bid in your trade and area, GCs who invite you to bid, peers who pass you overflow jobs, and a link that turns "how much?" into a priced request. The software that runs your business is free. **You pay only when platform-sourced work pays you, never per lead.** In English and Spanish.

Spanish draft: *"Encuentre trabajo. Administre gratis. Solo paga cuando le pagan."* Get a native speaker to review it.

**Original core promise** (still useful as a secondary "own your leads" message):
> **Stop renting leads. Own your pipeline.**
> The Jobsite gives your customers a link to describe the job, see it, and get a ballpark price. You get a scoped, exclusive request, an estimate in minutes, and a proposal they can accept from their phone. No per-lead fees. In English and Spanish.

### Pillars

| Pillar | Message | Proof in the product |
|---|---|---|
| **Exclusive, owned leads** | "Your link. Your customer. Nobody else gets the call." | Design Studio invite link; the client lives in *your* tenant |
| **Qualified before you drive out** | "They've sent photos, picked finishes and seen a price range before you call back." | Wizard, photos, render, `range_low/high_cents` |
| **Quote the same day** | "Turn their answers or a blueprint into a priced estimate and branded proposal in minutes." | Estimating engine, proposal PDF, 7-day link, client accept |
| **Get found by GCs** | "Opt in once. GCs searching for your trade in your state find you, and they invite you free." | Discovery directory, Sub Portal |
| **Built for crews, in their language** | "Your crew clocks in, logs work and snaps QA photos offline, en español." | Offline mobile, EN+ES |
| **Honest pricing** | "Flat monthly price from $149. No per-lead fees. No volume tax." | PR-01..08 vs. [Procore ACV pricing](https://projul.com/blog/procore-pricing-analysis-2026/) |

Spanish tagline draft: *"Deje de pagar por clientes compartidos. Sus clientes, su enlace."* This is a draft only; have a native speaker review it, in the same spirit as the T-08 human-translation rule.

**Claims to avoid until they are true:**
- "Marketplace" or "we send you jobs": the marketplace channel is not built.
- "AI renders": no cloud image provider is chosen, and the owner-testing providers are not licensed for clients (`docs/Client_Visualizer_v1_0.md`).
- Any trade beyond concrete flatwork for the Design Studio.

---

## 6. Quick wins (this week, about $0)

**New, for the §0.1 direction:**

0a. **Prove tier A by hand before building it.** Pull last month's permits for 2 cities from their open-data portals, and the SAM.gov construction solicitations for one state (free key). Filter them for electrical, plumbing and concrete. Send a weekly email digest to the design partners from item 3, then measure replies, bids and wins. If tradespeople forward it, build the feed.

0b. **Interview 10 contractors about pricing**, asking three things:
   - "Would you route customer payments through us if the software were free?"
   - "Would you pay X% only on jobs we found for you?"
   - "Would you pass overflow jobs to peers for a finder's fee?"

   These three answers decide revenue lines 1–3.

0c. **Run a landing-page test** with "Find work. Run it free." against "Own your leads," using two variants, a waitlist form, and $0 traffic from the Facebook groups in item 3.

**Original quick wins (still valid):**

1. **Write a one-page landing section** at `thejobsite.app` titled "Angi alternative for contractors: own your leads," with a 60-second Design Studio screen recording on the concrete patio flow, which already works end to end.
2. **Claim free listings**: Capterra, G2, Software Advice, Google Business Profile for The Jobsite, and a Nextdoor business page.
3. **Answer OQ-11 by recruiting design partners in 5 local Facebook contractor groups and 2 Spanish-language ones.** Offer free Professional for 6 months in exchange for weekly feedback and a review. Target concrete, electrical and plumbing contractors.
4. **Run the Reddit pain-theme pull manually** (§3.3 gap). Collect 20 threads into a sheet and use their exact phrases in the copy.
5. **Validate keywords** in Google Keyword Planner and Trends (free) for the §4 seed list. Pick 3 articles to write first.
6. **Call 2 local supply houses** and ask for a counter flyer spot or a breakfast demo slot.
7. **Email 3 local chapters** (ASA, IEC or PHCC, and the local HBA) to offer a free 20-minute talk: "What the FTC HomeAdvisor case means for your lead budget."
8. **Instrument the funnels that already exist.** Track Sub Portal invites, sub activation, Design Studio links sent, submits and proposals accepted. This is product analytics, not new features; it needs a decision on tooling (PostHog has a free tier).

---

## 7. Longer-term growth levers

| Lever | What | Notes and dependencies |
|---|---|---|
| **Public contractor profile pages** | An SEO-indexable page per tenant (trades, service area, reviews, "Start a project" Design Studio button) | Biggest missing piece for "find new work." It would reuse the `tenant_discovery_profiles` opt-in data. Needs a product decision and a design. |
| **Review capture → GBP / LSA** | After a project closes, prompt the homeowner for a Google review | Reviews drive LSA ranking and cost ([Jobber Academy](https://academy.getjobber.com/local-services-ads)). Low build cost. |
| **Programmatic code/permit SEO** | State × county × trade pages generated from the jurisdiction engine | A unique data moat nobody else in this space has. Watch for thin-content risk: each page must carry real AHJ and inspection data. |
| **Permit-data lead feed** | Ingest open-data permit portals (Socrata cities) and alert subs to recently permitted projects in their trade and area | Public data that is legal to use ([Apify listing](https://apify.com/prometheusagency/us-building-permits)). Fits the existing geocode and ZIP→county pipeline. A strong "find work" feature for subs. |
| **More Design Studio trades** | Add patios/decks, fencing, roofing, painting and electrical service upgrades | Each one is a module plus catalog rows (T-65 invariant 5). Every trade added widens the ICP. |
| **Homeowner marketplace (`channel='marketplace'`)** | Route unassigned Design Studio requests to opted-in contractors | Only if it is **exclusive and transparent** (one contractor at a time, or flat-fee). Otherwise it becomes the thing being positioned against. A big strategic decision. |
| **Discovery directory pricing** | Consider making GC search free (not add-on-gated) to grow the network, and monetize the sub side through seats | A trade-off: network growth vs. PR-08 add-on revenue. |
| **Partnerships** | Supply houses, trade schools, state contractor-licensing exam prep, Hispanic chambers | Distribution where the ICP already gathers. |
| **Referral program** | Contractor-to-contractor credit (one month free per paid referral) | Standard SaaS mechanic that fits peer-trust dynamics. |

---

## 8. Open decisions for the owner

**New, for the §0.1 direction:**

A. ✅ **ACCEPTED 2026-10-18** as PR-09/PR-10 (ADR-0001). GC directory search is free. Launch markets: Dane, Rock and Milwaukee counties + Chicago (see Proposal 01). *Original text:* **Confirm the free-software model.** If yes, write an ADR reversing PR-01..08, P-03 and P-05, and update the Pricing and tier-enforcement docs and billing. Strongest argument against: payments revenue needs real transaction volume, and paid seats make money sooner.

B. **Choose the primary revenue line.** Payments take rate (predictable, no conflict with contractors) or success fee (clearer story, but harder to enforce). Recommendation: payments first, with the success fee only on tier B, C and E work.

C. **Build tier A (public demand feed) as the first "find work" feature?** Recommendation: yes. It's the only work source that is useful with zero network.

**Original decisions:**

1. **Marketplace or not.** This is the biggest fork.
   - *For:* it directly answers "help me find new work," and the schema already allows it.
   - *Against:* it turns The Jobsite into the lead seller its positioning attacks, and it brings two-sided cold-start costs.
2. **Discovery directory gating.** Free GC search grows the network faster; the add-on gate earns revenue sooner.
3. **Design Studio image provider and tier pricing.** These block any public "see your project" claim (Client_Visualizer open questions 1–2).

---

*Sources were checked 2026-10-18. Vendor and agency cost figures are self-reported or estimates; the primary sources are the FTC, SEC and Census/CPWR links.*
