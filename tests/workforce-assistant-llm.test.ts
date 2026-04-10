import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAssistantLlmConfig } from '@/lib/env'
import { maybeNormalizeAssistantIntent, maybeRewriteAssistantResponse } from '@/lib/workforce-assistant/llm'
import type { AssistantIntent, AssistantMetadata, AssistantResponse } from '@/lib/workforce-assistant/types'

const metadata: AssistantMetadata = {
  skills: ['Python', 'React', 'Communication'],
  departments: ['Engineering', 'Operations'],
  titles: ['Software Engineer', 'Engineering Manager'],
  cities: ['Jakarta', 'Surabaya'],
}

const unsupportedIntent: AssistantIntent = {
  type: 'unsupported',
  normalizedMessage: 'show me the best engineers in jakarta',
  limit: 5,
}

const baseResponse: AssistantResponse = {
  answer: 'I found 2 strong matches in Jakarta.',
  intent: 'top_employees_by_capability',
  confidence: 'high',
  results: [],
  followUps: ['Where are software engineers located?'],
  actions: [],
  grounding: [],
}

describe('workforce assistant llm integration', () => {
  beforeEach(() => {
    vi.stubEnv('NEO4J_PASSWORD', 'opentalent123')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('prefers OpenRouter configuration with the Gemma model when the API key is present', () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')

    const config = getAssistantLlmConfig(process.env)

    expect(config).toMatchObject({
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'google/gemma-4-31b-it:free',
    })
  })

  it('uses OpenRouter to normalize an unsupported request into a grounded supported intent', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: 'top_employees_by_capability',
                  city: 'Jakarta',
                  roleTerm: 'engineer',
                  limit: 5,
                  confidence: 'medium',
                }),
              },
            },
          ],
        }),
      }),
    )

    const intent = await maybeNormalizeAssistantIntent('show me the best engineers in jakarta', metadata, unsupportedIntent)

    expect(intent.type).toBe('top_employees_by_capability')
    expect(intent.city).toBe('Jakarta')
    expect(intent.roleTerm).toBe('engineer')
    expect(intent.interpretationSource).toBe('llm')
  })

  it('falls back to the grounded local answer when the provider returns malformed data', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"not":"valid for this schema"}',
              },
            },
          ],
        }),
      }),
    )

    const response = await maybeRewriteAssistantResponse(unsupportedIntent, baseResponse)

    expect(response.answer).toBe(baseResponse.answer)
    expect(response.followUps).toEqual(baseResponse.followUps)
  })
})
