'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

export interface EmployeeDetail {
  employee_id: string
  name: string
  email: string
  title: string
  department: string
  location: string
  hired_date: string
  manager?: {
    employee_id: string
    name: string
    title: string
  }
  directReports?: Array<{
    employee_id: string
    name: string
    title: string
  }>
  skills?: Array<{
    name: string
    proficiencyLevel?: string
    yearsOfExperience?: number
  }>
  certifications?: Array<{
    name: string
    issuer?: string
    expiryDate?: string
  }>
  education?: Array<{
    institution: string
    degree: string
    field: string
    year: number
  }>
  aspirations?: Array<{
    type: string
    targetRole?: string
    targetDepartment?: string
    timeline: string
  }>
}

interface EmployeeDetailDrawerProps {
  employee: EmployeeDetail | null
  loading: boolean
  error: string | null
  onClose: () => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function formatDate(value?: string) {
  if (!value) return 'Not provided'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function DrawerSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-[color:var(--border)] bg-white/72 p-5 shadow-[0_8px_24px_rgba(148,163,184,0.10)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function EmployeeDetailDrawer({
  employee,
  loading,
  error,
  onClose,
}: EmployeeDetailDrawerProps) {
  const router = useRouter()

  return (
    <aside className="surface-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(244,247,252,0.94)_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-white/90 px-6 py-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Employee Lens</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink-900">
              {employee?.name || 'Employee details'}
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              {employee ? 'Inspect the selected person without leaving the graph.' : 'Select an employee node to open a richer profile view.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close employee details"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white/90 text-ink-600 transition-colors hover:bg-primary-50 hover:text-ink-900"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {loading && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <LoadingSpinner size="lg" />
            <div>
              <p className="font-medium text-ink-800">Loading employee details</p>
              <p className="mt-1 text-sm text-ink-500">Pulling role, org, and profile context into the drawer.</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50/80 p-5">
            <p className="font-medium text-rose-700">Unable to load employee details</p>
            <p className="mt-2 text-sm text-rose-600">{error}</p>
          </div>
        )}

        {!loading && !error && !employee && (
          <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-[color:var(--border)] bg-white/55 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-50 text-primary-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
              </svg>
            </div>
            <p className="mt-5 font-display text-2xl font-semibold text-ink-900">Choose an employee node</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
              Click any employee node or label in full screen mode to open a focused profile drawer with reporting context, skills, credentials, and aspirations.
            </p>
          </div>
        )}

        {!loading && !error && employee && (
          <div className="space-y-5">
            <div className="rounded-[28px] border border-primary-100 bg-[radial-gradient(circle_at_top,rgba(63,115,230,0.12),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,249,255,0.94)_100%)] p-6 shadow-[0_16px_40px_rgba(63,115,230,0.10)]">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary-500 via-primary-400 to-cyan-400 font-display text-xl font-semibold text-white shadow-lg shadow-primary-200/70">
                  {getInitials(employee.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge color="blue">{employee.department || 'Department'}</Badge>
                    <Badge color="gray">{employee.employee_id}</Badge>
                    {employee.directReports && employee.directReports.length > 0 && (
                      <Badge color="green">{employee.directReports.length} direct reports</Badge>
                    )}
                  </div>

                  <h4 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-900">
                    {employee.name}
                  </h4>
                  <p className="mt-1 text-base text-ink-600">{employee.title || 'Role not provided'}</p>
                  <p className="mt-4 text-sm leading-6 text-ink-500">
                    {employee.email || 'No email on file'} · {employee.location || 'Location not provided'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Reports To</p>
                  <p className="mt-1 font-medium text-ink-900">{employee.manager?.name || 'Executive level'}</p>
                  <p className="text-sm text-ink-500">{employee.manager?.title || 'No manager assigned'}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Hired</p>
                  <p className="mt-1 font-medium text-ink-900">{formatDate(employee.hired_date)}</p>
                  <p className="text-sm text-ink-500">Location: {employee.location || 'Not provided'}</p>
                </div>
              </div>

              <div className="mt-5">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => { router.push(`/employee/${employee.employee_id}`) }}
                >
                  Open full employee profile
                </Button>
              </div>
            </div>

            <DrawerSection title="Skills">
              {employee.skills && employee.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {employee.skills.slice(0, 12).map((skill) => (
                    <Badge key={skill.name} color="blue">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-500">No skills listed for this employee.</p>
              )}
            </DrawerSection>

            <DrawerSection title="Org Context">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Manager</p>
                  <p className="mt-1 font-medium text-ink-900">{employee.manager?.name || 'No manager assigned'}</p>
                  <p className="text-sm text-ink-500">{employee.manager?.title || 'Executive level'}</p>
                </div>

                <div className="border-t border-[color:var(--border)] pt-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Direct Reports</p>
                  {employee.directReports && employee.directReports.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {employee.directReports.slice(0, 6).map((report) => (
                        <div key={report.employee_id} className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
                          <p className="font-medium text-ink-900">{report.name}</p>
                          <p className="mt-1 text-sm text-ink-500">{report.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-500">No direct reports.</p>
                  )}
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Credentials">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Certifications</p>
                  {employee.certifications && employee.certifications.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {employee.certifications.map((cert, index) => (
                        <div key={`${cert.name}-${index}`} className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
                          <p className="font-medium text-ink-900">{cert.name}</p>
                          <p className="mt-1 text-sm text-ink-500">{cert.issuer || 'Issuer not provided'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-500">No certifications listed.</p>
                  )}
                </div>

                <div className="border-t border-[color:var(--border)] pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Education</p>
                  {employee.education && employee.education.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {employee.education.map((education, index) => (
                        <div key={`${education.institution}-${index}`} className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
                          <p className="font-medium text-ink-900">{education.institution}</p>
                          <p className="mt-1 text-sm text-ink-500">
                            {education.degree} {education.field ? `in ${education.field}` : ''}{education.year ? `, ${education.year}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-500">No education listed.</p>
                  )}
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Growth Signals">
              {employee.aspirations && employee.aspirations.length > 0 ? (
                <div className="space-y-3">
                  {employee.aspirations.map((aspiration, index) => (
                    <div key={`${aspiration.type}-${index}`} className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge color="green">{aspiration.type}</Badge>
                        <Badge color="gray">{aspiration.timeline}</Badge>
                      </div>
                      {aspiration.targetRole && (
                        <p className="mt-3 text-sm text-ink-700">
                          <span className="text-ink-400">Target role:</span> {aspiration.targetRole}
                        </p>
                      )}
                      {aspiration.targetDepartment && (
                        <p className="mt-1 text-sm text-ink-700">
                          <span className="text-ink-400">Target department:</span> {aspiration.targetDepartment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-500">No aspirations listed for this employee.</p>
              )}
            </DrawerSection>
          </div>
        )}
      </div>
    </aside>
  )
}
