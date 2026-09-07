/**
 * Prebuild script - generates all static data at build time.
 *
 * Run with: bun scripts/prebuild.ts
 *
 * Outputs to apps/web/.generated/:
 *   file-tree.json      - sidebar tree
 *   graph.json           - knowledge graph (also copied to public/)
 *   search.json          - search index
 *   all-slugs.json       - all slugs + folder paths + alias paths
 *   pages/{slug}.json    - per-page data (html, toc, frontmatter, backlinks, etc.)
 *   folders/{slug}.json  - folder listing data
 */

import path from "node:path"
import fs from "node:fs/promises"
import {
  getAllMarkdownFiles,
  buildFileTree,
  buildSearchIndex,
  buildBacklinkIndex,
  createNoteResolver,
  normalizeNotePath,
  noteHref,
} from "nuartz"
import { renderMarkdown } from "nuartz/markdown"
import type { MarkdownFile, RenderResult, Frontmatter, TocEntry } from "nuartz"

const CONTENT_DIR = path.join(import.meta.dir, "../apps/web/content")
const OUT_DIR = path.join(import.meta.dir, "../apps/web/.generated")
const PUBLIC_DIR = path.join(import.meta.dir, "../apps/web/public")

interface PageData {
  html: string
  frontmatter: Frontmatter
  toc: TocEntry[]
  tags: string[]
  links: string[]
  backlinks: { slug: string; title: string; excerpt: string }[]
  prevNext: {
    prev: { slug: string; title: string } | null
    next: { slug: string; title: string } | null
  }
  readingTime: number
  mtime: string | null
  date: string | null
  modifiedDate: string | null
}

interface FolderData {
  files: {
    slug: string
    title: string
    description: string | null
    date: string | null
    tags: string[]
  }[]
}

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

function readingTime(raw: string): number {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "")
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function writeJSON(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data))
}

async function copyMediaFiles() {
  let count = 0
  async function walk(dir: string) {
    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true }) as any
    } catch { return }
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
  console.log(`prebuild: copied ${count} media files`)
}

async function main() {
  const start = performance.now()
  console.log("prebuild: starting...")

  // Clean output directory
  await fs.rm(OUT_DIR, { recursive: true, force: true })
  await ensureDir(OUT_DIR)

  // 1. Load all markdown files
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  console.log(`prebuild: found ${files.length} markdown files`)

  const filesBySlug = new Map(files.map(file => [file.slug, file]))
  const resolveNote = createNoteResolver(files)
  const knownSlugs = new Set(filesBySlug.keys())
  const resolveLink = (target: string, heading?: string, from?: string) =>
    noteHref(resolveNote(target, from) ?? normalizeNotePath(target), heading)

  // 3. Render all pages in parallel
  console.log("prebuild: rendering all pages...")
  const rendered = await Promise.all(
    files.map(async (file) => {
      const result = await renderMarkdown(file.raw, {
        resolveLink,
        knownSlugs,
        filePath: file.slug + ".md",
        resolveEmbed: (target, from) => {
          const source = filesBySlug.get(resolveNote(target, from) ?? "")
          return source ? { content: source.raw, filePath: source.slug + ".md" } : undefined
        },
      })
      return { file, result }
    })
  )
  const resultsBySlug = new Map(rendered.map(({ file, result }) => [file.slug, result]))

  // 4. Build backlink index (reverse link map)
  console.log("prebuild: building backlink index...")
  const backlinkIndex = buildBacklinkIndex(new Map(rendered.map(({ file, result }) =>
    [file.slug, { result, raw: file.raw }])))

  // 5. Build prev/next nav for each page (siblings in same folder)
  const filesByFolder = new Map<string, typeof files>()
  for (const file of files) {
    const parts = file.slug.split("/")
    const folder = parts.slice(0, -1).join("/")
    if (!filesByFolder.has(folder)) filesByFolder.set(folder, [])
    filesByFolder.get(folder)!.push(file)
  }
  for (const siblings of filesByFolder.values()) {
    siblings.sort((a, b) => (a.frontmatter.order ?? Infinity) - (b.frontmatter.order ?? Infinity) || (a.frontmatter.title ?? a.slug).localeCompare(b.frontmatter.title ?? b.slug))
  }

  // 6. Write all outputs in parallel
  console.log("prebuild: writing output files...")

  const writes: Promise<void>[] = []

  // file-tree.json
  const fileTree = buildFileTree(files)
  writes.push(writeJSON(path.join(OUT_DIR, "file-tree.json"), fileTree))

  // search.json
  const searchIndex = buildSearchIndex(files)
  for (const entry of searchIndex) entry.tags = resultsBySlug.get(entry.slug)?.tags ?? entry.tags
  writes.push(writeJSON(path.join(OUT_DIR, "search.json"), searchIndex))

  // graph.json
  const noteNodes: GraphNode[] = rendered.map(({ file, result }) => ({
    id: file.slug,
    title: String(file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug),
    tags: result.tags,
    type: "note" as const,
  }))

  const linkSet = new Set<string>()
  const graphLinks: GraphLink[] = []
  const addLink = (source: string, target: string) => {
    const key = `${source}→${target}`
    if (!linkSet.has(key)) {
      linkSet.add(key)
      graphLinks.push({ source, target })
    }
  }

  for (const { file, result } of rendered) {
    for (const linkTarget of result.links) {
      const target = resolveNote(linkTarget, file.slug)
      if (target && target !== file.slug) addLink(file.slug, target)
    }
  }

  const tagSet = new Set<string>()
  for (const node of noteNodes) {
    for (const tag of node.tags) tagSet.add(tag)
  }
  const tagNodes: GraphNode[] = [...tagSet].map((tag) => ({
    id: `tag/${tag}`,
    title: `#${tag}`,
    tags: [],
    type: "tag" as const,
  }))
  for (const note of noteNodes) {
    for (const tag of note.tags) {
      addLink(note.id, `tag/${tag}`)
    }
  }

  const graphData = { nodes: [...noteNodes, ...tagNodes], links: graphLinks }
  writes.push(writeJSON(path.join(OUT_DIR, "graph.json"), graphData))
  // Also write to public/ for client-side fetch
  writes.push(writeJSON(path.join(PUBLIC_DIR, "graph.json"), graphData))

  // all-slugs.json
  const allSlugs: string[][] = files.map((f) => f.slug.split("/"))
  const folderPaths = new Set<string>()
  for (const slug of allSlugs) {
    for (let i = 1; i < slug.length; i++) {
      folderPaths.add(slug.slice(0, i).join("/"))
    }
  }

  const aliasParams: string[][] = []
  for (const file of files) {
    const aliases: string[] = (file.frontmatter.aliases as string[]) ?? []
    for (const alias of aliases) {
      const cleaned = alias.startsWith("/") ? alias.slice(1) : alias
      if (cleaned) aliasParams.push(cleaned.split("/"))
    }
  }

  const slugsData = {
    pages: allSlugs,
    folders: [...folderPaths].map((p) => p.split("/")),
    aliases: aliasParams,
  }
  writes.push(writeJSON(path.join(OUT_DIR, "all-slugs.json"), slugsData))

  // tags.json - tag → list of files with that tag
  const tagIndex: Record<string, { slug: string; title: string; description: string | null; date: string | null }[]> = {}
  for (const { file, result } of rendered) {
    const fileTags = result.tags
    for (const tag of fileTags) {
      if (!tagIndex[tag]) tagIndex[tag] = []
      tagIndex[tag].push({
        slug: file.slug,
        title: (file.frontmatter.title as string) ?? file.slug.split("/").pop() ?? file.slug,
        description: (file.frontmatter.description as string) ?? (file.frontmatter.summary as string) ?? null,
        date: file.frontmatter.date
          ? new Date(file.frontmatter.date as string).toLocaleDateString("en-CA")
          : null,
      })
    }
  }
  // Sort each tag's files by date descending
  for (const entries of Object.values(tagIndex)) {
    entries.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  }
  writes.push(writeJSON(path.join(OUT_DIR, "tags.json"), tagIndex))

  // sitemap-data.json - minimal data for sitemap generation
  const sitemapData = files
    .filter((f) => !f.frontmatter.draft)
    .map((f) => ({
      slug: f.slug,
      mtime: f.mtime?.toISOString() ?? null,
    }))
  writes.push(writeJSON(path.join(OUT_DIR, "sitemap-data.json"), sitemapData))

  // notes-list.json - sorted list of all notes with metadata (for homepage, RSS, llms.txt)
  const notesList = files
    .filter((f) => f.slug !== "index")
    .map((f) => ({
      slug: f.slug,
      title: (f.frontmatter.title as string) ?? f.slug.split("/").pop() ?? f.slug,
      description: (f.frontmatter.description as string) ?? null,
      summary: (f.frontmatter.summary as string) ?? null,
      date: f.frontmatter.date ? new Date(f.frontmatter.date as string).toLocaleDateString("en-CA") : null,
      dateRaw: f.frontmatter.date ? new Date(f.frontmatter.date as string).toISOString() : null,
      tags: resultsBySlug.get(f.slug)?.tags ?? [],
      draft: f.frontmatter.draft === true,
    }))
    .sort((a, b) => (b.dateRaw ?? "").localeCompare(a.dateRaw ?? ""))
  writes.push(writeJSON(path.join(OUT_DIR, "notes-list.json"), notesList))

  // preview-index.json - for popover previews (client-side)
  const previewIndex: Record<string, { title: string; excerpt: string }> = {}
  for (const file of files) {
    const title = (file.frontmatter.title as string) ?? file.slug.split("/").pop() ?? file.slug
    const excerpt = file.raw
      .replace(/^---[\s\S]*?---\n?/, "")
      .replace(/!\[\[.*?\]\]/g, "")
      .replace(
        /\[\[([^\]|#]+?)(?:#[^\]|]*?)?(?:\|([^\]]+?))?\]\]/g,
        (_: string, _t: string, alias: string) => alias ?? _t
      )
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_~`>]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 350)
    previewIndex[file.slug] = { title, excerpt }
  }
  writes.push(writeJSON(path.join(PUBLIC_DIR, "preview-index.json"), previewIndex))

  // Per-page JSON files
  for (const { file, result } of rendered) {
    const slugStr = file.slug
    const parts = slugStr.split("/")
    const folder = parts.slice(0, -1).join("/")
    const siblings = filesByFolder.get(folder) ?? []
    const idx = siblings.findIndex((f) => f.slug === slugStr)

    const prev = idx > 0 ? siblings[idx - 1] : null
    const next = idx < siblings.length - 1 ? siblings[idx + 1] : null

    const date = result.frontmatter.date
      ? new Date(result.frontmatter.date as string).toLocaleDateString("en-CA")
      : null

    const modifiedDate = file.mtime
      ? file.mtime.toLocaleDateString("en-CA")
      : null

    const pageData: PageData = {
      html: result.html,
      frontmatter: result.frontmatter,
      toc: result.toc,
      tags: result.tags,
      links: result.links,
      backlinks: backlinkIndex.get(slugStr) ?? [],
      prevNext: {
        prev: prev
          ? { slug: prev.slug, title: (prev.frontmatter.title as string) ?? prev.slug.split("/").pop()! }
          : null,
        next: next
          ? { slug: next.slug, title: (next.frontmatter.title as string) ?? next.slug.split("/").pop()! }
          : null,
      },
      readingTime: readingTime(file.raw),
      mtime: file.mtime?.toISOString() ?? null,
      date,
      modifiedDate,
    }

    writes.push(writeJSON(path.join(OUT_DIR, "pages", `${slugStr}.json`), pageData))
  }

  // Folder listing JSON files
  for (const folderPath of folderPaths) {
    const prefix = folderPath + "/"
    const folderFiles = files
      .filter((f) => f.slug.startsWith(prefix))
      .sort((a, b) => {
        const da = a.frontmatter.date ? new Date(a.frontmatter.date as string).getTime() : 0
        const db = b.frontmatter.date ? new Date(b.frontmatter.date as string).getTime() : 0
        return db - da
      })

    const folderData: FolderData = {
      files: folderFiles.map((f) => ({
        slug: f.slug,
        title: (f.frontmatter.title as string) ?? f.slug.split("/").pop() ?? f.slug,
        description: (f.frontmatter.description as string) ?? null,
        date: f.frontmatter.date
          ? new Date(f.frontmatter.date as string).toLocaleDateString("en-CA")
          : null,
        tags: resultsBySlug.get(f.slug)?.tags ?? [],
      })),
    }

    writes.push(writeJSON(path.join(OUT_DIR, "folders", `${folderPath}.json`), folderData))
  }

  await Promise.all(writes)

  // Copy media files (images, etc.) from content/ to public/content/
  await copyMediaFiles()

  const elapsed = ((performance.now() - start) / 1000).toFixed(2)
  console.log(`prebuild: done in ${elapsed}s - ${files.length} pages, ${graphLinks.length} links, ${backlinkIndex.size} pages with backlinks`)
}

main().catch((err) => {
  console.error("prebuild failed:", err)
  process.exit(1)
})
