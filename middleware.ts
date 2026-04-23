import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  applySessionHeaders,
  getRequestSessionFromHeaders,
  hasRequiredRole,
  type AppUserRole,
} from '@/lib/auth/session'

const PUBLIC_PATHS = new Set(['/access-denied', '/api/health'])

function getRequiredRole(pathname: string): AppUserRole | null {
  if (PUBLIC_PATHS.has(pathname)) {
    return null
  }

  if (pathname.startsWith('/api/import') || pathname.startsWith('/admin/import')) {
    return 'admin'
  }

  if (
    pathname.startsWith('/api/graphql') ||
    pathname.startsWith('/api/assistant') ||
    pathname.startsWith('/api/auth/session')
  ) {
    return 'viewer'
  }

  if (pathname.startsWith('/api')) {
    return null
  }

  return 'viewer'
}

function buildApiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status })
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requiredRole = getRequiredRole(pathname)

  if (!requiredRole) {
    return NextResponse.next()
  }

  const session = getRequestSessionFromHeaders(request.headers)

  if (!session) {
    if (pathname.startsWith('/api')) {
      return buildApiError(401, 'Authenticated internal access is required')
    }

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/access-denied'
    redirectUrl.searchParams.set('reason', 'signin')
    redirectUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (!hasRequiredRole(session, requiredRole)) {
    if (pathname.startsWith('/api')) {
      return buildApiError(403, 'You do not have permission to access this resource')
    }

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/access-denied'
    redirectUrl.searchParams.set('reason', 'admin')
    redirectUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const requestHeaders = new Headers(request.headers)
  applySessionHeaders(requestHeaders, session)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sample-employees.csv).*)'],
}
