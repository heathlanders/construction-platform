# Deployment / Public Hosting Skill
**Added: 2026-06-18 — first public exposure of the local Docker stack**
**Product: The Jobsite — https://thejobsite.app (resolves OQ-01)**

## What this covers

The platform runs as a **local Docker Compose stack** (`docker-compose.yml`) on the founder's
Linux server. It is exposed to the public internet via a **Cloudflare Tunnel** — outbound-only,
no router port-forward, home IP hidden, free wildcard HTTPS. This is the **Stage 0 / pre-launch
testing** deployment, NOT the eventual production target (DigitalOcean → AWS per A-12/T-24 still
stands for production scale).

## Architecture

```
Browser ──HTTPS──> Cloudflare edge ──(Access OTP gate)──┐
                                                         ├─tunnel─> cloudflared container ─> web:3001
Mobile  ──HTTPS──> Cloudflare edge ──(ungated, JWT)─────┘                                 └> api:3000
postgres / pgbouncer / redis / minio = loopback-bound (127.0.0.1) — never exposed
```

- `cloudflared` dials **out** to Cloudflare (QUIC) — no inbound ports opened on the host.
- **Browsers only need the `web` origin**: the browser is 100% server-side proxied through
  Next.js API routes (`web/src/app/api/**/route.ts` → `API_URL=http://api:3000`).
  `NEXT_PUBLIC_API_URL` is **unused** in `web/src`.
- **`api` origin is public only for the mobile app**, which calls it directly
  (`EXPO_PUBLIC_API_URL`, `mobile/src/lib/api.ts`).

## Public hostnames (Cloudflare Zero Trust → tunnel `jobsite` → Hostname routes)

| Hostname | Service (Type HTTP) | Consumer | Access gate |
|----------|--------------------|----------|-------------|
| `thejobsite.app` | `web:3001` | browsers | **Cloudflare Access — email OTP allowlist** |
| `api.thejobsite.app` | `api:3000` | mobile only | **none** (JWT login guards it) |

⚠️ In the redesigned CF dashboard the "Public Hostname" tab is renamed **"Hostname routes" (Beta)**;
the form is "Add a published application route". The **URL field takes `web:3001` with NO `http://`** —
the Type=HTTP selector already supplies the scheme; doubling it = red `service URL is not valid`.

## docker-compose `cloudflared` service

```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  container_name: platform_cloudflared
  restart: unless-stopped
  command: tunnel --no-autoupdate run
  environment:
    TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
  depends_on: [web, api]
```
Reaches `web`/`api` by service name on the default compose network — no host ports needed.
Tunnel routes (which hostname → which service) live in the Cloudflare dashboard, not the token.

## Required `.env` for public exposure

| Key | Value | Why |
|-----|-------|-----|
| `JWT_SECRET` | `openssl rand -hex 32` | MUST be rotated off the dev placeholder before going public — a known secret = forgeable admin JWTs. Rotating logs out all sessions. |
| `CORS_ORIGIN` | `https://thejobsite.app` | `api/src/index.ts` reads it (`?? 'http://localhost:3001'`). |
| `COOKIE_SECURE` | `true` | `.app` is HSTS-preloaded (HTTPS-only) → auth cookie must be `Secure` or the browser drops it. Read at `web/.../auth/login/route.ts` AND set on the `web` service env in compose. |
| `APP_URL` / `WEB_URL` | `https://thejobsite.app` | `APP_URL` feeds billing-return / password-reset / homeowner-magic-link **web** URLs (`api/src/routes/v1/billing.ts`, `api/src/lib/password-reset.ts`). Must be the web origin. |
| `CLOUDFLARE_TUNNEL_TOKEN` | tunnel token | Interpolated into the `cloudflared` service. Full tunnel control — keep out of git (`.env` is gitignored), rotate in dashboard if leaked. |

`mobile/.env` (only when mobile testing): `EXPO_PUBLIC_API_URL=https://api.thejobsite.app`.

## Hardening already applied

- DB-tier host ports bound to `127.0.0.1` only: postgres `15432`, pgbouncer `15433`,
  redis `16379`, minio `19000/19001`. Off the LAN, off the internet.
- Cloudflare Access on the web app: Allow policy, Include = **Emails** allowlist, login = **One-time PIN**.
  ⚠️ OTP emails must reach a **real inbox** — a placeholder like `*@demo.com` locks everyone out.

## Browser uploads/downloads (presigned URLs → MinIO)

Presigned URLs are opened by the **browser**, so they're signed for `STORAGE_PUBLIC_ENDPOINT`
(`api/src/lib/storage.ts` `presignClient`; the API itself keeps talking to `minio:9000`). Compose defaults it
to `http://localhost:19000` — works on this machine only. **For remote testers** add a tunnel hostname
route, e.g. `files.thejobsite.app` → `minio:9000` (Type HTTP, **no Access gate** — the URL signature is the
auth), then set `STORAGE_PUBLIC_ENDPOINT=https://files.thejobsite.app` in `.env` and `docker compose up -d api`.
Until then every browser upload (task photos, documents, Design Studio photos) fails for remote users.
Production (Spaces/S3) leaves it unset.

## Bring up / verify

```bash
docker compose up -d                       # all runtime env — no rebuild needed for env-only changes
docker compose logs cloudflared | grep -i "Registered tunnel"   # 4 HA conns = connected
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://thejobsite.app/   # 302 → *.cloudflareaccess.com  (gate live)
curl -sS https://api.thejobsite.app/health                                          # 200 db ok redis ok
```

## Add a tester
Cloudflare Zero Trust → Access → Applications → **The Jobsite** → Policies → add the email to the
Include list. No code/restart.

## Notes & gotchas
- Env-only changes (cookie/CORS/JWT/URLs) need only `docker compose up -d` (recreate). The `web`
  image's `NEXT_PUBLIC_API_URL` build arg is cosmetic/unused — changing it needs a rebuild but
  has no runtime effect.
- Do **not** add a Cloudflare Access app to `api.thejobsite.app` while testing mobile — no browser
  there to complete OTP; it would block the API.
- This is pre-launch testing infra. Production (A-12/T-24) is still DigitalOcean → AWS; the tunnel
  is not the production path.

## File locations
| File | Role |
|------|------|
| `docker-compose.yml` | `cloudflared` service + loopback-bound DB ports + `COOKIE_SECURE` on web |
| `.env` | secrets + tunnel token + public URLs (gitignored) |
| `web/src/app/api/auth/login/route.ts` | reads `COOKIE_SECURE` for the auth cookie `secure` flag |
| `api/src/index.ts` | reads `CORS_ORIGIN` |
| `mobile/src/lib/api.ts` | reads `EXPO_PUBLIC_API_URL` |

Memory: `public_exposure_plan` (full executed record).
