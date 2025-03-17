import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // No token => redirect to /login
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Validate the session with backend
  try {
    const backendUrl = 'http://backend:8080/auth/auth-status';
    const authStatusRes = await fetch(backendUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Cookie: `session_token=${token}`,
      },
    });

    if (!authStatusRes.ok) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('Failed to verify session against /auth-status:', error);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin')) {
    const meRes = await fetch('http://backend:8080/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: { Cookie: `session_token=${token}` },
    });
    if (!meRes.ok) {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      return NextResponse.redirect(unauthorizedUrl);
    }
    const user = await meRes.json();
    if (user.account_type !== 'superuser') {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/unauthorized';
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/upload/:path*', '/files/:path*'],
};
