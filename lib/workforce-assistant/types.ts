export type AssistantIntentType =
  | 'top_employees_by_capability'
  | 'employees_by_role_or_skill'
  | 'top_skills_by_scope'
  | 'location_talent_distribution'
  | 'unsupported'

export type AssistantConfidence = 'high' | 'medium' | 'low'

export type AssistantResultType = 'employee' | 'skill' | 'department' | 'location'

export interface AssistantConversationTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantResult {
  type: AssistantResultType
  key: string
  title: string
  subtitle: string
  meta?: string
  href: string
  score: number
  supportingMetrics?: Record<string, string | number>
}

export interface AssistantAction {
  label: string
  href: string
}

export interface AssistantGrounding {
  type: 'intent' | 'domain' | 'skill' | 'department' | 'city' | 'role'
  label: string
  value?: string
}

export interface AssistantResponse {
  answer: string
  intent: AssistantIntentType
  confidence: AssistantConfidence
  results: AssistantResult[]
  followUps: string[]
  actions: AssistantAction[]
  grounding: AssistantGrounding[]
  warnings?: string[]
}

export interface AssistantMetadata {
  skills: string[]
  departments: string[]
  titles: string[]
  cities: string[]
}

export interface AssistantIntent {
  type: AssistantIntentType
  normalizedMessage: string
  limit: number
  domain?: string
  skillNames?: string[]
  department?: string
  city?: string
  roleTerm?: string
  rawRoleTerm?: string
  interpretationSource?: 'local' | 'llm'
}

export interface EmployeeCapabilityMatch {
  employee_id: string
  name: string
  title: string
  department: string
  location: string
  matchedSkills: string[]
  matchedSkillCount: number
  score: number
}

export interface SkillCoverageMatch {
  skillName: string
  employeeCount: number
  topDepartments: string[]
}

export interface LocationDistributionMatch {
  city: string
  employeeCount: number
  topRoles: string[]
  topSkills: string[]
}
