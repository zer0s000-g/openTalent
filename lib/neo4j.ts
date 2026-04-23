import neo4j, { Driver, Session } from 'neo4j-driver'
import { getRuntimeEnv } from '@/lib/env'

let driver: Driver | null = null

export function getDriver(): Driver {
  if (!driver) {
    const env = getRuntimeEnv()
    driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30000,
    })
  }
  return driver
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close()
    driver = null
  }
}

export function getSession(sessionConfig?: { database?: string }): Session {
  const env = getRuntimeEnv()
  const drv = getDriver()
  return drv.session({ database: env.NEO4J_DATABASE, ...sessionConfig })
}
