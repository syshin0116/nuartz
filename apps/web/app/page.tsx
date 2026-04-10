export const revalidate = false

import fs from "node:fs/promises"
import path from "node:path"
import { TableOfContents } from "@/components/toc"
import { GraphView } from "@/components/graph-view"
import { NotesList } from "@/components/notes-list"
import type { Metadata } from "next"
import config from "@/nuartz.config"
import { getSortedNotes, getTotalPages, paginateNotes } from "@/lib/notes"

const GENERATED_DIR = path.join(process.cwd(), ".generated")

export const metadata: Metadata = {
  title: config.site.title,
  description: config.site.description,
  alternates: { canonical: config.site.baseUrl },
}

export default async function HomePage() {
  const homePage = config.homePage ?? "index"

  if (homePage === "index") {
    try {
      const raw = await fs.readFile(path.join(GENERATED_DIR, "pages", "index.json"), "utf-8")
      const pageData = JSON.parse(raw) as { html: string; toc: any[] }
      return (
        <div className="flex min-h-0 gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
          <div className="min-w-0 flex-1">
            <article
              data-pagefind-body
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: pageData.html }}
            />
          </div>
          <TableOfContents toc={pageData.toc}>
            <GraphView currentSlug="index" />
          </TableOfContents>
        </div>
      )
    } catch {
      // fallthrough to recent notes if index page doesn't exist
    }
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
