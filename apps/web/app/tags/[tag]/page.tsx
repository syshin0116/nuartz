export const revalidate = false

import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"
import tagIndex from "@/.generated/tags.json"

const typedTagIndex = tagIndex as Record<string, { slug: string; title: string; description: string | null; date: string | null }[]>

export async function generateStaticParams() {
  return Object.keys(typedTagIndex).map((tag) => ({ tag }))
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
  const tagged = typedTagIndex[tag]

  if (!tagged?.length) notFound()

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
        {tagged.map((file) => (
          <Link key={file.slug} href={`/${file.slug}`} className="group block">
            <div className="rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-4">
                <span className="font-medium group-hover:underline underline-offset-4">
                  {file.title}
                </span>
                {file.date && (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {file.date}
                  </span>
                )}
              </div>
              {file.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{file.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
