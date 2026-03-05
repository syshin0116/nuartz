"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface GraphNode {
  id: string; title: string; tags: string[]
  x?: number; y?: number; vx?: number; vy?: number
  fx?: number | null; fy?: number | null
}
interface GraphLink { source: string | GraphNode; target: string | GraphNode }
interface GraphData { nodes: GraphNode[]; links: GraphLink[] }

export function GraphView({ currentSlug }: { currentSlug?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<((reset: boolean) => void) | null>(null)
  const [data, setData] = useState<GraphData | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/graph").then(r => r.json()).then(setData).catch(console.error)
  }, [])

  const resetZoom = useCallback(() => {
    zoomRef.current?.(true)
  }, [])

  useEffect(() => {
    if (!data || !svgRef.current) return
    let cancelled = false

    async function renderGraph() {
      const d3 = await import("d3")
      if (cancelled || !svgRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()

      const w = svgRef.current.clientWidth || 280
      const h = 280

      const nodesCopy = data!.nodes.map(n => ({ ...n }))
      const linksCopy = data!.links.map(l => ({ ...l }))

      // Build adjacency set for hover highlighting
      const neighbors = new Map<string, Set<string>>()
      for (const node of nodesCopy) neighbors.set(node.id, new Set())

      const sim = d3.forceSimulation<GraphNode>(nodesCopy)
        .force("link", d3.forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(55))
        .force("charge", d3.forceManyBody().strength(-90))
        .force("center", d3.forceCenter(w / 2, h / 2))
        .force("collision", d3.forceCollide(16))

      // Zoom behaviour
      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", e => g.attr("transform", e.transform))

      svg.call(zoomBehavior)

      // Expose reset function
      zoomRef.current = (reset: boolean) => {
        if (reset) {
          svg.transition().duration(400).call(
            zoomBehavior.transform,
            d3.zoomIdentity
          )
        }
      }

      const g = svg.append("g")

      const link = g.append("g")
        .selectAll("line")
        .data(linksCopy)
        .join("line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.25)
        .attr("stroke-width", 1)

      const node = g.append("g")
        .selectAll<SVGGElement, GraphNode>("g")
        .data(nodesCopy)
        .join("g")
        .attr("cursor", "pointer")
        .on("click", (_, d) => router.push(`/${d.id}`))
        .on("mouseenter", (event, d) => {
          setHoveredId(d.id)

          // Highlight connected nodes
          const connected = new Set<string>([d.id])
          linksCopy.forEach(l => {
            const s = (l.source as GraphNode).id
            const t = (l.target as GraphNode).id
            if (s === d.id) connected.add(t)
            if (t === d.id) connected.add(s)
          })

          node.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("opacity", n => connected.has(n.id) ? 1 : 0.15)
            .attr("r", n => {
              if (n.id === d.id) return n.id === currentSlug ? 9 : 7
              return n.id === currentSlug ? 7 : 4
            })

          link
            .attr("stroke-opacity", l => {
              const s = (l.source as GraphNode).id
              const t = (l.target as GraphNode).id
              return s === d.id || t === d.id ? 0.7 : 0.05
            })
            .attr("stroke-width", l => {
              const s = (l.source as GraphNode).id
              const t = (l.target as GraphNode).id
              return s === d.id || t === d.id ? 1.5 : 1
            })

          label
            .attr("opacity", n => connected.has(n.id) ? 1 : 0)
        })
        .on("mouseleave", () => {
          setHoveredId(null)
          node.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("opacity", 1)
            .attr("r", n => n.id === currentSlug ? 7 : 4)
          link.attr("stroke-opacity", 0.25).attr("stroke-width", 1)
          label.attr("opacity", 0)
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))

      node.append("circle")
        .attr("r", d => d.id === currentSlug ? 7 : 4)
        .attr("fill", d => d.id === currentSlug ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))")
        .attr("stroke", "hsl(var(--background))")
        .attr("stroke-width", 1.5)

      // Hover labels (hidden by default, shown on mouseenter)
      const label = g.append("g")
        .selectAll<SVGTextElement, GraphNode>("text")
        .data(nodesCopy)
        .join("text")
        .text(d => d.title.length > 20 ? d.title.slice(0, 18) + "…" : d.title)
        .attr("font-size", "9px")
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .attr("dy", "-8px")
        .attr("pointer-events", "none")
        .attr("opacity", 0)

      sim.on("tick", () => {
        link
          .attr("x1", d => (d.source as GraphNode).x!)
          .attr("y1", d => (d.source as GraphNode).y!)
          .attr("x2", d => (d.target as GraphNode).x!)
          .attr("y2", d => (d.target as GraphNode).y!)

        node.attr("transform", d => `translate(${d.x},${d.y})`)
        label.attr("x", d => d.x!).attr("y", d => d.y!)
      })
    }

    renderGraph()
    return () => { cancelled = true }
  }, [data, currentSlug, router])

  if (!data) {
    return (
      <div className="w-full">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Graph</p>
        <div className="flex h-[260px] items-center justify-center rounded-lg border bg-muted/10 text-xs text-muted-foreground">
          Loading…
        </div>
      </div>
    )
  }

  if (data.nodes.length === 0) return null

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Graph</p>
        <button
          onClick={resetZoom}
          title="Reset view"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {/* home/reset icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full rounded-lg border bg-muted/10"
          style={{ height: 260 }}
        />
        {hoveredId && (
          <div className="absolute bottom-2 left-2 right-2 rounded bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur pointer-events-none truncate border">
            {data.nodes.find(n => n.id === hoveredId)?.title ?? hoveredId}
          </div>
        )}
      </div>
      <p className="mt-1 text-center text-[10px] text-muted-foreground/60">
        scroll to zoom · drag to pan · click to navigate
      </p>
    </div>
  )
}
