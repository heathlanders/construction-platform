import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const qs = req.nextUrl.search; // forward state/county/city/building_type verbatim
  const apiRes = await fetch(`${API_URL}/v1/jurisdictions/resolve${qs}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}
