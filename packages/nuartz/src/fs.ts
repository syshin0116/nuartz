import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import type { Frontmatter } from "./types.js"

export interface MarkdownFile {
  slug: string        // relative path without .md, e.g. "notes/foo"
  filePath: string    // absolute file path
  frontmatter: Frontmatter
  raw: string
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
        const relative = path.relative(contentDir, fullPath)
        const slug = relative.replace(/\.md$/, "").replace(/\\/g, "/")
        results.push({
          slug,
          filePath: fullPath,
          frontmatter: data as Frontmatter,
          raw,
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
    return { slug, filePath, frontmatter: data as Frontmatter, raw }
  } catch {
    return null
  }
}

export interface FileTreeNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileTreeNode[]
}

/**
 * Builds a nested file tree from a flat list of MarkdownFile entries.
 */
export function buildFileTree(files: MarkdownFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  const nodeMap = new Map<string, FileTreeNode>()

  const sortedFiles = [...files].sort((a, b) => a.slug.localeCompare(b.slug))

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

  return root
}
