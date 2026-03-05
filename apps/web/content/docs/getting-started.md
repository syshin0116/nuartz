---
title: Getting Started
date: 2026-03-01
tags:
  - nuartz
  - setup
description: How to set up nuartz and start publishing your digital garden.
---

> [!info] Prerequisites
> - [Node.js](https://nodejs.org/) v18 or later
> - [bun](https://bun.sh/) package manager

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install
```

## Development

Start the dev server with hot reload:

```bash
bun dev
```

Your garden is now live at `http://localhost:3000`.

## Adding Content

All content lives in the `content/` directory as Markdown files. The home page is `content/index.md`.

```
content/
  index.md          # Home page
  docs/
    getting-started.md
    authoring-content.md
  notes/
    my-first-note.md
```

Each file needs [[docs/authoring-content#Frontmatter|frontmatter]] at the top:

```yaml
---
title: My Note
date: 2026-03-01
tags:
  - example
description: A short description for link previews.
---
```

## Configuration

Edit `nuartz.config.ts` in the project root to customize your garden. See [[docs/configuration|Configuration]] for all available options.

## Building for Production

```bash
bun run build
```

## Deploying

The easiest way to deploy is with [Vercel](https://vercel.com). Push your repository to GitHub and import it in Vercel — it will auto-detect Next.js and deploy.

> [!tip] Next Steps
> - [[docs/authoring-content|Learn how to write content]]
> - [[docs/features/wikilinks|Link notes with wikilinks]]
> - [[docs/features/callouts|Use callouts to highlight information]]
