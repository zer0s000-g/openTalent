import { describe, expect, it } from 'vitest'
import { classifyAssistantIntent } from '@/lib/workforce-assistant/intent'
import { scoreCapabilityMatch } from '@/lib/workforce-assistant/queries'

const metadata = {
  skills: ['Python', 'React', 'Communication', 'Leadership', 'Decision Making', 'Data Analysis'],
  departments: ['Engineering', 'Operations', 'Customer Success'],
  titles: ['Software Engineer', 'Engineering Manager', 'Senior CSM', 'Security Engineer'],
  cities: ['Jakarta', 'Surabaya', 'Makassar'],
}

describe('workforce assistant intent', () => {
  it('maps a software programming request to a top-employee capability query', () => {
    const intent = classifyAssistantIntent('Give me the top 5 employees in software programming domain.', metadata)

    expect(intent.type).toBe('top_employees_by_capability')
    expect(intent.limit).toBe(5)
    expect(intent.domain).toBe('software programming')
    expect(intent.skillNames).toContain('Python')
    expect(intent.skillNames).toContain('React')
  })

  it('detects a city-filtered skill lookup', () => {
    const intent = classifyAssistantIntent('Best Python employees in Jakarta', metadata)

    expect(intent.type).toBe('top_employees_by_capability')
    expect(intent.city).toBe('Jakarta')
    expect(intent.skillNames).toEqual(['Python'])
  })

  it('detects top skills within a department', () => {
    const intent = classifyAssistantIntent('Which skills are most concentrated in Engineering?', metadata)

    expect(intent.type).toBe('top_skills_by_scope')
    expect(intent.department).toBe('Engineering')
  })

  it('falls back safely for unsupported broad questions', () => {
    const intent = classifyAssistantIntent('Tell me about the company culture and future strategy', metadata)

    expect(intent.type).toBe('unsupported')
  })

  it('scores stronger proficiency above weaker experience-only matches', () => {
    expect(scoreCapabilityMatch('Expert', 4)).toBeGreaterThan(scoreCapabilityMatch('Intermediate', 4))
  })
})
