---
title: Welcome to nuartz
---

nuartz is a fast, minimalist digital garden template built on Next.js 15 and Tailwind CSS v4. It transforms plain Markdown files into a fully-functional, interconnected knowledge base.

## Get Started

nuartz requires **Node.js v20+** (or Bun) and is structured as a monorepo.

```shell
git clone https://github.com/your-user/nuartz.git
cd nuartz
bun install
bun dev
```

Then drop your Markdown files into `apps/web/content/` and start writing.

1. [[authoring-content|Write content]] using Markdown + Obsidian syntax
2. [[configuration|Configure]] site metadata and behaviour
3. Understand the [[layout|layout system]]
4. [[building|Build and preview]] the site locally
5. [[hosting|Deploy]] to Vercel, Netlify, or your own server

## Features

- [[features/wikilinks|Wikilinks]] and [[features/backlinks|backlinks]] for interconnected notes
- [[features/graph-view|Interactive graph view]] showing relationships between notes
- [[features/callouts|Callouts]], [[features/syntax-highlighting|syntax highlighting]], [[features/latex|LaTeX]], [[features/mermaid|Mermaid diagrams]]
- [[features/search|Full-text search]] powered by Pagefind
- [[features/table-of-contents|Table of contents]], [[features/breadcrumbs|breadcrumbs]], [[features/recent-notes|recent notes]]
- [[features/rss-feed|RSS feed]], [[features/social-images|social images]], [[features/popover-previews|popover previews]]
- [[features/dark-mode|Dark mode]] with system preference detection
- [[features/reader-mode|Reader mode]] for distraction-free reading
- [[features/comments|Comments]] via Giscus
- [[features/private-pages|Draft / private pages]] filtering

For a full list, visit the [[features/index|features page]].

## Architecture

nuartz is split into two packages:

| Package | Description |
|---------|-------------|
| `packages/nuartz` | Core remark/rehype processing library |
| `apps/web` | Next.js 15 app — the actual site template |

Read more on the [[advanced/architecture|architecture]] page or explore [[advanced/creating-plugins|creating plugins]].
