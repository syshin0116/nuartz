---
title: Private Pages
date: 2026-03-01
tags:
  - feature
  - publishing
description: "Set draft: true in frontmatter to exclude a page from listings and builds."
---

Sometimes you want to keep a note in your content directory without publishing it. nuartz gives you a simple frontmatter-based mechanism for this.

## Marking a page as draft

Add `draft: true` to the page's [[docs/frontmatter|frontmatter]]:

```yaml
---
title: Work in Progress
date: 2026-03-01
draft: true
---
```

A draft page is:

- **Excluded** from the tag index, folder listings, and backlinks.
- **Excluded** from the search index.
- **Not rendered** in production builds (`bun run build`).
- **Still accessible by direct URL** in development mode (`bun dev`) so you can preview it while writing.

> [!warning] Development only
> Draft pages are only accessible in dev mode. They are completely absent from production builds — navigating to their URL on the deployed site returns a 404.

> [!warning] Public repositories
> If your repository is public on GitHub, the Markdown source of draft pages is still visible in the repo. Do not store sensitive information in draft pages if your repo is public.

## Excluding entire folders

To exclude a whole directory, use the `excludePatterns` option in `nuartz.config.ts`:

```ts
// nuartz.config.ts
export default defineConfig({
  excludePatterns: ["private/**", "drafts/**"],
})
```

Any [fast-glob](https://github.com/mrmlnc/fast-glob#pattern-syntax) pattern is valid here.

> [!note]
> `excludePatterns` is processed before rendering, so matching files are never parsed. This is faster than `draft: true` for large folders you always want excluded.

## Related

- [[docs/frontmatter|Frontmatter]] — all supported frontmatter fields
- [[docs/features/tags|Tags]] — tag and folder index pages
- [[docs/deployment|Deployment]] — build and deploy to production
