---
title: Private Pages
date: 2026-03-01
tags:
  - feature
  - publishing
description: "Set draft: true in frontmatter, or use a _ or . folder, to keep a page off the site."
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

`published: false` does the same. String values (`draft: "true"`, `published: "false"`) also work.

An unpublished page is skipped when content is discovered, in every mode including `bun dev`. It is:

- **Not rendered**: its URL returns a 404.
- **Excluded** from the sidebar, folder and tag listings, backlinks, graph, search, popover previews, RSS, sitemap, `llms.txt`, and the `/md/` Markdown files.
- **Not embeddable**: `![[draft-note]]` from a published note stays a plain link.

> [!warning] Public repositories
> If your repository is public on GitHub, the Markdown source of draft pages is still visible in the repo. Do not store sensitive information in draft pages if your repo is public.

## Hidden folders and files

Any path with a segment starting with `.` or `_` is never published, for notes and attachments alike:

```
content/.obsidian/...         → never published
content/.trash/old-note.md    → never published
content/_private/notes.md     → never published
content/_template.md          → never published
content/notes/_scratch.png    → never copied to /content/
```

Move a folder under `_private/` (or rename it to start with `_`) to keep it out of the site without editing each file.

## Related

- [[docs/frontmatter|Frontmatter]] - all supported frontmatter fields
- [[docs/features/tags|Tags]] - tag and folder index pages
- [[docs/deployment|Deployment]] - build and deploy to production
