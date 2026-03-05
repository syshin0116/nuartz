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

  const noteNodes: GraphNode[] = files.map((f) => ({
    id: f.slug,
    title: String(f.frontmatter.title ?? f.slug.split("/").pop() ?? f.slug),
    tags: (f.frontmatter.tags as string[] | undefined) ?? [],
    type: "note",
  }))

  const links: GraphLink[] = []

  // Note-to-note links (via wikilinks)
  await Promise.all(
    files.map(async (f) => {
      const result = await renderMarkdown(f.raw)
      for (const linkTarget of result.links) {
        const normalized = linkTarget.toLowerCase().replace(/\s+/g, "-")
        const match = files.find(
          (other) => other.slug === normalized || other.slug.endsWith("/" + normalized)
        )
        if (match && match.slug !== f.slug) {
          links.push({ source: f.slug, target: match.slug })
        }
      }
    })
  )

  // Tag nodes + note-to-tag links
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
      links.push({ source: note.id, target: `tag/${tag}` })
    }
  }

  return NextResponse.json({ nodes: [...noteNodes, ...tagNodes], links })
}
