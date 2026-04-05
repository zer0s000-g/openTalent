import { describe, it, expect } from 'vitest'

// Test graph payload shaping
interface GraphNode {
  id: string
  labels: string[]
  properties: Record<string, string>
}

interface GraphRelationship {
  start: { id: string }
  end: { id: string }
  type: string
}

interface NetworkResult {
  center?: GraphNode
  nodes: GraphNode[]
  relationships: GraphRelationship[]
}

function shapeNetworkPayload(rawData: any): NetworkResult {
  if (!rawData) {
    return { center: undefined, nodes: [], relationships: [] }
  }

  return {
    center: rawData.center ? {
      id: rawData.center.id,
      labels: rawData.center.labels || ['Employee'],
      properties: rawData.center.properties || {},
    } : undefined,
    nodes: (rawData.nodes || []).map((n: any) => ({
      id: n.id,
      labels: n.labels || ['Employee'],
      properties: n.properties || {},
    })),
    relationships: (rawData.relationships || []).map((r: any) => ({
      start: { id: r.start?.id },
      end: { id: r.end?.id },
      type: r.type || 'UNKNOWN',
    })),
  }
}

function countNodesByLabel(nodes: GraphNode[], label: string): number {
  return nodes.filter(n => n.labels.includes(label)).length
}

describe('Graph Payload Shaping', () => {
  const sampleRawData = {
    center: {
      id: 'emp-001',
      labels: ['Employee'],
      properties: {
        employee_id: 'EMP0001',
        name: 'John Doe',
        title: 'Engineer',
      },
    },
    nodes: [
      {
        id: 'emp-001',
        labels: ['Employee'],
        properties: { employee_id: 'EMP0001', name: 'John Doe' },
      },
      {
        id: 'emp-002',
        labels: ['Employee'],
        properties: { employee_id: 'EMP0002', name: 'Jane Smith' },
      },
      {
        id: 'skill-001',
        labels: ['Skill'],
        properties: { name: 'Python' },
      },
    ],
    relationships: [
      { start: { id: 'emp-001' }, end: { id: 'emp-002' }, type: 'REPORTS_TO' },
      { start: { id: 'emp-001' }, end: { id: 'skill-001' }, type: 'HAS_SKILL' },
    ],
  }

  it('should shape raw graph data correctly', () => {
    const result = shapeNetworkPayload(sampleRawData)

    expect(result.center).toBeDefined()
    expect(result.center?.id).toBe('emp-001')
    expect(result.nodes).toHaveLength(3)
    expect(result.relationships).toHaveLength(2)
  })

  it('should handle missing data gracefully', () => {
    const result = shapeNetworkPayload(null)

    expect(result.center).toBeUndefined()
    expect(result.nodes).toHaveLength(0)
    expect(result.relationships).toHaveLength(0)
  })

  it('should count nodes by label correctly', () => {
    const shaped = shapeNetworkPayload(sampleRawData)
    const employeeCount = countNodesByLabel(shaped.nodes, 'Employee')
    const skillCount = countNodesByLabel(shaped.nodes, 'Skill')

    expect(employeeCount).toBe(2)
    expect(skillCount).toBe(1)
  })

  it('should default to Employee label if missing', () => {
    const rawDataNoLabels = {
      center: { id: 'emp-001', properties: {} },
      nodes: [{ id: 'emp-001', properties: {} }],
      relationships: [],
    }

    const result = shapeNetworkPayload(rawDataNoLabels)
    expect(result.nodes[0].labels).toEqual(['Employee'])
  })

  it('should preserve relationship types', () => {
    const shaped = shapeNetworkPayload(sampleRawData)

    expect(shaped.relationships[0].type).toBe('REPORTS_TO')
    expect(shaped.relationships[1].type).toBe('HAS_SKILL')
  })
})
