export const revalidate = false

import { notFound, redirect } from "next/navigation"
import { NotesList } from "@/components/notes-list"
import { getSortedNotes, getTotalPages, paginateNotes } from "@/lib/notes"
import type { Metadata } from "next"
import config from "@/nuartz.config"

export async function generateStaticParams() {
  const allNotes = await getSortedNotes()
  const totalPages = getTotalPages(allNotes.length)

  // Generate pages 2..N (page 1 is handled by the root page.tsx)
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const { page } = await params
  const pageNum = Number(page)

  return {
    title: `Page ${pageNum} - ${config.site.title}`,
    description: config.site.description,
    alternates: { canonical: `${config.site.baseUrl}/page/${pageNum}` },
  }
}

export default async function PaginatedPage({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page } = await params
  const pageNum = Number(page)

  // Redirect page 1 to root
  if (pageNum === 1) {
    redirect("/")
  }

  if (!Number.isInteger(pageNum) || pageNum < 1) {
    notFound()
  }

  const allNotes = await getSortedNotes()
  const totalPages = getTotalPages(allNotes.length)

  if (pageNum > totalPages) {
    notFound()
  }

  const notes = paginateNotes(allNotes, pageNum)

  return (
    <NotesList
      notes={notes}
      totalCount={allNotes.length}
      currentPage={pageNum}
      totalPages={totalPages}
    />
  )
}
