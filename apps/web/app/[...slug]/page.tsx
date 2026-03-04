import { notFound } from "next/navigation"
import { renderMarkdown, getAllMarkdownFiles, buildBacklinkIndex, getBacklinks } from "nuartz"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/breadcrumb"
import { TableOfContents } from "@/components/toc"
import { Backlinks } from "@/components/backlinks"

const CONTENT_DIR = path.join(process.cwd(), "content")

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

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
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
  return {
    title: data.title ?? slug[slug.length - 1],
    description: data.description,
  }
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const raw = await getMarkdownFile(slug)
  if (!raw) notFound()

  const [result, files] = await Promise.all([
    renderMarkdown(raw),
    getAllMarkdownFiles(CONTENT_DIR),
  ])

  // Build backlink index: render all files to extract their outgoing wikilinks
  const slugStr = slug.join("/")
  const pages = new Map<string, { result: Awaited<ReturnType<typeof renderMarkdown>>; raw: string }>()
  await Promise.all(
    files.map(async (file) => {
      const r = file.slug === slugStr ? result : await renderMarkdown(file.raw)
      pages.set(file.slug, { result: r, raw: file.raw })
    })
  )
  const backlinkIndex = buildBacklinkIndex(pages)
  const backlinks = getBacklinks(backlinkIndex, slugStr)

  const date = result.frontmatter.date
    ? new Date(result.frontmatter.date).toLocaleDateString("en-CA")
    : null

  return (
    <div className="flex min-h-0 gap-8 px-6 py-8 max-w-6xl mx-auto w-full">
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

        <article
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: result.html }}
        />

        <Backlinks backlinks={backlinks} />
      </div>

      {/* Right ToC */}
      <TableOfContents toc={result.toc} />
    </div>
  )
}
