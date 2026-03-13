---
title: Nuartz
date: 2026-03-01
tags:
  - nuartz
  - getting-started
description: Publish your Obsidian vault as a Next.js website. Full wikilink support, graph view, and shadcn/ui — deploy to Vercel or GitHub Pages.
---

# Publish your Obsidian vault as a Next.js website.

**Nuartz** = **N**ext.js + Q**uartz**. Write in Obsidian, publish with Next.js 15 + shadcn/ui + Tailwind CSS v4. Full wikilink support, graph view, and every component is swappable.

> [!tip] You're looking at it
> This documentation site is built with Nuartz. The sidebar, search (`Cmd+K`), graph view, dark mode, wikilinks — everything you see here is Nuartz. Go ahead, explore.

## Quick Start

```bash
git clone https://github.com/syshin0116/nuartz
cd nuartz
bun install
bun dev
```

Drop your Obsidian markdown files into `apps/web/content/` and open `http://localhost:3000`.

See [[docs/getting-started|Installation & Setup]] for details →

## Features

### Full Obsidian Syntax

- [[docs/features/wikilinks|Wikilinks]] — `[[note]]`, `[[note|alias]]`, `[[note#heading]]` with dead link detection
- [[docs/features/callouts|Callouts]] — `> [!note]`, `> [!warning]+` with foldable support
- [[docs/features/graph-view|Graph View]] — D3 force-directed graph visualizing note connections
- [[docs/features/backlinks|Backlinks]] & [[docs/features/popover-previews|Popover Previews]] — navigate your vault like in Obsidian

### Developer Features

- [[docs/features/search|Full-text Search]] — `Cmd+K`, FlexSearch-powered, CJK-aware
- [[docs/features/syntax-highlighting|Syntax Highlighting]] — VS Code-quality code blocks via Shiki
- [[docs/features/social-images|Dynamic OG Images]] — auto-generated social cards per page
- [[docs/features/rss-feed|RSS Feed]], [[docs/features/table-of-contents|TOC]], [[docs/features/reader-mode|Reader Mode]], [[docs/features/comments|Comments (Giscus)]]

### Built on shadcn/ui

Every UI component is built with shadcn/ui. Grab any component from [ui.shadcn.com](https://ui.shadcn.com) and drop it in. No theme constraints — customize at the React component level.

## Why Nuartz?

Heavily inspired by [Quartz](https://github.com/jackyzha0/quartz). Nuartz borrows many of Quartz's ideas — Obsidian parsing, graph visualization, overall UX — and reimplements them on top of the Next.js + React ecosystem.

|  | Nuartz | Static generators |
|--|--------|-------------------|
| **Framework** | Next.js 15 (App Router) | Custom templating |
| **UI** | shadcn/ui + Tailwind v4 | Built-in themes |
| **Obsidian syntax** | Full (wikilinks, callouts, tags, graph) | Partial / plugin-dependent |
| **Customization** | Any React component | Plugin API / theme overrides |
| **Hosting** | GitHub Pages, Vercel, Netlify, Docker | GitHub Pages, Netlify |

## Documentation

1. [[docs/getting-started|Installation & Setup]]
2. [[docs/authoring-content|Writing Content]]
3. [[docs/configuration|Configuration]]
4. [[docs/hosting|Deploying]]
