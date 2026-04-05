'use client'

import { useEffect, useState, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/shared/button'

interface DashboardStats {
  totalEmployees: number
  totalSkills: number
  departments: Array<{ name: string; count: number }>
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [network, setNetwork] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sigmaContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats and organization overview in parallel
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

        if (statsData.errors) {
          throw new Error(statsData.errors[0].message)
        }
        if (networkData.errors) {
          throw new Error(networkData.errors[0].message)
        }

        const dashboardData = statsData.data?.getDashboardStats
        setStats({
          totalEmployees: dashboardData?.employeesAggregate?.count?.low ?? dashboardData?.employeesAggregate?.count ?? 0,
          totalSkills: dashboardData?.skillsAggregate?.count?.low ?? dashboardData?.skillsAggregate?.count ?? 0,
          departments: [],
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

  // Render mini graph visualization
  useEffect(() => {
    if (!network || !sigmaContainerRef.current) return

    const container = sigmaContainerRef.current
    container.innerHTML = ''

    const nodeElements: Record<string, HTMLDivElement> = {}
    const positions: Record<string, { x: number; y: number }> = {}

    const centerX = container.offsetWidth / 2
    const centerY = container.offsetHeight / 2
    const radius = Math.min(centerX, centerY) - 40

    network.nodes.forEach((node, idx) => {
      const isCenter = node.id === network.center?.id
      const angle = (idx / network.nodes.length) * Math.PI * 2
      const nodeRadius = isCenter ? 0 : radius

      positions[node.id] = {
        x: centerX + Math.cos(angle) * nodeRadius,
        y: centerY + Math.sin(angle) * nodeRadius,
      }

      const el = document.createElement('div')
      el.className = `absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110`
      el.style.left = `${positions[node.id].x}px`
      el.style.top = `${positions[node.id].y}px`

      const isEmployee = node.labels.includes('Employee')

      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="w-${isCenter ? '12' : '8'} h-${isCenter ? '12' : '8'} rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg ${
            isCenter ? 'bg-primary-600 ring-4 ring-primary-200' :
            isEmployee ? 'bg-blue-500' : 'bg-green-500'
          }">
            ${node.properties.name?.charAt(0) || '?'}
          </div>
          <span class="mt-1 text-xs text-gray-600 max-w-[80px] truncate text-center">
            ${node.properties.name?.split(' ')[0] || ''}
          </span>
        </div>
      `

      container.appendChild(el)
      nodeElements[node.id] = el
    })

    // Draw edges
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'absolute inset-0 pointer-events-none')
    svg.style.zIndex = '0'

    network.relationships.forEach(rel => {
      const start = positions[rel.start.id]
      const end = positions[rel.end.id]
      if (!start || !end) return

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', String(start.x))
      line.setAttribute('y1', String(start.y))
      line.setAttribute('x2', String(end.x))
      line.setAttribute('y2', String(end.y))
      line.setAttribute('stroke', '#cbd5e1')
      line.setAttribute('stroke-width', '2')
      svg.appendChild(line)
    })

    container.insertBefore(svg, container.firstChild)
  }, [network])

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
          title="Failed to load dashboard"
          description={error}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Workforce overview and key metrics</p>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Employees">
          <div className="text-3xl font-bold text-gray-900">
            {stats?.totalEmployees ?? 0}
          </div>
        </Card>
        <Card title="Total Skills">
          <div className="text-3xl font-bold text-gray-900">
            {stats?.totalSkills ?? 0}
          </div>
        </Card>
        <Card title="Departments">
          <div className="text-3xl font-bold text-gray-900">
            {stats?.departments.length ?? 0}
          </div>
        </Card>
        <Card title="Locations">
          <div className="text-3xl font-bold text-gray-900">-</div>
        </Card>
      </div>

      {/* Organization Overview Graph */}
      <div className="mb-6">
        <Card title="Organization Overview">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Executive hierarchy and skills (automatically generated)
            </p>
            <Button onClick={() => window.location.href = '/graph'} variant="secondary" size="sm">
              Open Graph Explorer →
            </Button>
          </div>
          {network ? (
            <div className="h-80 relative bg-gray-50 rounded-lg overflow-hidden">
              <div ref={sigmaContainerRef} className="w-full h-full" />
            </div>
          ) : (
            <EmptyState
              title="No graph data"
              description="The organization overview could not be loaded"
            />
          )}
        </Card>
      </div>

      {stats?.totalEmployees === 0 && (
        <EmptyState
          title="No employees yet"
          description="Import employee data from the Admin page to get started."
        />
      )}
    </AppLayout>
  )
}
