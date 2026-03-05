---
title: Frontmatter
tags:
  - plugin
---

nuartz parses YAML frontmatter using [gray-matter](https://github.com/jonschlinkert/gray-matter). Frontmatter is the block of `---`-delimited YAML at the top of a Markdown file.

## Supported Fields

```yaml
---
title: My Note                    # Page title (shown in browser tab, sidebar, graph)
description: A short summary      # Used for SEO meta description
date: 2024-01-15                  # Publication date (used for sorting)
tags:                             # List of tags
  - feature
  - guide
draft: true                       # If true, excluded from the site
published: false                  # Alias for draft (false = excluded)
toc: false                        # Disable table of contents for this page
---
```

## Type Definition

The full `Frontmatter` type lives in `packages/nuartz/src/types.ts`:

```ts
export interface Frontmatter {
  title?: string
  description?: string
  date?: string
  tags?: string[]
  draft?: boolean
  published?: boolean
  toc?: boolean
  [key: string]: unknown   // any extra fields are preserved
}
```

You can extend this interface if you need custom fields.

## Draft Filtering

Files with `draft: true` or `published: false` are excluded by `getAllMarkdownFiles()` — they will not appear in the sidebar, graph, or search index.

Files prefixed with `_` are also excluded:

```
content/_template.md    → excluded
content/index.md        → included
```

## Accessing Frontmatter

In server components and API routes, frontmatter is available via the `MarkdownFile` object:

```ts
const files = await getAllMarkdownFiles(CONTENT_DIR)
files.forEach(f => {
  console.log(f.frontmatter.title)
  console.log(f.frontmatter.tags)
})
```

## Source

- [`packages/nuartz/src/types.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/types.ts)
- [`packages/nuartz/src/fs.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/fs.ts)
