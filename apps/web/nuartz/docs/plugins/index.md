---
title: Processing Pipeline
---

Nuartz processes Markdown through a **remark → rehype** pipeline. Each stage is handled by plugins that transform the abstract syntax tree (AST) before producing the final HTML.

## Pipeline Overview

```
Raw Markdown
    │
    ▼ remark plugins
┌─────────────────────────────────┐
│  remarkGfm          (tables, strikethrough, task lists)  │
│  remarkMath         (LaTeX math blocks)                  │
│  remarkBreaks       (soft line breaks → <br>)            │
│  remarkCallout      (> [!note] callout syntax)           │
│  remarkWikilink     (wikilinks → HTML links)             │
│  remarkObsidianComment (%% hidden comments %%)           │
│  remarkHighlight    (==highlights== → <mark>)            │
│  remarkTag          (#inline-tags)                       │
└─────────────────────────────────┘
    │
    ▼ remark → hast (HTML AST)
    │
    ▼ rehype plugins
┌─────────────────────────────────┐
│  rehypePrettyCode   (syntax highlighting via Shiki)      │
│  rehypeKatex        (LaTeX rendering)                    │
│  rehypeSlug         (heading IDs for anchor links)       │
│  rehypeAutolinkHeadings (§ anchor links on headings)     │
│  rehypeExtractToc   (table of contents extraction)       │
└─────────────────────────────────┘
    │
    ▼
HTML string + metadata (links, tags, toc)
```

## Entry Point

All plugins are wired together in `packages/nuartz/src/markdown.ts` via the `renderMarkdown()` function:

```ts
import { renderMarkdown } from "nuartz"

const result = await renderMarkdown(rawMarkdownString, {
  knownSlugs: new Set(allSlugs),  // optional: enables broken-link detection
})
// result.html      — rendered HTML
// result.toc       — table of contents entries
// result.links     — outgoing wikilinks
// result.tags      — all tags (frontmatter + inline)
```

## Plugin Reference

| Plugin | Docs |
|--------|------|
| Wikilinks & Obsidian syntax | [[plugins/obsidian]] |
| Syntax highlighting | [[plugins/syntax-highlighting]] |
| Table of contents | [[plugins/table-of-contents]] |
| Frontmatter | [[plugins/frontmatter]] |
| LaTeX | [[features/latex]] |
| Mermaid diagrams | [[features/mermaid]] |
| Callouts | [[features/callouts]] |

## Creating Custom Plugins

See [[advanced/creating-plugins]] for a guide on writing your own remark/rehype plugins and integrating them into nuartz.
