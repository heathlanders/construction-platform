import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Super-admin change-password proxy. Forwards the cookie's platform_token as a bearer.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } }, { status: 400 });
  }

  const apiRes = await fetch(`${API_URL}/v1/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ConstructionPlatform-Web/0.1.0',
    },
    body: JSON.stringify(body),
  });

  if (apiRes.status === 204) {
    return NextResponse.json({ ok: true });
  }
  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: apiRes.status });
}
