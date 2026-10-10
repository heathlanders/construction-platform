import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = qs ? `${API_URL}/v1/admin/jurisdiction-layers?${qs}` : `${API_URL}/v1/admin/jurisdiction-layers`;
  const apiRes = await fetch(url, { headers: authHeaders(token) });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } }, { status: 400 });

  const apiRes = await fetch(`${API_URL}/v1/admin/jurisdiction-layers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
