---
title: Configuration
date: 2026-03-01
tags:
  - nuartz
  - configuration
description: Reference for nuartz.config.ts — all available options for configuring your digital garden.
---

nuartz is configured through `nuartz.config.ts` in your project root. If your editor has TypeScript support, it will warn you about configuration errors as you type.

> [!tip]
> Use a TypeScript-aware editor like VS Code for autocomplete and validation.

## Full Config Reference

```typescript title="nuartz.config.ts"
import path from "node:path"
import { defineConfig } from "nuartz"

export default defineConfig({
  contentDir: path.join(process.cwd(), "content"),
  site: {
    title: "My Garden",
    description: "My personal notes",
    baseUrl: "https://example.com",
  },
  features: {
    wikilinks: true,
    callouts: true,
    tags: true,
    backlinks: true,
    toc: true,
    search: true,
    darkMode: true,
  },
  nav: {
    links: [
      { label: "GitHub", href: "https://github.com/user/repo", external: true },
    ],
  },
})
```

## Options

### `contentDir`

Path to the directory containing your Markdown files. Defaults to `content/` in the project root.

### `site`

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Site title, shown in the header and used in RSS/meta tags. |
| `description` | `string` | Site description for SEO and link previews. |
| `baseUrl` | `string` | Canonical URL of your deployed site (used for RSS, sitemap, OG tags). |

### `features`

Toggle individual features on or off:

| Feature | Default | Description |
|---------|---------|-------------|
| `wikilinks` | `true` | [[docs/features/wikilinks\|Wikilink]] syntax support (`[[note]]`). |
| `callouts` | `true` | [[docs/features/callouts\|Obsidian-style callouts]] (`> [!type]`). |
| `tags` | `true` | Tag pages and inline `#tag` support. |
| `backlinks` | `true` | Show which notes link to the current page. |
| `toc` | `true` | Auto-generated table of contents from headings. |
| `search` | `true` | Full-text search with Cmd+K / Ctrl+K. |
| `darkMode` | `true` | Dark/light theme toggle. |

### `nav`

Configure the navigation bar:

```typescript
nav: {
  links: [
    { label: "GitHub", href: "https://github.com/...", external: true },
    { label: "About", href: "/about" },
  ],
}
```

- `label`: Display text for the link.
- `href`: URL (relative for internal, absolute for external).
- `external`: Set `true` to open in a new tab with an external link icon.

> [!note] Hot Reload
> Changes to `nuartz.config.ts` are picked up automatically during development — no restart needed.
