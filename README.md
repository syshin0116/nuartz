# nuartz

> Obsidian-compatible digital garden built on Next.js + shadcn/ui

nuartz turns your Obsidian vault into a modern web app — wikilinks, callouts, backlinks, and all — without compromising on UI quality.

[Quartz](https://quartz.jzhao.xyz) is an excellent Obsidian-to-web tool with deep OFM support. nuartz is built on the same parsing foundation — wikilinks, callouts, backlinks — but packages it as a composable remark/rehype plugin set that plugs into any Next.js app.

## Features

| Feature | Status |
|---------|--------|
| Wikilinks `[[page]]`, `[[page\|alias]]`, `[[page#heading]]` | ✅ |
| Callouts `> [!note]`, `> [!warning]+` (foldable) | ✅ |
| Inline tags `#tag` → `/tags/tag` | ✅ |
| Backlink index | ✅ |
| Table of contents (scroll-aware) | ✅ |
| Full-text search (Cmd+K) | ✅ |
| Tag index pages (`/tags`, `/tags/[tag]`) | ✅ |
| Dark mode (system-aware) | ✅ |
| Mobile navigation drawer | ✅ |
| Dynamic OG images | ✅ |
| Math (KaTeX) | ✅ |
| GFM (tables, strikethrough, task lists) | ✅ |
| Graph view | 🔜 |
| AI chat (LangGraph) | 🔜 |

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Markdown | unified / remark / rehype |
| Runtime | Bun |

## Getting Started

```bash
git clone https://github.com/syshin0116/nuartz
cd nuartz
bun install
bun dev
```

Put your Obsidian markdown files in `apps/www/content/` and start the dev server.

## Configuration

Edit `apps/www/nuartz.config.ts`:

```typescript
import { defineConfig } from "nuartz"

export default defineConfig({
  contentDir: "./content",
  site: {
    title: "My Garden",
    description: "My digital garden",
    baseUrl: "https://your-site.vercel.app",
  },
  features: {
    wikilinks: true,
    callouts: true,
    backlinks: true,
    search: true,
  },
})
```

## Package API

```typescript
import {
  renderMarkdown,      // string → { html, frontmatter, toc, links, tags }
  buildBacklinkIndex,  // build slug → backlinks map
  buildFileTree,       // flat file list → nested tree
  buildSearchIndex,    // files → search-ready entries
  defineConfig,        // typed config helper
} from "nuartz"
```

## Wikilink Syntax

```markdown
[[page]]              → link to page
[[page|Custom Title]] → link with alias
[[page#heading]]      → link with anchor
![[image.png]]        → embed image
```

## Callout Syntax

```markdown
> [!note]
> A simple note callout.

> [!warning]+ Optional foldable title
> This callout is foldable with +.

> [!tip]- Collapsed by default
> Use - to start collapsed.
```

## License

MIT
