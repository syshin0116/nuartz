# nuartz

Build-time utilities for publishing Obsidian Markdown in a JavaScript or TypeScript application.

The package reads notes, resolves wikilinks, renders Markdown, builds backlinks and search data, and ships the prose styles used by the Nuartz starter. It does not include React components or routes.

## Install

```bash
bun add nuartz
```

Use the filesystem APIs during a build or on the server:

```ts
import {
  buildBacklinkIndex,
  buildFileTree,
  buildSearchIndex,
  createNoteResolver,
  getAllMarkdownFiles,
  noteHref,
} from "nuartz"
import { renderMarkdown } from "nuartz/markdown"

const files = await getAllMarkdownFiles("content")
const resolveNote = createNoteResolver(files)
const knownSlugs = new Set(files.map(file => file.slug))

const rendered = await Promise.all(files.map(async file => ({
  file,
  result: await renderMarkdown(file.raw, {
    filePath: `${file.slug}.md`,
    knownSlugs,
    resolveLink: (target, heading, from) =>
      noteHref(resolveNote(target, from) ?? target, heading),
  }),
})))

const tree = buildFileTree(files)
const search = buildSearchIndex(files)
const backlinks = buildBacklinkIndex(new Map(rendered.map(({ file, result }) =>
  [file.slug, { result, raw: file.raw }],
)))
```

Import the optional content styles once in your application:

```ts
import "nuartz/styles.css"
```

`renderMarkdown()` enables wikilinks, callouts, tags, and table-of-contents extraction by default. Disable only what the host application does not expose:

```ts
await renderMarkdown(markdown, {
  features: { callouts: false, tags: false },
})
```

## Next.js

Diagram rendering runs on the server. Add its native and WASM dependencies to `serverExternalPackages`:

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@beoe/rehype-graphviz",
    "@beoe/rehype-d2",
    "@beoe/rehype-code-hook",
    "@beoe/rehype-code-hook-img",
    "@hpcc-js/wasm",
    "@node-rs/xxhash",
  ],
}

export default nextConfig
```

For a complete Next.js site with routes, navigation, search, and graph views, use the [`apps/web`](https://github.com/syshin0116/nuartz/tree/main/apps/web) starter in the repository.

## Links

- [Documentation and demo](https://nuartz.vercel.app)
- [GitHub](https://github.com/syshin0116/nuartz)
- [Issues](https://github.com/syshin0116/nuartz/issues)

MIT
