import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getRuntimeEnv } from '@/lib/env'
import { importEmployeesFromCsv } from '@/lib/importer'

dotenv.config({ path: '.env.local' })

const maybeDescribe = process.env.RUN_NEO4J_INTEGRATION === '1' ? describe : describe.skip

function neo4jIntToNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const candidate = value as { toNumber?: () => number; low?: number }
    if (typeof candidate.toNumber === 'function') return candidate.toNumber()
    if (typeof candidate.low === 'number') return candidate.low
  }
  return 0
}

maybeDescribe('importEmployeesFromCsv integration', () => {
  const env = getRuntimeEnv(process.env)
  const driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD))

  beforeAll(async () => {
    await driver.verifyConnectivity()
  })

  afterAll(async () => {
    await driver.close()
  })

  beforeEach(async () => {
    const session = driver.session({ database: env.NEO4J_DATABASE })
    try {
      await session.run('MATCH (n) DETACH DELETE n')
    } finally {
      await session.close()
    }
  })

  it('creates the canonical graph and reconciles repeat imports safely', async () => {
    const initialCsv = [
      'employee_id,name,email,title,department,location,hired_date,manager_id,skills,certifications,education_institution,education_degree,education_field,aspiration_type,aspiration_target_role,aspiration_target_department,aspiration_timeline',
      'EMP-001,Jane Doe,jane@airnav.co.id,Head of Ops,Operations,Jakarta,2021-01-01,,Leadership; Safety,ATC License,ITB,BSc,Aeronautics,Leadership,Director of Ops,Operations,12 months',
      'EMP-002,Adi Putra,adi@airnav.co.id,Data Analyst,Technology,Surabaya,2023-06-12,EMP-001,Python; SQL,Neo4j Associate,ITS,BSc,Computer Science,Technical,Lead Analyst,Technology,6 months',
    ].join('\n')

    const initialResult = await importEmployeesFromCsv(driver, initialCsv, {
      mode: 'apply',
      filename: 'initial.csv',
      actor: {
        email: 'admin@airnav.co.id',
        name: 'Admin',
        role: 'admin',
        source: 'development-bypass',
      },
    })

    expect(initialResult.applied).toBe(true)
    expect(initialResult.successful).toBe(2)
    expect(initialResult.errors).toHaveLength(0)

    const session = driver.session({ database: env.NEO4J_DATABASE })
    try {
      const graphResult = await session.run(
        `
          MATCH (employee:Employee { employee_id: 'EMP-002' })
          OPTIONAL MATCH (employee)-[:BELONGS_TO_DEPARTMENT]->(department:Department)
          OPTIONAL MATCH (employee)-[:HAS_ROLE]->(role:Role)
          OPTIONAL MATCH (employee)-[:REPORTS_TO]->(manager:Employee)
          OPTIONAL MATCH (employee)-[:HAS_SKILL]->(skill:Skill)
          OPTIONAL MATCH (employee)-[:HOLDS_CERTIFICATION]->(certification:Certification)
          OPTIONAL MATCH (employee)-[:HAS_EDUCATION]->(education:Education)
          OPTIONAL MATCH (employee)-[:ASPIRES_TO]->(aspiration:Aspiration)
          RETURN
            department.name AS department,
            role.title AS role,
            manager.employee_id AS managerId,
            collect(DISTINCT skill.name) AS skills,
            collect(DISTINCT certification.name) AS certifications,
            count(DISTINCT education) AS educationCount,
            count(DISTINCT aspiration) AS aspirationCount,
            employee.lastImportBatchId AS lastImportBatchId,
            employee.lastImportSource AS lastImportSource
        `,
      )

      const record = graphResult.records[0]
      expect(record.get('department')).toBe('Technology')
      expect(record.get('role')).toBe('Data Analyst')
      expect(record.get('managerId')).toBe('EMP-001')
      expect([...(record.get('skills') as string[])].sort()).toEqual(['Python', 'Sql'])
      expect([...(record.get('certifications') as string[])].sort()).toEqual(['Neo4j Associate'])
      expect(neo4jIntToNumber(record.get('educationCount'))).toBe(1)
      expect(neo4jIntToNumber(record.get('aspirationCount'))).toBe(1)
      expect(record.get('lastImportBatchId')).toBeTruthy()
      expect(record.get('lastImportSource')).toBe('initial.csv')

      const secondCsv = [
        'employee_id,name,email,title,department,location,hired_date,manager_id,skills,certifications,education_institution,education_degree,education_field,aspiration_type,aspiration_target_role,aspiration_target_department,aspiration_timeline',
        'EMP-002,Adi Putra,adi@airnav.co.id,Senior Data Analyst,Operations,Surabaya,2023-06-12,,Python,,,,,,,',
      ].join('\n')

      const secondResult = await importEmployeesFromCsv(driver, secondCsv, {
        mode: 'apply',
        filename: 'reconcile.csv',
        actor: {
          email: 'admin@airnav.co.id',
          name: 'Admin',
          role: 'admin',
          source: 'development-bypass',
        },
      })

      expect(secondResult.applied).toBe(true)
      expect(secondResult.successful).toBe(1)

      const reconciled = await session.run(
        `
          MATCH (employee:Employee { employee_id: 'EMP-002' })
          OPTIONAL MATCH (employee)-[:BELONGS_TO_DEPARTMENT]->(department:Department)
          OPTIONAL MATCH (employee)-[:HAS_ROLE]->(role:Role)
          OPTIONAL MATCH (employee)-[:REPORTS_TO]->(manager:Employee)
          OPTIONAL MATCH (employee)-[:HAS_SKILL]->(skill:Skill)
          OPTIONAL MATCH (employee)-[:HOLDS_CERTIFICATION]->(certification:Certification)
          OPTIONAL MATCH (employee)-[:HAS_EDUCATION]->(education:Education)
          OPTIONAL MATCH (employee)-[:ASPIRES_TO]->(aspiration:Aspiration)
          RETURN
            department.name AS department,
            role.title AS role,
            count(DISTINCT manager) AS managerCount,
            collect(DISTINCT skill.name) AS skills,
            collect(DISTINCT certification.name) AS certifications,
            count(DISTINCT education) AS educationCount,
            count(DISTINCT aspiration) AS aspirationCount,
            employee.lastImportSource AS lastImportSource
        `,
      )

      const reconciledRecord = reconciled.records[0]
      expect(reconciledRecord.get('department')).toBe('Operations')
      expect(reconciledRecord.get('role')).toBe('Senior Data Analyst')
      expect(neo4jIntToNumber(reconciledRecord.get('managerCount'))).toBe(0)
      expect([...(reconciledRecord.get('skills') as string[])].sort()).toEqual(['Python'])
      expect([...(reconciledRecord.get('certifications') as string[])].sort()).toEqual([])
      expect(neo4jIntToNumber(reconciledRecord.get('educationCount'))).toBe(0)
      expect(neo4jIntToNumber(reconciledRecord.get('aspirationCount'))).toBe(0)
      expect(reconciledRecord.get('lastImportSource')).toBe('reconcile.csv')
    } finally {
      await session.close()
    }
  })
})
