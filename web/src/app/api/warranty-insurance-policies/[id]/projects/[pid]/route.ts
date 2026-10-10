import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; pid: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const r = await fetch(`${API_URL}/v1/warranty-insurance-policies/${params.id}/projects/${params.pid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });
  return NextResponse.json(await r.json(), { status: r.status });
}
