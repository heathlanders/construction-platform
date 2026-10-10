import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Super-admin login proxy. Forwards to the API's /v1/admin/login, then stores the
// returned platform-scope JWT in the same httpOnly `platform_token` cookie the rest of
// the admin UI + proxies read. Mirrors the tenant /api/auth/login proxy.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } }, { status: 400 });
  }

  const apiRes = await fetch(`${API_URL}/v1/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'ConstructionPlatform-Web/0.1.0',
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('platform_token', data.token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h — matches the admin token expiry
    path: '/',
  });
  return res;
}
