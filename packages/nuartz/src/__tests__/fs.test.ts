import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { getAllMarkdownFiles, getMarkdownBySlug, buildFileTree } from "../fs"
import type { MarkdownFile } from "../fs"

describe("getAllMarkdownFiles", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nuartz-fs-test-"))
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it("returns all .md files recursively", async () => {
    await fs.writeFile(path.join(tmpDir, "root.md"), "# Root")
    await fs.mkdir(path.join(tmpDir, "sub"), { recursive: true })
    await fs.writeFile(path.join(tmpDir, "sub", "nested.md"), "# Nested")

    const files = await getAllMarkdownFiles(tmpDir)
    const slugs = files.map((f) => f.slug)
    expect(slugs).toContain("root")
    expect(slugs).toContain("sub/nested")
  })

  it("excludes files starting with _", async () => {
    await fs.writeFile(path.join(tmpDir, "visible.md"), "# Visible")
    await fs.writeFile(path.join(tmpDir, "_hidden.md"), "# Hidden")

    const files = await getAllMarkdownFiles(tmpDir)
    const slugs = files.map((f) => f.slug)
    expect(slugs).toContain("visible")
    expect(slugs).not.toContain("_hidden")
  })

  it("returns MarkdownFile[] with correct slug format", async () => {
    await fs.mkdir(path.join(tmpDir, "notes"), { recursive: true })
    await fs.writeFile(path.join(tmpDir, "notes", "foo.md"), "# Foo")

    const files = await getAllMarkdownFiles(tmpDir)
    expect(files).toHaveLength(1)
    expect(files[0].slug).toBe("notes/foo")
    expect(files[0].filePath).toBe(path.join(tmpDir, "notes", "foo.md"))
    expect(files[0].raw).toContain("# Foo")
  })

  it("parses frontmatter", async () => {
    const content = `---
title: My Note
tags:
  - test
---

Body content`
    await fs.writeFile(path.join(tmpDir, "note.md"), content)

    const files = await getAllMarkdownFiles(tmpDir)
    expect(files[0].frontmatter.title).toBe("My Note")
    expect(files[0].frontmatter.tags).toEqual(["test"])
  })

  it("skips drafts and unpublished notes but keeps explicitly published ones", async () => {
    await fs.writeFile(path.join(tmpDir, "draft.md"), "---\ndraft: true\n---\nDraft")
    await fs.writeFile(path.join(tmpDir, "unpublished.md"), "---\npublished: false\n---\nHidden")
    await fs.writeFile(path.join(tmpDir, "kept.md"), "---\ndraft: false\npublished: true\n---\nKept")
    await fs.writeFile(path.join(tmpDir, "notes.txt"), "not markdown")

    const files = await getAllMarkdownFiles(tmpDir)
    expect(files.map(f => f.slug)).toEqual(["kept"])
    expect(files[0].mtime).toBeInstanceOf(Date)
  })

  it("returns empty array for non-existent directory", async () => {
    const files = await getAllMarkdownFiles(path.join(tmpDir, "nonexistent"))
    expect(files).toEqual([])
  })
})

describe("getMarkdownBySlug", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "nuartz-slug-test-"))
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it("returns MarkdownFile for existing slug", async () => {
    const content = `---
title: Hello
---

World`
    await fs.writeFile(path.join(tmpDir, "hello.md"), content)

    const file = await getMarkdownBySlug(tmpDir, "hello")
    expect(file).not.toBeNull()
    expect(file!.slug).toBe("hello")
    expect(file!.frontmatter.title).toBe("Hello")
    expect(file!.raw).toContain("World")
  })

  it("returns null for non-existent slug", async () => {
    const file = await getMarkdownBySlug(tmpDir, "does-not-exist")
    expect(file).toBeNull()
  })

  it("works with nested slugs", async () => {
    await fs.mkdir(path.join(tmpDir, "notes"), { recursive: true })
    await fs.writeFile(path.join(tmpDir, "notes", "deep.md"), "# Deep")

    const file = await getMarkdownBySlug(tmpDir, "notes/deep")
    expect(file).not.toBeNull()
    expect(file!.slug).toBe("notes/deep")
  })
})

describe("buildFileTree", () => {
  it("uses explicit document order before folder and alphabetical ordering", () => {
    const files: MarkdownFile[] = [
      { slug: "docs/authoring", filePath: "", raw: "", frontmatter: { title: "Authoring", order: 2 } },
      { slug: "docs/getting-started", filePath: "", raw: "", frontmatter: { title: "Getting Started", order: 1 } },
      { slug: "docs/features/graph", filePath: "", raw: "", frontmatter: { title: "Graph" } },
    ]
    expect(buildFileTree(files)[0].children?.map(node => node.path)).toEqual(["docs/getting-started", "docs/authoring", "docs/features"])
  })
  it("builds tree from flat list of files", () => {
    const files: MarkdownFile[] = [
      { slug: "alpha", filePath: "/alpha.md", frontmatter: { title: "Alpha" }, raw: "" },
      { slug: "beta", filePath: "/beta.md", frontmatter: { title: "Beta" }, raw: "" },
    ]

    const tree = buildFileTree(files)
    expect(tree).toHaveLength(2)
    expect(tree[0].name).toBe("Alpha")
    expect(tree[0].type).toBe("file")
    expect(tree[0].path).toBe("alpha")
    expect(tree[1].name).toBe("Beta")
  })

  it("creates folder nodes for nested files", () => {
    const files: MarkdownFile[] = [
      { slug: "notes/page1", filePath: "/notes/page1.md", frontmatter: { title: "Page 1" }, raw: "" },
      { slug: "notes/page2", filePath: "/notes/page2.md", frontmatter: { title: "Page 2" }, raw: "" },
    ]

    const tree = buildFileTree(files)
    expect(tree).toHaveLength(1)
    expect(tree[0].type).toBe("folder")
    expect(tree[0].name).toBe("notes")
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children![0].name).toBe("Page 1")
    expect(tree[0].children![1].name).toBe("Page 2")
  })

  it("uses frontmatter.title for file display name", () => {
    const files: MarkdownFile[] = [
      { slug: "my-file", filePath: "/my-file.md", frontmatter: { title: "Custom Title" }, raw: "" },
    ]

    const tree = buildFileTree(files)
    expect(tree[0].name).toBe("Custom Title")
  })

  it("falls back to filename when no title", () => {
    const files: MarkdownFile[] = [
      { slug: "my-file", filePath: "/my-file.md", frontmatter: {}, raw: "" },
    ]

    const tree = buildFileTree(files)
    expect(tree[0].name).toBe("my-file")
  })

  it("handles deeply nested structures", () => {
    const files: MarkdownFile[] = [
      { slug: "a/b/c", filePath: "/a/b/c.md", frontmatter: { title: "Deep" }, raw: "" },
    ]

    const tree = buildFileTree(files)
    expect(tree[0].type).toBe("folder")
    expect(tree[0].name).toBe("a")
    expect(tree[0].children![0].type).toBe("folder")
    expect(tree[0].children![0].name).toBe("b")
    expect(tree[0].children![0].children![0].type).toBe("file")
    expect(tree[0].children![0].children![0].name).toBe("Deep")
  })

  it("returns empty array for empty input", () => {
    const tree = buildFileTree([])
    expect(tree).toEqual([])
  })
})

describe("buildFileTree sorting", () => {
  const note = (slug: string, frontmatter: MarkdownFile["frontmatter"] = {}, mtime?: Date): MarkdownFile =>
    ({ slug, filePath: "", raw: "", frontmatter, mtime })

  it("sorts by frontmatter date, then filename date, newest first", () => {
    const tree = buildFileTree([
      note("undated"),
      note("2024-01-15-from-filename"),
      note("from-frontmatter", { date: "2025-06-01" }),
      note("2023-03-01-frontmatter-wins", { date: "2026-01-01" }),
    ], { sortBy: "date" })

    expect(tree.map(n => n.path)).toEqual(["2023-03-01-frontmatter-wins", "from-frontmatter", "2024-01-15-from-filename", "undated"])
    expect(tree.find(n => n.path === "undated")?.date).toBe(0)
  })

  it("falls back to the filename when the frontmatter date is invalid", () => {
    const [node] = buildFileTree([note("2024-02-02-post", { date: "not a date" })], { sortBy: "date" })
    expect(node.date).toBe(new Date("2024-02-02").getTime())
  })

  it("lifts the newest child date to its folder and keeps folders first", () => {
    const tree = buildFileTree([
      note("recent", { date: "2026-05-01" }),
      note("journal/old", { date: "2020-01-01" }),
      note("journal/new", { date: "2025-01-01" }),
    ], { sortBy: "date" })

    expect(tree.map(n => n.path)).toEqual(["journal", "recent"])
    expect(tree[0].date).toBe(new Date("2025-01-01").getTime())
    expect(tree[0].children?.map(n => n.path)).toEqual(["journal/new", "journal/old"])
  })

  it("sorts by modification time and lifts the newest mtime to its folder", () => {
    const older = new Date("2024-01-01T00:00:00Z")
    const newer = new Date("2025-01-01T00:00:00Z")
    const tree = buildFileTree([
      note("a-stale", {}, older),
      note("b-fresh", {}, newer),
      note("c-no-mtime"),
      note("folder/inner-old", {}, older),
      note("folder/inner-new", {}, newer),
    ], { sortBy: "modified" })

    expect(tree.map(n => n.path)).toEqual(["folder", "b-fresh", "a-stale", "c-no-mtime"])
    expect(tree[0].mtime).toEqual(newer)
    expect(tree[0].children?.map(n => n.path)).toEqual(["folder/inner-new", "folder/inner-old"])
  })

  it("gives a folder the smallest order of its children", () => {
    const tree = buildFileTree([
      note("zeta/one", { order: 5 }),
      note("zeta/two", { order: 2 }),
      note("alpha"),
    ])
    expect(tree[0]).toMatchObject({ path: "zeta", order: 2 })
  })
})
