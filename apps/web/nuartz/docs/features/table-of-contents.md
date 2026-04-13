---
title: Table of Contents
date: 2026-03-01
tags:
  - feature
  - navigation
description: Automatically generated table of contents in the right sidebar with active heading tracking.
---

nuartz automatically generates a table of contents (ToC) for every page that has more than one heading. It appears in the right sidebar and highlights the heading currently visible in the viewport.

## Active heading tracking

The ToC uses the browser's `IntersectionObserver` API to watch each heading as you scroll. The entry for the heading closest to the top of the viewport is highlighted in the sidebar so you always know where you are in the document.

## Default behaviour

- Headings `H1` through `H3` are included.
- The ToC is hidden on pages with only one heading.
- On narrow screens the ToC is collapsed into the mobile menu.

## Disabling the ToC on a single page

Add `enableToc: false` to the page's [[docs/frontmatter|frontmatter]]:

```yaml
---
title: My Note
date: 2026-03-01
enableToc: false
---
```

> [!tip]
> Disabling the ToC is useful for short pages or landing pages where the sidebar would otherwise show just one entry.

## Tips for good ToC structure

> [!note] Heading hierarchy
> Use a single `H1` (`# Title`) per page and nest subsections under `H2` and `H3`. Skipping levels (e.g. jumping from `H1` to `H3`) produces a visually uneven ToC.

- Keep heading text short — long headings wrap awkwardly in the sidebar.
- Use `H4` and below for fine-grained structure that doesn't need to appear in the ToC.

## Related

- [[docs/authoring-content|Authoring Content]] — full Markdown syntax reference
- [[docs/frontmatter|Frontmatter]] — all supported frontmatter fields
- [[docs/features/graph-view|Graph View]] — another navigation aid
