import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkObsidianComment } from "./comment.js"

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkObsidianComment)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md)
  return String(result)
}

describe("remarkObsidianComment", () => {
  it("strips %%comment%% from output", async () => {
    const html = await process("visible %%hidden%% text")
    expect(html).not.toContain("hidden")
    expect(html).toContain("visible")
    expect(html).toContain("text")
  })

  it("strips multiple comments", async () => {
    const html = await process("a %%one%% b %%two%% c")
    expect(html).not.toContain("one")
    expect(html).not.toContain("two")
    expect(html).toContain("a")
    expect(html).toContain("b")
    expect(html).toContain("c")
  })

  it("leaves text without comments unchanged", async () => {
    const html = await process("No comments here")
    expect(html).toContain("No comments here")
  })

  it("handles comment at start of text", async () => {
    const html = await process("%%removed%%visible")
    expect(html).not.toContain("removed")
    expect(html).toContain("visible")
  })

  it("handles comment at end of text", async () => {
    const html = await process("visible%%removed%%")
    expect(html).not.toContain("removed")
    expect(html).toContain("visible")
  })

  it("does not match single %", async () => {
    const html = await process("100% done")
    expect(html).toContain("100% done")
  })
})
