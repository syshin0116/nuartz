import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkTag } from "./tag.js"

async function process(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkTag)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md)
  return String(result)
}

async function processWithData(md: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkTag)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md)
  return { html: String(file), tags: (file.data as Record<string, unknown>).tags as string[] ?? [] }
}

describe("remarkTag", () => {
  it("transforms #mytag into a tag link", async () => {
    const html = await process("Hello #mytag world")
    expect(html).toContain('href="/tags/mytag"')
    expect(html).toContain('class="tag"')
    expect(html).toContain("#mytag")
  })

  it("does not transform #123invalid (starts with number)", async () => {
    const html = await process("Hello #123invalid world")
    expect(html).not.toContain('class="tag"')
    expect(html).toContain("#123invalid")
  })

  it("transforms #tag-with-hyphen", async () => {
    const html = await process("A #tag-with-hyphen here")
    expect(html).toContain('href="/tags/tag-with-hyphen"')
    expect(html).toContain('class="tag"')
  })

  it("transforms #tag_with_underscore", async () => {
    const html = await process("A #tag_with_underscore here")
    expect(html).toContain('href="/tags/tag_with_underscore"')
  })

  it("handles multiple tags in one paragraph", async () => {
    const html = await process("Tags: #first and #second")
    expect(html).toContain('href="/tags/first"')
    expect(html).toContain('href="/tags/second"')
  })

  it("collects tags into file.data.tags", async () => {
    const { tags } = await processWithData("Hello #alpha and #beta")
    expect(tags).toContain("alpha")
    expect(tags).toContain("beta")
  })

  it("deduplicates collected tags", async () => {
    const { tags } = await processWithData("#same #same #same")
    expect(tags).toEqual(["same"])
  })

  it("preserves surrounding text", async () => {
    const html = await process("before #tag after")
    expect(html).toContain("before ")
    expect(html).toContain(" after")
  })

  it("sets data-tag attribute", async () => {
    const html = await process("#example")
    expect(html).toContain('data-tag="example"')
  })
})
