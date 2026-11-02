# Configuration

> Reference for apps/web/nuartz.config.ts and all available digital garden options.

The starter is configured through `apps/web/nuartz.config.ts`. If your editor has TypeScript support, it will warn you about configuration errors as you type.

> [!tip]
> Use a TypeScript-aware editor like VS Code for autocomplete and validation.

## Full Config Reference

```typescript title="nuartz.config.ts"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "nuartz"

export default defineConfig({
  contentDir: path.join(path.dirname(fileURLToPath(import.meta.url)), "content"),
  homePage: "index",          // "index" | "recent"
  site: {
    title: "My Garden",
    description: "My personal notes",
    baseUrl: process.env.NUARTZ_SITE_URL ?? "https://example.com",
    locale: "en",
    verification: { google: "..." },
  },
  theme: { defaultMode: "system" },   // "system" | "light" | "dark"
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

> [!note] Changes need `generate`
> `bun run generate` reads the config and content. There is no file watcher: after changing `nuartz.config.ts` or notes, run `bun run generate` again or restart `bun dev`.

## Options

### `contentDir`

Absolute path to the Markdown content directory. `generate` reads this value directly; it has no implicit default.

### `site`

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Site title, shown in the header and used in RSS, `llms.txt`, and meta tags. |
| `description` | `string` | Site description for SEO, RSS, and `llms.txt`. |
| `baseUrl` | `string` | Full public URL, including any sub-path (e.g. `https://user.github.io/repo`). Used for canonical URLs, sitemap, RSS, OG tags, `llms.txt`, and the MCP server. Default `http://localhost:3000`. The starter reads `NUARTZ_SITE_URL` first. |
| `locale` | `string` | Language code for `<html lang>`, the RSS `<language>`, and the Pagefind search index. Default `en`. |
| `verification` | `{ google?: string; yandex?: string }` | Search engine ownership tokens, rendered as `<meta>` verification tags. |

### `homePage`

Controls what is shown at `/`:

| Value | Behaviour |
|-------|-----------|
| `"index"` (default) | Renders `content/index.md` as a normal page. Falls back to recent notes if the file doesn't exist. |
| `"recent"` | Shows recent notes, newest first, 10 per page. |

### `theme`

`defaultMode` sets the colour scheme before the reader picks one: `"system"` (default), `"light"`, or `"dark"`. See [Dark Mode](https://nuartz.vercel.app/docs/features/dark-mode).

### `features`

Toggle individual features on or off. All default to `true`.

| Feature | Description |
|---------|-------------|
| `wikilinks` | Wikilink syntax (`[[note]]`), embeds, and Markdown links to notes. |
| `callouts` | Obsidian-style callouts (`> [!type]`). |
| `tags` | Inline `#tag` support, tag badges, and the `/tags` pages. |
| `backlinks` | The **Linked from** panel on each note. |
| `toc` | Table of contents from headings. |
| `search` | Cmd+K / Ctrl+K search and its indexes. |
| `darkMode` | Dark/light theme toggle. When `false`, the site is always light. |

### `markdown`

[`RenderOptions`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/types.ts) passed to `renderMarkdown()` by `generate`. Values here override the starter's `resolveLink`, `resolveAsset`, and `resolveTag`, and `markdown.features` overrides `features`. The starter keeps control of `baseUrl`, `knownSlugs`, `filePath`, `resolveEmbed`, and `renderBase` so routing, embeds, and Bases keep working.

### `nav`

Configure the header links:

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
- `external`: Set `true` to open the link in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).
