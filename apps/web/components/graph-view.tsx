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
const MAX_LOCAL_NODES = 28

/** Extract the subgraph reachable within `depth` hops from `rootId`, capped at MAX_LOCAL_NODES. */
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

  // Always include the root node
  const nodeSet = new Set<string>()
  if (data.nodes.some(n => n.id === rootId)) nodeSet.add(rootId)

  // Collect 1-hop neighbors
  const oneHop = [...(adjacency.get(rootId) ?? [])]
    .filter(id => data.nodes.some(n => n.id === id))

  if (oneHop.length + 1 <= MAX_LOCAL_NODES) {
    // All 1-hop neighbors fit — add them all
    for (const id of oneHop) nodeSet.add(id)

    // Try adding 2-hop neighbors if depth allows
    if (depth >= 2) {
      // Sort 2-hop candidates by their total connection count (most connected first)
      const twoHopCandidates: { id: string; connections: number }[] = []
      const seen = new Set<string>(nodeSet)
      for (const neighbor of oneHop) {
        for (const hop2 of adjacency.get(neighbor) ?? []) {
          if (!seen.has(hop2) && data.nodes.some(n => n.id === hop2)) {
            seen.add(hop2)
            // Count how many nodes already in the graph this candidate connects to
            const connectionsToGraph = [...(adjacency.get(hop2) ?? [])]
              .filter(id => nodeSet.has(id)).length
            twoHopCandidates.push({ id: hop2, connections: connectionsToGraph })
          }
        }
      }
      // Prioritize 2-hop nodes with more connections to the existing graph
      twoHopCandidates.sort((a, b) => b.connections - a.connections)
      for (const candidate of twoHopCandidates) {
        if (nodeSet.size >= MAX_LOCAL_NODES) break
        nodeSet.add(candidate.id)
      }
    }
  } else {
    // Too many 1-hop neighbors — keep only the most connected ones
    const rankedNeighbors = oneHop
      .map(id => ({
        id,
        // Prioritize by total adjacency count (hub nodes are more informative)
        totalConnections: adjacency.get(id)?.size ?? 0,
      }))
      .sort((a, b) => b.totalConnections - a.totalConnections)

    for (const neighbor of rankedNeighbors) {
      if (nodeSet.size >= MAX_LOCAL_NODES) break
      nodeSet.add(neighbor.id)
    }
  }

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

      // SVG defs for glow filter
      const defs = svg.append("defs")
      const glowFilter = defs.append("filter")
        .attr("id", "node-glow")
        .attr("x", "-50%").attr("y", "-50%")
        .attr("width", "200%").attr("height", "200%")
      glowFilter.append("feGaussianBlur")
        .attr("stdDeviation", "1.5")
        .attr("result", "blur")
      glowFilter.append("feComposite")
        .attr("in", "SourceGraphic")
        .attr("in2", "blur")
        .attr("operator", "over")

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

      // Node radius: scale by link count — compact for small sidebar widget
      const maxLinks = Math.max(...nodesCopy.map(n => n.linkCount), 1)
      const nodeRadius = (d: GraphNode) => {
        if (d.id === currentSlug) return 5
        if (d.type === "tag") return 2.5
        return 2.5 + (d.linkCount / maxLinks) * 2.5
      }

      const sim = d3.forceSimulation<GraphNode>(nodesCopy)
        .force("link", d3.forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(40))
        .force("charge", d3.forceManyBody().strength(-60))
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide<GraphNode>(d => nodeRadius(d) + 3))

      sim.stop()
      for (let i = 0; i < 300; i++) sim.tick()

      // Center on the centroid (weighted center) of all nodes for better visual balance
      const xs = nodesCopy.map(d => d.x ?? 0)
      const ys = nodesCopy.map(d => d.y ?? 0)
      const cx = xs.reduce((a, b) => a + b, 0) / xs.length
      const cy = ys.reduce((a, b) => a + b, 0) / ys.length
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const gw = Math.max(maxX - minX, 1)
      const gh = Math.max(maxY - minY, 1)
      const pad = 24
      const rawScale = Math.min((w - pad * 2) / gw, (h - pad * 2) / gh)
      const fitScale = Math.min(Math.max(rawScale, 0.5), 1.4)
      const initTransform = d3.zoomIdentity
        .translate(w / 2 - cx * fitScale, h / 2 - cy * fitScale)
        .scale(fitScale)

      const g = svg.append("g")

      let currentZoomScale = fitScale

      const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", e => {
          g.attr("transform", e.transform)
          const scale = e.transform.k
          if (Math.abs(scale - currentZoomScale) > 0.05) {
            currentZoomScale = scale
            const targetOpacity = scale > 1.0 ? Math.min((scale - 1.0) / 0.6, 1) : 0
            labels.transition().duration(150).attr("opacity", targetOpacity)
          }
        })

      svg.call(zoomBehavior)
      svg.call(zoomBehavior.transform, initTransform)

      svg.on("dblclick.zoom", () =>
        svg.transition().duration(350).call(zoomBehavior.transform, initTransform)
      )

      // Curved links using quadratic bezier paths
      const link = g.append("g")
        .selectAll("path")
        .data(linksCopy)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.15)
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
          const connected = new Set<string>([d.id])
          linksCopy.forEach(l => {
            const s = (l.source as GraphNode).id
            const t = (l.target as GraphNode).id
            if (s === d.id) connected.add(t)
            if (t === d.id) connected.add(s)
          })

          node.selectAll<SVGCircleElement | SVGRectElement, GraphNode>("circle, rect")
            .transition().duration(200)
            .attr("opacity", n => connected.has(n.id) ? 1 : 0.12)
            .attr("filter", n => connected.has(n.id) ? "url(#node-glow)" : "none")

          // Show full title on hover (undo truncation)
          labels
            .text(n => connected.has(n.id) ? n.title : (n.title.length > 20 ? n.title.slice(0, 18) + "…" : n.title))
            .transition().duration(200)
            .attr("opacity", n => connected.has(n.id) ? 1 : 0)

          link.transition().duration(200)
            .attr("stroke-opacity", l => {
              const s = (l.source as GraphNode).id
              const t = (l.target as GraphNode).id
              return s === d.id || t === d.id ? 0.5 : 0.03
            })
            .attr("stroke-width", l => {
              const s = (l.source as GraphNode).id
              const t = (l.target as GraphNode).id
              return s === d.id || t === d.id ? 1.5 : 1
            })
        })
        .on("mouseleave", () => {
          node.selectAll<SVGCircleElement | SVGRectElement, GraphNode>("circle, rect")
            .transition().duration(300)
            .attr("opacity", 1)
            .attr("filter", "none")
          labels
            .text(n => n.title.length > 20 ? n.title.slice(0, 18) + "…" : n.title)
            .transition().duration(300)
            .attr("opacity", currentZoomScale > 1.0 ? Math.min((currentZoomScale - 1.0) / 0.6, 1) : 0)
          link.transition().duration(300).attr("stroke-opacity", 0.15).attr("stroke-width", 1)
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y })
          .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))

      // Render node shapes with glow on current page
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
          const isCurrent = d.id === currentSlug
          el.append("circle")
            .attr("r", r)
            .attr("fill", isCurrent ? "var(--primary)" : "var(--foreground)")
            .attr("fill-opacity", isCurrent ? 1 : 0.7)
            .attr("stroke", "var(--foreground)")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.3)
            .attr("filter", isCurrent ? "url(#node-glow)" : "none")
        }
      })

      // Zoom-based text labels with truncation
      const labels = node.append("text")
        .text(d => d.title.length > 20 ? d.title.slice(0, 18) + "…" : d.title)
        .attr("dx", d => nodeRadius(d) + 4)
        .attr("dy", "0.35em")
        .attr("font-size", "10px")
        .attr("fill", "currentColor")
        .attr("fill-opacity", 0.85)
        .attr("pointer-events", "none")
        .attr("opacity", fitScale > 1.0 ? Math.min((fitScale - 1.0) / 0.6, 1) : 0)

      // Simple overlap avoidance: flip label to left side if another node is too close on the right
      nodesCopy.forEach((d, i) => {
        const r = nodeRadius(d)
        const hasRightNeighbor = nodesCopy.some((other, j) => {
          if (i === j) return false
          const dx = (other.x ?? 0) - (d.x ?? 0)
          const dy = (other.y ?? 0) - (d.y ?? 0)
          return dx > 0 && dx < 60 && Math.abs(dy) < 12
        })
        if (hasRightNeighbor) {
          d3.select(labels.nodes()[i])
            .attr("dx", -(r + 4))
            .attr("text-anchor", "end")
        }
      })

      const updatePositions = () => {
        // Curved paths: slight arc using quadratic bezier
        link.attr("d", (d) => {
          const s = d.source as GraphNode
          const t = d.target as GraphNode
          const dx = t.x! - s.x!
          const dy = t.y! - s.y!
          const dist = Math.sqrt(dx * dx + dy * dy)
          const curve = dist * 0.12
          const mx = (s.x! + t.x!) / 2 - (dy / dist) * curve
          const my = (s.y! + t.y!) / 2 + (dx / dist) * curve
          return `M${s.x},${s.y} Q${mx},${my} ${t.x},${t.y}`
        })
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
          <svg className="h-5 w-5 animate-spin text-muted-foreground/50" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  if (data.nodes.length === 0) return null

  return (
    <div className="w-full mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Graph</p>
      <svg
        ref={svgRef}
        className="w-full rounded-lg border bg-muted/5 animate-in fade-in-0 duration-500"
        style={{ height: 260 }}
      />
    </div>
  )
}
