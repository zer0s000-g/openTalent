import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hasRequiredRole, getRequestSessionFromHeaders } from '@/lib/auth/session'
import { createRouteLogger } from '@/lib/observability/logger'
import { runWorkforceAssistant } from '@/lib/workforce-assistant/service'

const ConversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1),
})

const AssistantRequestSchema = z.object({
  message: z.string().trim().min(2, 'Please enter a more specific workforce question.'),
  conversation: z.array(ConversationTurnSchema).max(8).optional(),
})

export async function POST(request: NextRequest) {
  const routeLogger = createRouteLogger(request, 'assistant')

  try {
    const session = getRequestSessionFromHeaders(request.headers)
    if (!hasRequiredRole(session, 'viewer')) {
      routeLogger.warn('forbidden')
      return NextResponse.json(
        {
          error: 'Authenticated internal access is required',
        },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = AssistantRequestSchema.safeParse(body)

    if (!parsed.success) {
      routeLogger.warn('rejected', { reason: 'validation' })
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || 'Invalid assistant request',
        },
        { status: 400 },
      )
    }

    const response = await runWorkforceAssistant(parsed.data)
    routeLogger.done('completed', {
      intent: response.intent,
      confidence: response.confidence,
      resultCount: response.results.length,
    })
    return NextResponse.json(response)
  } catch (error) {
    routeLogger.error('failed', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to run workforce assistant',
      },
      { status: 500 },
    )
  }
}
