import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { remarkWikilink } from "./wikilink.js"

async function process(md: string, options?: Parameters<typeof remarkWikilink>[0]): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkWikilink, options)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md)
  return String(result)
}

async function processWithData(md: string, options?: Parameters<typeof remarkWikilink>[0]) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkWikilink, options)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(md)
  return { html: String(file), links: (file.data as Record<string, unknown>).links as string[] ?? [] }
}

describe("remarkWikilink", () => {
  it("transforms [[Page Name]] into a wikilink", async () => {
    const html = await process("Visit [[Page Name]] for details")
    expect(html).toContain('href="/page-name"')
    expect(html).toContain('class="wikilink"')
    expect(html).toContain("Page Name")
  })

  it("handles alias [[Page|Alias]]", async () => {
    const html = await process("See [[Page|Custom Display]]")
    expect(html).toContain('href="/page"')
    expect(html).toContain("Custom Display")
  })

  it("handles heading [[Page#Heading]]", async () => {
    const html = await process("Go to [[Page#My Section]]")
    expect(html).toContain('href="/page#my-section"')
    expect(html).toContain("Page > My Section")
  })

  it("handles heading with alias [[Page#Heading|Alias]]", async () => {
    const html = await process("See [[Page#Section|Link Text]]")
    expect(html).toContain('href="/page#section"')
    expect(html).toContain("Link Text")
  })

  it("transforms ![[image.png]] into an embed image", async () => {
    const html = await process("Here: ![[image.png]]")
    expect(html).toContain("<img")
    expect(html).toContain('src="/imagepng"')
    expect(html).toContain('class="embed"')
  })

  it("converts spaces to hyphens in href", async () => {
    const html = await process("[[My Long Page Name]]")
    expect(html).toContain('href="/my-long-page-name"')
  })

  it("accumulates links in file.data.links", async () => {
    const { links } = await processWithData("[[Page A]] and [[Page B]]")
    expect(links).toContain("Page A")
    expect(links).toContain("Page B")
  })

  it("deduplicates collected links", async () => {
    const { links } = await processWithData("[[Same]] and [[Same]]")
    expect(links).toEqual(["Same"])
  })

  it("does not add embeds to outgoing links", async () => {
    const { links } = await processWithData("![[image.png]]")
    expect(links).toEqual([])
  })

  it("supports custom resolve function", async () => {
    const html = await process("[[My Page]]", {
      resolve: (target) => `/custom/${target.toLowerCase().replace(/\s+/g, "_")}`,
    })
    expect(html).toContain('href="/custom/my_page"')
  })

  it("supports custom baseUrl", async () => {
    const html = await process("[[Page]]", { baseUrl: "/wiki/" })
    expect(html).toContain('href="/wiki/page"')
  })

  it("sets data-target attribute", async () => {
    const html = await process("[[My Page]]")
    expect(html).toContain('data-target="My Page"')
  })

  it("sets data-heading attribute when heading present", async () => {
    const html = await process("[[Page#Section]]")
    expect(html).toContain('data-heading="Section"')
  })

  it("preserves surrounding text", async () => {
    const html = await process("before [[Link]] after")
    expect(html).toContain("before ")
    expect(html).toContain(" after")
  })
})
