import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Frontmatter } from "./types.js"

export interface MarkdownFile {
  slug: string        // relative path without .md, e.g. "notes/foo"
  filePath: string    // absolute file path
  frontmatter: Frontmatter
  raw: string
  mtime?: Date        // File modification time
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
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
        const raw = await fs.readFile(fullPath, "utf-8")
        const { data } = matter(raw)

        // Skip draft or unpublished files
        if (data.draft === true || data.published === false) continue

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
          frontmatter: data as Frontmatter,
          raw,
          mtime,
        })
      }
    }
  }

  await walk(contentDir)
  return results
}

/**
 * Reads a single markdown file by slug.
 * Returns null if the file doesn't exist.
 */
export async function getMarkdownBySlug(
  contentDir: string,
  slug: string
): Promise<MarkdownFile | null> {
  const filePath = path.join(contentDir, slug + ".md")
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data } = matter(raw)
    let mtime: Date | undefined
    try {
      const stat = await fs.stat(filePath)
      mtime = stat.mtime
    } catch {
      mtime = undefined
    }
    return { slug, filePath, frontmatter: data as Frontmatter, raw, mtime }
  } catch {
    return null
  }
}

export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
  mtime?: Date  // File modification time (for sorting)
}

export interface BuildFileTreeOptions {
  /** Sort method: 'name' (alphabetical) or 'modified' (newest first) */
  sortBy?: 'name' | 'modified'
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
      const timeA = a.mtime?.getTime() ?? 0
      const timeB = b.mtime?.getTime() ?? 0
      return timeB - timeA  // Newest first
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
        }
        parentList.push(node)
      } else {
        let folderNode = nodeMap.get(partPath)
        if (!folderNode) {
          folderNode = { name: part, path: partPath, type: "folder", children: [] }
          nodeMap.set(partPath, folderNode)
          parentList.push(folderNode)
        }
        parentList = folderNode.children!
      }
    }
  }

  // Sort each level: folders first, then by name or modification time
  function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1
      
      if (sortBy === 'modified') {
        const timeA = a.mtime?.getTime() ?? 0
        const timeB = b.mtime?.getTime() ?? 0
        return timeB - timeA  // Newest first
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    })
    for (const node of nodes) {
      if (node.children) sortNodes(node.children)
    }
    return nodes
  }

  return sortNodes(root)
}
