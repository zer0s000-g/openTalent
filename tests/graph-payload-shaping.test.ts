import { describe, it, expect } from 'vitest'
import { shapeNetworkPayload } from '@/lib/graph-formatters'

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
})
