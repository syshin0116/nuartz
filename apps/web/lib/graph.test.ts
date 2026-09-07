import { expect, test } from "vitest"
import { getGraphNeighborhood, graphNeighbors, graphNodeHref, type GraphData } from "./graph"

test("two-hop graphs preserve shared-tag connections and remove invalid or duplicate edges", () => {
  const data: GraphData = {
    nodes: ["current", "outgoing", "incoming", "unrelated", "isolated", "faraway"].map(id => ({ id, title: id, tags: [] })),
    links: [
      { source: "current", target: "outgoing" }, { source: "incoming", target: "current" },
      { source: "outgoing", target: "current" }, { source: "outgoing", target: "unrelated" },
      { source: "current", target: "current" }, { source: "current", target: "missing" },
      { source: "current", target: "tag/common" }, { source: "unrelated", target: "tag/common" },
      { source: "unrelated", target: "faraway" },
    ],
  }
  data.nodes.push({ id: "tag/common", title: "Common", tags: [], type: "tag" })
  expect(getGraphNeighborhood(data, "current").nodes.map(n => n.id)).toEqual(["current", "incoming", "outgoing", "tag/common", "unrelated"])
  expect(getGraphNeighborhood(data, "current").links).toHaveLength(5)
  expect(getGraphNeighborhood(data, "current", false, 1).nodes.map(n => n.id)).toEqual(["current", "incoming", "outgoing"])
  expect(getGraphNeighborhood(data, "isolated")).toEqual({ nodes: [data.nodes[4]], links: [] })
  expect(getGraphNeighborhood(data, undefined, false).nodes.map(n => n.id)).toEqual(["current", "faraway", "incoming", "isolated", "outgoing", "unrelated"])
  expect(graphNodeHref({ id: "index", title: "Home", tags: [] })).toBe("/")
  expect(graphNodeHref({ id: "tag/한글", title: "Korean", type: "tag", tags: [] })).toBe("/tags/%ED%95%9C%EA%B8%80")
})

test("neighbor lookup includes incoming and outgoing links without unrelated nodes", () => {
  const data = { nodes: [], links: [
    { source: "a", target: "root" }, { source: "root", target: "b" },
    { source: "b", target: "root" }, { source: "a", target: "unrelated" },
  ] }
  expect([...graphNeighbors(data, "root")].sort()).toEqual(["a", "b"])
  expect([...graphNeighbors(data, "missing")]).toEqual([])
})
