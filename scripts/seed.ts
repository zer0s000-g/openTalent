import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'
import { getRuntimeEnv } from '@/lib/env'

dotenv.config({ path: '.env.local' })

/**
 * Seed script - populates the database with 100+ sample employees
 * Run with: npm run seed
 */

// Sample data generators
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts'
]

const departments = [
  'Engineering', 'Product', 'Design', 'Data Science', 'Marketing',
  'Sales', 'HR', 'Finance', 'Legal', 'Operations', 'Customer Success',
  'Security', 'IT', 'Research'
]

const titlesByDepartment: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager', 'VP Engineering'],
  Product: ['Product Manager', 'Senior PM', 'Group PM', 'Director of Product', 'VP Product'],
  Design: ['UX Designer', 'Senior UX Designer', 'Product Designer', 'Design Manager', 'Head of Design'],
  'Data Science': ['Data Analyst', 'Data Scientist', 'Senior DS', 'ML Engineer', 'Head of Data'],
  Marketing: ['Marketing Coordinator', 'Marketing Manager', 'Growth Manager', 'CMO'],
  Sales: ['SDR', 'AE', 'Senior AE', 'Sales Manager', 'VP Sales'],
  HR: ['HR Coordinator', 'HR Manager', 'Talent Partner', 'Head of People'],
  Finance: ['Financial Analyst', 'Finance Manager', 'Controller', 'CFO'],
  Legal: ['Legal Counsel', 'Senior Counsel', 'General Counsel'],
  Operations: ['Ops Coordinator', 'Ops Manager', 'Director of Operations', 'COO'],
  'Customer Success': ['CSM', 'Senior CSM', 'CS Manager', 'VP Customer Success'],
  Security: ['Security Analyst', 'Security Engineer', 'Security Manager', 'CISO'],
  IT: ['IT Support', 'IT Manager', 'Director of IT'],
  Research: ['Research Scientist', 'Senior Researcher', 'Research Manager']
}

const skillsByCategory: Record<string, string[]> = {
  technical: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'Go', 'Rust', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'GraphQL', 'REST APIs', 'Machine Learning', 'Data Analysis', 'Git'],
  soft: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Critical Thinking', 'Adaptability', 'Mentorship'],
  domain: ['Product Strategy', 'UX Research', 'Financial Modeling', 'Digital Marketing', 'Sales Strategy', 'Agile', 'Scrum', 'Project Management', 'Business Development']
}

const certifications = [
  'AWS Certified Solutions Architect', 'AWS Certified Developer',
  'Google Cloud Professional', 'Certified Kubernetes Administrator',
  'PMP', 'CSM', 'Six Sigma Green Belt',
  'CISSP', 'CompTIA Security+'
]

const educations = [
  { institution: 'Stanford University', degree: 'BS', field: 'Computer Science' },
  { institution: 'MIT', degree: 'BS', field: 'Electrical Engineering' },
  { institution: 'UC Berkeley', degree: 'BS', field: 'Business Administration' },
  { institution: 'Carnegie Mellon University', degree: 'MS', field: 'Computer Science' },
  { institution: 'Harvard University', degree: 'MBA', field: 'Business' },
  { institution: 'University of Washington', degree: 'BS', field: 'Computer Science' },
  { institution: 'Georgia Tech', degree: 'MS', field: 'Data Science' },
  { institution: 'University of Texas', degree: 'BBA', field: 'Finance' },
  { institution: 'Cornell University', degree: 'BS', field: 'Engineering' },
  { institution: 'UCLA', degree: 'BA', field: 'Psychology' }
]

const locations = ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA', 'Remote', 'Denver, CO', 'Chicago, IL']

const aspirationTypes = ['Role Change', 'Department Transfer', 'Skill Development', 'Leadership Track', 'Geographic Move']

// Deterministic random generator for reproducible data
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickMany<T>(arr: T[], count: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5)
  return shuffled.slice(0, count)
}

interface EmployeeData {
  employee_id: string
  name: string
  email: string
  title: string
  department: string
  location: string
  hired_date: string
  manager_id?: string
  skills: string[]
  certifications?: string[]
  education?: typeof educations[number]
  aspirations?: { type: string; targetRole?: string; targetDepartment?: string; timeline: string }[]
}

function generateEmployees(count: number): EmployeeData[] {
  const employees: EmployeeData[] = []
  const rand = seededRandom(42)

  for (let i = 0; i < count; i++) {
    const firstName = pick(firstNames, rand)
    const lastName = pick(lastNames, rand)
    const name = `${firstName} ${lastName}`
    const department = pick(departments, rand)
    const titles = titlesByDepartment[department]
    const title = pick(titles, rand)

    employees.push({
      employee_id: `EMP${String(i + 1).padStart(4, '0')}`,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      title,
      department,
      location: pick(locations, rand),
      hired_date: new Date(2018 + Math.floor(rand() * 6), Math.floor(rand() * 12), Math.floor(rand() * 28) + 1).toISOString().split('T')[0],
      skills: [...pickMany(skillsByCategory.technical, Math.floor(rand() * 4) + 1, rand), ...pickMany(skillsByCategory.soft, Math.floor(rand() * 2) + 1, rand)],
      certifications: rand() > 0.7 ? pickMany(certifications, Math.floor(rand() * 2) + 1, rand) : undefined,
      education: rand() > 0.3 ? pick(educations, rand) : undefined,
      aspirations: rand() > 0.5 ? [{ type: pick(aspirationTypes, rand), timeline: ['6 months', '1 year', '1-2 years', '2+ years'][Math.floor(rand() * 4)] }] : undefined,
    })
  }

  // Assign managers (employees report to someone with higher index or in leadership)
  for (let i = 10; i < count; i++) {
    // Senior employees (first 10) have no manager (executives)
    // Others report to someone with lower index
    const possibleManagers = employees.filter((_, idx) => idx < i && idx >= Math.max(0, i - 20))
    if (possibleManagers.length > 0) {
      employees[i].manager_id = pick(possibleManagers, rand).employee_id
    }
  }

  return employees
}

async function seed() {
  console.log('Starting seed process...')

  const env = getRuntimeEnv(process.env)

  console.log(`Connecting to Neo4j at ${env.NEO4J_URI}...`)

  const driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD))

  try {
    // Test connection
    await driver.verifyConnectivity()
    console.log('Connected to Neo4j successfully')

    const session = driver.session()

    // Clear existing data
    console.log('Clearing existing data...')
    await session.run('MATCH (n) DETACH DELETE n')
    console.log('Database cleared')

    // Generate employees
    const employees = generateEmployees(120)
    console.log(`Generated ${employees.length} employees`)

    // Create employees
    console.log('Creating employees...')
    for (const emp of employees) {
      const { skills, certifications, education, aspirations, manager_id, ...empData } = emp

      // Create employee
      await session.run(
        `
        CREATE (e:Employee {
          employee_id: $employee_id,
          name: $name,
          email: $email,
          title: $title,
          department: $department,
          location: $location,
          hired_date: date($hired_date)
        })
        `,
        empData
      )

      // Add skills
      for (const skillName of skills) {
        await session.run(
          `
          MATCH (e:Employee { employee_id: $employee_id })
          MERGE (s:Skill { name: $skillName })
          MERGE (e)-[:HAS_SKILL]->(s)
          `,
          { employee_id: emp.employee_id, skillName }
        )
      }

      // Add certifications
      if (certifications) {
        for (const certName of certifications) {
          await session.run(
            `
            MATCH (e:Employee { employee_id: $employee_id })
            MERGE (c:Certification { name: $certName })
            MERGE (e)-[:HOLDS_CERTIFICATION]->(c)
            `,
            { employee_id: emp.employee_id, certName }
          )
        }
      }

      // Add education
      if (education) {
        await session.run(
          `
          MATCH (e:Employee { employee_id: $employee_id })
          MERGE (ed:Education { institution: $institution, degree: $degree, field: $field })
          MERGE (e)-[:HAS_EDUCATION]->(ed)
          `,
          { employee_id: emp.employee_id, ...education }
        )
      }

      // Add aspirations
      if (aspirations && aspirations.length > 0) {
        for (const asp of aspirations) {
          await session.run(
            `
            MATCH (e:Employee { employee_id: $employee_id })
            CREATE (a:Aspiration {
              type: $type,
              targetRole: coalesce($targetRole, null),
              targetDepartment: coalesce($targetDepartment, null),
              timeline: $timeline
            })
            CREATE (e)-[:ASPIRES_TO]->(a)
            `,
            {
              employee_id: emp.employee_id,
              type: asp.type,
              targetRole: asp.targetRole || null,
              targetDepartment: asp.targetDepartment || null,
              timeline: asp.timeline,
            }
          )
        }
      }

      // Add manager relationship
      if (manager_id) {
        await session.run(
          `
          MATCH (e:Employee { employee_id: $employee_id })
          MATCH (m:Employee { employee_id: $manager_id })
          CREATE (e)-[:REPORTS_TO]->(m)
          `,
          { employee_id: emp.employee_id, manager_id }
        )
      }
    }

    console.log('All employees created')

    // Create indexes
    console.log('Creating indexes...')
    await session.run('CREATE INDEX employee_id_idx IF NOT EXISTS FOR (e:Employee) ON (e.employee_id)')
    await session.run('CREATE INDEX employee_name_idx IF NOT EXISTS FOR (e:Employee) ON (e.name)')
    await session.run('CREATE INDEX employee_department_idx IF NOT EXISTS FOR (e:Employee) ON (e.department)')
    await session.run('CREATE INDEX skill_name_idx IF NOT EXISTS FOR (s:Skill) ON (s.name)')
    console.log('Indexes created')

    // Verify
    const result = await session.run('MATCH (e:Employee) RETURN count(e) as count')
    const count = result.records[0].get('count').low

    console.log(`\n✅ Seed complete! Database contains ${count} employees`)
    console.log('\nRun "npm run dev" to start the application')

  } catch (error) {
    console.error('Seed error:', error)
    throw error
  } finally {
    await driver.close()
  }
}

seed().catch(console.error)
