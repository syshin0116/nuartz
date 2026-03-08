---
title: Philosophy
description: Why nuartz exists and who it's for.
---

## Why another Obsidian publisher?

[Quartz](https://quartz.jzhao.xyz) proved that publishing Obsidian vaults as websites works. It's a great tool. But Quartz is a static site generator with its own templating system — when you want to change the UI beyond what the theme allows, you're fighting the tool instead of building with it.

Nuartz takes a different bet: **what if the "Obsidian to website" pipeline was just a library, and the site was a normal Next.js app?**

That means you get React components, shadcn/ui, Tailwind CSS, the entire npm ecosystem, and every Next.js feature — server components, ISR, API routes, middleware. No custom templating language, no plugin API to learn. If you know Next.js, you already know how to customise Nuartz.

## Two layers

Nuartz is split into a library and a starter template:

- **`nuartz` (npm package)** — the data layer. Parses Obsidian markdown, resolves wikilinks, builds backlink graphs, generates search indices. Ships zero UI. You can `bun add nuartz` and wire it into any Next.js app.
- **`apps/web` (starter template)** — a complete Next.js 15 app using shadcn/ui. Sidebar, graph view, search, dark mode, OG images, comments — all included. Clone it, drop in your markdown, deploy.

Most people start with the starter template and customise from there. If you have an existing Next.js app (portfolio, blog, docs site), install the package and integrate only what you need.

## Hosting

Nuartz supports both server-side (Vercel, Netlify) and fully static (GitHub Pages) deployment:

- **Vercel/Netlify** — full feature set including server-side OG images and API routes
- **GitHub Pages** — enable `output: "export"` in `next.config.ts` and deploy with GitHub Actions. Graph view, search, and popover previews all work via pre-generated static data.

## Who is this for?

**Obsidian users who know some React** — or want to learn. Nuartz doesn't hide complexity behind abstractions. It exposes a straightforward Next.js app that you can read, understand, and modify.

**Next.js developers who write in Obsidian** — if you already have a Next.js project and want to add a blog or knowledge base with Obsidian compatibility, `bun add nuartz` is all you need.

**People who outgrew their SSG** — if you've hit the ceiling of Hugo, Jekyll, or Quartz's customisation and wish you could just use React, Nuartz is that option.

## Quartz vs Nuartz

| | Quartz | Nuartz (package) | Nuartz (starter) |
|---|--------|--------|--------|
| Type | SSG (fork & deploy) | npm library | Next.js app (clone & deploy) |
| UI | Built-in theme | None — bring your own | shadcn/ui included |
| GitHub Pages | Supported | Supported | Supported (static export) |
| Customisation | Plugin API | Any React component | Modify components directly |

Choose Quartz for a quick, opinionated setup. Choose Nuartz when you want full control over your site's UI and behaviour.
