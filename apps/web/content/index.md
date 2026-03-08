---
title: Welcome to Nuartz
date: 2026-03-01
tags:
  - nuartz
  - getting-started
description: Publish your Obsidian vault as a Next.js website. Full wikilink support, graph view, and shadcn/ui — deploy to Vercel or GitHub Pages.
---

> [!info] What is Nuartz?
> **Nuartz** = **N**ext.js + Q**uartz**. A library and starter template that turns your Obsidian vault into a Next.js website with full wikilink support, interactive graph view, and shadcn/ui components.

## Get Started

1. [[docs/getting-started|Installation & Setup]]
2. [[docs/authoring-content|Writing Content]]
3. [[docs/configuration|Configuration]]
4. [[docs/hosting|Deploying]]

## Features

- [[docs/features/wikilinks|Wikilinks]] — `[[note]]` syntax with dead link detection
- [[docs/features/callouts|Callouts]] — Obsidian-style callout blocks with icons
- [[docs/features/graph-view|Graph View]] — Interactive D3 force-directed graph of note connections
- [[docs/features/syntax-highlighting|Syntax Highlighting]] — VS Code-quality code blocks via Shiki
- [[docs/features/search|Full-text Search]] — Instant search with Cmd+K
- [[docs/features/backlinks|Backlinks]], [[docs/features/table-of-contents|TOC]], [[docs/features/popover-previews|Popover Previews]], [[docs/features/reader-mode|Reader Mode]]
- [[docs/features/rss-feed|RSS Feed]], [[docs/features/social-images|OG Images]], [[docs/features/comments|Comments (Giscus)]]

## Why Nuartz?

| | Nuartz | Static generators (Hugo, Quartz, Jekyll) |
|--|--------|-------------------|
| Framework | Next.js 15 (App Router) | Custom templating |
| UI | shadcn/ui + Tailwind v4 | Built-in themes |
| Obsidian syntax | Full (wikilinks, callouts, tags, graph) | Partial / plugin-dependent |
| Customisation | Any React component | Plugin API / theme overrides |
| Hosting | GitHub Pages, Vercel, Netlify, Docker | GitHub Pages, Netlify |
