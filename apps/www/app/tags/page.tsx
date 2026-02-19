import Link from "next/link"
import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"
import type { Metadata } from "next"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const metadata: Metadata = { title: "Tags" }

export default async function TagsPage() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)

  const tagMap = new Map<string, number>()
  for (const file of files) {
    for (const tag of file.frontmatter.tags ?? []) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
    }
  }

  const sorted = [...tagMap.entries()].sort((a, b) => b[1] - a[1])

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">Tags</h1>
      <div className="flex flex-wrap gap-3">
        {sorted.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
          >
            <span>#{tag}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
