import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'User-Agent': 'ConstructionPlatform-Web/0.1.0',
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const apiRes = await fetch(`${API_URL}/v1/permits/${params.id}`, { headers: HEADERS(token) });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'Invalid body' } }, { status: 400 });
  const apiRes = await fetch(`${API_URL}/v1/permits/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...HEADERS(token) },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  const apiRes = await fetch(`${API_URL}/v1/permits/${params.id}`, {
    method: 'DELETE',
    headers: HEADERS(token),
  });
  if (apiRes.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}
