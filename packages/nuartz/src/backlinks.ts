import type { RenderResult } from "./types.js"

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

  for (const [slug, { result, raw }] of pages) {
    const title = result.frontmatter.title ?? slug
    const excerpt = raw.replace(/^---[\s\S]*?---/, "").trim().slice(0, 160) + "…"

    for (const target of result.links) {
      const normalizedTarget = target
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")

      const existing = index.get(normalizedTarget) ?? []
      existing.push({ slug, title, excerpt })
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
