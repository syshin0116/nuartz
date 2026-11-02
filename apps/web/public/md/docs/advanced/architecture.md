# Architecture

> How nuartz processes markdown and renders pages, from remark to Next.js.

nuartz is a monorepo with two main packages:

- **`packages/nuartz`**: the core library that handles markdown processing
- **`apps/web`**: the Next.js application that renders your digital garden

## Processing pipeline

During `bun run generate` (`scripts/prebuild.ts`), nuartz processes every published note through a [unified](https://github.com/unifiedjs/unified) pipeline defined in `packages/nuartz/src/markdown.ts`. The exact plugin order is on the [Processing Pipeline](https://nuartz.vercel.app/docs/plugins/index) page.

1. **Frontmatter extraction**: [gray-matter](https://github.com/jonschlinkert/gray-matter) parses YAML frontmatter into structured data
2. **Remark (Markdown → Markdown AST)**: The markdown is parsed with [remark-parse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse) into an [mdast](https://github.com/syntax-tree/mdast) tree, then transformed by remark plugins:
   - `remark-frontmatter`: handles YAML/TOML blocks
   - `remark-gfm`: GitHub Flavored Markdown (tables, strikethrough, etc.)
   - `remark-math`: LaTeX math syntax
   - `remark-breaks`: soft line breaks
   - Custom nuartz plugins: `remarkObsidianComment`, `remarkEmbed`, `remarkBlockIds`, `remarkWikilink`, `remarkCallout`, `remarkTag`, `remarkHighlight`, `remarkArrows`
3. **Remark → Rehype**: The markdown AST is converted to an HTML AST ([hast](https://github.com/syntax-tree/hast)) via [remark-rehype](https://github.com/remarkjs/remark-rehype)
4. **Rehype (HTML AST → HTML AST)**: Rehype plugins transform the HTML tree:
   - `rehype-raw`: pass-through raw HTML
   - `@beoe/rehype-graphviz`, `@beoe/rehype-d2`: diagrams rendered to inline SVG
   - `rehype-pretty-code`: syntax highlighting with dual themes
   - `rehype-slug` + `rehype-autolink-headings`: heading anchors
   - `rehype-katex`: LaTeX rendering
   - `rehypeExtractToc`: extracts table of contents from headings
   - `rehypeExcerpt`: plain-text excerpt of the leading paragraphs
5. **Stringify**: [rehype-stringify](https://github.com/rehypejs/rehype/tree/main/packages/rehype-stringify) serializes the HTML AST to an HTML string

The pipeline returns a `RenderResult` containing the HTML, frontmatter, table of contents, outgoing links, tags, and excerpt.

## Key types

Defined in `packages/nuartz/src/types.ts`:

```ts
interface RenderResult {
  html: string
  frontmatter: Frontmatter
  toc: TocEntry[]
  links: string[]       // outgoing note links
  tags: string[]        // frontmatter tags followed by inline #tags
  inlineTags: string[]  // inline #tags in document order
  excerpt: string       // plain text of the leading paragraphs
}

interface RenderOptions {
  baseUrl?: string
  resolveLink?: (target: string, heading?: string, filePath?: string) => string
  resolveEmbed?: (target: string, filePath?: string) => { content: string; filePath: string } | undefined
  resolveAsset?: (target: string, filePath?: string) => string | undefined
  resolveTag?: (tag: string) => string
  knownSlugs?: Set<string>
  stripDrafts?: boolean
  filePath?: string
  features?: { wikilinks?: boolean; callouts?: boolean; tags?: boolean; toc?: boolean }
}
```

## The web application

`apps/web` is a standard Next.js App Router application:

- **`app/layout.tsx`**: root layout with sidebar, theme provider, and global styles
- **`app/[...slug]/page.tsx`**: catch-all route that reads the page, folder, and alias data `generate` wrote to `.generated/` and displays it. Notes are not rendered at request time.
- **`content/`**: your markdown files live here, organized by folder
- **`components/`**: React components for the graph view, table of contents, navigation, etc.

## File utilities

`packages/nuartz/src/fs.ts` provides helpers for reading and discovering content files, building the file graph for backlinks and the graph view.

## Custom plugins

nuartz plugins live in `packages/nuartz/src/plugins/` and are standard [unified](https://unifiedjs.com/) plugins: either remark (operating on mdast) or rehype (operating on hast). See [creating-plugins](https://nuartz.vercel.app/docs/advanced/creating-plugins) for details on writing your own.
