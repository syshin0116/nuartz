/**
 * Obsidian markdown parser for Next.js
 */

import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import type { QuartzConfig } from '../cfg'

export interface ParsedMarkdown {
  frontmatter: Record<string, any>
  content: string
  html: string
  slug: string
}

/**
 * Parse Obsidian-flavored markdown with Quartz plugins
 *
 * @example
 * ```ts
 * const result = await parseObsidianMarkdown(markdown, quartzConfig)
 * console.log(result.html)
 * ```
 */
export async function parseObsidianMarkdown(
  markdown: string,
  config: QuartzConfig
): Promise<ParsedMarkdown> {
  // Parse frontmatter
  const { data: frontmatter, content } = matter(markdown)

  // Create unified processor with Quartz plugins
  const processor = unified().use(remarkParse)

  // TODO: Add Quartz transformer plugins
  // This will be implemented after sync-quartz runs

  const result = await processor
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(content)

  return {
    frontmatter,
    content,
    html: String(result),
    slug: frontmatter.slug || '',
  }
}
