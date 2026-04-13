---
title: Obsidian Compatibility
tags:
  - plugin
---

nuartz implements the most commonly used Obsidian Markdown extensions so you can drop content written in Obsidian directly into your garden without modification.

## Features

### Wikilinks

`[[Note Title]]` is converted to a hyperlink pointing to the matching note by slug. You can also use display text: `[[note-slug|Display Text]]`.

If `knownSlugs` is passed to `renderMarkdown()`, links to non-existent notes receive the `broken` CSS class, which you can style:

```css
a.wikilink.broken {
  opacity: 0.5;
  text-decoration-style: dashed;
}
```

Resolution rules:
- Exact slug match: `[[notes/foo]]` → `notes/foo`
- Suffix match: `[[foo]]` matches any slug ending in `/foo`
- Normalized: spaces → hyphens, lowercased

### Callouts

Quartz/Obsidian-style callout blocks:

```markdown
> [!note]
> This is a note callout.

> [!warning] Custom title
> Something to be careful about.
```

Supported types: `note`, `abstract`, `info`, `todo`, `tip`, `success`, `question`, `warning`, `failure`, `danger`, `bug`, `example`, `quote`.

See [[features/callouts]] for styling details.

### Highlights

`==highlighted text==` is converted to `<mark>highlighted text</mark>`.

### Inline Tags

`#tag-name` inline in prose is parsed and added to the note's tag list. These appear in the [[features/graph-view|graph view]] alongside frontmatter tags.

### Comments

`%% this is a comment %%` blocks are stripped from the output and never appear in the rendered HTML.

## Configuration

These features are enabled by default in `renderMarkdown()`. They are implemented as individual remark plugins in `packages/nuartz/src/plugins/`:

| File | Feature |
|------|---------|
| `wikilink.ts` | Wikilinks, broken link detection |
| `callout.ts` | Callout blocks |
| `highlight.ts` | `==highlight==` syntax |
| `tag.ts` | Inline `#tag` extraction |
| `comment.ts` | `%% comment %%` removal |

## Source

- [`packages/nuartz/src/plugins/wikilink.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/plugins/wikilink.ts)
- [`packages/nuartz/src/plugins/callout.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/plugins/callout.ts)
