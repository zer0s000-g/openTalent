import { z } from 'zod'
import { getAssistantLlmConfig } from '@/lib/env'
import type { AssistantIntent, AssistantMetadata, AssistantResponse } from '@/lib/workforce-assistant/types'

const RewriteSchema = z.object({
  answer: z.string().min(1),
  followUps: z.array(z.string().min(1)).max(3).default([]),
})

const IntentRewriteSchema = z.object({
  intent: z.enum([
    'top_employees_by_capability',
    'employees_by_role_or_skill',
    'top_skills_by_scope',
    'location_talent_distribution',
    'unsupported',
  ]),
  domain: z.string().optional(),
  skillNames: z.array(z.string()).max(8).optional(),
  department: z.string().optional(),
  city: z.string().optional(),
  roleTerm: z.string().optional(),
  limit: z.number().int().min(1).max(10).optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
})

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s./-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function callOpenAiCompatibleJson<T>({
  systemPrompt,
  userPrompt,
  schema,
}: {
  systemPrompt: string
  userPrompt: string
  schema: z.ZodSchema<T>
}) {
  const config = getAssistantLlmConfig()
  if (!config) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        ...(config.provider === 'openrouter' ? { plugins: [{ id: 'response-healing' }] } : {}),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) return null

    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return null

    const parsed = schema.safeParse(JSON.parse(content))
    if (!parsed.success) return null

    return parsed.data
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function buildRewritePrompt(intent: AssistantIntent, response: AssistantResponse) {
  return [
    'You are rewriting a grounded workforce assistant response for AirNav Indonesia.',
    'Use only the provided facts. Do not invent entities, skills, rankings, or explanations.',
    'Return strict JSON with keys: answer, followUps.',
    '',
    `Intent: ${intent.type}`,
    `User request: ${intent.normalizedMessage}`,
    `Current grounded answer: ${response.answer}`,
    `Grounding: ${response.grounding.map((item) => `${item.type}:${item.label}${item.value ? `=${item.value}` : ''}`).join(', ') || 'none'}`,
    `Results: ${response.results.map((result) => `${result.title} | ${result.subtitle} | ${result.meta || ''}`).join(' || ') || 'none'}`,
    `Suggested follow-ups: ${response.followUps.join(' | ') || 'none'}`,
  ].join('\n')
}

function buildIntentPrompt(message: string, metadata: AssistantMetadata, localIntent: AssistantIntent) {
  return [
    'You convert a user workforce question into a strict supported intent for OpenTalent AirNav.',
    'You may only use the supported intents and the known metadata below.',
    'Return JSON only.',
    '',
    `User request: ${message}`,
    `Local interpretation: ${localIntent.type}`,
    `Known departments: ${metadata.departments.join(', ')}`,
    `Known cities: ${metadata.cities.join(', ')}`,
    `Known skills: ${metadata.skills.slice(0, 40).join(', ')}`,
    `Known titles: ${metadata.titles.slice(0, 30).join(', ')}`,
    '',
    'Allowed intents:',
    '- top_employees_by_capability',
    '- employees_by_role_or_skill',
    '- top_skills_by_scope',
    '- location_talent_distribution',
    '- unsupported',
    '',
    'Rules:',
    '- Prefer top_employees_by_capability for "top" or "best" employee ranking questions.',
    '- Prefer top_skills_by_scope when the user asks which skills are strongest in a department or city.',
    '- Prefer location_talent_distribution when the user asks where a role or capability is concentrated.',
    '- Only use departments, cities, skills, and titles that appear in the known metadata.',
  ].join('\n')
}

export async function maybeNormalizeAssistantIntent(message: string, metadata: AssistantMetadata, localIntent: AssistantIntent) {
  if (localIntent.type !== 'unsupported' && localIntent.skillNames?.length) {
    return localIntent
  }

  const normalized = await callOpenAiCompatibleJson({
    systemPrompt: 'Return strict JSON for a grounded workforce intent. Never invent cities, departments, or skills outside the provided metadata.',
    userPrompt: buildIntentPrompt(message, metadata, localIntent),
    schema: IntentRewriteSchema,
  })

  if (!normalized || normalized.intent === 'unsupported') {
    return localIntent
  }

  const normalizedSkills = (normalized.skillNames || []).filter((skill) =>
    metadata.skills.some((candidate) => normalizeText(candidate) === normalizeText(skill)),
  ).map((skill) => metadata.skills.find((candidate) => normalizeText(candidate) === normalizeText(skill))!)

  const normalizedDepartment = normalized.department?.trim()
  const department = normalizedDepartment
    ? metadata.departments.find((candidate) => normalizeText(candidate) === normalizeText(normalizedDepartment))
    : undefined

  const normalizedCity = normalized.city?.trim()
  const city = normalizedCity
    ? metadata.cities.find((candidate) => normalizeText(candidate) === normalizeText(normalizedCity))
    : undefined

  return {
    type: normalized.intent,
    normalizedMessage: localIntent.normalizedMessage,
    limit: normalized.limit || localIntent.limit,
    domain: normalized.domain || localIntent.domain,
    skillNames: normalizedSkills.length ? normalizedSkills : localIntent.skillNames,
    department: department || localIntent.department,
    city: city || localIntent.city,
    roleTerm: normalized.roleTerm || localIntent.roleTerm,
    rawRoleTerm: normalized.roleTerm || localIntent.rawRoleTerm,
    interpretationSource: 'llm',
  } satisfies AssistantIntent
}

export async function maybeRewriteAssistantResponse(intent: AssistantIntent, response: AssistantResponse) {
  const rewritten = await callOpenAiCompatibleJson({
    systemPrompt: 'Rewrite grounded workforce assistant answers into concise enterprise-ready language. Return JSON only.',
    userPrompt: buildRewritePrompt(intent, response),
    schema: RewriteSchema,
  })

  if (!rewritten) {
    return response
  }

  return {
    ...response,
    answer: rewritten.answer,
    followUps: (rewritten.followUps || []).length ? rewritten.followUps : response.followUps,
  }
}
