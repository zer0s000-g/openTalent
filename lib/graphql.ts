import { Neo4jGraphQL } from '@neo4j/graphql'
import { getDriver } from './neo4j'
import { readFileSync } from 'fs'
import { join } from 'path'

const typeDefs = readFileSync(join(process.cwd(), 'graphql', 'schema.graphql'), 'utf-8')

let neoSchema: Neo4jGraphQL | null = null

export function getNeoSchema(): Neo4jGraphQL {
  if (!neoSchema) {
    neoSchema = new Neo4jGraphQL({
      typeDefs,
      features: {},
    })
  }
  return neoSchema
}

export async function getSchema(): Promise<import('graphql').GraphQLSchema> {
  const schema = getNeoSchema()
  return schema.getSchema()
}

/**
 * Initialize the schema and create indexes
 * Call this once at application startup
 */
export async function initializeSchema(): Promise<void> {
  const schema = getNeoSchema()
  const driver = getDriver()

  try {
    // Create the GraphQL schema in Neo4j
    await schema.checkNeo4jCompat({ driver })

    // Create full-text index for employee search
    const session = driver.session()
    try {
      // Try to create the index (may already exist)
      await session.run(`
        CREATE FULLTEXT INDEX employeeName IF NOT EXISTS
        FOR (e:Employee)
        ON EACH [e.name, e.email, e.title, e.department]
      `)
      console.log('Full-text index created/verified')
    } catch (err) {
      console.log('Index creation note:', err instanceof Error ? err.message : err)
    } finally {
      await session.close()
    }

    console.log('Schema initialized successfully')
  } catch (error) {
    console.error('Schema initialization error:', error)
    throw error
  }
}
