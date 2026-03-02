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
