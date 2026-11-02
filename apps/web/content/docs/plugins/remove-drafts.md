---
title: Draft Filtering
tags:
  - plugin
---

nuartz automatically excludes draft and private content from the site. This is handled at the filesystem level by `getAllMarkdownFiles()` in `packages/nuartz/src/fs.ts`, in every mode including `bun dev`.

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

String values (`"true"`, `"false"`) are read the same way. Either field makes `getAllMarkdownFiles()` skip the file, so it never reaches the starter's generated data. It will not appear in:

- The sidebar navigation and folder or tag listings
- The graph view and backlinks
- Search results and popover previews
- The RSS feed, sitemap, `llms.txt`, and `/md/*.md`

`getMarkdownBySlug()` still returns unpublished files (it does not filter by frontmatter); check `isUnpublished(file.frontmatter)` before rendering. `renderMarkdown()` returns empty output for them when you pass `stripDrafts: true`.

## Path-Level Exclusion

Any path with a segment that starts with `_` or `.` is excluded, regardless of frontmatter. `isHiddenContentPath()` implements the rule, and the starter applies it to attachments too:

```
content/_scratch.md           → always excluded
content/_private/plan.md      → always excluded
content/.trash/old.md         → always excluded
```

This is useful for drafts and templates you want to keep in version control but never publish.

## Implementation

```ts title="packages/nuartz/src/fs.ts"
if (isHiddenContentPath(entry.name)) continue
// ...
const frontmatter = normalizeFrontmatter(matter(raw).data)
if (isUnpublished(frontmatter)) continue
```

## Source

- [`packages/nuartz/src/fs.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/fs.ts)
- [`packages/nuartz/src/frontmatter.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/frontmatter.ts)
