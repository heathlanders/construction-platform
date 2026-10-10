import { NextRequest, NextResponse } from 'next/server';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';
export async function GET(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const url = new URL(req.url); const qs = url.searchParams.toString();
  const r = await fetch(`${API_URL}/v1/concrete-test-records${qs ? '?' + qs : ''}`, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' } });
  return NextResponse.json(await r.json(), { status: r.status });
}
export async function POST(req: NextRequest) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const r = await fetch(`${API_URL}/v1/concrete-test-records`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' }, body: JSON.stringify(await req.json()) });
  return NextResponse.json(await r.json(), { status: r.status });
}
