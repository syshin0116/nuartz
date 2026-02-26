import type { MarkdownFile } from "./fs.js"

export interface SearchEntry {
  slug: string
  title: string
  content: string
  tags: string[]
  description?: string
}

/**
 * Builds a flat search index from a list of MarkdownFile entries.
 * Strip HTML and frontmatter for plain-text indexing.
 */
export function buildSearchIndex(files: MarkdownFile[]): SearchEntry[] {
  return files
    .filter((f) => !f.frontmatter.draft)
    .map((file) => {
      // Strip frontmatter block
      const body = file.raw.replace(/^---[\s\S]*?---\n?/, "")
      // Strip markdown syntax (rough pass)
      const text = body
        .replace(/```[\s\S]*?```/g, "")   // code blocks
        .replace(/`[^`]+`/g, "")          // inline code
        .replace(/!\[.*?\]\(.*?\)/g, "")  // images
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
        .replace(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g, "$1") // wikilinks → text
        .replace(/#{1,6}\s/g, "")         // headings
        .replace(/[*_~]/g, "")            // emphasis
        .replace(/>\s/g, "")              // blockquotes
        .replace(/\s+/g, " ")
        .trim()

      return {
        slug: file.slug,
        title: file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug,
        content: text,
        tags: file.frontmatter.tags ?? [],
        description: file.frontmatter.description,
      }
    })
}
