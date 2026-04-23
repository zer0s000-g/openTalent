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
    const review = await importEmployeesFromCsv(driver, csv, {
      mode: 'dry-run',
      filename: filePath,
    })

    console.log('\n' + '='.repeat(50))
    console.log('IMPORT REVIEW')
    console.log('='.repeat(50))
    console.log(`Total rows:     ${review.totalRows}`)
    console.log(`Valid rows:     ${review.validRows}`)
    console.log(`Invalid rows:   ${review.invalidRows}`)
    console.log(`To create:      ${review.rowsToCreate}`)
    console.log(`To update:      ${review.rowsToUpdate}`)
    console.log(`Warnings:       ${review.warnings.length}`)

    if (review.errors.length > 0) {
      console.log(`\nErrors (${review.errors.length}):`)
      review.errors.slice(0, 10).forEach((item) => {
        console.log(`  Row ${item.row}${item.employee_id ? ` (${item.employee_id})` : ''}: ${item.message}`)
      })
      console.log('\nImport aborted because the preview found invalid rows.')
      console.log('='.repeat(50))
      process.exitCode = 1
      return
    }

    if (review.warnings.length > 0) {
      console.log(`\nWarnings (${review.warnings.length}):`)
      review.warnings.slice(0, 10).forEach((item) => {
        console.log(`  Row ${item.row}${item.employee_id ? ` (${item.employee_id})` : ''}: ${item.message}`)
      })
    }

    console.log('='.repeat(50))

    const report = await importEmployeesFromCsv(driver, csv, {
      mode: 'apply',
      filename: filePath,
    })

    console.log('\n' + '='.repeat(50))
    console.log('IMPORT APPLY')
    console.log('='.repeat(50))
    console.log(`Successful:     ${report.successful}`)
    console.log(`Failed:         ${report.failed}`)
    console.log(`Batch ID:       ${report.batchId}`)
    console.log(`Imported at:    ${report.importedAt}`)
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
