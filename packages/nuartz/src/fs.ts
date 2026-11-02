import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Frontmatter } from "./types.js"
import { isUnpublished, normalizeFrontmatter } from "./frontmatter.js"

export interface MarkdownFile {
  slug: string        // relative path without .md, e.g. "notes/foo"
  filePath: string    // absolute file path
  frontmatter: Frontmatter
  raw: string
  mtime?: Date        // File modification time
}

/**
 * True for content paths that must never be published: anything inside a
 * dot-folder (.obsidian, .trash, .git) or starting with "_".
 * `relativePath` is relative to the content directory, with "/" or "\\" separators.
 */
export function isHiddenContentPath(relativePath: string): boolean {
  return relativePath.split(/[\\/]/).some(segment => segment.startsWith(".") || segment.startsWith("_"))
}

/** Extract date from frontmatter or filename (e.g. 2025-10-13-title.md) */
function extractDate(file: MarkdownFile): number {
  if (file.frontmatter.date) {
    const d = new Date(file.frontmatter.date as string | Date)
    if (!isNaN(d.getTime())) return d.getTime()
  }
  const basename = file.slug.split("/").pop() ?? ""
  const match = basename.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) {
    const d = new Date(match[1])
    if (!isNaN(d.getTime())) return d.getTime()
  }
  return 0
}

/**
 * Recursively walks a directory and returns all .md files.
 */
export async function getAllMarkdownFiles(
  contentDir: string
): Promise<MarkdownFile[]> {
  const results: MarkdownFile[] = []

  async function walk(dir: string) {
    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true }) as { name: string; isDirectory(): boolean }[]
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (isHiddenContentPath(entry.name)) continue
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith(".md")) {
        const raw = await fs.readFile(fullPath, "utf-8")
        const frontmatter = normalizeFrontmatter(matter(raw).data)
        if (isUnpublished(frontmatter)) continue

        const relative = path.relative(contentDir, fullPath)
        const slug = relative.replace(/\.md$/, "").replace(/\\/g, "/")
        
        // Get file modification time
        let mtime: Date | undefined
        try {
          const stat = await fs.stat(fullPath)
          mtime = stat.mtime
        } catch {
          mtime = undefined
        }

        results.push({
          slug,
          filePath: fullPath,
          frontmatter,
          raw,
          mtime,
        })
      }
    }
  }

  await walk(contentDir)
  return results
}

export interface ContentFile {
  path: string        // relative path with extension, e.g. "maps/overview.canvas"
  filePath: string    // absolute file path
  raw: string
  mtime?: Date
  ctime?: Date
  size?: number
}

/** Recursively collects visible files with one of `extensions` (e.g. [".canvas"]), sorted by path. */
export async function getContentFiles(contentDir: string, extensions: string[]): Promise<ContentFile[]> {
  const results: ContentFile[] = []
  async function walk(dir: string) {
    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true }) as { name: string; isDirectory(): boolean }[]
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (isHiddenContentPath(entry.name)) continue
      if (entry.isDirectory()) await walk(fullPath)
      else if (extensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
        const stat = await fs.stat(fullPath).catch(() => undefined)
        results.push({
          path: path.relative(contentDir, fullPath).replace(/\\/g, "/"),
          filePath: fullPath,
          raw: await fs.readFile(fullPath, "utf-8"),
          mtime: stat?.mtime,
          ctime: stat?.birthtime,
          size: stat?.size,
        })
      }
    }
  }
  await walk(contentDir)
  return results.sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * Assigns URL slugs to non-markdown pages: the path without its extension
 * (`maps/overview.canvas` -> `maps/overview`). A slug already taken by a note or
 * an earlier path gets `-<extension>` appended (`maps/overview-canvas`), then a counter.
 */
export function assignPageSlugs(paths: string[], taken: Iterable<string>): Map<string, string> {
  const used = new Set(taken)
  const slugs = new Map<string, string>()
  for (const filePath of paths) {
    const ext = path.posix.extname(filePath)
    const base = filePath.slice(0, -ext.length || undefined)
    let slug = base
    for (let n = 1; used.has(slug); n++) slug = `${base}-${ext.slice(1)}${n > 1 ? `-${n}` : ""}`
    used.add(slug)
    slugs.set(filePath, slug)
  }
  return slugs
}

/**
 * Reads a single markdown file by slug.
 * Returns null if the file doesn't exist, is hidden, or lies outside `contentDir`.
 */
export async function getMarkdownBySlug(
  contentDir: string,
  slug: string
): Promise<MarkdownFile | null> {
  const root = path.resolve(contentDir)
  const filePath = path.resolve(root, slug + ".md")
  const relative = path.relative(root, filePath)
  if (relative.startsWith("..") || path.isAbsolute(relative) || isHiddenContentPath(relative)) return null
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const frontmatter = normalizeFrontmatter(matter(raw).data)
    let mtime: Date | undefined
    try {
      const stat = await fs.stat(filePath)
      mtime = stat.mtime
    } catch {
      mtime = undefined
    }
    return { slug, filePath, frontmatter, raw, mtime }
  } catch {
    return null
  }
}

export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
  mtime?: Date
  date?: number  // Resolved date timestamp for sorting (frontmatter > filename > 0)
  order?: number
}

export interface BuildFileTreeOptions {
  /** Sort method: 'name' (alphabetical), 'modified' (file mtime), or 'date' (frontmatter/filename date) */
  sortBy?: 'name' | 'modified' | 'date'
}

/**
 * Builds a nested file tree from a flat list of MarkdownFile entries.
 */
export function buildFileTree(files: MarkdownFile[], options?: BuildFileTreeOptions): FileTreeNode[] {
  const { sortBy = 'name' } = options ?? {}
  const root: FileTreeNode[] = []
  const nodeMap = new Map<string, FileTreeNode>()

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'modified') {
      return (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0)
    }
    if (sortBy === 'date') {
      return extractDate(b) - extractDate(a)
    }
    return a.slug.localeCompare(b.slug)
  })

  for (const file of sortedFiles) {
    const parts = file.slug.split("/")
    let parentList = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const partPath = parts.slice(0, i + 1).join("/")
      const isLast = i === parts.length - 1

      if (isLast) {
        const node: FileTreeNode = {
          name: file.frontmatter.title ?? part,
          path: file.slug,
          type: "file",
          mtime: file.mtime,
          date: extractDate(file),
          order: file.frontmatter.order,
        }
        parentList.push(node)
      } else {
        let folderNode = nodeMap.get(partPath)
        if (!folderNode) {
          folderNode = { name: part, path: partPath, type: "folder", children: [], date: 0 }
          nodeMap.set(partPath, folderNode)
          parentList.push(folderNode)
        }
        // Bubble up the latest date to the folder
        if (file.frontmatter.order !== undefined) folderNode.order = Math.min(folderNode.order ?? Infinity, file.frontmatter.order)
        if (sortBy === 'date') {
          const fileDate = extractDate(file)
          if (fileDate > (folderNode.date ?? 0)) folderNode.date = fileDate
        } else if (sortBy === 'modified') {
          const t = file.mtime?.getTime() ?? 0
          if (t > (folderNode.mtime?.getTime() ?? 0)) folderNode.mtime = file.mtime
        }
        parentList = folderNode.children!
      }
    }
  }

  // Sort each level: folders first, then by chosen method
  function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
    nodes.sort((a, b) => {
      if (sortBy === "name" && a.order !== b.order) return (a.order ?? Infinity) - (b.order ?? Infinity)
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      if (sortBy === 'date') return (b.date ?? 0) - (a.date ?? 0)
      if (sortBy === 'modified') return (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0)
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    })
    for (const node of nodes) {
      if (node.children) sortNodes(node.children)
    }
    return nodes
  }

  return sortNodes(root)
}
