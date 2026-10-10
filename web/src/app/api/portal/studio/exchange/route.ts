import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Public Design Studio magic-link exchange — the invited client has no cookie yet; the single-use
// token is in the body. On success, set the platform_token cookie so the browser can use the portal.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.token) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Missing token' } }, { status: 400 });

  const apiRes = await fetch(`${API_URL}/v1/client-portal/studio/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body: JSON.stringify({ token: String(body.token) }),
  });
  const data = await apiRes.json().catch(() => ({}));
  if (!apiRes.ok) return NextResponse.json(data, { status: apiRes.status });

  const res = NextResponse.json({ ok: true, language: data.user?.language ?? 'en' });
  res.cookies.set('platform_token', data.token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  return res;
}
