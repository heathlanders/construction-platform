import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { assignmentId } = await params;
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const body = await req.json();
  const apiRes = await fetch(`${API_URL}/v1/crew-assignments/${assignmentId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { assignmentId } = await params;
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/crew-assignments/${assignmentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
  });
  if (apiRes.status === 204) return new NextResponse(null, { status: 204 });
  const data = await apiRes.json();
  return NextResponse.json(data, { status: apiRes.status });
}
