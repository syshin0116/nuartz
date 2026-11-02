import { NextRequest, NextResponse } from "next/server"
import previewIndex from "@/public/preview-index.json"
import { fetchPublicText } from "@/lib/public-url"

const previews: Record<string, { title: string; excerpt: string }> = previewIndex

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")
  const url = request.nextUrl.searchParams.get("url")

  if (url) return handleExternalPreview(url)
  if (!slug) return NextResponse.json({ error: "Missing slug or url" }, { status: 400 })
  return handleInternalPreview(slug)
}

// Only published notes are in the index, so drafts and files outside the
// content directory can never be read through this route.
function handleInternalPreview(slug: string) {
  const key = decodeURIComponent(slug.split("#")[0]).replace(/^\/+|\/+$/g, "") || "index"
  const preview = previews[key]
  if (!preview) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ...preview, type: "internal" })
}

async function handleExternalPreview(url: string) {
  let html: string | null
  try {
    html = await fetchPublicText(url)
  } catch {
    html = null
  }
  if (html === null) return NextResponse.json({ error: "Fetch failed" }, { status: 502 })

  const meta = (property: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]+content="([^"]+)"`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="${property}"`, "i"))?.[1]

  const title = meta("og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? url
  const description = meta("og:description") ?? meta("description") ?? ""
  const image = meta("og:image") ?? null

  return NextResponse.json(
    { title: title.slice(0, 120), excerpt: description.slice(0, 350), image, type: "external" },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  )
}
