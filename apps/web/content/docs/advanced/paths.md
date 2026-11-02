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

When you write `[[some note]]`, the starter resolves it with `createNoteResolver()` from `packages/nuartz/src/links.ts`:

1. Normalize the target with `normalizeNotePath()`: lowercase, spaces → hyphens, trailing `.md` removed
2. Look for an exact slug match (`[[notes/foo]]`)
3. Look for a path relative to the linking note (`[[../foo]]`); targets starting with `.` use only this step
4. Look for a file name or alias that exactly one note has (`[[foo]]` → `notes/foo`). Names shared by two notes do not resolve.

If no match is found and `knownSlugs` is provided, the link renders with a `broken` CSS class so you can style dead links differently.

Alias and `permalink` URLs (`/old-name`) redirect to the note. See [[docs/frontmatter|Frontmatter]].

## File Tree

`buildFileTree()` in `packages/nuartz/src/fs.ts` converts a flat `MarkdownFile[]` array into a nested `FileTreeNode[]` tree, used by the sidebar navigation:

```ts
const tree = buildFileTree(files)
// → [
//     { name: "docs", type: "folder", path: "docs", children: [...] },
//     { name: "My Note", type: "file", path: "notes/my-note" },
//   ]
```

At each level, nodes with a frontmatter `order` come first (a folder uses the lowest `order` among its notes), then folders before files, then by name.

## Skipped Files

Files are excluded from the content index if they:

- Have a path segment starting with `_` or `.` (e.g. `_template.md`, `_private/plan.md`, `.trash/old.md`)
- Have `draft: true` in frontmatter
- Have `published: false` in frontmatter
