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
import type { Dirent } from "node:fs"
import {
  getAllMarkdownFiles,
  buildFileTree,
  buildSearchIndex,
  buildBacklinkIndex,
  createNoteResolver,
  normalizeNotePath,
  noteHref,
  createAssetResolver,
  isHiddenContentPath,
  defaultTagHref,
  toStandardMarkdown,
} from "nuartz"
import { renderMarkdown } from "nuartz/markdown"
import type { Frontmatter, MarkdownFile, TocEntry } from "nuartz"
import config from "../apps/web/nuartz.config"
import * as pagefind from "pagefind"

const CONTENT_DIR = path.resolve(config.contentDir)
const OUT_DIR = path.join(import.meta.dir, "../apps/web/.generated")
const PUBLIC_DIR = path.join(import.meta.dir, "../apps/web/public")
// Sub-path the site is served from, e.g. "/my-repo" on GitHub Pages. Must match next.config.ts.
const BASE_PATH = (process.env.NUARTZ_BASE_PATH ?? "").replace(/\/+$/, "")

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
  /** Meta description: frontmatter, else summary, else the generated excerpt. */
  description: string | null
  mtime: string | null
  date: string | null
  modifiedDate: string | null
}

interface FolderData {
  /** The folder's own index.md, shown above the listing. */
  index: { title: string; html: string } | null
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

// CJK text has no spaces between words, so it is counted by character.
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu

function readingTime(raw: string): number {
  const body = raw.replace(/^---[\s\S]*?---\n?/, "")
  const cjkChars = body.match(CJK)?.length ?? 0
  const words = body.replace(CJK, " ").trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200 + cjkChars / 500))
}

const noteTitle = (file: MarkdownFile) => String(file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug)

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined)

function toDate(value: unknown): Date | undefined {
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const isoDay = (date: Date | undefined) => date?.toISOString().slice(0, 10) ?? null

type GitDates = Map<string, { created: Date; modified: Date }>

/**
 * First and last commit time per content file, so dates survive fresh clones
 * where every file has the same mtime. Empty when git or history is missing
 * (shallow CI clones only see their own commits).
 */
async function readGitDates(dir: string): Promise<GitDates> {
  const dates: GitDates = new Map()
  try {
    const proc = Bun.spawn(["git", "-c", "core.quotePath=false", "log", "--format=%x00%ct", "--name-only", "--relative", "--no-renames", "--", "."], { cwd: dir, stdout: "pipe", stderr: "ignore" })
    const output = await new Response(proc.stdout).text()
    if (await proc.exited !== 0) return dates
    for (const commit of output.split("\0").slice(1)) {
      const [time, ...paths] = commit.trim().split("\n")
      const at = new Date(Number(time) * 1000)
      for (const file of paths.filter(Boolean)) {
        const known = dates.get(file)
        // Newest commits come first.
        if (known) known.created = at
        else dates.set(file, { created: at, modified: at })
      }
    }
  } catch { /* no git */ }
  return dates
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function writeJSON(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data))
}

/** Attachment paths (posix, relative to the content dir), excluding notes and hidden paths. */
async function listAssetFiles(): Promise<string[]> {
  const assets: string[] = []
  async function walk(dir: string) {
    let entries: Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch { return }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (isHiddenContentPath(entry.name)) continue
      if (entry.isDirectory()) await walk(fullPath)
      else if (!entry.name.endsWith(".md")) assets.push(path.relative(CONTENT_DIR, fullPath).split(path.sep).join("/"))
    }
  }
  await walk(CONTENT_DIR)
  return assets
}

async function copyAssetFiles(assets: string[]) {
  // Start clean so deleted or newly hidden attachments are not left behind.
  const target = path.join(PUBLIC_DIR, "content")
  await fs.rm(target, { recursive: true, force: true })
  for (const asset of assets) {
    const dest = path.join(target, asset)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.copyFile(path.join(CONTENT_DIR, asset), dest)
  }
  console.log(`prebuild: copied ${assets.length} media files`)
}

/**
 * Builds the Pagefind index from rendered notes instead of Next's output, whose
 * HTML location differs between `next build`, Vercel, and static export.
 */
async function writeSearchIndex(pages: { slug: string; title: string; html: string }[]) {
  const { index, errors } = await pagefind.createIndex({ forceLanguage: config.site.locale ?? "en" })
  if (!index) throw new AggregateError(errors, "Pagefind index failed")
  for (const page of pages) {
    const url = page.slug === "index" ? "/" : `/${page.slug.split("/").map(encodeURIComponent).join("/")}`
    const escapedTitle = page.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    await index.addHTMLFile({ url, content: `<html><body><main data-pagefind-body><h1>${escapedTitle}</h1>${page.html}</main></body></html>` })
  }
  const outputPath = path.join(PUBLIC_DIR, "pagefind")
  await fs.rm(outputPath, { recursive: true, force: true })
  await index.writeFiles({ outputPath })
  await pagefind.close()
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
  // These URLs end up inside note HTML, which next/link never sees, so they carry BASE_PATH.
  const resolveLink = (target: string, heading?: string, from?: string) =>
    noteHref(resolveNote(target, from) ?? normalizeNotePath(target), heading, `${BASE_PATH}/`)
  const assets = await listAssetFiles()
  const findAsset = createAssetResolver(assets)
  const resolveAsset = (target: string, from?: string) => {
    const assetPath = findAsset(target, from)
    return assetPath && `${BASE_PATH}/content/${assetPath.split("/").map(encodeURIComponent).join("/")}`
  }
  const resolveTag = (tag: string) => `${BASE_PATH}${defaultTagHref(tag)}`

  // 3. Render all pages in parallel
  console.log("prebuild: rendering all pages...")
  const rendered = await Promise.all(
    files.map(async (file) => {
      const result = await renderMarkdown(file.raw, {
        ...config.markdown,
        features: config.features,
        resolveLink,
        resolveAsset,
        resolveTag,
        baseUrl: `${BASE_PATH}/`,
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

  // Titles, dates and descriptions shared by every listing below.
  const gitDates = await readGitDates(CONTENT_DIR)
  const noteMeta = new Map(rendered.map(({ file, result }) => {
    const fm = file.frontmatter
    const git = gitDates.get(`${file.slug}.md`)
    const excerpt = result.excerpt || null
    return [file.slug, {
      title: noteTitle(file),
      created: toDate(fm.date) ?? toDate(fm.created) ?? git?.created,
      modified: toDate(fm.modified ?? fm.updated ?? fm.lastmod) ?? git?.modified ?? file.mtime,
      // Meta tags prefer `description`; cards prefer the shorter `summary`.
      description: text(fm.description) ?? text(fm.summary) ?? excerpt,
      summary: text(fm.summary) ?? text(fm.description) ?? excerpt,
    }]
  }))
  const metaOf = (slug: string) => noteMeta.get(slug)!

  // 4. Build backlink index (reverse link map)
  console.log("prebuild: building backlink index...")
  const backlinkIndex = config.features.backlinks
    ? buildBacklinkIndex(new Map(rendered.map(({ file, result }) => [file.slug, { result, raw: file.raw }])))
    : new Map()

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
  const searchIndex = config.features.search ? buildSearchIndex(files) : []
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

  // alias path -> target slug. Aliases never shadow a real page or folder, and
  // an alias claimed by two notes is dropped rather than guessed.
  const taken = new Set([...files.map(f => f.slug), ...folderPaths])
  const aliasTargets = new Map<string, string | null>()
  for (const file of files) {
    const permalink = typeof file.frontmatter.permalink === "string" ? [file.frontmatter.permalink] : []
    for (const alias of [...(file.frontmatter.aliases ?? []), ...permalink]) {
      const aliasPath = normalizeNotePath(alias).replace(/\/+$/, "")
      if (!aliasPath || aliasPath === file.slug || taken.has(aliasPath)) continue
      const existing = aliasTargets.get(aliasPath)
      if (existing !== undefined && existing !== file.slug) {
        console.warn(`prebuild: alias "${alias}" is used by more than one note; skipping it`)
        aliasTargets.set(aliasPath, null)
      } else if (existing === undefined) aliasTargets.set(aliasPath, file.slug)
    }
  }
  const aliases = Object.fromEntries([...aliasTargets].filter((entry): entry is [string, string] => entry[1] !== null))

  const slugsData = {
    pages: allSlugs,
    folders: [...folderPaths].map((p) => p.split("/")),
    aliases,
  }
  writes.push(writeJSON(path.join(OUT_DIR, "all-slugs.json"), slugsData))

  // tags.json - tag → list of files with that tag
  const tagIndex: Record<string, { slug: string; title: string; description: string | null; date: string | null }[]> = {}
  for (const { file, result } of rendered) {
    // A nested tag also lists its notes under every parent: #a/b appears on /tags/a.
    const fileTags = new Set(result.tags.flatMap(tag => tag.split("/").map((_, i, parts) => parts.slice(0, i + 1).join("/"))))
    const meta = metaOf(file.slug)
    for (const tag of fileTags) {
      if (!tagIndex[tag]) tagIndex[tag] = []
      tagIndex[tag].push({ slug: file.slug, title: meta.title, description: meta.summary, date: isoDay(meta.created) })
    }
  }
  // Sort each tag's files by date descending
  for (const entries of Object.values(tagIndex)) {
    entries.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  }
  writes.push(writeJSON(path.join(OUT_DIR, "tags.json"), tagIndex))

  // sitemap-data.json - minimal data for sitemap generation
  const sitemapData = files.map((f) => ({ slug: f.slug, mtime: metaOf(f.slug).modified?.toISOString() ?? null }))
  writes.push(writeJSON(path.join(OUT_DIR, "sitemap-data.json"), sitemapData))

  // notes-list.json - sorted list of all notes with metadata (for homepage, RSS, llms.txt)
  const notesList = files
    .filter((f) => f.slug !== "index")
    .map((f) => {
      const meta = metaOf(f.slug)
      return {
        slug: f.slug,
        title: meta.title,
        description: meta.description,
        summary: meta.summary,
        date: isoDay(meta.created),
        dateRaw: meta.created?.toISOString() ?? null,
        tags: resultsBySlug.get(f.slug)?.tags ?? [],
        draft: f.frontmatter.draft === true,
      }
    })
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

    const meta = metaOf(slugStr)

    const pageData: PageData = {
      html: result.html,
      frontmatter: result.frontmatter,
      toc: result.toc,
      tags: result.tags,
      links: result.links,
      backlinks: backlinkIndex.get(slugStr) ?? [],
      prevNext: {
        prev: prev
          ? { slug: prev.slug, title: noteTitle(prev) }
          : null,
        next: next
          ? { slug: next.slug, title: noteTitle(next) }
          : null,
      },
      readingTime: readingTime(file.raw),
      mtime: meta.modified?.toISOString() ?? null,
      date: isoDay(meta.created),
      modifiedDate: isoDay(meta.modified),
      description: meta.description,
    }

    writes.push(writeJSON(path.join(OUT_DIR, "pages", `${slugStr}.json`), pageData))
  }

  // Folder listing JSON files
  for (const folderPath of folderPaths) {
    const prefix = folderPath + "/"
    const indexSlug = `${folderPath}/index`
    const folderFiles = files
      .filter((f) => f.slug.startsWith(prefix) && f.slug !== indexSlug)
      .sort((a, b) => (metaOf(b.slug).created?.getTime() ?? 0) - (metaOf(a.slug).created?.getTime() ?? 0))
    const indexResult = resultsBySlug.get(indexSlug)

    const folderData: FolderData = {
      index: indexResult ? { title: metaOf(indexSlug).title, html: indexResult.html } : null,
      files: folderFiles.map((f) => {
        const meta = metaOf(f.slug)
        return { slug: f.slug, title: meta.title, description: meta.summary, date: isoDay(meta.created), tags: resultsBySlug.get(f.slug)?.tags ?? [] }
      }),
    }

    writes.push(writeJSON(path.join(OUT_DIR, "folders", `${folderPath}.json`), folderData))
  }

  // Portable Markdown per note at /md/<slug>.md, plus llms-full.txt, for LLMs and agents.
  const siteUrl = config.site.baseUrl.replace(/\/+$/, "")
  const markdownDir = path.join(PUBLIC_DIR, "md")
  await fs.rm(markdownDir, { recursive: true, force: true })
  const portable = files.map(file => {
    const meta = metaOf(file.slug)
    const markdown = toStandardMarkdown(file.raw, {
      title: meta.title,
      description: text(file.frontmatter.description) ?? text(file.frontmatter.summary),
      resolveLink: (target, heading) => {
        const slug = resolveNote(target, `${file.slug}.md`)
        return slug ? `${siteUrl}${noteHref(slug, heading)}` : undefined
      },
      resolveAsset: target => {
        const assetPath = findAsset(target, `${file.slug}.md`)
        return assetPath && `${siteUrl}/content/${assetPath.split("/").map(encodeURIComponent).join("/")}`
      },
    })
    writes.push(fs.mkdir(path.dirname(path.join(markdownDir, `${file.slug}.md`)), { recursive: true })
      .then(() => fs.writeFile(path.join(markdownDir, `${file.slug}.md`), markdown)))
    return { slug: file.slug, markdown }
  })
  // Folder URLs (/docs) serve their index note, so their Markdown lives at md/<folder>.md too.
  for (const { slug, markdown } of portable) {
    if (!slug.endsWith("/index")) continue
    const folderFile = path.join(markdownDir, `${slug.slice(0, -"/index".length)}.md`)
    writes.push(fs.mkdir(path.dirname(folderFile), { recursive: true }).then(() => fs.writeFile(folderFile, markdown)))
  }
  const llmsFull = portable.map(({ slug, markdown }) => `<!-- ${siteUrl}${noteHref(slug)} -->\n${markdown}`).join("\n---\n\n")
  writes.push(fs.writeFile(path.join(OUT_DIR, "llms-full.txt"), llmsFull))

  // folder path -> title of its index.md, for the sidebar and breadcrumbs
  const folderTitles = Object.fromEntries([...folderPaths].filter(f => noteMeta.has(`${f}/index`)).map(f => [f, metaOf(`${f}/index`).title]))
  writes.push(writeJSON(path.join(OUT_DIR, "folder-titles.json"), folderTitles))

  await Promise.all(writes)

  // Copy media files (images, etc.) from content/ to public/content/
  await copyAssetFiles(assets)
  if (config.features.search) {
    await writeSearchIndex(rendered.map(({ file, result }) => ({
      slug: file.slug,
      title: String(result.frontmatter.title ?? file.slug.split("/").pop()),
      html: result.html,
    })))
    console.log("prebuild: wrote Pagefind index")
  }

  const viewerDir = path.join(PUBLIC_DIR, "graph-viewer")
  const viewerSource = path.join(import.meta.dir, "../apps/web/graph-viewer")
  await fs.rm(viewerDir, { recursive: true, force: true })
  await ensureDir(viewerDir)
  const viewerBuild = await Bun.build({
    entrypoints: [path.join(viewerSource, "index.ts")], outdir: viewerDir,
    target: "browser", format: "esm", splitting: true, minify: true,
  })
  if (!viewerBuild.success) throw new AggregateError(viewerBuild.logs, "Graph viewer build failed")
  await Promise.all([
    fs.copyFile(path.join(viewerSource, "index.html"), path.join(viewerDir, "index.html")),
    fs.copyFile(path.join(import.meta.dir, "../node_modules/aframe/dist/aframe-master.min.js"), path.join(viewerDir, "aframe.js")),
    fs.copyFile(path.join(import.meta.dir, "../node_modules/@ar-js-org/ar.js/aframe/build/aframe-ar.js"), path.join(viewerDir, "ar.js")),
  ])

  const elapsed = ((performance.now() - start) / 1000).toFixed(2)
  console.log(`prebuild: done in ${elapsed}s - ${files.length} pages, ${graphLinks.length} links, ${backlinkIndex.size} pages with backlinks`)
}

main().catch((err) => {
  console.error("prebuild failed:", err)
  process.exit(1)
})
