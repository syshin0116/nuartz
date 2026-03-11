export const revalidate = false

import { notFound, redirect } from "next/navigation"
import { renderMarkdown, getAllMarkdownFiles } from "nuartz"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Metadata } from "next"
import Link from "next/link"
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
import { GiscusComments } from "@/components/giscus"
import config from "@/nuartz.config"

const CONTENT_DIR = path.join(process.cwd(), "content")

function readingTime(raw: string): number {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "")
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

async function getMarkdownFile(slug: string[]) {
  const filePath = path.join(CONTENT_DIR, ...slug) + ".md"
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch {
    return null
  }
}

async function getAllSlugs(): Promise<string[][]> {
  async function walk(dir: string, base: string[] = []): Promise<string[][]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const results: string[][] = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        results.push(...(await walk(path.join(dir, entry.name), [...base, entry.name])))
      } else if (entry.name.endsWith(".md")) {
        results.push([...base, entry.name.replace(/\.md$/, "")])
      }
    }
    return results
  }
  try {
    return await walk(CONTENT_DIR)
  } catch {
    return []
  }
}

async function getFolderFiles(slug: string[]) {
  const folderPath = path.join(CONTENT_DIR, ...slug)
  try {
    const stat = await fs.stat(folderPath)
    if (!stat.isDirectory()) return null
  } catch {
    return null
  }
  const allFiles = await getAllMarkdownFiles(CONTENT_DIR)
  const prefix = slug.join("/") + "/"
  return allFiles
    .filter((f) => f.slug.startsWith(prefix))
    .sort((a, b) => {
      const da = a.frontmatter.date ? new Date(a.frontmatter.date).getTime() : 0
      const db = b.frontmatter.date ? new Date(b.frontmatter.date).getTime() : 0
      return db - da
    })
}

async function findByAlias(slug: string[]): Promise<string | null> {
  const aliasSlug = slug.join("/")
  const allFiles = await getAllMarkdownFiles(CONTENT_DIR)
  for (const file of allFiles) {
    const aliases: string[] = file.frontmatter.aliases ?? []
    if (aliases.some((a) => a === aliasSlug || a === `/${aliasSlug}`)) {
      return file.slug
    }
  }
  return null
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  // Also add folder paths
  const folderPaths = new Set<string>()
  for (const slug of slugs) {
    for (let i = 1; i < slug.length; i++) {
      folderPaths.add(slug.slice(0, i).join("/"))
    }
  }
  const folderParams = [...folderPaths].map((p) => ({ slug: p.split("/") }))

  // Also add alias paths
  let aliasParams: { slug: string[] }[] = []
  try {
    const allFiles = await getAllMarkdownFiles(CONTENT_DIR)
    for (const file of allFiles) {
      const aliases: string[] = file.frontmatter.aliases ?? []
      for (const alias of aliases) {
        const cleaned = alias.startsWith("/") ? alias.slice(1) : alias
        if (cleaned) aliasParams.push({ slug: cleaned.split("/") })
      }
    }
  } catch {
    // ignore
  }

  return [...slugs.map((slug) => ({ slug })), ...folderParams, ...aliasParams]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const raw = await getMarkdownFile(slug)
  if (!raw) return {}
  const { data } = matter(raw)
  const title = data.title ?? slug[slug.length - 1]
  const description = data.description ?? ""
  const ogParams = new URLSearchParams({ title, ...(description && { description }) })
  const canonical = `${config.site.baseUrl}/${slug.join("/")}`
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
  const raw = await getMarkdownFile(slug)

  // Check if it's a folder
  if (!raw) {
    const folderFiles = await getFolderFiles(slug)
    if (folderFiles) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-6">
            <Breadcrumb slug={slug} />
          </div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">{slug[slug.length - 1]}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{folderFiles.length} notes</p>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-2">
            {folderFiles.map((file) => {
              const title = file.frontmatter.title ?? file.slug.split("/").pop()
              const date = file.frontmatter.date
                ? new Date(file.frontmatter.date).toLocaleDateString("en-CA")
                : null
              const tags: string[] = file.frontmatter.tags ?? []
              return (
                <Link key={file.slug} href={`/${file.slug}`} className="group block">
                  <div className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-medium group-hover:underline underline-offset-4">{title}</span>
                      {date && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{date}</span>}
                    </div>
                    {file.frontmatter.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{file.frontmatter.description}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs font-normal">#{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )
    }

    // Check aliases
    const canonicalSlug = await findByAlias(slug)
    if (canonicalSlug) {
      redirect(`/${canonicalSlug}`)
    }
    notFound()
  }

  // Filter out draft pages
  const { data: rawFrontmatter } = matter(raw)
  if (rawFrontmatter.draft === true || rawFrontmatter.published === false) {
    notFound()
  }

  const files = await getAllMarkdownFiles(CONTENT_DIR)

  // Build filename → full slug lookup for Obsidian-style wikilink resolution
  const slugByName = new Map<string, string>()
  for (const f of files) {
    const name = f.slug.split("/").pop()!.toLowerCase().replace(/\s+/g, "-")
    if (!slugByName.has(name)) slugByName.set(name, f.slug)
  }
  const resolveLink = (target: string): string => {
    const normalized = target.toLowerCase().replace(/\s+/g, "-").replace(/[^\w/-]/g, "")
    const exact = files.find((f) => f.slug === normalized)
    if (exact) return `/${exact.slug}`
    const byName = slugByName.get(normalized.split("/").pop()!)
    if (byName) return `/${byName}`
    return `/${normalized}`
  }

  const knownSlugs = new Set(files.map((f) => f.slug))
  const result = await renderMarkdown(raw, { resolveLink, knownSlugs })

  // Build backlinks via regex pattern matching (avoids rendering all files)
  const slugStr = slug.join("/")
  const wikilinkPattern = /\[\[([^\[\]|#]+?)(?:#[^\[\]|]*?)?(?:\|[^\[\]]*?)?\]\]/g
  const backlinks: { slug: string; title: string; excerpt: string }[] = []
  const currentLastPart = slugStr.split("/").pop()!
  for (const file of files) {
    if (file.slug === slugStr) continue
    // Strip frontmatter and code blocks before matching
    const body = file.raw
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
    let found = false
    for (const match of body.matchAll(wikilinkPattern)) {
      if (match[0].startsWith("!")) continue // skip embeds
      const target = match[1].trim()
      const normalized = target.toLowerCase().replace(/\s+/g, "-").replace(/[^\w/-]/g, "")
      if (normalized === slugStr || normalized === currentLastPart || normalized.endsWith("/" + currentLastPart)) {
        const excerpt = (file.frontmatter.description as string) ??
          body.trim().split("\n")[0]?.slice(0, 150) ?? ""
        backlinks.push({
          slug: file.slug,
          title: file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug,
          excerpt,
        })
        found = true
        break
      }
    }
  }

  const date = result.frontmatter.date
    ? new Date(result.frontmatter.date).toLocaleDateString("en-CA")
    : null

  // Get file modification date
  const filePath = path.join(CONTENT_DIR, ...slug) + ".md"
  const fileStat = await fs.stat(filePath)
  const modifiedDate = fileStat.mtime.toLocaleDateString("en-CA")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: result.frontmatter.title,
    description: result.frontmatter.description ?? "",
    url: `${config.site.baseUrl}/${slug.join("/")}`,
    ...(result.frontmatter.date && {
      datePublished: new Date(result.frontmatter.date as string).toISOString(),
    }),
    dateModified: fileStat.mtime.toISOString(),
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
          {result.frontmatter.title && (
            <h1 className="text-3xl font-bold tracking-tight">{result.frontmatter.title}</h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {date && (
              <span className="text-sm text-muted-foreground tabular-nums">{date}</span>
            )}
            {modifiedDate && modifiedDate !== date && (
              <span className="text-sm text-muted-foreground">Updated {modifiedDate}</span>
            )}
            {readingTime(raw) >= 1 && (
              <span className="text-sm text-muted-foreground">{readingTime(raw)} min read</span>
            )}
            {date && result.tags.length > 0 && (
              <span className="text-muted-foreground">·</span>
            )}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <a key={tag} href={`/tags/${tag}`}>
                    <Badge variant="secondary" className="text-xs font-normal hover:bg-muted">
                      #{tag}
                    </Badge>
                  </a>
                ))}
              </div>
            )}
          </div>
          {result.frontmatter.description && (
            <p className="mt-3 text-base text-muted-foreground">{result.frontmatter.description}</p>
          )}
        </header>

        <Separator className="mb-8" />

        <HeadingAnchors />
        <PopoverPreview />
        <article
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: result.html }}
        />
        <MermaidRenderer />
        <CopyCode />

        <Backlinks backlinks={backlinks} />
        <GiscusComments />
      </div>

      {/* Right sidebar */}
      <TableOfContents toc={result.toc}>
        <GraphView currentSlug={slugStr} />
      </TableOfContents>
    </div>
  )
}
