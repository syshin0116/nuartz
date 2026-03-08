# Nuartz

**Publish your Obsidian vault as a Next.js website.** Nuartz parses Obsidian-flavored markdown (wikilinks, callouts, backlinks, tags, math, graph) and gives you a polished site you fully control — because it's just Next.js.

## Who is this for?

- **Obsidian users** who want to publish their vault without giving up wikilinks, callouts, or graph view.
- **Next.js developers** who want a blog or digital garden inside their existing app, not a separate tool.
- **Anyone frustrated by SSG limitations** — you get the React/Next.js ecosystem, shadcn/ui, and Tailwind CSS instead of fighting a static generator's templating system.

## How it works

Nuartz has two layers:

| Layer | What it is | How to use it |
|-------|-----------|---------------|
| **`nuartz` (npm package)** | Headless data library — markdown to HTML, file tree, wikilinks, backlinks, search index | `bun add nuartz` and wire into any Next.js app |
| **`apps/web` (starter template)** | Complete Next.js 15 app with shadcn/ui, sidebar, graph view, search, dark mode | Clone the repo and deploy |

Most people start with the starter template. If you want to embed a garden into an existing Next.js app, use the package directly.

## Nuartz vs Quartz

|                  | Quartz                              | Nuartz                                      |
|------------------|-------------------------------------|---------------------------------------------|
| **What it is**   | SSG app (fork & deploy)             | npm library + Next.js starter app           |
| **UI**           | Built-in theme                      | shadcn/ui (swap any component)              |
| **Hosting**      | GitHub Pages, Cloudflare, Netlify   | GitHub Pages, Vercel, Netlify, Docker       |
| **GitHub Pages** | First-class                         | Supported (static export mode)              |
| **Search**       | Client-side                         | Client-side (CJK-aware)                     |
| **Customisation**| Quartz plugin API                   | Any Next.js component, no constraints       |

**Choose Quartz** if you want a site running in minutes and you're happy with its design system.

**Choose Nuartz** if you want full UI control with React components, need to embed into an existing Next.js app, or prefer working in the Next.js ecosystem.

## Features

| Feature | Status |
|---------|--------|
| Wikilinks `[[page]]`, `[[page\|alias]]`, `[[page#heading]]` | Done |
| Callouts `> [!note]`, `> [!warning]+` (foldable) | Done |
| Inline tags `#tag` with tag index pages | Done |
| Backlink index | Done |
| Table of contents (scroll-aware) | Done |
| Full-text search (Cmd+K) | Done |
| Dark mode (system-aware) | Done |
| Graph view (D3 force-directed) | Done |
| Popover previews on hover | Done |
| Dynamic OG images | Done |
| Math (KaTeX) | Done |
| GFM (tables, strikethrough, task lists) | Done |
| Reader mode | Done |
| Comments (Giscus) | Done |
| Draft / private page filtering | Done |
| GitHub Pages deployment | Done |
| Dead link detection | Done |

## Quick Start

```bash
git clone https://github.com/syshin0116/nuartz
cd nuartz
bun install
bun dev
```

Put your Obsidian markdown files in `apps/web/content/` and open `http://localhost:3000`.

## Deploying

### Vercel (recommended)

Import the repo in Vercel with these overrides:

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Install Command | `cd ../.. && bun install --frozen-lockfile` |
| Build Command | `cd ../.. && bun run build:pkg && cd apps/web && next build` |

### GitHub Pages

Nuartz supports static export for GitHub Pages. Enable `output: "export"` in `next.config.ts`, then use the included GitHub Actions workflow (`.github/workflows/deploy-pages.yml`). The prebuild script generates static data for graph view and popover previews automatically.

See the [hosting guide](apps/web/content/docs/hosting.md) for Netlify, Docker, and other options.

## Using as a Package

```bash
bun add nuartz
```

```typescript
import {
  renderMarkdown,      // string -> { html, frontmatter, toc, links, tags }
  buildBacklinkIndex,  // build slug -> backlinks map
  buildFileTree,       // flat file list -> nested tree
  buildSearchIndex,    // files -> search-ready entries
  defineConfig,        // typed config helper
} from "nuartz"
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Markdown | unified / remark / rehype |
| Graph | D3 force-directed |
| Runtime | Bun |

## Showcase

| Site | Description |
|------|-------------|
| [syshin0116.vercel.app/blog](https://syshin0116.vercel.app/blog) | Personal blog and digital garden |

## License

MIT
