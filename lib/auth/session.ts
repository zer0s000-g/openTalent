export type AppUserRole = 'viewer' | 'manager' | 'admin'
export type AuthMode = 'development-bypass' | 'proxy-header'
export type HeaderAccessor = Pick<Headers, 'get'>

export interface AppSession {
  email: string
  name: string
  role: AppUserRole
  source: AuthMode
}

export const INTERNAL_SESSION_HEADERS = {
  authenticated: 'x-opentalent-authenticated',
  email: 'x-opentalent-session-email',
  name: 'x-opentalent-session-name',
  role: 'x-opentalent-session-role',
  source: 'x-opentalent-session-source',
} as const

const DEFAULT_PROXY_HEADERS = {
  email: 'x-opentalent-user-email',
  name: 'x-opentalent-user-name',
  role: 'x-opentalent-user-role',
} as const

const ROLE_ORDER: Record<AppUserRole, number> = {
  viewer: 1,
  manager: 2,
  admin: 3,
}

function normalizeRole(value?: string | null): AppUserRole | null {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'viewer' || normalized === 'manager' || normalized === 'admin') {
    return normalized
  }
  return null
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || email
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function getAuthMode(env: NodeJS.ProcessEnv = process.env): AuthMode {
  return env.AUTH_MODE === 'proxy-header' ? 'proxy-header' : 'development-bypass'
}

export function getProxyHeaderNames(env: NodeJS.ProcessEnv = process.env) {
  return {
    email: env.AUTH_PROXY_EMAIL_HEADER?.trim() || DEFAULT_PROXY_HEADERS.email,
    name: env.AUTH_PROXY_NAME_HEADER?.trim() || DEFAULT_PROXY_HEADERS.name,
    role: env.AUTH_PROXY_ROLE_HEADER?.trim() || DEFAULT_PROXY_HEADERS.role,
  }
}

export function getDevelopmentBypassSession(env: NodeJS.ProcessEnv = process.env): AppSession {
  return {
    email: env.AUTH_DEV_USER_EMAIL?.trim().toLowerCase() || 'local.admin@airnav.co.id',
    name: env.AUTH_DEV_USER_NAME?.trim() || 'Local Admin',
    role: normalizeRole(env.AUTH_DEV_USER_ROLE) || 'admin',
    source: 'development-bypass',
  }
}

export function getRequestSessionFromHeaders(
  headerAccessor: HeaderAccessor,
  env: NodeJS.ProcessEnv = process.env,
): AppSession | null {
  const authMode = getAuthMode(env)

  if (authMode === 'development-bypass') {
    return getDevelopmentBypassSession(env)
  }

  const normalizedEmail = headerAccessor.get(INTERNAL_SESSION_HEADERS.email)?.trim().toLowerCase()
  const normalizedRole = normalizeRole(headerAccessor.get(INTERNAL_SESSION_HEADERS.role))
  if (normalizedEmail && normalizedRole) {
    return {
      email: normalizedEmail,
      name: headerAccessor.get(INTERNAL_SESSION_HEADERS.name)?.trim() || deriveNameFromEmail(normalizedEmail),
      role: normalizedRole,
      source: (headerAccessor.get(INTERNAL_SESSION_HEADERS.source)?.trim() as AuthMode) || 'proxy-header',
    }
  }

  const proxyHeaders = getProxyHeaderNames(env)
  const email = headerAccessor.get(proxyHeaders.email)?.trim().toLowerCase()
  const role = normalizeRole(headerAccessor.get(proxyHeaders.role))

  if (!email || !role) {
    return null
  }

  return {
    email,
    name: headerAccessor.get(proxyHeaders.name)?.trim() || deriveNameFromEmail(email),
    role,
    source: 'proxy-header',
  }
}

export function applySessionHeaders(headers: Headers, session: AppSession) {
  headers.set(INTERNAL_SESSION_HEADERS.authenticated, 'true')
  headers.set(INTERNAL_SESSION_HEADERS.email, session.email)
  headers.set(INTERNAL_SESSION_HEADERS.name, session.name)
  headers.set(INTERNAL_SESSION_HEADERS.role, session.role)
  headers.set(INTERNAL_SESSION_HEADERS.source, session.source)
}

export function hasRequiredRole(
  session: Pick<AppSession, 'role'> | null | undefined,
  requiredRole: AppUserRole,
) {
  if (!session) return false
  return ROLE_ORDER[session.role] >= ROLE_ORDER[requiredRole]
}

export function getRoleLabel(role: AppUserRole) {
  if (role === 'admin') return 'Admin'
  if (role === 'manager') return 'Manager'
  return 'Viewer'
}
