import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkTag } from "./tag.js"

async function process(md: string, options?: Parameters<typeof remarkTag>[0]): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkTag, options)
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

  it("renders each tag as exactly one non-empty anchor", async () => {
    const html = await process("Hello #mytag world")
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('<a href="/tags/mytag" class="tag" data-tag="mytag">#mytag</a>')
  })

  it("requires whitespace or a line start before the hash", async () => {
    const html = await process("C# and (#E1) and a#b and **bold**#x and *#y*\n#start")
    expect(html.match(/class="tag"/g)).toHaveLength(1)
    expect(html).toContain('data-tag="start"')
  })

  it("keeps escaped hashes as text", async () => {
    const { tags } = await processWithData("real #python and escaped \\#python and \\#other")
    expect(tags).toEqual(["python"])
    expect(await process("escaped \\#other")).not.toContain('class="tag"')
  })

  it("ignores hashes inside code, link labels, and URL fragments", async () => {
    const md = [
      "`#code` and ``a #span``",
      "",
      "    #indented",
      "",
      "[see #label](https://example.com) https://example.com/ssh#frag https://portal.azure.com/#home",
    ].join("\n")
    expect(await process(md)).not.toContain('class="tag"')
  })

  it("requires a leading letter", async () => {
    const html = await process("example #1, #123invalid, issue #2보다, and #x1")
    expect(html.match(/class="tag"/g)).toHaveLength(1)
    expect(html).toContain('data-tag="x1"')
  })

  it("accepts any script, combining marks, and nested tags", async () => {
    const { tags } = await processWithData("#adsp중요 #한글태그 #aनमस्ते #parent/child #trail/ end")
    expect(tags).toEqual(["adsp중요", "한글태그", "aनमस्ते", "parent/child", "trail"])
  })

  it("encodes the whole tag in the default href to match the single-segment tag route", async () => {
    const html = await process("#부모/자식")
    expect(html).toContain(`href="/tags/${encodeURIComponent("부모/자식")}"`)
  })

  it("keeps escaped and referenced hashes as text after emoji or entities", async () => {
    const { tags } = await processWithData("😀 \\#한글 &copy; \\#다른 &#35;참조 then #진짜")
    expect(tags).toEqual(["진짜"])
  })

  it("uses a custom tag URL", async () => {
    const html = await process("#RMSE", { resolveTag: tag => `/blog/tags/${tag}` })
    expect(html).toContain('href="/blog/tags/RMSE"')
  })
})
