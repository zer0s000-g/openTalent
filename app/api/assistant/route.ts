import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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
  try {
    const body = await request.json()
    const parsed = AssistantRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || 'Invalid assistant request',
        },
        { status: 400 },
      )
    }

    const response = await runWorkforceAssistant(parsed.data)
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to run workforce assistant',
      },
      { status: 500 },
    )
  }
}
