import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const UA = 'ConstructionPlatform-Web/0.1.0';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/task-dependencies/${params.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA },
  });
  // API returns 204 No Content on success — no body to forward.
  return new NextResponse(null, { status: apiRes.status });
}
