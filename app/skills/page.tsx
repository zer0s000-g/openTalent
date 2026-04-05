'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/shared/badge'

interface SkillListItem {
  name: string
  employeeCount: number
}

interface SkillEmployee {
  employee_id: string
  name: string
  title: string
  department: string
}

async function queryGraphQL(query: string, variables?: Record<string, unknown>) {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const payload = await response.json()
  if (payload.errors) {
    throw new Error(payload.errors[0]?.message || 'GraphQL request failed')
  }

  return payload.data
}

function SkillsPageContent() {
  const searchParams = useSearchParams()
  const [skills, setSkills] = useState<SkillListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [skillEmployeesByName, setSkillEmployeesByName] = useState<Record<string, SkillEmployee[]>>({})
  const [skillEmployeesLoadingName, setSkillEmployeesLoadingName] = useState<string | null>(null)
  const [skillEmployeesError, setSkillEmployeesError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSkills() {
      try {
        const data = await queryGraphQL(`
          query GetSkills {
            skills {
              name
              employeeCount
            }
          }
        `)

        const skillList = (data.skills || [])
          .filter((skill: { name?: string }) => Boolean(skill.name))
          .map((skill: { name: string; employeeCount: number }) => ({
            name: skill.name,
            employeeCount: Number(skill.employeeCount || 0),
          }))
          .sort((left: SkillListItem, right: SkillListItem) => right.employeeCount - left.employeeCount)

        setSkills(skillList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skills')
      } finally {
        setLoading(false)
      }
    }

    void fetchSkills()
  }, [])

  async function fetchSkillEmployees(skillName: string) {
    setSkillEmployeesLoadingName(skillName)
    setSkillEmployeesError(null)

    try {
      const data = await queryGraphQL(
        `
          query GetEmployeesBySkill($skillName: String!) {
            getEmployeesBySkill(skillName: $skillName) {
              employee_id
              name
              title
              department
            }
          }
        `,
        { skillName },
      )

      setSkillEmployeesByName((current) => ({
        ...current,
        [skillName]: data.getEmployeesBySkill || [],
      }))
    } catch (err) {
      setSkillEmployeesError(err instanceof Error ? err.message : 'Failed to load employees for this skill')
    } finally {
      setSkillEmployeesLoadingName((current) => (current === skillName ? null : current))
    }
  }

  function handleSkillClick(skillName: string) {
    if (selectedSkill === skillName) {
      setSelectedSkill(null)
      setSkillEmployeesError(null)
      return
    }

    setSelectedSkill(skillName)
    setSkillEmployeesError(null)

    if (!skillEmployeesByName[skillName]) {
      void fetchSkillEmployees(skillName)
    }
  }

  const filteredSkills = useMemo(
    () => skills.filter((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery, skills],
  )

  const selectedSkillSummary = selectedSkill
    ? skills.find((skill) => skill.name === selectedSkill) || null
    : null
  const selectedSkillEmployees = selectedSkill ? skillEmployeesByName[selectedSkill] || [] : []
  const isSelectedSkillLoading = Boolean(
    selectedSkill &&
    skillEmployeesLoadingName === selectedSkill &&
    !skillEmployeesByName[selectedSkill],
  )

  useEffect(() => {
    if (!skills.length) return

    const requestedSkill = searchParams.get('skill')
    if (!requestedSkill || selectedSkill === requestedSkill) return

    setSelectedSkill(requestedSkill)
    setSkillEmployeesError(null)

    if (!skillEmployeesByName[requestedSkill]) {
      void fetchSkillEmployees(requestedSkill)
    }
  }, [searchParams, selectedSkill, skillEmployeesByName, skills])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading skills"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-6 px-6">
        <section className="lg:max-w-[22rem]">
          <h2 className="font-display text-3xl font-semibold text-ink-900">Skills Directory</h2>
          <p className="mt-2 text-base leading-7 text-ink-500">
            Browse and explore skills across the organization.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <Card title="Search Skills">
              <input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </Card>

            <Card title={`All Skills (${skills.length})`}>
              <div className="max-h-[600px] space-y-1 overflow-y-auto">
                {filteredSkills.map((skill) => (
                  <button
                    key={skill.name}
                    type="button"
                    onClick={() => handleSkillClick(skill.name)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
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

          <div>
            {selectedSkill ? (
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">{selectedSkill}</h3>
                  <Badge color="blue">{selectedSkillSummary?.employeeCount || selectedSkillEmployees.length} employees</Badge>
                </div>

                {isSelectedSkillLoading ? (
                  <div className="flex min-h-[16rem] items-center justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : skillEmployeesError ? (
                  <EmptyState
                    title="Unable to load employees"
                    description={skillEmployeesError}
                  />
                ) : selectedSkillEmployees.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {selectedSkillEmployees.map((employee) => (
                      <button
                        key={employee.employee_id}
                        type="button"
                        onClick={() => { window.location.href = `/employee/${employee.employee_id}` }}
                        className="rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                      >
                        <p className="truncate font-medium text-gray-900">{employee.name}</p>
                        <p className="truncate text-sm text-gray-500">{employee.title}</p>
                        <p className="mt-1 text-xs text-gray-400">{employee.department}</p>
                      </button>
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
      </div>
  )
}

export default function SkillsPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <SkillsPageContent />
      </Suspense>
    </AppLayout>
  )
}
