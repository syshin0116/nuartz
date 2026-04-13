---
title: Draft Filtering
tags:
  - plugin
---

nuartz automatically excludes draft and private content from the site. This is handled at the filesystem level by `getAllMarkdownFiles()` in `packages/nuartz/src/fs.ts`.

## How to Mark Content as Draft

Set either of these frontmatter fields:

```yaml
---
draft: true
---
```

or

```yaml
---
published: false
---
```

Both have the same effect — the file is silently skipped during content discovery. It will not appear in:

- The sidebar navigation
- The graph view
- Search results
- The RSS feed
- The `/api/graph` or `/api/preview` endpoints

## File-Level Exclusion

Files whose names begin with `_` are also excluded, regardless of frontmatter:

```
content/_scratch.md     → always excluded
content/_template.md    → always excluded
```

This is useful for draft files you want to keep in version control but never publish.

## Implementation

```ts title="packages/nuartz/src/fs.ts"
const { data } = matter(raw)
if (data.draft === true || data.published === false) continue
```

## Source

- [`packages/nuartz/src/fs.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/fs.ts)
