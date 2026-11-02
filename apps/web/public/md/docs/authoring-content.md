# Authoring Content

> How to write content for nuartz using Obsidian-flavored Markdown.

All content in nuartz goes in the `content/` directory. The home page lives at `content/index.md`. Any Markdown file in this directory will be processed and rendered by nuartz.

> [!tip] Recommended Editor
> Use [Obsidian](https://obsidian.md/) to edit your notes. It gives you a live preview, graph view, and the same syntax that nuartz supports.

## Frontmatter

Every note starts with YAML frontmatter between `---` fences:

```yaml
---
title: Example Title
date: 2026-03-01
draft: false
tags:
  - example-tag
description: A short description for link previews and SEO.
aliases:
  - alternate-name
---
```

| Field | Description |
|-------|-------------|
| `title` | Page title. Falls back to the filename if omitted. |
| `date` | Publish date in `YYYY-MM-DD` format. |
| `tags` | List of tags for categorization. |
| `description` | Used for link previews and meta tags. |
| `draft` | Set to `true` to hide the page from the published site. |
| `aliases` | Alternate names that wikilinks can resolve to. |

## Wikilinks

Link to other notes using double brackets:

- `[[docs/getting-started]]` - links to [docs/getting-started](https://nuartz.vercel.app/docs/getting-started)
- `[[docs/getting-started|Get Started]]` - links with custom text: [Get Started](https://nuartz.vercel.app/docs/getting-started)
- `[[docs/features/callouts#Showcase]]` - links to a heading anchor

See [Wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) for the full syntax reference.

## Callouts

Use Obsidian-style callout blocks to highlight information:

> [!note] This is a note
> Callouts support **bold**, *italic*, `code`, and [wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) inside them.

```markdown
> [!note] This is a note
> Callouts support **bold**, *italic*, `code`, and [[wikilinks]] inside them.
```

See [Callouts](https://nuartz.vercel.app/docs/features/callouts) for all supported types.

## Tags

Add tags in frontmatter or inline with `#tag` syntax. Tags create automatic index pages at `/tags/tag-name`.

## Code Blocks

Fenced code blocks with language identifiers get [syntax highlighting](https://nuartz.vercel.app/docs/features/syntax-highlighting) powered by Shiki:

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

## Math

nuartz supports LaTeX math via KaTeX.

Inline: `$E = mc^2$` renders as $E = mc^2$

Block math:

```
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

Renders as:

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## Mermaid Diagrams

Create diagrams using fenced code blocks with the `mermaid` language. See [Mermaid Diagrams](https://nuartz.vercel.app/docs/features/mermaid) for examples.

## Images

Place images in `content/` (or a subfolder) and embed them:

```markdown
![[my-image.png]]
```

Standard Markdown image syntax also works:

```markdown
![Alt text](./images/photo.png)
```

> [!tip] What's Next?
> - [Configure your garden](https://nuartz.vercel.app/docs/configuration)
> - [Explore the graph view](https://nuartz.vercel.app/docs/features/graph-view)
