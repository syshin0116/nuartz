import { describe, it, expect } from "vitest"
import { buildSearchIndex } from "../search"
import type { MarkdownFile } from "../fs"

function makeFile(overrides: Partial<MarkdownFile> & { slug: string }): MarkdownFile {
  return {
    filePath: `/${overrides.slug}.md`,
    frontmatter: {},
    raw: "",
    ...overrides,
  }
}

describe("buildSearchIndex", () => {
  it("returns SearchEntry[] with slug, title, content, tags", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "hello",
        frontmatter: { title: "Hello", tags: ["greeting"] },
        raw: "---\ntitle: Hello\ntags:\n  - greeting\n---\nSome body text",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index).toHaveLength(1)
    expect(index[0].slug).toBe("hello")
    expect(index[0].title).toBe("Hello")
    expect(index[0].content).toContain("Some body text")
    expect(index[0].tags).toEqual(["greeting"])
  })

  it("excludes draft:true files", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "published",
        frontmatter: { title: "Published" },
        raw: "Public content",
      }),
      makeFile({
        slug: "draft",
        frontmatter: { title: "Draft", draft: true },
        raw: "---\ntitle: Draft\ndraft: true\n---\nDraft content",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index).toHaveLength(1)
    expect(index[0].slug).toBe("published")
  })

  it("strips heading markers from content", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "headings",
        raw: "# Heading One\n## Heading Two\nBody",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].content).not.toMatch(/^#/)
    expect(index[0].content).toContain("Heading One")
    expect(index[0].content).toContain("Body")
  })

  it("strips bold and italic markers", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "emphasis",
        raw: "Some **bold** and *italic* and __also__ text",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].content).not.toContain("**")
    expect(index[0].content).not.toContain("*")
    expect(index[0].content).not.toContain("__")
    expect(index[0].content).toContain("bold")
    expect(index[0].content).toContain("italic")
  })

  it("strips inline code", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "code",
        raw: "Use `console.log` to debug",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].content).not.toContain("`")
  })

  it("strips wikilinks keeping display text", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "links",
        raw: "See [[My Page]] and [[Other|display]]",
      }),
    ]

    const index = buildSearchIndex(files)
    // wikilink regex captures target (first group), not alias
    // [[My Page]] → "My Page", [[Other|display]] → "Other"
    expect(index[0].content).toContain("My Page")
    expect(index[0].content).toContain("Other")
    expect(index[0].content).not.toContain("[[")
    expect(index[0].content).not.toContain("]]")
  })

  it("uses last slug segment as title fallback", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "notes/deep/my-page",
        frontmatter: {},
        raw: "Content without title",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].title).toBe("my-page")
  })

  it("includes frontmatter tags", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "tagged",
        frontmatter: { tags: ["alpha", "beta"] },
        raw: "---\ntags:\n  - alpha\n  - beta\n---\nContent",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].tags).toEqual(["alpha", "beta"])
  })

  it("includes description from frontmatter", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "desc",
        frontmatter: { title: "Desc", description: "A short summary" },
        raw: "---\ntitle: Desc\ndescription: A short summary\n---\nBody",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].description).toBe("A short summary")
  })

  it("returns empty array for empty input", () => {
    const index = buildSearchIndex([])
    expect(index).toEqual([])
  })

  it("strips code blocks from content", () => {
    const files: MarkdownFile[] = [
      makeFile({
        slug: "codeblock",
        raw: "Before\n```js\nconsole.log('hi')\n```\nAfter",
      }),
    ]

    const index = buildSearchIndex(files)
    expect(index[0].content).not.toContain("console.log")
    expect(index[0].content).toContain("Before")
    expect(index[0].content).toContain("After")
  })
})
