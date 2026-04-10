export const revalidate = false

import { notFound } from "next/navigation"
import type { TocEntry } from "nuartz"
import fs from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/breadcrumb"
import { TableOfContents } from "@/components/toc"
import { Backlinks } from "@/components/backlinks"
import { MermaidRenderer } from "@/components/mermaid-renderer"
import { GraphView } from "@/components/graph-view"
import { HeadingAnchors } from "@/components/heading-anchors"
import { PopoverPreview } from "@/components/popover-preview"
import { CopyCode } from "@/components/copy-code"
import { ImageZoom } from "@/components/image-zoom"
import { GiscusComments } from "@/components/giscus"
import config from "@/nuartz.config"
import allSlugsData from "@/.generated/all-slugs.json"

const GENERATED_DIR = path.join(process.cwd(), ".generated")

async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

interface PageFrontmatter {
  title?: string
  date?: string
  description?: string
  draft?: boolean
  published?: boolean
  [key: string]: unknown
}

interface PageData {
  html: string
  frontmatter: PageFrontmatter
  toc: TocEntry[]
  tags: string[]
  links: string[]
  backlinks: { slug: string; title: string; excerpt: string }[]
  prevNext: {
    prev: { slug: string; title: string } | null
    next: { slug: string; title: string } | null
  }
  readingTime: number
  mtime: string | null
  date: string | null
  modifiedDate: string | null
}

interface FolderData {
  files: {
    slug: string
    title: string
    description: string | null
    date: string | null
    tags: string[]
  }[]
}

export async function generateStaticParams() {
  const { pages, folders, aliases } = allSlugsData
  return [
    ...pages.map((slug: string[]) => ({ slug })),
    ...folders.map((slug: string[]) => ({ slug })),
    ...aliases.map((slug: string[]) => ({ slug })),
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const slugStr = slug.join("/")
  const pageData = await readJSON<PageData>(path.join(GENERATED_DIR, "pages", `${slugStr}.json`))
  if (!pageData) return {}

  const title = pageData.frontmatter.title ?? slug[slug.length - 1]
  const description = pageData.frontmatter.description ?? ""
  const ogParams = new URLSearchParams({ title, ...(description && { description }) })
  const canonical = `${config.site.baseUrl}/${slugStr}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [`/og?${ogParams.toString()}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/og?${ogParams.toString()}`],
    },
  }
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const slugStr = slug.join("/")

  // Try loading precomputed page data
  const pageData = await readJSON<PageData>(path.join(GENERATED_DIR, "pages", `${slugStr}.json`))

  if (!pageData) {
    // Check if it's a folder
    const folderData = await readJSON<FolderData>(path.join(GENERATED_DIR, "folders", `${slugStr}.json`))
    if (folderData) {
      return (
        <div className="max-w-6xl mx-auto w-full px-6 py-10">
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{slug[slug.length - 1]}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{folderData.files.length} notes</p>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-2">
            {folderData.files.map((file) => (
              <Link key={file.slug} href={`/${file.slug}`} className="group block">
                <div className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-medium group-hover:underline underline-offset-4">{file.title}</span>
                    {file.date && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{file.date}</span>}
                  </div>
                  {file.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{file.description}</p>
                  )}
                  {file.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )
    }

    // Check aliases — scan all-slugs for alias match
    // For alias redirect, we need to check if any page has this as an alias
    // This is already handled by generateStaticParams including aliases,
    // but we need the actual page data. Try finding the canonical slug.
    const allPages = allSlugsData.pages as string[][]
    // If we got here and it's in aliases, we need to find the target
    // For now, just 404 — alias redirects should be rare and can be handled separately
    notFound()
  }

  // Filter out draft pages
  if (pageData.frontmatter.draft === true || pageData.frontmatter.published === false) {
    notFound()
  }

  const { html, frontmatter, toc, tags, backlinks, prevNext, readingTime: rt, date, modifiedDate, mtime } = pageData

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description ?? "",
    url: `${config.site.baseUrl}/${slugStr}`,
  }
  if (frontmatter.date) {
    jsonLd.datePublished = new Date(frontmatter.date).toISOString()
  }
  if (mtime) {
    jsonLd.dateModified = mtime
  }

  return (
    <div className="flex min-h-0 gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {slug.length > 1 && (
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
        )}

        <header className="mb-6">
          {frontmatter.title && (
            <h1 className="text-3xl font-bold tracking-tight">{frontmatter.title}</h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {date && (
              <span className="text-sm text-muted-foreground tabular-nums">{date}</span>
            )}
            {modifiedDate && modifiedDate !== date && (
              <span className="text-sm text-muted-foreground">Updated {modifiedDate}</span>
            )}
            {rt >= 1 && (
              <span className="text-sm text-muted-foreground">{rt} min read</span>
            )}
            {date && tags.length > 0 && (
              <span className="text-muted-foreground">·</span>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <a key={tag} href={`/tags/${tag}`}>
                    <Badge variant="secondary" className="text-xs font-normal hover:bg-muted">
                      #{tag}
                    </Badge>
                  </a>
                ))}
              </div>
            )}
          </div>
          {frontmatter.description && (
            <p className="mt-3 text-base text-muted-foreground">{frontmatter.description as string}</p>
          )}
        </header>

        <Separator className="mb-8" />

        <HeadingAnchors />
        <PopoverPreview />
        <article
          data-pagefind-body
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <MermaidRenderer />
        <CopyCode />
        <ImageZoom />

        <Backlinks backlinks={backlinks} />

        {/* Previous / Next navigation */}
        <PrevNextNav prevNext={prevNext} />

        <GiscusComments />
      </div>

      {/* Right sidebar */}
      <TableOfContents toc={toc}>
        <GraphView currentSlug={slugStr} />
      </TableOfContents>
    </div>
  )
}

function PrevNextNav({
  prevNext,
}: {
  prevNext: { prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null }
}) {
  const { prev, next } = prevNext
  if (!prev && !next) return null

  return (
    <nav className="mt-12 flex items-stretch gap-4 border-t pt-6">
      {prev ? (
        <Link
          href={`/${prev.slug}`}
          className="group flex flex-1 items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Previous</div>
            <div className="truncate text-sm font-medium group-hover:underline">
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          href={`/${next.slug}`}
          className="group flex flex-1 items-center justify-end gap-2 rounded-lg border px-4 py-3 text-right transition-colors hover:bg-muted/50"
        >
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Next</div>
            <div className="truncate text-sm font-medium group-hover:underline">
              {next.title}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  )
}
