import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkCallout } from "./callout.js"

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md)
  return String(result)
}

describe("remarkCallout", () => {
  it("transforms a basic note callout", async () => {
    const html = await process("> [!note] My Title\n> Some content here")
    expect(html).toContain('class="callout callout-note"')
    expect(html).toContain('data-callout="note"')
    expect(html).toContain('<div class="callout-title">My Title</div>')
    expect(html).toContain("Some content here")
  })

  it.each([
    "note", "warning", "tip", "info", "success", "danger", "question",
    "abstract", "todo", "hint", "important", "check", "done",
    "help", "faq", "caution", "attention", "failure", "fail",
    "missing", "error", "bug", "example", "quote", "cite",
  ])("supports callout type: %s", async (type) => {
    const html = await process(`> [!${type}]\n> Content`)
    expect(html).toContain(`callout-${type}`)
    expect(html).toContain(`data-callout="${type}"`)
  })

  it("renders '+' callouts as open <details> with a <summary> title", async () => {
    const html = await process("> [!note]+ Expandable\n> Content")
    expect(html).toMatch(/^<details class="callout callout-note"[^>]*data-callout-fold="\+"[^>]* open>/)
    expect(html).toContain('<summary class="callout-title">Expandable</summary>')
  })

  it("renders '-' callouts as closed <details>", async () => {
    const html = await process("> [!tip]- Collapsed\n> Content")
    expect(html).toMatch(/^<details class="callout callout-tip"[^>]*data-callout-fold="-"/)
    expect(html).not.toMatch(/<details[^>]* open/)
    expect(html).toContain('<summary class="callout-title">Collapsed</summary>')
  })

  it("keeps the [!type|metadata] metadata as a data attribute", async () => {
    const html = await process("> [!note|wide] Title\n> Content")
    expect(html).toContain('data-callout="note"')
    expect(html).toContain('data-callout-metadata="wide"')
    expect(html).toContain('<div class="callout-title">Title</div>')
  })

  it("uses capitalized type as default title when no title given", async () => {
    const html = await process("> [!warning]\n> Content")
    expect(html).toContain('<div class="callout-title">Warning</div>')
  })

  it("uses custom title text", async () => {
    const html = await process("> [!note] Custom Title Here\n> Content")
    expect(html).toContain('<div class="callout-title">Custom Title Here</div>')
  })

  it("does not transform a regular blockquote", async () => {
    const html = await process("> This is just a regular blockquote")
    expect(html).not.toContain("callout")
    expect(html).toContain("<blockquote>")
  })

  it("accepts custom callout types and titles them from the type", async () => {
    const html = await process("> [!my-custom]\n> Content")
    expect(html).toContain('class="callout callout-my-custom"')
    expect(html).toContain('<div class="callout-title">My custom</div>')
  })

  it("leaves blockquotes whose first line is not a callout marker alone", async () => {
    const html = await process("> text before [!note]\n> more")
    expect(html).not.toContain("callout")
  })

  it("is case-insensitive for callout type", async () => {
    const html = await process("> [!NOTE] Title\n> Content")
    expect(html).toContain('data-callout="note"')
  })

  it("preserves remaining content after the callout marker line", async () => {
    const html = await process("> [!tip] Title\n> Line one\n> Line two")
    expect(html).toContain("Line one")
    expect(html).toContain("Line two")
  })
})
