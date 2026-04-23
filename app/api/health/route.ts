import { NextRequest, NextResponse } from 'next/server'
import { getAssistantLlmConfig, getRuntimeEnv } from '@/lib/env'
import { getAuthMode } from '@/lib/auth/session'
import { getDriver } from '@/lib/neo4j'
import { createRouteLogger } from '@/lib/observability/logger'

export async function GET(request: NextRequest) {
  const routeLogger = createRouteLogger(request, 'health')

  try {
    const env = getRuntimeEnv()
    const driver = getDriver()
    await driver.verifyConnectivity()

    const assistantConfig = getAssistantLlmConfig()
    const payload = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        neo4jDatabase: env.NEO4J_DATABASE,
        authMode: getAuthMode(),
        assistantProvider: assistantConfig?.provider || null,
      },
      services: {
        neo4j: 'up',
        assistantProviderConfigured: Boolean(assistantConfig),
      },
    }

    routeLogger.done('checked', { neo4j: 'up', assistantProviderConfigured: payload.services.assistantProviderConfigured })
    return NextResponse.json(payload)
  } catch (error) {
    routeLogger.error('failed', error)
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          neo4j: 'down',
        },
      },
      { status: 503 },
    )
  }
}
