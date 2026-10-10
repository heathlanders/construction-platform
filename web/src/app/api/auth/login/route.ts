import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } }, { status: 400 });
  }

  const apiRes = await fetch(`${API_URL}/v1/auth/login`, {
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

  // Decode role from JWT payload (client needs it for redirect)
  let role: string | null = null;
  try {
    const parts = data.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/') + '==', 'base64').toString());
    role = payload.role ? String(payload.role).toLowerCase() : null;
  } catch { /* non-fatal */ }

  const res = NextResponse.json({ ok: true, role });

  // Set httpOnly cookie — 24hr for web (T-07 analogue)
  res.cookies.set('platform_token', data.token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return res;
}
