import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

async function proxyAction(req: NextRequest, id: string, action: string) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const apiRes = await fetch(`${API_URL}/v1/timecards/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'submit';
  return proxyAction(req, params.id, action);
}
