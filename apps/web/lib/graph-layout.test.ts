import { expect, test } from "vitest"
import { layoutGraph } from "./graph-layout"
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
