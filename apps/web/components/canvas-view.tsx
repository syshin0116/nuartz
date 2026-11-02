"use client"

import { useEffect, useEffectEvent, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
import Link from "next/link"
import { ExternalLink, FileText, Maximize, Minus, Plus } from "lucide-react"
import { canvasColor, fitCanvas, zoomCanvas, type CanvasPageData, type CanvasViewport, type RenderedCanvasNode } from "@/lib/canvas"
import { cn } from "@/lib/utils"

const notePath = (slug: string) => `/${slug.split("/").map(encodeURIComponent).join("/")}`
const PAN_STEP = 60
const ZOOM_STEP = 1.2

function nodeStyle(node: RenderedCanvasNode, offset: { x: number; y: number }): CSSProperties {
  const color = canvasColor(node.color)
  return {
    left: node.x - offset.x, top: node.y - offset.y, width: node.width, height: node.height,
    ...(color && { borderColor: color, backgroundColor: `color-mix(in srgb, ${color} ${node.type === "group" ? 6 : 10}%, var(--card))` }),
  }
}

function groupBackground(node: RenderedCanvasNode): CSSProperties {
  if (!node.image) return {}
  const size = node.backgroundStyle === "repeat" ? "auto" : node.backgroundStyle === "ratio" ? "contain" : "cover"
  return {
    backgroundImage: `url("${node.image.replace(/["\\]/g, "\\$&")}")`, backgroundSize: size,
    backgroundRepeat: node.backgroundStyle === "repeat" ? "repeat" : "no-repeat", backgroundPosition: "center",
  }
}

function NodeContent({ node }: { node: RenderedCanvasNode }) {
  if (node.type === "text") return <div className="prose h-full max-w-none overflow-hidden p-4" dangerouslySetInnerHTML={{ __html: node.html ?? "" }} />
  if (node.type === "link") return (
    <a href={node.href} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col justify-center gap-1 p-4 hover:bg-muted/50">
      <span className="flex items-center gap-1.5 text-sm font-medium"><ExternalLink className="size-3.5 shrink-0" />{node.label}</span>
      <span className="truncate text-xs text-muted-foreground">{node.href}</span>
    </a>
  )
  if (node.missing) return <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">Missing: {node.label}</div>
  if (node.image) return (
    // eslint-disable-next-line @next/next/no-img-element -- canvas images are content attachments with arbitrary sizes
    <img src={node.image} alt={node.label ?? ""} className="h-full w-full object-contain" draggable={false} />
  )
  const body = (
    <>
      <span className="flex items-center gap-1.5 font-medium"><FileText className="size-3.5 shrink-0" />{node.label}</span>
      {node.excerpt && <span className="mt-2 block text-sm text-muted-foreground">{node.excerpt}</span>}
    </>
  )
  const className = "block h-full overflow-hidden p-4 hover:bg-muted/50"
  if (node.slug) return <Link href={notePath(node.slug)} className={className}>{body}</Link>
  return <a href={node.href} className={className}>{body}</a>
}

export function CanvasView({ canvas, title }: { canvas: CanvasPageData; title: string }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  // null until the viewport is measured; the canvas then renders unscaled and scrollable.
  const [view, setView] = useState<CanvasViewport | null>(null)
  const { bounds } = canvas
  const offset = { x: bounds.x, y: bounds.y }
  const groups = canvas.nodes.filter(node => node.type === "group")
  const cards = canvas.nodes.filter(node => node.type !== "group")

  const fit = () => {
    const element = viewportRef.current
    if (element) setView(fitCanvas(bounds, element.clientWidth, element.clientHeight))
  }
  const zoomBy = (factor: number) => {
    const element = viewportRef.current
    if (!element) return
    movedRef.current = true
    setView(current => current && zoomCanvas(current, factor, element.clientWidth / 2, element.clientHeight / 2))
  }
  const panBy = (dx: number, dy: number) => {
    movedRef.current = true
    setView(current => current && { ...current, x: current.x + dx, y: current.y + dy })
  }

  const onResize = useEffectEvent(() => { if (!movedRef.current) fit() })
  const onWheel = useEffectEvent((event: WheelEvent) => {
    const element = viewportRef.current
    if (!element) return
    event.preventDefault()
    movedRef.current = true
    if (event.ctrlKey || event.metaKey) {
      const rect = element.getBoundingClientRect()
      // Trackpad pinches arrive as ctrl+wheel with small deltas.
      const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0025))
      setView(current => current && zoomCanvas(current, factor, event.clientX - rect.left, event.clientY - rect.top))
    } else setView(current => current && { ...current, x: current.x - event.deltaX, y: current.y - event.deltaY })
  })

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const observer = new ResizeObserver(() => onResize())
    observer.observe(element)
    const wheel = (event: WheelEvent) => onWheel(event)
    element.addEventListener("wheel", wheel, { passive: false })
    return () => {
      observer.disconnect()
      element.removeEventListener("wheel", wheel)
    }
  }, [])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("a, button")) return
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    panBy(event.clientX - drag.x, event.clientY - drag.y)
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    const actions: Record<string, () => void> = {
      ArrowLeft: () => panBy(PAN_STEP, 0), ArrowRight: () => panBy(-PAN_STEP, 0),
      ArrowUp: () => panBy(0, PAN_STEP), ArrowDown: () => panBy(0, -PAN_STEP),
      "+": () => zoomBy(ZOOM_STEP), "=": () => zoomBy(ZOOM_STEP), "-": () => zoomBy(1 / ZOOM_STEP),
      "0": () => { movedRef.current = false; fit() },
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  const buttonClass = "flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
  return (
    <div className="relative h-[calc(100vh-12rem)] min-h-[420px] overflow-hidden rounded-lg border bg-muted/20">
      <div
        ref={viewportRef}
        role="group"
        aria-label={`${title} canvas. Drag or use arrow keys to pan, plus and minus to zoom, 0 to fit.`}
        aria-roledescription="canvas"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn("canvas-viewport h-full w-full touch-none select-none focus-visible:outline-2 focus-visible:outline-ring", view ? "cursor-grab overflow-hidden active:cursor-grabbing" : "overflow-auto")}
      >
        <div
          className="relative origin-top-left"
          style={{ width: bounds.width, height: bounds.height, transform: view ? `translate(${view.x}px, ${view.y}px) scale(${view.scale})` : undefined }}
        >
          {groups.map(node => (
            <div key={node.id} className="absolute rounded-xl border-2 border-dashed border-border bg-muted/30" style={{ ...nodeStyle(node, offset), ...groupBackground(node) }}>
              {node.label && <span className="absolute -top-7 left-0 max-w-full truncate rounded-md px-2 py-0.5 text-sm font-medium" style={{ color: canvasColor(node.color) }}>{node.label}</span>}
            </div>
          ))}
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={bounds.width || 1} height={bounds.height || 1} aria-hidden="true">
            <g transform={`translate(${-offset.x} ${-offset.y})`}>
              {canvas.edges.map(edge => {
                const color = canvasColor(edge.color) ?? "var(--muted-foreground)"
                return (
                  <g key={edge.id}>
                    <path d={edge.path} fill="none" stroke={color} strokeWidth={2} />
                    {edge.startArrow && <polygon points={edge.startArrow} fill={color} />}
                    {edge.endArrow && <polygon points={edge.endArrow} fill={color} />}
                  </g>
                )
              })}
            </g>
          </svg>
          {cards.map(node => (
            <div key={node.id} className="absolute overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" style={nodeStyle(node, offset)}>
              <NodeContent node={node} />
            </div>
          ))}
          {canvas.edges.filter(edge => edge.label).map(edge => (
            <span key={edge.id} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground" style={{ left: edge.middle.x - offset.x, top: edge.middle.y - offset.y }}>
              {edge.label}
            </span>
          ))}
        </div>
        {!canvas.nodes.length && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">This canvas is empty.</p>}
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-sm" role="toolbar" aria-label="Canvas controls">
        <button type="button" className={buttonClass} onClick={() => zoomBy(1 / ZOOM_STEP)} aria-label="Zoom out" disabled={!view}><Minus className="size-4" /></button>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">{Math.round((view?.scale ?? 1) * 100)}%</span>
        <button type="button" className={buttonClass} onClick={() => zoomBy(ZOOM_STEP)} aria-label="Zoom in" disabled={!view}><Plus className="size-4" /></button>
        <button type="button" className={buttonClass} onClick={() => { movedRef.current = false; fit() }} aria-label="Fit to view" disabled={!view}><Maximize className="size-4" /></button>
      </div>
    </div>
  )
}
