---
title: Table of Contents
tags:
  - plugin
---

nuartz automatically generates a table of contents (TOC) from heading levels in your Markdown. See [[features/table-of-contents]] for what it looks like.

## How It Works

During rendering, a custom `rehypeExtractToc` plugin (defined inline in `packages/nuartz/src/markdown.ts`) extracts all headings with their depth and anchor IDs. The result is returned in `result.toc` from `renderMarkdown()`:

```ts
const result = await renderMarkdown(raw)
// result.toc → [{ depth: 1, text: "Introduction", slug: "introduction" }, ...]
```

The `apps/web` template renders this data in the right sidebar via `components/toc.tsx`.

## Configuration

`rehypeExtractToc` collects all h1–h6 headings by default. To filter by depth, adjust the `buildTocTree` function or filter the `toc` array before rendering in `components/toc.tsx`.

## Frontmatter Override

You can disable the TOC for a specific page:

```yaml
---
title: My Note
toc: false
---
```

## Heading Anchors

`rehype-slug` assigns an `id` to every heading (derived from its text), and `rehype-autolink-headings` adds a `§` anchor link. Clicking the `§` icon copies the anchor URL.

## Source

- [`packages/nuartz/src/markdown.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/markdown.ts)
- `rehypeExtractToc` — custom plugin in `packages/nuartz/src/markdown.ts`
