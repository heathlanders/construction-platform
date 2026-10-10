import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const apiRes = await fetch(`${API_URL}/v1/billing/checkout-business`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ConstructionPlatform-Web/0.1.0',
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
