import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkHighlight } from "./highlight.js"

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkHighlight)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md)
  return String(result)
}

describe("remarkHighlight", () => {
  it("wraps ==text== in <mark> tags", async () => {
    const html = await process("This is ==highlighted== text")
    expect(html).toContain("<mark>highlighted</mark>")
  })

  it("handles multiple highlights in one line", async () => {
    const html = await process("==first== and ==second==")
    expect(html).toContain("<mark>first</mark>")
    expect(html).toContain("<mark>second</mark>")
  })

  it("preserves surrounding text", async () => {
    const html = await process("before ==middle== after")
    expect(html).toContain("before ")
    expect(html).toContain("<mark>middle</mark>")
    expect(html).toContain(" after")
  })

  it("does not match single = signs", async () => {
    const html = await process("a = b")
    expect(html).not.toContain("<mark>")
  })

  it("does not match across newlines", async () => {
    const html = await process("==start\nend==")
    expect(html).not.toContain("<mark>")
  })

  it("leaves text without highlights unchanged", async () => {
    const html = await process("No highlights here")
    expect(html).not.toContain("<mark>")
    expect(html).toContain("No highlights here")
  })
})
