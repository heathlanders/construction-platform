import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Public "email me a new sign-in link" proxy (no cookie). The API always answers 202 (no enumeration).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const apiRes = await fetch(`${API_URL}/v1/client-portal/studio/auth/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ConstructionPlatform-Web/0.1.0' },
    body: JSON.stringify({ email: String(body?.email ?? ''), tenant_slug: String(body?.tenant_slug ?? '') }),
  });
  return NextResponse.json(await apiRes.json().catch(() => ({})), { status: apiRes.status });
}
