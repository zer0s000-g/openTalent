import neo4j from 'neo4j-driver'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'
import { getRuntimeEnv } from '@/lib/env'
import { importEmployeesFromCsv } from '@/lib/importer'

dotenv.config({ path: '.env.local' })

async function importCSV(filePath: string) {
  console.log(`Starting import from ${filePath}...`)
  const csv = readFileSync(filePath, 'utf-8')
  const env = getRuntimeEnv(process.env)

  const driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD))

  try {
    await driver.verifyConnectivity()
    const report = await importEmployeesFromCsv(driver, csv)

    console.log('\n' + '='.repeat(50))
    console.log('IMPORT REPORT')
    console.log('='.repeat(50))
    console.log(`Total rows:     ${report.totalRows}`)
    console.log(`Successful:     ${report.successful}`)
    console.log(`Failed:         ${report.failed}`)

    if (report.errors.length > 0) {
      console.log(`\nErrors (${report.errors.length}):`)
      report.errors.slice(0, 10).forEach((item) => {
        console.log(`  Row ${item.row}${item.employee_id ? ` (${item.employee_id})` : ''}: ${item.error}`)
      })
    }

    console.log('='.repeat(50))

    const session = driver.session({ database: env.NEO4J_DATABASE })
    try {
      const result = await session.run('MATCH (e:Employee) RETURN count(e) as count')
      const count = result.records[0].get('count').toNumber?.() ?? result.records[0].get('count').low ?? 0
      console.log(`\n✅ Import complete! Database contains ${count} employees`)
    } finally {
      await session.close()
    }
  } finally {
    await driver.close()
  }
}

const filePath = process.argv[2] ?? 'data/sample-employees.csv'

importCSV(filePath).catch((error) => {
  console.error('Import error:', error)
  process.exit(1)
})
