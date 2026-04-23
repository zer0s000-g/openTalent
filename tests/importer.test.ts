import { describe, expect, it } from 'vitest'
import type { Driver } from 'neo4j-driver'
import { prepareEmployeeImport } from '@/lib/importer'

function createMockDriver(existingEmployeeIds: string[]): Driver {
  return {
    session() {
      return {
        run: async () => ({
          records: existingEmployeeIds.map((employeeId) => ({
            get: () => employeeId,
          })),
        }),
        close: async () => undefined,
      }
    },
  } as unknown as Driver
}

describe('prepareEmployeeImport', () => {
  it('classifies rows as create or update and preserves review warnings', async () => {
    process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'test-password'
    const driver = createMockDriver(['EMP-001'])
    const csv = [
      'employee_id,name,title,department,manager_id,skills,certifications',
      'EMP-001,Jane Doe,ATC Specialist,Operations,,Radar; Radar,ISO 9001',
      'EMP-002,Adi Putra,Data Analyst,Technology,EMP-001,Python; SQL,',
    ].join('\n')

    const result = await prepareEmployeeImport(driver, csv, {
      filename: 'review.csv',
    })

    expect(result.validRows).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
    expect(result.preview.map((row) => row.status)).toEqual(['update', 'create'])
    expect(result.validRows[0]?.skills).toEqual(['Radar'])
    expect(result.validRows[1]?.skills).toEqual(['Python', 'Sql'])
  })

  it('blocks duplicate employee ids and unresolved managers', async () => {
    process.env.NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'test-password'
    const driver = createMockDriver([])
    const csv = [
      'employee_id,name,manager_id',
      'EMP-100,First Person,EMP-999',
      'EMP-100,Second Person,',
    ].join('\n')

    const result = await prepareEmployeeImport(driver, csv, {
      filename: 'bad.csv',
    })

    expect(result.validRows).toHaveLength(0)
    expect(result.preview.map((row) => row.status)).toEqual(['invalid', 'invalid'])
    expect(result.errors.map((issue) => issue.message)).toContain('employee_id appears multiple times in this CSV')
    expect(result.errors.map((issue) => issue.message)).toContain(
      'manager_id does not match an employee in the directory or this import file',
    )
  })
})
