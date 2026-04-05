import { parse, Kind, type OperationDefinitionNode, type FieldNode } from 'graphql'
import { NextRequest, NextResponse } from 'next/server'
import type { QueryResult } from 'neo4j-driver'
import { getSession } from '@/lib/neo4j'
import { getIndonesiaCity } from '@/lib/indonesia-cities'

type ApiQueryConfig = {
  cypher: string
  transform: (result: QueryResult, variables?: Record<string, unknown>) => unknown
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

function getPrimaryQueryField(query: string, operationName?: string): string {
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
      CALL {
        MATCH (e:Employee)
        RETURN count(e) AS employeeCount
      }
      CALL {
        MATCH (s:Skill)
        RETURN count(s) AS skillCount
      }
      CALL {
        MATCH (e:Employee)
        WHERE coalesce(e.department, '') <> ''
        WITH e.department AS department, count(*) AS count
        ORDER BY count DESC
        RETURN collect({ name: department, count: count }) AS departments
      }
      CALL {
        MATCH (e:Employee)
        WHERE coalesce(e.location, '') <> ''
        WITH e.location AS location, count(*) AS count
        ORDER BY count DESC
        RETURN collect({ name: location, count: count }) AS locations
      }
      CALL {
        MATCH (s:Skill)<-[:HAS_SKILL]-(e:Employee)
        WITH s.name AS skill, count(DISTINCT e) AS count
        ORDER BY count DESC
        RETURN collect({ name: skill, count: count }) AS topSkills
      }
      CALL {
        MATCH (manager:Employee)<-[:REPORTS_TO]-(report:Employee)
        WITH manager, count(report) AS reportCount
        RETURN count(manager) AS managerCount, avg(toFloat(reportCount)) AS avgSpanOfControl
      }
      CALL {
        MATCH (e:Employee)
        OPTIONAL MATCH (e)-[:HAS_SKILL]->(s:Skill)
        WITH e, count(s) AS skillCount
        RETURN avg(toFloat(skillCount)) AS avgSkillsPerEmployee
      }
      RETURN {
        employeesAggregate: { count: employeeCount },
        skillsAggregate: { count: skillCount }
        ,departments: departments
        ,locations: locations
        ,topSkills: topSkills
        ,managerCount: managerCount
        ,avgSpanOfControl: avgSpanOfControl
        ,avgSkillsPerEmployee: avgSkillsPerEmployee
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
      WITH e
      ORDER BY e.name ASC
      RETURN e
      LIMIT 50
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
  getLocationRoleOptions: {
    cypher: `
      MATCH (e:Employee)
      WHERE coalesce(e.title, '') <> ''
      WITH e.title AS title, count(*) AS count
      ORDER BY count DESC, title ASC
      RETURN collect({ name: title, count: count })[..24] AS result
    `,
    transform: (result) =>
      (result.records[0]?.get('result') || []).map((item: any) => ({
        name: item.name,
        count: neo4jIntToNumber(item.count),
      })),
  },
  getIndonesiaLocationFootprint: {
    cypher: `
      MATCH (e:Employee)
      WHERE coalesce(e.location, '') <> ''
        AND ($department IS NULL OR $department = '' OR e.department = $department)
        AND ($roleTitle IS NULL OR $roleTitle = '' OR e.title = $roleTitle)
        AND (
          $skillName IS NULL OR $skillName = '' OR EXISTS {
            MATCH (e)-[:HAS_SKILL]->(:Skill { name: $skillName })
          }
        )
      WITH e.location AS city, collect(DISTINCT e) AS employees
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.department AS department, count(*) AS count
        WHERE department IS NOT NULL AND trim(department) <> ''
        WITH department, count
        ORDER BY count DESC, department ASC
        RETURN collect({ name: department, count: count })[..3] AS departments
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.title AS roleTitle, count(*) AS count
        WHERE roleTitle IS NOT NULL AND trim(roleTitle) <> ''
        WITH roleTitle, count
        ORDER BY count DESC, roleTitle ASC
        RETURN collect({ name: roleTitle, count: count })[..3] AS roles
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        MATCH (employee)-[:HAS_SKILL]->(skill:Skill)
        WITH skill.name AS skillName, count(DISTINCT employee) AS count
        WITH skillName, count
        ORDER BY count DESC, skillName ASC
        RETURN collect({ name: skillName, count: count })[..3] AS topSkills
      }
      RETURN collect({
        city: city,
        employeeCount: size(employees),
        departments: departments,
        roles: roles,
        topSkills: topSkills
      }) AS result
    `,
    transform: (result) =>
      (result.records[0]?.get('result') || [])
        .map((item: any) => {
          const city = getIndonesiaCity(item.city)
          if (!city) return null

          return {
            city: city.name,
            province: city.province,
            lat: city.lat,
            lng: city.lng,
            employeeCount: neo4jIntToNumber(item.employeeCount),
            departments: (item.departments || []).map((department: any) => ({
              name: department.name,
              count: neo4jIntToNumber(department.count),
            })),
            roles: (item.roles || []).map((role: any) => ({
              name: role.name,
              count: neo4jIntToNumber(role.count),
            })),
            topSkills: (item.topSkills || []).map((skill: any) => ({
              name: skill.name,
              count: neo4jIntToNumber(skill.count),
            })),
          }
        })
        .filter(Boolean)
        .sort((left: any, right: any) => right.employeeCount - left.employeeCount || left.city.localeCompare(right.city)),
  },
  getLocationDetail: {
    cypher: `
      MATCH (e:Employee)
      WHERE e.location = $cityName
        AND ($department IS NULL OR $department = '' OR e.department = $department)
        AND ($roleTitle IS NULL OR $roleTitle = '' OR e.title = $roleTitle)
        AND (
          $skillName IS NULL OR $skillName = '' OR EXISTS {
            MATCH (e)-[:HAS_SKILL]->(:Skill { name: $skillName })
          }
        )
      WITH collect(DISTINCT e) AS employees
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.department AS department, count(*) AS count
        WHERE department IS NOT NULL AND trim(department) <> ''
        WITH department, count
        ORDER BY count DESC, department ASC
        RETURN collect({ name: department, count: count })[..6] AS departments
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        WITH employee.title AS roleTitle, count(*) AS count
        WHERE roleTitle IS NOT NULL AND trim(roleTitle) <> ''
        WITH roleTitle, count
        ORDER BY count DESC, roleTitle ASC
        RETURN collect({ name: roleTitle, count: count })[..6] AS roles
      }
      CALL {
        WITH employees
        UNWIND employees AS employee
        MATCH (employee)-[:HAS_SKILL]->(skill:Skill)
        WITH skill.name AS skillName, count(DISTINCT employee) AS count
        WITH skillName, count
        ORDER BY count DESC, skillName ASC
        RETURN collect({ name: skillName, count: count })[..8] AS topSkills
      }
      RETURN {
        employees: [employee IN employees | {
          employee_id: employee.employee_id,
          name: employee.name,
          title: employee.title,
          department: employee.department,
          location: employee.location
        }][..40],
        employeeCount: size(employees),
        departments: departments,
        roles: roles,
        topSkills: topSkills
      } AS result
    `,
    transform: (result, variables?: Record<string, unknown>) => {
      const cityName = typeof variables?.cityName === 'string' ? variables.cityName : ''
      const city = cityName ? getIndonesiaCity(cityName) : undefined
      const data = result.records[0]?.get('result')

      if (!data) {
        return {
          city: cityName,
          province: city?.province || '',
          lat: city?.lat ?? null,
          lng: city?.lng ?? null,
          employeeCount: 0,
          departments: [],
          roles: [],
          topSkills: [],
          employees: [],
        }
      }

      return {
        city: cityName,
        province: city?.province || '',
        lat: city?.lat ?? null,
        lng: city?.lng ?? null,
        employeeCount: neo4jIntToNumber(data.employeeCount),
        departments: (data.departments || []).map((department: any) => ({
          name: department.name,
          count: neo4jIntToNumber(department.count),
        })),
        roles: (data.roles || []).map((role: any) => ({
          name: role.name,
          count: neo4jIntToNumber(role.count),
        })),
        topSkills: (data.topSkills || []).map((skill: any) => ({
          name: skill.name,
          count: neo4jIntToNumber(skill.count),
        })),
        employees: (data.employees || []).map((employee: any) => ({
          employee_id: employee.employee_id,
          name: employee.name,
          title: employee.title,
          department: employee.department,
          location: employee.location,
        })),
      }
    },
  },
  unifiedSearch: {
    cypher: `
      WITH toLower(trim($query)) AS q
      CALL {
        WITH q
        MATCH (e:Employee)
        WHERE q <> ''
          AND (
            toLower(coalesce(e.employee_id, '')) CONTAINS q
            OR toLower(coalesce(e.name, '')) CONTAINS q
            OR toLower(coalesce(e.title, '')) CONTAINS q
            OR toLower(coalesce(e.department, '')) CONTAINS q
          )
        WITH e, q,
          CASE
            WHEN toLower(coalesce(e.employee_id, '')) = q THEN 520
            WHEN toLower(coalesce(e.name, '')) = q THEN 500
            WHEN toLower(coalesce(e.employee_id, '')) STARTS WITH q THEN 470
            WHEN toLower(coalesce(e.name, '')) STARTS WITH q THEN 450
            WHEN toLower(coalesce(e.title, '')) STARTS WITH q THEN 330
            WHEN toLower(coalesce(e.department, '')) STARTS WITH q THEN 300
            ELSE 220
          END AS score
        ORDER BY score DESC, e.name ASC
        RETURN collect({
          type: 'employee',
          key: e.employee_id,
          title: e.name,
          subtitle: coalesce(e.title, 'Employee'),
          meta: coalesce(e.department, ''),
          employee_id: e.employee_id,
          score: score
        })[..6] AS employees
      }
      CALL {
        WITH q
        MATCH (s:Skill)
        OPTIONAL MATCH (holder:Employee)-[:HAS_SKILL]->(s)
        WITH s, q, count(DISTINCT holder) AS employeeCount
        WHERE q <> '' AND toLower(coalesce(s.name, '')) CONTAINS q
        WITH s, employeeCount, q,
          CASE
            WHEN toLower(coalesce(s.name, '')) = q THEN 440
            WHEN toLower(coalesce(s.name, '')) STARTS WITH q THEN 400
            ELSE 240
          END AS score
        ORDER BY score DESC, employeeCount DESC, s.name ASC
        RETURN collect({
          type: 'skill',
          key: s.name,
          title: s.name,
          subtitle: 'Skill',
          meta: toString(employeeCount) + ' employees',
          skillName: s.name,
          score: score
        })[..6] AS skills
      }
      CALL {
        WITH q
        MATCH (e:Employee)
        WHERE coalesce(e.department, '') <> ''
        WITH e.department AS department, count(*) AS employeeCount, q
        WHERE q <> '' AND toLower(department) CONTAINS q
        WITH department, employeeCount, q,
          CASE
            WHEN toLower(department) = q THEN 420
            WHEN toLower(department) STARTS WITH q THEN 380
            ELSE 230
          END AS score
        ORDER BY score DESC, employeeCount DESC, department ASC
        RETURN collect({
          type: 'department',
          key: department,
          title: department,
          subtitle: 'Department',
          meta: toString(employeeCount) + ' employees',
          department: department,
          score: score
        })[..6] AS departments
      }
      RETURN employees + skills + departments AS results
    `,
    transform: (result) =>
      (result.records[0]?.get('results') || [])
        .map((item: any) => ({
          type: item.type,
          key: item.key,
          title: item.title,
          subtitle: item.subtitle,
          meta: item.meta,
          employee_id: item.employee_id,
          skillName: item.skillName,
          department: item.department,
          score: neo4jIntToNumber(item.score),
        }))
        .sort((left: any, right: any) => right.score - left.score || String(left.title).localeCompare(String(right.title))),
  },
  getEnterpriseGraphOverview: {
    cypher: `
      MATCH (employee:Employee)
      WITH collect(DISTINCT employee) AS employees
      CALL {
        MATCH (department:Department)
        RETURN collect(DISTINCT department) AS departments
      }
      CALL {
        WITH employees
        MATCH (manager:Employee)
        WHERE NOT (manager)-[:REPORTS_TO]->()
        AND manager IN employees
        RETURN manager
        ORDER BY manager.name ASC
        LIMIT 1
      }
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:REPORTS_TO]->(manager:Employee)
        WHERE manager IN employees
        RETURN collect(DISTINCT { start: emp, end: manager, type: 'REPORTS_TO' }) AS reportRels
      }
      CALL {
        WITH employees, departments
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:BELONGS_TO_DEPARTMENT]->(department:Department)
        WHERE department IN departments
        RETURN collect(DISTINCT { start: emp, end: department, type: 'BELONGS_TO_DEPARTMENT' }) AS departmentRels
      }
      CALL {
        WITH employees
        UNWIND employees AS emp
        MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WITH skill, count(DISTINCT emp) AS holderCount
        WHERE holderCount >= 10
        WITH skill, holderCount
        ORDER BY holderCount DESC, skill.name ASC
        RETURN collect(skill)[..16] AS curatedSkills
      }
      CALL {
        WITH employees, curatedSkills
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WHERE skill IN curatedSkills
        RETURN collect(DISTINCT { start: emp, end: skill, type: 'HAS_SKILL' }) AS skillRels
      }
      RETURN {
        center: manager,
        nodes: employees + departments + curatedSkills,
        relationships: reportRels + departmentRels + skillRels
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data?.nodes) return { center: undefined, nodes: [], relationships: [] }

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
          relationships.push({ start: { id: node.elementId }, end: { id: center.elementId }, type: 'REPORTS_TO' })
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
      OPTIONAL MATCH (peer:Employee)-[:REPORTS_TO]->(manager)
      WHERE manager IS NOT NULL AND peer <> e
      WITH e,
           manager,
           collect(DISTINCT direct)[..12] AS directs,
           collect(DISTINCT skill)[..12] AS skills,
           collect(DISTINCT peer)[..12] AS peers
      RETURN {
        center: e,
        manager: manager,
        directs: directs,
        skills: skills,
        peers: peers,
        nodes: [e] + directs + peers + (CASE WHEN manager IS NULL THEN [] ELSE [manager] END) + skills
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data?.center) return { center: undefined, nodes: [], relationships: [] }

      const center = data.center
      const manager = data.manager
      const directs = data.directs || []
      const skills = data.skills || []
      const peers = data.peers || []
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
      for (const peer of peers) {
        if (manager) {
          relationships.push({ start: { id: peer.elementId }, end: { id: manager.elementId }, type: 'REPORTS_TO' })
        }
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
      MATCH (d:Department { name: $department })
      OPTIONAL MATCH (employee:Employee)-[:BELONGS_TO_DEPARTMENT]->(d)
      WITH d, collect(DISTINCT employee)[..100] AS employees
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:REPORTS_TO]->(manager:Employee)
        WHERE manager IN employees
        RETURN collect(DISTINCT { start: emp, end: manager, type: 'REPORTS_TO' }) AS reportRels
      }
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WITH skill, count(DISTINCT emp) AS employeeCount
        WHERE skill IS NOT NULL
        WITH skill, employeeCount
        ORDER BY employeeCount DESC, skill.name ASC
        RETURN collect(skill)[..12] AS topSkills
      }
      CALL {
        WITH employees, topSkills
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(skill:Skill)
        WHERE skill IN topSkills
        RETURN collect(DISTINCT { start: emp, end: skill, type: 'HAS_SKILL' }) AS skillRels
      }
      WITH d,
           employees,
           topSkills,
           reportRels,
           skillRels,
           [emp IN employees | { start: emp, end: d, type: 'BELONGS_TO_DEPARTMENT' }] AS departmentRels
      RETURN {
        center: d,
        nodes: [d] + employees + topSkills,
        relationships: departmentRels + reportRels + skillRels
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
      MATCH (e:Employee)-[holder:HAS_SKILL]->(s)
      WITH s, e, holder
      ORDER BY coalesce(holder.yearsOfExperience, 0) DESC, e.name ASC
      WITH s, collect(DISTINCT e)[..80] AS employees
      CALL {
        WITH employees
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:REPORTS_TO]->(manager:Employee)
        WHERE manager IN employees
        RETURN collect(DISTINCT { start: emp, end: manager, type: 'REPORTS_TO' }) AS reportRels
      }
      CALL {
        WITH employees, s
        UNWIND employees AS emp
        MATCH (emp)-[:HAS_SKILL]->(related:Skill)
        WHERE related <> s
        WITH related, count(DISTINCT emp) AS employeeCount
        ORDER BY employeeCount DESC, related.name ASC
        RETURN collect(related)[..12] AS relatedSkills
      }
      CALL {
        WITH employees, relatedSkills
        UNWIND employees AS emp
        OPTIONAL MATCH (emp)-[:HAS_SKILL]->(related:Skill)
        WHERE related IN relatedSkills
        RETURN collect(DISTINCT { start: emp, end: related, type: 'HAS_SKILL' }) AS relatedSkillRels
      }
      WITH s,
           employees,
           reportRels,
           relatedSkills,
           relatedSkillRels,
           [emp IN employees | { start: emp, end: s, type: 'HAS_SKILL' }] AS skillRels
      RETURN {
        center: s,
        nodes: [s] + employees + relatedSkills,
        relationships: reportRels + skillRels + relatedSkillRels
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
  getSkillInsight: {
    cypher: `
      MATCH (s:Skill { name: $skillName })
      CALL {
        WITH s
        MATCH (employee:Employee)-[rel:HAS_SKILL]->(s)
        RETURN count(DISTINCT employee) AS employeeCount
      }
      CALL {
        WITH s
        MATCH (employee:Employee)-[:HAS_SKILL]->(s)
        WITH employee.department AS department, count(DISTINCT employee) AS count
        WHERE department IS NOT NULL AND trim(department) <> ''
        WITH department, count
        ORDER BY count DESC, department ASC
        RETURN collect({ name: department, count: count })[..6] AS departments
      }
      CALL {
        WITH s
        MATCH (employee:Employee)-[rel:HAS_SKILL]->(s)
        WITH employee, rel
        ORDER BY coalesce(rel.yearsOfExperience, 0) DESC, employee.name ASC
        RETURN collect({
          employee_id: employee.employee_id,
          name: employee.name,
          title: employee.title,
          department: employee.department,
          proficiencyLevel: rel.proficiencyLevel,
          yearsOfExperience: rel.yearsOfExperience
        })[..8] AS topEmployees
      }
      CALL {
        WITH s
        MATCH (employee:Employee)-[:HAS_SKILL]->(s)
        MATCH (employee)-[:HAS_SKILL]->(related:Skill)
        WHERE related <> s
        WITH related.name AS name, count(DISTINCT employee) AS count
        ORDER BY count DESC, name ASC
        RETURN collect({ name: name, count: count })[..8] AS relatedSkills
      }
      RETURN {
        name: s.name,
        category: s.category,
        employeeCount: employeeCount,
        departments: departments,
        topEmployees: topEmployees,
        relatedSkills: relatedSkills
      } AS result
    `,
    transform: (result) => {
      const data = result.records[0]?.get('result')
      if (!data) {
        return {
          name: '',
          category: undefined,
          employeeCount: 0,
          departments: [],
          topEmployees: [],
          relatedSkills: [],
        }
      }

      return {
        name: data.name,
        category: data.category,
        employeeCount: neo4jIntToNumber(data.employeeCount),
        departments: (data.departments || []).map((department: any) => ({
          name: department.name,
          count: neo4jIntToNumber(department.count),
        })),
        topEmployees: (data.topEmployees || []).map((employee: any) => ({
          employee_id: employee.employee_id,
          name: employee.name,
          title: employee.title,
          department: employee.department,
          proficiencyLevel: employee.proficiencyLevel,
          yearsOfExperience: typeof employee.yearsOfExperience === 'number'
            ? employee.yearsOfExperience
            : Number(employee.yearsOfExperience ?? 0),
        })),
        relatedSkills: (data.relatedSkills || []).map((skill: any) => ({
          name: skill.name,
          count: neo4jIntToNumber(skill.count),
        })),
      }
    },
  },
}

function getQueryVariables(queryField: string, rawVariables: Record<string, unknown>): Record<string, unknown> {
  if (queryField === 'getIndonesiaLocationFootprint' || queryField === 'getLocationDetail') {
    return {
      skillName: '',
      department: '',
      roleTitle: '',
      ...rawVariables,
    }
  }

  return rawVariables
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
    const queryVariables = getQueryVariables(queryField, variables)

    if (!queryConfig) {
      return NextResponse.json({ errors: [{ message: `Unsupported query field: ${queryField}` }] }, { status: 400 })
    }

    const session = getSession()
    try {
      const result = await session.run(queryConfig.cypher, queryVariables)
      const data: Record<string, unknown> = {
        [queryField]: queryConfig.transform(result, queryVariables),
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
