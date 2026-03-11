import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Frontmatter } from "nuartz"

interface NoteFile {
  slug: string
  frontmatter: Frontmatter
  raw: string
}

interface PaginationProps {
  currentPage: number
  totalPages: number
}

function Pagination({ currentPage, totalPages }: PaginationProps) {
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

  function pageHref(page: number): string {
    return page === 1 ? "/" : `/page/${page}`
  }

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
}: {
  notes: NoteFile[]
  totalCount: number
  currentPage: number
  totalPages: number
}) {
  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Recent Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{totalCount} notes</p>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-2">
        {notes.map((file) => {
          const title = file.frontmatter.title ?? file.slug
          const summary = (file.frontmatter.summary ?? file.frontmatter.description) as string | undefined
          const tags: string[] = file.frontmatter.tags ?? []
          const date = file.frontmatter.date
            ? new Date(file.frontmatter.date).toLocaleDateString("en-CA")
            : null

          return (
            <Link key={file.slug} href={`/${file.slug}`} className="group block">
              <div className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-medium group-hover:underline underline-offset-4">
                    {title}
                  </span>
                  {date && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {date}
                    </span>
                  )}
                </div>
                {summary && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{summary}</p>
                )}
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}

        {notes.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No notes yet. Add markdown files to the{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">content/</code>{" "}
            directory.
          </p>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}
