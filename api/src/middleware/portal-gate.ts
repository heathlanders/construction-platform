// portal-gate.ts — namespace confinement for external portal tokens (P-04 + client/homeowner).
//
// Portal users live INSIDE a builder's tenant, so tenant RLS alone would expose the whole tenant
// on any general route that only calls `authenticate`. Every portal role is therefore confined to
// an explicit allow-list here, applied globally in index.ts before any route runs.
//
// `portalRequestAllowed` is pure (no I/O) so it can be unit-tested exhaustively;
// `registerPortalGate` installs it — index.ts and the tests share the exact same hook.

import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

export type PortalRule = { method: string; prefix: string };

// SUB_PORTAL: its own namespace only.
const SUB_PORTAL_RULES: PortalRule[] = [{ method: '*', prefix: '/v1/sub-portal' }];

// HOMEOWNER_PORTAL: the warranty portal namespace only (routes check the warranty binding).
const HOMEOWNER_RULES: PortalRule[] = [{ method: '*', prefix: '/v1/homeowner/' }];

// CLIENT_PORTAL: its own read-only namespace only (routes scope every read by project_members and
// decide client-visible fields server-side — see routes/v1/client-portal.ts) + its own profile.
// (Was: GET on the general /v1/projects, /v1/milestones, /v1/schedule-tasks, /v1/invoices — tenant-wide,
// with the client-safe filtering done in the web proxy, so a token used against the API directly saw
// every project, internal tasks and draft invoices.)
// + Design Studio writes, ONLY under /v1/client-portal/studio (routes/v1/client-studio.ts re-derives
// ownership on every request; photos upload there, never via /v1/files/upload).
const CLIENT_PORTAL_RULES: PortalRule[] = [
  { method: 'GET', prefix: '/v1/client-portal' },
  { method: '*', prefix: '/v1/client-portal/studio' },
  { method: 'GET', prefix: '/v1/users/me' },
];

// Every token may log itself out.
const COMMON_RULES: PortalRule[] = [{ method: 'POST', prefix: '/v1/auth/logout' }];

const RULES: Record<string, PortalRule[]> = {
  SUB_PORTAL: SUB_PORTAL_RULES,
  HOMEOWNER_PORTAL: HOMEOWNER_RULES,
  CLIENT_PORTAL: CLIENT_PORTAL_RULES,
};

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix.endsWith('/')) return path.startsWith(prefix);
  return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`);
}

/**
 * Returns true when the request may proceed. Non-portal roles (and unauthenticated requests,
 * role undefined) always pass — the route's own auth handles them.
 */
export function portalRequestAllowed(role: string | undefined, method: string, url: string): boolean {
  if (!role) return true;
  const rules = RULES[role.toUpperCase()];
  if (!rules) return true;
  const path = url.split('?')[0];
  const m = method.toUpperCase();
  return [...rules, ...COMMON_RULES].some(
    (r) => (r.method === '*' || r.method === m || (r.method === 'GET' && m === 'HEAD')) && matchesPrefix(path, r.prefix),
  );
}

/**
 * Install the gate as a global onRequest hook. Decode-only (no verify): a forged token is either
 * denied here (harmless) or dies at the route's real JWT verify.
 */
export function registerPortalGate(app: FastifyInstance): void {
  app.addHook('onRequest', async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return; // unauthenticated → route auth handles it
    let role: string | undefined;
    try {
      role = (jwt.decode(authHeader.slice(7)) as { role?: string } | null)?.role;
    } catch {
      return; // undecodable → route auth will reject
    }
    if (!portalRequestAllowed(role, req.method, req.url)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Portal access is limited to the portal' } });
    }
  });
}
