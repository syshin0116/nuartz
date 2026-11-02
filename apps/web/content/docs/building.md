---
order: 6
title: Building Your Site
description: How to build and preview your nuartz digital garden locally.
---

## Development server

Start the dev server from the repository root:

```bash
bun dev
```

This runs `bun run generate` and then starts Next.js at `http://localhost:3000/`. Code changes hot-reload. Content and `nuartz.config.ts` changes do not: there is no file watcher, so run `bun run generate` again (or restart `bun dev`) to see them.

## Production build

To create an optimized production build, run from the repository root:

```bash
bun run build
```

This builds the `nuartz` package, runs `generate`, and runs `next build`, writing to `apps/web/.next/`. Preview it locally:

```bash
bun run --cwd apps/web start
```

For a static site in `apps/web/out`, use `bun run build:static` instead. See [[hosting]].

## Content directory

Your markdown files go in `apps/web/content/`. The file structure maps directly to URL paths:

```
apps/web/content/
  index.md          → /
  docs/
    getting-started.md  → /docs/getting-started
    features/
      wikilinks.md      → /docs/features/wikilinks
```

## What happens during build

1. `bun run generate` (`scripts/prebuild.ts`) reads every published `.md` file in `apps/web/content/`
2. Each file is processed through the nuartz [[architecture|markdown pipeline]]
3. HTML, table of contents, links, tags, backlinks, the graph, search indexes, and portable Markdown are written to `apps/web/.generated/` and `apps/web/public/`
4. `next build` renders pages as static HTML from that generated data

For deployment options, see [[deployment]] and [[hosting]].
