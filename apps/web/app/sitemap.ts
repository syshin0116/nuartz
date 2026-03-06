import type { MetadataRoute } from "next"
import { getAllMarkdownFiles } from "nuartz"
import path from "node:path"
import fs from "node:fs/promises"
import config from "@/nuartz.config"

const CONTENT_DIR = path.join(process.cwd(), "content")

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = config.site.baseUrl
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const noteEntries = await Promise.all(
    files
      .filter((f) => !f.frontmatter.draft)
      .map(async (f) => {
        const filePath = path.join(CONTENT_DIR, f.slug + ".md")
        const stat = await fs.stat(filePath).catch(() => null)
        return {
          url: `${SITE_URL}/${f.slug}`,
          lastModified: stat?.mtime ?? new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }
      })
  )
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...noteEntries,
  ]
}
