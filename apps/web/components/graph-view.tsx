"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

interface GraphNode {
  id: string; title: string; tags: string[]; type?: "note" | "tag"
  x?: number; y?: number; vx?: number; vy?: number
  fx?: number | null; fy?: number | null
}
interface GraphLink { source: string | GraphNode; target: string | GraphNode }
interface GraphData { nodes: GraphNode[]; links: GraphLink[] }

export function GraphView({ currentSlug }: { currentSlug?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<GraphData | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Try static JSON first (for static export), fall back to API route
    fetch("/graph.json")
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => fetch("/api/graph").then(r => r.json()).then(setData))
      .catch(console.error)
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
      const h = 260

      const nodesCopy = data!.nodes.map(n => ({ ...n }))
      const linksCopy = data!.links.map(l => ({ ...l }))

      // Force center at origin (like Quartz) — nodes cluster around (0,0)
      const sim = d3.forceSimulation<GraphNode>(nodesCopy)
        .force("link", d3.forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(35))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide(10))

      // Pre-run to stable layout, keep stopped so positions don't drift
      sim.stop()
      for (let i = 0; i < 300; i++) sim.tick()

      // Compute scale to fit all nodes in viewport
      const xs = nodesCopy.map(d => d.x ?? 0)
      const ys = nodesCopy.map(d => d.y ?? 0)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const gw = Math.max(maxX - minX, 1)
      const gh = Math.max(maxY - minY, 1)
      const pad = 24
      const rawScale = Math.min((w - pad * 2) / gw, (h - pad * 2) / gh)
      const fitScale = Math.min(Math.max(rawScale, 0.5), 2)
      // translate(w/2, h/2) centers origin; then scale zooms around that center
      const initTransform = d3.zoomIdentity.translate(w / 2, h / 2).scale(fitScale)

      // g must be declared before zoomBehavior references it
      const g = svg.append("g")

      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", e => g.attr("transform", e.transform))

      svg.call(zoomBehavior)
      svg.call(zoomBehavior.transform, initTransform)

      // Double-click to reset zoom
      svg.on("dblclick.zoom", () =>
        svg.transition().duration(350).call(zoomBehavior.transform, initTransform)
      )

      const link = g.append("g")
        .selectAll("line")
        .data(linksCopy)
        .join("line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", 1)

      const node = g.append("g")
        .selectAll<SVGGElement, GraphNode>("g")
        .data(nodesCopy)
        .join("g")
        .attr("cursor", "pointer")
        .on("click", (_, d) => {
          if (d.type === "tag") router.push(`/tags/${d.id.replace("tag/", "")}`)
          else router.push(`/${d.id}`)
        })
        .on("mouseenter", (_, d) => {
          setHoveredId(d.id)

          const connected = new Set<string>([d.id])
          linksCopy.forEach(l => {
            const s = (l.source as GraphNode).id
            const t = (l.target as GraphNode).id
            if (s === d.id) connected.add(t)
            if (t === d.id) connected.add(s)
          })

          node.selectAll<SVGCircleElement | SVGRectElement, GraphNode>("circle, rect")
            .attr("opacity", n => connected.has(n.id) ? 1 : 0.12)

          link
            .attr("stroke-opacity", l => {
              const s = (l.source as GraphNode).id
              const t = (l.target as GraphNode).id
              return s === d.id || t === d.id ? 0.65 : 0.05
            })
            .attr("stroke-width", l => {
              const s = (l.source as GraphNode).id
              const t = (l.target as GraphNode).id
              return s === d.id || t === d.id ? 1.5 : 1
            })
        })
        .on("mouseleave", () => {
          setHoveredId(null)
          node.selectAll<SVGCircleElement | SVGRectElement, GraphNode>("circle, rect")
            .attr("opacity", 1)
          link.attr("stroke-opacity", 0.2).attr("stroke-width", 1)
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))

      // Notes: filled circles; Tags: diamond shape (rotated square) with accent color
      node.each(function(d) {
        const el = d3.select(this)
        if (d.type === "tag") {
          el.append("rect")
            .attr("width", 7).attr("height", 7)
            .attr("x", -3.5).attr("y", -3.5)
            .attr("transform", "rotate(45)")
            .attr("fill", "hsl(var(--chart-1))")
            .attr("fill-opacity", 0.7)
            .attr("stroke", "hsl(var(--chart-1))")
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.9)
        } else {
          el.append("circle")
            .attr("r", d.id === currentSlug ? 8 : 5)
            .attr("fill", d.id === currentSlug ? "hsl(var(--primary))" : "hsl(var(--foreground))")
            .attr("fill-opacity", d.id === currentSlug ? 1 : 0.7)
            .attr("stroke", "hsl(var(--foreground))")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.3)
        }
      })

      const updatePositions = () => {
        link
          .attr("x1", d => (d.source as GraphNode).x!)
          .attr("y1", d => (d.source as GraphNode).y!)
          .attr("x2", d => (d.target as GraphNode).x!)
          .attr("y2", d => (d.target as GraphNode).y!)
        node.attr("transform", d => `translate(${d.x},${d.y})`)
      }

      sim.on("tick", updatePositions)
      // Apply positions immediately — sim is stopped so tick event never fires on its own
      updatePositions()
    }

    renderGraph()
    return () => { cancelled = true }
  }, [data, currentSlug, router])

  if (!data) {
    return (
      <div className="w-full mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Graph</p>
        <div className="flex h-[260px] items-center justify-center rounded-lg border bg-muted/5 text-xs text-muted-foreground">
          Loading…
        </div>
      </div>
    )
  }

  if (data.nodes.length === 0) return null

  return (
    <div className="w-full mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Graph</p>
      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full rounded-lg border bg-muted/5"
          style={{ height: 260 }}
        />
        {hoveredId && (
          <div className="absolute bottom-2 left-2 right-2 rounded-md bg-background/95 px-2.5 py-1.5 text-sm text-foreground backdrop-blur pointer-events-none truncate border shadow-sm">
            {data.nodes.find(n => n.id === hoveredId)?.title ?? hoveredId}
          </div>
        )}
      </div>
    </div>
  )
}
