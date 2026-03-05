import { visit } from "unist-util-visit"
import type { Root, Text, PhrasingContent } from "mdast"
import type { Plugin } from "unified"

/**
 * Matches:
 *   [[target]]              → link to target, display "target"
 *   [[target|alias]]        → link to target, display "alias"
 *   [[target#heading]]      → link to target#heading
 *   [[target#heading|alias]]
 *   ![[image.png]]          → embed (image or transclusion)
 */
const WIKILINK_REGEX = /(!?)\[\[([^\[\]|#]+?)(?:#([^\[\]|]+?))?(?:\|([^\[\]]+?))?\]\]/g

export interface WikilinkOptions {
  /** Base URL prepended to all wikilink hrefs. Default: '/' */
  baseUrl?: string
  /** Custom resolver: transforms raw target string into a URL path */
  resolve?: (target: string, heading?: string) => string
  /** Known slugs for dead-link detection. If provided, unresolved targets get class "broken". */
  knownSlugs?: Set<string>
}

export const remarkWikilink: Plugin<[WikilinkOptions?], Root> = (options = {}) => {
  const { baseUrl = "/", resolve, knownSlugs } = options

  const defaultResolve = (target: string, heading?: string): string => {
    const slug = target
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
    const hash = heading ? `#${heading.toLowerCase().replace(/\s+/g, "-")}` : ""
    return `${baseUrl}${slug}${hash}`
  }

  const resolveUrl = resolve
    ? (t: string, h?: string) => resolve(t, h)
    : defaultResolve

  return (tree, file) => {
    const outgoingLinks: string[] = []

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return

      const matches = [...node.value.matchAll(WIKILINK_REGEX)]
      if (!matches.length) return

      const nodes: PhrasingContent[] = []
      let lastIndex = 0

      for (const match of matches) {
        const [full, bang, target, heading, alias] = match
        const matchIndex = match.index!

        if (matchIndex > lastIndex) {
          nodes.push({ type: "text", value: node.value.slice(lastIndex, matchIndex) })
        }

        const href = resolveUrl(target, heading)
        const displayText = alias ?? (heading ? `${target} > ${heading}` : target)

        if (bang === "!") {
          const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4"])
          const extMatch = target.match(/\.(\w+)$/)
          const isImage = extMatch ? IMAGE_EXTS.has("." + extMatch[1].toLowerCase()) : false

          nodes.push({
            type: "image",
            url: isImage ? `/api/content/${target}` : href,
            alt: displayText,
            data: { hProperties: { className: isImage ? "embed-image" : "embed-note", "data-embed": target } },
          })
        } else {
          outgoingLinks.push(target)
          const normalized = target.toLowerCase().replace(/\s+/g, "-").replace(/[^\w/-]/g, "")
          const isKnown = !knownSlugs || [...knownSlugs].some(
            (s) => s === normalized || s.endsWith("/" + normalized)
          )
          nodes.push({
            type: "link",
            url: href,
            data: {
              hProperties: {
                className: isKnown ? "wikilink" : "wikilink broken",
                "data-target": target,
                ...(heading ? { "data-heading": heading } : {}),
              },
            },
            children: [{ type: "text", value: displayText }],
          })
        }

        lastIndex = matchIndex + full.length
      }

      if (lastIndex < node.value.length) {
        nodes.push({ type: "text", value: node.value.slice(lastIndex) })
      }

      parent.children.splice(index, 1, ...nodes)
    })

    const existing = (file.data.links as string[] | undefined) ?? []
    file.data.links = [...new Set([...existing, ...outgoingLinks])]
  }
}
