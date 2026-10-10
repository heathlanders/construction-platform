# Real-Time Channels Skill
**Locked decisions: T-15, T-16, T-17, A-16**

## Provider by stage (A-16)
- **Stage 1–2:** Pusher — managed channel auth, maps cleanly to T-15/T-16 isolation model
- **Stage 3+:** Native WebSocket server — same channel naming convention, swap via config

## Channel naming convention (T-15)
```
private-tenant-{tenant_id}
```

Rules:
- Always `private-` prefix — Pusher requires server auth for private channels
- `tenant_id` is the UUID from the JWT claim — never from user input
- Channel names are NEVER constructed from user-supplied strings
- One channel per tenant — no shared channels between tenants

```typescript
// CORRECT — tenant_id from validated JWT
const channelName = `private-tenant-${req.jwt.tenant_id}`;

// WRONG — never construct from user input
const channelName = `private-tenant-${req.body.tenant_id}`;  // PROHIBITED
```

## Channel authorization endpoint (T-16)

Every Pusher channel subscription triggers a POST to your auth endpoint.
The auth endpoint is the **only security gate** — validate JWT tenant_id against
the requested channel name.

```typescript
// POST /v1/pusher/auth
// Called by Pusher client library before subscribing to any private channel
fastify.post('/v1/pusher/auth', { preHandler: [requireJwt] }, async (req, reply) => {
  const { socket_id, channel_name } = req.body;
  const { tenant_id } = req.jwt;  // from validated JWT

  // Extract tenant_id from channel name
  const channelTenantId = channel_name.replace('private-tenant-', '');

  // T-16: Mismatch → 403, never authorized
  if (channelTenantId !== tenant_id) {
    return reply.status(403).send({ error: 'Unauthorized channel' });
  }

  // Authorize subscription
  const auth = pusher.authorizeChannel(socket_id, channel_name);
  return reply.send(auth);
});
```

## Publishing events (server → client)

Always publish from the server — never trust clients to publish.
Events are scoped to the tenant's own channel.

```typescript
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Publish a tenant-scoped event
async function publishToTenant(tenantId: string, event: string, data: unknown) {
  const channel = `private-tenant-${tenantId}`;
  await pusher.trigger(channel, event, data);
}

// Usage
await publishToTenant(tenantId, 'project.updated', {
  project_id: projectId,
  updated_at: new Date().toISOString(),
  // Never include sensitive data — client fetches fresh via API
});
```

## Cross-tenant fan-out (T-17)

For events that both a GC and a Sub should see (e.g., a shared project update),
the **server** publishes scoped payloads to each tenant's own channel independently.
Sub's internal data NEVER enters the GC's channel payload.

```typescript
// Cross-tenant event — server fan-out pattern
async function fanOutCrossTenantEvent(
  gcTenantId: string,
  subTenantId: string,
  eventType: string,
  gcPayload: unknown,   // GC-visible fields only
  subPayload: unknown,  // Sub-visible fields only
) {
  // Publish separately to each tenant's own channel
  await Promise.all([
    publishToTenant(gcTenantId, eventType, gcPayload),
    publishToTenant(subTenantId, eventType, subPayload),
  ]);
}
```

## Client-side subscription (React)

```typescript
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  authEndpoint: '/v1/pusher/auth',   // sends JWT cookie automatically
});

// Subscribe to tenant's private channel
const channel = pusher.subscribe(`private-tenant-${tenantId}`);

channel.bind('project.updated', (data: { project_id: string }) => {
  // Refetch project data from API — don't trust event payload as authoritative
  queryClient.invalidateQueries(['project', data.project_id]);
});
```

## Events must not carry authoritative data

Pusher events are notifications, not data transfers.
Always send a minimal payload (resource ID + timestamp).
Client fetches fresh data from the API after receiving the event.
This ensures auth/RLS is enforced on the data fetch, not bypassed via the event.

## BUILT — env-gated scaffolding (Phase 6, PR #16)

- **`api/src/lib/pusher.ts`** — dependency-free (node:crypto HMAC + fetch; NO `pusher` npm dep).
  `pusherEnabled()` (false when `PUSHER_*` unset OR still the `your-pusher-*` placeholder → all no-op),
  `authorizeTenantChannel(socketId, channel, tenantId)` (signs ONLY `private-tenant-{tenantId}` — the
  T-16 gate; null otherwise), `triggerToTenant(tenant, event, data)` (Pusher REST, best-effort, never throws).
- **`POST /v1/pusher/auth`** (`routes/v1/pusher-auth.ts`) — 200 signed for own channel, **403
  `CHANNEL_FORBIDDEN`** for any other tenant's channel (T-16), **503 `REALTIME_DISABLED`** when unconfigured.
- **T-17 fan-out** is folded into `bridge.publishSharedEvent` (the ONE write choke point → covers all
  RFI/CO/submittal mirror + response sites): `fanOutSharedEvent` triggers the whitelisted payload to
  BOTH parties' `private-tenant-{tenant}` channels (`shared.event`). Best-effort; no-op when disabled.
  The payload whitelist (bridge.ts) is still the leak boundary — no internal data crosses.
- **Web:** auth proxy `web/src/app/api/pusher/auth/route.ts` (cookie → Bearer) is ready.
- **Tests:** `pusher-auth.test.ts` + `cross-tenant-fanout.test.ts` (Pusher client mocked).
- **Last mile when creds land:** set real `PUSHER_*` (+ web `NEXT_PUBLIC_PUSHER_KEY`/`_CLUSTER`),
  `npm i pusher-js` in web, add a client hook subscribing via `/api/pusher/auth` that refetches on
  `shared.event`. The REST trigger signing is untested-until-creds — smoke-test on the first real key.
