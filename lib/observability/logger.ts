import type { NextRequest } from 'next/server'
import { getRequestSessionFromHeaders } from '@/lib/auth/session'

type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface LogPayload {
  event: string
  [key: string]: unknown
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    }
  }

  return {
    message: String(error),
  }
}

function write(level: LogLevel, payload: LogPayload) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...payload,
  })

  if (level === 'ERROR') {
    console.error(line)
    return
  }

  if (level === 'WARN') {
    console.warn(line)
    return
  }

  console.log(line)
}

export const logger = {
  info(payload: LogPayload) {
    write('INFO', payload)
  },
  warn(payload: LogPayload) {
    write('WARN', payload)
  },
  error(payload: LogPayload) {
    write('ERROR', payload)
  },
}

export function getRequestLogContext(request: Pick<NextRequest, 'headers' | 'method' | 'nextUrl'>) {
  const session = getRequestSessionFromHeaders(request.headers)
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    actorEmail: session?.email || null,
    actorRole: session?.role || null,
    authSource: session?.source || null,
    requestId: request.headers.get('x-request-id') || null,
  }
}

export function createRouteLogger(
  request: Pick<NextRequest, 'headers' | 'method' | 'nextUrl'>,
  eventPrefix: string,
) {
  const context = getRequestLogContext(request)
  const startedAt = Date.now()

  return {
    info(event: string, extra: Record<string, unknown> = {}) {
      logger.info({
        event: `${eventPrefix}.${event}`,
        ...context,
        ...extra,
      })
    },
    warn(event: string, extra: Record<string, unknown> = {}) {
      logger.warn({
        event: `${eventPrefix}.${event}`,
        ...context,
        ...extra,
      })
    },
    error(event: string, error: unknown, extra: Record<string, unknown> = {}) {
      logger.error({
        event: `${eventPrefix}.${event}`,
        ...context,
        durationMs: Date.now() - startedAt,
        error: serializeError(error),
        ...extra,
      })
    },
    done(event = 'completed', extra: Record<string, unknown> = {}) {
      logger.info({
        event: `${eventPrefix}.${event}`,
        ...context,
        durationMs: Date.now() - startedAt,
        ...extra,
      })
    },
  }
}
