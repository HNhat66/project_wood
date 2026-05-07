import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { UserRole } from '@/lib/types';

import { getUserFromToken } from './lib/utils';

// Define protected routes that require USER role specifically
const USER_ONLY_ROUTES = [
  '/custom-request',
  '/orders',
]


// Define auth routes that should redirect authenticated users
const AUTH_ROUTES = [
  '/login',
  '/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  
  const isAuthenticated = !!(accessToken || refreshToken)
  const user = getUserFromToken(accessToken)
  if (user?.role === UserRole.USER && pathname.includes('/dashboard')) {
    const redirectUrl = new URL('/profile', request.url)
    return NextResponse.redirect(redirectUrl)
  }
  // If user is authenticated and trying to access auth routes, redirect to profile
  if (isAuthenticated && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    const redirectUrl = new URL(`/${[UserRole.ADMIN, UserRole.EMPLOYEE].includes(user?.role as UserRole) ? 'dashboard' : 'profile'}`, request.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If no tokens, redirect to login for protected routes
  if (!isAuthenticated) {
    if (USER_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  // For routes that require authentication but role check will be done client-side
  // The actual role verification will be handled by the auth context and components
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 