# Table of Contents

> Automatically generated table of contents in the right sidebar with active heading tracking.

nuartz automatically generates a table of contents (ToC) for every page with at least one heading. It appears in the right sidebar and highlights the heading you are reading.

## Active heading tracking

As you scroll, the entry for the last heading that has passed the top of the viewport is highlighted, so you always know where you are in the document.

## Default behaviour

- Headings `H1` through `H6` are included, nested by level.
- The ToC is hidden on pages without headings.
- Below the `xl` breakpoint the ToC collapses into an **On this page** panel above the content.
- `features.toc: false` in the [configuration](https://nuartz.vercel.app/docs/configuration) turns it off site-wide.

## Disabling the ToC on a single page

Add `toc: false` (or Quartz's `enableToc: false`) to the page's [frontmatter](https://nuartz.vercel.app/docs/frontmatter):

```yaml
---
title: My Note
date: 2026-03-01
toc: false
---
```

> [!tip]
> Disabling the ToC is useful for short pages or landing pages where the sidebar would otherwise show just one entry.

## Tips for good ToC structure

> [!note] Heading hierarchy
> Use a single `H1` (`# Title`) per page and nest subsections under `H2` and `H3`. Skipping levels (e.g. jumping from `H1` to `H3`) produces a visually uneven ToC.

- Keep heading text short, since long headings wrap awkwardly in the sidebar.
- Every heading level appears, so a page with many `H4`-`H6` headings gets a long ToC.

## Related

- [Authoring Content](https://nuartz.vercel.app/docs/authoring-content) - full Markdown syntax reference
- [Frontmatter](https://nuartz.vercel.app/docs/frontmatter) - all supported frontmatter fields
- [Graph View](https://nuartz.vercel.app/docs/features/graph-view) - another navigation aid
