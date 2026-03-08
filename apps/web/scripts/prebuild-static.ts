import fs from "node:fs/promises"
import path from "node:path"
import { getAllMarkdownFiles, renderMarkdown } from "nuartz"
import matter from "gray-matter"

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname)
const APP_DIR = path.resolve(SCRIPT_DIR, "..")
const CONTENT_DIR = path.join(APP_DIR, "content")
const PUBLIC_DIR = path.join(APP_DIR, "public")

interface GraphNode {
  id: string
  title: string
  tags: string[]
  type: "note" | "tag"
}

interface GraphLink {
  source: string
  target: string
}

// ---------------------------------------------------------------------------
// 1. Copy media files from content/ to public/content/
// ---------------------------------------------------------------------------
async function copyMediaFiles() {
  console.log("[prebuild] Copying media files from content/ to public/content/ ...")
  let count = 0

  async function walk(dir: string) {
    let entries: import("node:fs").Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (!entry.name.endsWith(".md")) {
        const relative = path.relative(CONTENT_DIR, fullPath)
        const dest = path.join(PUBLIC_DIR, "content", relative)
        await fs.mkdir(path.dirname(dest), { recursive: true })
        await fs.copyFile(fullPath, dest)
        count++
      }
    }
  }

  await walk(CONTENT_DIR)
  console.log(`[prebuild] Copied ${count} media file(s).`)
}

// ---------------------------------------------------------------------------
// 2. Generate public/graph.json
// ---------------------------------------------------------------------------
async function generateGraphJson() {
  console.log("[prebuild] Generating graph.json ...")

  const files = await getAllMarkdownFiles(CONTENT_DIR)

  const rendered = await Promise.all(
    files.map(async (f) => ({ file: f, result: await renderMarkdown(f.raw) }))
  )

  const noteNodes: GraphNode[] = rendered.map(({ file, result }) => ({
    id: file.slug,
    title: String(file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug),
    tags: result.tags,
    type: "note",
  }))

  const linkSet = new Set<string>()
  const links: GraphLink[] = []

  const addLink = (source: string, target: string) => {
    const key = `${source}\u2192${target}`
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
      addLink(note.id, `tag/${tag}`)
    }
  }

  const graphData = { nodes: [...noteNodes, ...tagNodes], links }
  await fs.mkdir(PUBLIC_DIR, { recursive: true })
  await fs.writeFile(
    path.join(PUBLIC_DIR, "graph.json"),
    JSON.stringify(graphData),
    "utf-8"
  )

  console.log(
    `[prebuild] graph.json: ${noteNodes.length} notes, ${tagNodes.length} tags, ${links.length} links.`
  )
}

// ---------------------------------------------------------------------------
// 3. Generate public/preview-index.json
// ---------------------------------------------------------------------------
async function generatePreviewIndex() {
  console.log("[prebuild] Generating preview-index.json ...")

  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const index: Record<string, { title: string; excerpt: string }> = {}

  for (const file of files) {
    const { data, content } = matter(file.raw)
    const title = (data.title as string) ?? file.slug.split("/").pop() ?? file.slug

    const excerpt = content
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/!\[\[.*?\]\]/g, "")
      .replace(
        /\[\[([^\]|#]+?)(?:#[^\]|]*?)?(?:\|([^\]]+?))?\]\]/g,
        (_, _t, alias) => alias ?? _t
      )
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_~`>]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 350)

    index[file.slug] = { title, excerpt }
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true })
  await fs.writeFile(
    path.join(PUBLIC_DIR, "preview-index.json"),
    JSON.stringify(index),
    "utf-8"
  )

  console.log(`[prebuild] preview-index.json: ${Object.keys(index).length} entries.`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("[prebuild] Starting static prebuild ...")
  const start = Date.now()

  await copyMediaFiles()
  await generateGraphJson()
  await generatePreviewIndex()

  const elapsed = ((Date.now() - start) / 1000).toFixed(2)
  console.log(`[prebuild] Done in ${elapsed}s.`)
}

main().catch((err) => {
  console.error("[prebuild] Fatal error:", err)
  process.exit(1)
})
