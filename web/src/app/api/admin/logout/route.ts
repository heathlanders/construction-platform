import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Super-admin logout proxy. Blacklists the jti server-side, then clears the cookie.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (token) {
    await fetch(`${API_URL}/v1/admin/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ConstructionPlatform-Web/0.1.0',
      },
    }).catch(() => { /* clear the cookie regardless */ });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('platform_token', '', { path: '/', maxAge: 0 });
  return res;
}
