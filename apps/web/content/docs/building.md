---
title: Building Your Site
description: How to build and preview your nuartz digital garden locally.
---

## Development server

Start the dev server with hot reload:

```bash
cd apps/web
bun dev
```

This starts a local Next.js server at `http://localhost:3000/`. Changes to content files and code are reflected immediately.

## Production build

To create an optimized production build:

```bash
cd apps/web
bun build
```

This generates static output in `apps/web/.next/`. You can preview the production build locally:

```bash
cd apps/web
bun start
```

## Content directory

Your markdown files go in `apps/web/content/`. The file structure maps directly to URL paths:

```
content/
  index.md          → /
  docs/
    getting-started.md  → /docs/getting-started
    features/
      wikilinks.md      → /docs/features/wikilinks
```

## What happens during build

1. Next.js discovers all `.md` files in `content/`
2. Each file is processed through the nuartz [[architecture|markdown pipeline]]
3. Frontmatter, HTML, table of contents, links, and tags are extracted
4. Pages are rendered as static HTML with React hydration

For deployment options, see [[deployment]] and [[hosting]].
