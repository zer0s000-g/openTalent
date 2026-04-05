import { parse, Kind, type OperationDefinitionNode, type FieldNode } from 'graphql'
import { NextRequest, NextResponse } from 'next/server'
import type { QueryResult } from 'neo4j-driver'
import { getSession } from '@/lib/neo4j'

type ApiQueryConfig = {
  cypher: string
  transform: (result: QueryResult) => unknown
}

function neo4jIntToNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const candidate = value as { toNumber?: () => number; low?: number }
    if (typeof candidate.toNumber === 'function') return candidate.toNumber()
    if (typeof candidate.low === 'number') return candidate.low
  }
  return 0
}

function formatNode(node: any): { id: string; labels: string[]; properties: Record<string, unknown> } | null {
  if (!node) return null
  return {
    id: node.elementId,
    labels: Array.isArray(node.labels) ? node.labels : [],
    properties: node.properties ?? {},
  }
}

export function getPrimaryQueryField(query: string, operationName?: string): string {
  const document = parse(query)

  const operations = document.definitions.filter(
    (definition): definition is OperationDefinitionNode => definition.kind === Kind.OPERATION_DEFINITION,
  )

  const targetOperation = operationName
    ? operations.find((operation) => operation.name?.value === operationName)
    : operations[0]

  if (!targetOperation) {
    throw new Error('No GraphQL operation found in request')
  }

  const firstSelection = targetOperation.selectionSet.selections.find(
    (selection): selection is FieldNode => selection.kind === Kind.FIELD,
  )

  if (!firstSelection) {
    throw new Error('No root query field found in operation')
  }

  return firstSelection.name.value
}

const QUERY_MAP: Record<string, ApiQueryConfig> = {
  getDashboardStats: {
    cypher: `
      MATCH (e:Employee)
      WITH count(e) AS employeeCount
      MATCH (s:Skill)
      WITH employeeCount, count(s) AS skillCount
      RETURN {
        employeesAggregate: { count: employeeCount },
        skillsAggregate: { count: skillCount }
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      return data || { employeesAggregate: { count: 0 }, skillsAggregate: { count: 0 } }
    },
  },
  employees: {
    cypher: `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[:REPORTS_TO]->(m:Employee)
      OPTIONAL MATCH (e)<-[:REPORTS_TO]-(directs:Employee)
      OPTIONAL MATCH (e)-[:HAS_SKILL]->(s:Skill)
      OPTIONAL MATCH (e)-[:HOLDS_CERTIFICATION]->(c:Certification)
      OPTIONAL MATCH (e)-[:HAS_EDUCATION]->(ed:Education)
      OPTIONAL MATCH (e)-[:ASPIRES_TO]->(a:Aspiration)
      RETURN e,
             collect(DISTINCT m)[0] AS manager,
             collect(DISTINCT directs) AS directReports,
             collect(DISTINCT s) AS skills,
             collect(DISTINCT c) AS certifications,
             collect(DISTINCT ed) AS education,
             collect(DISTINCT a) AS aspirations
    `,
    transform: (result) => {
      const record = result.records[0]
      if (!record) return []

      const employee = record.get('e')
      const manager = record.get('manager')
      const directReports = record.get('directReports') || []
      const skills = record.get('skills') || []
      const certifications = record.get('certifications') || []
      const education = record.get('education') || []
      const aspirations = record.get('aspirations') || []

      return [{
        employee_id: employee.properties.employee_id,
        name: employee.properties.name,
        email: employee.properties.email,
        title: employee.properties.title,
        department: employee.properties.department,
        location: employee.properties.location,
        hired_date: employee.properties.hired_date?.toString(),
        manager: manager
          ? {
              employee_id: manager.properties.employee_id,
              name: manager.properties.name,
              title: manager.properties.title,
            }
          : undefined,
        directReports: directReports.map((d: any) => ({
          employee_id: d.properties.employee_id,
          name: d.properties.name,
          title: d.properties.title,
        })),
        skills: skills.map((s: any) => ({ name: s.properties.name })),
        certifications: certifications.map((c: any) => ({
          name: c.properties.name,
          issuer: c.properties.issuer,
        })),
        education: education.map((e: any) => ({
          institution: e.properties.institution,
          degree: e.properties.degree,
          field: e.properties.field,
          year: e.properties.year,
        })),
        aspirations: aspirations.map((a: any) => ({
          type: a.properties.type,
          targetRole: a.properties.targetRole,
          targetDepartment: a.properties.targetDepartment,
          timeline: a.properties.timeline,
        })),
      }]
    },
  },
  searchEmployees: {
    cypher: `
      MATCH (e:Employee)
      WHERE toLower(coalesce(e.name, '')) CONTAINS toLower($query)
         OR toLower(coalesce(e.title, '')) CONTAINS toLower($query)
         OR toLower(coalesce(e.department, '')) CONTAINS toLower($query)
      RETURN e
      LIMIT toInteger($limit)
    `,
    transform: (result) =>
      result.records.map((record) => {
        const employee = record.get('e')
        return {
          employee_id: employee.properties.employee_id,
          name: employee.properties.name,
          title: employee.properties.title,
          department: employee.properties.department,
          email: employee.properties.email,
        }
      }),
  },
  skills: {
    cypher: `
      MATCH (s:Skill)
      OPTIONAL MATCH (e:Employee)-[:HAS_SKILL]->(s)
      WITH s, collect(DISTINCT e)[..200] AS employees
      RETURN s, employees, size(employees) AS employeeCount
      ORDER BY employeeCount DESC
    `,
    transform: (result) =>
      result.records.map((record) => ({
        name: record.get('s').properties.name,
        employeeCount: neo4jIntToNumber(record.get('employeeCount')),
        employees: (record.get('employees') || []).map((employee: any) => ({
          employee_id: employee.properties.employee_id,
        })),
      })),
  },
  getEmployeesBySkill: {
    cypher: `
      MATCH (e:Employee)-[:HAS_SKILL]->(s:Skill { name: $skillName })
      RETURN e
      LIMIT toInteger($limit)
    `,
    transform: (result) =>
      result.records.map((record) => {
        const employee = record.get('e')
        return {
          employee_id: employee.properties.employee_id,
          name: employee.properties.name,
          title: employee.properties.title,
          department: employee.properties.department,
        }
      }),
  },
  getOrganizationOverview: {
    cypher: `
      MATCH (exec:Employee)
      WHERE NOT (exec)-[:REPORTS_TO]->()
      OPTIONAL MATCH (exec)<-[:REPORTS_TO]-(direct:Employee)
      OPTIONAL MATCH (exec)-[:HAS_SKILL]->(execSkill:Skill)
      WITH exec,
           collect(DISTINCT direct)[..15] AS directs,
           collect(DISTINCT execSkill)[..10] AS execSkills,
           size(collect(DISTINCT direct)) AS reportCount
      ORDER BY reportCount DESC
      LIMIT 1
      RETURN {
        center: exec,
        nodes: [exec] + directs + execSkills
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data?.center) return { center: undefined, nodes: [], relationships: [] }

      const center = data.center
      const nodes = (data.nodes || []).filter(Boolean)
      const relationships: Array<{ start: { id: string }; end: { id: string }; type: string }> = []

      for (const node of nodes) {
        if (node.elementId === center.elementId) continue
        if (node.labels?.includes('Employee')) {
          relationships.push({ start: { id: center.elementId }, end: { id: node.elementId }, type: 'MANAGES' })
        }
        if (node.labels?.includes('Skill')) {
          relationships.push({ start: { id: center.elementId }, end: { id: node.elementId }, type: 'HAS_SKILL' })
        }
      }

      return {
        center: formatNode(center),
        nodes: nodes.map(formatNode).filter(Boolean),
        relationships,
      }
    },
  },
  getEmployeeNetwork: {
    cypher: `
      MATCH (e:Employee { employee_id: $employee_id })
      OPTIONAL MATCH (e)-[:REPORTS_TO]->(manager:Employee)
      OPTIONAL MATCH (direct:Employee)-[:REPORTS_TO]->(e)
      OPTIONAL MATCH (e)-[:HAS_SKILL]->(skill:Skill)
      OPTIONAL MATCH (colleague:Employee { department: e.department })
      WHERE colleague <> e
      WITH e,
           manager,
           collect(DISTINCT direct)[..20] AS directs,
           collect(DISTINCT skill)[..20] AS skills,
           collect(DISTINCT colleague)[..20] AS colleagues
      RETURN {
        center: e,
        manager: manager,
        directs: directs,
        skills: skills,
        nodes: [e] + colleagues + directs + (CASE WHEN manager IS NULL THEN [] ELSE [manager] END) + skills
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data?.center) return { center: undefined, nodes: [], relationships: [] }

      const center = data.center
      const manager = data.manager
      const directs = data.directs || []
      const skills = data.skills || []
      const nodes = (data.nodes || []).filter(Boolean)
      const relationships: Array<{ start: { id: string }; end: { id: string }; type: string }> = []

      if (manager) {
        relationships.push({ start: { id: center.elementId }, end: { id: manager.elementId }, type: 'REPORTS_TO' })
      }
      for (const direct of directs) {
        relationships.push({ start: { id: direct.elementId }, end: { id: center.elementId }, type: 'REPORTS_TO' })
      }
      for (const skill of skills) {
        relationships.push({ start: { id: center.elementId }, end: { id: skill.elementId }, type: 'HAS_SKILL' })
      }

      return {
        center: formatNode(center),
        nodes: nodes.map(formatNode).filter(Boolean),
        relationships,
      }
    },
  },
  getDepartmentSubgraph: {
    cypher: `
      MATCH (e:Employee { department: $department })
      WITH collect(e)[..100] AS employees
      UNWIND employees AS emp
      OPTIONAL MATCH (emp)-[:REPORTS_TO]-(other:Employee)
      WHERE other IN employees
      WITH employees, collect(DISTINCT {start: emp, end: other, type: 'REPORTS_TO'}) AS reportRels
      UNWIND employees AS emp
      OPTIONAL MATCH (emp)-[:HAS_SKILL]->(s:Skill)
      WITH employees, reportRels, collect(DISTINCT s) AS skills,
           collect(DISTINCT {start: emp, end: s, type: 'HAS_SKILL'}) AS skillRels
      RETURN {
        center: employees[0],
        nodes: employees + skills,
        relationships: reportRels + skillRels
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data?.center) return { center: undefined, nodes: [], relationships: [] }

      return {
        center: formatNode(data.center),
        nodes: (data.nodes || []).map(formatNode).filter(Boolean),
        relationships: (data.relationships || [])
          .filter((relationship: any) => relationship?.start && relationship?.end)
          .map((relationship: any) => ({
            start: { id: relationship.start.elementId },
            end: { id: relationship.end.elementId },
            type: relationship.type,
          })),
      }
    },
  },
  getSkillSubgraph: {
    cypher: `
      MATCH (s:Skill { name: $skillName })
      MATCH (e:Employee)-[:HAS_SKILL]->(s)
      WITH s, collect(e)[..100] AS employees
      UNWIND employees AS emp
      OPTIONAL MATCH (emp)-[:REPORTS_TO]-(other:Employee)
      WHERE other IN employees
      WITH s, employees, collect(DISTINCT {start: emp, end: other, type: 'REPORTS_TO'}) AS reportRels
      RETURN {
        center: s,
        nodes: [s] + employees,
        relationships: reportRels
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data?.center) return { center: undefined, nodes: [], relationships: [] }

      return {
        center: formatNode(data.center),
        nodes: (data.nodes || []).map(formatNode).filter(Boolean),
        relationships: (data.relationships || [])
          .filter((relationship: any) => relationship?.start && relationship?.end)
          .map((relationship: any) => ({
            start: { id: relationship.start.elementId },
            end: { id: relationship.end.elementId },
            type: relationship.type,
          })),
      }
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query = body?.query
    const variables = body?.variables ?? {}
    const operationName = body?.operationName

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ errors: [{ message: 'Missing GraphQL query' }] }, { status: 400 })
    }

    const queryField = getPrimaryQueryField(query, operationName)
    const queryConfig = QUERY_MAP[queryField]

    if (!queryConfig) {
      return NextResponse.json({ errors: [{ message: `Unsupported query field: ${queryField}` }] }, { status: 400 })
    }

    const session = getSession()
    try {
      const result = await session.run(queryConfig.cypher, variables)
      const data: Record<string, unknown> = {
        [queryField]: queryConfig.transform(result),
      }
      return NextResponse.json({ data })
    } finally {
      await session.close()
    }
  } catch (error) {
    return NextResponse.json(
      { errors: [{ message: error instanceof Error ? error.message : 'Unknown GraphQL error' }] },
      { status: 500 },
    )
  }
}
