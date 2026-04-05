import neo4j from 'neo4j-driver'
import dotenv from 'dotenv'
import { getRuntimeEnv } from '@/lib/env'
import { indonesiaCities } from '@/lib/indonesia-cities'

dotenv.config({ path: '.env.local' })

/**
 * Seed script - populates the database with 200 employees and complete profile details
 * Run with: npm run seed
 */

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Avery', 'Jordan', 'Taylor', 'Morgan', 'Parker', 'Reese', 'Quinn', 'Skyler',
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Morgan', 'Reed', 'Brooks', 'Kelly', 'Murphy', 'Ward',
  'Watson', 'Price', 'Bennett', 'Russell', 'Sanders', 'Perry', 'Powell', 'Long',
]

const softSkills = [
  'Leadership',
  'Communication',
  'Problem Solving',
  'Critical Thinking',
  'Adaptability',
  'Mentorship',
  'Stakeholder Management',
  'Cross-Functional Collaboration',
  'Decision Making',
  'Coaching',
]

const departmentConfigs = [
  {
    name: 'Executive',
    size: 1,
    costCenter: 'CC-100',
    headTitle: 'Chief Executive Officer',
    directorTitle: 'Chief Executive Officer',
    managerTitle: 'Chief Executive Officer',
    individualTitles: ['Chief Executive Officer'],
    focusSkills: ['Leadership', 'Communication', 'Business Strategy', 'Executive Presence', 'Board Management', 'Critical Thinking'],
    jobFamily: 'Executive Leadership',
    certificationNames: ['PMP', 'Six Sigma Green Belt'],
  },
  {
    name: 'Engineering',
    size: 36,
    costCenter: 'CC-200',
    headTitle: 'VP Engineering',
    directorTitle: 'Principal Engineer',
    managerTitle: 'Engineering Manager',
    individualTitles: ['Software Engineer', 'Senior Engineer', 'Staff Engineer'],
    focusSkills: ['Python', 'TypeScript', 'React', 'Node.js', 'GraphQL', 'AWS', 'Docker', 'Kubernetes', 'Terraform', 'PostgreSQL', 'Go', 'System Design'],
    jobFamily: 'Engineering',
    certificationNames: ['AWS Certified Solutions Architect', 'AWS Certified Developer', 'Certified Kubernetes Administrator'],
  },
  {
    name: 'Product',
    size: 15,
    costCenter: 'CC-210',
    headTitle: 'VP Product',
    directorTitle: 'Director of Product',
    managerTitle: 'Group PM',
    individualTitles: ['Product Manager', 'Senior PM'],
    focusSkills: ['Product Strategy', 'Roadmapping', 'Experimentation', 'User Research', 'Analytics', 'Agile', 'Scrum', 'Stakeholder Management'],
    jobFamily: 'Product Management',
    certificationNames: ['PMP', 'CSM'],
  },
  {
    name: 'Design',
    size: 12,
    costCenter: 'CC-220',
    headTitle: 'Head of Design',
    directorTitle: 'Design Manager',
    managerTitle: 'Design Manager',
    individualTitles: ['UX Designer', 'Senior UX Designer', 'Product Designer'],
    focusSkills: ['UX Research', 'Wireframing', 'Design Systems', 'Prototyping', 'Visual Design', 'Accessibility', 'Figma', 'User Testing'],
    jobFamily: 'Product Design',
    certificationNames: ['CSM', 'Six Sigma Green Belt'],
  },
  {
    name: 'Data Science',
    size: 14,
    costCenter: 'CC-230',
    headTitle: 'Head of Data',
    directorTitle: 'Senior DS',
    managerTitle: 'Senior DS',
    individualTitles: ['Data Analyst', 'Data Scientist', 'ML Engineer'],
    focusSkills: ['Machine Learning', 'Python', 'SQL', 'Data Analysis', 'Experimentation', 'MLOps', 'Statistics', 'Forecasting'],
    jobFamily: 'Data & AI',
    certificationNames: ['Google Cloud Professional', 'AWS Certified Solutions Architect'],
  },
  {
    name: 'Marketing',
    size: 10,
    costCenter: 'CC-240',
    headTitle: 'CMO',
    directorTitle: 'Growth Manager',
    managerTitle: 'Marketing Manager',
    individualTitles: ['Marketing Coordinator', 'Marketing Manager', 'Growth Manager'],
    focusSkills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Campaign Analytics', 'Brand Positioning', 'Demand Generation', 'A/B Testing'],
    jobFamily: 'Marketing',
    certificationNames: ['Google Cloud Professional', 'PMP'],
  },
  {
    name: 'Sales',
    size: 20,
    costCenter: 'CC-250',
    headTitle: 'VP Sales',
    directorTitle: 'Sales Manager',
    managerTitle: 'Sales Manager',
    individualTitles: ['SDR', 'AE', 'Senior AE'],
    focusSkills: ['Sales Strategy', 'Negotiation', 'Pipeline Management', 'Customer Discovery', 'Forecasting', 'Account Planning', 'Communication'],
    jobFamily: 'Sales',
    certificationNames: ['PMP', 'Six Sigma Green Belt'],
  },
  {
    name: 'HR',
    size: 8,
    costCenter: 'CC-260',
    headTitle: 'Head of People',
    directorTitle: 'Talent Partner',
    managerTitle: 'HR Manager',
    individualTitles: ['HR Coordinator', 'Talent Partner'],
    focusSkills: ['Talent Management', 'Coaching', 'Recruiting', 'Compensation Planning', 'Org Design', 'Communication', 'Mentorship'],
    jobFamily: 'People Operations',
    certificationNames: ['PMP', 'CSM'],
  },
  {
    name: 'Finance',
    size: 8,
    costCenter: 'CC-270',
    headTitle: 'CFO',
    directorTitle: 'Controller',
    managerTitle: 'Finance Manager',
    individualTitles: ['Financial Analyst', 'Finance Manager'],
    focusSkills: ['Financial Modeling', 'FP&A', 'Forecasting', 'Excel', 'Risk Analysis', 'SQL', 'Business Strategy'],
    jobFamily: 'Finance',
    certificationNames: ['PMP', 'Six Sigma Green Belt'],
  },
  {
    name: 'Legal',
    size: 6,
    costCenter: 'CC-280',
    headTitle: 'General Counsel',
    directorTitle: 'Senior Counsel',
    managerTitle: 'Senior Counsel',
    individualTitles: ['Legal Counsel', 'Senior Counsel'],
    focusSkills: ['Contract Review', 'Corporate Governance', 'Compliance', 'Risk Management', 'Research', 'Writing'],
    jobFamily: 'Legal',
    certificationNames: ['PMP', 'CompTIA Security+'],
  },
  {
    name: 'Operations',
    size: 16,
    costCenter: 'CC-290',
    headTitle: 'COO',
    directorTitle: 'Director of Operations',
    managerTitle: 'Ops Manager',
    individualTitles: ['Ops Coordinator', 'Ops Manager'],
    focusSkills: ['Project Management', 'Process Improvement', 'Vendor Management', 'Business Operations', 'Data Analysis', 'Program Management'],
    jobFamily: 'Operations',
    certificationNames: ['PMP', 'Six Sigma Green Belt'],
  },
  {
    name: 'Customer Success',
    size: 20,
    costCenter: 'CC-300',
    headTitle: 'VP Customer Success',
    directorTitle: 'CS Manager',
    managerTitle: 'CS Manager',
    individualTitles: ['CSM', 'Senior CSM'],
    focusSkills: ['Customer Onboarding', 'Renewals', 'Account Management', 'Relationship Building', 'Communication', 'Escalation Management'],
    jobFamily: 'Customer Success',
    certificationNames: ['CSM', 'PMP'],
  },
  {
    name: 'Security',
    size: 10,
    costCenter: 'CC-310',
    headTitle: 'CISO',
    directorTitle: 'Security Manager',
    managerTitle: 'Security Manager',
    individualTitles: ['Security Analyst', 'Security Engineer'],
    focusSkills: ['Cloud Security', 'Incident Response', 'Identity Management', 'Threat Modeling', 'SIEM', 'Python', 'Terraform'],
    jobFamily: 'Security',
    certificationNames: ['CISSP', 'CompTIA Security+'],
  },
  {
    name: 'IT',
    size: 9,
    costCenter: 'CC-320',
    headTitle: 'Director of IT',
    directorTitle: 'Director of IT',
    managerTitle: 'IT Manager',
    individualTitles: ['IT Support', 'IT Manager'],
    focusSkills: ['Systems Administration', 'IT Operations', 'Device Management', 'Troubleshooting', 'Network Administration', 'Documentation'],
    jobFamily: 'IT',
    certificationNames: ['CompTIA Security+', 'Google Cloud Professional'],
  },
  {
    name: 'Research',
    size: 15,
    costCenter: 'CC-330',
    headTitle: 'Research Manager',
    directorTitle: 'Senior Researcher',
    managerTitle: 'Research Manager',
    individualTitles: ['Research Scientist', 'Senior Researcher'],
    focusSkills: ['Research', 'Statistical Modeling', 'Python', 'Scientific Writing', 'Experiment Design', 'Literature Review', 'Data Analysis'],
    jobFamily: 'Research',
    certificationNames: ['Google Cloud Professional', 'AWS Certified Developer'],
  },
] as const

const certificationCatalog = {
  'AWS Certified Solutions Architect': { issuer: 'Amazon Web Services', expiryOffsetYears: 3 },
  'AWS Certified Developer': { issuer: 'Amazon Web Services', expiryOffsetYears: 3 },
  'Google Cloud Professional': { issuer: 'Google Cloud', expiryOffsetYears: 2 },
  'Certified Kubernetes Administrator': { issuer: 'Cloud Native Computing Foundation', expiryOffsetYears: 3 },
  PMP: { issuer: 'Project Management Institute', expiryOffsetYears: 3 },
  CSM: { issuer: 'Scrum Alliance', expiryOffsetYears: 2 },
  'Six Sigma Green Belt': { issuer: 'ASQ', expiryOffsetYears: 4 },
  CISSP: { issuer: '(ISC)2', expiryOffsetYears: 3 },
  'CompTIA Security+': { issuer: 'CompTIA', expiryOffsetYears: 3 },
} as const

const educationCatalog = [
  { institution: 'Stanford University', degree: 'BS', field: 'Computer Science' },
  { institution: 'MIT', degree: 'BS', field: 'Electrical Engineering' },
  { institution: 'UC Berkeley', degree: 'BS', field: 'Business Administration' },
  { institution: 'Carnegie Mellon University', degree: 'MS', field: 'Computer Science' },
  { institution: 'Harvard University', degree: 'MBA', field: 'Business' },
  { institution: 'University of Washington', degree: 'BS', field: 'Computer Science' },
  { institution: 'Georgia Tech', degree: 'MS', field: 'Data Science' },
  { institution: 'University of Texas', degree: 'BBA', field: 'Finance' },
  { institution: 'Cornell University', degree: 'BS', field: 'Engineering' },
  { institution: 'UCLA', degree: 'BA', field: 'Psychology' },
  { institution: 'Northwestern University', degree: 'MS', field: 'Product Design' },
  { institution: 'University of Michigan', degree: 'BA', field: 'Economics' },
] as const

const aspirationTypes = ['Role Change', 'Department Transfer', 'Skill Development', 'Leadership Track', 'Geographic Move'] as const
const aspirationTimelines = ['6 months', '1 year', '1-2 years', '2+ years'] as const

type DepartmentConfig = (typeof departmentConfigs)[number]
type CertificationName = keyof typeof certificationCatalog

interface SkillAssignment {
  name: string
  category: 'technical' | 'soft' | 'domain'
  proficiencyLevel: 'Foundational' | 'Intermediate' | 'Advanced' | 'Expert'
  yearsOfExperience: number
}

interface CertificationAssignment {
  name: CertificationName
  issuer: string
  expiryDate: string
}

interface EducationAssignment {
  institution: string
  degree: string
  field: string
  year: number
}

interface AspirationAssignment {
  type: string
  targetRole: string
  targetDepartment: string
  timeline: string
}

interface RoleAssignment {
  title: string
  level: string
  jobFamily: string
}

interface EmployeeData {
  employee_id: string
  name: string
  email: string
  title: string
  department: string
  departmentCostCenter: string
  location: string
  hired_date: string
  manager_id?: string
  skills: SkillAssignment[]
  certifications: CertificationAssignment[]
  education: EducationAssignment
  role: RoleAssignment
  aspirations: AspirationAssignment[]
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickMany<T>(arr: readonly T[], count: number, rand: () => number): T[] {
  const pool = [...arr]
  const picked: T[] = []

  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(rand() * pool.length)
    picked.push(pool.splice(index, 1)[0])
  }

  return picked
}

function pickWeighted<T extends { weight: number }>(arr: readonly T[], rand: () => number): T {
  const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0)
  let cursor = rand() * totalWeight

  for (const item of arr) {
    cursor -= item.weight
    if (cursor <= 0) return item
  }

  return arr[arr.length - 1]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createEmployeeId(index: number) {
  return `EMP${String(index).padStart(4, '0')}`
}

function createUniqueName(index: number) {
  const first = firstNames[index % firstNames.length]
  const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length]
  return `${first} ${last}`
}

function createEmail(name: string, employeeId: string) {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.+|\.+$/g, '')
  return `${slug}.${employeeId.toLowerCase()}@company.com`
}

function createHiredDate(level: string, rand: () => number) {
  const yearFloor = {
    Executive: 2014,
    Director: 2016,
    Manager: 2017,
    'Senior Individual Contributor': 2018,
    'Individual Contributor': 2019,
  }[level] || 2018

  const year = yearFloor + Math.floor(rand() * 7)
  const month = Math.floor(rand() * 12)
  const day = Math.floor(rand() * 28) + 1
  return new Date(year, month, day).toISOString().split('T')[0]
}

function createExpiryDate(hiredDate: string, offsetYears: number, rand: () => number) {
  const baseDate = new Date(hiredDate)
  const expiryYear = baseDate.getFullYear() + offsetYears + Math.floor(rand() * 2)
  const expiryMonth = baseDate.getMonth()
  const expiryDay = Math.min(baseDate.getDate(), 28)
  return new Date(expiryYear, expiryMonth, expiryDay).toISOString().split('T')[0]
}

function deriveRoleLevel(title: string): string {
  if (/chief|vp|head|general counsel/i.test(title)) return 'Executive'
  if (/director|principal/i.test(title)) return 'Director'
  if (/manager|group pm/i.test(title)) return 'Manager'
  if (/senior|staff|lead/i.test(title)) return 'Senior Individual Contributor'
  return 'Individual Contributor'
}

function createRoleAssignment(title: string, jobFamily: string): RoleAssignment {
  return {
    title,
    level: deriveRoleLevel(title),
    jobFamily,
  }
}

function createSkillAssignments(config: DepartmentConfig, level: string, rand: () => number): SkillAssignment[] {
  const coreSkills = pickMany(config.focusSkills, 4, rand)
  const softSelections = pickMany(softSkills, 2, rand)
  const uniqueSkills = [...new Set([...coreSkills, ...softSelections])]
  const focusSkills = config.focusSkills as readonly string[]

  return uniqueSkills.map((skillName, index) => {
    const category = focusSkills.includes(skillName)
      ? (index < 2 ? 'technical' : 'domain')
      : 'soft'

    const baseYears = {
      Executive: 12,
      Director: 10,
      Manager: 8,
      'Senior Individual Contributor': 6,
      'Individual Contributor': 3,
    }[level] || 4

    const proficiencyLevel = (
      baseYears >= 10 ? 'Expert' :
      baseYears >= 7 ? 'Advanced' :
      baseYears >= 4 ? 'Intermediate' :
      'Foundational'
    ) as SkillAssignment['proficiencyLevel']

    return {
      name: skillName,
      category,
      proficiencyLevel,
      yearsOfExperience: clamp(Number((baseYears - 1 + rand() * 3).toFixed(1)), 1, 20),
    }
  })
}

function createCertificationAssignments(config: DepartmentConfig, hiredDate: string, rand: () => number): CertificationAssignment[] {
  const desired = Math.min(config.certificationNames.length, 1 + Math.floor(rand() * 2))
  return pickMany(config.certificationNames, desired, rand).map((name) => ({
    name,
    issuer: certificationCatalog[name].issuer,
    expiryDate: createExpiryDate(hiredDate, certificationCatalog[name].expiryOffsetYears, rand),
  }))
}

function createEducationAssignment(level: string, rand: () => number): EducationAssignment {
  const picked = pick(educationCatalog, rand)
  const graduationYear = {
    Executive: 2008,
    Director: 2010,
    Manager: 2012,
    'Senior Individual Contributor': 2014,
    'Individual Contributor': 2016,
  }[level] || 2014

  return {
    institution: picked.institution,
    degree: picked.degree,
    field: picked.field,
    year: graduationYear + Math.floor(rand() * 5),
  }
}

function createAspirations(config: DepartmentConfig, title: string, rand: () => number): AspirationAssignment[] {
  const nextRole =
    config.headTitle === title
      ? `Enterprise Mentor - ${config.name}`
      : /Manager|Director|Head|VP|Chief|Counsel/i.test(title)
        ? config.headTitle
        : config.managerTitle

  const alternateDepartment = rand() > 0.6
    ? pick(departmentConfigs.filter((candidate) => candidate.name !== config.name).map((candidate) => candidate.name), rand)
    : config.name

  return [
    {
      type: pick(aspirationTypes, rand),
      targetRole: nextRole,
      targetDepartment: alternateDepartment,
      timeline: pick(aspirationTimelines, rand),
    },
  ]
}

function createEmployeeRecord(index: number, title: string, config: DepartmentConfig, managerId: string | undefined, rand: () => number): EmployeeData {
  const employee_id = createEmployeeId(index)
  const name = createUniqueName(index - 1)
  const role = createRoleAssignment(title, config.jobFamily)
  const hired_date = createHiredDate(role.level, rand)
  const assignedCity = pickWeighted(indonesiaCities, rand)

  return {
    employee_id,
    name,
    email: createEmail(name, employee_id),
    title,
    department: config.name,
    departmentCostCenter: config.costCenter,
    location: assignedCity.name,
    hired_date,
    manager_id: managerId,
    skills: createSkillAssignments(config, role.level, rand),
    certifications: createCertificationAssignments(config, hired_date, rand),
    education: createEducationAssignment(role.level, rand),
    role,
    aspirations: createAspirations(config, title, rand),
  }
}

function generateEmployees(totalCount: number): EmployeeData[] {
  const expectedCount = departmentConfigs.reduce((sum, config) => sum + config.size, 0)
  if (expectedCount !== totalCount) {
    throw new Error(`Department sizing mismatch: expected ${expectedCount}, requested ${totalCount}`)
  }

  const rand = seededRandom(42)
  const employees: EmployeeData[] = []
  let index = 1

  const executiveConfig = departmentConfigs[0]
  const ceo = createEmployeeRecord(index, executiveConfig.headTitle, executiveConfig, undefined, rand)
  employees.push(ceo)
  index += 1

  for (const config of departmentConfigs.slice(1)) {
    const head = createEmployeeRecord(index, config.headTitle, config, ceo.employee_id, rand)
    employees.push(head)
    index += 1

    const remaining = config.size - 1
    const directorCount = remaining >= 12 ? 1 : 0
    const managerCount = Math.max(1, Math.floor((remaining - directorCount) / 7))

    const directors: EmployeeData[] = []
    for (let i = 0; i < directorCount; i++) {
      const director = createEmployeeRecord(index, config.directorTitle, config, head.employee_id, rand)
      employees.push(director)
      directors.push(director)
      index += 1
    }

    const managers: EmployeeData[] = []
    const managerParentId = directors[0]?.employee_id || head.employee_id
    for (let i = 0; i < managerCount; i++) {
      const manager = createEmployeeRecord(index, config.managerTitle, config, managerParentId, rand)
      employees.push(manager)
      managers.push(manager)
      index += 1
    }

    const individualContributorCount = remaining - directorCount - managerCount
    for (let i = 0; i < individualContributorCount; i++) {
      const title = pick(config.individualTitles, rand)
      const manager = managers[i % managers.length] || directors[0] || head
      const employee = createEmployeeRecord(index, title, config, manager.employee_id, rand)
      employees.push(employee)
      index += 1
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
    await driver.verifyConnectivity()
    console.log('Connected to Neo4j successfully')

    const session = driver.session()

    console.log('Clearing existing data...')
    await session.run('MATCH (n) DETACH DELETE n')
    console.log('Database cleared')

    const employees = generateEmployees(200)
    console.log(`Generated ${employees.length} fully populated employees`)

    console.log('Creating departments...')
    for (const config of departmentConfigs) {
      await session.run(
        `
        MERGE (d:Department { name: $name })
        SET d.costCenter = $costCenter
        `,
        { name: config.name, costCenter: config.costCenter },
      )
    }

    console.log('Creating employees...')
    for (const employee of employees) {
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
        employee,
      )
    }

    console.log('Creating role, department, skill, certification, education, and aspiration relationships...')
    for (const employee of employees) {
      await session.run(
        `
        MATCH (e:Employee { employee_id: $employee_id })
        MATCH (d:Department { name: $department })
        MERGE (e)-[:BELONGS_TO_DEPARTMENT]->(d)
        MERGE (r:Role { title: $roleTitle })
        SET r.level = $roleLevel,
            r.jobFamily = $jobFamily
        MERGE (e)-[:HAS_ROLE]->(r)
        `,
        {
          employee_id: employee.employee_id,
          department: employee.department,
          roleTitle: employee.role.title,
          roleLevel: employee.role.level,
          jobFamily: employee.role.jobFamily,
        },
      )

      for (const skill of employee.skills) {
        await session.run(
          `
          MATCH (e:Employee { employee_id: $employee_id })
          MERGE (s:Skill { name: $skillName })
          SET s.category = $category
          MERGE (e)-[rel:HAS_SKILL]->(s)
          SET rel.proficiencyLevel = $proficiencyLevel,
              rel.yearsOfExperience = $yearsOfExperience
          `,
          {
            employee_id: employee.employee_id,
            skillName: skill.name,
            category: skill.category,
            proficiencyLevel: skill.proficiencyLevel,
            yearsOfExperience: skill.yearsOfExperience,
          },
        )
      }

      for (const certification of employee.certifications) {
        await session.run(
          `
          MATCH (e:Employee { employee_id: $employee_id })
          MERGE (c:Certification { name: $name })
          SET c.issuer = $issuer,
              c.expiryDate = date($expiryDate)
          MERGE (e)-[:HOLDS_CERTIFICATION]->(c)
          `,
          {
            employee_id: employee.employee_id,
            name: certification.name,
            issuer: certification.issuer,
            expiryDate: certification.expiryDate,
          },
        )
      }

      await session.run(
        `
        MATCH (e:Employee { employee_id: $employee_id })
        MERGE (ed:Education {
          institution: $institution,
          degree: $degree,
          field: $field,
          year: $year
        })
        MERGE (e)-[:HAS_EDUCATION]->(ed)
        `,
        {
          employee_id: employee.employee_id,
          institution: employee.education.institution,
          degree: employee.education.degree,
          field: employee.education.field,
          year: employee.education.year,
        },
      )

      for (const aspiration of employee.aspirations) {
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
            employee_id: employee.employee_id,
            type: aspiration.type,
            targetRole: aspiration.targetRole,
            targetDepartment: aspiration.targetDepartment,
            timeline: aspiration.timeline,
          },
        )
      }
    }

    console.log('Creating manager relationships...')
    for (const employee of employees) {
      if (!employee.manager_id) continue

      await session.run(
        `
        MATCH (e:Employee { employee_id: $employee_id })
        MATCH (m:Employee { employee_id: $manager_id })
        MERGE (e)-[:REPORTS_TO]->(m)
        `,
        {
          employee_id: employee.employee_id,
          manager_id: employee.manager_id,
        },
      )
    }

    console.log('Creating indexes...')
    await session.run('CREATE INDEX employee_id_idx IF NOT EXISTS FOR (e:Employee) ON (e.employee_id)')
    await session.run('CREATE INDEX employee_name_idx IF NOT EXISTS FOR (e:Employee) ON (e.name)')
    await session.run('CREATE INDEX employee_department_idx IF NOT EXISTS FOR (e:Employee) ON (e.department)')
    await session.run('CREATE INDEX skill_name_idx IF NOT EXISTS FOR (s:Skill) ON (s.name)')
    await session.run('CREATE INDEX role_title_idx IF NOT EXISTS FOR (r:Role) ON (r.title)')
    await session.run('CREATE INDEX department_name_idx IF NOT EXISTS FOR (d:Department) ON (d.name)')
    console.log('Indexes created')

    const employeeCountResult = await session.run('MATCH (e:Employee) RETURN count(e) AS count')
    const skillCountResult = await session.run('MATCH (s:Skill) RETURN count(s) AS count')
    const relationshipCountResult = await session.run('MATCH ()-[r]->() RETURN count(r) AS count')

    const employeeCount = employeeCountResult.records[0].get('count').low
    const skillCount = skillCountResult.records[0].get('count').low
    const relationshipCount = relationshipCountResult.records[0].get('count').low

    console.log(`\n✅ Seed complete!`)
    console.log(`Employees: ${employeeCount}`)
    console.log(`Skills: ${skillCount}`)
    console.log(`Relationships: ${relationshipCount}`)
    console.log(`Primary org root: ${employees[0].employee_id} (${employees[0].name})`)
    await session.close()
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  } finally {
    await driver.close()
  }
}

seed().catch(console.error)
