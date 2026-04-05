export interface GraphNode {
  id: string
  labels: string[]
  properties: Record<string, unknown>
}

export interface GraphRelationship {
  start: { id: string }
  end: { id: string }
  type: string
}

export interface NetworkResult {
  center?: GraphNode
  nodes: GraphNode[]
  relationships: GraphRelationship[]
}

export type GraphNodeKind = 'employee' | 'skill' | 'department' | 'other'

export interface GraphLayoutDatum {
  x: number
  y: number
  size: number
  color: string
  label: string
  kind: GraphNodeKind
  isCenter: boolean
}

function normalizeGraphValue(value: unknown): unknown {
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    return value.map(normalizeGraphValue)
  }

  if (typeof value === 'object') {
    const candidate = value as {
      toNumber?: () => number
      low?: number
      high?: number
      year?: { low?: number }
      month?: { low?: number }
      day?: { low?: number }
    }

    if (typeof candidate.toNumber === 'function') {
      return candidate.toNumber()
    }

    const hasDateShape =
      candidate.year && typeof candidate.year.low === 'number' &&
      candidate.month && typeof candidate.month.low === 'number' &&
      candidate.day && typeof candidate.day.low === 'number'

    if (hasDateShape) {
      const year = candidate.year?.low ?? 0
      const month = String(candidate.month?.low ?? 0).padStart(2, '0')
      const day = String(candidate.day?.low ?? 0).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const entries = Object.entries(value as Record<string, unknown>)

    if (
      entries.length <= 2 &&
      typeof candidate.low === 'number' &&
      (typeof candidate.high === 'number' || candidate.high === undefined)
    ) {
      return candidate.low
    }

    return Object.fromEntries(entries.map(([key, entryValue]) => [key, normalizeGraphValue(entryValue)]))
  }

  return value
}

export function shapeNetworkPayload(rawData: any): NetworkResult {
  if (!rawData) return { center: undefined, nodes: [], relationships: [] }

  const center = rawData.center
    ? {
        id: rawData.center.id,
        labels: rawData.center.labels || ['Employee'],
        properties: normalizeGraphValue(rawData.center.properties || {}) as Record<string, unknown>,
      }
    : undefined

  const nodeMap = new Map<string, GraphNode>()
  if (center) nodeMap.set(center.id, center)

  for (const node of rawData.nodes || []) {
    if (!node?.id) continue
    if (nodeMap.has(node.id)) continue
    nodeMap.set(node.id, {
      id: node.id,
      labels: node.labels || ['Employee'],
      properties: normalizeGraphValue(node.properties || {}) as Record<string, unknown>,
    })
  }

  const relationshipSet = new Set<string>()
  const relationships: GraphRelationship[] = []

  for (const rel of rawData.relationships || []) {
    const startId = rel.start?.id
    const endId = rel.end?.id
    const type = rel.type || 'UNKNOWN'

    if (!startId || !endId) continue

    const key = `${startId}:${type}:${endId}`
    if (relationshipSet.has(key)) continue
    relationshipSet.add(key)

    relationships.push({
      start: { id: startId },
      end: { id: endId },
      type,
    })
  }

  return {
    center,
    nodes: Array.from(nodeMap.values()),
    relationships,
  }
}

export function getNodeKind(node: GraphNode): GraphNodeKind {
  if (node.labels.includes('Employee')) return 'employee'
  if (node.labels.includes('Skill')) return 'skill'
  if (node.labels.includes('Department')) return 'department'
  return 'other'
}

export function getNodeLabel(node: GraphNode): string {
  const name = node.properties.name
  const title = node.properties.title
  const id = node.properties.employee_id

  if (typeof name === 'string' && name.trim()) return name
  if (typeof title === 'string' && title.trim()) return title
  if (typeof id === 'string' && id.trim()) return id
  return 'Unknown'
}

export function getNodeColor(node: GraphNode, isCenter = false): string {
  if (isCenter) return '#07111f'

  switch (getNodeKind(node)) {
    case 'employee':
      return '#2f5bff'
    case 'skill':
      return '#00aeb8'
    case 'department':
      return '#d99128'
    default:
      return '#66758b'
  }
}

function distributeOnRing(ids: string[], radius: number, offset = 0) {
  return ids.reduce<Record<string, { x: number; y: number }>>((acc, id, index) => {
    const angle = offset + (index / Math.max(ids.length, 1)) * Math.PI * 2
    acc[id] = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
    return acc
  }, {})
}

function buildManagerDepthMap(network: NetworkResult): Map<string, number> {
  const reportsTo = new Map<string, string>()
  const directsByManager = new Map<string, string[]>()

  for (const relationship of network.relationships) {
    if (relationship.type !== 'REPORTS_TO') continue

    reportsTo.set(relationship.start.id, relationship.end.id)

    const directs = directsByManager.get(relationship.end.id) || []
    directs.push(relationship.start.id)
    directsByManager.set(relationship.end.id, directs)
  }

  const employeeIds = network.nodes
    .filter((node) => getNodeKind(node) === 'employee')
    .map((node) => node.id)
  const roots = employeeIds.filter((id) => !reportsTo.has(id))
  const depthMap = new Map<string, number>()
  const queue = roots.map((id) => ({ id, depth: 0 }))

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || depthMap.has(current.id)) continue

    depthMap.set(current.id, current.depth)

    for (const directId of directsByManager.get(current.id) || []) {
      queue.push({ id: directId, depth: current.depth + 1 })
    }
  }

  for (const employeeId of employeeIds) {
    if (!depthMap.has(employeeId)) {
      depthMap.set(employeeId, 0)
    }
  }

  return depthMap
}

function buildEnterpriseLayout(network: NetworkResult): Record<string, GraphLayoutDatum> {
  const layout: Record<string, GraphLayoutDatum> = {}
  const centerId = network.center?.id
  const departmentNodes = network.nodes.filter((node) => getNodeKind(node) === 'department')
  const employeeNodes = network.nodes.filter((node) => getNodeKind(node) === 'employee')
  const skillNodes = network.nodes.filter((node) => getNodeKind(node) === 'skill')
  const otherNodes = network.nodes.filter((node) => getNodeKind(node) === 'other')
  const departmentPositions = distributeOnRing(
    departmentNodes.map((node) => node.id),
    Math.max(26, departmentNodes.length * 4.2),
    -Math.PI / 2,
  )
  const skillPositions = distributeOnRing(
    skillNodes.map((node) => node.id),
    Math.max(42, departmentNodes.length * 6.4),
    -Math.PI / 3,
  )
  const otherPositions = distributeOnRing(otherNodes.map((node) => node.id), 18, Math.PI / 6)
  const departmentByEmployee = new Map<string, string>()
  const employeesByDepartment = new Map<string, GraphNode[]>()
  const managerDepths = buildManagerDepthMap(network)

  for (const relationship of network.relationships) {
    if (relationship.type !== 'BELONGS_TO_DEPARTMENT') continue
    departmentByEmployee.set(relationship.start.id, relationship.end.id)
  }

  for (const employee of employeeNodes) {
    const departmentId = departmentByEmployee.get(employee.id) || '__unassigned__'
    const group = employeesByDepartment.get(departmentId) || []
    group.push(employee)
    employeesByDepartment.set(departmentId, group)
  }

  const unassignedAnchor = { x: 0, y: Math.max(18, departmentNodes.length * 2.4) }

  for (const department of departmentNodes) {
    const position = departmentPositions[department.id] || { x: 0, y: 0 }
    layout[department.id] = {
      x: position.x,
      y: position.y,
      size: 16.5,
      color: getNodeColor(department),
      label: getNodeLabel(department),
      kind: 'department',
      isCenter: department.id === centerId,
    }
  }

  for (const [departmentId, members] of employeesByDepartment.entries()) {
    const anchor = departmentId === '__unassigned__'
      ? unassignedAnchor
      : departmentPositions[departmentId] || { x: 0, y: 0 }
    const sortedMembers = [...members].sort((left, right) => {
      const depthDiff = (managerDepths.get(left.id) || 0) - (managerDepths.get(right.id) || 0)
      if (depthDiff !== 0) return depthDiff
      return getNodeLabel(left).localeCompare(getNodeLabel(right))
    })

    sortedMembers.forEach((employee, index) => {
      const ringSize = 14
      const ringIndex = Math.floor(index / ringSize)
      const slotIndex = index % ringSize
      const slotCount = Math.min(ringSize, sortedMembers.length - ringIndex * ringSize)
      const angleOffset = departmentId === '__unassigned__' ? Math.PI / 2 : 0
      const angle = angleOffset + (slotIndex / Math.max(slotCount, 1)) * Math.PI * 2
      const radius = 6 + ringIndex * 3.2
      const depth = managerDepths.get(employee.id) || 0
      const isCenter = employee.id === centerId

      layout[employee.id] = {
        x: anchor.x + Math.cos(angle) * radius,
        y: anchor.y + Math.sin(angle) * radius + depth * 0.45,
        size: isCenter ? 18.5 : 9.4,
        color: getNodeColor(employee, isCenter),
        label: getNodeLabel(employee),
        kind: 'employee',
        isCenter,
      }
    })
  }

  for (const skill of skillNodes) {
    const position = skillPositions[skill.id] || { x: 0, y: 0 }
    layout[skill.id] = {
      x: position.x,
      y: position.y,
      size: 12.4,
      color: getNodeColor(skill),
      label: getNodeLabel(skill),
      kind: 'skill',
      isCenter: skill.id === centerId,
    }
  }

  for (const other of otherNodes) {
    const position = otherPositions[other.id] || { x: 0, y: 0 }
    layout[other.id] = {
      x: position.x,
      y: position.y,
      size: other.id === centerId ? 16 : 10,
      color: getNodeColor(other, other.id === centerId),
      label: getNodeLabel(other),
      kind: 'other',
      isCenter: other.id === centerId,
    }
  }

  return layout
}

export function buildGraphLayout(network: NetworkResult): Record<string, GraphLayoutDatum> {
  const layout: Record<string, GraphLayoutDatum> = {}
  const centerId = network.center?.id

  const employeeNodes = network.nodes.filter((node) => getNodeKind(node) === 'employee' && node.id !== centerId)
  const skillNodes = network.nodes.filter((node) => getNodeKind(node) === 'skill' && node.id !== centerId)
  const departmentNodes = network.nodes.filter((node) => getNodeKind(node) === 'department' && node.id !== centerId)
  const otherNodes = network.nodes.filter((node) => getNodeKind(node) === 'other' && node.id !== centerId)

  if (employeeNodes.length >= 120 && departmentNodes.length >= 3) {
    return buildEnterpriseLayout(network)
  }

  const employeePositions = distributeOnRing(employeeNodes.map((node) => node.id), 8.5, -Math.PI / 2)
  const skillPositions = distributeOnRing(skillNodes.map((node) => node.id), 14, Math.PI / 6)
  const departmentPositions = distributeOnRing(departmentNodes.map((node) => node.id), 10.5, Math.PI / 2)
  const otherPositions = distributeOnRing(otherNodes.map((node) => node.id), 11, Math.PI / 3)

  for (const node of network.nodes) {
    const isCenter = node.id === centerId
    const kind = getNodeKind(node)
    const position = isCenter
      ? { x: 0, y: 0 }
      : employeePositions[node.id] || skillPositions[node.id] || departmentPositions[node.id] || otherPositions[node.id] || { x: 0, y: 0 }

    layout[node.id] = {
      ...position,
      size: isCenter ? 19 : kind === 'employee' ? 13.8 : kind === 'skill' ? 11.8 : kind === 'department' ? 13.2 : 10,
      color: getNodeColor(node, isCenter),
      label: getNodeLabel(node),
      kind,
      isCenter,
    }
  }

  return layout
}

export function buildNeighborMap(network: NetworkResult): Map<string, Set<string>> {
  const neighbors = new Map<string, Set<string>>()

  for (const node of network.nodes) {
    neighbors.set(node.id, new Set())
  }

  for (const relationship of network.relationships) {
    const startId = relationship.start.id
    const endId = relationship.end.id

    if (!neighbors.has(startId)) neighbors.set(startId, new Set())
    if (!neighbors.has(endId)) neighbors.set(endId, new Set())

    neighbors.get(startId)?.add(endId)
    neighbors.get(endId)?.add(startId)
  }

  return neighbors
}

export function getConnectedNodeIds(network: NetworkResult, nodeId?: string | null): string[] {
  if (!nodeId) return []

  const neighbors = buildNeighborMap(network)
  return Array.from(neighbors.get(nodeId) || [])
}
