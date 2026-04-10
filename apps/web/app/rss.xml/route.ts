import { NextResponse } from "next/server"
import config from "@/nuartz.config"
import notesList from "@/.generated/notes-list.json"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? config.site.baseUrl ?? "https://nuartz.vercel.app"
const SITE_TITLE = config.site.title
const SITE_DESCRIPTION = config.site.description ?? ""

export const dynamic = "force-static"

export async function GET() {
  const items = notesList
    .filter((f) => !f.draft)
    .slice(0, 20)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items.map((f) => {
      const url = `${SITE_URL}/${f.slug}`
      const date = f.dateRaw ? new Date(f.dateRaw).toUTCString() : new Date().toUTCString()
      const desc = f.description ?? f.summary ?? ""
      return `<item>
      <title>${escapeXml(f.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${date}</pubDate>
      ${desc ? `<description>${escapeXml(desc)}</description>` : ""}
    </item>`
    }).join("\n    ")}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
