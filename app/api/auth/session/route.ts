import { NextRequest, NextResponse } from 'next/server'
import { getRequestSessionFromHeaders } from '@/lib/auth/session'
import { createRouteLogger } from '@/lib/observability/logger'

export async function GET(request: NextRequest) {
  const routeLogger = createRouteLogger(request, 'auth.session')

  try {
    const session = getRequestSessionFromHeaders(request.headers)
    if (!session) {
      routeLogger.warn('unauthenticated')
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    routeLogger.done('resolved', { role: session.role })
    return NextResponse.json({
      authenticated: true,
      user: session,
    })
  } catch (error) {
    routeLogger.error('failed', error)
    return NextResponse.json(
      { authenticated: false, error: 'Failed to resolve the current session' },
      { status: 500 },
    )
  }
}
