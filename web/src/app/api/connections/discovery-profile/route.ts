import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'User-Agent': 'ConstructionPlatform-Web/0.1.0',
  'Content-Type': 'application/json',
});

export async function GET(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/connections/discovery-profile`, { headers: headers(token) });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const body = await req.text();
  const apiRes = await fetch(`${API_URL}/v1/connections/discovery-profile`, {
    method: 'PUT',
    headers: headers(token),
    body,
  });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
