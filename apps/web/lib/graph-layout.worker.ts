import { layoutGraph } from "./graph-layout"
import type { GraphData } from "./graph"

self.onmessage = (event: MessageEvent<{ data: GraphData; currentSlug?: string; expanded: boolean }>) => {
  const { data, currentSlug, expanded } = event.data
  self.postMessage(layoutGraph(data, currentSlug, expanded))
}
