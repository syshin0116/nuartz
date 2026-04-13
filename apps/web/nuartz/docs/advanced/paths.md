---
title: Paths and Slugs
---

nuartz uses a simple, file-system-based slug system. Understanding how file paths map to URL slugs helps you reason about links, content organisation, and wikilink resolution.

## How Slugs Are Derived

Given a `content/` directory, every `.md` file gets a slug equal to its relative path without the `.md` extension and with backslashes normalized to forward slashes:

```
content/notes/foo.md           → slug: "notes/foo"
content/docs/features/search.md → slug: "docs/features/search"
content/index.md               → slug: "index"
```

Slugs are computed in `packages/nuartz/src/fs.ts` by `getAllMarkdownFiles()`:

```ts
const relative = path.relative(contentDir, fullPath)
const slug = relative.replace(/\.md$/, "").replace(/\\/g, "/")
```

## URL Mapping

The Next.js catch-all route `app/[...slug]/page.tsx` maps URL segments directly to slug segments:

| URL | Slug | File |
|-----|------|------|
| `/notes/foo` | `notes/foo` | `content/notes/foo.md` |
| `/docs/features/search` | `docs/features/search` | `content/docs/features/search.md` |
| `/` | `index` | `content/index.md` |

## Wikilink Resolution

When you write `[[some note]]`, the wikilink plugin resolves it by:

1. Normalizing the target: lowercase, spaces → hyphens
2. Checking `knownSlugs` for an exact match
3. Checking `knownSlugs` for a suffix match (e.g. `notes/foo` matches `[[foo]]`)

```ts
const normalized = linkTarget.toLowerCase().replace(/\s+/g, "-")
const match = files.find(
  f => f.slug === normalized || f.slug.endsWith("/" + normalized)
)
```

If no match is found and `knownSlugs` is provided, the link renders with a `broken` CSS class so you can style dead links differently.

## File Tree

`buildFileTree()` in `packages/nuartz/src/fs.ts` converts a flat `MarkdownFile[]` array into a nested `FileTreeNode[]` tree, used by the sidebar navigation:

```ts
const tree = buildFileTree(files)
// → [
//     { name: "docs", type: "folder", path: "docs", children: [...] },
//     { name: "My Note", type: "file", path: "notes/my-note" },
//   ]
```

Folders appear before files at each level, sorted alphabetically.

## Skipped Files

Files are excluded from the content index if they:

- Have a name starting with `_` (e.g. `_template.md`)
- Have `draft: true` in frontmatter
- Have `published: false` in frontmatter
