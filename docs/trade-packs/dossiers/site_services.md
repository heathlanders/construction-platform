# Dossier — `site_services` (Site Services — Portable Toilets / Temp Fence / Temp Power)

> Wave: w23 · Researched: 2026-10-08 · Pack: `api/src/lib/trades/packs/site_services.ts` · Status: draft
> Taxonomy: category `services` · permit_trade `null` · phase `site_prep` · CSI `01 50`

## Scope (2–4 sentences)
Rental-vendor temporary facilities: portable toilets + handwash stations, drinking water, temporary
perimeter fence and gates, temporary power distribution and lighting. Sized to crew, placed per the
site logistics plan, serviced on schedule, removed at closeout. Dumpsters/haul-off = `hauling`;
lane closures for deliveries = `traffic_control`; permanent service = `electrical`.

## Existing coverage reconciled
- Hand recipe: none (permit_trade null → generic no-permit step only) → pack complements; SERVICES pattern (no recipes).
- Catalog codes already seeded: none for this trade.
- Blueprint template tasks hitting this trade: none.

## Sources used
| id (sources.ts) | Title | Tier | License | Used for |
|---|---|---|---|---|
| ecfr-1926-c | 29 CFR 1926 Subpart C | 1 | gov_open | hazard (competent-person inspection, fence) |
| ecfr-1926-d | 29 CFR 1926 Subpart D (1926.51, 1926.56) | 1 | gov_open | QA toilets Table D-1, handwash, drinking water, lighting Table D-3 |
| ecfr-1926-k | 29 CFR 1926 Subpart K (1926.404, .405, .416) | 1 | gov_open | GFCI/AEGCP, temp wiring, concealed lines |
| ecfr-1926-o | 29 CFR 1926 Subpart O (1926.600, .601) | 1 | gov_open | truck backing, boom near lines |
| site_services-ufgs-01-50-00 | UFGS 01 50 00 Temporary Construction Facilities (Aug 2026) | 1 | public_domain | weekly service, unit placement, fence types/ballast/locked gate/locates |
| site_services-hirepool-ifu-099 | Hirepool IFU-099 Temporary Fencing | 3 | manufacturer_public | clamps, stays every 8 panels, screens reduce wind stability |

## Work steps
None — services pattern (no gates, no code refs, no recipes).

## Hazards
| id | Hazard | OSHA ref | Sev |
|---|---|---|---|
| fence_blowover | Fence line blows over (worse with screens) | 1926.20(b)(2) | 3 |
| temp_power_shock | Shock, no ground-fault protection | 1926.404(b)(1)(i) | 4 |
| damaged_cords | Damaged / floor-run / cord-hung lights | 1926.405(a)(2)(ii)(I) | 3 |
| hidden_utilities | Driving posts/rods into buried lines | 1926.416(a)(3) | 4 |
| service_truck_backing | Pump/delivery truck backing | 1926.601(b)(4) | 4 |
| boom_overhead_lines | Boom or load contacts overhead line | 1926.600(a)(6) | 4 |

## QA checklist (deliverables)
- [ ] Toilet count per 1926.51(c) Table D-1 (1 ≤20; 1 seat+1 urinal/40; 1/50 at ≥200)
- [ ] Weekly-or-more service + current service log (UFGS 3.2.10)
- [ ] Unit placement per logistics plan, out of public view, truck-reachable, clear of dumpsters
- [ ] Handwash 1926.51(f) · Drinking water 1926.51(a)
- [ ] Fence on logistics-plan line, locked gate, locates before posts (UFGS 2.3)
- [ ] Clamps, ballast, stays per supplier; extra bracing before screens (IFU-099)
- [ ] GFCI or AEGCP 1926.404(b)(1) (safety) · Temp wiring 1926.405(a)(2) (safety) · Lighting 1926.56 Table D-3 (safety)

## Inspection / acceptance checkpoints
None formal (no AHJ permit path); deliverable QA covers acceptance.

## Cost basis / Quantity rules / Components
None (services wave).

## Open questions → REVIEW_QUEUE
- source_doubt: temp-fence installation instructions are from a NZ rental supplier (Hirepool IFU-099); no US manufacturer sheet found publicly — swap for a US supplier sheet if one is located.
- es_safety: 6 hazards + 3 safety QA items pending human translation.
