export interface Frontmatter {
  title?: string
  date?: string | Date
  tags?: string[]
  description?: string
  summary?: string
  draft?: boolean
  /** `false` hides the note. Other values, such as a publish date, are kept. */
  published?: boolean | string | Date
  aliases?: string[]
  cssclasses?: string[]
  order?: number
  [key: string]: unknown
}

export interface TocEntry {
  depth: number
  text: string
  id: string
  children: TocEntry[]
}

export interface RenderResult {
  html: string
  frontmatter: Frontmatter
  toc: TocEntry[]
  links: string[]       // outgoing wikilinks
  tags: string[]        // frontmatter tags followed by inline #tags
  inlineTags: string[]  // inline #tags in document order, deduplicated
  excerpt: string       // plain text of the leading paragraphs, about 200 characters
}

export interface RenderOptions {
  /** Base URL for wikilinks (default: '/') */
  baseUrl?: string
  /** Resolve wikilink target to URL path */
  resolveLink?: (target: string, heading?: string, filePath?: string) => string
  /** Load a published note for transclusion. Return undefined for missing or private notes. */
  resolveEmbed?: (target: string, filePath?: string) => { content: string; filePath: string } | undefined
  /** HTML for a ```base code block (Obsidian Bases), given its YAML and the current file path. Return undefined to keep it as code. */
  renderBase?: (source: string, filePath?: string) => string | undefined
  /**
   * URL for an attachment (`![[file.png]]`, `![](file.png)`, `[x](file.pdf)`) as written in the note at `filePath`,
   * or undefined when it does not exist. Default: `/api/content/<path>` resolved against the note's folder.
   */
  resolveAsset?: (target: string, filePath?: string) => string | undefined
  /** URL for an inline #tag (default: `/tags/` followed by the whole tag URL-encoded, so `a/b` becomes `a%2Fb`) */
  resolveTag?: (tag: string) => string
  /** Known slugs for dead-link detection */
  knownSlugs?: Set<string>
  /** Whether to strip draft pages (default: false) */
  stripDrafts?: boolean
  /** Path of the current file relative to content root (e.g. 'AI/my-post.md'). Used to resolve relative image paths in wikilinks. */
  filePath?: string
  /** Disable individual transforms when embedding Nuartz in another renderer. */
  features?: {
    wikilinks?: boolean
    callouts?: boolean
    tags?: boolean
    toc?: boolean
  }
}
