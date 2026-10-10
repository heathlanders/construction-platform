import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.token) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Token is required' } }, { status: 400 });
  }

  const r = await fetch(`${API_URL}/v1/auth/homeowner-magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body: JSON.stringify({ token: body.token }),
  });

  const data = await r.json();
  if (!r.ok) {
    return NextResponse.json(data, { status: r.status });
  }

  // Set httpOnly session cookie on success
  const res = NextResponse.json({ ok: true });
  res.cookies.set('homeowner_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
