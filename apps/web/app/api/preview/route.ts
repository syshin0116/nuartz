import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

const CONTENT_DIR = path.join(process.cwd(), "content")

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")
  const url = request.nextUrl.searchParams.get("url")

  if (url) {
    return handleExternalPreview(url)
  }

  if (!slug) {
    return NextResponse.json({ error: "Missing slug or url" }, { status: 400 })
  }

  return handleInternalPreview(slug)
}

async function handleInternalPreview(slug: string) {
  const filePath = path.join(CONTENT_DIR, slug) + ".md"

  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = matter(raw)
    const title = data.title ?? slug.split("/").pop() ?? slug

    const excerpt = content
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/!\[\[.*?\]\]/g, "")
      .replace(/\[\[([^\]|#]+?)(?:#[^\]|]*?)?(?:\|([^\]]+?))?\]\]/g, (_, _t, alias) => alias ?? _t)
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_~`>]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 350)

    return NextResponse.json({ title, excerpt, type: "internal" })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

async function handleExternalPreview(url: string) {
  try {
    new URL(url) // validate
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; nuartz-preview/1.0)" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ error: "Fetch failed" }, { status: 502 })

    const html = await res.text()

    const title =
      html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1] ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
      url

    const description =
      html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i)?.[1] ??
      html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ??
      ""

    const image =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1] ??
      null

    return NextResponse.json({
      title: title.slice(0, 120),
      excerpt: description.slice(0, 350),
      image,
      type: "external",
    })
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 })
  }
}
