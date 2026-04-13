import { NextRequest, NextResponse } from 'next/server';

const API_SECRET = process.env.SMELTER_API_SECRET || '';
const AUTH_COOKIE = 'smelter-auth-token';

/**
 * Require API authentication via Bearer token or session cookie.
 * Returns null if authenticated, or a 401 response if not.
 */
export function requireApiAuth(req: NextRequest): NextResponse | null {
  // Check Bearer token (service-to-service)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ') && API_SECRET) {
    const token = authHeader.slice(7);
    if (token === API_SECRET) return null; // Authenticated
  }

  // Check session cookie (browser)
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie) return null; // Has session — full verification happens downstream

  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
