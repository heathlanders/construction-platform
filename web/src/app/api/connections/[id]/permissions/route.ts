import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const body = await req.text();
  const apiRes = await fetch(`${API_URL}/v1/connections/${id}/permissions`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body,
  });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
