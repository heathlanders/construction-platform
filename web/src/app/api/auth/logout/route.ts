import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;

  // Best-effort call to API to blacklist the JWT jti
  if (token) {
    fetch(`${API_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ConstructionPlatform-Web/0.1.0',
      },
    }).catch(() => {
      // Fire-and-forget — clear cookie regardless
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete('platform_token');
  return res;
}
