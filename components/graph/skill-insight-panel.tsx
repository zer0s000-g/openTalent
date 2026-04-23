'use client'

import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

export interface SkillInsight {
  name: string
  category?: string
  employeeCount: number
  departments: Array<{
    name: string
    count: number
  }>
  relatedSkills: Array<{
    name: string
    count: number
  }>
  topEmployees: Array<{
    employee_id: string
    name: string
    title: string
    department: string
    proficiencyLevel?: string
    yearsOfExperience?: number
  }>
}

interface SkillInsightPanelProps {
  skillName: string | null
  insight: SkillInsight | null
  loading: boolean
  error: string | null
  onSelectEmployee?: (employeeId: string) => void
  onSelectRelatedSkill?: (skillName: string) => void
  onLoadSkillCluster?: (skillName: string) => void
  showClusterAction?: boolean
}

function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`
}

export function SkillInsightPanel({
  skillName,
  insight,
  loading,
  error,
  onSelectEmployee,
  onSelectRelatedSkill,
  onLoadSkillCluster,
  showClusterAction = false,
}: SkillInsightPanelProps) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-4 rounded-[28px] border border-[color:var(--border)] bg-white/72 px-6 text-center">
        <LoadingSpinner size="lg" />
        <div>
          <p className="font-medium text-ink-800">Loading skill intelligence</p>
          <p className="mt-1 text-sm text-ink-500">Pulling talent holders, departments, and adjacent skills.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50/85 p-5">
        <p className="font-medium text-rose-700">Unable to load skill insight</p>
        <p className="mt-2 text-sm text-rose-600">{error}</p>
      </div>
    )
  }

  if (!skillName) {
    return (
      <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-[28px] border border-dashed border-[color:var(--border)] bg-white/55 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 12h6m6 0h.01M8 8h8m-8 8h8" />
          </svg>
        </div>
        <p className="mt-5 font-display text-2xl font-semibold text-ink-900">Choose a skill cluster</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
          Load a skill from the left rail to see where capability sits, which departments dominate it, and which adjacent skills appear around the same people.
        </p>
      </div>
    )
  }

  if (!insight) {
    return null
  }

  const topDepartment = insight.departments[0]

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-emerald-100 bg-[radial-gradient(circle_at_top,rgba(15,155,142,0.13),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(240,252,250,0.94)_100%)] p-6 shadow-[0_18px_40px_rgba(15,155,142,0.10)]">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400 text-white shadow-lg shadow-emerald-200/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 12h6m6 0h.01M8 8h8m-8 8h8" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge color="green">{insight.category || 'Skill cluster'}</Badge>
              <Badge color="gray">{pluralize(insight.employeeCount, 'holder', 'holders')}</Badge>
              <Badge color="blue">{pluralize(insight.relatedSkills.length, 'adjacent skill', 'adjacent skills')}</Badge>
            </div>

            <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-900">{insight.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              This cluster highlights where the capability sits, who holds it most strongly, and what adjacent skills typically appear alongside it.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/72 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Coverage</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{insight.employeeCount}</p>
            <p className="text-sm text-ink-500">Employees in the current cluster</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/72 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Leading Department</p>
            <p className="mt-1 font-medium text-ink-900">{topDepartment?.name || 'Not available'}</p>
            <p className="text-sm text-ink-500">{topDepartment ? `${topDepartment.count} people in this cluster` : 'No department distribution yet'}</p>
          </div>
        </div>

        {showClusterAction && onLoadSkillCluster && (
          <div className="mt-5">
            <Button variant="secondary" className="w-full" onClick={() => onLoadSkillCluster(insight.name)}>
              Load this skill cluster
            </Button>
          </div>
        )}
      </div>

      <section className="rounded-[24px] border border-[color:var(--border)] bg-white/72 p-5 shadow-[0_8px_24px_rgba(148,163,184,0.10)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Department Footprint</p>
        {insight.departments.length > 0 ? (
          <div className="mt-4 space-y-3">
            {insight.departments.map((department) => {
              const width = Math.max(12, (department.count / Math.max(insight.employeeCount, 1)) * 100)
              return (
                <div key={department.name}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-ink-900">{department.name}</span>
                    <span className="text-ink-500">{department.count}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-500">No department coverage available for this skill.</p>
        )}
      </section>

      <section className="rounded-[24px] border border-[color:var(--border)] bg-white/72 p-5 shadow-[0_8px_24px_rgba(148,163,184,0.10)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Top Talent Holders</p>
        {insight.topEmployees.length > 0 ? (
          <div className="mt-4 space-y-3">
            {insight.topEmployees.map((employee) => (
              <button
                key={employee.employee_id}
                type="button"
                onClick={() => onSelectEmployee?.(employee.employee_id)}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/82 px-4 py-3 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink-900">{employee.name}</p>
                    <p className="mt-1 text-sm text-ink-500">{employee.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-ink-400">{employee.department}</p>
                  </div>
                  <div className="text-right">
                    {employee.proficiencyLevel && <Badge color="green">{employee.proficiencyLevel}</Badge>}
                    {typeof employee.yearsOfExperience === 'number' && (
                      <p className="mt-2 text-xs text-ink-500">{employee.yearsOfExperience.toFixed(1)} yrs</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-500">No employee holders available for this skill.</p>
        )}
      </section>

      <section className="rounded-[24px] border border-[color:var(--border)] bg-white/72 p-5 shadow-[0_8px_24px_rgba(148,163,184,0.10)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Adjacent Skills</p>
        {insight.relatedSkills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {insight.relatedSkills.map((skill) => (
              <button
                key={skill.name}
                type="button"
                onClick={() => onSelectRelatedSkill?.(skill.name)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <span>{skill.name}</span>
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-emerald-700">{skill.count}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-500">No adjacent skills were found for this cluster.</p>
        )}
      </section>
    </div>
  )
}
