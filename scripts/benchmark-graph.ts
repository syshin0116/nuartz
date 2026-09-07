// Run: bun scripts/benchmark-graph.ts
import assert from "node:assert/strict"
import { getGraphNeighborhood, graphNeighbors, type GraphData } from "../apps/web/lib/graph"
import { layoutGraph } from "../apps/web/lib/graph-layout"

for (const size of [1000, 5000]) {
  const data: GraphData = {
    nodes: Array.from({ length: size }, (_, i) => ({ id: `note/${i}`, title: `Note ${i}`, tags: [] })),
    links: Array.from({ length: size }, (_, i) => [1, 7, 31].map(offset => ({ source: `note/${i}`, target: `note/${(i + offset) % size}` }))).flat(),
  }
  const runs = []
  for (let run = 0; run < 3; run++) {
    let start = performance.now()
    const graph = getGraphNeighborhood(data)
    const neighborhoodMs = performance.now() - start
    start = performance.now()
    const neighbors = graphNeighbors(graph, "note/0")
    const labelled = graph.nodes.filter(node => neighbors.has(node.id))
    const labelsMs = performance.now() - start
    start = performance.now()
    const nodes = layoutGraph(graph, "note/0", true)
    const layoutMs = performance.now() - start
    assert.equal(nodes.length, size)
    assert.equal(graph.links.length, size * 3)
    assert.equal(labelled.length, 6)
    assert(nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y)))
    assert.equal(getGraphNeighborhood(data, "note/0", true, 2, Infinity).nodes.length, 25)
    runs.push({ neighborhoodMs, labelsMs, layoutMs })
  }
  console.log(JSON.stringify({ size, edges: data.links.length, runs }))
}
