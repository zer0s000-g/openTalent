'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/shared/badge'

interface Skill {
  name: string
  category?: string
  employeeCount: number
  employees?: Array<{
    employee_id: string
    name: string
    title: string
    department: string
  }>
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [skillEmployees, setSkillEmployees] = useState<Array<{
    employee_id: string
    name: string
    title: string
    department: string
  }>>([])

  // Fetch all skills with counts
  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetSkills {
                skills {
                  name
                  employees {
                    employee_id
                  }
                }
              }
            `,
          }),
        })
        const { data, errors } = await response.json()
        if (errors) throw new Error(errors[0].message)

        const skillsWithCounts = (data.skills || []).map((s: any) => ({
          name: s.name,
          employeeCount: s.employees?.length || 0,
        }))

        // Sort by employee count descending
        skillsWithCounts.sort((a: Skill, b: Skill) => b.employeeCount - a.employeeCount)
        setSkills(skillsWithCounts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skills')
      } finally {
        setLoading(false)
      }
    }

    fetchSkills()
  }, [])

  // Fetch employees for a skill
  const fetchSkillEmployees = async (skillName: string) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetEmployeesBySkill($skillName: String!) {
              getEmployeesBySkill(skillName: $skillName, limit: 50) {
                employee_id
                name
                title
                department
              }
            }
          `,
          variables: { skillName },
        }),
      })
      const { data } = await response.json()
      setSkillEmployees(data.getEmployeesBySkill || [])
    } catch (err) {
      console.error('Failed to fetch skill employees:', err)
    }
  }

  const handleSkillClick = (skillName: string) => {
    setSelectedSkill(skillName === selectedSkill ? null : skillName)
    if (skillName !== selectedSkill) {
      fetchSkillEmployees(skillName)
    }
  }

  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <EmptyState
          title="Error loading skills"
          description={error}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Skills Directory</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and explore skills across the organization
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left - Skills List */}
        <div className="w-80 flex-shrink-0">
          <Card title="Search Skills">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </Card>

          <Card className="mt-4" title={`All Skills (${skills.length})`}>
            <div className="max-h-[600px] overflow-y-auto space-y-1">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.name}
                  onClick={() => handleSkillClick(skill.name)}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedSkill === skill.name
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{skill.name}</span>
                  <Badge color="blue">{skill.employeeCount}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right - Skill Details */}
        <div className="flex-1">
          {selectedSkill ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{selectedSkill}</h3>
                <Badge color="blue">{skillEmployees.length} employees</Badge>
              </div>
              {skillEmployees.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {skillEmployees.map((emp) => (
                    <div
                      key={emp.employee_id}
                      onClick={() => (window.location.href = `/employee/${emp.employee_id}`)}
                      className="cursor-pointer rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                      <p className="text-sm text-gray-500 truncate">{emp.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{emp.department}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No employees found"
                  description="No employees are listed with this skill yet."
                />
              )}
            </Card>
          ) : (
            <EmptyState
              title="Select a skill"
              description="Click on a skill from the list to see which employees have it."
            />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
