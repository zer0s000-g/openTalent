import type { Driver } from 'neo4j-driver'
import Papa from 'papaparse'
import { CsvEmployeeRowSchema } from '@/lib/validation'
import { parseDelimitedList } from '@/lib/normalization'

export interface ImportResult {
  totalRows: number
  successful: number
  failed: number
  errors: Array<{ row: number; employee_id?: string; error: string }>
}

export async function importEmployeesFromCsv(driver: Driver, csv: string): Promise<ImportResult> {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  })

  const result: ImportResult = {
    totalRows: parsed.data.length,
    successful: 0,
    failed: 0,
    errors: [],
  }

  const session = driver.session()
  try {
    for (let index = 0; index < parsed.data.length; index++) {
      const rowNumber = index + 2
      const rawRow = parsed.data[index]
      const validated = CsvEmployeeRowSchema.safeParse(rawRow)

      if (!validated.success) {
        result.failed += 1
        result.errors.push({
          row: rowNumber,
          employee_id: rawRow.employee_id,
          error: validated.error.issues.map((issue) => issue.message).join('; '),
        })
        continue
      }

      const row = validated.data

      try {
        await session.run(
          `
            MERGE (e:Employee { employee_id: $employee_id })
            SET e.name = $name,
                e.email = $email,
                e.title = $title,
                e.department = $department,
                e.location = $location,
                e.hired_date = CASE WHEN $hired_date IS NOT NULL THEN date($hired_date) ELSE e.hired_date END
          `,
          {
            employee_id: row.employee_id,
            name: row.name,
            email: row.email ?? null,
            title: row.title ?? null,
            department: row.department ?? null,
            location: row.location ?? null,
            hired_date: row.hired_date ?? null,
          },
        )

        if (row.manager_id) {
          await session.run(
            `
              MATCH (e:Employee { employee_id: $employee_id })
              OPTIONAL MATCH (e)-[old:REPORTS_TO]->()
              DELETE old
              WITH e
              MATCH (m:Employee { employee_id: $manager_id })
              MERGE (e)-[:REPORTS_TO]->(m)
            `,
            { employee_id: row.employee_id, manager_id: row.manager_id },
          )
        }

        const skills = parseDelimitedList(row.skills)
        for (const skillName of skills) {
          await session.run(
            `
              MATCH (e:Employee { employee_id: $employee_id })
              MERGE (s:Skill { name: $skillName })
              MERGE (e)-[:HAS_SKILL]->(s)
            `,
            { employee_id: row.employee_id, skillName },
          )
        }

        const certifications = parseDelimitedList(row.certifications)
        for (const certificationName of certifications) {
          await session.run(
            `
              MATCH (e:Employee { employee_id: $employee_id })
              MERGE (c:Certification { name: $certificationName })
              MERGE (e)-[:HOLDS_CERTIFICATION]->(c)
            `,
            { employee_id: row.employee_id, certificationName },
          )
        }

        if (row.education_institution) {
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
            {
              employee_id: row.employee_id,
              institution: row.education_institution,
              degree: row.education_degree ?? null,
              field: row.education_field ?? null,
            },
          )
        }

        if (row.aspiration_type) {
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
              employee_id: row.employee_id,
              type: row.aspiration_type,
              targetRole: row.aspiration_target_role ?? null,
              targetDepartment: row.aspiration_target_department ?? null,
              timeline: row.aspiration_timeline ?? null,
            },
          )
        }

        result.successful += 1
      } catch (error) {
        result.failed += 1
        result.errors.push({
          row: rowNumber,
          employee_id: row.employee_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    await session.run('CREATE INDEX employee_id_idx IF NOT EXISTS FOR (e:Employee) ON (e.employee_id)')
    await session.run('CREATE INDEX employee_name_idx IF NOT EXISTS FOR (e:Employee) ON (e.name)')
    await session.run('CREATE INDEX employee_department_idx IF NOT EXISTS FOR (e:Employee) ON (e.department)')
    await session.run('CREATE INDEX skill_name_idx IF NOT EXISTS FOR (s:Skill) ON (s.name)')
  } finally {
    await session.close()
  }

  return result
}
