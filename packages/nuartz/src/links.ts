import path from "node:path"
import { slug as headingSlug } from "github-slugger"
import type { Frontmatter } from "./types.js"

export function normalizeNotePath(target: string): string {
  return path.posix.normalize(target.trim().replace(/\\/g, "/").replace(/\.md$/i, ""))
    .replace(/^\/+/, "").normalize("NFC").toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_/.-]/gu, "")
}

export function noteHref(slug: string, heading?: string, baseUrl = "/"): string {
  const pathname = slug === "index" ? "" : slug.split("/").map(encodeURIComponent).join("/")
  const anchor = heading?.startsWith("^") ? heading.slice(1) : heading ? headingSlug(heading) : ""
  return `${baseUrl.replace(/\/?$/, "/")}${pathname}${anchor ? `#${encodeURIComponent(anchor)}` : ""}`
}

export function createNoteResolver(files: { slug: string; frontmatter: Frontmatter }[]) {
  const exact = new Map<string, string | undefined>()
  const names = new Map<string, string | undefined>()
  const add = (map: Map<string, string | undefined>, key: string, slug: string) => {
    if (!map.has(key)) map.set(key, slug)
    else if (map.get(key) !== slug) map.set(key, undefined)
  }
  for (const file of files) {
    add(exact, normalizeNotePath(file.slug), file.slug)
    add(names, normalizeNotePath(path.posix.basename(file.slug)), file.slug)
    for (const alias of file.frontmatter.aliases ?? []) add(names, normalizeNotePath(alias), file.slug)
  }
  return (target: string, from = ""): string | undefined => {
    if (!target) return from.replace(/\.md$/, "") || undefined
    const normalized = normalizeNotePath(target.split("#")[0])
    const relative = normalizeNotePath(path.posix.join(path.posix.dirname(from), target))
    return target.startsWith(".")
      ? exact.get(relative)
      : exact.get(normalized) ?? exact.get(relative) ?? names.get(normalized)
  }
}
