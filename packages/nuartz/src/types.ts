export interface Frontmatter {
  title?: string
  date?: string | Date
  tags?: string[]
  description?: string
  draft?: boolean
  aliases?: string[]
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
  tags: string[]        // inline #tags
}

export interface RenderOptions {
  /** Base URL for wikilinks (default: '/') */
  baseUrl?: string
  /** Resolve wikilink target to URL path */
  resolveLink?: (target: string) => string
  /** Whether to strip draft pages (default: false) */
  stripDrafts?: boolean
}
