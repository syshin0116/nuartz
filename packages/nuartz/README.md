# @quartz-nextjs/core

Core Quartz plugins and utilities for Next.js integration.

## Installation

```bash
bun add @quartz-nextjs/core
```

## Usage

### With Next.js MDX

```typescript
// next.config.ts
import createMDX from '@next/mdx'
import { createNextMDXOptions } from '@quartz-nextjs/core'
import quartzConfig from './quartz.config'

const withMDX = createMDX({
  options: createNextMDXOptions(quartzConfig)
})

export default withMDX(nextConfig)
```

### Direct Parsing

```typescript
import { parseObsidianMarkdown } from '@quartz-nextjs/core'

const result = await parseObsidianMarkdown(markdown, quartzConfig)
```

## Quartz Plugins

This package includes all Quartz transformer plugins:

- `ObsidianFlavoredMarkdown` - Wikilinks, callouts, embeds, etc.
- `GitHubFlavoredMarkdown` - Tables, strikethrough, etc.
- `SyntaxHighlighting` - Code highlighting with Shiki
- `Latex` - Math rendering with KaTeX/MathJax
- `TableOfContents` - Auto-generated TOC
- And 8 more...

## Syncing with Upstream Quartz

This package syncs with the official Quartz repository:

```bash
cd ../../
bun run sync-quartz
```

## License

MIT
