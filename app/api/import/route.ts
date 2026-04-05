import { NextRequest, NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'
import Papa from 'papaparse'

interface ImportResult {
  totalRows: number
  successful: number
  failed: number
  errors: Array<{ row: number; employee_id?: string; error: string }>
}

interface CSVRow {
  employee_id: string
  name: string
  email?: string
  title?: string
  department?: string
  location?: string
  hired_date?: string
  manager_id?: string
  skills?: string
  certifications?: string
  education_institution?: string
  education_degree?: string
  education_field?: string
  aspiration_type?: string
  aspiration_target_role?: string
  aspiration_target_department?: string
  aspiration_timeline?: string
}

function parseSkills(skillsStr?: string): string[] {
  if (!skillsStr || skillsStr.trim() === '') return []
  return skillsStr
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function parseCertifications(certStr?: string): string[] {
  if (!certStr || certStr.trim() === '') return []
  return certStr
    .split(';')
    .map(c => c.trim())
    .filter(c => c.length > 0)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csv } = body

    if (!csv) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
    }

    const uri = process.env.NEO4J_URI ?? 'bolt://localhost:7687'
    const username = process.env.NEO4J_USERNAME ?? 'neo4j'
    const password = process.env.NEO4J_PASSWORD ?? 'password'

    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

    const result: ImportResult = {
      totalRows: 0,
      successful: 0,
      failed: 0,
      errors: [],
    }

    try {
      await driver.verifyConnectivity()
      const session = driver.session()

      // Parse CSV
      const parseResult = Papa.parse<CSVRow>(csv, {
        header: true,
        skipEmptyLines: true,
      })

      result.totalRows = parseResult.data.length

      // Process each row
      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i]
        const rowNum = i + 2

        try {
          if (!row.employee_id || !row.name) {
            result.errors.push({
              row: rowNum,
              error: 'Missing required fields: employee_id and name are required',
            })
            result.failed++
            continue
          }

          const {
            employee_id,
            name,
            email,
            title,
            department,
            location,
            hired_date,
            manager_id,
            skills,
            certifications,
            education_institution,
            education_degree,
            education_field,
            aspiration_type,
            aspiration_target_role,
            aspiration_target_department,
            aspiration_timeline,
          } = row

          // Create or update employee
          await session.run(
            `
            MERGE (e:Employee { employee_id: $employee_id })
            SET e.name = $name
            SET e.email = $email
            SET e.title = $title
            SET e.department = $department
            SET e.location = $location
            SET e.hired_date = CASE WHEN $hired_date IS NOT NULL THEN date($hired_date) ELSE e.hired_date END
            `,
            { employee_id, name, email: email || null, title: title || null, department: department || null, location: location || null, hired_date: hired_date || null }
          )

          // Handle manager relationship
          if (manager_id) {
            await session.run(
              `
              MATCH (e:Employee { employee_id: $employee_id })
              OPTIONAL MATCH (e)-[old:REPORTS_TO]->()
              DELETE old
              MATCH (m:Employee { employee_id: $manager_id })
              CREATE (e)-[:REPORTS_TO]->(m)
              `,
              { employee_id, manager_id }
            )
          }

          // Add skills
          const skillList = parseSkills(skills)
          for (const skillName of skillList) {
            await session.run(
              `
              MATCH (e:Employee { employee_id: $employee_id })
              MERGE (s:Skill { name: $skillName })
              MERGE (e)-[:HAS_SKILL]->(s)
              `,
              { employee_id, skillName }
            )
          }

          // Add certifications
          const certList = parseCertifications(certifications)
          for (const certName of certList) {
            await session.run(
              `
              MATCH (e:Employee { employee_id: $employee_id })
              MERGE (c:Certification { name: $certName })
              MERGE (e)-[:HOLDS_CERTIFICATION]->(c)
              `,
              { employee_id, certName }
            )
          }

          // Add education
          if (education_institution) {
            await session.run(
              `
              MATCH (e:Employee { employee_id: $employee_id })
              MERGE (ed:Education {
                institution: $institution,
                degree: coalesce($degree, ''),
                field: coalesce($field, '')
              })
              MERGE (e)-[:HAS_EDUCATION]->(ed)
              `,
              { employee_id, institution: education_institution, degree: education_degree || null, field: education_field || null }
            )
          }

          // Add aspiration
          if (aspiration_type) {
            await session.run(
              `
              MATCH (e:Employee { employee_id: $employee_id })
              CREATE (a:Aspiration {
                type: $type,
                targetRole: $targetRole,
                targetDepartment: $targetDepartment,
                timeline: $timeline
              })
              CREATE (e)-[:ASPIRES_TO]->(a)
              `,
              {
                employee_id,
                type: aspiration_type,
                targetRole: aspiration_target_role || null,
                targetDepartment: aspiration_target_department || null,
                timeline: aspiration_timeline || null,
              }
            )
          }

          result.successful++
        } catch (err) {
          result.errors.push({
            row: rowNum,
            employee_id: row.employee_id,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
          result.failed++
        }
      }

      // Create indexes
      await session.run('CREATE INDEX employee_id_idx IF NOT EXISTS FOR (e:Employee) ON (e.employee_id)')
      await session.run('CREATE INDEX employee_name_idx IF NOT EXISTS FOR (e:Employee) ON (e.name)')
      await session.run('CREATE INDEX employee_department_idx IF NOT EXISTS FOR (e:Employee) ON (e.department)')
      await session.run('CREATE INDEX skill_name_idx IF NOT EXISTS FOR (s:Skill) ON (s.name)')

      await session.close()
    } finally {
      await driver.close()
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
