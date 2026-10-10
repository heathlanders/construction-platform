# Billing Module — Claude Code Context

## Spec docs for this module
@../docs/Platform_Pricing_Billing_v1_0.docx
@../docs/Platform_API_Spec_v1_0.docx

## Tiers (locked)
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
