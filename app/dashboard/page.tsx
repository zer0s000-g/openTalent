'use client'

import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Card } from '@/components/shared/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface MetricDatum {
  name: string
  count: number
}

interface DashboardStats {
  totalEmployees: number
  totalSkills: number
  totalDepartments: number
  totalLocations: number
  managerCount: number
  avgSpanOfControl: number
  avgSkillsPerEmployee: number
  topDepartments: MetricDatum[]
  topLocations: MetricDatum[]
  topSkills: MetricDatum[]
}

interface GraphNode {
  id: string
  labels: string[]
  properties: Record<string, any>
}

interface GraphRelationship {
  start: GraphNode
  end: GraphNode
  type: string
}

interface NetworkData {
  center?: GraphNode
  nodes: GraphNode[]
  relationships: GraphRelationship[]
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const candidate = value as { low?: number; toNumber?: () => number }
    if (typeof candidate.toNumber === 'function') return candidate.toNumber()
    if (typeof candidate.low === 'number') return candidate.low
  }
  return 0
}

function formatDecimal(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [network, setNetwork] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResponse, networkResponse] = await Promise.all([
          fetch('/api/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query GetDashboardStats {
                  getDashboardStats {
                    employeesAggregate { count }
                    skillsAggregate { count }
                    departments { name count }
                    locations { name count }
                    topSkills { name count }
                    managerCount
                    avgSpanOfControl
                    avgSkillsPerEmployee
                  }
                }
              `,
            }),
          }),
          fetch('/api/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
                query GetOrganizationOverview {
                  getOrganizationOverview {
                    center { id labels properties }
                    nodes { id labels properties }
                    relationships { start { id } end { id } type }
                  }
                }
              `,
            }),
          }),
        ])

        const statsData = await statsResponse.json()
        const networkData = await networkResponse.json()

        if (statsData.errors) throw new Error(statsData.errors[0].message)
        if (networkData.errors) throw new Error(networkData.errors[0].message)

        const dashboardData = statsData.data?.getDashboardStats
        const departments = (dashboardData?.departments || []).map((item: MetricDatum) => ({
          name: item.name,
          count: toNumber(item.count),
        }))
        const locations = (dashboardData?.locations || []).map((item: MetricDatum) => ({
          name: item.name,
          count: toNumber(item.count),
        }))
        const topSkills = (dashboardData?.topSkills || []).map((item: MetricDatum) => ({
          name: item.name,
          count: toNumber(item.count),
        }))

        setStats({
          totalEmployees: toNumber(dashboardData?.employeesAggregate?.count),
          totalSkills: toNumber(dashboardData?.skillsAggregate?.count),
          totalDepartments: departments.length,
          totalLocations: locations.length,
          managerCount: toNumber(dashboardData?.managerCount),
          avgSpanOfControl: Number(dashboardData?.avgSpanOfControl || 0),
          avgSkillsPerEmployee: Number(dashboardData?.avgSkillsPerEmployee || 0),
          topDepartments: departments.slice(0, 5),
          topLocations: locations.slice(0, 4),
          topSkills: topSkills.slice(0, 6),
        })
        setNetwork(networkData.data?.getOrganizationOverview)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const workforceCoverage = useMemo(() => {
    if (!stats?.totalEmployees) return 0
    return Math.round((stats.managerCount / stats.totalEmployees) * 100)
  }, [stats])

  const leadershipSnapshot = useMemo(() => {
    if (!network?.center) {
      return {
        directReports: [] as GraphNode[],
        nearbySkills: [] as GraphNode[],
        connectedDepartments: [] as string[],
        topSkill: '',
      }
    }

    const nodeMap = new Map(network.nodes.map((node) => [node.id, node]))
    const reportIds = new Set<string>()
    const skillIds = new Set<string>()

    network.relationships.forEach((relationship) => {
      if (relationship.type === 'REPORTS_TO' && relationship.end.id === network.center?.id) {
        reportIds.add(relationship.start.id)
      }
    })

    network.relationships.forEach((relationship) => {
      if (relationship.type === 'HAS_SKILL') {
        if (reportIds.has(relationship.start.id)) {
          skillIds.add(relationship.end.id)
        }

        if (relationship.start.id === network.center?.id) {
          skillIds.add(relationship.end.id)
        }
      }
    })

    const directReports = [...reportIds]
      .map((id) => nodeMap.get(id))
      .filter((node): node is GraphNode => Boolean(node))
      .slice(0, 8)

    const nearbySkills = [...skillIds]
      .map((id) => nodeMap.get(id))
      .filter((node): node is GraphNode => Boolean(node))
      .slice(0, 4)

    const connectedDepartments = [...new Set(
      directReports
        .map((node) => String(node.properties.department || ''))
        .filter(Boolean),
    )]

    return {
      directReports,
      nearbySkills,
      connectedDepartments,
      topSkill: nearbySkills[0]?.properties?.name ? String(nearbySkills[0].properties.name) : '',
    }
  }, [network])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <EmptyState title="Failed to load dashboard" description={error} />
      </AppLayout>
    )
  }

  if (!stats) {
    return (
      <AppLayout>
        <EmptyState title="No workforce data available" description="Import employee data to populate the command center." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="grid gap-6 px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="surface-panel overflow-hidden rounded-[32px] p-8 lg:p-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="section-label">Welcome to OpenTalent AirNav</p>
                <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink-900 text-balance lg:text-[3.25rem]">
                  Explore how our people, skills, and roles are connected across AirNav Indonesia.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
                  Use this workspace to understand organizational structure, discover expertise, and see how talent is distributed across teams and locations.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => { window.location.href = '/graph' }}>
                  Explore talent graph
                </Button>
                <Button variant="secondary" onClick={() => { window.location.href = '/skills' }}>
                  View skills intelligence
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] bg-ink-900 p-5 text-white shadow-panel">
                <p className="text-sm text-slate-300">Active employees</p>
                <p className="mt-3 font-display text-4xl font-semibold">{stats.totalEmployees}</p>
                <p className="mt-4 text-sm text-slate-300">Unified workforce record now mapped into the talent graph.</p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/82 p-5">
                <p className="text-sm text-ink-500">Skills in graph</p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink-900">{stats.totalSkills}</p>
                <p className="mt-4 text-sm text-ink-500">{formatDecimal(stats.avgSkillsPerEmployee)} skills captured per employee on average.</p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/82 p-5">
                <p className="text-sm text-ink-500">Departments mapped</p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink-900">{stats.totalDepartments}</p>
                <p className="mt-4 text-sm text-ink-500">Coverage spans {stats.totalLocations} active locations across the organization.</p>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white/82 p-5">
                <p className="text-sm text-ink-500">Managers in network</p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink-900">{stats.managerCount}</p>
                <p className="mt-4 text-sm text-ink-500">Average span of control is {formatDecimal(stats.avgSpanOfControl)} direct reports.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel rounded-[32px] p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Workforce Pulse</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">What leaders can understand quickly</h3>
            </div>
            <Badge color="blue">Live summary</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] bg-primary-50 p-5">
              <p className="text-sm font-semibold text-primary-800">Managerial coverage</p>
              <div className="mt-3 h-2 rounded-full bg-primary-100">
                <div className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.min(workforceCoverage, 100)}%` }} />
              </div>
              <p className="mt-3 text-sm text-primary-900">
                {workforceCoverage}% of employees appear in a managed reporting structure.
              </p>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
              <p className="text-sm font-semibold text-ink-900">Most represented location</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-900">
                {stats.topLocations[0]?.name || 'Not available'}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {stats.topLocations[0]?.count || 0} employees mapped in the leading geography.
              </p>
            </div>

            <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
              <p className="text-sm font-semibold text-ink-900">Top skill signal</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-900">
                {stats.topSkills[0]?.name || 'Not available'}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {stats.topSkills[0]?.count || 0} employees share the highest-signal skill cluster.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 px-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-label">Organization Overview</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">Leadership network snapshot</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                  Review the immediate leadership circle, the skills showing up nearby, and the functions most connected to the executive hub.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge color="blue">{leadershipSnapshot.directReports.length} direct reports</Badge>
                <Badge color="green">{leadershipSnapshot.connectedDepartments.length} functions</Badge>
                <Badge color="gray">{leadershipSnapshot.nearbySkills.length} nearby skills</Badge>
              </div>
            </div>

            {network ? (
              <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[radial-gradient(circle_at_top,rgba(63,115,230,0.10),transparent_30%),linear-gradient(180deg,#f9fbff_0%,#f2f6fb_100%)]">
                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-[24px] border border-white/75 bg-grid-fade bg-[size:34px_34px] bg-center p-6">
                    <div className="mx-auto flex max-w-[28rem] flex-col items-center">
                      <div className="flex flex-wrap justify-center gap-3">
                        {leadershipSnapshot.nearbySkills.map((skill) => (
                          <div
                            key={skill.id}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm"
                          >
                            {String(skill.properties.name || 'Skill')}
                          </div>
                        ))}
                      </div>

                      <div className="relative mt-8 flex h-[17rem] w-full items-center justify-center">
                        {leadershipSnapshot.directReports.map((report, index) => {
                          const angle = (index / Math.max(leadershipSnapshot.directReports.length, 1)) * Math.PI * 2
                          const x = 50 + Math.cos(angle) * 34
                          const y = 50 + Math.sin(angle) * 34
                          const initials = String(report.properties.name || '?')
                            .split(' ')
                            .slice(0, 2)
                            .map((part) => part.charAt(0))
                            .join('')
                            .toUpperCase()

                          return (
                            <div
                              key={report.id}
                              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                              style={{ left: `${x}%`, top: `${y}%` }}
                            >
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white shadow-lg shadow-primary-900/20">
                                {initials}
                              </div>
                              <span className="max-w-[6.5rem] text-center text-xs font-medium leading-4 text-ink-600">
                                {String(report.properties.name || '')}
                              </span>
                            </div>
                          )
                        })}

                        <div className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-ink-900 to-primary-700 text-white shadow-xl shadow-primary-900/25">
                          <span className="text-2xl font-semibold">
                            {String(network.center?.properties?.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {leadershipSnapshot.connectedDepartments.slice(0, 4).map((department) => (
                          <span
                            key={department}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600"
                          >
                            {department}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[24px] border border-white/80 bg-white/90 p-5">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Leadership hub</p>
                      <p className="mt-2 font-display text-xl font-semibold text-ink-900">
                        {network.center?.properties?.name || 'Executive network'}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {network.center?.properties?.title || 'Executive anchor'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Direct reports</p>
                        <p className="mt-2 font-display text-2xl font-semibold text-ink-900">{leadershipSnapshot.directReports.length}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Top nearby skill</p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">{leadershipSnapshot.topSkill || 'Not mapped'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Connected functions</p>
                      <p className="mt-2 text-sm leading-6 text-ink-700">
                        {leadershipSnapshot.connectedDepartments.slice(0, 4).join(', ') || 'Function mix not available'}
                      </p>
                    </div>

                    <Button className="w-full" onClick={() => { window.location.href = '/graph' }}>
                      Open full talent graph
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="No graph data" description="The organization overview could not be loaded." />
            )}
          </div>
        </Card>

        <Card>
          <p className="section-label">Department Mix</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">Where the workforce is concentrated</h3>
          <div className="mt-6 space-y-4">
            {stats.topDepartments.map((department) => {
              const width = stats.totalEmployees ? Math.max((department.count / stats.totalEmployees) * 100, 8) : 0
              return (
                <div key={department.name}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="truncate text-sm font-medium text-ink-700">{department.name}</p>
                    <p className="text-sm text-ink-500">{department.count}</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-cyan-400" style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 px-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-label">Skills Momentum</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">Most visible skills in the graph</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { window.location.href = '/skills' }}>
              Open skills page
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {stats.topSkills.map((skill, index) => (
              <div
                key={skill.name}
                className={`rounded-2xl px-4 py-3 ${index < 2 ? 'bg-ink-900 text-white' : 'border border-[color:var(--border)] bg-white/90 text-ink-700'}`}
              >
                <p className="text-sm font-semibold">{skill.name}</p>
                <p className={`mt-1 text-xs ${index < 2 ? 'text-slate-300' : 'text-ink-500'}`}>{skill.count} employees</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="section-label">Location Footprint</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">Geographic distribution at a glance</h3>
          <div className="mt-6 space-y-3">
            {stats.topLocations.map((location) => (
              <div key={location.name} className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                <div>
                  <p className="font-medium text-ink-800">{location.name}</p>
                  <p className="text-sm text-ink-500">Active employee cluster</p>
                </div>
                <Badge color="gray">{location.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
