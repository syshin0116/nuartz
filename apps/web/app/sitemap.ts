export const dynamic = "force-static"

import type { MetadataRoute } from "next"
import config from "@/nuartz.config"
import sitemapData from "@/.generated/sitemap-data.json"

const typedData = sitemapData as { slug: string; mtime: string | null }[]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = config.site.baseUrl ?? "https://nuartz.vercel.app"

  const noteEntries = typedData.map((f) => ({
    url: `${SITE_URL}/${f.slug}`,
    lastModified: f.mtime ? new Date(f.mtime) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...noteEntries,
  ]
}
