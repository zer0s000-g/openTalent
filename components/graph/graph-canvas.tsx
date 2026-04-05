'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import type {
  GraphNode,
  NetworkResult,
} from '@/lib/graph-formatters'
import {
  buildGraphLayout,
  buildNeighborMap,
} from '@/lib/graph-formatters'

export interface GraphCanvasHandle {
  resetView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

interface GraphCanvasProps {
  network: NetworkResult | null
  selectedNodeId?: string | null
  hoveredNodeId?: string | null
  onSelectNode: (node: GraphNode) => void
  onHoverNode?: (nodeId: string | null) => void
  className?: string
}

const FADED_NODE = '#d7e0ee'
const FADED_EDGE = 'rgba(164, 178, 199, 0.16)'
const EMPLOYEE_EDGE = 'rgba(47, 91, 255, 0.52)'
const SKILL_EDGE = 'rgba(0, 222, 255, 0.44)'
const DEPARTMENT_EDGE = 'rgba(255, 170, 46, 0.50)'

type CanvasNodeAttributes = {
  size: number
  label: string
  color: string
  kind: string
  isCenter: boolean
}

type CanvasEdgeAttributes = {
  color: string
  size: number
  label: string
  relationType: string
}

type CameraStateLike = {
  x: number
  y: number
  ratio: number
}

type NodeReducerResult = {
  color?: string
  label?: string | null
  size?: number
  highlighted?: boolean
  zIndex?: number
}

type EdgeReducerResult = {
  color?: string
  hidden?: boolean
  size?: number
  zIndex?: number
}

export function getEdgeVisual(relationType: string, emphasized = false) {
  if (relationType === 'HAS_SKILL') {
    return {
      color: emphasized ? 'rgba(0, 234, 255, 0.82)' : SKILL_EDGE,
      size: emphasized ? 2.7 : 1.95,
    }
  }

  if (relationType === 'BELONGS_TO_DEPARTMENT') {
    return {
      color: emphasized ? 'rgba(255, 182, 63, 0.78)' : DEPARTMENT_EDGE,
      size: emphasized ? 2.9 : 2.15,
    }
  }

  return {
    color: emphasized ? 'rgba(90, 133, 255, 0.86)' : EMPLOYEE_EDGE,
    size: emphasized ? 3.2 : 2.5,
  }
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  { network, selectedNodeId, hoveredNodeId, onSelectNode, onHoverNode, className = '' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<any>(null)
  const graphRef = useRef<any>(null)
  const neighborMapRef = useRef<Map<string, Set<string>>>(new Map())
  const edgeEndpointsRef = useRef<Map<string, { source: string; target: string }>>(new Map())
  const nodeMapRef = useRef<Map<string, GraphNode>>(new Map())

  useImperativeHandle(ref, () => ({
    resetView() {
      rendererRef.current?.getCamera().animatedReset({ duration: 250 })
    },
    zoomIn() {
      rendererRef.current?.getCamera().animatedZoom({ duration: 200, factor: 1.5 })
    },
    zoomOut() {
      rendererRef.current?.getCamera().animatedUnzoom({ duration: 200, factor: 1.5 })
    },
  }))

  useEffect(() => {
    if (!containerRef.current || !network || !network.nodes.length) return
    const networkData = network
    let cancelled = false
    let observer: ResizeObserver | null = null
    let renderer: any = null

    async function waitForContainerReady(element: HTMLDivElement) {
      let attempts = 0

      while (!cancelled && attempts < 20) {
        if (element.clientWidth > 0 && element.clientHeight > 0) return
        attempts += 1
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    }

    async function initializeRenderer() {
      const [{ default: Graph }, { default: Sigma }] = await Promise.all([
        import('graphology'),
        import('sigma'),
      ])

      if (cancelled || !containerRef.current) return
      await waitForContainerReady(containerRef.current)
      if (cancelled || !containerRef.current) return

      const graph = new Graph()
      const layout = buildGraphLayout(networkData)
      const nodeMap = new Map(networkData.nodes.map((node) => [node.id, node]))
      const edgeEndpoints = new Map<string, { source: string; target: string }>()

      for (const node of networkData.nodes) {
        const nodeLayout = layout[node.id]
        graph.addNode(node.id, {
          x: nodeLayout.x,
          y: nodeLayout.y,
          size: nodeLayout.size,
          label: nodeLayout.label,
          color: nodeLayout.color,
          kind: nodeLayout.kind,
          isCenter: nodeLayout.isCenter,
        })
      }

      networkData.relationships.forEach((relationship, index) => {
        if (!graph.hasNode(relationship.start.id) || !graph.hasNode(relationship.end.id)) return

        const edgeKey = `${relationship.type}-${index}`
        const edgeVisual = getEdgeVisual(relationship.type)

        graph.addDirectedEdgeWithKey(edgeKey, relationship.start.id, relationship.end.id, {
          color: edgeVisual.color,
          size: edgeVisual.size,
          label: relationship.type.replace(/_/g, ' ').toLowerCase(),
          relationType: relationship.type,
        })
        edgeEndpoints.set(edgeKey, {
          source: relationship.start.id,
          target: relationship.end.id,
        })
      })

      containerRef.current.innerHTML = ''

      renderer = new Sigma(graph, containerRef.current, {
        labelDensity: 0.07,
        labelRenderedSizeThreshold: 11,
        labelFont: 'var(--font-body), sans-serif',
        labelWeight: '600',
        defaultEdgeType: 'line',
        defaultNodeColor: '#2f5bff',
        defaultEdgeColor: EMPLOYEE_EDGE,
        stagePadding: 24,
        minCameraRatio: 0.08,
        maxCameraRatio: 2.8,
        enableEdgeEvents: false,
        zIndex: true,
        allowInvalidContainer: true,
        renderLabels: true,
      })

      renderer.on('clickNode', ({ node }: { node: string }) => {
        const clicked = nodeMap.get(node)
        if (clicked) onSelectNode(clicked)
      })

      renderer.on('enterNode', ({ node }: { node: string }) => {
        onHoverNode?.(node)
      })

      renderer.on('leaveNode', () => {
        onHoverNode?.(null)
      })

      renderer.on('clickStage', () => {
        onHoverNode?.(null)
      })

      observer = new ResizeObserver(() => {
        renderer.resize()
      })
      observer.observe(containerRef.current)

      renderer.getCamera().animatedReset({ duration: 250 })

      rendererRef.current = renderer
      graphRef.current = graph
      neighborMapRef.current = buildNeighborMap(networkData)
      edgeEndpointsRef.current = edgeEndpoints
      nodeMapRef.current = nodeMap
    }

    void initializeRenderer()

    return () => {
      cancelled = true
      observer?.disconnect()
      renderer?.kill()
      rendererRef.current = null
      graphRef.current = null
      neighborMapRef.current = new Map()
      edgeEndpointsRef.current = new Map()
      nodeMapRef.current = new Map()
    }
  }, [network, onHoverNode, onSelectNode])

  useEffect(() => {
    const renderer = rendererRef.current
    const graph = graphRef.current
    if (!renderer || !graph) return

    const focusedNodeId = hoveredNodeId || selectedNodeId || null
    const neighborIds = focusedNodeId ? new Set(neighborMapRef.current.get(focusedNodeId) || []) : null

    renderer.setSetting('nodeReducer', (node: string, data: CanvasNodeAttributes) => {
      const nodeKind = data.kind
      const isFocused = node === focusedNodeId
      const isNeighbor = !!neighborIds?.has(node)
      const isRelated = isFocused || isNeighbor

      const next: NodeReducerResult = { ...data }

      if (!focusedNodeId) {
        next.highlighted = data.isCenter
        next.zIndex = data.isCenter ? 4 : data.kind === 'employee' ? 3 : data.kind === 'department' ? 2 : 1
        return next
      }

      if (!isRelated) {
        next.color = FADED_NODE
        next.label = null
        next.size = Math.max(data.size * 0.68, 7)
        next.highlighted = false
        next.zIndex = 0
        return next
      }

      if (isFocused) {
        next.highlighted = true
        next.size = data.size * (data.kind === 'department' ? 1.24 : 1.36)
        next.zIndex = 4
      } else {
        next.highlighted = nodeKind !== 'other'
        next.size = data.size * (nodeKind === 'employee' ? 1.12 : 1.09)
        next.zIndex = nodeKind === 'employee' ? 3 : 2
      }

      return next
    })

    renderer.setSetting('edgeReducer', (edge: string, data: CanvasEdgeAttributes) => {
      const endpoints = edgeEndpointsRef.current.get(edge)
      if (!focusedNodeId || !endpoints) return data

      const isConnected = endpoints.source === focusedNodeId || endpoints.target === focusedNodeId

      if (!isConnected) {
        const faded: EdgeReducerResult = {
          ...data,
          color: FADED_EDGE,
          hidden: false,
          size: 0.8,
        }
        return faded
      }

      const emphasizedVisual = getEdgeVisual(data.relationType, true)

      const emphasized: EdgeReducerResult = {
        ...data,
        color: emphasizedVisual.color,
        size: emphasizedVisual.size,
        zIndex: 1,
      }
      return emphasized
    })

    renderer.refresh()
  }, [hoveredNodeId, selectedNodeId])

  useEffect(() => {
    const renderer = rendererRef.current
    const graph = graphRef.current
    if (!renderer || !graph || !selectedNodeId || !graph.hasNode(selectedNodeId)) return

    const camera = renderer.getCamera()
    const nodePosition = graph.getNodeAttributes(selectedNodeId)
    const targetRatio = graph.order >= 120 ? 1.22 : 0.7
    const targetState: Partial<CameraStateLike> = {
      x: nodePosition.x,
      y: nodePosition.y,
      ratio: targetRatio,
    }

    camera.animate(targetState, { duration: 250 })
  }, [selectedNodeId])

  return (
    <div className={`relative h-[38rem] w-full overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#f7fbff_0%,#e9f1fb_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:h-[44rem] ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(47,91,255,0.16),transparent_26%),radial-gradient(circle_at_84%_20%,rgba(0,222,255,0.18),transparent_24%),radial-gradient(circle_at_50%_80%,rgba(255,170,46,0.10),transparent_22%)]" />
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full bg-grid-fade bg-[size:34px_34px] bg-center opacity-95"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/62 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/72 via-white/18 to-transparent" />
    </div>
  )
})
