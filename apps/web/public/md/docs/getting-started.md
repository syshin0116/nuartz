# Getting Started

> How to set up nuartz and start publishing your digital garden.

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

Each file needs [frontmatter](https://nuartz.vercel.app/docs/authoring-content#frontmatter) at the top:

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

Edit `nuartz.config.ts` in the project root to customize your garden. See [Configuration](https://nuartz.vercel.app/docs/configuration) for all available options.

## Building for Production

```bash
bun run build
```

## Deploying

Nuartz can be deployed two ways:

- **GitHub Pages** - free static hosting. Uncomment `output: "export"` in `next.config.ts` and push. The included GitHub Actions workflow builds and deploys automatically.
- **Vercel** - free tier with full features (dynamic OG images, external link previews). Import the repo and deploy in one click.

See [Hosting](https://nuartz.vercel.app/docs/hosting) for step-by-step instructions and a full comparison of what each mode supports.

> [!tip] Next Steps
> - [Learn how to write content](https://nuartz.vercel.app/docs/authoring-content)
> - [Link notes with wikilinks](https://nuartz.vercel.app/docs/features/wikilinks)
> - [Use callouts to highlight information](https://nuartz.vercel.app/docs/features/callouts)
