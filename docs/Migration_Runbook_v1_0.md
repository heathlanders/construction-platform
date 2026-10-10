# Infrastructure Migration Runbook v1.0
**Locked decisions: A-12, A-14, A-16, T-24, T-25, T-26**

> This runbook covers the DigitalOcean → AWS migration and all sub-migrations
> that happen at Stage 3 (300+ tenants or enterprise SLA commitment).

---

## 1. Migration triggers (T-24)

Migrate from Stage 1–2 (DigitalOcean) to Stage 3 (AWS) when ANY of:
- Tenant count reaches 300
- First enterprise customer requires SOC 2 Type II (forces AWS)
- Platform commits to 99.9%+ SLA requiring multi-AZ redundancy
- Monthly infrastructure cost on DigitalOcean exceeds $2,000 (AWS becomes cheaper at scale)

---

## 2. Stage migration overview

| Stage | Infrastructure | Job queue | Real-time | File storage | Virus scan |
|-------|---------------|-----------|-----------|-------------|-----------|
| 1–2 | DigitalOcean | pg-boss | Pusher | DO Spaces | Cloudmersive |
| 3+ | AWS | SQS | Native WebSocket | S3 | GuardDuty |

All migrations are designed to be **zero-code-change** — swap environment variables only.

---

## 3. File storage migration: DO Spaces → AWS S3 (T-25)

**Time estimate:** 1 sprint (2 weeks) for a platform at 300 tenants.
**Zero downtime:** Yes — redirect writes to S3 first, backfill existing files.

### Step-by-step

```bash
# 1. Provision S3 bucket with same path structure
aws s3 mb s3://platform-live-prod --region us-east-1
aws s3 mb s3://platform-quarantine-prod --region us-east-1

# 2. Update environment variables (new deployments write to S3)
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=<aws-access-key>
STORAGE_SECRET_KEY=<aws-secret-key>
STORAGE_LIVE_BUCKET=platform-live-prod
STORAGE_QUARANTINE_BUCKET=platform-quarantine-prod
# No code changes — SDK uses same S3-compatible interface

# 3. Deploy updated environment
# All NEW uploads now go to S3

# 4. Backfill existing files from Spaces to S3
aws s3 sync \
  s3://platform-live-dev \
  s3://platform-live-prod \
  --source-region nyc3 \
  --region us-east-1

# 5. Verify file counts match
aws s3 ls s3://platform-live-dev --recursive --summarize | tail -2
aws s3 ls s3://platform-live-prod --recursive --summarize | tail -2

# 6. Update pre-signed URL generation — verify URLs resolve correctly
# 7. Keep DO Spaces read-accessible for 30 days (for any cached pre-signed URLs)
# 8. Decommission DO Spaces after 30-day buffer
```

---

## 4. Job queue migration: pg-boss → AWS SQS (A-14)

**Zero downtime:** Yes — drain pg-boss queue before cutting over.

### Step-by-step

```bash
# 1. Provision SQS queues
aws sqs create-queue --queue-name platform-jobs
aws sqs create-queue --queue-name platform-jobs-dlq

# 2. Stop enqueuing new jobs to pg-boss
#    (Deploy with JOB_QUEUE_PROVIDER=sqs — new jobs go to SQS)

# 3. Let pg-boss drain — monitor:
SELECT COUNT(*) FROM pgboss.job WHERE state = 'created' OR state = 'active';
# Wait until count = 0

# 4. Update environment variables
JOB_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/<account>/platform-jobs
JOB_DLQ_URL=https://sqs.us-east-1.amazonaws.com/<account>/platform-jobs-dlq
JOB_QUEUE_PROVIDER=sqs

# 5. Verify workers are processing SQS messages
# 6. Run pg-boss stop() gracefully — don't DROP the schema yet
# 7. After 7-day monitoring period with no pg-boss activity: DROP SCHEMA pgboss CASCADE
```

---

## 5. Real-time migration: Pusher → Native WebSocket (A-16)

**Time estimate:** 1 sprint. Channel naming convention is unchanged — clients reconnect seamlessly.

### Step-by-step

```bash
# 1. Deploy native WebSocket server (same channel auth endpoint at /v1/ws/auth)
# 2. Update client configuration — point to native WS endpoint instead of Pusher
# 3. Deploy in parallel — Pusher + native WS both live briefly
# 4. Monitor connection counts on both
# 5. When 100% of clients on native WS — decommission Pusher
```

The channel naming (`private-tenant-{tenant_id}`) and auth endpoint contract
(`POST /v1/pusher/auth` → `POST /v1/ws/auth`) remain unchanged.

---

## 6. Virus scanner migration: Cloudmersive → GuardDuty (T-26, T-30)

Scanner is behind a provider-agnostic interface. Swap via environment variable:

```bash
VIRUS_SCANNER_PROVIDER=guardduty   # was: cloudmersive
# No code changes — scanner interface abstracts the provider
```

### Pre-migration checklist
- GuardDuty malware protection enabled on S3 bucket
- Test scan: upload EICAR test file, verify quarantine blocks it
- Verify `VIRUS_SCANNER_PROVIDER` env var is read at startup, not cached

---

## 7. Database: no migration needed

PostgreSQL stays on managed PostgreSQL throughout (DigitalOcean Managed DB → AWS RDS).
When migrating the database host:

```bash
# 1. Provision AWS RDS PostgreSQL 15 instance
# 2. pg_dump from DO Managed DB
pg_dump $DATABASE_URL | gzip > platform_snapshot_$(date +%Y%m%d).sql.gz

# 3. pg_restore to RDS
gunzip -c platform_snapshot_*.sql.gz | psql $AWS_DATABASE_URL

# 4. Verify row counts across key tables
# 5. Update DATABASE_URL and DATABASE_POOL_URL — point to AWS RDS + PgBouncer
# 6. Validate PgBouncer transaction mode on RDS (T-43 checklist)
# 7. Run RLS isolation tests against new DB before enabling traffic
```

---

## 8. Zero-downtime deployment checklist (all migrations)

- [ ] All migrations tested in staging environment first
- [ ] RLS isolation test suite passes against new infrastructure
- [ ] PgBouncer transaction mode validated (T-43)
- [ ] Pre-signed URL generation validated end-to-end
- [ ] Background job envelope `tenant_id` validated in new queue
- [ ] Audit log continuity verified (no gaps in hash chain)
- [ ] Rollback plan documented and tested for each migration step
- [ ] On-call engineer designated for migration window
