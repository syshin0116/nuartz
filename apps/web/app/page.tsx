import Link from "next/link"
import { getAllMarkdownFiles, getMarkdownBySlug, renderMarkdown } from "nuartz"
import path from "node:path"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TableOfContents } from "@/components/toc"
import { GraphView } from "@/components/graph-view"
import type { Metadata } from "next"
import config from "@/nuartz.config"

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

  return <RecentNotes />
}

async function RecentNotes() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)

  const notes = files
    .filter((f) => f.slug !== "index")
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0
      return db - da
    })

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Recent Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{notes.length} notes</p>
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
    </div>
  )
}
