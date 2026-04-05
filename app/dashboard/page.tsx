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

    let renderer: any = null
    let isMounted = true

    Promise.all([
      import('sigma'),
      import('graphology'),
      import('graphology-layout-forceatlas2')
    ]).then(([{ default: Sigma }, { default: Graph }, { default: forceAtlas2 }]) => {
      if (!isMounted) return

      const container = sigmaContainerRef.current
      if (!container) return
      container.innerHTML = ''

      const graph = new Graph()

      network.nodes.forEach((node) => {
        const isCenter = node.id === network.center?.id
        const isEmployee = node.labels.includes('Employee')
        const color = isCenter ? '#4f46e5' : isEmployee ? '#60a5fa' : '#34d399'

        graph.addNode(node.id, {
          x: Math.random(),
          y: Math.random(),
          size: isCenter ? 15 : 10,
          label: node.properties.name || node.properties.title || 'Unknown',
          color,
        })
      })

      network.relationships.forEach(rel => {
        if (!graph.hasEdge(rel.start.id, rel.end.id) && !graph.hasEdge(rel.end.id, rel.start.id)) {
          if (graph.hasNode(rel.start.id) && graph.hasNode(rel.end.id)) {
            graph.addEdge(rel.start.id, rel.end.id, {
              size: 2,
              color: '#e2e8f0',
            })
          }
        }
      })

      forceAtlas2.assign(graph, { iterations: 100, settings: { gravity: 1, scalingRatio: 5 } })

      renderer = new Sigma(graph, container, {
        renderEdgeLabels: true,
        allowInvalidContainer: true,
      })
    })

    return () => {
      isMounted = false
      if (renderer) renderer.kill()
    }
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
