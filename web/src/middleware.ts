import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/projects', '/financial', '/documents', '/safety', '/settings', '/dashboard', '/portal'];
// Routes that are public
const PUBLIC_PATHS = ['/login'];
// Protected-prefix paths that must stay reachable without a cookie (magic-link landing pages).
const OPEN_PATHS = ['/portal/studio/start'];

function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(Buffer.from(payload + '==', 'base64').toString());
    return decoded.role ? String(decoded.role).toLowerCase() : null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('platform_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !OPEN_PATHS.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && token) {
    const role = getRoleFromToken(token);
    const dest = req.nextUrl.clone();
    dest.pathname = role === 'client_portal' ? '/portal' : '/projects';
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
