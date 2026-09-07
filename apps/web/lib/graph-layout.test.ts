import { expect, test } from "vitest"
import { createGraphSimulation, layoutGraph, type PositionedNode } from "./graph-layout"
import type { GraphData } from "./graph"

test("layout preserves every node and input link while anchoring the current note", () => {
  const data: GraphData = {
    nodes: ["current", "linked", "isolated"].map(id => ({ id, title: id, tags: [] })),
    links: [{ source: "current", target: "linked" }],
  }
  const original = structuredClone(data)
  const nodes = layoutGraph(data, "current", true)
  expect(nodes.map(node => node.id)).toEqual(["current", "linked", "isolated"])
  expect(nodes[0]).toMatchObject({ x: 0, y: 0 })
  expect(nodes.slice(1).every(node => Number.isFinite(node.x) && Number.isFinite(node.y) && Math.hypot(node.x!, node.y!) > 0)).toBe(true)
  expect(data).toEqual(original)
  expect(layoutGraph({ nodes: [], links: [] })).toEqual([])
})

test("drag physics moves connected nodes and settles after release", () => {
  const nodes: PositionedNode[] = [
    { id: "a", title: "A", tags: [], x: 0, y: 0 },
    { id: "b", title: "B", tags: [], x: 80, y: 0 },
  ]
  const simulation = createGraphSimulation(nodes, [{ source: "a", target: "b" }])
  nodes[0].fx = 300; nodes[0].fy = 0
  simulation.alpha(0.18).alphaTarget(0.12).tick(30)
  expect(nodes[0].x).toBe(300)
  expect(nodes[1].x).toBeGreaterThan(100)
  nodes[0].fx = null; nodes[0].fy = null
  simulation.alphaTarget(0).tick(400)
  expect(simulation.alpha()).toBeLessThan(simulation.alphaMin())
  expect(nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true)
})
