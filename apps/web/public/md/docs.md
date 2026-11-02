# Documentation

Nuartz turns your Obsidian vault into a Next.js website. It handles wikilinks, callouts, backlinks, graph view, and search - you get a normal Next.js app you can customise with React components and shadcn/ui.

## Get Started

```shell
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install
bun dev
```

Drop your Markdown files into `apps/web/content/` and start writing.

1. [Write content](https://nuartz.vercel.app/docs/authoring-content) using Markdown + Obsidian syntax
2. [Configure](https://nuartz.vercel.app/docs/configuration) site metadata and behaviour
3. Understand the [layout system](https://nuartz.vercel.app/docs/layout)
4. [Build and preview](https://nuartz.vercel.app/docs/building) the site locally
5. [Deploy](https://nuartz.vercel.app/docs/hosting) to GitHub Pages, Vercel, or your own server

## Features

- [Wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) and [backlinks](https://nuartz.vercel.app/docs/features/backlinks) for interconnected notes
- [Interactive graph view](https://nuartz.vercel.app/docs/features/graph-view) showing relationships between notes
- [Callouts](https://nuartz.vercel.app/docs/features/callouts), [syntax highlighting](https://nuartz.vercel.app/docs/features/syntax-highlighting), [LaTeX](https://nuartz.vercel.app/docs/features/latex), [Mermaid diagrams](https://nuartz.vercel.app/docs/features/mermaid)
- [Full-text search](https://nuartz.vercel.app/docs/features/search) powered by Pagefind (Cmd+K, CJK-aware)
- [Table of contents](https://nuartz.vercel.app/docs/features/table-of-contents), [breadcrumbs](https://nuartz.vercel.app/docs/features/breadcrumbs), [recent notes](https://nuartz.vercel.app/docs/features/recent-notes)
- [RSS feed](https://nuartz.vercel.app/docs/features/rss-feed), [social images](https://nuartz.vercel.app/docs/features/social-images), [popover previews](https://nuartz.vercel.app/docs/features/popover-previews)
- [Dark mode](https://nuartz.vercel.app/docs/features/dark-mode) with system preference detection
- [Reader mode](https://nuartz.vercel.app/docs/features/reader-mode) for distraction-free reading
- [Comments](https://nuartz.vercel.app/docs/features/comments) via Giscus
- [Draft / private pages](https://nuartz.vercel.app/docs/features/private-pages) filtering

For a full list, visit the [features page](https://nuartz.vercel.app/docs/features/index).

## Architecture

Nuartz is split into two packages:

| Package | Description |
|---------|-------------|
| `packages/nuartz` | Headless data library - markdown parsing, wikilinks, backlinks, search index |
| `apps/web` | Next.js 16 starter template with shadcn/ui |

Read more on the [architecture](https://nuartz.vercel.app/docs/advanced/architecture) page or explore [creating plugins](https://nuartz.vercel.app/docs/advanced/creating-plugins).
