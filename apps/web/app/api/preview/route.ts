import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

const CONTENT_DIR = path.join(process.cwd(), "content")

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 })
  }

  const filePath = path.join(CONTENT_DIR, slug) + ".md"

  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = matter(raw)
    const title = data.title ?? slug.split("/").pop() ?? slug

    // Strip markdown syntax for a plain-text excerpt
    const excerpt = content
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/!\[\[.*?\]\]/g, "")
      .replace(/\[\[([^\]|#]+?)(?:#[^\]|]*?)?(?:\|([^\]]+?))?\]\]/g, (_, _t, alias) => alias ?? _t)
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_~`>]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 200)

    return NextResponse.json({ title, excerpt })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
