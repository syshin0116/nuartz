import { SKIP, visit } from "unist-util-visit"
import type { Root, Text, PhrasingContent, Parent } from "mdast"
import type { Plugin } from "unified"

// Obsidian tag characters: letters and marks of any script, digits, `_`, `-`, and `/` for nesting.
const TAG_REGEX = /#([\p{L}\p{M}\p{N}_/-]+)/gu
const BOUNDARY = /\s/u
const LINK_TYPES = new Set(["link", "linkReference", "definition"])

export interface TagOptions {
  /** URL for a tag (default: `/tags/` followed by each `/` segment URL-encoded). */
  resolveTag?: (tag: string) => string
}

export function defaultTagHref(tag: string): string {
  return `/tags/${tag.split("/").map(encodeURIComponent).join("/")}`
}

/**
 * Stop at an empty nesting level and require a leading letter. Obsidian also accepts a
 * leading digit, but prose such as `#2보다` (an issue number and a particle) is not a tag.
 */
function normalizeTag(raw: string): string | undefined {
  const tag = raw.split("//")[0].replace(/\/+$/, "")
  return /^\p{L}/u.test(tag) ? tag : undefined
}

/**
 * Source offsets of each character of a text node's value. Markdown escapes, entity
 * references, and stripped container markers make the value a subsequence of its source.
 */
function sourceOffsets(node: Text, source: string): number[] | undefined {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return undefined
  const offsets: number[] = []
  let cursor = start
  for (const character of node.value) {
    while (cursor < end && source[cursor] !== character) cursor += 1
    if (cursor >= end) return undefined
    offsets.push(cursor)
    cursor += 1
  }
  return offsets
}

/** Character before the `#`, from the source when known, else from the rendered siblings. */
function precedingCharacter(node: Text, index: number, siblings: Parent["children"], position: number, offsets: number[] | undefined, source: string): string | undefined {
  if (offsets) return offsets[position] > 0 ? source[offsets[position] - 1] : undefined
  if (position > 0) return node.value[position - 1]
  const previous = siblings[index - 1]
  if (!previous) return undefined
  if (previous.type === "break") return "\n"
  return previous.type === "text" ? previous.value.at(-1) : ""
}

/**
 * Transforms inline #tags into links, following Obsidian: a tag follows whitespace or a
 * line start, is not escaped (`\#`), starts with a letter, and never appears inside code or links.
 * Collected tags are stored on the vfile data: `file.data.tags`
 */
export const remarkTag: Plugin<[TagOptions?], Root> = (options = {}) => {
  const resolveTag = options.resolveTag ?? defaultTagHref
  return (tree, file) => {
    const collected: string[] = []
    const source = String(file.value ?? "")

    visit(tree, (node, index, parent) => {
      if (LINK_TYPES.has(node.type)) return SKIP
      if (node.type !== "text" || !parent || index === undefined) return
      const text = node as Text

      const nodes: PhrasingContent[] = []
      let lastIndex = 0
      let offsets: number[] | undefined | null = null

      for (const match of text.value.matchAll(TAG_REGEX)) {
        const position = match.index
        if (offsets === null) offsets = sourceOffsets(text, source)
        const before = precedingCharacter(text, index, parent.children, position, offsets, source)
        if (before !== undefined && !BOUNDARY.test(before)) continue
        const tag = normalizeTag(match[1])
        if (!tag) continue

        if (position > lastIndex) nodes.push({ type: "text", value: text.value.slice(lastIndex, position) })
        collected.push(tag)
        nodes.push({
          type: "link",
          url: resolveTag(tag),
          data: { hProperties: { className: "tag", "data-tag": tag } },
          children: [{ type: "text", value: `#${tag}` }],
        })
        lastIndex = position + 1 + tag.length
      }

      if (!nodes.length) return
      if (lastIndex < text.value.length) nodes.push({ type: "text", value: text.value.slice(lastIndex) })
      parent.children.splice(index, 1, ...nodes)
      // Continue after the inserted nodes so the new tag links are not visited again.
      return [SKIP, index + nodes.length]
    })

    const existing = (file.data.tags as string[] | undefined) ?? []
    file.data.tags = [...new Set([...existing, ...collected])]
  }
}
