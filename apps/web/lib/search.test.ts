import { expect, test } from "vitest"
import { searchNotes } from "./search"

test("search ranks titles, matches paths and all words, and shows context around matches", () => {
  const entries = [
    { slug: "docs/graph", title: "Connections", tags: ["visual"], content: "Start. ".repeat(30) + "Graph layout explains visual relationships." },
    { slug: "reference/view", title: "Graph", tags: [], content: "Layouts" },
  ]
  expect(searchNotes(entries, "graph").map(note => note.title)).toEqual(["Graph", "Connections"])
  expect(searchNotes(entries, "docs/graph visual").map(note => note.slug)).toEqual(["docs/graph"])
  expect(searchNotes(entries, "graph")[1].excerpt).toContain("Graph layout")
  expect(searchNotes(entries, "missing")).toEqual([])
  expect(entries[0].title).toBe("Connections")
})
