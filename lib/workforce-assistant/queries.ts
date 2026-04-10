import type { QueryResult, Session } from 'neo4j-driver'
import { getSession } from '@/lib/neo4j'
import type {
  AssistantMetadata,
  EmployeeCapabilityMatch,
  LocationDistributionMatch,
  SkillCoverageMatch,
} from '@/lib/workforce-assistant/types'

const PROFICIENCY_SCORES: Record<string, number> = {
  Foundational: 10,
  Intermediate: 20,
  Advanced: 30,
  Expert: 40,
}

let metadataCache: { value: AssistantMetadata; expiresAt: number } | null = null

function neo4jIntToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const candidate = value as { toNumber?: () => number; low?: number }
    if (typeof candidate.toNumber === 'function') return candidate.toNumber()
    if (typeof candidate.low === 'number') return candidate.low
  }
  return 0
}

async function runQuery<T>(session: Session, cypher: string, variables: Record<string, unknown>, transform: (result: QueryResult) => T) {
  const result = await session.run(cypher, variables)
  return transform(result)
}

export async function loadAssistantMetadata() {
  if (metadataCache && metadataCache.expiresAt > Date.now()) {
    return metadataCache.value
  }

  const session = getSession()

  try {
    const value = await runQuery(
      session,
      `
        CALL {
          MATCH (s:Skill)
          RETURN collect(DISTINCT s.name) AS skills
        }
        CALL {
          MATCH (d:Department)
          RETURN collect(DISTINCT d.name) AS departments
        }
        CALL {
          MATCH (e:Employee)
          WHERE coalesce(e.title, '') <> ''
          RETURN collect(DISTINCT e.title) AS titles
        }
        CALL {
          MATCH (e:Employee)
          WHERE coalesce(e.location, '') <> ''
          RETURN collect(DISTINCT e.location) AS cities
        }
        RETURN {
          skills: skills,
          departments: departments,
          titles: titles,
          cities: cities
        } AS result
      `,
      {},
      (result) => {
        const record = result.records[0]?.get('result') || {}
        return {
          skills: [...(record.skills || [])].sort(),
          departments: [...(record.departments || [])].sort(),
          titles: [...(record.titles || [])].sort(),
          cities: [...(record.cities || [])].sort(),
        } as AssistantMetadata
      },
    )

    metadataCache = {
      value,
      expiresAt: Date.now() + 5 * 60 * 1000,
    }

    return value
  } finally {
    await session.close()
  }
}

export async function findTopEmployeesBySkillDomain(params: {
  skillNames: string[]
  city?: string
  department?: string
  roleTerm?: string
  limit: number
}) {
  const session = getSession()

  try {
    return await runQuery(
      session,
      `
        MATCH (e:Employee)-[rel:HAS_SKILL]->(s:Skill)
        WHERE s.name IN $skillNames
          AND ($city = '' OR e.location = $city)
          AND ($department = '' OR e.department = $department)
          AND ($roleTerm = '' OR toLower(coalesce(e.title, '')) CONTAINS toLower($roleTerm))
        WITH e,
             collect(DISTINCT s.name) AS matchedSkills,
             count(DISTINCT s) AS matchedSkillCount,
             sum(
               CASE coalesce(rel.proficiencyLevel, '')
                 WHEN 'Expert' THEN 40
                 WHEN 'Advanced' THEN 30
                 WHEN 'Intermediate' THEN 20
                 WHEN 'Foundational' THEN 10
                 ELSE 0
               END + coalesce(rel.yearsOfExperience, 0)
             ) AS capabilityScore
        RETURN e, matchedSkills, matchedSkillCount, capabilityScore
        ORDER BY matchedSkillCount DESC, capabilityScore DESC, e.name ASC
        LIMIT toInteger($limit)
      `,
      {
        skillNames: params.skillNames,
        city: params.city || '',
        department: params.department || '',
        roleTerm: params.roleTerm || '',
        limit: params.limit,
      },
      (result) =>
        result.records.map((record) => {
          const employee = record.get('e')
          return {
            employee_id: employee.properties.employee_id,
            name: employee.properties.name,
            title: employee.properties.title,
            department: employee.properties.department,
            location: employee.properties.location,
            matchedSkills: record.get('matchedSkills') || [],
            matchedSkillCount: neo4jIntToNumber(record.get('matchedSkillCount')),
            score: Number(record.get('capabilityScore') || 0),
          } satisfies EmployeeCapabilityMatch
        }),
    )
  } finally {
    await session.close()
  }
}

export async function findEmployeesByRoleOrSkill(params: {
  roleTerm?: string
  skillNames?: string[]
  city?: string
  department?: string
  limit: number
}) {
  const session = getSession()
  const hasSkillFilter = Boolean(params.skillNames?.length)

  try {
    return await runQuery(
      session,
      `
        MATCH (e:Employee)
        WHERE ($city = '' OR e.location = $city)
          AND ($department = '' OR e.department = $department)
          AND ($roleTerm = '' OR toLower(coalesce(e.title, '')) CONTAINS toLower($roleTerm))
        OPTIONAL MATCH (e)-[rel:HAS_SKILL]->(s:Skill)
        WITH e,
             collect(DISTINCT s.name) AS employeeSkills,
             collect(rel) AS rels
        WHERE ($hasSkillFilter = false OR any(skillName IN employeeSkills WHERE skillName IN $skillNames))
        WITH e,
             [skillName IN employeeSkills WHERE skillName IN $skillNames] AS matchedSkills,
             reduce(total = 0.0, rel IN rels |
               total +
               CASE coalesce(rel.proficiencyLevel, '')
                 WHEN 'Expert' THEN 40
                 WHEN 'Advanced' THEN 30
                 WHEN 'Intermediate' THEN 20
                 WHEN 'Foundational' THEN 10
                 ELSE 0
               END +
               coalesce(rel.yearsOfExperience, 0)
             ) AS capabilityScore
        RETURN e, matchedSkills, size(matchedSkills) AS matchedSkillCount, capabilityScore
        ORDER BY matchedSkillCount DESC, capabilityScore DESC, e.name ASC
        LIMIT toInteger($limit)
      `,
      {
        roleTerm: params.roleTerm || '',
        skillNames: params.skillNames || [],
        city: params.city || '',
        department: params.department || '',
        hasSkillFilter,
        limit: params.limit,
      },
      (result) =>
        result.records.map((record) => {
          const employee = record.get('e')
          return {
            employee_id: employee.properties.employee_id,
            name: employee.properties.name,
            title: employee.properties.title,
            department: employee.properties.department,
            location: employee.properties.location,
            matchedSkills: record.get('matchedSkills') || [],
            matchedSkillCount: neo4jIntToNumber(record.get('matchedSkillCount')),
            score: Number(record.get('capabilityScore') || 0),
          } satisfies EmployeeCapabilityMatch
        }),
    )
  } finally {
    await session.close()
  }
}

export async function summarizeDepartmentSkillCoverage(params: {
  department?: string
  city?: string
  limit: number
}) {
  const session = getSession()

  try {
    return await runQuery(
      session,
      `
        MATCH (e:Employee)-[:HAS_SKILL]->(s:Skill)
        WHERE ($department = '' OR e.department = $department)
          AND ($city = '' OR e.location = $city)
        WITH s.name AS skillName, count(DISTINCT e) AS employeeCount, collect(DISTINCT e.department)[..3] AS topDepartments
        ORDER BY employeeCount DESC, skillName ASC
        RETURN skillName, employeeCount, topDepartments
        LIMIT toInteger($limit)
      `,
      {
        department: params.department || '',
        city: params.city || '',
        limit: params.limit,
      },
      (result) =>
        result.records.map((record) => ({
          skillName: record.get('skillName'),
          employeeCount: neo4jIntToNumber(record.get('employeeCount')),
          topDepartments: record.get('topDepartments') || [],
        } satisfies SkillCoverageMatch)),
    )
  } finally {
    await session.close()
  }
}

export async function summarizeLocationTalentDistribution(params: {
  roleTerm?: string
  skillNames?: string[]
  department?: string
  limit: number
}) {
  const session = getSession()
  const hasSkillFilter = Boolean(params.skillNames?.length)

  try {
    return await runQuery(
      session,
      `
        MATCH (e:Employee)
        WHERE coalesce(e.location, '') <> ''
          AND ($department = '' OR e.department = $department)
          AND ($roleTerm = '' OR toLower(coalesce(e.title, '')) CONTAINS toLower($roleTerm))
        OPTIONAL MATCH (e)-[:HAS_SKILL]->(s:Skill)
        WITH e, collect(DISTINCT s.name) AS employeeSkills
        WHERE ($hasSkillFilter = false OR any(skillName IN employeeSkills WHERE skillName IN $skillNames))
        WITH e.location AS city,
             count(DISTINCT e) AS employeeCount,
             collect(DISTINCT e.title)[..3] AS topRoles,
             reduce(allSkills = [], skills IN collect(employeeSkills) | allSkills + skills) AS flattenedSkills
        WITH city, employeeCount, topRoles,
             [skill IN flattenedSkills WHERE skill IS NOT NULL][..3] AS topSkills
        ORDER BY employeeCount DESC, city ASC
        RETURN city, employeeCount, topRoles, topSkills
        LIMIT toInteger($limit)
      `,
      {
        roleTerm: params.roleTerm || '',
        skillNames: params.skillNames || [],
        department: params.department || '',
        hasSkillFilter,
        limit: params.limit,
      },
      (result) =>
        result.records.map((record) => ({
          city: record.get('city'),
          employeeCount: neo4jIntToNumber(record.get('employeeCount')),
          topRoles: record.get('topRoles') || [],
          topSkills: record.get('topSkills') || [],
        } satisfies LocationDistributionMatch)),
    )
  } finally {
    await session.close()
  }
}

export function scoreCapabilityMatch(proficiencyLevel?: string, yearsOfExperience = 0) {
  return (PROFICIENCY_SCORES[proficiencyLevel || ''] || 0) + yearsOfExperience
}
