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
  if (heading.startsWith("^")) return blockContent(body, tree, heading)
  const slugger = new GithubSlugger()
  let start: RootContent | undefined
  let end: number | undefined
  for (const node of tree.children) {
    if (node.type === "heading") {
      let text = ""
      visit(node, (child) => { if (child.type === "text" || child.type === "inlineCode") text += child.value })
      const id = slugger.slug(text)
      if (start?.type === "heading" && node.depth <= start.depth) { end = node.position?.start.offset; break }
      if (!start && (text === heading || id === heading)) start = node
    }
  }
  return start ? body.slice(start.position?.start.offset, end) : undefined
}

const BLOCK_ID = /\s*\^[\w-]+\s*$/

/**
 * Markdown for the block marked `^id`, searched at any depth: a list item
 * (with its nested items), a paragraph, or the block preceding a standalone
 * `^id` line (tables, quotes, callouts, code).
 */
function blockContent(body: string, tree: Root, id: string): string | undefined {
  const source = (node: { position?: { start: { offset?: number }; end: { offset?: number } } }) =>
    body.slice(node.position?.start.offset, node.position?.end.offset)
  const endsWithId = (node: Parameters<typeof source>[0]) => source(node).trimEnd().endsWith(id)
  let found: string | undefined
  visit(tree, (node, index, parent) => {
    if (found !== undefined) return false
    if (node.type === "listItem") {
      const first = node.children[0]
      if (first?.type === "paragraph" && endsWithId(first)) {
        // Remove the id from the item's first line, keep nested content and the list marker.
        const text = source(node)
        const firstEnd = (first.position?.end.offset ?? 0) - (node.position?.start.offset ?? 0)
        found = text.slice(0, firstEnd).replace(BLOCK_ID, "") + text.slice(firstEnd)
        return false
      }
    } else if (node.type === "paragraph" && endsWithId(node) && parent?.type !== "listItem") {
      const standalone = source(node).trim() === id
      const block = standalone && parent && index !== undefined ? parent.children[index - 1] : node
      found = block ? source(block).replace(BLOCK_ID, "") : ""
      return false
    }
  })
  return found || undefined
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
    const standalone = node.children.length === 1 && last.value.trim() === `^${match[1]}` && parent && index
    // An id on a list item's first line names the whole item, as in Obsidian.
    const target = standalone ? parent.children[index - 1]
      : parent?.type === "listItem" && parent.children[0] === node ? parent : node
    target.data = { ...target.data, hProperties: { ...target.data?.hProperties, id: match[1] } }
    last.value = last.value.slice(0, match.index)
  })
}
