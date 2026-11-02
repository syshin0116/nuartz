# Nuartz

> Publish your Obsidian vault as a Next.js website. Full wikilink support, graph view, and shadcn/ui - deploy to Vercel or GitHub Pages.

# Publish your Obsidian vault as a Next.js website.

**Nuartz** = **N**ext.js + Q**uartz**. Write in Obsidian, publish with Next.js 16 + shadcn/ui + Tailwind CSS v4. Full wikilink support, graph view, and every component is swappable.

> [!tip] You're looking at it
> This documentation site is built with Nuartz. The sidebar, search (`Cmd+K`), graph view, dark mode, wikilinks - everything you see here is Nuartz. Go ahead, explore.

<div class="home-actions"><a href="/docs/getting-started">Get started →</a><a href="/docs/authoring-content">Explore syntax</a></div>

## Quick Start

```bash
git clone https://github.com/syshin0116/nuartz
cd nuartz
bun install
bun dev
```

Drop your Obsidian markdown files into `apps/web/content/` and open `http://localhost:3000`.

See [Installation & Setup](https://nuartz.vercel.app/docs/getting-started) for details →

## Features

### Full Obsidian Syntax

- [Wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) - `[[note]]`, `[[note|alias]]`, `[[note#heading]]` with dead link detection
- [Callouts](https://nuartz.vercel.app/docs/features/callouts) - `> [!note]`, `> [!warning]+` with foldable support
- [Graph View](https://nuartz.vercel.app/docs/features/graph-view) - D3 force-directed graph visualizing note connections
- [Backlinks](https://nuartz.vercel.app/docs/features/backlinks) & [Popover Previews](https://nuartz.vercel.app/docs/features/popover-previews) - navigate your vault like in Obsidian

### Developer Features

- [Full-text Search](https://nuartz.vercel.app/docs/features/search): `Cmd+K`, Pagefind-powered, CJK-aware
- [Syntax Highlighting](https://nuartz.vercel.app/docs/features/syntax-highlighting) - VS Code-quality code blocks via Shiki
- [Dynamic OG Images](https://nuartz.vercel.app/docs/features/social-images) - auto-generated social cards per page
- [RSS Feed](https://nuartz.vercel.app/docs/features/rss-feed), [TOC](https://nuartz.vercel.app/docs/features/table-of-contents), [Reader Mode](https://nuartz.vercel.app/docs/features/reader-mode), [Comments (Giscus)](https://nuartz.vercel.app/docs/features/comments)

### Built on shadcn/ui

Every UI component is built with shadcn/ui. Grab any component from [ui.shadcn.com](https://ui.shadcn.com) and drop it in. No theme constraints - customize at the React component level.

## Why Nuartz?

Heavily inspired by [Quartz](https://github.com/jackyzha0/quartz). Nuartz borrows many of Quartz's ideas - Obsidian parsing, graph visualization, overall UX - and reimplements them on top of the Next.js + React ecosystem.

|  | Nuartz | Static generators |
|--|--------|-------------------|
| **Framework** | Next.js 16 (App Router) | Custom templating |
| **UI** | shadcn/ui + Tailwind v4 | Built-in themes |
| **Obsidian syntax** | Full (wikilinks, callouts, tags, graph) | Partial / plugin-dependent |
| **Customization** | Any React component | Plugin API / theme overrides |
| **Hosting** | GitHub Pages, Vercel, Netlify, Docker | GitHub Pages, Netlify |

## Documentation

1. [Installation & Setup](https://nuartz.vercel.app/docs/getting-started)
2. [Writing Content](https://nuartz.vercel.app/docs/authoring-content)
3. [Configuration](https://nuartz.vercel.app/docs/configuration)
4. [Deploying](https://nuartz.vercel.app/docs/hosting)
