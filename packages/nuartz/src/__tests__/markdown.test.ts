import { describe, it, expect } from "vitest"
import { renderMarkdown } from "../markdown"

describe("renderMarkdown", () => {
  it("returns empty result for empty string", async () => {
    const result = await renderMarkdown("")
    expect(result.html).toBe("")
    expect(result.toc).toEqual([])
    expect(result.tags).toEqual([])
    expect(result.links).toEqual([])
  })

  it("extracts heading into toc", async () => {
    const result = await renderMarkdown("# Hello World")
    expect(result.toc).toHaveLength(1)
    expect(result.toc[0]).toMatchObject({
      depth: 1,
      text: "Hello World",
    })
    expect(result.toc[0].id).toBeTruthy()
  })

  it("builds nested toc tree", async () => {
    const md = "# Top\n## Sub\n### Deep"
    const result = await renderMarkdown(md)
    expect(result.toc).toHaveLength(1)
    expect(result.toc[0].text).toBe("Top")
    expect(result.toc[0].children).toHaveLength(1)
    expect(result.toc[0].children[0].text).toBe("Sub")
    expect(result.toc[0].children[0].children).toHaveLength(1)
    expect(result.toc[0].children[0].children[0].text).toBe("Deep")
  })

  it("parses frontmatter", async () => {
    const md = `---
title: My Page
date: 2024-01-01
---

Some content`
    const result = await renderMarkdown(md)
    expect(result.frontmatter.title).toBe("My Page")
    // gray-matter parses YAML dates as Date objects
    const date = result.frontmatter.date
    const dateStr = date instanceof Date ? date.toISOString().split("T")[0] : date
    expect(dateStr).toBe("2024-01-01")
  })

  it("extracts wikilinks into links array", async () => {
    const result = await renderMarkdown("Check [[Some Page]] for details")
    expect(result.links).toContain("Some Page")
  })

  it("extracts wikilink with alias", async () => {
    const result = await renderMarkdown("See [[Target|display text]]")
    expect(result.links).toContain("Target")
    expect(result.html).toContain("display text")
  })

  it("extracts inline tags", async () => {
    const result = await renderMarkdown("This has #mytag in it")
    expect(result.tags).toContain("mytag")
  })

  it("merges frontmatter tags with inline tags and deduplicates", async () => {
    const md = `---
tags:
  - alpha
  - beta
---

Content with #beta and #gamma`
    const result = await renderMarkdown(md)
    expect(result.tags).toContain("alpha")
    expect(result.tags).toContain("beta")
    expect(result.tags).toContain("gamma")
    // beta should appear only once
    const betaCount = result.tags.filter((t) => t === "beta").length
    expect(betaCount).toBe(1)
  })

  it("renders callout with correct class", async () => {
    const md = "> [!note]\n> Some note content"
    const result = await renderMarkdown(md)
    expect(result.html).toContain("callout")
    expect(result.html).toContain("callout-note")
  })

  it("renders LaTeX with KaTeX", async () => {
    const result = await renderMarkdown("Inline math: $$x^2$$")
    expect(result.html).toContain("katex")
  })

  it("renders display math with KaTeX", async () => {
    const result = await renderMarkdown("$$\nx^2 + y^2 = z^2\n$$")
    expect(result.html).toContain("katex")
  })

  it("generates html for basic markdown", async () => {
    const result = await renderMarkdown("Hello **world**")
    expect(result.html).toContain("<strong>world</strong>")
  })

  it("does not include embed links in outgoing links", async () => {
    const result = await renderMarkdown("![[image.png]]")
    expect(result.links).not.toContain("image.png")
  })

  it("adds slug ids to headings via rehype-slug", async () => {
    const result = await renderMarkdown("## My Section")
    expect(result.html).toContain('id="my-section"')
  })
})
