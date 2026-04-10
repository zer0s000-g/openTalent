'use client'

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Card } from '@/components/shared/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GraphCanvas } from '@/components/graph/graph-canvas'
import type { GraphCanvasHandle } from '@/components/graph/graph-canvas'
import { EmployeeDetailDrawer } from '@/components/graph/employee-detail-drawer'
import type { EmployeeDetail } from '@/components/graph/employee-detail-drawer'
import { SkillInsightPanel } from '@/components/graph/skill-insight-panel'
import type { SkillInsight } from '@/components/graph/skill-insight-panel'
import type { GraphNode, NetworkResult } from '@/lib/graph-formatters'
import {
  getConnectedNodeIds,
  getNodeKind,
  getNodeLabel,
  shapeNetworkPayload,
} from '@/lib/graph-formatters'

interface SearchResult {
  employee_id: string
  name: string
  title: string
  department: string
}

interface MetricOption {
  name: string
  count: number
}

type ViewMode = 'enterprise' | 'employee' | 'department' | 'skill'
type ActiveGraphMode = 'enterprise' | ViewMode

function FullscreenIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3H3v4M13 3h4v4M17 13v4h-4M3 13v4h4" />
      {expanded ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7 3 3m10 4 4-4m-4 10 4 4M7 13l-4 4" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 3 3 7m10-4 4 4m-4 10 4-4M7 17l-4-4" />
      )}
    </svg>
  )
}

function toCount(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') {
    const candidate = value as { low?: number; toNumber?: () => number }
    if (typeof candidate.toNumber === 'function') return candidate.toNumber()
    if (typeof candidate.low === 'number') return candidate.low
  }
  return 0
}

async function queryGraphQL(query: string, variables?: Record<string, unknown>) {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const payload = await response.json()
  if (payload.errors) throw new Error(payload.errors[0].message)
  return payload.data
}

function GraphExplorerPageContent() {
  const searchParams = useSearchParams()
  const [network, setNetwork] = useState<NetworkResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('enterprise')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [departments, setDepartments] = useState<MetricOption[]>([])
  const [skills, setSkills] = useState<MetricOption[]>([])
  const [activeGraphMode, setActiveGraphMode] = useState<ActiveGraphMode>('enterprise')
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false)
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null)
  const [employeeDetailsById, setEmployeeDetailsById] = useState<Record<string, EmployeeDetail>>({})
  const [employeeDetailsLoadingId, setEmployeeDetailsLoadingId] = useState<string | null>(null)
  const [employeeDetailsError, setEmployeeDetailsError] = useState<string | null>(null)
  const [skillInsightsByName, setSkillInsightsByName] = useState<Record<string, SkillInsight>>({})
  const [skillInsightLoadingName, setSkillInsightLoadingName] = useState<string | null>(null)
  const [skillInsightError, setSkillInsightError] = useState<string | null>(null)
  const canvasRef = useRef<GraphCanvasHandle>(null)
  const handledRouteSearchRef = useRef<string>('')

  const loadNetwork = useCallback(async (
    query: string,
    rootField: string,
    variables?: Record<string, unknown>,
    graphMode: ActiveGraphMode = 'employee',
    selectCenter = true,
  ) => {
    setLoading(true)
    setError(null)

    try {
      const data = await queryGraphQL(query, variables)
      const shaped = shapeNetworkPayload(data[rootField])
      setNetwork(shaped)
      setSelectedNode(selectCenter ? shaped.center || shaped.nodes[0] || null : null)
      setHoveredNodeId(null)
      setActiveGraphMode(graphMode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEnterpriseGraphOverview = useCallback(async () => {
    await loadNetwork(
      `
        query GetEnterpriseGraphOverview {
          getEnterpriseGraphOverview {
            center { id labels properties }
            nodes { id labels properties }
            relationships { start { id } end { id } type }
          }
        }
      `,
      'getEnterpriseGraphOverview',
      undefined,
      'enterprise',
      false,
    )
  }, [loadNetwork])

  const fetchEmployeeNetwork = useCallback(async (employeeId: string) => {
    if (!employeeId) return
    await loadNetwork(
      `
        query GetEmployeeNetwork($employee_id: String!) {
          getEmployeeNetwork(employee_id: $employee_id) {
            center { id labels properties }
            nodes { id labels properties }
            relationships { start { id } end { id } type }
          }
        }
      `,
      'getEmployeeNetwork',
      { employee_id: employeeId },
      'employee',
    )
  }, [loadNetwork])

  const fetchDepartmentSubgraph = useCallback(async (department: string) => {
    if (!department) return
    await loadNetwork(
      `
        query GetDepartmentSubgraph($department: String!) {
          getDepartmentSubgraph(department: $department) {
            center { id labels properties }
            nodes { id labels properties }
            relationships { start { id } end { id } type }
          }
        }
      `,
      'getDepartmentSubgraph',
      { department },
      'department',
    )
  }, [loadNetwork])

  const fetchSkillSubgraph = useCallback(async (skillName: string) => {
    if (!skillName) return
    await loadNetwork(
      `
        query GetSkillSubgraph($skillName: String!) {
          getSkillSubgraph(skillName: $skillName) {
            center { id labels properties }
            nodes { id labels properties }
            relationships { start { id } end { id } type }
          }
        }
      `,
      'getSkillSubgraph',
      { skillName },
      'skill',
    )
  }, [loadNetwork])

  const selectGraphNode = (node: GraphNode) => {
    setSelectedNode(node)
    setHoveredNodeId(null)

    const nodeKind = getNodeKind(node)
    const nodeName = typeof node.properties.name === 'string' ? node.properties.name : ''

    if (nodeKind === 'employee' && typeof node.properties.employee_id === 'string') {
      setSelectedEmployeeId(node.properties.employee_id)
    }

    if (nodeKind === 'department' && nodeName) {
      setSelectedDepartment(nodeName)
    }

    if (nodeKind === 'skill' && nodeName) {
      setSelectedSkill(nodeName)
    }

    if (!isGraphFullscreen) return

    if (nodeKind === 'employee' && typeof node.properties.employee_id === 'string') {
      setDetailEmployeeId(node.properties.employee_id)
      setEmployeeDetailsError(null)
      return
    }

    setDetailEmployeeId(null)
    setEmployeeDetailsError(null)
  }

  const searchEmployees = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const data = await queryGraphQL(
        `
          query SearchEmployees($query: String!) {
            searchEmployees(query: $query, limit: 8) {
              employee_id
              name
              title
              department
            }
          }
        `,
        { query },
      )

      setSearchResults(data.searchEmployees || [])
    } catch {
      setSearchResults([])
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const [statsData, skillsData, enterpriseData] = await Promise.all([
          queryGraphQL(`
            query GraphFilterDepartments {
              getDashboardStats {
                departments { name count }
              }
            }
          `),
          queryGraphQL(`
            query GetSkills {
              skills {
                name
                employeeCount
              }
            }
          `),
          queryGraphQL(`
            query GetEnterpriseGraphOverview {
              getEnterpriseGraphOverview {
                center { id labels properties }
                nodes { id labels properties }
                relationships { start { id } end { id } type }
              }
            }
          `),
        ])

        setDepartments(
          (statsData.getDashboardStats?.departments || [])
            .filter((item: MetricOption) => item.name)
            .map((item: MetricOption) => ({ name: item.name, count: toCount(item.count) })),
        )
        setSkills(
          (skillsData.skills || [])
            .filter((item: { name: string; employeeCount: unknown }) => item.name)
            .map((item: { name: string; employeeCount: unknown }) => ({
              name: item.name,
              count: toCount(item.employeeCount),
            })),
        )
        const shaped = shapeNetworkPayload(enterpriseData.getEnterpriseGraphOverview)
        setNetwork(shaped)
        setSelectedNode(null)
        setHoveredNodeId(null)
        setActiveGraphMode('enterprise')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize graph explorer')
      } finally {
        setBootstrapping(false)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (bootstrapping) return

    const requestedEmployeeId = searchParams.get('employeeId')
    const requestedDepartment = searchParams.get('department')
    const requestedSkill = searchParams.get('skill')
    const requestedMode = searchParams.get('mode')
    const requestKey = JSON.stringify({
      mode: requestedMode,
      employeeId: requestedEmployeeId,
      department: requestedDepartment,
      skill: requestedSkill,
    })

    if (handledRouteSearchRef.current === requestKey) return
    handledRouteSearchRef.current = requestKey

    if (requestedEmployeeId) {
      setViewMode('employee')
      setSelectedEmployeeId(requestedEmployeeId)
      void fetchEmployeeNetwork(requestedEmployeeId)
      return
    }

    if (requestedDepartment) {
      setViewMode('department')
      setSelectedDepartment(requestedDepartment)
      void fetchDepartmentSubgraph(requestedDepartment)
      return
    }

    if (requestedSkill) {
      setViewMode('skill')
      setSelectedSkill(requestedSkill)
      void fetchSkillSubgraph(requestedSkill)
      return
    }

    if (requestedMode === 'enterprise' && activeGraphMode !== 'enterprise') {
      setViewMode('enterprise')
      void fetchEnterpriseGraphOverview()
    }
  }, [activeGraphMode, bootstrapping, fetchDepartmentSubgraph, fetchEmployeeNetwork, fetchEnterpriseGraphOverview, fetchSkillSubgraph, searchParams])

  useEffect(() => {
    if (!isGraphFullscreen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGraphFullscreen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isGraphFullscreen])

  useEffect(() => {
    if (!isGraphFullscreen) {
      setDetailEmployeeId(null)
      setEmployeeDetailsError(null)
    }
  }, [isGraphFullscreen])

  useEffect(() => {
    if (!isGraphFullscreen || !detailEmployeeId || employeeDetailsById[detailEmployeeId]) return

    let cancelled = false

    async function fetchEmployeeDetail(employeeId: string) {
      setEmployeeDetailsLoadingId(employeeId)
      setEmployeeDetailsError(null)

      try {
        const data = await queryGraphQL(
          `
            query GetEmployeeDetail($employee_id: String!) {
              employees(employee_id: $employee_id) {
                employee_id
                name
                email
                title
                department
                location
                hired_date
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
          { employee_id: employeeId },
        )

        if (cancelled) return

        const employee = data.employees?.[0]
        if (!employee) {
          setEmployeeDetailsError('Employee details were not found for the selected node.')
          return
        }

        setEmployeeDetailsById((current) => ({
          ...current,
          [employeeId]: employee as EmployeeDetail,
        }))
      } catch (err) {
        if (!cancelled) {
          setEmployeeDetailsError(err instanceof Error ? err.message : 'Failed to load employee details')
        }
      } finally {
        if (!cancelled) {
          setEmployeeDetailsLoadingId((current) => (current === employeeId ? null : current))
        }
      }
    }

    void fetchEmployeeDetail(detailEmployeeId)

    return () => {
      cancelled = true
    }
  }, [detailEmployeeId, employeeDetailsById, isGraphFullscreen])

  const activeVisualNetwork = activeGraphMode === viewMode ? network : null

  const visibleNodeIds = new Set(activeVisualNetwork?.nodes.map((node) => node.id) || [])
  const focusNode = activeVisualNetwork
    ? selectedNode && visibleNodeIds.has(selectedNode.id)
      ? selectedNode
      : activeVisualNetwork.center || activeVisualNetwork.nodes[0] || null
    : null
  const focusKind = focusNode ? getNodeKind(focusNode) : null
  const connectedNodes = activeVisualNetwork
    ? getConnectedNodeIds(activeVisualNetwork, focusNode?.id)
        .map((id) => activeVisualNetwork.nodes.find((node) => node.id === id))
        .filter((node): node is GraphNode => Boolean(node))
    : []
  const detailEmployee = detailEmployeeId ? employeeDetailsById[detailEmployeeId] || null : null
  const currentSkillClusterName =
    activeGraphMode === 'skill' &&
    activeVisualNetwork?.center &&
    getNodeKind(activeVisualNetwork.center) === 'skill' &&
    typeof activeVisualNetwork.center.properties.name === 'string'
      ? activeVisualNetwork.center.properties.name
      : null
  const previewedSkillName =
    viewMode === 'skill' &&
    focusKind === 'skill' &&
    typeof focusNode?.properties.name === 'string'
      ? focusNode.properties.name
      : null
  const skillInsightName =
    viewMode === 'skill'
      ? previewedSkillName || selectedSkill || currentSkillClusterName
      : null
  const skillInsight = skillInsightName ? skillInsightsByName[skillInsightName] || null : null
  const isSkillInsightLoading = Boolean(
    skillInsightName &&
    skillInsightLoadingName === skillInsightName &&
    !skillInsight,
  )
  const shouldShowSkillClusterAction = Boolean(
    skillInsightName &&
    (!currentSkillClusterName || currentSkillClusterName !== skillInsightName),
  )
  const showFullscreenSidePanel = Boolean(
    detailEmployeeId ||
    (viewMode === 'skill' && (skillInsightName || skillInsightLoadingName || skillInsightError)),
  )
  const modeDescription = {
    enterprise: 'Open the full company map to inspect all employees, department anchors, reporting lines, and shared capabilities at once.',
    employee: 'Search by employee or ID to inspect reporting lines, teammates, and skill adjacency.',
    department: 'Load a department-level network to see reporting structure and skill density.',
    skill: 'Focus on a capability map to see coverage, strongest holders, departments, and adjacent skills.',
  }[viewMode]
  const selectedNodeId = selectedNode && visibleNodeIds.has(selectedNode.id) ? selectedNode.id : null
  const employeeCount = activeVisualNetwork?.nodes.filter((node) => getNodeKind(node) === 'employee').length || 0
  const departmentCount = activeVisualNetwork?.nodes.filter((node) => getNodeKind(node) === 'department').length || 0
  const skillCount = activeVisualNetwork?.nodes.filter((node) => getNodeKind(node) === 'skill').length || 0
  const reportingRelationshipCount = activeVisualNetwork?.relationships.filter((relationship) => relationship.type === 'REPORTS_TO').length || 0

  useEffect(() => {
    if (viewMode !== 'skill' || !skillInsightName || skillInsightsByName[skillInsightName]) return

    let cancelled = false

    async function fetchSkillInsight(skillName: string) {
      setSkillInsightLoadingName(skillName)
      setSkillInsightError(null)

      try {
        const data = await queryGraphQL(
          `
            query GetSkillInsight($skillName: String!) {
              getSkillInsight(skillName: $skillName) {
                name
                category
                employeeCount
                departments {
                  name
                  count
                }
                topEmployees {
                  employee_id
                  name
                  title
                  department
                  proficiencyLevel
                  yearsOfExperience
                }
                relatedSkills {
                  name
                  count
                }
              }
            }
          `,
          { skillName },
        )

        if (cancelled) return

        setSkillInsightsByName((current) => ({
          ...current,
          [skillName]: data.getSkillInsight as SkillInsight,
        }))
      } catch (err) {
        if (!cancelled) {
          setSkillInsightError(err instanceof Error ? err.message : 'Failed to load skill insight')
        }
      } finally {
        if (!cancelled) {
          setSkillInsightLoadingName((current) => (current === skillName ? null : current))
        }
      }
    }

    void fetchSkillInsight(skillInsightName)

    return () => {
      cancelled = true
    }
  }, [skillInsightName, skillInsightsByName, viewMode])

  const handleLoadSkillCluster = (skillName: string) => {
    setSelectedSkill(skillName)
    setDetailEmployeeId(null)
    setEmployeeDetailsError(null)
    void fetchSkillSubgraph(skillName)
  }

  const handleSelectEmployeeFromSkillInsight = (employeeId: string) => {
    const employeeNode = activeVisualNetwork?.nodes.find(
      (node) =>
        getNodeKind(node) === 'employee' &&
        node.properties.employee_id === employeeId,
    )

    if (employeeNode) {
      selectGraphNode(employeeNode)
      return
    }

    if (isGraphFullscreen) {
      setDetailEmployeeId(employeeId)
      setEmployeeDetailsError(null)
      return
    }

    setViewMode('employee')
    setSelectedEmployeeId(employeeId)
    void fetchEmployeeNetwork(employeeId)
  }

  const renderGraphExperience = (fullscreen = false) => (
    <Card className={fullscreen ? 'flex h-full flex-col overflow-hidden rounded-[32px] bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.18)]' : 'overflow-hidden'}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label">Talent Graph</p>
          <h2 className={`mt-3 font-display font-semibold text-ink-900 ${fullscreen ? 'text-4xl lg:text-5xl' : 'text-3xl'}`}>Interactive exploration canvas</h2>
          <p className={`mt-2 max-w-2xl leading-6 text-ink-500 ${fullscreen ? 'text-base' : 'text-sm'}`}>
            Click a node to lock focus. Hover to preview adjacency. Use zoom controls to inspect reporting structure and skill links without losing orientation.
          </p>
          {fullscreen && (
            <p className="mt-3 text-sm text-ink-400">Press `Esc` to exit full screen mode.</p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <Button
            variant="primary"
            size="sm"
            className="shadow-[0_14px_30px_rgba(15,23,42,0.14)]"
            onClick={() => setIsGraphFullscreen((current) => !current)}
          >
            <FullscreenIcon expanded={fullscreen} />
            {fullscreen ? 'Exit full screen' : 'View full screen graph'}
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => canvasRef.current?.zoomOut()}>
              Zoom out
            </Button>
            <Button variant="secondary" size="sm" onClick={() => canvasRef.current?.resetView()}>
              Reset view
            </Button>
            <Button variant="secondary" size="sm" onClick={() => canvasRef.current?.zoomIn()}>
              Zoom in
            </Button>
          </div>
        </div>
      </div>

      <div className={fullscreen ? 'mt-6 min-h-0 flex-1' : 'mt-6'}>
        {error && (
          <EmptyState title="Error loading graph" description={error} />
        )}

        {!error && !activeVisualNetwork && loading && (
          <div className="flex h-full min-h-[22rem] items-center justify-center rounded-[28px] border border-[color:var(--border)] bg-white/68">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!error && !activeVisualNetwork && !loading && (
          <EmptyState
            title={
              viewMode === 'enterprise'
                ? 'Open the enterprise map'
                : viewMode === 'skill'
                ? selectedSkill
                  ? `Ready to load ${selectedSkill}`
                  : 'Choose a skill cluster'
                : viewMode === 'department'
                  ? selectedDepartment
                    ? `Ready to load ${selectedDepartment}`
                    : 'Choose a department network'
                  : 'No graph loaded'
            }
            description={
              viewMode === 'enterprise'
                ? 'Load the full workforce map to see every employee, department anchor, reporting line, and shared capability signal in one canvas.'
                : viewMode === 'skill'
                ? selectedSkill
                  ? 'Load the selected skill to see coverage, top holders, and adjacent capabilities in the graph.'
                  : 'Pick a skill from the left rail to open a capability-focused network instead of the stale org view.'
                : viewMode === 'department'
                  ? selectedDepartment
                    ? 'Load the selected department to inspect reporting structure and shared capabilities.'
                    : 'Pick a department from the left rail to inspect its organizational structure.'
                  : 'Load the enterprise map, a department, a skill cluster, or an employee network to begin exploring.'
            }
          />
        )}

        {!error && activeVisualNetwork && (
          <div className={fullscreen ? `grid min-h-0 h-full gap-6 ${showFullscreenSidePanel ? 'xl:grid-cols-[minmax(0,1fr)_420px]' : ''}` : ''}>
            <div className={`relative ${fullscreen ? 'min-h-0' : ''}`}>
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-white/70 backdrop-blur-sm">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {!fullscreen && (
                <div className="absolute right-4 top-4 z-10">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label="Open full screen graph"
                    className="rounded-full bg-white/94 px-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                    onClick={() => setIsGraphFullscreen(true)}
                  >
                    <FullscreenIcon expanded={false} />
                  </Button>
                </div>
              )}

              <GraphCanvas
                ref={canvasRef}
                network={activeVisualNetwork}
                selectedNodeId={selectedNodeId}
                hoveredNodeId={hoveredNodeId}
                onSelectNode={selectGraphNode}
                onHoverNode={setHoveredNodeId}
                className={fullscreen ? 'h-[calc(100vh-14.5rem)] lg:h-[calc(100vh-13rem)]' : ''}
              />
            </div>

            {fullscreen && showFullscreenSidePanel && (
              <div className="min-h-0">
                {detailEmployeeId ? (
                  <EmployeeDetailDrawer
                    employee={detailEmployee}
                    loading={employeeDetailsLoadingId === detailEmployeeId && !detailEmployee}
                    error={employeeDetailsError}
                    onClose={() => {
                      setDetailEmployeeId(null)
                      setEmployeeDetailsError(null)
                    }}
                  />
                ) : (
                  <div className="h-full overflow-y-auto pr-1">
                    <SkillInsightPanel
                      skillName={skillInsightName}
                      insight={skillInsight}
                      loading={isSkillInsightLoading}
                      error={skillInsightError}
                      onSelectEmployee={handleSelectEmployeeFromSkillInsight}
                      onSelectRelatedSkill={handleLoadSkillCluster}
                      onLoadSkillCluster={handleLoadSkillCluster}
                      showClusterAction={shouldShowSkillClusterAction}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )

  if (bootstrapping && !network) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 px-6 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <p className="section-label">Graph Mission</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-ink-900">Explore the workforce as a connected system</h2>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Move between the full enterprise map, people, departments, and skill clusters without losing context. The graph now emphasizes coverage, adjacency, and quick decision-making.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Badge color="blue">Interactive</Badge>
              <Badge color="green">Skills-aware</Badge>
              <Badge color="gray">{activeVisualNetwork?.nodes.length || 0} nodes loaded</Badge>
            </div>
          </Card>

          <Card>
            <p className="section-label">Explore By</p>
            <div className="mt-4 space-y-3">
              {([
                ['enterprise', 'Enterprise', 'See the full workforce map'],
                ['employee', 'People', 'Find an individual network'],
                ['department', 'Department', 'Review organizational structure'],
                ['skill', 'Skill', 'See where expertise clusters'],
              ] as const).map(([mode, label, description]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setViewMode(mode)
                    setDetailEmployeeId(null)
                    setEmployeeDetailsError(null)
                    if (mode === 'enterprise' && activeGraphMode !== 'enterprise') {
                      void fetchEnterpriseGraphOverview()
                    }
                  }}
                  className={`w-full rounded-[20px] border p-4 text-left transition-all ${
                    viewMode === mode
                      ? 'border-primary-200 bg-primary-50 shadow-sm'
                      : 'border-[color:var(--border)] bg-white/75 hover:bg-white'
                  }`}
                >
                  <div className="font-medium text-ink-900">{label}</div>
                  <div className="mt-1 text-sm text-ink-500">{description}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink-500">{modeDescription}</p>
          </Card>

          {viewMode === 'enterprise' && (
            <Card>
              <p className="section-label">Enterprise Map</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-4 py-4">
                  <p className="text-sm font-medium text-ink-900">All 200 employees in one view</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    This mode keeps the whole workforce visible, groups people around department anchors, and surfaces the most connected skills across the company.
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={loading && activeGraphMode === 'enterprise'}
                  onClick={() => void fetchEnterpriseGraphOverview()}
                >
                  {loading && activeGraphMode === 'enterprise' ? 'Refreshing enterprise map...' : 'Load enterprise map'}
                </Button>
              </div>
            </Card>
          )}

          {viewMode === 'employee' && (
            <Card>
              <p className="section-label">Find A Person</p>
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Search by employee name"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void searchEmployees(searchQuery)
                  }}
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedEmployeeId}
                    placeholder="Or use Employee ID"
                    onChange={(event) => setSelectedEmployeeId(event.target.value.toUpperCase())}
                    className="min-w-0 flex-1 rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => void searchEmployees(searchQuery)}
                  >
                    Search
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={() => void fetchEmployeeNetwork(selectedEmployeeId)}
                  disabled={!selectedEmployeeId || loading}
                >
                  {loading ? 'Loading network...' : 'Load employee network'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-5 space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.employee_id}
                      type="button"
                      onClick={() => {
                        setSelectedEmployeeId(result.employee_id)
                        setSearchResults([])
                        void fetchEmployeeNetwork(result.employee_id)
                      }}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-left transition-all hover:border-primary-200 hover:bg-primary-50"
                    >
                      <div className="font-medium text-ink-900">{result.name}</div>
                      <div className="mt-1 text-sm text-ink-500">{result.title} · {result.department}</div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {viewMode === 'department' && (
            <Card>
              <p className="section-label">Department Network</p>
              <div className="mt-4 space-y-3">
                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">Choose a department</option>
                  {departments.map((department) => (
                    <option key={department.name} value={department.name}>
                      {department.name} ({department.count})
                    </option>
                  ))}
                </select>
                <Button
                  className="w-full"
                  disabled={!selectedDepartment || loading}
                  onClick={() => void fetchDepartmentSubgraph(selectedDepartment)}
                >
                  {loading ? 'Loading department...' : 'Load department network'}
                </Button>
              </div>
            </Card>
          )}

          {viewMode === 'skill' && (
            <Card>
              <p className="section-label">Skill Cluster</p>
              <div className="mt-4 space-y-3">
                <select
                  value={selectedSkill}
                  onChange={(event) => setSelectedSkill(event.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">Choose a skill</option>
                  {skills.map((skill) => (
                    <option key={skill.name} value={skill.name}>
                      {skill.name} ({skill.count})
                    </option>
                  ))}
                </select>
                <Button
                  className="w-full"
                  disabled={!selectedSkill || loading}
                  onClick={() => void fetchSkillSubgraph(selectedSkill)}
                >
                  {loading ? 'Loading skill cluster...' : 'Load skill cluster'}
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <p className="section-label">Quick Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setViewMode('enterprise')
                  setDetailEmployeeId(null)
                  setEmployeeDetailsError(null)
                  void fetchEnterpriseGraphOverview()
                }}
              >
                Reset to enterprise map
              </Button>
              <Button variant="ghost" onClick={() => canvasRef.current?.resetView()}>
                Fit graph to view
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {!isGraphFullscreen && renderGraphExperience()}

          {!isGraphFullscreen && activeVisualNetwork && (
            <div
              className={`grid gap-4 ${
                viewMode === 'enterprise'
                  ? 'grid-cols-2 2xl:grid-cols-4'
                  : 'md:grid-cols-2 xl:grid-cols-4'
              }`}
            >
              <Card>
                <p className="text-sm font-medium text-ink-500">
                  {viewMode === 'enterprise' ? 'Employees' : 'Nodes'}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink-900">
                  {viewMode === 'enterprise' ? employeeCount : activeVisualNetwork.nodes.length}
                </p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-ink-500">
                  {viewMode === 'enterprise' ? 'Departments' : 'Relationships'}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink-900">
                  {viewMode === 'enterprise' ? departmentCount : activeVisualNetwork.relationships.length}
                </p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-ink-500">
                  {viewMode === 'enterprise' ? 'Shared skills' : 'Focus'}
                </p>
                <p className={`mt-2 text-ink-900 ${viewMode === 'enterprise' ? 'font-display text-3xl font-semibold' : 'truncate font-medium'}`}>
                  {viewMode === 'enterprise' ? skillCount : focusNode ? getNodeLabel(focusNode) : 'None'}
                </p>
              </Card>
              <Card>
                <p className="text-sm font-medium text-ink-500">
                  {viewMode === 'enterprise' ? 'Reporting links' : 'Adjacency'}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-ink-900">
                  {viewMode === 'enterprise' ? reportingRelationshipCount : connectedNodes.length}
                </p>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {viewMode === 'skill' ? (
            <SkillInsightPanel
              skillName={skillInsightName}
              insight={skillInsight}
              loading={isSkillInsightLoading}
              error={skillInsightError}
              onSelectEmployee={handleSelectEmployeeFromSkillInsight}
              onSelectRelatedSkill={handleLoadSkillCluster}
              onLoadSkillCluster={handleLoadSkillCluster}
              showClusterAction={shouldShowSkillClusterAction}
            />
          ) : (
            <>
              {viewMode === 'enterprise' && (
                <Card>
                  <p className="section-label">Enterprise Overview</p>
                  <div className="mt-4 space-y-5">
                    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-5">
                      <p className="font-display text-2xl font-semibold text-ink-900">Live workforce map</p>
                      <p className="mt-3 text-sm leading-6 text-ink-500">
                        Department hubs ground the network, reporting links reveal structure, and the outer skill layer shows where capabilities spread across the company.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
                        <div className="text-sm font-medium text-ink-500">Largest departments</div>
                        <div className="mt-3 space-y-2">
                          {departments.slice(0, 4).map((department) => (
                            <div key={department.name} className="flex items-start justify-between gap-3 text-sm">
                              <span className="max-w-[75%] font-medium leading-6 text-ink-900">{department.name}</span>
                              <span className="shrink-0 text-ink-500">{department.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[color:var(--border)] bg-white/78 px-4 py-3">
                        <div className="text-sm font-medium text-ink-500">Top shared skills</div>
                        <div className="mt-3 space-y-2">
                          {skills.slice(0, 4).map((skill) => (
                            <div key={skill.name} className="flex items-start justify-between gap-3 text-sm">
                              <span className="max-w-[75%] font-medium leading-6 text-ink-900">{skill.name}</span>
                              <span className="shrink-0 text-ink-500">{skill.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-ink-500">
                      Click an employee to inspect their profile, or switch into Department and Skill modes for a tighter view of the same network.
                    </p>
                  </div>
                </Card>
              )}

              <Card>
                <p className="section-label">Connection Insight</p>
                {focusNode ? (
                  <div className="mt-4 space-y-5">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge color={focusKind === 'employee' ? 'blue' : focusKind === 'skill' ? 'green' : focusKind === 'department' ? 'yellow' : 'gray'}>
                          {focusKind === 'employee' ? 'Employee' : focusKind === 'skill' ? 'Skill' : focusKind === 'department' ? 'Department' : 'Entity'}
                        </Badge>
                        {focusNode.id === activeVisualNetwork?.center?.id && <Badge color="gray">Center node</Badge>}
                      </div>
                      <h3 className="font-display text-2xl font-semibold text-ink-900">{getNodeLabel(focusNode)}</h3>
                      {typeof focusNode.properties.title === 'string' && (
                        <p className="mt-1 text-sm text-ink-500">{focusNode.properties.title}</p>
                      )}
                    </div>

                    <div className="grid gap-3">
                      {Object.entries(focusNode.properties).map(([key, value]) => {
                        if (!value || key === 'name' || key === 'title') return null

                        return (
                          <div key={key} className="rounded-2xl border border-[color:var(--border)] bg-white/75 px-4 py-3">
                            <div className="text-xs uppercase tracking-[0.14em] text-ink-400">
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="mt-1 text-sm text-ink-900">{String(value)}</div>
                          </div>
                        )
                      })}
                    </div>

                    {focusKind === 'employee' && typeof focusNode.properties.employee_id === 'string' && (
                      <Button
                        className="w-full"
                        onClick={() => { window.location.href = `/employee/${focusNode.properties.employee_id}` }}
                      >
                        Open employee profile
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink-500">Select a node to inspect the surrounding workforce context.</p>
                )}
              </Card>

              <Card>
                <p className="section-label">Connected Nodes</p>
                <div className="mt-4 space-y-3">
                  {connectedNodes.length > 0 ? (
                    connectedNodes.slice(0, 8).map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => selectGraphNode(node)}
                        className="w-full rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-left transition-all hover:border-primary-200 hover:bg-primary-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink-900">{getNodeLabel(node)}</div>
                            <div className="mt-1 text-sm text-ink-500">
                              {getNodeKind(node) === 'employee'
                                ? (node.properties.department as string) || 'Employee'
                                : getNodeKind(node) === 'department'
                                  ? 'Department'
                                  : getNodeKind(node)}
                            </div>
                          </div>
                          <Badge color={getNodeKind(node) === 'employee' ? 'blue' : getNodeKind(node) === 'skill' ? 'green' : getNodeKind(node) === 'department' ? 'yellow' : 'gray'}>
                            {getNodeKind(node)}
                          </Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-ink-500">Focused nodes will reveal adjacent people and skill links here.</p>
                  )}
                </div>
              </Card>
            </>
          )}

          <Card>
            <p className="section-label">Legend</p>
            <div className="mt-4 space-y-3 text-sm text-ink-600">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full bg-primary-600" />
                <span>Employee node</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500" />
                <span>Skill node</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 rounded-full bg-amber-500" />
                <span>Department node</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-8 rounded-full bg-primary-300" />
                <span>Reporting or employee connection</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-8 rounded-full bg-emerald-300" />
                <span>Skill relationship</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-8 rounded-full bg-amber-300" />
                <span>Department membership</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {isGraphFullscreen && (
        <div className="fixed inset-0 z-[80] bg-[linear-gradient(180deg,rgba(241,245,252,0.97)_0%,rgba(232,239,249,0.98)_100%)] p-4 backdrop-blur-sm lg:p-6">
          <div className="mx-auto h-full max-w-[1800px]">
            {renderGraphExperience(true)}
          </div>
        </div>
      )}
    </>
  )
}

export default function GraphExplorerPage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="flex h-[70vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <GraphExplorerPageContent />
      </Suspense>
    </AppLayout>
  )
}
