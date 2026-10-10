import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const APP_USER_AGENT = 'ConstructionPlatform-Web/0.1.0';

interface ApiOptions {
  token?: string;
  method?: string;
  body?: unknown;
}

interface ApiError {
  error: { code: string; message: string; field?: string };
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': APP_USER_AGENT,
  };
  if (opts.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${API_URL}/v1${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }))) as ApiError;
    throw new ApiRequestError(res.status, err.error?.code ?? 'UNKNOWN', err.error?.message ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// Server-side API client — reads JWT from the httpOnly cookie automatically
export async function serverApi<T>(path: string, opts: Omit<ApiOptions, 'token'> = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('platform_token')?.value;
  return apiFetch<T>(path, { ...opts, token });
}

// Raw fetch for use in Next.js API routes (token passed explicitly)
export async function apiWithToken<T>(path: string, token: string, opts: Omit<ApiOptions, 'token'> = {}): Promise<T> {
  return apiFetch<T>(path, { ...opts, token });
}

// Unauthenticated (login endpoint)
export async function publicApi<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  return apiFetch<T>(path, opts);
}
