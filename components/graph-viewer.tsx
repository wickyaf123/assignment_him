'use client'

import dynamic from 'next/dynamic'
import { useRef, useEffect, useState, useCallback } from 'react'
import { getNodeColor } from '@/lib/graph-colors'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-slate-50" />,
})

export interface GraphNode {
  id: string
  type: string
  label: string
  properties: Record<string, unknown>
  connections?: number
}

export interface GraphLink {
  source: string
  target: string
  type: string
}

interface GraphViewerProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick: (node: GraphNode) => void
  onNodeDoubleClick?: (node: GraphNode) => void
}

export function GraphViewer({ nodes, links, onNodeClick, onNodeDoubleClick }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    measure()

    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  const handleClick = useCallback((node: object) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      onNodeDoubleClick?.(node as GraphNode)
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null
        onNodeClick(node as GraphNode)
      }, 250)
    }
  }, [onNodeClick, onNodeDoubleClick])

  const paintNode = useCallback((node: { x?: number; y?: number } & Record<string, unknown>, ctx: CanvasRenderingContext2D) => {
    const gn = node as unknown as GraphNode
    const x = node.x ?? 0
    const y = node.y ?? 0
    const size = Math.max(4, Math.min(14, (gn.connections ?? 1) * 1.2 + 3))
    const color = getNodeColor(gn.type)

    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const label = gn.label.length > 35 ? gn.label.slice(0, 33) + '…' : gn.label
    ctx.font = '4px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#334155'
    ctx.fillText(label, x, y + size + 2)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          graphData={{ nodes, links }}
          nodeLabel={(node) => {
            const gn = node as GraphNode
            return `${gn.type}: ${gn.label}`
          }}
          onNodeClick={handleClick}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const gn = node as unknown as GraphNode
            const size = Math.max(4, Math.min(14, (gn.connections ?? 1) * 1.2 + 3))
            ctx.beginPath()
            ctx.arc(node.x ?? 0, node.y ?? 0, size + 3, 0, 2 * Math.PI)
            ctx.fillStyle = color
            ctx.fill()
          }}
          linkLabel={(link) => (link as GraphLink).type}
          linkColor={() => '#CBD5E1'}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkWidth={1}
          height={dimensions.height}
          width={dimensions.width}
          cooldownTicks={80}
          d3AlphaDecay={0.03}
          d3VelocityDecay={0.3}
        />
      )}
    </div>
  )
}
