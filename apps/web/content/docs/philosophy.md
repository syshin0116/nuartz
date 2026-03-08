---
title: Philosophy
description: The design principles behind nuartz.
---

nuartz is built on the idea that your notes deserve to be shared -- easily, beautifully, and on your own terms.

## How is this different from Quartz?

Nuartz is heavily inspired by [Quartz](https://quartz.jzhao.xyz), which pioneered the idea of publishing Obsidian vaults as polished websites. If Quartz works for you, it's a great tool.

Nuartz takes a different approach:

**Quartz** is a full static site generator — you fork the repo, drop in markdown, and get static HTML. GitHub Pages works great because there's no server involved. The UI is opinionated and you customise it within Quartz's own system.

**Nuartz** is split into two layers:

- **`nuartz` (the npm package)** — a headless data library. It handles Obsidian markdown → HTML, file tree, wikilink graph, search index, and backlinks. No UI is included. You wire it into any Next.js app you like.
- **`apps/web` (the starter template)** — a reference Next.js app built on top of the library, using shadcn/ui components, pre-built sidebar, graph view, search, and more. You can clone and deploy it as-is, or use it as a starting point and replace whatever you want.

So when we say "headless," we mean the *library* ships zero UI — but the repo also includes an opinionated starter template for those who want a head start. The distinction matters depending on how you want to use it:

- **`npm install nuartz`** → pure data layer, bring your own UI
- **Clone the repo** → get the library + a full starter app with UI included

The tradeoff with the starter template is that it uses server-side API routes for search, so it needs a Node.js host (Vercel, Railway, etc.) by default. If you don't need server-side search, `output: 'export'` is possible and GitHub Pages becomes an option.

| | Quartz | Nuartz (package) | Nuartz (starter template) |
|---|--------|--------|--------|
| Type | SSG app (clone & deploy) | npm library | Next.js app (clone & deploy) |
| UI | Opinionated theme | None — bring your own | shadcn/ui components included |
| GitHub Pages | ✅ | ✅ | ⚠️ Requires static export mode |
| Customisation | Quartz plugin system | Any Next.js component | Modify components directly |

Choose Quartz for simplicity and static hosting. Choose Nuartz (package) to embed into an existing Next.js app with full UI control. Choose Nuartz (starter) for a ready-to-deploy garden with sensible defaults you can override.

## A true hypertext

Thinking is not linear or hierarchical. nuartz embraces the networked, rhizomatic nature of thought by making it easy to link notes together and discover unexpected connections through features like the graph view, backlinks, and wikilinks.

Rather than forcing your notes into rigid folder structures, nuartz lets ideas connect organically.

## Sharing should be effortless

A digital garden is most valuable when it's shared. nuartz is designed to turn your Obsidian vault (or any collection of Markdown files) into a polished website with minimal configuration. Write your notes, push to Git, and your site updates automatically.

## Your garden, your rules

nuartz provides sensible defaults that look good out of the box, but every layer is customizable:

1. **Content only** -- just edit your Markdown files and frontmatter
2. **Configuration** -- tweak layout, plugins, and components through config files
3. **Source code** -- modify components, styles, and build behavior directly

The right tool should feel powerful without being overwhelming. nuartz aims to give you full control while keeping the simple things simple.
