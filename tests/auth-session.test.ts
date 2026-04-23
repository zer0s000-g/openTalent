import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAuthMode,
  getDevelopmentBypassSession,
  getRequestSessionFromHeaders,
  hasRequiredRole,
} from '@/lib/auth/session'

function toProcessEnv(overrides: Record<string, string>) {
  return overrides as unknown as NodeJS.ProcessEnv
}

describe('auth session helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses development bypass mode by default for local development', () => {
    expect(getAuthMode()).toBe('development-bypass')

    const session = getDevelopmentBypassSession(toProcessEnv({
      AUTH_DEV_USER_EMAIL: 'admin@airnav.co.id',
      AUTH_DEV_USER_NAME: 'Admin User',
      AUTH_DEV_USER_ROLE: 'admin',
    }))

    expect(session).toMatchObject({
      email: 'admin@airnav.co.id',
      name: 'Admin User',
      role: 'admin',
      source: 'development-bypass',
    })
  })

  it('parses proxy-header auth sessions when enabled', () => {
    const headers = new Headers({
      'x-opentalent-user-email': 'viewer@airnav.co.id',
      'x-opentalent-user-name': 'Viewer User',
      'x-opentalent-user-role': 'viewer',
    })

    const session = getRequestSessionFromHeaders(
      headers,
      toProcessEnv({
        AUTH_MODE: 'proxy-header',
      }),
    )

    expect(session).toMatchObject({
      email: 'viewer@airnav.co.id',
      name: 'Viewer User',
      role: 'viewer',
      source: 'proxy-header',
    })
  })

  it('applies role hierarchy correctly', () => {
    expect(hasRequiredRole({ role: 'admin' }, 'viewer')).toBe(true)
    expect(hasRequiredRole({ role: 'manager' }, 'viewer')).toBe(true)
    expect(hasRequiredRole({ role: 'viewer' }, 'admin')).toBe(false)
  })
})
