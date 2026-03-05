"use client"
import { useEffect, useRef, useState } from "react"
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
  const [data, setData] = useState<GraphData | null>(null)
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
      const h = 280
      const nodesCopy = data!.nodes.map(n => ({ ...n }))
      const linksCopy = data!.links.map(l => ({ ...l }))
      const sim = d3.forceSimulation<GraphNode>(nodesCopy)
        .force("link", d3.forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(50))
        .force("charge", d3.forceManyBody().strength(-80))
        .force("center", d3.forceCenter(w / 2, h / 2))
        .force("collision", d3.forceCollide(14))
      const g = svg.append("g")
      svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", e => g.attr("transform", e.transform)))
      const link = g.append("g").selectAll("line").data(linksCopy).join("line")
        .attr("stroke", "currentColor").attr("stroke-opacity", 0.2).attr("stroke-width", 1)
      const node = g.append("g").selectAll<SVGCircleElement, GraphNode>("circle")
        .data(nodesCopy).join("circle")
        .attr("r", d => d.id === currentSlug ? 7 : 4)
        .attr("fill", d => d.id === currentSlug ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))")
        .attr("stroke", "hsl(var(--background))").attr("stroke-width", 1.5)
        .attr("cursor", "pointer")
        .on("click", (_, d) => router.push(`/${d.id}`))
        .call(d3.drag<SVGCircleElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))
      node.append("title").text(d => d.title)
      sim.on("tick", () => {
        link.attr("x1", d => (d.source as GraphNode).x!).attr("y1", d => (d.source as GraphNode).y!)
            .attr("x2", d => (d.target as GraphNode).x!).attr("y2", d => (d.target as GraphNode).y!)
        node.attr("cx", d => d.x!).attr("cy", d => d.y!)
      })
    }
    renderGraph()
    return () => { cancelled = true }
  }, [data, currentSlug, router])

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Graph</p>
      {!data ? (
        <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">Loading…</div>
      ) : data.nodes.length === 0 ? null : (
        <svg ref={svgRef} className="w-full rounded-lg border bg-muted/10" style={{ height: 280 }} />
      )}
    </div>
  )
}
