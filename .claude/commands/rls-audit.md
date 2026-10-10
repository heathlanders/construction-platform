# /rls-audit

Scans the codebase for tenant isolation violations before any PR or deploy.

## Usage
```
/rls-audit
```
Run this before every PR. Non-negotiable pre-merge check.

## Steps

1. Load skill: tenant-context
2. Load skill: rls-patterns

3. Run the following checks across the entire codebase:

### Check 1 — Raw DB calls outside withTenantContext
```bash
grep -rn "prisma\." --include="*.ts" src/ | grep -v "withTenantContext" \
  | grep -v "// superadmin" | grep -v "prisma.connect" | grep -v "prisma.disconnect"
```
Any result = VIOLATION. Every Prisma query must be inside withTenantContext().

### Check 2 — SET SESSION usage (must never appear)
```bash
grep -rn "SET SESSION" --include="*.ts" src/
```
Any result = CRITICAL VIOLATION. Only SET LOCAL is permitted.

### Check 3 — New tables missing RLS policies
```bash
# Find tables in migrations without accompanying RLS policy
grep -l "CREATE TABLE" prisma/migrations/ | xargs grep -L "ROW LEVEL SECURITY"
```
Any migration creating a tenant-scoped table without RLS = VIOLATION.

### Check 4 — Hardcoded tenant IDs
```bash
grep -rn "tenant_id.*=.*'" --include="*.ts" src/ | grep -v "// test" | grep -v ".env"
```
Tenant IDs must always come from JWT claims, never hardcoded.

### Check 5 — Direct storage URL exposure
```bash
grep -rn "spaces.digitaloceanspaces.com\|s3.amazonaws.com" --include="*.ts" src/
```
All storage access must use pre-signed URLs. Direct URLs = VIOLATION.

### Check 6 — Missing User-Agent validation on new routes
```bash
grep -rn "fastify.route\|fastify.get\|fastify.post\|fastify.put\|fastify.delete" \
  --include="*.ts" src/api/ | grep -v "validateUserAgent"
```

4. Report findings:
   - CRITICAL: violations that could leak tenant data (Checks 1, 2, 4)
   - HIGH: security gaps (Checks 3, 5, 6)
   - For each violation: file, line number, suggested fix

5. Output PASS or FAIL with full findings list

## Output
- Summary: X critical, Y high, Z warnings
- Full list of violations with file:line references
- PR is NOT ready to merge until all CRITICAL and HIGH items are resolved
