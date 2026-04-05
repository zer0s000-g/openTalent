'use client'

import React from 'react'
import { Badge } from '@/components/shared/badge'
import { Card } from '@/components/shared/card'
import { EmptyState } from '@/components/shared/empty-state'
import type { FootprintBreakdownItem, FootprintCity } from '@/components/location/indonesia-footprint-map'

interface LocationDetail {
  city: string
  province: string
  lat: number | null
  lng: number | null
  employeeCount: number
  departments: FootprintBreakdownItem[]
  roles: FootprintBreakdownItem[]
  topSkills: FootprintBreakdownItem[]
  employees: Array<{
    employee_id: string
    name: string
    title: string
    department: string
    location: string
  }>
}

interface LocationDetailPanelProps {
  detail: LocationDetail | null
  loading: boolean
  error: string | null
  footprint: FootprintCity[]
}

export function LocationDetailPanel({
  detail,
  loading,
  error,
  footprint,
}: LocationDetailPanelProps) {
  const topCities = [...footprint].sort((left, right) => right.employeeCount - left.employeeCount).slice(0, 4)
  const totalEmployees = footprint.reduce((sum, city) => sum + city.employeeCount, 0)

  if (!detail && loading) {
    return (
      <Card>
        <p className="section-label">City Insight</p>
        <div className="mt-6 space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <EmptyState title="Unable to load city detail" description={error} />
      </Card>
    )
  }

  if (!detail) {
    return (
      <Card>
        <p className="section-label">National Overview</p>
        <div className="mt-4 space-y-4">
          <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-5">
            <p className="font-display text-2xl font-semibold text-ink-900">Indonesia talent footprint</p>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              The map aggregates employees by Indonesian city so you can see workforce concentration, dominant roles, and capability coverage across the country.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
              <p className="text-sm font-medium text-ink-500">Mapped employees</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{totalEmployees}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
              <p className="text-sm font-medium text-ink-500">Active cities</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{footprint.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
            <p className="text-sm font-medium text-ink-500">Largest hubs</p>
            <div className="mt-3 space-y-2">
              {topCities.map((city) => (
                <div key={city.city} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-ink-900">{city.city}</span>
                  <span className="text-ink-500">{city.employeeCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">City Insight</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">{detail.city}</h3>
          <p className="mt-1 text-sm text-ink-500">{detail.province}</p>
        </div>
        <Badge color="blue">{detail.employeeCount} employees</Badge>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
            <p className="text-sm font-medium text-ink-500">Top roles</p>
            <div className="mt-3 space-y-2">
              {detail.roles.slice(0, 4).map((role) => (
                <div key={role.name} className="flex items-start justify-between gap-3 text-sm">
                  <span className="max-w-[75%] font-medium leading-6 text-ink-900">{role.name}</span>
                  <span className="shrink-0 text-ink-500">{role.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
            <p className="text-sm font-medium text-ink-500">Top skills</p>
            <div className="mt-3 space-y-2">
              {detail.topSkills.slice(0, 4).map((skill) => (
                <div key={skill.name} className="flex items-start justify-between gap-3 text-sm">
                  <span className="max-w-[75%] font-medium leading-6 text-ink-900">{skill.name}</span>
                  <span className="shrink-0 text-ink-500">{skill.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
          <p className="text-sm font-medium text-ink-500">Department mix</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.departments.map((department) => (
              <Badge key={department.name} color="gray">
                {department.name} · {department.count}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-500">Employees in {detail.city}</p>
            <span className="text-xs text-ink-400">Top 40 shown</span>
          </div>
          <div className="mt-3 space-y-2">
            {detail.employees.map((employee) => (
              <button
                key={employee.employee_id}
                type="button"
                onClick={() => { window.location.href = `/employee/${employee.employee_id}` }}
                className="flex w-full items-start justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-left transition-all hover:border-primary-200 hover:bg-primary-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{employee.name}</p>
                  <p className="mt-1 truncate text-sm text-ink-500">{employee.title}</p>
                  <p className="mt-1 text-xs text-ink-400">{employee.department}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-primary-600">Open</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
