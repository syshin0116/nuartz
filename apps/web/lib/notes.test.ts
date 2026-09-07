import { expect, test } from "vitest"
import { filterNotes, paginateNotes, getTotalPages, type NoteEntry } from "./notes"

test("tag filtering, stable ordering and pagination preserve the original notes", () => {
  const notes: NoteEntry[] = [
    { slug: "z", title: "Zebra", tags: ["guide"], dateRaw: "2026-09-01", date: null, description: null, summary: null, draft: false },
    { slug: "a", title: "Alpha", tags: ["guide"], dateRaw: null, date: null, description: null, summary: null, draft: false },
    { slug: "b", title: "Beta", tags: ["reference"], dateRaw: "2026-09-02", date: null, description: null, summary: null, draft: false },
  ]
  expect(filterNotes(notes, "guide", "title").map(note => note.slug)).toEqual(["a", "z"])
  expect(filterNotes(notes, "", "recent").map(note => note.slug)).toEqual(["b", "z", "a"])
  expect(filterNotes(notes, "missing", "title")).toEqual([])
  expect(paginateNotes(Array.from({ length: 11 }, (_, i) => i), 2)).toEqual([10])
  expect(getTotalPages(11)).toBe(2)
  expect(notes[0].slug).toBe("z")
})
