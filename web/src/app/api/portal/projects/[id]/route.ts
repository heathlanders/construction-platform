import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromToken } from '@/lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Client portal project bundle. The API decides what a client may see (membership, client-visible
// tasks, safe fields) — this proxy only forwards. Filtering here would be bypassable: the same token
// works against the API directly.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const session = getSessionFromToken(token);
  if (!session || session.role !== 'client_portal') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Client portal access only' } }, { status: 403 });
  }

  const res = await fetch(`${API_URL}/v1/client-portal/projects/${encodeURIComponent(params.id)}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });
  if (!res.ok) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 });
  }
  return NextResponse.json(await res.json());
}
