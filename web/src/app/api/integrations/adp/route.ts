// Proxy: /api/integrations/adp → /v1/integrations/adp/*

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

function getToken(req: NextRequest): string | null {
  return req.cookies.get('platform_token')?.value ?? null;
}

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const action = new URL(req.url).searchParams.get('action') ?? 'status';
  const endpoint = action === 'connect' ? 'connect' : 'status';

  const apiRes = await fetch(`${API_URL}/v1/integrations/adp/${endpoint}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });

  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}

export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/integrations/adp/disconnect`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });

  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}

export async function POST(req: NextRequest) {
  // POST /api/integrations/adp → sync-workers
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/integrations/adp/sync-workers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });

  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
