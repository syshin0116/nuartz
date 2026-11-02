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
  getContentFiles,
  assignPageSlugs,
  parseCanvas,
  canvasBounds,
  canvasEdgeGeometry,
  parseBase,
  evaluateBase,
  renderBaseViewHtml,
} from "nuartz"
import { renderMarkdown } from "nuartz/markdown"
import type { BaseFile, BaseResult, Frontmatter, MarkdownFile, RenderOptions, TocEntry } from "nuartz"
import config from "../apps/web/nuartz.config"
import type { CanvasPageData, RenderedCanvasNode } from "../apps/web/lib/canvas"
import * as pagefind from "pagefind"

const CONTENT_DIR = path.resolve(config.contentDir)
const OUT_DIR = path.join(import.meta.dir, "../apps/web/.generated")
const PUBLIC_DIR = path.join(import.meta.dir, "../apps/web/public")
// Sub-path the site is served from, e.g. "/my-repo" on GitHub Pages. Must match next.config.ts.
const BASE_PATH = (process.env.NUARTZ_BASE_PATH ?? "").replace(/\/+$/, "")

interface PageData {
  kind?: "canvas" | "base"
  canvas?: CanvasPageData
  base?: BaseResult
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

/** A `.canvas` or `.base` file published as its own page. */
interface ContentPage {
  kind: "canvas" | "base"
  path: string
  slug: string
  title: string
  raw: string
  mtime?: Date
}

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function excerptOf(raw: string): string {
  return raw
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
}

const textOf = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ").trim()
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

  // 2. Canvas and Bases files become pages. A note keeps its URL when both
  // share a name; the other file moves to `<name>-canvas` / `<name>-base`.
  const pageFiles = await getContentFiles(CONTENT_DIR, [".canvas", ".base"])
  const pageSlugs = assignPageSlugs(pageFiles.map(file => file.path), files.map(file => file.slug))
  const contentPages: ContentPage[] = pageFiles.map(file => {
    const slug = pageSlugs.get(file.path)!
    const extension = path.posix.extname(file.path)
    if (slug !== file.path.slice(0, -extension.length)) console.warn(`prebuild: ${file.path} is published at /${slug} because its default URL is taken`)
    return {
      kind: extension.toLowerCase() === ".canvas" ? "canvas" : "base",
      path: file.path, slug, raw: file.raw, mtime: file.mtime,
      title: path.posix.basename(file.path, extension),
    }
  })
  const pagesBySlug = new Map(contentPages.map(page => [page.slug, page]))
  console.log(`prebuild: found ${contentPages.length} canvas and base files`)

  const filesBySlug = new Map(files.map(file => [file.slug, file]))
  const resolveNote = createNoteResolver([...files, ...contentPages.map(page => ({ slug: page.slug, frontmatter: {}, path: page.path }))])
  // Every path a link may point at, so [[folder]] and [[tags/x]] are not styled as broken.
  // Tags are scanned roughly from source; a miss only affects styling.
  const folderSlugs = new Set(files.flatMap(file => file.slug.split("/").slice(0, -1).map((_, i, parts) => parts.slice(0, i + 1).join("/"))))
  const tagSlugs = new Set(files.flatMap(file => [
    ...(file.frontmatter.tags ?? []),
    ...[...file.raw.matchAll(/(?:^|\s)#(\p{L}[\p{L}\p{M}\p{N}_/-]*)/gu)].map(match => match[1]),
  ]).flatMap(tag => tag.split("/").map((_, i, parts) => `tags/${parts.slice(0, i + 1).join("/")}`)))
  const knownSlugs = new Set([...filesBySlug.keys(), ...pagesBySlug.keys(), ...folderSlugs, ...tagSlugs, "tags", "notes"])
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

  // Bases are evaluated after the first render pass (they need each note's
  // tags and links); notes that use a base are rendered again afterwards.
  let baseFiles: BaseFile[] = []
  const baseFilesByPath = new Map<string, BaseFile>()
  const baseHref = (slug: string) => noteHref(slug, undefined, `${BASE_PATH}/`)
  const evaluateBaseSource = (source: string, label: string, thisPath?: string) => {
    const result = evaluateBase(parseBase(source), baseFiles, { resolveNote: target => resolveNote(target), thisFile: thisPath ? baseFilesByPath.get(thisPath) : undefined })
    for (const notice of new Set([...result.notices, ...result.views.flatMap(view => view.notices)])) console.warn(`prebuild: ${label}: ${notice}`)
    return result
  }
  const baseHtml = (result: BaseResult) => [
    ...result.notices.map(notice => `<p class="base-notice">${escapeHtml(notice)}</p>`),
    ...result.views.map(view => `${result.views.length > 1 ? `<p class="base-view-name">${escapeHtml(view.name)}</p>` : ""}${renderBaseViewHtml(view, { href: baseHref })}`),
  ].join("")

  // config.markdown overrides the starter's resolvers; base URL, file path and
  // known slugs stay under the starter's control so routing keeps working.
  const renderOptions = (filePath: string, withBases: boolean): RenderOptions => ({
    resolveLink,
    resolveAsset,
    resolveTag,
    ...config.markdown,
    features: { ...config.features, ...config.markdown?.features },
    baseUrl: `${BASE_PATH}/`,
    knownSlugs,
    filePath,
    resolveEmbed: (target, from) => {
      const slug = resolveNote(target, from) ?? ""
      const page = pagesBySlug.get(slug)
      if (page?.kind === "base" && withBases) {
        return { content: `<div class="base-embed">${baseHtml(evaluateBaseSource(page.raw, `${from} embeds ${page.path}`, from))}</div>`, filePath: page.path }
      }
      const source = filesBySlug.get(slug)
      return source ? { content: source.raw, filePath: source.slug + ".md" } : undefined
    },
    renderBase: withBases ? (source, from) => `<div class="base-embed">${baseHtml(evaluateBaseSource(source, `base block in ${from}`, from))}</div>` : undefined,
  })
  const renderNote = async (file: MarkdownFile, withBases: boolean) => ({ file, result: await renderMarkdown(file.raw, renderOptions(file.slug + ".md", withBases)) })

  // 3. Render all pages in parallel
  console.log("prebuild: rendering all pages...")
  const rendered = await Promise.all(files.map(file => renderNote(file, false)))

  const stats = await Promise.all(files.map(file => fs.stat(file.filePath).catch(() => undefined)))
  baseFiles = rendered.map(({ file, result }, index) => {
    const frontmatterLinks = [...JSON.stringify(file.frontmatter).matchAll(/\[\[([^\]|#]+)/g)].map(match => match[1])
    const links = [...new Set([...result.links, ...frontmatterLinks].map(target => resolveNote(target, file.slug)).filter((slug): slug is string => Boolean(slug) && slug !== file.slug))]
    return {
      path: `${file.slug}.md`, slug: file.slug, properties: file.frontmatter, tags: result.tags, links,
      mtime: file.mtime, ctime: stats[index]?.birthtime, size: stats[index]?.size,
    }
  })
  for (const baseFile of baseFiles) baseFilesByPath.set(baseFile.path, baseFile)

  // Embeds of notes that themselves embed a base are not detected and keep the first-pass output.
  const usesBase = /^\s*(`{3,}|~{3,})\s*base\b|!\[\[[^\]]*\.base\s*(?:[#|][^\]]*)?\]\]/im
  await Promise.all(rendered.map(async (entry, index) => {
    if (usesBase.test(entry.file.raw)) rendered[index] = await renderNote(entry.file, true)
  }))
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
  // Canvas and base page data
  const contentPageData = new Map<string, { html: string; links: string[]; excerpt: string; canvas?: CanvasPageData; base?: BaseResult }>()
  for (const page of contentPages) {
    if (page.kind === "base") {
      const base = evaluateBaseSource(page.raw, page.path, undefined)
      const views = base.views.map(view => `<h2>${escapeHtml(view.name)}</h2>${renderBaseViewHtml(view, { href: baseHref })}`).join("")
      const count = base.views[0]?.count ?? 0
      contentPageData.set(page.slug, { html: views, links: [], excerpt: `Base with ${base.views.length} ${base.views.length === 1 ? "view" : "views"}, ${count} ${count === 1 ? "note" : "notes"}`, base })
      continue
    }
    const { canvas, warnings } = parseCanvas(page.raw)
    for (const warning of warnings) console.warn(`prebuild: ${page.path}: ${warning}`)
    const links = new Set<string>()
    const searchParts: string[] = []
    const nodes = await Promise.all(canvas.nodes.map(async (node): Promise<RenderedCanvasNode> => {
      const base = { id: node.id, type: node.type, x: node.x, y: node.y, width: node.width, height: node.height, color: node.color }
      if (node.type === "text") {
        const result = await renderMarkdown(node.text, renderOptions(page.path, true))
        for (const target of result.links) {
          const slug = resolveNote(target, page.path)
          if (slug) links.add(slug)
        }
        searchParts.push(result.html)
        return { ...base, html: result.html }
      }
      if (node.type === "link") {
        searchParts.push(`<p>${escapeHtml(node.url)}</p>`)
        const safe = /^https?:\/\//i.test(node.url)
        let label = node.url
        try { label = new URL(node.url).hostname } catch { /* keep the raw url */ }
        return safe ? { ...base, href: node.url, label } : { ...base, type: "file", missing: true, label: node.url }
      }
      if (node.type === "group") {
        if (node.label) searchParts.push(`<p>${escapeHtml(node.label)}</p>`)
        const background = node.background && !isHiddenContentPath(node.background) && !node.background.includes("..") ? resolveAsset(node.background.replace(/^\/+/, "")) : undefined
        return { ...base, label: node.label, image: background, backgroundStyle: node.backgroundStyle }
      }
      const filePath = node.file.replace(/^\/+/, "")
      const label = path.posix.basename(filePath).replace(/\.md$/i, "")
      searchParts.push(`<p>${escapeHtml(label)}</p>`)
      if (/\.(md|canvas|base)$/i.test(filePath) || !path.posix.extname(filePath)) {
        const slug = resolveNote(filePath.replace(/\.md$/i, ""))
        const note = slug ? filesBySlug.get(slug) : undefined
        const target = slug ? pagesBySlug.get(slug) : undefined
        if (!slug || (!note && !target)) return { ...base, missing: true, label: filePath }
        links.add(slug)
        return { ...base, slug, label: note ? String(note.frontmatter.title ?? label) : target!.title, excerpt: note ? excerptOf(note.raw).slice(0, 240) : undefined }
      }
      const absolute = path.resolve(CONTENT_DIR, filePath)
      const relative = path.relative(CONTENT_DIR, absolute)
      const exists = !relative.startsWith("..") && !isHiddenContentPath(relative) && await fs.access(absolute).then(() => true, () => false)
      if (!exists) return { ...base, missing: true, label: filePath }
      return IMAGE_EXTENSION.test(filePath) ? { ...base, image: resolveAsset(relative.replace(/\\/g, "/")), label } : { ...base, href: resolveAsset(relative.replace(/\\/g, "/")), label }
    }))
    const rects = new Map(canvas.nodes.map(node => [node.id, node]))
    const edges = canvas.edges.map(edge => {
      const geometry = canvasEdgeGeometry(rects.get(edge.fromNode)!, rects.get(edge.toNode)!, edge.fromSide, edge.toSide)
      if (edge.label) searchParts.push(`<p>${escapeHtml(edge.label)}</p>`)
      return {
        id: edge.id, path: geometry.path, middle: geometry.middle, color: edge.color, label: edge.label,
        startArrow: edge.fromEnd === "arrow" ? geometry.startArrow : undefined,
        endArrow: edge.toEnd === "arrow" ? geometry.endArrow : undefined,
      }
    })
    links.delete(page.slug)
    const html = searchParts.join("")
    contentPageData.set(page.slug, { html, links: [...links], excerpt: textOf(html).slice(0, 350), canvas: { nodes, edges, bounds: canvasBounds(canvas.nodes) } })
  }

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
  const pageEntries: MarkdownFile[] = contentPages.map(page => ({ slug: page.slug, filePath: path.join(CONTENT_DIR, page.path), frontmatter: { title: page.title }, raw: "", mtime: page.mtime }))
  const fileTree = buildFileTree([...files, ...pageEntries])
  writes.push(writeJSON(path.join(OUT_DIR, "file-tree.json"), fileTree))

  // search.json
  const searchIndex = config.features.search ? buildSearchIndex(files) : []
  for (const entry of searchIndex) entry.tags = resultsBySlug.get(entry.slug)?.tags ?? entry.tags
  if (config.features.search) {
    for (const page of contentPages) searchIndex.push({ slug: page.slug, title: page.title, content: textOf(contentPageData.get(page.slug)!.html), tags: [] })
  }
  writes.push(writeJSON(path.join(OUT_DIR, "search.json"), searchIndex))

  // graph.json
  const noteNodes: GraphNode[] = rendered.map(({ file, result }) => ({
    id: file.slug,
    title: String(file.frontmatter.title ?? file.slug.split("/").pop() ?? file.slug),
    tags: result.tags,
    type: "note" as const,
  }))
  for (const page of contentPages) noteNodes.push({ id: page.slug, title: page.title, tags: [], type: "note" })

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
  for (const page of contentPages) {
    for (const target of contentPageData.get(page.slug)!.links) addLink(page.slug, target)
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
  const allSlugs: string[][] = [...files, ...contentPages].map((f) => f.slug.split("/"))
  const folderPaths = new Set<string>()
  for (const slug of allSlugs) {
    for (let i = 1; i < slug.length; i++) {
      folderPaths.add(slug.slice(0, i).join("/"))
    }
  }

  // alias path -> target slug. Aliases never shadow a real page or folder, and
  // an alias claimed by two notes is dropped rather than guessed.
  const taken = new Set([...knownSlugs, ...folderPaths])
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
  for (const page of contentPages) sitemapData.push({ slug: page.slug, mtime: page.mtime?.toISOString() ?? null })
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
    previewIndex[file.slug] = { title, excerpt: excerptOf(file.raw) }
  }
  for (const page of contentPages) previewIndex[page.slug] = { title: page.title, excerpt: contentPageData.get(page.slug)!.excerpt }
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

  for (const page of contentPages) {
    const data = contentPageData.get(page.slug)!
    const contentPage: PageData = {
      kind: page.kind,
      ...(page.kind === "canvas" ? { canvas: data.canvas } : { base: data.base }),
      html: "",
      frontmatter: { title: page.title },
      toc: [],
      tags: [],
      links: data.links,
      backlinks: [],
      prevNext: { prev: null, next: null },
      readingTime: 0,
      mtime: page.mtime?.toISOString() ?? null,
      date: null,
      modifiedDate: page.mtime?.toLocaleDateString("en-CA") ?? null,
    }
    writes.push(writeJSON(path.join(OUT_DIR, "pages", `${page.slug}.json`), contentPage))
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
    for (const page of contentPages) {
      if (page.slug.startsWith(prefix)) folderData.files.push({ slug: page.slug, title: page.title, description: null, date: null, tags: [] })
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
    await writeSearchIndex([
      ...rendered.map(({ file, result }) => ({
        slug: file.slug,
        title: String(result.frontmatter.title ?? file.slug.split("/").pop()),
        html: result.html,
      })),
      ...contentPages.map(page => ({ slug: page.slug, title: page.title, html: contentPageData.get(page.slug)!.html })),
    ])
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
  console.log(`prebuild: done in ${elapsed}s - ${files.length + contentPages.length} pages, ${graphLinks.length} links, ${backlinkIndex.size} pages with backlinks`)
}

main().catch((err) => {
  console.error("prebuild failed:", err)
  process.exit(1)
})
