# ADR 0001: Free business software; revenue from paid work, not seats

**Status:** **ACCEPTED 2026-10-18.** Locked as **PR-09** and **PR-10** in `docs/LOCKED_DECISIONS.md`.
**Owner's words:** "should be basically free. gotta be able to find jobs and get paid otherwise whats the point"; on GC directory search: "yes sure".
**Date:** 2026-10-18
**Proposal:** `docs/proposals/01-find-work-network.md`

## Context

- The owner's direction (2026-10-18): finding work is the hardest part of the trades, the platform's goal is to help contractors find work, and business-management software "might as well be free."
- Current locked pricing assumes paid seats and project limits:
  - **PR-01..PR-08:** the Starter, Professional, Business and Enterprise tiers, the add-ons, and per-user overage.
  - **P-03:** only Starter and Professional at v1.0.
  - **P-05:** a 14-day trial with a credit card.
  - **Enforcement code:** `docs/Pricing_Tier_Enforcement_Matrix.md`, the `assertTier` / `assertCanAddUser` / `assertCanCreateProject` calls, and T-55/T-56 gates.
- Comparable free-software models exist and earn on payment processing (Joist, Square: [GetApp](https://www.getapp.co.uk/software/2047614/joist)).

## Decision (proposed)

1. **Operations software is free** on every account: projects, estimating, scheduling, permits, time, mobile. It has **fair-use caps** only where marginal cost is real: storage (T-29 quotas stay, re-set for the free tier) and AI usage (Design Studio renders and assists, already metered in `ai_usage_events`).
2. **Revenue comes from work and money movement:**
   - (a) a fee on customer payments processed through the platform (Stripe Connect);
   - (b) a success fee only on paid jobs the platform sourced (network bids, referrals, marketplace);
   - (c) an optional paid "Work Pro" upgrade that never paywalls the base work feed.
3. **Never charge per lead.**
4. Locked architecture and security decisions are unchanged. This ADR touches pricing and product only.

## Consequences

- **Decisions to supersede:** PR-01..PR-08, P-03 and P-05.
- **Decisions to review:**
  - T-55: permit milestone auto-generation becomes free?
  - T-56: is asset management still gated to Business+?
  - The cross-tenant add-on (PR-08): recommend free.
- **Docs to update:** `LOCKED_DECISIONS.md`, `Pricing_Tier_Enforcement_Matrix.md`, `billing/CLAUDE.md`, `KEY_NUMBERS.md`, and the `.docx` pricing and GTM specs.
- **Code to change:**
  - Signup stops creating a 14-day trial with a card requirement.
  - Tier assertions are relaxed or replaced by fair-use checks.
  - Billing gains Connect.
  - Tests that assert 402 responses must change.
- **Business impact:** revenue starts later and depends on payment volume. Payments become the first revenue milestone (Proposal 01, Phase 3).

## Alternatives considered

- **Keep paid tiers and add the work feed as a paid feature.** It earns sooner, but it contradicts the owner's direction and reads as lead selling.
- **Freemium with a seat cap.** It is familiar, but every limit is friction against network growth, and network growth is what sources work.

## Resolved with acceptance

- **GC search of the discovery directory is free (PR-10):** the cross-tenant add-on gate is removed. The code change is pending.

## Still to do

- **Code:** the pricing migration (signup, tier assertions, tests) and Stripe Connect (Proposal 01, Phase 3).
- **Docs not yet updated:** `KEY_NUMBERS.md`, `PROJECT_MASTER_REFERENCE.md`, and the `.docx` pricing and GTM specs.

## Open questions

- Should existing paying tenants be grandfathered, or migrated to free?
- What fair-use cap numbers (storage GB, renders per month) apply on the free tier?
