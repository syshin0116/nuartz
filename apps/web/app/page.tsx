export const revalidate = false

import { getMarkdownBySlug, renderMarkdown } from "nuartz"
import path from "node:path"
import { TableOfContents } from "@/components/toc"
import { GraphView } from "@/components/graph-view"
import { NotesList } from "@/components/notes-list"
import type { Metadata } from "next"
import config from "@/nuartz.config"
import { getSortedNotes, getTotalPages, paginateNotes } from "@/lib/notes"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const metadata: Metadata = {
  title: config.site.title,
  description: config.site.description,
  alternates: { canonical: config.site.baseUrl },
}

export default async function HomePage() {
  const homePage = config.homePage ?? "index"

  if (homePage === "index") {
    const file = await getMarkdownBySlug(CONTENT_DIR, "index")
    if (file) {
      const { html, toc } = await renderMarkdown(file.raw)
      return (
        <div className="flex min-h-0 gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
          <div className="min-w-0 flex-1">
            <article
              data-pagefind-body
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          <TableOfContents toc={toc}>
            <GraphView currentSlug="index" />
          </TableOfContents>
        </div>
      )
    }
    // fallthrough to recent notes if index.md doesn't exist
  }

  const allNotes = await getSortedNotes()
  const totalPages = getTotalPages(allNotes.length)
  const notes = paginateNotes(allNotes, 1)

  return (
    <NotesList
      notes={notes}
      totalCount={allNotes.length}
      currentPage={1}
      totalPages={totalPages}
    />
  )
}
