import { visit } from "unist-util-visit"
import type { Root, Text, PhrasingContent, Link, Image } from "mdast"
import type { Plugin } from "unified"
import { normalizeNotePath, noteHref } from "../links.js"
import { fileExtension, mediaKind, mediaNode, parseSize, splitAltSize, youtubeEmbedUrl, youtubeNode } from "./media.js"

/**
 * Matches:
 *   [[target]]              → link to target, display "target"
 *   [[target|alias]]        → link to target, display "alias"
 *   [[target#heading]]      → link to target#heading
 *   [[target#heading|alias]]
 *   ![[image.png]]          → embed (image or transclusion)
 */
export const WIKILINK_REGEX = /(!?)\[\[([^\[\]|#]*?)(?:#([^\[\]|]+?))?(?:\|([^\[\]]+?))?\]\]/g

export interface WikilinkOptions {
  /** Base URL prepended to all wikilink hrefs. Default: '/' */
  baseUrl?: string
  /** Custom resolver: transforms raw target string into a URL path */
  resolve?: (target: string, heading?: string) => string
  /** Known slugs for dead-link detection. If provided, unresolved targets get class "broken". */
  knownSlugs?: Set<string>
  /** Directory of the current file relative to content root (e.g. 'AI'). Used to resolve relative image paths. */
  fileDir?: string
  /**
   * URL for an attachment referenced from the current note, or undefined when it does not exist.
   * Default: `/api/content/<path>`, with `path` resolved against the note's folder.
   */
  resolveAsset?: (target: string) => string | undefined
}

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

export const remarkWikilink: Plugin<[WikilinkOptions?], Root> = (options = {}) => {
  const { baseUrl = "/", resolve, knownSlugs, fileDir } = options
  const resolveAsset = options.resolveAsset ?? ((target: string) =>
    `/api/content/${fileDir && !target.startsWith(fileDir + "/") ? `${fileDir}/${target}` : target}`)

  const defaultResolve = (target: string, heading?: string): string => {
    if (!target && heading) return noteHref("index", heading).slice(1)
    return noteHref(normalizeNotePath(target), heading, baseUrl)
  }

  const resolveUrl = resolve
    ? (t: string, h?: string) => resolve(t, h)
    : defaultResolve

  const isKnownHref = (href: string, target: string, heading?: string) => {
    const hrefPath = decodeURIComponent(href.split("#")[0])
    const pathname = (hrefPath.startsWith(baseUrl) ? hrefPath.slice(baseUrl.length) : hrefPath).replace(/^\/+/, "") || "index"
    return !knownSlugs || knownSlugs.has(pathname) || (!target && Boolean(heading))
  }

  const noteLink = (href: string, target: string, heading: string | undefined, text: string, className: string[]): Link => ({
    type: "link",
    url: href,
    data: {
      hProperties: {
        className: isKnownHref(href, target, heading) ? className : [...className, "broken"],
        "data-target": target,
        ...(heading ? { "data-heading": heading } : {}),
      },
    },
    children: [{ type: "text", value: text }],
  })

  const attachmentEmbed = (target: string, label?: string): PhrasingContent => {
    const url = resolveAsset(target)
    const size = parseSize(label)
    const alt = size ? target : label ?? target
    const kind = mediaKind(target)
    if (!url) return { type: "mediaEmbed", data: { hName: "span", hProperties: { className: ["embed-missing"], title: "Attachment not found" }, hChildren: [{ type: "text", value: target }] } } as unknown as PhrasingContent
    if (kind) return mediaNode(kind, url, { alt, size, source: target })
    return { type: "link", url, data: { hProperties: { className: ["embed-file"], download: true } }, children: [{ type: "text", value: alt }] }
  }

  return (tree, file) => {
    const outgoingLinks: string[] = []

    // Standard Markdown links and images to notes or attachments: [x](note.md), ![](img.png|300).
    visit(tree, ["link", "image"], (node, index, parent) => {
      const item = node as Link | Image
      if (!parent || index === undefined || !item.url || item.url.startsWith("#") || item.url.startsWith("/")) return
      if (item.type === "image") {
        const { alt, size } = splitAltSize(item.alt ?? "")
        const youtube = youtubeEmbedUrl(item.url)
        if (youtube) { parent.children[index] = youtubeNode(youtube, { alt, size, source: item.url }); return }
        const kind = mediaKind(item.url)
        if (EXTERNAL.test(item.url)) {
          if (kind && kind !== "image") parent.children[index] = mediaNode(kind, item.url, { alt, size, source: item.url })
          else if (size) Object.assign(item, { alt, data: { ...item.data, hProperties: { ...item.data?.hProperties, ...size } } })
          return
        }
        const url = resolveAsset(safeDecode(item.url))
        if (!url) return
        parent.children[index] = mediaNode(kind ?? "image", url, { alt, size, source: item.url })
        return
      }
      if (EXTERNAL.test(item.url)) return
      const [rawPath, rawHeading] = item.url.split("#")
      const target = safeDecode(rawPath)
      const extension = fileExtension(target)
      if (extension && extension !== "md") {
        const url = resolveAsset(target)
        if (url) item.url = url
        return
      }
      const noteTarget = target.replace(/\.md$/i, "")
      const heading = rawHeading ? safeDecode(rawHeading) : undefined
      outgoingLinks.push(noteTarget)
      parent.children[index] = { ...noteLink(resolveUrl(noteTarget, heading), noteTarget, heading, "", ["internal"]), children: item.children }
    })

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

        const extension = fileExtension(target)
        if (bang === "!" && extension && extension !== "md") {
          nodes.push(attachmentEmbed(target, alias))
          lastIndex = matchIndex + full.length
          continue
        }

        const href = resolveUrl(target, heading)
        const displayText = alias ?? (heading ? `${target} > ${heading}` : target)
        outgoingLinks.push(target)
        nodes.push(noteLink(href, target, heading, displayText, ["wikilink"]))

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

function safeDecode(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}
