import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: { id: string; claimId: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const r = await fetch(`${API_URL}/v1/builder-warranties/${params.id}/claims/${params.claimId}/attachments`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });
  return NextResponse.json(await r.json(), { status: r.status });
}

export async function POST(req: NextRequest, { params }: { params: { id: string; claimId: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } }, { status: 400 });
  const r = await fetch(`${API_URL}/v1/builder-warranties/${params.id}/claims/${params.claimId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await r.json(), { status: r.status });
}
