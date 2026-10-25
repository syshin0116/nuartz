import { SKIP, visit } from "unist-util-visit"
import type { Root, Text, PhrasingContent, Parent } from "mdast"
import type { Plugin } from "unified"

// Obsidian tag characters: letters and marks of any script, digits, `_`, `-`, and `/` for nesting.
const TAG_REGEX = /#([\p{L}\p{M}\p{N}_/-]+)/gu
const BOUNDARY = /\s/u
const LINK_TYPES = new Set(["link", "linkReference", "definition"])

export interface TagOptions {
  /** URL for a tag (default: `/tags/` followed by the URL-encoded tag). */
  resolveTag?: (tag: string) => string
}

export function defaultTagHref(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`
}

/**
 * Stop at an empty nesting level and require a leading letter. Obsidian also accepts a
 * leading digit, but prose such as `#2보다` (an issue number and a particle) is not a tag.
 */
function normalizeTag(raw: string): string | undefined {
  const tag = raw.split("//")[0].replace(/\/+$/, "")
  return /^\p{L}/u.test(tag) ? tag : undefined
}

interface SourceHash {
  /** Written as `\#` or a character reference, so it is text rather than a tag. */
  escaped: boolean
  /** Source character before the `#`; undefined at the start of the document. */
  before: string | undefined
}

const ESCAPABLE = /[!-/:-@[-`{-~]/
const CHARACTER_REFERENCE = /^&(?:#[xX][0-9a-fA-F]{1,6}|#\d{1,7}|[A-Za-z][A-Za-z0-9]{1,31});/
const HASH_REFERENCE = /^&(?:#0*35|#[xX]0*23|num);$/

/** Every `#` the parser turned into this text node's value, in order, read from the source. */
function sourceHashes(node: Text, source: string): SourceHash[] | undefined {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return undefined
  const hashes: SourceHash[] = []
  for (let cursor = start; cursor < end; cursor += 1) {
    const character = source[cursor]
    if (character === "\\" && ESCAPABLE.test(source[cursor + 1] ?? "")) {
      if (source[cursor + 1] === "#") hashes.push({ escaped: true, before: source[cursor - 1] })
      cursor += 1
    } else if (character === "&") {
      const reference = CHARACTER_REFERENCE.exec(source.slice(cursor, cursor + 40))?.[0]
      if (!reference) continue
      if (HASH_REFERENCE.test(reference)) hashes.push({ escaped: true, before: source[cursor - 1] })
      cursor += reference.length - 1
    } else if (character === "#") {
      hashes.push({ escaped: false, before: cursor > 0 ? source[cursor - 1] : undefined })
    }
  }
  return hashes
}

/** Character before a `#` in a node created by an earlier plugin, which has no source position. */
function renderedPrecedingCharacter(node: Text, index: number, siblings: Parent["children"], position: number): string | undefined {
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

      const hashes = sourceHashes(text, source)
      // Without a one-to-one source mapping the escape state is unknown, so leave the text alone.
      if (hashes && hashes.length !== (text.value.match(/#/g)?.length ?? 0)) return

      const nodes: PhrasingContent[] = []
      let lastIndex = 0

      for (const match of text.value.matchAll(TAG_REGEX)) {
        const position = match.index
        const hash = hashes?.[text.value.slice(0, position).match(/#/g)?.length ?? 0]
        if (hash?.escaped) continue
        const before = hash ? hash.before : renderedPrecedingCharacter(text, index, parent.children, position)
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
