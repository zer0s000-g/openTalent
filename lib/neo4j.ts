import neo4j, { Driver, Session } from 'neo4j-driver'

let driver: Driver | null = null

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI ?? 'neo4j://localhost:7687'
    const username = process.env.NEO4J_USERNAME ?? 'neo4j'
    const password = process.env.NEO4J_PASSWORD ?? ''

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
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
  const drv = getDriver()
  return sessionConfig ? drv.session(sessionConfig) : drv.session()
}
