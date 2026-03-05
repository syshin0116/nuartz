import { getAllMarkdownFiles, renderMarkdown } from "nuartz"
import path from "node:path"
import { NextResponse } from "next/server"

const CONTENT_DIR = path.join(process.cwd(), "content")

export const dynamic = "force-dynamic"

export interface GraphNode {
  id: string
  title: string
  tags: string[]
  type: "note" | "tag"
}

export interface GraphLink {
  source: string
  target: string
}

export async function GET() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)

  // Render all files to extract links and tags (includes inline #tag syntax)
  const rendered = await Promise.all(
    files.map(async (f) => ({ file: f, result: await renderMarkdown(f.raw) }))
  )

  const noteNodes: GraphNode[] = rendered.map(({ file, result }) => ({
    id: file.slug,
    title: String(file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug),
    tags: result.tags, // includes both frontmatter tags AND inline #tag syntax
    type: "note",
  }))

  const linkSet = new Set<string>()
  const links: GraphLink[] = []

  const addLink = (source: string, target: string) => {
    const key = `${source}→${target}`
    if (!linkSet.has(key)) {
      linkSet.add(key)
      links.push({ source, target })
    }
  }

  // Note-to-note links (via wikilinks)
  for (const { file, result } of rendered) {
    for (const linkTarget of result.links) {
      const normalized = linkTarget.toLowerCase().replace(/\s+/g, "-")
      const match = files.find(
        (other) => other.slug === normalized || other.slug.endsWith("/" + normalized)
      )
      if (match && match.slug !== file.slug) {
        addLink(file.slug, match.slug)
      }
    }
  }

  // Tag nodes + note-to-tag links (uses result.tags for full coverage)
  const tagSet = new Set<string>()
  for (const node of noteNodes) {
    for (const tag of node.tags) tagSet.add(tag)
  }

  const tagNodes: GraphNode[] = [...tagSet].map((tag) => ({
    id: `tag/${tag}`,
    title: `#${tag}`,
    tags: [],
    type: "tag",
  }))

  for (const note of noteNodes) {
    for (const tag of note.tags) {
      addLink(note.id, `tag/${tag}`)
    }
  }

  return NextResponse.json({ nodes: [...noteNodes, ...tagNodes], links })
}
