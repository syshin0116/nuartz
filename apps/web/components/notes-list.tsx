import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface NoteFile {
  slug: string
  title: string
  description: string | null
  summary?: string | null
  date: string | null
  tags: string[]
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageHref?: (page: number) => string
}

function Pagination({ currentPage, totalPages, pageHref = page => page === 1 ? "/" : `/page/${page}` }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []

  // Always show first page
  pages.push(1)

  if (currentPage > 3) pages.push("...")

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) pages.push("...")

  // Always show last page
  if (totalPages > 1) pages.push(totalPages)

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          Previous
        </Link>
      )}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={pageHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              page === currentPage
                ? "bg-foreground text-background"
                : "hover:bg-muted"
            }`}
          >
            {page}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          Next
        </Link>
      )}
    </nav>
  )
}

export function NotesList({
  notes,
  totalCount,
  currentPage,
  totalPages,
  title = "Recent Notes",
  controls,
  pageHref,
}: {
  notes: NoteFile[]
  totalCount: number
  currentPage: number
  totalPages: number
  title?: string
  controls?: React.ReactNode
  pageHref?: (page: number) => string
}) {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{totalCount} {totalCount === 1 ? "note" : "notes"}</p>
      </div>
      {controls}

      <Separator className="mb-6" />

      <div className="space-y-2">
        {notes.map((file) => {
          const summary = file.summary ?? file.description

          return (
              <article key={file.slug} className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/${file.slug}`} className="font-medium hover:underline underline-offset-4">
                    {file.title}
                  </Link>
                  {file.date && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {file.date}
                    </span>
                  )}
                </div>
                {summary && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{summary}</p>
                )}
                {file.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {file.tags.map((tag) => (
                      <Link key={tag} href={`/notes?tag=${encodeURIComponent(tag)}`}><Badge variant="secondary" className="text-xs font-normal hover:bg-accent">
                        #{tag}
                      </Badge></Link>
                    ))}
                  </div>
                )}
              </article>
          )
        })}

        {notes.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No matching notes. Try another tag or clear the filter.
          </p>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} pageHref={pageHref} />
    </div>
  )
}
