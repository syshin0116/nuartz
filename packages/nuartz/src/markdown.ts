import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import type { ElementContent } from "hast"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"
import { visit } from "unist-util-visit"
import type { Root as HastRoot, Element } from "hast"
import type { Plugin } from "unified"

import remarkBreaks from "remark-breaks"
import { rehypePrettyCode } from "rehype-pretty-code"
import { remarkCallout } from "./plugins/callout.js"
import { remarkTag } from "./plugins/tag.js"
import { remarkWikilink } from "./plugins/wikilink.js"
import { remarkHighlight } from "./plugins/highlight.js"
import { remarkObsidianComment } from "./plugins/comment.js"
import { remarkArrows } from "./plugins/arrows.js"
import type { Frontmatter, RenderResult, RenderOptions, TocEntry } from "./types.js"

// Rehype plugin that extracts headings into vfile.data.toc
const rehypeExtractToc: Plugin<[], HastRoot> = () => {
  return (tree, file) => {
    const toc: TocEntry[] = []

    visit(tree, "element", (node: Element) => {
      const match = node.tagName.match(/^h([1-6])$/)
      if (!match) return

      const depth = parseInt(match[1])
      const id = (node.properties?.id as string) ?? ""
      const text = extractText(node)

      toc.push({ depth, text, id, children: [] })
    })

    file.data.toc = buildTocTree(toc)
  }
}

function extractText(node: Element): string {
  let text = ""
  visit(node as unknown as HastRoot, "text", (n: { value: string }) => {
    text += n.value
  })
  return text
}

function buildTocTree(flat: TocEntry[]): TocEntry[] {
  const root: TocEntry[] = []
  const stack: TocEntry[] = []

  for (const entry of flat) {
    while (stack.length > 0 && stack[stack.length - 1].depth >= entry.depth) {
      stack.pop()
    }
    if (stack.length === 0) {
      root.push(entry)
    } else {
      stack[stack.length - 1].children.push(entry)
    }
    stack.push(entry)
  }

  return root
}

export async function renderMarkdown(
  content: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const { baseUrl = "/", resolveLink = (t) => t, knownSlugs } = options

  // Parse frontmatter with gray-matter
  const { data: frontmatter, content: body } = matter(content)

  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .use(remarkObsidianComment)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkWikilink, { baseUrl, resolve: resolveLink, knownSlugs })
    .use(remarkCallout)
    .use(remarkTag)
    .use(remarkHighlight)
    .use(remarkArrows)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePrettyCode, {
      theme: { light: "github-light", dark: "github-dark" },
      keepBackground: false,
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: "heading-anchor", ariaLabel: "Copy link to section" },
      content: {
        type: "element", tagName: "svg",
        properties: { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none",
          stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        children: [
          { type: "element", tagName: "path", properties: { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }, children: [] },
          { type: "element", tagName: "path", properties: { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }, children: [] },
        ],
      } as ElementContent,
    })
    .use(rehypeKatex)
    .use(rehypeExtractToc)
    .use(rehypeStringify)
    .process(body)

  return {
    html: String(file),
    frontmatter: frontmatter as Frontmatter,
    toc: (file.data.toc as TocEntry[]) ?? [],
    links: (file.data.links as string[]) ?? [],
    tags: [
      ...((frontmatter.tags as string[]) ?? []),
      ...((file.data.tags as string[]) ?? []),
    ].filter((t, i, a) => a.indexOf(t) === i),
  }
}
