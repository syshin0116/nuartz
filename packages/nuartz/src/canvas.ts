/** Obsidian Canvas files, per JSON Canvas 1.0 (https://jsoncanvas.org/spec/1.0/). */

export type CanvasSide = "top" | "right" | "bottom" | "left"
export type CanvasEnd = "none" | "arrow"

interface CanvasNodeBase {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** Preset "1"-"6" (red, orange, yellow, green, cyan, purple) or a hex color. */
  color?: string
}

export type CanvasNode =
  | (CanvasNodeBase & { type: "text"; text: string })
  | (CanvasNodeBase & { type: "file"; file: string; subpath?: string })
  | (CanvasNodeBase & { type: "link"; url: string })
  | (CanvasNodeBase & { type: "group"; label?: string; background?: string; backgroundStyle?: "cover" | "ratio" | "repeat" })

export interface CanvasEdge {
  id: string
  fromNode: string
  fromSide?: CanvasSide
  fromEnd: CanvasEnd
  toNode: string
  toSide?: CanvasSide
  toEnd: CanvasEnd
  color?: string
  label?: string
}

export interface CanvasData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export interface CanvasRect {
  x: number
  y: number
  width: number
  height: number
}

const SIDES = new Set(["top", "right", "bottom", "left"])
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value)
const optionalString = (value: unknown) => typeof value === "string" && value !== "" ? value : undefined

/** Returns a preset ("1"-"6") or a hex color; anything else (including CSS injection attempts) is dropped. */
export function normalizeCanvasColor(value: unknown): string | undefined {
  const color = typeof value === "number" ? String(value) : value
  if (typeof color !== "string") return undefined
  if (/^[1-6]$/.test(color)) return color
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ? color : undefined
}

/**
 * Parses and validates a `.canvas` file. Invalid nodes, edges pointing at
 * missing nodes, and unknown attributes are dropped with a warning instead of throwing.
 */
export function parseCanvas(raw: string): { canvas: CanvasData; warnings: string[] } {
  const warnings: string[] = []
  let data: unknown
  try {
    data = raw.trim() ? JSON.parse(raw) : {}
  } catch (error) {
    return { canvas: { nodes: [], edges: [] }, warnings: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`] }
  }
  if (!isRecord(data)) return { canvas: { nodes: [], edges: [] }, warnings: ["Canvas root must be an object"] }

  const nodes: CanvasNode[] = []
  const ids = new Set<string>()
  for (const item of Array.isArray(data.nodes) ? data.nodes : []) {
    const node = parseNode(item)
    if (typeof node === "string") warnings.push(node)
    else if (ids.has(node.id)) warnings.push(`Duplicate node id "${node.id}"`)
    else {
      ids.add(node.id)
      nodes.push(node)
    }
  }

  const edges: CanvasEdge[] = []
  for (const item of Array.isArray(data.edges) ? data.edges : []) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.fromNode !== "string" || typeof item.toNode !== "string") {
      warnings.push("Skipped an edge without id, fromNode, or toNode")
      continue
    }
    if (!ids.has(item.fromNode) || !ids.has(item.toNode)) {
      warnings.push(`Skipped edge "${item.id}": it references a missing node`)
      continue
    }
    edges.push({
      id: item.id,
      fromNode: item.fromNode,
      fromSide: SIDES.has(item.fromSide as string) ? item.fromSide as CanvasSide : undefined,
      fromEnd: item.fromEnd === "arrow" ? "arrow" : "none",
      toNode: item.toNode,
      toSide: SIDES.has(item.toSide as string) ? item.toSide as CanvasSide : undefined,
      toEnd: item.toEnd === "none" ? "none" : "arrow",
      color: normalizeCanvasColor(item.color),
      label: optionalString(item.label),
    })
  }
  return { canvas: { nodes, edges }, warnings }
}

function parseNode(item: unknown): CanvasNode | string {
  if (!isRecord(item) || typeof item.id !== "string") return "Skipped a node without an id"
  const [x, y, width, height] = [item.x, item.y, item.width, item.height].map(Number)
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return `Skipped node "${item.id}": invalid position or size`
  const base = { id: item.id, x, y, width, height, color: normalizeCanvasColor(item.color) }
  switch (item.type) {
    case "text":
      return { ...base, type: "text", text: typeof item.text === "string" ? item.text : "" }
    case "file":
      if (typeof item.file !== "string" || !item.file) return `Skipped file node "${item.id}": missing file`
      return { ...base, type: "file", file: item.file, subpath: optionalString(item.subpath) }
    case "link":
      if (typeof item.url !== "string" || !item.url) return `Skipped link node "${item.id}": missing url`
      return { ...base, type: "link", url: item.url }
    case "group":
      return {
        ...base, type: "group", label: optionalString(item.label), background: optionalString(item.background),
        backgroundStyle: item.backgroundStyle === "cover" || item.backgroundStyle === "ratio" || item.backgroundStyle === "repeat" ? item.backgroundStyle : undefined,
      }
    default:
      return `Skipped node "${item.id}": unknown type "${String(item.type)}"`
  }
}

/** Smallest rectangle containing every node (a zero rectangle for an empty canvas). */
export function canvasBounds(nodes: CanvasRect[]): CanvasRect {
  if (!nodes.length) return { x: 0, y: 0, width: 0, height: 0 }
  const left = Math.min(...nodes.map(node => node.x))
  const top = Math.min(...nodes.map(node => node.y))
  const right = Math.max(...nodes.map(node => node.x + node.width))
  const bottom = Math.max(...nodes.map(node => node.y + node.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

interface Point { x: number; y: number }

const sidePoint = (rect: CanvasRect, side: CanvasSide): Point => ({
  top: { x: rect.x + rect.width / 2, y: rect.y },
  bottom: { x: rect.x + rect.width / 2, y: rect.y + rect.height },
  left: { x: rect.x, y: rect.y + rect.height / 2 },
  right: { x: rect.x + rect.width, y: rect.y + rect.height / 2 },
})[side]

const SIDE_DIRECTION: Record<CanvasSide, Point> = { top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

/** The side of `rect` facing `target`, used when an edge omits fromSide/toSide. */
function facingSide(rect: CanvasRect, target: CanvasRect): CanvasSide {
  const dx = (target.x + target.width / 2) - (rect.x + rect.width / 2)
  const dy = (target.y + target.height / 2) - (rect.y + rect.height / 2)
  if (Math.abs(dx) * rect.height >= Math.abs(dy) * rect.width) return dx >= 0 ? "right" : "left"
  return dy >= 0 ? "bottom" : "top"
}

export interface CanvasEdgeGeometry {
  /** SVG path data for a cubic Bézier between the two anchor points. */
  path: string
  /** Point halfway along the curve, for the label. */
  middle: Point
  /** Triangle points ("x,y x,y x,y") for arrowheads at either end. */
  startArrow: string
  endArrow: string
}

const ARROW_LENGTH = 14
const ARROW_HALF_WIDTH = 6

function arrowHead(tip: Point, direction: Point): string {
  const length = Math.hypot(direction.x, direction.y) || 1
  const ux = direction.x / length, uy = direction.y / length
  const baseX = tip.x - ux * ARROW_LENGTH, baseY = tip.y - uy * ARROW_LENGTH
  const round = (value: number) => Math.round(value * 10) / 10
  return [[tip.x, tip.y], [baseX - uy * ARROW_HALF_WIDTH, baseY + ux * ARROW_HALF_WIDTH], [baseX + uy * ARROW_HALF_WIDTH, baseY - ux * ARROW_HALF_WIDTH]]
    .map(([px, py]) => `${round(px)},${round(py)}`).join(" ")
}

/** Curve between two nodes in canvas coordinates, matching Obsidian's side-anchored Bézier edges. */
export function canvasEdgeGeometry(from: CanvasRect, to: CanvasRect, fromSide?: CanvasSide, toSide?: CanvasSide): CanvasEdgeGeometry {
  const startSide = fromSide ?? facingSide(from, to)
  const endSide = toSide ?? facingSide(to, from)
  const start = sidePoint(from, startSide)
  const end = sidePoint(to, endSide)
  const reach = Math.max(40, Math.min(250, Math.hypot(end.x - start.x, end.y - start.y) / 2))
  const c1 = { x: start.x + SIDE_DIRECTION[startSide].x * reach, y: start.y + SIDE_DIRECTION[startSide].y * reach }
  const c2 = { x: end.x + SIDE_DIRECTION[endSide].x * reach, y: end.y + SIDE_DIRECTION[endSide].y * reach }
  // Bézier point at t = 0.5.
  const middle = { x: (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8, y: (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8 }
  return {
    path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
    middle,
    startArrow: arrowHead(start, { x: start.x - c1.x, y: start.y - c1.y }),
    endArrow: arrowHead(end, { x: end.x - c2.x, y: end.y - c2.y }),
  }
}
