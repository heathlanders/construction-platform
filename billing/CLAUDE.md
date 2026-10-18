# Billing Module — Claude Code Context

## Spec docs for this module
@../docs/Platform_Pricing_Billing_v1_0.docx
@../docs/Platform_API_Spec_v1_0.docx

## Pricing model: free software, paid work (PR-09/PR-10, ADR-0001, accepted 2026-10-18)
- **Business software is free.** Fair-use caps apply only to storage and AI usage.
- **Revenue:**
  1. A fee on customer payments processed through the platform. This needs **Stripe Connect**, which is not built: there is no customer-invoice PaymentIntent code, and `invoices.stripe_payment_intent_id` is unused.
  2. A success fee only on paid jobs the platform sourced, collected in the payment flow.
  3. An optional upgrade that never paywalls the work feed.
- **Never charge per lead.**
- The subscription tiers below are **superseded** but still enforced in code until the pricing migration ships.
- Plan: `docs/proposals/01-find-work-network.md` Phase 3. That phase moves money and requires KYC, so it is risky work: use `stripe:connect-recommend` to pick the charge type, and run `reviewer` before merge.

## Tiers (superseded by PR-09; still enforced in code until migration)
- Starter: free/low-cost, limited seats
- Professional: mid-tier, full feature set
- Enterprise: custom pricing, SSO, SLAs
- Trade Contractor: trade-specific pricing

## Stripe integration
Webhook-driven. All billing state derives from Stripe events.
Inbound webhooks: async processing, event ID deduplication, signature validation first.
See skill: @../.claude/skills/background-jobs/SKILL.md (webhook pattern)

## Tenant context
Billing records scoped to tenant_id like all other data.
withTenantContext() required on all billing DB queries.
