import { NextRequest, NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'
import { getRuntimeEnv } from '@/lib/env'
import { hasRequiredRole, getRequestSessionFromHeaders } from '@/lib/auth/session'
import { importEmployeesFromCsv, listRecentImportBatches } from '@/lib/importer'
import { createRouteLogger } from '@/lib/observability/logger'

function createDriver() {
  const env = getRuntimeEnv()
  return neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD))
}

function requireAdmin(request: NextRequest, routeLogger: ReturnType<typeof createRouteLogger>) {
  const session = getRequestSessionFromHeaders(request.headers)
  if (!hasRequiredRole(session, 'admin')) {
    routeLogger.warn('forbidden')
    return {
      session,
      response: NextResponse.json({ error: 'Administrator access is required' }, { status: 403 }),
    }
  }

  return { session, response: null }
}

export async function GET(request: NextRequest) {
  const routeLogger = createRouteLogger(request, 'import')

  try {
    const { response } = requireAdmin(request, routeLogger)
    if (response) return response

    const driver = createDriver()

    try {
      await driver.verifyConnectivity()
      const imports = await listRecentImportBatches(driver)
      routeLogger.done('history_loaded', { count: imports.length })
      return NextResponse.json({ imports })
    } finally {
      await driver.close()
    }
  } catch (error) {
    routeLogger.error('history_failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load import history' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const routeLogger = createRouteLogger(request, 'import')

  try {
    const { session, response } = requireAdmin(request, routeLogger)
    if (response) return response

    const body = await request.json()
    const csv = typeof body?.csv === 'string' ? body.csv : ''
    const mode = body?.mode === 'dry-run' ? 'dry-run' : 'apply'
    const filename = typeof body?.filename === 'string' && body.filename.trim() ? body.filename.trim() : undefined

    if (!csv.trim()) {
      routeLogger.warn('rejected', { reason: 'missing_csv' })
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
    }

    const driver = createDriver()

    try {
      await driver.verifyConnectivity()
      const result = await importEmployeesFromCsv(driver, csv, {
        mode,
        actor: session,
        filename,
      })
      routeLogger.done(mode === 'dry-run' ? 'reviewed' : 'completed', {
        mode,
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        rowsToCreate: result.rowsToCreate,
        rowsToUpdate: result.rowsToUpdate,
        applied: result.applied,
      })
      return NextResponse.json({ result })
    } finally {
      await driver.close()
    }
  } catch (error) {
    routeLogger.error('failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 },
    )
  }
}
