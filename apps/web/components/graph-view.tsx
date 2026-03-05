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
    fetch("/api/graph").then(r => r.json()).then(setData).catch(console.error)
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

      const sim = d3.forceSimulation<GraphNode>(nodesCopy)
        .force("link", d3.forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(50))
        .force("charge", d3.forceManyBody().strength(-80))
        .force("center", d3.forceCenter(w / 2, h / 2))
        .force("collision", d3.forceCollide(14))

      // Pre-run ticks so initial positions are stable
      sim.stop()
      for (let i = 0; i < 200; i++) sim.tick()

      // Fit graph to viewport
      const xs = nodesCopy.map(d => d.x ?? 0)
      const ys = nodesCopy.map(d => d.y ?? 0)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const gw = maxX - minX || w, gh = maxY - minY || h
      const pad = 28
      const scale = Math.min((w - pad * 2) / gw, (h - pad * 2) / gh, 2.5)
      const initTransform = d3.zoomIdentity
        .translate((w - scale * (minX + maxX)) / 2, (h - scale * (minY + maxY)) / 2)
        .scale(scale)

      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", e => g.attr("transform", e.transform))

      svg.call(zoomBehavior)
      svg.call(zoomBehavior.transform, initTransform)

      // Double-click to reset zoom
      svg.on("dblclick.zoom", () =>
        svg.transition().duration(350).call(zoomBehavior.transform, initTransform)
      )

      sim.restart()

      const g = svg.append("g")

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

          node.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("opacity", n => connected.has(n.id) ? 1 : 0.12)
            .attr("r", n => n.type === "tag" ? 3 : (n.id === d.id ? 8 : n.id === currentSlug ? 8 : 5))

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

          label.attr("opacity", n => connected.has(n.id) ? 1 : 0)
        })
        .on("mouseleave", () => {
          setHoveredId(null)
          node.selectAll<SVGCircleElement, GraphNode>("circle")
            .attr("opacity", 1)
            .attr("r", n => n.type === "tag" ? 3 : n.id === currentSlug ? 8 : 5)
          link.attr("stroke-opacity", 0.2).attr("stroke-width", 1)
          label.attr("opacity", 0)
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))

      // Notes: prominent filled circle; Tags: small subtle outlined circle
      node.append("circle")
        .attr("r", d => d.type === "tag" ? 3 : d.id === currentSlug ? 8 : 5)
        .attr("fill", d => {
          if (d.type === "tag") return "transparent"
          return d.id === currentSlug ? "hsl(var(--primary))" : "hsl(var(--foreground))"
        })
        .attr("fill-opacity", d => d.type === "tag" ? 0 : d.id === currentSlug ? 1 : 0.55)
        .attr("stroke", d => d.type === "tag" ? "hsl(var(--muted-foreground))" : "hsl(var(--background))")
        .attr("stroke-width", d => d.type === "tag" ? 1.5 : 1.5)
        .attr("stroke-opacity", d => d.type === "tag" ? 0.5 : 1)

      const label = g.append("g")
        .selectAll<SVGTextElement, GraphNode>("text")
        .data(nodesCopy)
        .join("text")
        .text(d => d.title.length > 18 ? d.title.slice(0, 16) + "…" : d.title)
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
          <div className="absolute bottom-2 left-2 right-2 rounded-md bg-background/90 px-2 py-1 text-xs text-foreground backdrop-blur pointer-events-none truncate border">
            {data.nodes.find(n => n.id === hoveredId)?.title ?? hoveredId}
          </div>
        )}
      </div>
    </div>
  )
}
