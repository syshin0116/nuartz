import { describe, expect, it } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { assignPageSlugs, getContentFiles } from "../fs"
import { createNoteResolver } from "../links"

describe("getContentFiles", () => {
  it("collects visible files by extension, sorted by path", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nuartz-content-files-"))
    try {
      await fs.mkdir(path.join(dir, "maps"))
      await fs.mkdir(path.join(dir, ".trash"))
      await fs.writeFile(path.join(dir, "maps", "b.canvas"), "{}")
      await fs.writeFile(path.join(dir, "a.BASE"), "views: []")
      await fs.writeFile(path.join(dir, "note.md"), "# Note")
      await fs.writeFile(path.join(dir, "_draft.canvas"), "{}")
      await fs.writeFile(path.join(dir, ".trash", "old.canvas"), "{}")
      const files = await getContentFiles(dir, [".canvas", ".base"])
      expect(files.map(file => file.path)).toEqual(["a.BASE", "maps/b.canvas"])
      expect(files[1]).toMatchObject({ raw: "{}", filePath: path.join(dir, "maps", "b.canvas"), size: 2 })
      expect(files[1].mtime).toBeInstanceOf(Date)
      expect(await getContentFiles(path.join(dir, "missing"), [".canvas"])).toEqual([])
    } finally {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })
})

describe("assignPageSlugs", () => {
  it("drops the extension and suffixes slugs taken by notes or earlier pages", () => {
    const slugs = assignPageSlugs(["maps/overview.canvas", "maps/overview.base", "free.canvas", "dup.canvas"], ["maps/overview", "dup-canvas"])
    expect([...slugs]).toEqual([
      ["maps/overview.canvas", "maps/overview-canvas"],
      ["maps/overview.base", "maps/overview-base"],
      ["free.canvas", "free"],
      ["dup.canvas", "dup"],
    ])
    expect(assignPageSlugs(["a.canvas"], ["a", "a-canvas"]).get("a.canvas")).toBe("a-canvas-2")
  })
})

it("resolves non-markdown pages only by file path or file name with extension", () => {
  const resolve = createNoteResolver([
    { slug: "maps/overview", frontmatter: {} },
    { slug: "maps/overview-canvas", frontmatter: {}, path: "maps/overview.canvas" },
    { slug: "projects", frontmatter: {}, path: "Projects.base" },
  ])
  expect(resolve("overview")).toBe("maps/overview")
  expect(resolve("overview.canvas")).toBe("maps/overview-canvas")
  expect(resolve("maps/overview.canvas")).toBe("maps/overview-canvas")
  expect(resolve("Projects.base")).toBe("projects")
  expect(resolve("projects")).toBeUndefined()
})
