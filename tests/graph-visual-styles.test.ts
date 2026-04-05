import { describe, expect, it } from 'vitest'
import { getEdgeVisual } from '@/components/graph/graph-canvas'
import { buildGraphLayout, getNodeColor, shapeNetworkPayload } from '@/lib/graph-formatters'

describe('Graph visual styles', () => {
  it('uses stronger semantic node colors for enterprise graph readability', () => {
    const employee = { id: 'emp-1', labels: ['Employee'], properties: { name: 'Alex' } }
    const skill = { id: 'skill-1', labels: ['Skill'], properties: { name: 'Python' } }
    const department = { id: 'dept-1', labels: ['Department'], properties: { name: 'Engineering' } }

    expect(getNodeColor(employee as never)).toBe('#2f5bff')
    expect(getNodeColor(skill as never)).toBe('#00aeb8')
    expect(getNodeColor(department as never)).toBe('#d99128')
    expect(getNodeColor(employee as never, true)).toBe('#07111f')
  })

  it('emphasizes skill and reporting edges with bolder relation-specific colors', () => {
    expect(getEdgeVisual('REPORTS_TO')).toEqual({
      color: 'rgba(47, 91, 255, 0.52)',
      size: 2.5,
    })
    expect(getEdgeVisual('HAS_SKILL', true)).toEqual({
      color: 'rgba(0, 234, 255, 0.82)',
      size: 2.7,
    })
    expect(getEdgeVisual('BELONGS_TO_DEPARTMENT', true)).toEqual({
      color: 'rgba(255, 182, 63, 0.78)',
      size: 2.9,
    })
  })

  it('keeps enterprise department anchors visually larger than employee nodes', () => {
    const network = shapeNetworkPayload({
      center: { id: 'emp-1', labels: ['Employee'], properties: { name: 'CEO' } },
      nodes: [
        { id: 'emp-1', labels: ['Employee'], properties: { name: 'CEO' } },
        { id: 'dept-1', labels: ['Department'], properties: { name: 'Engineering' } },
        { id: 'dept-2', labels: ['Department'], properties: { name: 'Sales' } },
        { id: 'dept-3', labels: ['Department'], properties: { name: 'Product' } },
        ...Array.from({ length: 125 }, (_, index) => ({
          id: `emp-${index + 2}`,
          labels: ['Employee'],
          properties: { name: `Employee ${index + 2}` },
        })),
      ],
      relationships: [
        ...Array.from({ length: 125 }, (_, index) => ({
          start: { id: `emp-${index + 2}` },
          end: { id: index < 45 ? 'dept-1' : index < 85 ? 'dept-2' : 'dept-3' },
          type: 'BELONGS_TO_DEPARTMENT',
        })),
      ],
    })

    const layout = buildGraphLayout(network)

    expect(layout['dept-1'].size).toBeGreaterThan(layout['emp-2'].size)
  })
})
