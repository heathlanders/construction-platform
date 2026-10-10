# Production Deployment Checklist
**Stage 1 — DigitalOcean (up to ~300 tenants)**

> Work through every section in order. Check each item before moving to the next section.
> Architecture reference: `docs/Platform_Architecture_v1_1.docx` §9.5 (Staged Infrastructure Plan).

---

## 1. DigitalOcean infrastructure setup

### Droplet
- [ ] Create Droplet: Ubuntu 22.04, minimum **4 vCPU / 8 GB RAM** (scale up at ~50 tenants)
- [ ] Enable DigitalOcean Firewall: allow inbound 80/443 from Cloudflare IPs only; allow 22 from your IP only
- [ ] Install Docker + Docker Compose on Droplet

### Managed PostgreSQL
- [ ] Create **Managed PostgreSQL 15** cluster (smallest plan, 1 standby node for HA)
- [ ] Note the connection string — you'll need it for `DATABASE_URL` and `DATABASE_DIRECT_URL`
- [ ] Enable **PgBouncer** in transaction mode on the managed cluster (or deploy a PgBouncer Droplet if the managed cluster doesn't include it)
  - `PGBOUNCER_POOL_MODE=transaction` — **critical, validates T-43**
  - `PGBOUNCER_SERVER_RESET_QUERY=DISCARD ALL` — validates T-49
- [ ] Note the PgBouncer connection string — you'll need it for `DATABASE_POOL_URL`

### Redis
- [ ] Create **Managed Redis 7** instance (smallest plan)
- [ ] Note the connection string — you'll need it for `REDIS_URL`

### Spaces (object storage)
- [ ] Create two Spaces buckets in the same region as your Droplet:
  - `{your-app}-quarantine` — **no public access**, 24-hour lifecycle expiry rule on all objects
  - `{your-app}-live` — **no public access**, pre-signed URLs only (T-05)
- [ ] Create a Spaces Access Key (scoped to both buckets)
- [ ] Note: `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_ENDPOINT` (e.g. `https://nyc3.digitaloceanspaces.com`), `DO_SPACES_REGION`

### Container Registry
- [ ] Create a DigitalOcean Container Registry
- [ ] Authenticate: `doctl registry login`

---

## 2. Environment variables

Copy `.env.example` to `.env.production` and fill in every value. Required variables:

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Managed PostgreSQL | Direct connection (migrations, prisma) |
| `DATABASE_DIRECT_URL` | Managed PostgreSQL | Same as DATABASE_URL |
| `DATABASE_POOL_URL` | PgBouncer | Transaction-mode pool — all runtime queries |
| `REDIS_URL` | Managed Redis | `redis://user:pass@host:port` |
| `JWT_SECRET` | Generate | `openssl rand -base64 64` — minimum 32 chars, never rotate without a migration plan |
| `JWT_EXPIRY_WEB` | — | `86400` (24 hours) |
| `JWT_EXPIRY_MOBILE` | — | `2592000` (30 days) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Live key — `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard | After registering webhook endpoint |
| `STRIPE_PRICE_ID_STARTER` | Stripe Dashboard | Live price ID for Starter plan |
| `STRIPE_PRICE_ID_PROFESSIONAL` | Stripe Dashboard | Live price ID for Professional plan |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks Developer | Production app credentials |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks Developer | |
| `QUICKBOOKS_REDIRECT_URI` | — | `https://yourdomain.com/v1/integrations/quickbooks/callback` |
| `DOCUSIGN_INTEGRATION_KEY` | DocuSign Developer | JWT grant integration key |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign Account | Production account ID |
| `DOCUSIGN_PRIVATE_KEY` | DocuSign Developer | RSA private key for JWT grant |
| `SENDGRID_API_KEY` | SendGrid | Full access key |
| `SENDGRID_FROM_EMAIL` | — | Verified sender email |
| `DO_SPACES_KEY` | Spaces Access Key | |
| `DO_SPACES_SECRET` | Spaces Access Key | |
| `DO_SPACES_ENDPOINT` | — | e.g. `https://nyc3.digitaloceanspaces.com` |
| `DO_SPACES_REGION` | — | e.g. `nyc3` |
| `DO_SPACES_QUARANTINE_BUCKET` | — | `{your-app}-quarantine` |
| `DO_SPACES_LIVE_BUCKET` | — | `{your-app}-live` |
| `CORS_ORIGIN` | — | Your production frontend URL |
| `PORT` | — | `3000` (API) |
| `LOG_LEVEL` | — | `info` |
| `NODE_ENV` | — | `production` |

---

## 3. Stripe setup

- [ ] Create **Stripe Products and Prices** for each tier (do this in the Stripe Dashboard, **not** via API for first setup):
  - Starter Monthly: `$149/mo` recurring
  - Professional Monthly: `$349/mo` recurring
  - GC Module Add-on: `$99/mo` recurring
  - Annual variants (17% discount): create separate prices with annual interval
- [ ] Copy each price's ID (format: `price_...`) → fill into `.env.production` as `STRIPE_PRICE_ID_*`
- [ ] Register webhook endpoint in Stripe Dashboard:
  - URL: `https://yourdomain.com/v1/webhooks/stripe`
  - Events to listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Copy **Signing Secret** (format: `whsec_...`) → `STRIPE_WEBHOOK_SECRET`
- [ ] Test with Stripe CLI: `stripe listen --forward-to https://yourdomain.com/v1/webhooks/stripe`

---

## 4. QuickBooks setup

- [ ] Register a **QuickBooks Production App** at developer.intuit.com
- [ ] Set **Redirect URI** to: `https://yourdomain.com/v1/integrations/quickbooks/callback`
- [ ] Copy **Client ID** and **Client Secret** → `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`
- [ ] Register webhook endpoint in QuickBooks Developer Dashboard:
  - URL: `https://yourdomain.com/v1/webhooks/quickbooks`
  - Select entity types: Invoice, Customer, Payment
- [ ] Copy the webhook **verifier token** → `QUICKBOOKS_WEBHOOK_TOKEN`

---

## 5. DocuSign setup

- [ ] Create a **DocuSign Production Integration Key** for JWT Grant auth
- [ ] Upload your RSA public key to the integration key
- [ ] Grant consent for the service account user via the DocuSign admin panel
- [ ] Copy Integration Key → `DOCUSIGN_INTEGRATION_KEY`
- [ ] Copy Production Account ID → `DOCUSIGN_ACCOUNT_ID`
- [ ] Copy RSA Private Key (PEM) → `DOCUSIGN_PRIVATE_KEY` (use a multi-line env var or a mounted secret)
- [ ] Register Connect webhook:
  - URL: `https://yourdomain.com/v1/webhooks/docusign`
  - Events: `envelope_sent`, `envelope_completed`, `envelope_declined`, `envelope_voided`

---

## 6. First deployment

### Build and push images
```bash
# From your local machine (authenticated to DO Container Registry)
docker build -t registry.digitalocean.com/{your-registry}/api:latest -f api/Dockerfile api/
docker build -t registry.digitalocean.com/{your-registry}/web:latest -f web/Dockerfile web/

docker push registry.digitalocean.com/{your-registry}/api:latest
docker push registry.digitalocean.com/{your-registry}/web:latest
```

### Run database migrations
Run migrations against the direct PostgreSQL URL (not PgBouncer — Prisma migrate requires session mode):
```bash
docker run --rm \
  -e DATABASE_URL="${DATABASE_URL}" \
  registry.digitalocean.com/{your-registry}/api:latest \
  node -e "require('./dist/scripts/migrate.js')"
```
Or, more simply, exec into the API container after first start and run:
```bash
npx prisma migrate deploy
```

### Start services (docker-compose)
```bash
# Copy .env.production to Droplet at /opt/platform/.env
scp .env.production user@your-droplet:/opt/platform/.env

# SSH to Droplet
ssh user@your-droplet
cd /opt/platform

docker compose pull
docker compose up -d
```

### Verify containers are healthy
```bash
docker compose ps
# All containers should show "healthy" or "running"

# Check API logs for startup errors
docker compose logs api --tail=50
```

---

## 7. Post-launch smoke tests

Run these manually after the first deploy:

- [ ] **Health check:** `curl https://yourdomain.com/health` → `{ "status": "ok" }`
- [ ] **Login:** POST to `/v1/auth/login` with a seeded test user → returns JWT
- [ ] **Create project:** POST to `/v1/projects` with the JWT → returns new project UUID
- [ ] **Billing checkout:** POST to `/v1/billing/checkout` → returns `{ url }` that redirects to Stripe
- [ ] **Stripe test webhook:** Use Stripe CLI to send a `checkout.session.completed` event → subscription activates in DB
- [ ] **File upload:** POST to `/v1/files/upload-url` → returns pre-signed upload URL → upload a file → confirm it lands in quarantine bucket and a `file.scan` job is queued
- [ ] **Notification:** Trigger any action that creates a notification → confirm it appears in the notifications endpoint
- [ ] **Audit log:** GET `/v1/audit-log` → returns recent entries with hash chain intact
- [ ] **PgBouncer mode:** Confirm `PGBOUNCER_POOL_MODE=transaction` in PgBouncer config (CI already validates this as a gate — T-43)

---

## 8. Ongoing operations reference

| Task | Command / Location |
|------|--------------------|
| View failed background jobs | `GET /v1/admin/jobs/failed` (super admin JWT) |
| Replay failed job | `POST /v1/admin/jobs/failed/:id/replay` |
| Trigger audit log export | `GET /v1/audit-log/export` (tenant admin) |
| Verify audit chain integrity | Run nightly job or `POST /v1/admin/audit/verify` |
| View platform logs | `docker compose logs -f api` |
| Scale up Droplet | DigitalOcean resize — zero-downtime for horizontal scaling |
| Migrate to AWS | See Architecture doc §9.5 — triggered at 300+ tenants |

---

*Created: 2026-03-22 | Architecture reference: Platform_Architecture_v1_1.docx*
