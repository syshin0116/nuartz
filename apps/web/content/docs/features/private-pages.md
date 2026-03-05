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

To exclude a whole folder, prefix all files in it with `_` — any file starting with `_` is automatically skipped by `getAllMarkdownFiles()`.

Alternatively, add `draft: true` to each file's frontmatter, or organise them in a folder that you simply don't add any content index for.

## Related

- [[docs/frontmatter|Frontmatter]] — all supported frontmatter fields
- [[docs/features/tags|Tags]] — tag and folder index pages
- [[docs/deployment|Deployment]] — build and deploy to production
