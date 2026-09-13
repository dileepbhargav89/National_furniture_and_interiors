import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/account', '/checkout'];
const publicOnlyRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  // In Next.js App Router, the middleware can read cookies but NOT localStorage.
  // The backend sets the HttpOnly refresh cookie which we can't easily read to know if a session exists,
  // but if we used a non-HttpOnly 'isAuthenticated' flag cookie, we could read it here.
  // For this MVP, we will do a basic check for an 'auth_token' cookie or rely on client-side routing guards.
  
  const token = request.cookies.get('nfi-auth-storage')?.value; // Note: Zustand's persist defaults to localStorage, so we might not see it here unless configured to use cookies.
  // Actually, since Zustand uses localStorage, this middleware might not have the state.
  // For a robust system, we should either sync Zustand to cookies, or use an HttpOnly cookie strategy.
  // Since we're keeping it simple for the MVP, we will just allow the request to pass and handle redirects client-side or during SSR.

  // Let's assume we implement a basic check if a token cookie exists.
  const hasToken = !!token;
  
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const isPublicOnlyRoute = publicOnlyRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (isProtectedRoute && !hasToken) {
    // Redirect to login if trying to access a protected route without a token
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicOnlyRoute && hasToken) {
    // Redirect to account if trying to access login/register while already authenticated
    // return NextResponse.redirect(new URL('/account', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
