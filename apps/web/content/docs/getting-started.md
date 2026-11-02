---
order: 1
title: Getting Started
date: 2026-03-01
tags:
  - nuartz
  - setup
description: How to set up nuartz and start publishing your digital garden.
---

> [!info] Prerequisites
> - [Node.js](https://nodejs.org/) 22.12 or later
> - [bun](https://bun.sh/) package manager

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install
```

## Development

Start the dev server from the repository root:

```bash
bun dev
```

This runs `bun run generate` once and then starts Next.js. Your garden is now live at `http://localhost:3000`.

> [!note] No content watcher
> Code changes hot-reload, but notes and `nuartz.config.ts` are read by `generate`. After editing them, run `bun run generate` again or restart `bun dev`.

## Adding Content

All content lives in `apps/web/content/` as Markdown files. The home page is `apps/web/content/index.md`.

```
apps/web/content/
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

Edit `apps/web/nuartz.config.ts` to customize your garden. See [[docs/configuration|Configuration]] for all available options.

## Building for Production

```bash
bun run build
```

This builds the `nuartz` package, runs `generate`, and runs `next build`. Preview it with `bun run --cwd apps/web start`.

## Deploying

Nuartz can be deployed two ways:

- **GitHub Pages** - free static hosting. `bun run build:static` writes a static site to `apps/web/out`, and the included GitHub Actions workflow (run manually from the **Actions** tab) builds and deploys it. No `next.config.ts` edits are needed.
- **Vercel** - free tier with full features (dynamic OG images, external link previews). Import the repo and deploy in one click.

See [[docs/hosting|Hosting]] for step-by-step instructions and a full comparison of what each mode supports.

> [!tip] Next Steps
> - [[docs/authoring-content|Learn how to write content]]
> - [[docs/features/wikilinks|Link notes with wikilinks]]
> - [[docs/features/callouts|Use callouts to highlight information]]
