import { z } from 'zod'

const EnvSchema = z.object({
  NEO4J_URI: z.string().url().default('bolt://localhost:7687'),
  NEO4J_USERNAME: z.string().min(1).default('neo4j'),
  NEO4J_PASSWORD: z.string().min(1, 'NEO4J_PASSWORD is required'),
  NEO4J_DATABASE: z.string().min(1).default('neo4j'),
  LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_MODEL: z.string().min(1).optional(),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().min(1).default('google/gemma-4-31b-it:free'),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().min(1).default('OpenTalent AirNav'),
})

export type RuntimeEnv = z.infer<typeof EnvSchema>

export interface AssistantLlmConfig {
  provider: 'openrouter' | 'generic'
  baseUrl: string
  apiKey: string
  model: string
  timeoutMs: number
  headers?: Record<string, string>
}

export function getRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = EnvSchema.safeParse(env)
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment configuration: ${message}`)
  }
  return parsed.data
}

export function getAssistantLlmConfig(env: NodeJS.ProcessEnv = process.env): AssistantLlmConfig | null {
  const runtimeEnv = getRuntimeEnv(env)

  if (runtimeEnv.OPENROUTER_API_KEY) {
    return {
      provider: 'openrouter',
      baseUrl: runtimeEnv.OPENROUTER_BASE_URL,
      apiKey: runtimeEnv.OPENROUTER_API_KEY,
      model: runtimeEnv.OPENROUTER_MODEL,
      timeoutMs: runtimeEnv.LLM_TIMEOUT_MS,
      headers: {
        ...(runtimeEnv.OPENROUTER_SITE_URL ? { 'HTTP-Referer': runtimeEnv.OPENROUTER_SITE_URL } : {}),
        ...(runtimeEnv.OPENROUTER_APP_NAME ? { 'X-Title': runtimeEnv.OPENROUTER_APP_NAME } : {}),
      },
    }
  }

  if (runtimeEnv.LLM_BASE_URL && runtimeEnv.LLM_API_KEY && runtimeEnv.LLM_MODEL) {
    return {
      provider: 'generic',
      baseUrl: runtimeEnv.LLM_BASE_URL,
      apiKey: runtimeEnv.LLM_API_KEY,
      model: runtimeEnv.LLM_MODEL,
      timeoutMs: runtimeEnv.LLM_TIMEOUT_MS,
    }
  }

  return null
}
