import { describe, it, expect } from 'vitest'
import {
  buildGraphLayout,
  buildNeighborMap,
  getNodeKind,
  shapeNetworkPayload,
} from '@/lib/graph-formatters'

describe('Graph Payload Shaping', () => {
  it('shapes center, nodes and relationships', () => {
    const result = shapeNetworkPayload({
      center: { id: '1', labels: ['Employee'], properties: { name: 'A' } },
      nodes: [{ id: '1', labels: ['Employee'], properties: {} }, { id: '2', labels: ['Skill'], properties: {} }],
      relationships: [{ start: { id: '1' }, end: { id: '2' }, type: 'HAS_SKILL' }],
    })

    expect(result.center?.id).toBe('1')
    expect(result.nodes).toHaveLength(2)
    expect(result.relationships[0].type).toBe('HAS_SKILL')
  })

  it('returns empty shape for null', () => {
    expect(shapeNetworkPayload(null)).toEqual({ center: undefined, nodes: [], relationships: [] })
  })

  it('builds neighbors and layout metadata', () => {
    const network = shapeNetworkPayload({
      center: { id: '1', labels: ['Employee'], properties: { name: 'A' } },
      nodes: [
        { id: '1', labels: ['Employee'], properties: { name: 'A' } },
        { id: '2', labels: ['Employee'], properties: { name: 'B' } },
        { id: '3', labels: ['Skill'], properties: { name: 'React' } },
      ],
      relationships: [
        { start: { id: '1' }, end: { id: '2' }, type: 'REPORTS_TO' },
        { start: { id: '1' }, end: { id: '3' }, type: 'HAS_SKILL' },
      ],
    })

    const neighbors = buildNeighborMap(network)
    const layout = buildGraphLayout(network)

    expect(neighbors.get('1')).toEqual(new Set(['2', '3']))
    expect(layout['1'].isCenter).toBe(true)
    expect(getNodeKind(network.nodes[2])).toBe('skill')
  })

  it('normalizes neo4j-like property objects for safe rendering', () => {
    const network = shapeNetworkPayload({
      center: {
        id: '1',
        labels: ['Employee'],
        properties: {
          hired_date: {
            year: { low: 2024, high: 0 },
            month: { low: 2, high: 0 },
            day: { low: 7, high: 0 },
          },
          score: { low: 9, high: 0 },
        },
      },
      nodes: [],
      relationships: [],
    })

    expect(network.center?.properties.hired_date).toBe('2024-02-07')
    expect(network.center?.properties.score).toBe(9)
  })

  it('deduplicates nodes and relationships while preserving the center node', () => {
    const network = shapeNetworkPayload({
      center: { id: 'dept-1', labels: ['Department'], properties: { name: 'Engineering' } },
      nodes: [
        { id: 'dept-1', labels: ['Department'], properties: { name: 'Engineering' } },
        { id: 'emp-1', labels: ['Employee'], properties: { name: 'Alex' } },
        { id: 'emp-1', labels: ['Employee'], properties: { name: 'Alex' } },
      ],
      relationships: [
        { start: { id: 'emp-1' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
        { start: { id: 'emp-1' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
      ],
    })

    expect(network.nodes).toHaveLength(2)
    expect(network.relationships).toHaveLength(1)
    expect(getNodeKind(network.nodes[0])).toBe('department')
  })
})
