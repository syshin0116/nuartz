import type { Frontmatter } from "./types.js"

/** Obsidian accepts a YAML list, a single value, or a comma-separated string. */
function toList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [value]
  return items
    .filter(item => typeof item === "string" || typeof item === "number")
    .map(item => String(item).trim())
    .filter(Boolean)
}

const firstDefined = (data: Record<string, unknown>, keys: string[]) =>
  keys.map(key => data[key]).find(value => value !== undefined && value !== null)

const isTrue = (value: unknown) => value === true || value === "true"
const isFalse = (value: unknown) => value === false || value === "false"

/**
 * Canonicalises the frontmatter keys nuartz reads:
 * `tags`/`tag` and `aliases`/`alias` become deduplicated string arrays
 * (tags lose a leading `#`), and `draft`/`published` accept "true"/"false".
 */
export function normalizeFrontmatter(data: Record<string, unknown>): Frontmatter {
  const result: Record<string, unknown> = { ...data }
  const tags = toList(firstDefined(data, ["tags", "tag"]))
  if (tags) result.tags = [...new Set(tags.map(tag => tag.replace(/^#/, "")).filter(Boolean))]
  const aliases = toList(firstDefined(data, ["aliases", "alias"]))
  if (aliases) result.aliases = [...new Set(aliases)]
  const cssclasses = toList(firstDefined(data, ["cssclasses", "cssclass"]))
  if (cssclasses) result.cssclasses = cssclasses
  if (data.draft !== undefined) result.draft = isTrue(data.draft)
  if (data.published !== undefined) result.published = !isFalse(data.published)
  return result as Frontmatter
}

/** True when frontmatter marks a note as unpublished (`draft: true` or `published: false`). */
export function isUnpublished(frontmatter: Frontmatter): boolean {
  return frontmatter.draft === true || frontmatter.published === false
}
