import { indonesiaCities } from '@/lib/indonesia-cities'
import { resolveCapabilityDomain } from '@/lib/workforce-assistant/taxonomy'
import type { AssistantIntent, AssistantMetadata } from '@/lib/workforce-assistant/types'

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s./-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLimit(message: string) {
  const topMatch = message.match(/\btop\s+(\d+)\b/i)
  if (topMatch) {
    return Math.min(Math.max(Number(topMatch[1]), 1), 10)
  }

  const employeesMatch = message.match(/\b(\d+)\s+employees?\b/i)
  if (employeesMatch) {
    return Math.min(Math.max(Number(employeesMatch[1]), 1), 10)
  }

  return 5
}

function findLongestMatch(message: string, options: string[]) {
  const normalized = normalizeText(message)
  return [...options]
    .sort((left, right) => right.length - left.length)
    .find((option) => normalized.includes(normalizeText(option)))
}

function extractRoleTerm(message: string, titles: string[]) {
  const titleMatch = findLongestMatch(message, titles)
  if (titleMatch) return { roleTerm: titleMatch, rawRoleTerm: titleMatch }

  const normalized = normalizeText(message)
  const roleKeywords = [
    'engineer',
    'manager',
    'analyst',
    'designer',
    'researcher',
    'scientist',
    'coordinator',
    'partner',
    'support',
    'csm',
    'ae',
    'sdr',
    'counsel',
  ]

  const matchedKeyword = roleKeywords.find((keyword) => normalized.includes(keyword))
  if (!matchedKeyword) return {}

  return {
    roleTerm: matchedKeyword,
    rawRoleTerm: matchedKeyword,
  }
}

export function classifyAssistantIntent(message: string, metadata: AssistantMetadata): AssistantIntent {
  const normalizedMessage = normalizeText(message)
  const limit = extractLimit(normalizedMessage)
  const domain = resolveCapabilityDomain(normalizedMessage)
  const city = findLongestMatch(normalizedMessage, metadata.cities.length ? metadata.cities : indonesiaCities.map((item) => item.name))
  const department = findLongestMatch(normalizedMessage, metadata.departments)
  const skillName = findLongestMatch(normalizedMessage, metadata.skills)
  const { roleTerm, rawRoleTerm } = extractRoleTerm(normalizedMessage, metadata.titles)

  const skillNames = domain?.skills?.length
    ? domain.skills.filter((skill) => metadata.skills.includes(skill))
    : skillName
      ? [skillName]
      : undefined

  const hasTopIntent = /\b(top|best|strongest|highest)\b/.test(normalizedMessage)
  const hasEmployeeIntent = /\b(employee|employees|people|talent|who)\b/.test(normalizedMessage)
  const hasSkillIntent = /\bskills?\b/.test(normalizedMessage)
  const hasLocationIntent = /\bwhere|location|city|cities|footprint|distribution\b/.test(normalizedMessage)

  if ((hasTopIntent || hasEmployeeIntent) && (skillNames?.length || roleTerm)) {
    return {
      type: hasTopIntent || skillNames?.length ? 'top_employees_by_capability' : 'employees_by_role_or_skill',
      normalizedMessage,
      limit,
      domain: domain?.domain,
      skillNames,
      department,
      city,
      roleTerm,
      rawRoleTerm,
    }
  }

  if (hasSkillIntent && (department || city)) {
    return {
      type: 'top_skills_by_scope',
      normalizedMessage,
      limit,
      department,
      city,
    }
  }

  if (hasLocationIntent && (roleTerm || skillNames?.length || department)) {
    return {
      type: 'location_talent_distribution',
      normalizedMessage,
      limit,
      domain: domain?.domain,
      skillNames,
      department,
      city,
      roleTerm,
      rawRoleTerm,
    }
  }

  if ((/\bfind|list|show\b/.test(normalizedMessage) || hasEmployeeIntent) && (roleTerm || skillNames?.length)) {
    return {
      type: 'employees_by_role_or_skill',
      normalizedMessage,
      limit,
      domain: domain?.domain,
      skillNames,
      department,
      city,
      roleTerm,
      rawRoleTerm,
    }
  }

  return {
    type: 'unsupported',
    normalizedMessage,
    limit,
    department,
    city,
    skillNames,
    roleTerm,
    rawRoleTerm,
  }
}
