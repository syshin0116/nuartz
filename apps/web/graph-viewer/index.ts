import type { ForceGraph3DInstance, LinkObject } from "3d-force-graph"
import type { ForceGraphVRInstance } from "3d-force-graph-vr"
import type { ForceGraphARInstance } from "3d-force-graph-ar"
import { graphNeighbors, type GraphData, type GraphNode } from "../lib/graph"

type SpatialNode = GraphNode & { x?: number; y?: number; z?: number }
type SpatialLink = LinkObject<SpatialNode>
type Viewer = ForceGraph3DInstance<SpatialNode> | ForceGraphVRInstance<SpatialNode> | ForceGraphARInstance<SpatialNode>
const mode = new URLSearchParams(location.search).get("mode")
const container = document.getElementById("graph")!
const label = document.getElementById("label")!
const error = document.getElementById("error")!
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
let viewer: Viewer | undefined
let data: GraphData = { nodes: [], links: [] }
let selected: string | undefined
let destroyed = false
const send = (type: string, payload = {}) => parent.postMessage({ type, ...payload }, location.origin)
const fail = (message: string) => { error.textContent = message; error.hidden = false; send("graph-error", { message }) }
const endpoint = (value: SpatialLink["source"]) => typeof value === "object" && value ? value.id : value

function highlight() {
  const neighbors = graphNeighbors(data, selected)
  if (selected) neighbors.add(selected)
  viewer?.nodeColor(node => node.id === selected ? "#5eead4" : neighbors.has(node.id) ? "#99f6e4" : node.type === "tag" ? "#fbbf24" : "#64748b")
  viewer?.linkColor((link: SpatialLink) => endpoint(link.source) === selected || endpoint(link.target) === selected ? "#5eead4" : "#334155")
  label.textContent = data.nodes.find(node => node.id === selected)?.title ?? ""
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Could not load the spatial viewer. Try again."))
    document.head.append(script)
  })
}

async function start() {
  if (mode !== "3d" && mode !== "vr" && mode !== "ar") throw new Error("Unknown graph view.")
  document.body.dataset.mode = mode
  if (mode !== "3d") {
    if (!isSecureContext) throw new Error("VR and AR require HTTPS or localhost.")
    await loadScript("./aframe.js")
    if (mode === "ar") {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser cannot access a camera for AR.")
      await loadScript("./ar.js")
    }
  }
  if (destroyed) return
  if (mode === "3d") {
    const { default: ForceGraph } = await import("3d-force-graph")
    if (destroyed) return
    viewer = (new ForceGraph(container, { controlType: "orbit", rendererConfig: { antialias: true } }) as unknown as ForceGraph3DInstance<SpatialNode>)
      .backgroundColor("#0b1220").showNavInfo(false).nodeLabel(node => {
        const span = document.createElement("span"); span.textContent = node.title; return span
      })
  } else if (mode === "vr") {
    const { default: ForceGraph } = await import("3d-force-graph-vr")
    if (destroyed) return
    viewer = (new ForceGraph(container) as unknown as ForceGraphVRInstance<SpatialNode>).backgroundColor("#0b1220").showNavInfo(false).nodeLabel(node => node.title)
  } else {
    const { default: ForceGraph } = await import("3d-force-graph-ar")
    if (destroyed) return
    viewer = (new ForceGraph(container, { markerAttrs: { type: "pattern", url: "../graph-marker/patt.hiro" } }) as unknown as ForceGraphARInstance<SpatialNode>).glScale(300)
    document.querySelector("a-scene")?.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false; cameraParametersUrl: ../graph-marker/camera_para.dat; maxDetectionRate: 30;")
    label.textContent = "Point your camera at the Hiro marker"
  }
  if (destroyed) { viewer._destructor(); return }
  viewer.width(innerWidth).height(innerHeight).nodeRelSize(4).nodeResolution(8).linkOpacity(0.55)
    .cooldownTicks(reducedMotion.matches ? 0 : 120).warmupTicks(reducedMotion.matches ? 120 : 0)
    .onNodeClick(node => { selected = node.id; highlight(); send("graph-select", { id: node.id }) })
    .onNodeHover(node => { label.textContent = node?.title ?? data.nodes.find(item => item.id === selected)?.title ?? "" })
  send("graph-ready")
}

addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== parent || !viewer || !event.data) return
  const message = event.data
  if (message.type === "graph-data" && Array.isArray(message.data?.nodes) && Array.isArray(message.data?.links)) {
    data = message.data
    selected = typeof message.selected === "string" ? message.selected : undefined
    // The library mutates coordinates and edge endpoints; retain the original graph for selection.
    viewer.graphData(structuredClone(data))
    highlight()
    if (mode === "3d") {
      const scene = viewer as ForceGraph3DInstance<SpatialNode>
      let fitted = false
      scene.onEngineStop(() => { if (!fitted) { fitted = true; scene.zoomToFit(reducedMotion.matches ? 0 : 400, 45) } })
    }
  } else if (message.type === "graph-selection") {
    selected = typeof message.id === "string" ? message.id : undefined
    highlight()
  } else if (message.type === "graph-fit" && mode === "3d") {
    ;(viewer as unknown as ForceGraph3DInstance<SpatialNode>).zoomToFit(reducedMotion.matches ? 0 : 300, 45)
  }
})
addEventListener("resize", () => viewer?.width(innerWidth).height(innerHeight))
addEventListener("camera-error", () => fail("Camera access failed. Allow camera access in your browser, then try AR again."))
addEventListener("keydown", event => { if (event.key === "Escape") send("graph-exit") })
addEventListener("pagehide", () => {
  destroyed = true
  document.querySelectorAll("video").forEach(video => { if (video.srcObject instanceof MediaStream) video.srcObject.getTracks().forEach(track => track.stop()) })
  viewer?._destructor()
})
void start().catch(reason => fail(reason instanceof Error ? reason.message : "Could not start this graph view."))
