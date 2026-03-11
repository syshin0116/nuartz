import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const NOTES_PER_PAGE = 10

export async function getSortedNotes() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)

  return files
    .filter((f) => f.slug !== "index")
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0
      return db - da
    })
}

export function getTotalPages(totalNotes: number): number {
  return Math.max(1, Math.ceil(totalNotes / NOTES_PER_PAGE))
}

export function paginateNotes<T>(notes: T[], page: number): T[] {
  const start = (page - 1) * NOTES_PER_PAGE
  return notes.slice(start, start + NOTES_PER_PAGE)
}
