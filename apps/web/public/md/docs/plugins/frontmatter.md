# Frontmatter

nuartz parses YAML frontmatter using [gray-matter](https://github.com/jonschlinkert/gray-matter). Frontmatter is the block of `---`-delimited YAML at the top of a Markdown file.

## Supported Fields

```yaml
---
title: My Note                    # Page title (browser tab, header, sidebar, graph)
description: A short summary      # Meta description; cards prefer `summary`
summary: One line for cards       # Listing cards; meta falls back to it
date: 2024-01-15                  # Or `created`; used for sorting
modified: 2024-02-01              # Or `updated` / `lastmod`
tags: [feature, guide]            # Or `tag`; list, single value, or "a, b"
aliases: [old-name]               # Or `alias`; also redirect URLs
permalink: short-url              # Extra redirect URL
draft: true                       # true = excluded from the site
published: false                  # false = excluded from the site
order: 1                          # Sidebar and prev/next order
cssclasses: [wide]                # Or `cssclass`; classes on <article>
toc: false                        # Or `enableToc: false`
comments: false                   # Hide comments on this page
---
```

See [Frontmatter](https://nuartz.vercel.app/docs/frontmatter) for what each field does.

## Normalization

`normalizeFrontmatter()` in `packages/nuartz/src/frontmatter.ts` runs on every file read by `getAllMarkdownFiles()`, `getMarkdownBySlug()`, and `renderMarkdown()`:

- `tags`/`tag`, `aliases`/`alias`, and `cssclasses`/`cssclass` become string arrays. A comma-separated string is split, tags lose a leading `#`, and duplicates are removed.
- `draft` and `published` become booleans, accepting the strings `"true"` and `"false"`.

`isUnpublished(frontmatter)` returns `true` for `draft: true` or `published: false`.

## Type Definition

The `Frontmatter` type lives in `packages/nuartz/src/types.ts`:

```ts
export interface Frontmatter {
  title?: string
  date?: string | Date
  tags?: string[]
  description?: string
  summary?: string
  draft?: boolean
  published?: boolean
  aliases?: string[]
  cssclasses?: string[]
  order?: number
  [key: string]: unknown   // any extra fields are preserved
}
```

Fields without a typed key (`created`, `modified`, `permalink`, `toc`, `comments`, ...) are read through the index signature.

## Draft Filtering

Files with `draft: true` or `published: false` are excluded by `getAllMarkdownFiles()`, so they do not appear in the sidebar, graph, or search index. Paths with a segment starting with `_` or `.` are also excluded:

```
content/_template.md    → excluded
content/.trash/old.md   → excluded
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

- [`packages/nuartz/src/types.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/types.ts)
- [`packages/nuartz/src/frontmatter.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/frontmatter.ts)
- [`packages/nuartz/src/fs.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/fs.ts)
