"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

interface GraphNode {
  id: string; title: string; tags: string[]; type?: "note" | "tag"
  x?: number; y?: number; vx?: number; vy?: number
  fx?: number | null; fy?: number | null
  linkCount: number
}
interface GraphLink { source: string | GraphNode; target: string | GraphNode }
interface GraphData { nodes: GraphNode[]; links: GraphLink[] }

const LOCAL_DEPTH = 2

/** Extract the subgraph reachable within `depth` hops from `rootId`. */
function extractLocalGraph(data: GraphData, rootId: string, depth: number): GraphData {
  const adjacency = new Map<string, Set<string>>()
  for (const l of data.links) {
    const s = typeof l.source === "string" ? l.source : l.source.id
    const t = typeof l.target === "string" ? l.target : l.target.id
    if (!adjacency.has(s)) adjacency.set(s, new Set())
    if (!adjacency.has(t)) adjacency.set(t, new Set())
    adjacency.get(s)!.add(t)
    adjacency.get(t)!.add(s)
  }

  const visited = new Set<string>()
  let frontier = [rootId]
  for (let d = 0; d <= depth && frontier.length; d++) {
    const next: string[] = []
    for (const id of frontier) {
      if (visited.has(id)) continue
      visited.add(id)
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!visited.has(neighbor)) next.push(neighbor)
      }
    }
    frontier = next
  }

  const nodeSet = visited
  const nodes = data.nodes.filter(n => nodeSet.has(n.id))
  const links = data.links.filter(l => {
    const s = typeof l.source === "string" ? l.source : l.source.id
    const t = typeof l.target === "string" ? l.target : l.target.id
    return nodeSet.has(s) && nodeSet.has(t)
  })
  return { nodes, links }
}

export function GraphView({ currentSlug }: { currentSlug?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<GraphData | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
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

      // Local graph: only nodes within LOCAL_DEPTH hops of current page
      const graphData = currentSlug
        ? extractLocalGraph(data!, currentSlug, LOCAL_DEPTH)
        : data!

      // Count incoming links per node for proportional sizing
      const linkCounts = new Map<string, number>()
      for (const l of graphData.links) {
        const s = typeof l.source === "string" ? l.source : l.source.id
        const t = typeof l.target === "string" ? l.target : l.target.id
        linkCounts.set(s, (linkCounts.get(s) ?? 0) + 1)
        linkCounts.set(t, (linkCounts.get(t) ?? 0) + 1)
      }

      const nodesCopy = graphData.nodes.map(n => ({ ...n, linkCount: linkCounts.get(n.id) ?? 0 }))
      const linksCopy = graphData.links.map(l => ({ ...l }))

      // Node radius: scale by link count (min 4, max 12, current page always prominent)
      const maxLinks = Math.max(...nodesCopy.map(n => n.linkCount), 1)
      const nodeRadius = (d: GraphNode) => {
        if (d.id === currentSlug) return Math.max(8, 4 + (d.linkCount! / maxLinks) * 8)
        if (d.type === "tag") return 3.5
        return 4 + (d.linkCount! / maxLinks) * 6
      }

      const sim = d3.forceSimulation<GraphNode>(nodesCopy)
        .force("link", d3.forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(35))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide<GraphNode>(d => nodeRadius(d) + 2))

      sim.stop()
      for (let i = 0; i < 300; i++) sim.tick()

      const xs = nodesCopy.map(d => d.x ?? 0)
      const ys = nodesCopy.map(d => d.y ?? 0)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const gw = Math.max(maxX - minX, 1)
      const gh = Math.max(maxY - minY, 1)
      const pad = 24
      const rawScale = Math.min((w - pad * 2) / gw, (h - pad * 2) / gh)
      const fitScale = Math.min(Math.max(rawScale, 0.5), 2)
      const initTransform = d3.zoomIdentity.translate(w / 2, h / 2).scale(fitScale)

      const g = svg.append("g")

      let currentZoomScale = fitScale

      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", e => {
          g.attr("transform", e.transform)
          // Update label visibility based on zoom level
          const scale = e.transform.k
          if (Math.abs(scale - currentZoomScale) > 0.05) {
            currentZoomScale = scale
            labels.attr("opacity", scale > 1.2 ? Math.min((scale - 1.2) / 0.8, 1) : 0)
          }
        })

      svg.call(zoomBehavior)
      svg.call(zoomBehavior.transform, initTransform)

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

          labels.attr("opacity", n => connected.has(n.id) ? 1 : 0)

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
          labels.attr("opacity", currentZoomScale > 1.2 ? Math.min((currentZoomScale - 1.2) / 0.8, 1) : 0)
          link.attr("stroke-opacity", 0.2).attr("stroke-width", 1)
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))

      // Render node shapes
      node.each(function(d) {
        const el = d3.select(this)
        if (d.type === "tag") {
          const r = nodeRadius(d)
          el.append("rect")
            .attr("width", r * 2).attr("height", r * 2)
            .attr("x", -r).attr("y", -r)
            .attr("transform", "rotate(45)")
            .attr("fill", "var(--muted-foreground)")
            .attr("fill-opacity", 0.7)
            .attr("stroke", "var(--muted-foreground)")
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.9)
        } else {
          const r = nodeRadius(d)
          el.append("circle")
            .attr("r", r)
            .attr("fill", d.id === currentSlug ? "var(--primary)" : "var(--foreground)")
            .attr("fill-opacity", d.id === currentSlug ? 1 : 0.7)
            .attr("stroke", "var(--foreground)")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.3)
        }
      })

      // Zoom-based text labels
      const labels = node.append("text")
        .text(d => d.title)
        .attr("dx", d => nodeRadius(d) + 3)
        .attr("dy", "0.35em")
        .attr("font-size", "8px")
        .attr("fill", "currentColor")
        .attr("fill-opacity", 0.8)
        .attr("pointer-events", "none")
        .attr("opacity", fitScale > 1.2 ? Math.min((fitScale - 1.2) / 0.8, 1) : 0)

      const updatePositions = () => {
        link
          .attr("x1", d => (d.source as GraphNode).x!)
          .attr("y1", d => (d.source as GraphNode).y!)
          .attr("x2", d => (d.target as GraphNode).x!)
          .attr("y2", d => (d.target as GraphNode).y!)
        node.attr("transform", d => `translate(${d.x},${d.y})`)
      }

      sim.on("tick", updatePositions)
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
