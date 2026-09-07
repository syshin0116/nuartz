import matter from "gray-matter"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import GithubSlugger from "github-slugger"
import { visit } from "unist-util-visit"
import { toHtml } from "hast-util-to-html"
import type { Root, RootContent } from "mdast"
import type { Plugin } from "unified"
import { WIKILINK_REGEX } from "./wikilink.js"

export function embedContent(content: string, heading?: string): string | undefined {
  const body = matter(content).content
  if (!heading) return body
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body)
  const slugger = new GithubSlugger()
  let start: RootContent | undefined
  let end: number | undefined
  for (const node of tree.children) {
    const raw = body.slice(node.position?.start.offset, node.position?.end.offset)
    if (heading.startsWith("^")) {
      if (raw.trimEnd().endsWith(heading)) {
        const block = raw.trim() === heading ? tree.children[tree.children.indexOf(node) - 1] : node
        return block ? body.slice(block.position?.start.offset, block.position?.end.offset).replace(/\s*\^[\w-]+\s*$/, "") : undefined
      }
    } else if (node.type === "heading") {
      let text = ""
      visit(node, (child) => { if (child.type === "text" || child.type === "inlineCode") text += child.value })
      const id = slugger.slug(text)
      if (start?.type === "heading" && node.depth <= start.depth) { end = node.position?.start.offset; break }
      if (!start && (text === heading || id === heading)) start = node
    }
  }
  return start ? body.slice(start.position?.start.offset, end) : undefined
}

export const remarkEmbed: Plugin<[{ render: (target: string, heading?: string) => Promise<{ html: string; href: string } | undefined> }], Root> = ({ render }) => {
  return async (tree, file) => {
    const pending: Promise<void>[] = []
    let count = 0
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === undefined || node.children.length !== 1 || node.children[0].type !== "text") return
      const value = node.children[0].value.trim()
      const match = [...value.matchAll(WIKILINK_REGEX)][0]
      if (!match || match[0] !== value || match[1] !== "!") return
      const [, , target, heading, alias] = match
      const prefix = `embed-${++count}-`
      pending.push(render(target, heading).then(result => {
        if (!result) return
        const html = result.html.replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
          .replace(/\b(href|xlink:href)="#([^"]+)"/g, `$1="#${prefix}$2"`).replace(/url\(#/g, `url(#${prefix}`)
        const link = toHtml({ type: "element", tagName: "a", properties: { href: result.href, className: ["embed-source"] }, children: [{ type: "text", value: alias ?? [target, heading?.replace(/^\^/, "")].filter(Boolean).join(" / ") }] })
        parent.children[index] = { type: "html", value: `<section class="embed-note">${link}${html}</section>` }
        file.data.links = [...new Set([...(file.data.links as string[] ?? []), target])]
      }))
    })
    await Promise.all(pending)
  }
}

export const remarkBlockIds: Plugin<[], Root> = () => tree => {
  visit(tree, "paragraph", (node, index, parent) => {
    const last = node.children.at(-1)
    if (last?.type !== "text") return
    const match = last.value.match(/(?:^|\s)\^([\w-]+)\s*$/)
    if (!match) return
    const target = node.children.length === 1 && last.value.trim() === `^${match[1]}` && parent && index
      ? parent.children[index - 1] : node
    target.data = { ...target.data, hProperties: { ...target.data?.hProperties, id: match[1] } }
    last.value = last.value.slice(0, match.index)
  })
}
