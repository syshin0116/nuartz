# quartz-nextjs

Next.js integration for [Quartz](https://github.com/jackyzha0/quartz) - Build Obsidian-compatible digital gardens with Next.js and shadcn/ui.

> **Status**: 🚧 Early Development

## Features

- ✅ **Full Obsidian Compatibility**: Wikilinks, callouts, block references, embeds
- ✅ **All Quartz Plugins**: 13 transformers, 2 filters, full markdown processing
- ✅ **Auto-sync with Quartz**: Stay up-to-date with upstream Quartz features
- ✅ **Next.js App Router**: Modern React Server Components
- ✅ **shadcn/ui**: Beautiful, accessible UI components
- ✅ **TypeScript**: Full type safety

## Packages

- `@quartz-nextjs/core` - Core Quartz plugins and utilities
- `@quartz-nextjs/react` - React components (Search, Graph, Explorer, etc.)
- `@quartz-nextjs/shadcn` - shadcn/ui styled components

## Quick Start

```bash
bun install @quartz-nextjs/core
```

```typescript
// app/blog/[...slug]/page.tsx
import { parseObsidianMarkdown } from '@quartz-nextjs/core'

export default async function BlogPost({ params }) {
  const content = await parseObsidianMarkdown(params.slug)
  return <div>{content}</div>
}
```

## Development

```bash
# Clone Quartz and sync plugins
bun run sync-quartz

# Run example
bun run dev

# Build all packages
bun run build
```

## Sync with Upstream Quartz

This project automatically syncs with the latest Quartz release:

```bash
bun run sync-quartz
```

## License

MIT - See [LICENSE](LICENSE)

Includes code from [Quartz](https://github.com/jackyzha0/quartz) (MIT)
