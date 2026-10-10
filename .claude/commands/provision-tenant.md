# /provision-tenant

Generates the full tenant provisioning flow — schema, API endpoint, and service layer.

## Usage
```
/provision-tenant
```

## Context
When a new company signs up, the platform must:
1. Create a tenant record
2. Set up the tenant's schema context (RLS will handle row isolation — no separate schema per tenant)
3. Create the owner user account
4. Provision default roles
5. Send welcome email (via SQS job, not inline)

## Steps
1. Load skill: tenant-context
2. Load skill: rls-patterns
3. Load skill: background-jobs
4. Load skill: audit-log
5. Read Platform_Architecture_v1_1.docx Section 5 (Tenant Provisioning)
6. Read Platform_DataModel_v1_0.docx Section 2 (Platform domain schema)

7. Generate tenant provisioning service:
   ```
   /api/services/tenant-provisioning.ts
   ```
   - Create tenant row in `tenants` table (NOT inside withTenantContext — this creates the tenant)
   - Create owner user row
   - Seed default role assignments
   - Enqueue welcome email SQS job (with new tenant_id in envelope)
   - Write audit log entry: category=admin, action=tenant.created

8. Generate provisioning API endpoint:
   ```
   POST /v1/tenants/provision
   ```
   - Public endpoint (no tenant JWT — this is signup)
   - Validate plan selection against pricing tiers
   - Idempotency key to prevent duplicate tenants

9. Generate provisioning tests:
   - Verify tenant row created
   - Verify owner user created
   - Verify RLS blocks cross-tenant access from new tenant
   - Verify welcome email job enqueued

## Output checklist
- [ ] Tenant provisioning service created
- [ ] Provisioning API endpoint created
- [ ] Default role seeding included
- [ ] Welcome email job enqueued (not inline)
- [ ] Audit log entry written
- [ ] Idempotency key handled
- [ ] Tests generated
