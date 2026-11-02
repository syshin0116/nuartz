# Table of Contents

nuartz automatically generates a table of contents (TOC) from heading levels in your Markdown. See [docs/features/table-of-contents](https://nuartz.vercel.app/docs/features/table-of-contents) for what it looks like.

## How It Works

During rendering, a custom `rehypeExtractToc` plugin (defined inline in `packages/nuartz/src/markdown.ts`) extracts all headings with their depth and anchor IDs. The result is returned in `result.toc` from `renderMarkdown()`:

```ts
const result = await renderMarkdown(raw)
// result.toc → [{ depth: 1, text: "Introduction", id: "introduction", children: [...] }, ...]
```

The `apps/web` template renders this data in the right sidebar via `components/toc.tsx`.

## Configuration

`rehypeExtractToc` collects all h1-h6 headings and nests them by depth (`TocEntry.children`). To filter by depth, filter the `toc` array before rendering in `components/toc.tsx`. Pass `features: { toc: false }` to `renderMarkdown()` to skip extraction.

## Frontmatter Override

You can disable the TOC for a specific page with `toc: false` (or `enableToc: false`). The starter's page component checks this; `renderMarkdown()` still returns the entries.

```yaml
---
title: My Note
toc: false
---
```

## Heading Anchors

`rehype-slug` assigns an `id` to every heading (derived from its text), and `rehype-autolink-headings` appends a link icon (`a.heading-anchor`). Clicking it copies the section URL.

## Source

- [`packages/nuartz/src/markdown.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/markdown.ts)
- `rehypeExtractToc`: custom plugin in `packages/nuartz/src/markdown.ts`
