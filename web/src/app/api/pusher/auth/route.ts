import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Pusher private-channel authorizer proxy. The browser's pusher-js client POSTs
// { socket_id, channel_name } here; we forward with the platform_token cookie → Bearer.
// The API validates the requested channel against the JWT tenant_id (T-16).
export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } }, { status: 400 });

  const apiRes = await fetch(`${API_URL}/v1/pusher/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
