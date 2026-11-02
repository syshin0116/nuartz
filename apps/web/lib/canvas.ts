/** Canvas page data written by prebuild. Edge geometry is precomputed so the client bundle needs no nuartz code. */

export interface RenderedCanvasNode {
  id: string
  type: "text" | "file" | "link" | "group"
  x: number
  y: number
  width: number
  height: number
  color?: string
  /** text: rendered markdown */
  html?: string
  /** group: label; file and link: card title */
  label?: string
  /** file: target note or canvas/base page */
  slug?: string
  /** file: note excerpt */
  excerpt?: string
  /** file: image URL; group: background image URL (both include the base path) */
  image?: string
  /** link: external http(s) URL; file: non-image attachment URL */
  href?: string
  /** file: the path could not be resolved to a published file */
  missing?: boolean
  backgroundStyle?: "cover" | "ratio" | "repeat"
}

export interface RenderedCanvasEdge {
  id: string
  path: string
  middle: { x: number; y: number }
  startArrow?: string
  endArrow?: string
  color?: string
  label?: string
}

export interface CanvasPageData {
  nodes: RenderedCanvasNode[]
  edges: RenderedCanvasEdge[]
  bounds: { x: number; y: number; width: number; height: number }
}

// Obsidian's default palette for the six JSON Canvas presets.
const PRESET_COLORS: Record<string, string> = {
  "1": "#fb464c", "2": "#e9973f", "3": "#e0de71", "4": "#44cf6e", "5": "#53dfdd", "6": "#a882ff",
}

export function canvasColor(color?: string): string | undefined {
  return color ? PRESET_COLORS[color] ?? color : undefined
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export interface CanvasViewport { x: number; y: number; scale: number }

/** Viewport that centers `bounds` inside a `width` x `height` box, never zooming in past 100%. */
export function fitCanvas(bounds: CanvasPageData["bounds"], width: number, height: number, padding = 48): CanvasViewport {
  if (!bounds.width || !bounds.height) return { x: width / 2, y: height / 2, scale: 1 }
  const scale = Math.max(MIN_ZOOM, Math.min(1, (width - padding * 2) / bounds.width, (height - padding * 2) / bounds.height))
  return { x: (width - bounds.width * scale) / 2, y: (height - bounds.height * scale) / 2, scale }
}

/** Zooms by `factor` keeping the screen point (`originX`, `originY`) fixed. */
export function zoomCanvas(view: CanvasViewport, factor: number, originX: number, originY: number): CanvasViewport {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.scale * factor))
  const ratio = scale / view.scale
  return { x: originX - (originX - view.x) * ratio, y: originY - (originY - view.y) * ratio, scale }
}
