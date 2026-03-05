import type { MetadataRoute } from "next"
import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuartz.vercel.app"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const noteEntries: MetadataRoute.Sitemap = files
    .filter((f) => !f.frontmatter.draft)
    .map((f) => ({
      url: `${SITE_URL}/${f.slug}`,
      lastModified: f.frontmatter.date ? new Date(f.frontmatter.date as string) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...noteEntries,
  ]
}
