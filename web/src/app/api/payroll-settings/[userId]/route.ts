// Proxy: PATCH /api/payroll-settings/:userId → PATCH /v1/payroll-settings/:userId

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

function getToken(req: NextRequest): string | null {
  return req.cookies.get('platform_token')?.value ?? null;
}

export async function PATCH(req: NextRequest, context: { params: { userId: string } }) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const { userId } = context.params;
  const body = await req.json().catch(() => ({}));

  const apiRes = await fetch(`${API_URL}/v1/payroll-settings/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ConstructionPlatform-Web/0.1.0',
    },
    body: JSON.stringify(body),
  });

  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
