import { notFound } from "next/navigation"
import { renderMarkdown } from "nuartz"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Metadata } from "next"

const CONTENT_DIR = path.join(process.cwd(), "content")

async function getMarkdownFile(slug: string[]) {
  const filePath = path.join(CONTENT_DIR, ...slug) + ".md"
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return raw
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

  const result = await renderMarkdown(raw)

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      {result.frontmatter.title && (
        <h1 className="mb-2 text-3xl font-bold">{result.frontmatter.title}</h1>
      )}
      {result.frontmatter.description && (
        <p className="mb-6 text-muted-foreground">{result.frontmatter.description}</p>
      )}
      {result.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {result.tags.map((tag) => (
            <a
              key={tag}
              href={`/tags/${tag}`}
              className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted transition-colors"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: result.html }}
      />
    </article>
  )
}
