import type { RenderResult } from "./types.js"
import { createNoteResolver, normalizeNotePath } from "./links.js"

export interface BacklinkEntry {
  slug: string
  title: string
  excerpt: string
}

export type BacklinkIndex = Map<string, BacklinkEntry[]>

/**
 * Builds a backlink index from a collection of rendered pages.
 *
 * For each page, its outgoing wikilinks are read and the page is registered
 * as a backlink on every target it points to.
 *
 * @param pages - Map of slug → { result, raw content }
 * @returns Map of slug → pages that link to it
 */
export function buildBacklinkIndex(
  pages: Map<string, { result: RenderResult; raw: string }>
): BacklinkIndex {
  const index: BacklinkIndex = new Map()
  const resolve = createNoteResolver([...pages].map(([slug, { result }]) => ({ slug, frontmatter: result.frontmatter })))

  for (const [slug, { result, raw }] of pages) {
    const title = result.frontmatter.title ?? slug
    const body = raw.replace(/^---[\s\S]*?---/, "").replace(/%%[\s\S]*?%%/g, "").replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, "").replace(/`[^`]*`/g, "").trim()

    for (const target of result.links) {
      const normalizedTarget = resolve(target, slug) ?? normalizeNotePath(target)
      if (normalizedTarget === slug) continue
      const context = body.split(/\n/).find(paragraph =>
        [...paragraph.matchAll(/!?\[\[([^\]|#]*)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)]
          .some(match => match[1] === target)) ?? body
      const plain = context.replace(/!?\[\[([^\]|#]*)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, name, alias) => alias ?? name)
        .replace(/^\s*[-*+]\s+/, "").replace(/[#*_>]/g, "").replace(/\s+/g, " ").trim()
      const excerpt = plain.slice(0, 160) + (plain.length > 160 ? "…" : "")
      const existing = index.get(normalizedTarget) ?? []
      if (!existing.some(entry => entry.slug === slug)) existing.push({ slug, title, excerpt })
      index.set(normalizedTarget, existing)
    }
  }

  return index
}

/**
 * Looks up backlinks for a given slug.
 */
export function getBacklinks(
  index: BacklinkIndex,
  slug: string
): BacklinkEntry[] {
  return index.get(slug) ?? []
}
