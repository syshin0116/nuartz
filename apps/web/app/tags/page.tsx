export const revalidate = false

import Link from "next/link"
import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sorted.length} tags</p>
      </div>

      <Separator className="mb-6" />

      <div className="flex flex-wrap gap-2">
        {sorted.map(([tag, count]) => (
          <Link key={tag} href={`/tags/${tag}`}>
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 text-sm font-normal hover:bg-muted transition-colors"
            >
              #{tag}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                {count}
              </span>
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
