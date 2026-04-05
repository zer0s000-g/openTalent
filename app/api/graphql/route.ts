import { NextRequest, NextResponse } from 'next/server'
import { getDriver, getSession } from '@/lib/neo4j'
import neo4j from 'neo4j-driver'

/**
 * GraphQL API Route with direct Cypher query execution
 * This avoids the @neo4j/graphql execute() compatibility issue with Next.js
 */

// Query registry - maps GraphQL operations to Cypher queries
const QUERY_MAP: Record<string, { cypher: string; transform: (r: any) => any }> = {
  // Dashboard stats (combined query)
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
    transform: (result: any) => {
      const data = result.records[0]?.get('result')
      return data || { employeesAggregate: { count: 0 }, skillsAggregate: { count: 0 } }
    },
  },

  // Dashboard queries
  employeesAggregate: {
    cypher: 'MATCH (e:Employee) RETURN count(e) AS count',
    transform: (result: any) => ({ count: result.records[0]?.get('count')?.low || 0 }),
  },
  skillsAggregate: {
    cypher: 'MATCH (s:Skill) RETURN count(s) AS count',
    transform: (result: any) => ({ count: result.records[0]?.get('count')?.low || 0 }),
  },
  departments: {
    cypher: 'MATCH (e:Employee) WHERE e.department IS NOT NULL RETURN e.department AS department, count(e) AS count ORDER BY count DESC',
    transform: (result: any) => result.records.map((r: any) => ({
      name: r.get('department'),
      count: r.get('count').low,
    })),
  },

  // Employee queries
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
    transform: (result: any) => {
      const record = result.records[0]
      if (!record) return []

      const employee = record.get('e')
      const manager = record.get('manager')
      const directReports = record.get('directReports')
      const skills = record.get('skills')
      const certifications = record.get('certifications')
      const education = record.get('education')
      const aspirations = record.get('aspirations')

      return [{
        employee_id: employee.properties.employee_id,
        name: employee.properties.name,
        email: employee.properties.email,
        title: employee.properties.title,
        department: employee.properties.department,
        location: employee.properties.location,
        hired_date: employee.properties.hired_date?.toString(),
        manager: manager ? {
          employee_id: manager.properties.employee_id,
          name: manager.properties.name,
          title: manager.properties.title,
        } : undefined,
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

  // Search employees
  searchEmployees: {
    cypher: `
      MATCH (e:Employee)
      WHERE e.name CONTAINS $query OR e.title CONTAINS $query OR e.department CONTAINS $query
      RETURN e
      LIMIT toInteger($limit)
    `,
    transform: (result: any) => result.records.map((r: any) => {
      const emp = r.get('e')
      return {
        employee_id: emp.properties.employee_id,
        name: emp.properties.name,
        title: emp.properties.title,
        department: emp.properties.department,
        email: emp.properties.email,
      }
    }),
  },

  // Skills
  skills: {
    cypher: `
      MATCH (s:Skill)
      OPTIONAL MATCH (e:Employee)-[:HAS_SKILL]->(s)
      RETURN s, count(DISTINCT e) AS employeeCount
      ORDER BY employeeCount DESC
    `,
    transform: (result: any) => result.records.map((r: any) => ({
      name: r.get('s').properties.name,
      employeeCount: r.get('employeeCount').low,
    })),
  },

  getEmployeesBySkill: {
    cypher: `
      MATCH (e:Employee)-[:HAS_SKILL]->(s:Skill { name: $skillName })
      RETURN e
      LIMIT toInteger($limit)
    `,
    transform: (result: any) => result.records.map((r: any) => {
      const emp = r.get('e')
      return {
        employee_id: emp.properties.employee_id,
        name: emp.properties.name,
        title: emp.properties.title,
        department: emp.properties.department,
      }
    }),
  },

  // Network queries
  getOrganizationOverview: {
    cypher: `
      // Get top-level employees (no manager) - executives
      MATCH (exec:Employee)
      WHERE NOT (exec)-[:REPORTS_TO]->()

      // Get their direct reports
      OPTIONAL MATCH (exec)<-[:REPORTS_TO]-(direct:Employee)

      // Get some skills for executives
      OPTIONAL MATCH (exec)-[:HAS_SKILL]->(execSkill:Skill)

      WITH exec,
           collect(DISTINCT direct)[..15] AS directs,
           collect(DISTINCT execSkill)[..10] AS execSkills,
           size(collect(DISTINCT direct)) AS reportCount

      // Order by number of direct reports and take the executive with the most
      ORDER BY reportCount DESC
      LIMIT 1

      // Build the result with all nodes
      RETURN {
        center: exec,
        nodes: [exec] + directs + execSkills,
        relationships: []
      } AS result
    `,
    transform: (result: any) => {
      const record = result.records[0]
      if (!record) return { center: undefined, nodes: [], relationships: [] }

      const data = record.get('result')
      if (!data) return { center: undefined, nodes: [], relationships: [] }

      // Build relationships from the data
      const center = data.center
      const nodes = (data.nodes || []).filter((n: any) => n !== null)
      const relationships: any[] = []

      // Add MANAGES relationships for direct reports
      nodes.forEach((node: any) => {
        if (node.labels?.includes('Employee') && node.properties.employee_id !== center.properties.employee_id) {
          relationships.push({
            start: { id: center.elementId, properties: center.properties },
            end: { id: node.elementId, properties: node.properties },
            type: 'MANAGES',
          })
        }
        // Add HAS_SKILL relationships for skills
        if (node.labels?.includes('Skill')) {
          relationships.push({
            start: { id: center.elementId, properties: center.properties },
            end: { id: node.elementId, properties: node.properties },
            type: 'HAS_SKILL',
          })
        }
      })

      return {
        center: center ? formatNode(center) : undefined,
        nodes: nodes.map(formatNode).filter((n: any) => n !== null),
        relationships: relationships.filter((r: any) => r.start && r.end),
      }
    },
  },

  getEmployeeNetwork: {
    cypher: `
      MATCH (e:Employee { employee_id: $employee_id })

      // Get direct reports
      OPTIONAL MATCH (e)<-[:REPORTS_TO]-(direct:Employee)

      // Get manager
      OPTIONAL MATCH (e)-[:REPORTS_TO]->(manager:Employee)

      // Get skills
      OPTIONAL MATCH (e)-[:HAS_SKILL]->(skill:Skill)

      // Get department colleagues (limited)
      OPTIONAL MATCH (colleague:Employee { department: e.department })
      WHERE colleague <> e

      WITH e,
           collect(DISTINCT direct)[..20] AS directs,
           manager,
           collect(DISTINCT skill)[..20] AS skills,
           collect(DISTINCT colleague)[..20] AS colleagues

      // Combine all nodes
      WITH e, skills, directs + colleagues + (CASE WHEN manager IS NOT NULL THEN [manager] ELSE [] END) AS nodes

      RETURN {
        center: e,
        nodes: nodes + skills,
        relationships: []
      } AS result
    `,
    transform: (result: any) => {
      const record = result.records[0]
      if (!record) return { center: undefined, nodes: [], relationships: [] }

      const data = record.get('result')
      if (!data) return { center: undefined, nodes: [], relationships: [] }

      return {
        center: data.center ? formatNode(data.center) : undefined,
        nodes: (data.nodes || []).map(formatNode).filter((n: any) => n !== null),
        relationships: data.relationships || [],
      }
    },
  },

  getDepartmentSubgraph: {
    cypher: `
      MATCH (e:Employee { department: $department })
      WITH collect(e)[..100] AS employees

      UNWIND employees AS emp
      OPTIONAL MATCH (emp)-[r:REPORTS_TO]-(other)
      WHERE other IN employees

      WITH employees, collect(DISTINCT r) AS reportRels

      UNWIND employees AS emp
      OPTIONAL MATCH (emp)-[skillRel:HAS_SKILL]->(s)

      WITH employees, reportRels, collect(DISTINCT s) AS skills,
           [emp IN employees | [(emp)-[:HAS_SKILL]->(s) | {start: emp, end: s, type: 'HAS_SKILL'}]] AS skillRels

      RETURN {
        center: employees[0],
        nodes: employees + skills,
        relationships: reportRels + flatten(skillRels)
      } AS result
    `,
    transform: (result: any) => {
      const data = result.records[0]?.get('result')
      if (!data) return { center: undefined, nodes: [], relationships: [] }

      return {
        center: data.center ? formatNode(data.center) : undefined,
        nodes: (data.nodes || []).map(formatNode).filter((n: any) => n !== null),
        relationships: (data.relationships || [])
          .filter((r: any) => r !== null && r.start !== null && r.end !== null)
          .map((r: any) => ({
            start: { id: r.start.elementId, properties: r.start.properties },
            end: { id: r.end.elementId, properties: r.end.properties },
            type: r.type,
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
      OPTIONAL MATCH (emp)-[r:REPORTS_TO]-(other)
      WHERE other IN employees

      RETURN {
        center: s,
        nodes: [s] + employees,
        relationships: collect(DISTINCT r)
      } AS result
    `,
    transform: (result: any) => {
      const data = result.records[0]?.get('result')
      if (!data) return { center: undefined, nodes: [], relationships: [] }

      return {
        center: data.center ? formatNode(data.center) : undefined,
        nodes: (data.nodes || []).map(formatNode).filter((n: any) => n !== null),
        relationships: (data.relationships || [])
          .filter((r: any) => r !== null && r.start !== null && r.end !== null)
          .map((r: any) => ({
            start: { id: r.start.elementId, properties: r.start.properties },
            end: { id: r.end.elementId, properties: r.end.properties },
            type: r.type,
          })),
      }
    },
  },
}

function formatNode(node: any): { id: string; labels: string[]; properties: Record<string, any> } | null {
  if (!node) return null
  return {
    id: node.elementId,
    labels: node.labels,
    properties: node.properties,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { query, variables = {}, operationName } = body

    // Parse the query to find the operation name
    let opName = operationName
    if (!opName) {
      const operationMatch = query.match(/(query|mutation)\s+(\w+)/)
      opName = operationMatch ? operationMatch[2] : null
    }

    // Handle anonymous queries - try to find the first field being queried
    if (!opName) {
      const fieldMatch = query.match(/\{\s*(\w+)/)
      opName = fieldMatch ? fieldMatch[1] : null
    }

    if (!opName) {
      return NextResponse.json({ errors: [{ message: 'Could not determine operation name' }] }, { status: 400 })
    }

    // Extract inline arguments from the query field
    // e.g., { searchEmployees(query: "Susan", limit: 5) }
    const fieldArgsMatch = query.match(/\{\s*(\w+)\s*\(([^)]+)\)/)
    if (fieldArgsMatch) {
      const argsString = fieldArgsMatch[2]
      // Parse key: value pairs
      const argPairs = argsString.split(',')
      for (const pair of argPairs) {
        const parts = pair.split(':').map((s: string) => s.trim())
        const key = parts[0]
        let value = parts.slice(1).join(':') // Handle colons in values
        if (key && value !== undefined) {
          // Remove quotes from string values
          const cleanValue = value.replace(/^"|"$/g, '')
          // Convert numeric values
          variables[key] = /^\d+$/.test(cleanValue) ? parseInt(cleanValue, 10) : cleanValue
        }
      }
    }

    // Normalize operation name to lowercase first letter for matching
    const normalizedOpName = opName.charAt(0).toLowerCase() + opName.slice(1)

    const queryConfig = QUERY_MAP[normalizedOpName]
    if (!queryConfig) {
      return NextResponse.json({ errors: [{ message: `Unknown operation: ${opName}` }] }, { status: 400 })
    }

    const session = getSession()

    try {
      const result = await session.run(queryConfig.cypher, variables)
      const data = queryConfig.transform(result)

      // Wrap data in the expected GraphQL shape
      const response: Record<string, any> = {}
      response[normalizedOpName] = data

      return NextResponse.json({ data: response })
    } finally {
      await session.close()
    }
  } catch (error) {
    console.error('GraphQL Error:', error)
    return NextResponse.json(
      { errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }] },
      { status: 500 }
    )
  }
}
