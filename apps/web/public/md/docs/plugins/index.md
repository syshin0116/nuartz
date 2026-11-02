# Processing Pipeline

Nuartz processes Markdown through a **remark → rehype** pipeline. Each stage is handled by plugins that transform the abstract syntax tree (AST) before producing the final HTML.

## Pipeline Overview

```
Raw Markdown
    │
    ▼ gray-matter (frontmatter → normalizeFrontmatter)
    │
    ▼ remark plugins, in order
┌──────────────────────────────────────────────────────────┐
│  remarkParse + remarkFrontmatter                         │
│  remarkObsidianComment  (%% hidden comments %%)          │
│  remarkGfm              (tables, strikethrough, tasks)   │
│  remarkMath             (LaTeX math syntax)              │
│  remarkEmbed            (![[note]] transclusion)       * │
│  remarkBlockIds         (^block-id anchors)            * │
│  remarkWikilink         (wikilinks, Markdown note links, │
│                          attachments and media)        * │
│  remarkBreaks           (soft line breaks → <br>)        │
│  remarkCallout          (> [!note] callouts)           * │
│  remarkTag              (#inline-tags)                 * │
│  remarkHighlight        (==highlights== → <mark>)        │
│  remarkArrows           (--> → arrows)                   │
└──────────────────────────────────────────────────────────┘
    │
    ▼ remark-rehype → rehype-raw (HTML AST, raw HTML kept)
    │
    ▼ rehype plugins, in order
┌──────────────────────────────────────────────────────────┐
│  rehypeGraphviz         (```dot diagrams → inline SVG)   │
│  rehypeD2               (```d2 diagrams → inline SVG)    │
│  rehypePrettyCode       (syntax highlighting via Shiki)  │
│  rehypeSlug             (heading IDs)                    │
│  rehypeAutolinkHeadings (link icon on headings)          │
│  rehypeKatex            (LaTeX rendering)                │
│  rehypeExtractToc       (table of contents)            * │
│  rehypeExcerpt          (plain-text excerpt)             │
└──────────────────────────────────────────────────────────┘
    │
    ▼ rehype-stringify
HTML string + metadata (frontmatter, toc, links, tags, excerpt)

* skipped when the matching `features` flag is false
  (wikilinks, callouts, tags, toc)
```

## Entry Point

All plugins are wired together in `packages/nuartz/src/markdown.ts` via the `renderMarkdown()` function:

```ts
import { renderMarkdown } from "nuartz/markdown"

const result = await renderMarkdown(rawMarkdownString, {
  knownSlugs: new Set(allSlugs),  // optional: enables broken-link detection
})
// result.html      - rendered HTML
// result.toc       - table of contents entries
// result.links     - outgoing note links (wikilinks, embeds, Markdown links to notes)
// result.tags      - all tags (frontmatter + inline)
// result.excerpt   - plain text of the leading paragraphs
```

## Plugin Reference

| Plugin | Docs |
|--------|------|
| Wikilinks & Obsidian syntax | [docs/plugins/obsidian](https://nuartz.vercel.app/docs/plugins/obsidian) |
| Syntax highlighting | [docs/plugins/syntax-highlighting](https://nuartz.vercel.app/docs/plugins/syntax-highlighting) |
| Table of contents | [docs/plugins/table-of-contents](https://nuartz.vercel.app/docs/plugins/table-of-contents) |
| Frontmatter | [docs/plugins/frontmatter](https://nuartz.vercel.app/docs/plugins/frontmatter) |
| LaTeX | [docs/features/latex](https://nuartz.vercel.app/docs/features/latex) |
| Mermaid diagrams | [docs/features/mermaid](https://nuartz.vercel.app/docs/features/mermaid) |
| Callouts | [docs/features/callouts](https://nuartz.vercel.app/docs/features/callouts) |

## Creating Custom Plugins

See [docs/advanced/creating-plugins](https://nuartz.vercel.app/docs/advanced/creating-plugins) for a guide on writing your own remark/rehype plugins and integrating them into nuartz.
