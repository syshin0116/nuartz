export const revalidate = false

import Link from "next/link"
import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"

const CONTENT_DIR = path.join(process.cwd(), "content")

export async function generateStaticParams() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const tags = new Set(files.flatMap((f) => f.frontmatter.tags ?? []))
  return [...tags].map((tag) => ({ tag }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag } = await params
  return { title: `#${tag}` }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const tagged = files
    .filter((f) => f.frontmatter.tags?.includes(tag))
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0
      return db - da
    })

  if (!tagged.length) notFound()

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-4">
        <Link
          href="/tags"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All tags
        </Link>
      </div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">#{tag}</h1>
        <Badge variant="secondary" className="font-normal">
          {tagged.length} notes
        </Badge>
      </div>

      <Separator className="mb-6" />

      <div className="space-y-2">
        {tagged.map((file) => {
          const title = file.frontmatter.title ?? file.slug
          const summary = (file.frontmatter.summary ?? file.frontmatter.description) as string | undefined
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
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
