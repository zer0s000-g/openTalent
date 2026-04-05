import { z } from 'zod'

const EnvSchema = z.object({
  NEO4J_URI: z.string().url().default('bolt://localhost:7687'),
  NEO4J_USERNAME: z.string().min(1).default('neo4j'),
  NEO4J_PASSWORD: z.string().min(1, 'NEO4J_PASSWORD is required'),
  NEO4J_DATABASE: z.string().min(1).default('neo4j'),
})

export type RuntimeEnv = z.infer<typeof EnvSchema>

export function getRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = EnvSchema.safeParse(env)
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid environment configuration: ${message}`)
  }
  return parsed.data
}
