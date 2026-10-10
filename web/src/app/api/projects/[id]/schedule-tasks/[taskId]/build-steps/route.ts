import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const token = req.cookies.get('platform_token')?.value;
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });

  const apiRes = await fetch(`${API_URL}/v1/schedule-tasks/${params.taskId}/build-steps`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ConstructionPlatform-Web/0.1.0',
    },
    body: '{}',
  });
  return NextResponse.json(await apiRes.json(), { status: apiRes.status });
}
