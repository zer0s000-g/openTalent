'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'

interface Employee {
  employee_id: string
  name: string
  email: string
  title: string
  department: string
  location: string
  hired_date: string
  lastImportedAt?: string
  lastImportSource?: string
  lastImportBatchId?: string
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

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetEmployee($employee_id: String!) {
                employees(employee_id: $employee_id) {
                  employee_id
                  name
                  email
                  title
                  department
                  location
                  hired_date
                  lastImportedAt
                  lastImportSource
                  lastImportBatchId
                  manager {
                    employee_id
                    name
                    title
                  }
                  directReports {
                    employee_id
                    name
                    title
                  }
                  skills {
                    name
                  }
                  certifications {
                    name
                    issuer
                  }
                  education {
                    institution
                    degree
                    field
                    year
                  }
                  aspirations {
                    type
                    targetRole
                    targetDepartment
                    timeline
                  }
                }
              }
            `,
            variables: { employee_id: params.id },
          }),
        })
        const { data, errors } = await response.json()
        if (errors) throw new Error(errors[0].message)

        const employees = data.employees
        if (!employees || employees.length === 0) {
          setError('Employee not found')
        } else {
          setEmployee(employees[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employee')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [params.id])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error || !employee) {
    return (
      <AppLayout>
        <EmptyState
          title="Employee not found"
          description={error || 'The employee you are looking for does not exist.'}
          action={
            <Button onClick={() => router.push('/graph')}>
              Back to Graph Explorer
            </Button>
          }
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 px-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{employee.name}</h1>
            <p className="text-gray-500">{employee.title}</p>
            <p className="text-sm text-gray-500">{employee.department}</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/graph')}>
            Back to Explorer
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic Info */}
          <Card title="Contact Information">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Email</span>
                <p className="text-gray-900">{employee.email || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500">Location</span>
                <p className="text-gray-900">{employee.location || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-500">Hired Date</span>
                <p className="text-gray-900">
                  {employee.hired_date ? new Date(employee.hired_date).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Employee ID</span>
                <p className="text-gray-900 font-mono text-xs">{employee.employee_id}</p>
              </div>
            </div>
          </Card>

          <Card title="Data Provenance">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Last imported</span>
                <p className="text-gray-900">
                  {employee.lastImportedAt ? new Date(employee.lastImportedAt).toLocaleString() : 'Not available'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Import source</span>
                <p className="text-gray-900">{employee.lastImportSource || 'Not available'}</p>
              </div>
              <div>
                <span className="text-gray-500">Import batch</span>
                <p className="font-mono text-xs text-gray-900">{employee.lastImportBatchId || 'Not available'}</p>
              </div>
            </div>
          </Card>

          {/* Manager */}
          <Card title="Reports To">
            {employee.manager ? (
              <div
                className="cursor-pointer rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                onClick={() => employee.manager && router.push(`/employee/${employee.manager.employee_id}`)}
              >
                <p className="font-medium text-gray-900">{employee.manager.name}</p>
                <p className="text-sm text-gray-500">{employee.manager.title}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No manager (executive level)</p>
            )}
          </Card>

          {/* Direct Reports */}
          <Card title="Direct Reports">
            {employee.directReports && employee.directReports.length > 0 ? (
              <div className="space-y-2">
                {employee.directReports.map((report) => (
                  <div
                    key={report.employee_id}
                    className="cursor-pointer rounded-md border border-gray-200 p-2 hover:bg-gray-50"
                    onClick={() => router.push(`/employee/${report.employee_id}`)}
                  >
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <p className="text-xs text-gray-500">{report.title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No direct reports</p>
            )}
          </Card>

          {/* Skills */}
          <Card title="Skills">
            {employee.skills && employee.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill) => (
                  <Badge key={skill.name} color="blue">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No skills listed</p>
            )}
          </Card>

          {/* Certifications */}
          <Card title="Certifications">
            {employee.certifications && employee.certifications.length > 0 ? (
              <div className="space-y-2">
                {employee.certifications.map((cert, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium text-gray-900">{cert.name}</p>
                    {cert.issuer && <p className="text-gray-500">{cert.issuer}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No certifications listed</p>
            )}
          </Card>

          {/* Education */}
          <Card title="Education">
            {employee.education && employee.education.length > 0 ? (
              <div className="space-y-3">
                {employee.education.map((edu, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium text-gray-900">{edu.institution}</p>
                    <p className="text-gray-500">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                      {edu.year && `, ${edu.year}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No education listed</p>
            )}
          </Card>

          {/* Aspirations */}
          <Card title="Aspirations" className="md:col-span-2 lg:col-span-3">
            {employee.aspirations && employee.aspirations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {employee.aspirations.map((asp, idx) => (
                  <div key={idx} className="rounded-md border border-gray-200 p-3">
                    <Badge color="green">{asp.type}</Badge>
                    {asp.targetRole && (
                      <p className="mt-2 text-sm text-gray-700">
                        <span className="text-gray-500">Target Role:</span> {asp.targetRole}
                      </p>
                    )}
                    {asp.targetDepartment && (
                      <p className="text-sm text-gray-700">
                        <span className="text-gray-500">Target Department:</span> {asp.targetDepartment}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="text-gray-500">Timeline:</span> {asp.timeline}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No aspirations listed</p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
