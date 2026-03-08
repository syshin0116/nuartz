export const dynamic = "force-static"

import type { MetadataRoute } from "next"
import config from "@/nuartz.config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${config.site.baseUrl}/sitemap.xml`,
  }
}
