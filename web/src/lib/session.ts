import { cookies } from 'next/headers';

export interface SessionUser {
  user_id: string;
  tenant_id: string;
  role: string;
  email: string;
  preferred_language: string;
  exp: number;
}

// Decode JWT payload without verification (cookie is httpOnly — we trust our own API set it)
function decodeJwtPayload(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → base64 → JSON
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '=='.slice((payload.length + 3) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    const data = JSON.parse(decoded) as SessionUser;
    // The API issues UPPERCASE roles (issueToken → role.toUpperCase()); the web gates on the
    // lowercase user_role enum. Normalize once here so every consumer compares like with like.
    data.role = String(data.role ?? '').toLowerCase();
    // Check expiry
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('platform_token')?.value;
  if (!token) return null;
  return decodeJwtPayload(token);
}

export function getSessionFromToken(token: string): SessionUser | null {
  return decodeJwtPayload(token);
}

/** Case-insensitive role check — the single way web code should gate on role. */
export function hasRole(role: string | null | undefined, allowed: readonly string[]): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return allowed.some((a) => a.toLowerCase() === r);
}

/** External portal roles — never allowed into the company dashboard. */
export const PORTAL_HOME: Record<string, string> = {
  client_portal: '/portal',
  sub_portal: '/sub-portal',
  homeowner_portal: '/homeowner',
};
