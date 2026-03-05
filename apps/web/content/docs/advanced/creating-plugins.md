---
title: Creating Plugins
description: How to write custom remark and rehype plugins for the nuartz markdown pipeline.
---

> [!warning]
> This guide assumes working knowledge of TypeScript and the [unified](https://unifiedjs.com/) ecosystem.

nuartz uses standard [remark](https://github.com/remarkjs/remark) and [rehype](https://github.com/rehypejs/rehype) plugins. There is no custom plugin abstraction — you write plugins exactly as the unified ecosystem expects.

## Plugin types

- **Remark plugins** transform the Markdown AST ([mdast](https://github.com/syntax-tree/mdast)). They run before the markdown is converted to HTML.
- **Rehype plugins** transform the HTML AST ([hast](https://github.com/syntax-tree/hast)). They run after the markdown-to-HTML conversion.

## Where plugins live

Custom plugins are in `packages/nuartz/src/plugins/`:

| Plugin | Type | Purpose |
|--------|------|---------|
| `callout.ts` | remark | Obsidian-style callout blocks (`> [!note]`) |
| `wikilink.ts` | remark | `[[wikilink]]` syntax support |
| `tag.ts` | remark | Inline `#tag` extraction |
| `highlight.ts` | remark | `==highlight==` syntax |
| `comment.ts` | remark | `%%obsidian comments%%` removal |
| `arrows.ts` | remark | Arrow symbol replacements (`->`, `=>`, etc.) |

## Writing a remark plugin

A remark plugin is a function that returns a transformer operating on the mdast tree. Here's a minimal example:

```ts
import { visit } from "unist-util-visit"
import type { Root, Text } from "mdast"
import type { Plugin } from "unified"

export const remarkMyPlugin: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text) => {
      // Transform text nodes
      node.value = node.value.replace(/--/g, "\u2014") // em-dash
    })
  }
}
```

Key tools for writing plugins:

- [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit) — walk and transform AST nodes
- [`mdast-util-find-and-replace`](https://github.com/syntax-tree/mdast-util-find-and-replace) — regex-based text replacement that returns new AST nodes

## Writing a rehype plugin

Rehype plugins work the same way but operate on hast (HTML AST) nodes:

```ts
import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"
import type { Plugin } from "unified"

export const rehypeMyPlugin: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") {
        node.properties.loading = "lazy"
      }
    })
  }
}
```

## Adding data to vfile

Plugins can attach metadata to the [vfile](https://github.com/vfile/vfile) for downstream consumers. For example, `remarkTag` extracts `#tags` and stores them in `file.data.tags`:

```ts
export const remarkExample: Plugin<[], Root> = () => {
  return (tree, file) => {
    const items: string[] = []
    visit(tree, "text", (node: Text) => {
      // collect data from the tree...
      items.push(node.value)
    })
    file.data.myCustomData = items
  }
}
```

## Registering your plugin

After creating your plugin, add it to the unified pipeline in `packages/nuartz/src/markdown.ts`:

```ts
import { remarkMyPlugin } from "./plugins/my-plugin.js"

// Add it to the chain:
const file = await unified()
  .use(remarkParse)
  // ... existing plugins ...
  .use(remarkMyPlugin)      // <-- add here
  .use(remarkRehype, { allowDangerousHtml: true })
  // ... rehype plugins ...
  .process(body)
```

Remark plugins must be added **before** `remarkRehype`. Rehype plugins must be added **after** it.

## Testing

Each plugin has a corresponding test file (e.g., `callout.test.ts`). Follow the same pattern:

```ts
import { describe, it, expect } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import { remarkMyPlugin } from "./my-plugin"

describe("remarkMyPlugin", () => {
  it("transforms dashes to em-dashes", async () => {
    const result = await unified()
      .use(remarkParse)
      .use(remarkMyPlugin)
      .use(remarkStringify)
      .process("hello -- world")

    expect(String(result)).toContain("\u2014")
  })
})
```

Run tests with:

```bash
cd packages/nuartz
bun test
```

## Using existing unified plugins

You don't have to write everything from scratch. The unified ecosystem has hundreds of plugins. Browse [remark plugins](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) and [rehype plugins](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md) for what's available.

To add an existing plugin:

```bash
cd packages/nuartz
bun add remark-emoji  # example
```

Then register it in the pipeline as shown above.
