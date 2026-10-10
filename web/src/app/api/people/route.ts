import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const url = qs ? `${API_URL}/v1/users?${qs}` : `${API_URL}/v1/users`;

  const apiRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}
