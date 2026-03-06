# Nuartz

> Obsidian-compatible digital garden built on Next.js + shadcn/ui

Nuartz turns your Obsidian vault into a modern web app — wikilinks, callouts, backlinks, graph view, and all — without compromising on UI quality.

Inspired by [Quartz](https://quartz.jzhao.xyz) — jackyzha0's excellent Obsidian-to-web tool. Quartz pioneered the OFM (Obsidian Flavored Markdown) parsing approach: wikilinks, callouts, backlinks, and graph view. Nuartz takes that foundation and rebuilds it as a composable remark/rehype plugin set that plugs into a modern Next.js + shadcn/ui stack.

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
| Graph view (D3 force-directed) | ✅ |
| Popover previews on hover | ✅ |
| Reader mode | ✅ |
| Comments (Giscus) | ✅ |
| Dead link detection | ✅ |
| Draft / private page filtering | ✅ |
| AI chat (LangGraph) | 🔜 |

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Markdown | unified / remark / rehype |
| Graph | D3 force-directed |
| Runtime | Bun |

## Getting Started

```bash
git clone https://github.com/syshin0116/nuartz
cd nuartz
bun install
bun dev
```

Put your Obsidian markdown files in `apps/web/content/` and start the dev server.

## Configuration

Edit `apps/web/nuartz.config.ts`:

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

## Using as a Package

If you want to embed a blog/garden into an existing Next.js app (e.g. a portfolio), install nuartz as a dependency instead of cloning the full repo:

```bash
bun add nuartz
```

Then use the API directly in your app:

```typescript
import { renderMarkdown, buildBacklinkIndex, buildSearchIndex } from "nuartz"
```

### Updating

When a new version of nuartz is released:

```bash
bun update nuartz
```

Check the [releases](https://github.com/syshin0116/nuartz/releases) page for changelogs before updating.

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

## Deployment

### Vercel (recommended)

Nuartz is a monorepo — the Next.js app lives in `apps/web`. Override these settings when importing to Vercel:

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Install Command | `cd ../.. && bun install --frozen-lockfile` |
| Build Command | `cd ../.. && bun run build:pkg && cd apps/web && next build` |

Then add environment variables in Vercel's dashboard as needed:

```bash
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app

# Optional: Giscus comments
NEXT_PUBLIC_GISCUS_REPO=your-user/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxx
```

> **Note:** GitHub Pages is not supported — Nuartz uses server-side API routes and Edge runtime features that require Node.js.

See the [full hosting guide](apps/web/content/docs/hosting.md) for Netlify and Docker options.

## Comments

Nuartz ships with [Giscus](https://giscus.app) (GitHub Discussions-based comments). It requires no backend and takes ~5 minutes to set up. See [features/comments](apps/web/content/docs/features/comments.md).

**Alternatives by use case:**

| System | Best for | Backend needed |
|--------|----------|---------------|
| [Giscus](https://giscus.app) | Dev/tech audience (GitHub login) | No |
| [Waline](https://waline.js.org) | General audience (anonymous ok) | Yes (Vercel + DB) |
| [Remark42](https://remark42.com) | Privacy-first, multiple social logins | Yes (Docker) |
| [Cusdis](https://cusdis.com) | Minimal, anonymous, no-login | Yes (self-host) |

## License

MIT
