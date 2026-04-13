---
title: Documentation
---

Nuartz turns your Obsidian vault into a Next.js website. It handles wikilinks, callouts, backlinks, graph view, and search — you get a normal Next.js app you can customise with React components and shadcn/ui.

## Get Started

```shell
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install
bun dev
```

Drop your Markdown files into `apps/web/content/` and start writing.

1. [[authoring-content|Write content]] using Markdown + Obsidian syntax
2. [[configuration|Configure]] site metadata and behaviour
3. Understand the [[layout|layout system]]
4. [[building|Build and preview]] the site locally
5. [[hosting|Deploy]] to GitHub Pages, Vercel, or your own server

## Features

- [[features/wikilinks|Wikilinks]] and [[features/backlinks|backlinks]] for interconnected notes
- [[features/graph-view|Interactive graph view]] showing relationships between notes
- [[features/callouts|Callouts]], [[features/syntax-highlighting|syntax highlighting]], [[features/latex|LaTeX]], [[features/mermaid|Mermaid diagrams]]
- [[features/search|Full-text search]] powered by FlexSearch (Cmd+K, CJK-aware)
- [[features/table-of-contents|Table of contents]], [[features/breadcrumbs|breadcrumbs]], [[features/recent-notes|recent notes]]
- [[features/rss-feed|RSS feed]], [[features/social-images|social images]], [[features/popover-previews|popover previews]]
- [[features/dark-mode|Dark mode]] with system preference detection
- [[features/reader-mode|Reader mode]] for distraction-free reading
- [[features/comments|Comments]] via Giscus
- [[features/private-pages|Draft / private pages]] filtering

For a full list, visit the [[features/index|features page]].

## Architecture

Nuartz is split into two packages:

| Package | Description |
|---------|-------------|
| `packages/nuartz` | Headless data library — markdown parsing, wikilinks, backlinks, search index |
| `apps/web` | Next.js 15 starter template with shadcn/ui |

Read more on the [[advanced/architecture|architecture]] page or explore [[advanced/creating-plugins|creating plugins]].
