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

export function shapeNetworkPayload(rawData: any): NetworkResult {
  if (!rawData) return { center: undefined, nodes: [], relationships: [] }

  return {
    center: rawData.center
      ? {
          id: rawData.center.id,
          labels: rawData.center.labels || ['Employee'],
          properties: rawData.center.properties || {},
        }
      : undefined,
    nodes: (rawData.nodes || []).map((node: any) => ({
      id: node.id,
      labels: node.labels || ['Employee'],
      properties: node.properties || {},
    })),
    relationships: (rawData.relationships || []).map((rel: any) => ({
      start: { id: rel.start?.id },
      end: { id: rel.end?.id },
      type: rel.type || 'UNKNOWN',
    })),
  }
}
