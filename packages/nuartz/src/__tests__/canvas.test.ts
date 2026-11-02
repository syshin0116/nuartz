import { describe, expect, test } from "vitest"
import { canvasBounds, canvasEdgeGeometry, normalizeCanvasColor, parseCanvas } from "../canvas"

describe("parseCanvas", () => {
  test("keeps valid nodes and edges and applies spec defaults", () => {
    const { canvas, warnings } = parseCanvas(JSON.stringify({
      nodes: [
        { id: "g", type: "group", x: -50, y: -50, width: 500, height: 300, label: "Group", backgroundStyle: "ratio", color: "6" },
        { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "# Hello [[note]]", color: "#ff0000" },
        { id: "b", type: "file", x: 300, y: 0, width: 100, height: 100, file: "notes/x.md", subpath: "#Intro" },
        { id: "c", type: "link", x: 0, y: 200, width: 100, height: 50, url: "https://example.com" },
      ],
      edges: [{ id: "e1", fromNode: "a", toNode: "b", fromSide: "right", label: "refers", color: 2 }],
    }))
    expect(warnings).toEqual([])
    expect(canvas.nodes.map(node => node.type)).toEqual(["group", "text", "file", "link"])
    expect(canvas.nodes[0]).toMatchObject({ label: "Group", backgroundStyle: "ratio", color: "6" })
    expect(canvas.nodes[2]).toMatchObject({ file: "notes/x.md", subpath: "#Intro" })
    expect(canvas.edges[0]).toEqual({
      id: "e1", fromNode: "a", fromSide: "right", fromEnd: "none", toNode: "b", toSide: undefined, toEnd: "arrow", color: "2", label: "refers",
    })
  })

  test("drops invalid input with warnings instead of throwing", () => {
    const { canvas, warnings } = parseCanvas(JSON.stringify({
      nodes: [
        { id: "a", type: "text", x: 0, y: 0, width: 10, height: 10 },
        { id: "a", type: "text", x: 0, y: 0, width: 10, height: 10, text: "dup" },
        { id: "bad-size", type: "text", x: 0, y: 0, width: 0, height: 10, text: "" },
        { id: "no-file", type: "file", x: 0, y: 0, width: 10, height: 10 },
        { id: "no-url", type: "link", x: 0, y: 0, width: 10, height: 10 },
        { id: "weird", type: "sticker", x: 0, y: 0, width: 10, height: 10 },
        { type: "text" },
      ],
      edges: [{ id: "e", fromNode: "a", toNode: "missing" }, { id: "x" }],
    }))
    expect(canvas.nodes).toEqual([{ id: "a", type: "text", x: 0, y: 0, width: 10, height: 10, color: undefined, text: "" }])
    expect(canvas.edges).toEqual([])
    expect(warnings).toHaveLength(8)
    expect(parseCanvas("{oops").warnings[0]).toMatch(/^Invalid JSON/)
    expect(parseCanvas("[]").warnings).toEqual(["Canvas root must be an object"])
    expect(parseCanvas("")).toEqual({ canvas: { nodes: [], edges: [] }, warnings: [] })
  })
})

test("normalizeCanvasColor accepts presets and hex only", () => {
  expect(normalizeCanvasColor("3")).toBe("3")
  expect(normalizeCanvasColor(4)).toBe("4")
  expect(normalizeCanvasColor("#abc")).toBe("#abc")
  expect(normalizeCanvasColor("#AABBCCDD")).toBe("#AABBCCDD")
  expect(normalizeCanvasColor("7")).toBeUndefined()
  expect(normalizeCanvasColor("red; background: url(x)")).toBeUndefined()
  expect(normalizeCanvasColor(null)).toBeUndefined()
})

test("canvasBounds covers all nodes", () => {
  expect(canvasBounds([])).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  expect(canvasBounds([{ x: -10, y: 5, width: 20, height: 10 }, { x: 50, y: -20, width: 10, height: 10 }]))
    .toEqual({ x: -10, y: -20, width: 70, height: 35 })
})

describe("canvasEdgeGeometry", () => {
  const left = { x: 0, y: 0, width: 100, height: 50 }
  const right = { x: 300, y: 0, width: 100, height: 50 }
  const below = { x: 0, y: 300, width: 100, height: 50 }

  test("anchors on explicit sides", () => {
    const geometry = canvasEdgeGeometry(left, right, "right", "left")
    expect(geometry.path).toBe("M 100 25 C 200 25, 200 25, 300 25")
    expect(geometry.middle).toEqual({ x: 200, y: 25 })
    expect(geometry.endArrow).toBe("300,25 286,31 286,19")
  })

  test("picks facing sides when omitted", () => {
    expect(canvasEdgeGeometry(left, right).path.startsWith("M 100 25")).toBe(true)
    expect(canvasEdgeGeometry(right, left).path.startsWith("M 300 25")).toBe(true)
    expect(canvasEdgeGeometry(left, below).path).toMatch(/^M 50 50 .* 50 300$/)
    expect(canvasEdgeGeometry(below, left, undefined, "bottom").path).toMatch(/^M 50 300 .* 50 50$/)
  })
})
