import { classifyAssistantIntent } from '@/lib/workforce-assistant/intent'
import { maybeNormalizeAssistantIntent, maybeRewriteAssistantResponse } from '@/lib/workforce-assistant/llm'
import {
  findEmployeesByRoleOrSkill,
  findTopEmployeesBySkillDomain,
  loadAssistantMetadata,
  summarizeDepartmentSkillCoverage,
  summarizeLocationTalentDistribution,
} from '@/lib/workforce-assistant/queries'
import type {
  AssistantAction,
  AssistantConversationTurn,
  AssistantGrounding,
  AssistantIntent,
  AssistantResponse,
} from '@/lib/workforce-assistant/types'

function formatEmployeeMeta(result: {
  title: string
  department: string
  location: string
  matchedSkills: string[]
  matchedSkillCount: number
}) {
  const segments = [result.title, result.department, result.location].filter(Boolean)
  if (result.matchedSkillCount > 0) {
    segments.push(`${result.matchedSkillCount} matched skills`)
  }
  return segments.join(' • ')
}

function buildGrounding(intent: AssistantIntent): AssistantGrounding[] {
  return [
    { type: 'intent', label: intent.type },
    ...(intent.domain ? [{ type: 'domain' as const, label: intent.domain }] : []),
    ...(intent.skillNames?.map((skill) => ({ type: 'skill' as const, label: skill })) || []),
    ...(intent.department ? [{ type: 'department' as const, label: intent.department }] : []),
    ...(intent.city ? [{ type: 'city' as const, label: intent.city }] : []),
    ...(intent.rawRoleTerm ? [{ type: 'role' as const, label: intent.rawRoleTerm }] : []),
  ]
}

function unsupportedResponse(intent: AssistantIntent): AssistantResponse {
  return {
    intent: intent.type,
    confidence: 'low',
    answer: 'I can answer grounded workforce questions about top employees by skill or role, skill concentration in a department or city, and talent distribution across locations. Try naming a specific skill, role, department, or Indonesian city.',
    results: [],
    followUps: [
      'Give me the top 5 employees in software programming domain.',
      'Which skills are most concentrated in Engineering?',
      'Where are software engineers located?',
    ],
    actions: [
      { label: 'Open talent graph', href: '/graph' },
      { label: 'View skills intelligence', href: '/skills' },
    ],
    grounding: buildGrounding(intent),
    warnings: ['The request could not be grounded to a supported workforce query yet.'],
  }
}

function withCommonActions(response: AssistantResponse, extraActions: AssistantAction[] = []) {
  const merged = [...response.actions, ...extraActions]
  const deduped = merged.filter((action, index) => merged.findIndex((candidate) => candidate.href === action.href && candidate.label === action.label) === index)
  return {
    ...response,
    actions: deduped.slice(0, 4),
  }
}

async function handleTopEmployees(intent: AssistantIntent): Promise<AssistantResponse> {
  const results = intent.skillNames?.length
    ? await findTopEmployeesBySkillDomain({
        skillNames: intent.skillNames,
        city: intent.city,
        department: intent.department,
        roleTerm: intent.roleTerm,
        limit: intent.limit,
      })
    : await findEmployeesByRoleOrSkill({
        roleTerm: intent.roleTerm,
        city: intent.city,
        department: intent.department,
        limit: intent.limit,
      })

  if (!results.length) {
    return {
      intent: intent.type,
      confidence: 'low',
      answer: 'I could not find employees that match those filters in the current workforce graph. Try loosening the skill, role, department, or city constraint.',
      results: [],
      followUps: ['Show me the strongest Python employees.', 'Where are software engineers located?'],
      actions: [
        { label: 'Open skills intelligence', href: '/skills' },
        { label: 'Open Indonesia footprint', href: '/locations' },
      ],
      grounding: buildGrounding(intent),
    }
  }

  const response: AssistantResponse = {
    intent: intent.type,
    confidence: intent.skillNames?.length ? 'high' : 'medium',
    answer: `I found ${results.length} strong matches${intent.city ? ` in ${intent.city}` : ''}${intent.department ? ` within ${intent.department}` : ''}. The ranking is based on matched skills, proficiency, and years of experience currently mapped in OpenTalent AirNav.`,
    results: results.map((result) => ({
      type: 'employee',
      key: result.employee_id,
      title: result.name,
      subtitle: result.title || 'Employee',
      meta: formatEmployeeMeta(result),
      href: `/employee/${result.employee_id}`,
      score: Number(result.score.toFixed(1)),
      supportingMetrics: {
        matchedSkills: result.matchedSkills.join(', '),
        yearsWeightedScore: Number(result.score.toFixed(1)),
      },
    })),
    followUps: [
      intent.city ? `Which skills are strongest in ${intent.city}?` : 'Which skills are most concentrated in Engineering?',
      'Where are software engineers located?',
    ],
    actions: [
      { label: 'Open talent graph', href: '/graph' },
      ...(intent.skillNames?.[0] ? [{ label: `View ${intent.skillNames[0]} cluster`, href: `/skills?skill=${encodeURIComponent(intent.skillNames[0])}` }] : []),
      ...(intent.city ? [{ label: `Open ${intent.city} footprint`, href: '/locations' }] : []),
    ],
    grounding: buildGrounding(intent),
  }

  return withCommonActions(response)
}

async function handleTopSkills(intent: AssistantIntent): Promise<AssistantResponse> {
  const results = await summarizeDepartmentSkillCoverage({
    department: intent.department,
    city: intent.city,
    limit: Math.min(intent.limit, 6),
  })

  if (!results.length) {
    return {
      intent: intent.type,
      confidence: 'low',
      answer: 'I could not find skill concentration data for that scope. Try naming a mapped department like Engineering or a city like Jakarta.',
      results: [],
      followUps: ['Which skills are most concentrated in Engineering?', 'Which skills are strongest in Jakarta?'],
      actions: [{ label: 'Open skills intelligence', href: '/skills' }],
      grounding: buildGrounding(intent),
    }
  }

  const scopeLabel = intent.department || intent.city || 'the current workforce scope'
  const topSkill = results[0]

  return withCommonActions({
    intent: intent.type,
    confidence: 'high',
    answer: `${topSkill.skillName} is the strongest visible capability in ${scopeLabel}, with ${topSkill.employeeCount} employees currently mapped to it. I ranked the rest by grounded employee coverage in that scope.`,
    results: results.map((result) => ({
      type: 'skill',
      key: result.skillName,
      title: result.skillName,
      subtitle: 'Skill coverage',
      meta: `${result.employeeCount} employees${result.topDepartments.length ? ` • ${result.topDepartments.join(', ')}` : ''}`,
      href: `/skills?skill=${encodeURIComponent(result.skillName)}`,
      score: result.employeeCount,
      supportingMetrics: {
        employeeCount: result.employeeCount,
      },
    })),
    followUps: [
      `Show me the top employees for ${topSkill.skillName}.`,
      intent.department ? `Where is ${topSkill.skillName} distributed across Indonesia?` : 'Open the relevant skill cluster.',
    ],
    actions: [
      { label: 'Open skills intelligence', href: '/skills' },
      ...(intent.department ? [{ label: `Open ${intent.department} graph`, href: `/graph?mode=department&department=${encodeURIComponent(intent.department)}` }] : []),
      ...(intent.city ? [{ label: 'Open Indonesia footprint', href: '/locations' }] : []),
    ],
    grounding: buildGrounding(intent),
  })
}

async function handleLocationDistribution(intent: AssistantIntent): Promise<AssistantResponse> {
  const results = await summarizeLocationTalentDistribution({
    roleTerm: intent.roleTerm,
    skillNames: intent.skillNames,
    department: intent.department,
    limit: Math.min(intent.limit, 6),
  })

  if (!results.length) {
    return {
      intent: intent.type,
      confidence: 'low',
      answer: 'I could not find any location distribution for that role, department, or capability combination.',
      results: [],
      followUps: ['Where are software engineers located?', 'Where is Python talent concentrated?'],
      actions: [{ label: 'Open Indonesia footprint', href: '/locations' }],
      grounding: buildGrounding(intent),
    }
  }

  const topCity = results[0]
  const subject =
    intent.rawRoleTerm ||
    intent.domain ||
    intent.skillNames?.[0] ||
    intent.department ||
    'the current workforce segment'

  return withCommonActions({
    intent: intent.type,
    confidence: 'high',
    answer: `${topCity.city} is the strongest location signal for ${subject}, with ${topCity.employeeCount} mapped employees in the current graph slice.`,
    results: results.map((result) => ({
      type: 'location',
      key: result.city,
      title: result.city,
      subtitle: 'Talent footprint',
      meta: `${result.employeeCount} employees${result.topRoles.length ? ` • ${result.topRoles.join(', ')}` : ''}`,
      href: '/locations',
      score: result.employeeCount,
      supportingMetrics: {
        employeeCount: result.employeeCount,
        topSkills: result.topSkills.join(', '),
      },
    })),
    followUps: [
      `Show me the strongest employees in ${topCity.city}.`,
      topCity.topSkills[0] ? `Who are the top employees in ${topCity.topSkills[0]}?` : 'Open the Indonesia footprint.',
    ],
    actions: [
      { label: 'Open Indonesia footprint', href: '/locations' },
      ...(intent.skillNames?.[0] ? [{ label: `View ${intent.skillNames[0]} cluster`, href: `/skills?skill=${encodeURIComponent(intent.skillNames[0])}` }] : []),
    ],
    grounding: buildGrounding(intent),
  })
}

export async function runWorkforceAssistant(params: {
  message: string
  conversation?: AssistantConversationTurn[]
}) {
  const metadata = await loadAssistantMetadata()
  const localIntent = classifyAssistantIntent(params.message, metadata)
  const intent = await maybeNormalizeAssistantIntent(params.message, metadata, localIntent)

  let response: AssistantResponse

  switch (intent.type) {
    case 'top_employees_by_capability':
    case 'employees_by_role_or_skill':
      response = await handleTopEmployees(intent)
      break
    case 'top_skills_by_scope':
      response = await handleTopSkills(intent)
      break
    case 'location_talent_distribution':
      response = await handleLocationDistribution(intent)
      break
    default:
      response = unsupportedResponse(intent)
      break
  }

  const rewritten = await maybeRewriteAssistantResponse(intent, response)

  if (intent.interpretationSource === 'llm' && intent.type !== localIntent.type) {
    return {
      ...rewritten,
      warnings: [...(rewritten.warnings || []), 'OpenRouter interpretation was used to clarify this request before grounding it against workforce data.'],
    }
  }

  return rewritten
}
