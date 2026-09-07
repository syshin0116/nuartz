"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, ChevronDown, ChevronRight, Expand, FileText, Focus, Hash, LoaderCircle, Minus, Network, Plus, RefreshCw, Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getGraphNeighborhood, graphNeighbors, graphNodeHref, type GraphData } from "@/lib/graph"
import type { PositionedNode } from "@/lib/graph-layout"

let graphRequest: Promise<GraphData> | undefined
function loadGraph() {
  return graphRequest ??= fetch("/graph.json").then(response => {
    if (!response.ok) throw new Error("Graph unavailable")
    return response.json() as Promise<GraphData>
  }).catch(error => { graphRequest = undefined; throw error })
}

function GraphCanvas({ data, currentSlug, selected, onSelect, expanded = false }: {
  data: GraphData
  currentSlug?: string
  selected?: string
  onSelect: (id: string) => void
  expanded?: boolean
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [attempt, setAttempt] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const controls = useRef<{ zoom: (factor: number) => void; fit: () => void; labels: () => void } | null>(null)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const paintSelection = () => {
    const neighbors = graphNeighbors(data, selectedRef.current)
    if (selectedRef.current) neighbors.add(selectedRef.current)
    const focusId = data.nodes.some(node => node.id === selectedRef.current) ? selectedRef.current : data.nodes[0]?.id
    svgRef.current?.querySelectorAll<SVGGElement>("[data-node]").forEach(node => {
      node.dataset.selected = String(node.dataset.node === selectedRef.current)
      node.dataset.dimmed = String(Boolean(selectedRef.current) && !neighbors.has(node.dataset.node ?? ""))
      node.setAttribute("aria-pressed", node.dataset.selected)
      node.setAttribute("tabindex", node.dataset.node === focusId ? "0" : "-1")
    })
    controls.current?.labels()
    svgRef.current?.querySelectorAll<SVGLineElement>("[data-source]").forEach(line => {
      line.dataset.active = String(line.dataset.source === selectedRef.current || line.dataset.target === selectedRef.current)
    })
  }

  useEffect(() => {
    const element = svgRef.current
    if (!element || !data.nodes.length) return
    let dispose: (() => void) | undefined
    let cancelled = false
    let worker: Worker | undefined
    setStatus("loading")

    async function draw() {
      const positions = new Promise<PositionedNode[]>((resolve, reject) => {
        worker = new Worker(new URL("../lib/graph-layout.worker.ts", import.meta.url))
        worker.onmessage = event => { resolve(event.data); worker?.terminate() }
        worker.onerror = () => { reject(new Error("Graph layout failed")); worker?.terminate() }
        worker.postMessage({ data, currentSlug, expanded })
      })
      const [d3, nodes] = await Promise.all([import("d3"), positions])
      if (cancelled || !element) return
      const svg = d3.select(element)
      dispose = () => { svg.selectAll("*").remove(); controls.current = null }
      const byId = new Map(nodes.map(node => [node.id, node]))
      const links = data.links.map(link => ({ source: byId.get(link.source)!, target: byId.get(link.target)! }))
      const degrees = new Map<string, number>()
      for (const link of data.links) for (const id of [link.source, link.target]) degrees.set(id, (degrees.get(id) ?? 0) + 1)
      const neighbors = graphNeighbors(data, currentSlug)
      const labelled = new Set(nodes.filter(node => neighbors.has(node.id))
        .sort((a, b) => (degrees.get(b.id) ?? 0) - (degrees.get(a.id) ?? 0)).slice(0, 6).map(node => node.id))

      const group = svg.append("g")
      const edgeGroup = group.append("g")
      const nodeGroup = group.append("g")
      for (let offset = 0; offset < Math.max(nodes.length, links.length); offset += 250) {
        if (cancelled) return
        edgeGroup.selectAll<SVGLineElement, typeof links[number]>(() => []).data(links.slice(offset, offset + 250)).join("line")
          .attr("class", "graph-edge")
          .attr("data-source", link => link.source.id)
          .attr("data-target", link => link.target.id)
          .attr("stroke-width", 1).attr("vector-effect", "non-scaling-stroke")
        const node = nodeGroup.selectAll<SVGGElement, PositionedNode>(() => []).data(nodes.slice(offset, offset + 250)).join("g")
          .attr("data-node", item => item.id)
          .attr("data-current", item => String(item.id === currentSlug))
          .attr("data-kind", item => item.type ?? "note")
          .attr("data-labelled", "false")
          .attr("role", "button").attr("tabindex", 0)
          .attr("aria-label", item => `Select ${item.title}`)
          .on("click", (event, item) => { event.stopPropagation(); onSelect(item.id) })
          .on("keydown", function (event, item) {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
              event.preventDefault()
              const elements = nodeGroup.selectAll<SVGGElement, PositionedNode>("[data-node]").nodes()
              const offset = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1
              const next = elements[(elements.indexOf(this) + offset + elements.length) % elements.length]
              this.setAttribute("tabindex", "-1")
              next.setAttribute("tabindex", "0")
              next.focus()
            }
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(item.id) }
          })
        const mark = node.append("g").attr("class", "graph-mark")
        mark.append("circle").attr("class", "graph-hit").attr("r", 14)
        mark.filter(item => item.type !== "tag").append("circle")
          .attr("r", item => item.id === currentSlug ? 7 : 3 + Math.min(2, Math.sqrt(degrees.get(item.id) ?? 0) / 2))
        mark.filter(item => item.type === "tag").append("rect")
          .attr("x", -4).attr("y", -4).attr("width", 8).attr("height", 8).attr("rx", 1).attr("transform", "rotate(45)")
        mark.append("text").attr("class", "graph-label").attr("y", 19).attr("text-anchor", "middle")
          .attr("font-size", expanded ? 12 : 11).attr("stroke-width", 3)
          .text(item => item.title.length > 24 ? item.title.slice(0, 22) + "…" : item.title)
        if (nodes.length <= 250) node.append("title").text(item => item.title)
        if (Math.max(nodes.length, links.length) > 250) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      }
      if (cancelled) return
      const node = nodeGroup.selectAll<SVGGElement, PositionedNode>("[data-node]")
      const edge = edgeGroup.selectAll<SVGLineElement, typeof links[number]>("line")

      const update = () => {
        edge.attr("x1", link => link.source.x!)
          .attr("y1", link => link.source.y!)
          .attr("x2", link => link.target.x!)
          .attr("y2", link => link.target.y!)
        node.attr("transform", item => `translate(${item.x},${item.y})`)
      }
      update()
      node.call(d3.drag<SVGGElement, PositionedNode>()
        .on("drag", function (event, item) {
          item.x = event.x; item.y = event.y
          placeLabels()
          d3.select(this).attr("transform", `translate(${item.x},${item.y})`)
          edge.filter(link => link.source === item || link.target === item)
            .attr("x1", link => link.source.x!).attr("y1", link => link.source.y!)
            .attr("x2", link => link.target.x!).attr("y2", link => link.target.y!)
        }))

      const elements = new Map(node.nodes().map(element => [element.dataset.node!, element]))
      let visibleLabels: string[] = []
      const placeLabels = () => {
        const scale = d3.zoomTransform(element).k
        const boxes: { x: number; y: number; width: number }[] = []
        for (const id of visibleLabels) elements.get(id)?.setAttribute("data-labelled", "false")
        visibleLabels = []
        for (const id of new Set([selectedRef.current, currentSlug, ...(expanded ? labelled : [])])) {
          const item = id ? byId.get(id) : undefined
          if (!item) continue
          const box = { x: item.x! * scale, y: item.y! * scale, width: Math.min(item.title.length, 24) * (expanded ? 7 : 6.5) + 12 }
          if (boxes.some(other => Math.abs(box.x - other.x) < (box.width + other.width) / 2 && Math.abs(box.y - other.y) < 20)) continue
          boxes.push(box)
          visibleLabels.push(item.id)
          elements.get(item.id)?.setAttribute("data-labelled", "true")
        }
      }

      const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 5])
        .filter(event => event.type !== "wheel" || expanded || event.ctrlKey || event.metaKey)
        .on("zoom", event => {
          group.attr("transform", event.transform)
          group.style("--graph-inverse-scale", 1 / event.transform.k)
          placeLabels()
        })
      svg.call(zoom).on("dblclick.zoom", null)
      const motionDuration = () => nodes.length > 250 || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240
      const fit = (animate = false) => {
        const w = element.clientWidth, h = element.clientHeight
        if (!w || !h) return
        const minX = d3.min(nodes, item => item.x!)! - 55, maxX = d3.max(nodes, item => item.x!)! + 55
        const minY = d3.min(nodes, item => item.y!)! - 30, maxY = d3.max(nodes, item => item.y!)! + 40
        const scale = Math.min(w / (maxX - minX), h / (maxY - minY), expanded ? 1.4 : 1.1)
        const target = d3.zoomIdentity.translate(w / 2, h / 2).scale(scale).translate(-(minX + maxX) / 2, -(minY + maxY) / 2)
        svg.interrupt()
        if (animate && motionDuration()) svg.transition().duration(motionDuration()).ease(d3.easeCubicOut).call(zoom.transform, target)
        else svg.call(zoom.transform, target)
      }
      controls.current = { fit: () => fit(true), labels: placeLabels, zoom: factor => {
        svg.interrupt()
        if (motionDuration()) svg.transition().duration(motionDuration()).ease(d3.easeCubicOut).call(zoom.scaleBy, factor)
        else svg.call(zoom.scaleBy, factor)
      } }
      const observer = new ResizeObserver(() => fit())
      observer.observe(element)
      fit()
      paintSelection()
      setStatus("ready")
      dispose = () => { observer.disconnect(); svg.interrupt(); svg.on(".zoom", null); svg.selectAll("*").remove(); controls.current = null }
    }
    const visibility = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { visibility.disconnect(); void draw().catch(() => { if (!cancelled) setStatus("error") }) }
    })
    visibility.observe(element)
    return () => { cancelled = true; visibility.disconnect(); worker?.terminate(); dispose?.() }
  }, [data, currentSlug, expanded, onSelect, attempt])

  useEffect(paintSelection, [selected])

  return (
    <div className={`graph-surface relative overflow-hidden ${expanded ? "min-w-0" : "rounded-xl border"}`} aria-busy={status === "loading"} data-status={status}>
      <svg ref={svgRef} aria-label="Note connections" className={`graph-canvas w-full ${data.nodes.length > 250 ? "graph-dense" : ""} ${expanded ? "graph-expanded h-[38dvh] min-h-64 sm:h-[58dvh] sm:min-h-96" : "h-60"}`} />
      {status !== "ready" && <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 text-sm text-muted-foreground">
        {status === "loading" ? <><LoaderCircle className="size-5 animate-spin" />Arranging connections…</> : <><p>Could not arrange the graph.</p><Button variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>Retry</Button></>}
      </div>}
      {expanded && <div className="pointer-events-none absolute left-4 top-4 flex gap-3 rounded-full border bg-background/90 px-3 py-1.5 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-current" />Note</span><span className="flex items-center gap-1.5"><span className="size-1.5 rotate-45 bg-amber-600 dark:bg-amber-400" />Tag</span></div>}
      <div className="absolute bottom-2 right-2 flex rounded-md border bg-background/95 p-0.5 shadow-sm">
        <Button size="icon" variant="ghost" className="size-8" disabled={status !== "ready"} aria-label="Zoom out" onClick={() => controls.current?.zoom(0.75)}><Minus className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="size-8" disabled={status !== "ready"} aria-label="Fit graph" onClick={() => controls.current?.fit()}><Focus className="size-4" /></Button>
        <Button size="icon" variant="ghost" className="size-8" disabled={status !== "ready"} aria-label="Zoom in" onClick={() => controls.current?.zoom(1.3)}><Plus className="size-4" /></Button>
      </div>
    </div>
  )
}

export function GraphView({ currentSlug }: { currentSlug?: string }) {
  const [data, setData] = useState<GraphData | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [open, setOpen] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [showTags, setShowTags] = useState(true)
  const [selected, setSelected] = useState(currentSlug)
  const [query, setQuery] = useState("")
  const exploreRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let cancelled = false
    setError(false)
    loadGraph().then(value => { if (!cancelled) setData(value) }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [attempt])
  useEffect(() => { setSelected(currentSlug); setShowAll(false) }, [currentSlug])

  const local = useMemo(() => data ? getGraphNeighborhood(data, currentSlug) : null, [data, currentSlug])
  const graph = useMemo(() => data ? getGraphNeighborhood(data, showAll ? undefined : currentSlug, showTags) : null, [data, currentSlug, showAll, showTags])
  const selectedNode = graph?.nodes.find(node => node.id === selected)
  const connections = useMemo(() => {
    if (!graph || !selectedNode) return []
    const neighbors = graphNeighbors(graph, selectedNode.id)
    return graph.nodes.filter(node => neighbors.has(node.id))
  }, [graph, selectedNode])
  const results = useMemo(() => query.trim() ? graph?.nodes.filter(node => node.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 30) ?? [] : [], [graph, query])


  return (
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="mt-6 border-t pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 text-xs font-semibold text-muted-foreground">
        Graph <ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} />
      </summary>
      {open && (
        <>
          {error ? <div className="rounded-lg border p-4 text-sm"><p>Could not load the graph.</p><Button variant="ghost" size="sm" onClick={() => setAttempt(value => value + 1)}><RefreshCw className="mr-2 size-3" />Retry</Button></div>
            : !local ? <p role="status" className="py-8 text-center text-xs text-muted-foreground">Loading connections…</p>
            : !local.nodes.length ? <p className="py-4 text-xs text-muted-foreground">No notes yet.</p>
            : <>
              {!expanded && <GraphCanvas data={local} currentSlug={currentSlug} selected={selected} onSelect={setSelected} />}
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{local.links.length ? `${local.nodes.length} nodes · ${currentSlug ? "2 hops" : "all notes"}` : "No linked notes yet"}</span>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" ref={exploreRef} onClick={() => setExpanded(true)}><Expand className="mr-1 size-3" />Explore</Button>
              </div>
              {selectedNode && <Link href={graphNodeHref(selectedNode)} className="mt-1 block truncate text-sm underline underline-offset-4" title={selectedNode.title}>{selectedNode.title} →</Link>}
            </>}
          <Dialog open={expanded} onOpenChange={setExpanded}>
            <DialogContent onCloseAutoFocus={event => { event.preventDefault(); exploreRef.current?.focus() }} className="graph-dialog max-h-[92dvh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-6xl">
              <DialogHeader className="border-b px-5 py-5 text-left sm:px-6">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-300"><Network className="size-4" />YOUR KNOWLEDGE GARDEN</div>
                <DialogTitle className="text-xl tracking-tight">Explore connections</DialogTitle>
                <DialogDescription>Follow a connection. Find your next idea.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6">
                {currentSlug && <div role="group" aria-label="Graph scope" className="flex rounded-lg bg-muted p-1 text-xs font-medium">
                  <button aria-pressed={!showAll} onClick={() => setShowAll(false)} className={`rounded-md px-3 py-1.5 transition-colors ${!showAll ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Nearby <span className="ml-1 opacity-60">2 hops</span></button>
                  <button aria-pressed={showAll} onClick={() => setShowAll(true)} className={`rounded-md px-3 py-1.5 transition-colors ${showAll ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>All notes</button>
                </div>}
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showTags} onChange={event => setShowTags(event.target.checked)} className="size-3.5 accent-teal-700" />Include tags</label>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">{graph?.nodes.length ?? 0} nodes · {graph?.links.length ?? 0} links</span>
              </div>
              <div className="grid min-h-0 sm:grid-cols-[minmax(0,1fr)_17rem]">
                {graph && <GraphCanvas data={graph} currentSlug={currentSlug} selected={selectedNode?.id} onSelect={setSelected} expanded />}
                <aside aria-label="Selected note" className="flex min-h-0 flex-col border-t bg-background sm:max-h-[58dvh] sm:min-h-96 sm:border-l sm:border-t-0">
                  <div className="border-b p-4">
                    <label className="flex items-center gap-2 rounded-lg border focus-within:ring-2 focus-within:ring-teal-600/40 bg-muted/30 px-3 py-2 text-muted-foreground"><Search className="size-3.5 shrink-0" /><input aria-label="Find a graph node" placeholder="Find a note…" value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 w-full bg-transparent text-xs text-foreground outline-none" /></label>
                  </div>
                  {query.trim() ? <div className="max-h-64 overflow-y-auto p-2 sm:max-h-none" aria-label="Graph search results">
                    <p className="px-2 py-2 text-xs text-muted-foreground">{results.length === 30 ? "First 30 matches" : `${results.length} ${results.length === 1 ? "match" : "matches"}`}</p>
                    {results.map(node => <button key={node.id} onClick={() => { setSelected(node.id); setQuery("") }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm hover:bg-muted"><FileText className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{node.title}</span></button>)}
                  </div> : selectedNode ? <>
                    <div key={selectedNode.id} className="graph-selection p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">{selectedNode.type === "tag" ? <Hash className="size-4" /> : <FileText className="size-4" />}{selectedNode.id === currentSlug ? "Current note" : selectedNode.type === "tag" ? "Tag" : "Selected note"}</div>
                      <h3 className="break-words text-lg font-semibold leading-snug tracking-tight">{selectedNode.title}</h3>
                      <Link href={graphNodeHref(selectedNode)} onClick={() => setExpanded(false)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white hover:bg-teal-800 dark:bg-teal-300 dark:text-teal-950 dark:hover:bg-teal-200">{selectedNode.type === "tag" ? "Browse tag" : "Open note"}<ArrowUpRight className="size-3.5" /></Link>
                    </div>
                    <div className="flex items-center justify-between border-t px-5 pb-2 pt-4 text-xs font-medium text-muted-foreground"><span>Connected notes</span><span className="tabular-nums">{connections.length}</span></div>
                    <div className="max-h-52 overflow-y-auto px-2 pb-3 sm:max-h-none">
                      {connections.map(node => <button key={node.id} onClick={() => setSelected(node.id)} className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs hover:bg-muted focus-visible:bg-muted">{node.type === "tag" ? <Hash className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" /> : <span className="mx-1 size-1.5 shrink-0 rounded-full bg-teal-600/60" />}<span className="min-w-0 flex-1 truncate" title={node.title}>{node.title}</span><ChevronRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" /></button>)}
                      {!connections.length && <p className="px-3 py-2 text-xs text-muted-foreground">No direct connections in this view.</p>}
                    </div>
                  </> : <p className="p-5 text-sm text-muted-foreground">Select a node or search for a note to explore its connections.</p>}
                </aside>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-t px-5 py-3 text-[11px] text-muted-foreground"><span>Drag to arrange · Scroll to zoom</span><span>Arrow keys to move · Enter to select</span></div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </details>
  )
}
