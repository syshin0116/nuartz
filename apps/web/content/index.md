---
title: Welcome to Nuartz
date: 2026-03-01
tags:
  - nuartz
  - getting-started
description: Nuartz is a Next.js + shadcn/ui digital garden that renders Obsidian-flavored markdown beautifully.
---

> [!info] What is Nuartz?
> **Nuartz** = **N**ext.js + Q**uartz**. A digital garden template built on Next.js and shadcn/ui that turns your Obsidian notes into a beautiful, interconnected website.

## Get Started

1. [[docs/getting-started|Installation & Setup]]
2. [[docs/authoring-content|Writing Content]]
3. [[docs/configuration|Configuration]]
4. [[docs/hosting|Deploying to Vercel]]

## Features

- [[docs/features/wikilinks|Wikilinks]] — `[[note]]` syntax with dead link detection
- [[docs/features/callouts|Callouts]] — Obsidian-style callout blocks with icons
- [[docs/features/graph-view|Graph View]] — Interactive D3 force-directed graph of note connections
- [[docs/features/syntax-highlighting|Syntax Highlighting]] — VS Code-quality code blocks via Shiki
- [[docs/features/latex|LaTeX]] — Inline and block math with KaTeX
- [[docs/features/mermaid|Mermaid Diagrams]] — Flowcharts and diagrams from code
- [[docs/features/search|Full-text Search]] — Instant search with Cmd+K
- [[docs/features/backlinks|Backlinks]], [[docs/features/table-of-contents|TOC]], [[docs/features/popover-previews|Popover Previews]], [[docs/features/reader-mode|Reader Mode]]
- [[docs/features/rss-feed|RSS Feed]], [[docs/features/social-images|OG Images]], [[docs/features/comments|Comments (Giscus)]]

## Why Nuartz?

| | Nuartz | Static generators |
|--|--------|-------------------|
| Framework | Next.js 15 (App Router) | Hugo / Eleventy / Jekyll |
| UI components | shadcn/ui + Tailwind v4 | Custom CSS |
| Obsidian syntax | Full (wikilinks, callouts, tags) | Partial / plugin-dependent |
| Search | Built-in (Cmd+K) | Requires plugins |
| Graph view | D3 interactive graph | Rare / plugin-dependent |
| Deployment | Vercel one-click | Manual |
