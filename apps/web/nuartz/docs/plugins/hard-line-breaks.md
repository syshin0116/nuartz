---
title: Hard Line Breaks
tags:
  - plugin
---

By default, single newlines in Markdown are treated as spaces (they do not produce a `<br>`). nuartz enables the `remarkBreaks` plugin so that single newlines in your prose render as hard line breaks — matching Obsidian's behaviour.

## Example

```markdown
Line one
Line two
Line three
```

Renders as:

Line one
Line two
Line three

Without this plugin, the three lines would collapse into a single line of text.

## Disabling

If you prefer standard Markdown behaviour (single newlines = space), remove `remarkBreaks` from the pipeline in `packages/nuartz/src/markdown.ts`.

> [!note]
> This plugin runs **before** `remarkCallout`, which is why the callout plugin explicitly strips leading `break` nodes from callout bodies.

## Source

- [`packages/nuartz/src/markdown.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/markdown.ts)
- [remark-breaks](https://github.com/remarkjs/remark-breaks)
