import Link from "next/link"
import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"
import { notFound } from "next/navigation"
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
  const tagged = files.filter((f) => f.frontmatter.tags?.includes(tag))

  if (!tagged.length) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/tags" className="text-sm text-muted-foreground hover:text-foreground">
          ← All tags
        </Link>
      </div>
      <h1 className="mb-8 text-3xl font-bold">#{tag}</h1>
      <ul className="space-y-4">
        {tagged.map((file) => (
          <li key={file.slug}>
            <Link
              href={`/${file.slug}`}
              className="group block rounded-lg border p-4 hover:bg-muted transition-colors"
            >
              <div className="font-medium group-hover:underline">
                {file.frontmatter.title ?? file.slug}
              </div>
              {file.frontmatter.description && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {file.frontmatter.description}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
