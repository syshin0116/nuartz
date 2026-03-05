---
title: Welcome to nuartz
date: 2026-03-01
tags:
  - nuartz
  - getting-started
description: nuartz is a Next.js + shadcn/ui digital garden that renders Obsidian-flavored markdown beautifully.
---

> [!info] What is nuartz?
> **nuartz** = **N**ext.js + Q**uartz**. A digital garden built on Next.js + shadcn/ui that renders your Obsidian notes as a beautiful website.

## Get Started

1. [[docs/getting-started|Installation & Setup]]
2. [[docs/authoring-content|Writing Content]]
3. [[docs/configuration|Configuration]]

## Features

- [[docs/features/wikilinks|Wikilinks]] — `[[note]]` syntax for linking notes
- [[docs/features/callouts|Callouts]] — Obsidian-style callout blocks
- [[docs/features/syntax-highlighting|Syntax Highlighting]] — Beautiful code blocks with Shiki
- [[docs/features/mermaid|Mermaid Diagrams]] — Render diagrams from code
- [[docs/features/graph-view|Graph View]] — Visualize note connections
- Backlinks, Table of Contents, Full-text search (Cmd+K)

> [!tip] Quick Start
> Drop your `.md` files in the `content/` directory and run `bun dev`. That's it.

## Why nuartz?

| Feature | nuartz | Static generators |
|---------|--------|-------------------|
| Framework | Next.js (React) | Hugo / 11ty / custom |
| Styling | shadcn/ui + Tailwind | Custom CSS |
| Obsidian syntax | Full support | Partial |
| Search | Built-in (Cmd+K) | Requires plugins |
| Dark mode | Built-in | Varies |
| Deployment | Vercel, one click | Manual setup |

## Math Example

Inline math: $E = mc^2$

Block math:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
