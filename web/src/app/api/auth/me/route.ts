import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Lightweight client-readable session (platform_token is httpOnly). Used by client
// components that need the current role for UI gating — the API still enforces.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  return NextResponse.json({ user_id: session.user_id, role: session.role, email: session.email, tenant_id: session.tenant_id });
}
