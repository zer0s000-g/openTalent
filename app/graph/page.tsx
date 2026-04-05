'use client'

import { useEffect, useState, useRef } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/shared/button'
import { Badge } from '@/components/shared/badge'

interface GraphNode {
  id: string
  labels: string[]
  properties: Record<string, string>
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

export default function GraphExplorerPage() {
  const [network, setNetwork] = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [viewMode, setViewMode] = useState<'employee' | 'department' | 'skill'>('employee')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const sigmaContainerRef = useRef<HTMLDivElement>(null)

  // Fetch network for an employee
  const fetchEmployeeNetwork = async (employeeId: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetEmployeeNetwork($employee_id: String!) {
              getEmployeeNetwork(employee_id: $employee_id) {
                center {
                  id
                  labels
                  properties
                }
                nodes {
                  id
                  labels
                  properties
                }
                relationships {
                  start {
                    id
                    labels
                    properties
                  }
                  end {
                    id
                    labels
                    properties
                  }
                  type
                }
              }
            }
          `,
          variables: { employee_id: employeeId },
        }),
      })
      const { data, errors } = await response.json()
      if (errors) throw new Error(errors[0].message)
      setNetwork(data.getEmployeeNetwork)
      setSelectedNode(data.getEmployeeNetwork.center || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load network')
    } finally {
      setLoading(false)
    }
  }

  // Fetch department subgraph
  const fetchDepartmentSubgraph = async (department: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetDepartmentSubgraph($department: String!) {
              getDepartmentSubgraph(department: $department) {
                center {
                  id
                  labels
                  properties
                }
                nodes {
                  id
                  labels
                  properties
                }
                relationships {
                  start {
                    id
                    labels
                    properties
                  }
                  end {
                    id
                    labels
                    properties
                  }
                  type
                }
              }
            }
          `,
          variables: { department },
        }),
      })
      const { data, errors } = await response.json()
      if (errors) throw new Error(errors[0].message)
      setNetwork(data.getDepartmentSubgraph)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department graph')
    } finally {
      setLoading(false)
    }
  }

  // Fetch skill subgraph
  const fetchSkillSubgraph = async (skillName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetSkillSubgraph($skillName: String!) {
              getSkillSubgraph(skillName: $skillName) {
                center {
                  id
                  labels
                  properties
                }
                nodes {
                  id
                  labels
                  properties
                }
                relationships {
                  start {
                    id
                    labels
                    properties
                  }
                  end {
                    id
                    labels
                    properties
                  }
                  type
                }
              }
            }
          `,
          variables: { skillName },
        }),
      })
      const { data, errors } = await response.json()
      if (errors) throw new Error(errors[0].message)
      setNetwork(data.getSkillSubgraph)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill graph')
    } finally {
      setLoading(false)
    }
  }

  // Fetch organization overview (default view)
  const fetchOrganizationOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetOrganizationOverview {
              getOrganizationOverview {
                center {
                  id
                  labels
                  properties
                }
                nodes {
                  id
                  labels
                  properties
                }
                relationships {
                  start {
                    id
                    labels
                    properties
                  }
                  end {
                    id
                    labels
                    properties
                  }
                  type
                }
              }
            }
          `,
        }),
      })
      const { data, errors } = await response.json()
      if (errors) throw new Error(errors[0].message)
      setNetwork(data.getOrganizationOverview)
      if (data.getOrganizationOverview?.center) {
        setSelectedNode(data.getOrganizationOverview.center)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization overview')
    } finally {
      setLoading(false)
    }
  }

  // Load default graph on mount
  useEffect(() => {
    fetchOrganizationOverview()
  }, [])

  // Search employees
  const searchEmployees = async (query: string) => {
    if (!query.trim()) return
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query SearchEmployees($query: String!) {
              searchEmployees(query: $query, limit: 10) {
                employee_id
                name
                title
                department
              }
            }
          `,
          variables: { query },
        }),
      })
      const { data } = await response.json()
      return data.searchEmployees || []
    } catch {
      return []
    }
  }

  // Handle search
  const handleSearch = async () => {
    const results = await searchEmployees(searchQuery)
    if (results.length > 0) {
      setSelectedEmployeeId(results[0].employee_id)
      fetchEmployeeNetwork(results[0].employee_id)
    }
  }

  // Get unique departments
  const departments = network?.nodes
    .filter(n => n.labels.includes('Employee'))
    .map(n => n.properties.department)
    .filter((v, i, a) => v && a.indexOf(v) === i)

  // Get unique skills
  const skills = network?.nodes
    .filter(n => n.labels.includes('Skill'))
    .map(n => n.properties.name)

  useEffect(() => {
    // Simple visualization using DOM elements (will be enhanced with Sigma.js)
    if (!network || !sigmaContainerRef.current) return

    const container = sigmaContainerRef.current
    container.innerHTML = ''

    // Create a simple force-directed layout visualization
    const nodeElements: Record<string, HTMLDivElement> = {}
    const positions: Record<string, { x: number; y: number }> = {}

    // Initialize positions randomly in a circle
    const centerX = container.offsetWidth / 2
    const centerY = container.offsetHeight / 2
    const radius = Math.min(centerX, centerY) - 80

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
          <div class="w-${isCenter ? '16' : '10'} h-${isCenter ? '16' : '10'} rounded-full flex items-center justify-center text-white text-xs font-medium shadow-lg ${
            isCenter ? 'bg-primary-600 ring-4 ring-primary-200' :
            isEmployee ? 'bg-blue-500' :
            'bg-green-500'
          }">
            ${node.properties.name?.charAt(0) || '?'}
          </div>
          <span class="mt-1 text-xs text-gray-700 max-w-[100px] truncate text-center">
            ${node.properties.name || node.properties.title || 'Unknown'}
          </span>
        </div>
      `

      el.onclick = () => setSelectedNode(node)
      container.appendChild(el)
      nodeElements[node.id] = el
    })

    // Draw edges using SVG
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

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] gap-6">
        {/* Left panel - Controls */}
        <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto">
          <Card title="Graph Explorer">
            <p className="text-sm text-gray-500">
              Organization overview shown by default. Search or select a view to explore.
            </p>
          </Card>

          {/* View Mode Selection */}
          <Card title="View Mode">
            <div className="space-y-3">
              <button
                onClick={() => setViewMode('employee')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  viewMode === 'employee' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                }`}
              >
                Employee Network
              </button>
              <button
                onClick={() => setViewMode('department')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  viewMode === 'department' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                }`}
              >
                Department View
              </button>
              <button
                onClick={() => setViewMode('skill')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  viewMode === 'skill' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                }`}
              >
                Skill View
              </button>
            </div>
          </Card>

          {/* Employee Search */}
          {viewMode === 'employee' && (
            <Card title="Find Employee">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <div className="text-sm text-gray-500">Or enter Employee ID:</div>
                <input
                  type="text"
                  placeholder="e.g., EMP0001"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button
                  onClick={() => fetchEmployeeNetwork(selectedEmployeeId)}
                  disabled={!selectedEmployeeId || loading}
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'Load Network'}
                </Button>
              </div>
            </Card>
          )}

          {/* Department Selection */}
          {viewMode === 'department' && (
            <Card title="Select Department">
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  if (e.target.value) fetchDepartmentSubgraph(e.target.value)
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Choose a department...</option>
                {departments?.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Shows reporting structure within the department
              </p>
            </Card>
          )}

          {/* Skill Selection */}
          {viewMode === 'skill' && (
            <Card title="Select Skill">
              <select
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value)
                  if (e.target.value) fetchSkillSubgraph(e.target.value)
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="">Choose a skill...</option>
                {skills?.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Shows all employees with this skill
              </p>
            </Card>
          )}

          {/* Legend */}
          <Card title="Legend">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary-600"></div>
                <span>Selected / Center</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Employee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <span>Relationship</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Center - Graph Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 relative overflow-hidden" title="Graph Visualization">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {error && (
              <EmptyState
                title="Error loading graph"
                description={error}
              />
            )}

            {!network && !loading && !error && (
              <EmptyState
                title="No graph loaded"
                description="The organization overview should load automatically. Select a different view mode or search for an employee to explore specific networks."
              />
            )}

            <div ref={sigmaContainerRef} className="w-full h-full bg-gray-50 rounded-lg" />
          </Card>

          {/* Network stats */}
          {network && (
            <div className="grid grid-cols-3 gap-4">
              <Card title="Nodes">
                <div className="text-2xl font-bold text-gray-900">{network.nodes.length}</div>
              </Card>
              <Card title="Relationships">
                <div className="text-2xl font-bold text-gray-900">{network.relationships.length}</div>
              </Card>
              <Card title="Center Node">
                <div className="text-sm text-gray-700 truncate">
                  {network.center?.properties?.name || 'None'}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right panel - Node Details */}
        <div className="w-80 flex-shrink-0">
          <Card title="Node Details">
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2 mb-2">
                    {selectedNode.labels.map(label => (
                      <Badge key={label} color={label.includes('Employee') ? 'blue' : 'green'}>
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedNode.properties.name || selectedNode.properties.title || 'Unknown'}
                  </h3>
                </div>

                <div className="space-y-2">
                  {Object.entries(selectedNode.properties).map(([key, value]) => {
                    if (value && key !== 'name' && key !== 'title') {
                      return (
                        <div key={key}>
                          <span className="text-xs text-gray-500 uppercase">{key.replace(/_/g, ' ')}</span>
                          <p className="text-sm text-gray-900">{String(value)}</p>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>

                {selectedNode.labels.includes('Employee') && selectedNode.properties.employee_id && (
                  <Button
                    onClick={() => window.location.href = `/employee/${selectedNode.properties.employee_id}`}
                    className="w-full"
                  >
                    View Profile
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Click on a node to see its details
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
