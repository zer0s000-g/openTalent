import { NextRequest, NextResponse } from 'next/server'
import neo4j from 'neo4j-driver'
import { getRuntimeEnv } from '@/lib/env'
import { importEmployeesFromCsv } from '@/lib/importer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const csv = typeof body?.csv === 'string' ? body.csv : ''

    if (!csv.trim()) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
    }

    const env = getRuntimeEnv()
    const driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD))

    try {
      await driver.verifyConnectivity()
      const result = await importEmployeesFromCsv(driver, csv)
      return NextResponse.json({ result })
    } finally {
      await driver.close()
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 },
    )
  }
}
