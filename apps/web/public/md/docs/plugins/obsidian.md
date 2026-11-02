# Obsidian Compatibility

nuartz implements the most commonly used Obsidian Markdown extensions so you can drop content written in Obsidian directly into your garden without modification.

## Features

### Wikilinks

`[[note]]` is converted to a hyperlink pointing to the matching note. You can also use display text: `[[note|Display Text]]`. Without it, the link text is the target (`target > heading` for heading links). Standard Markdown links to `.md` files are converted the same way.

If `knownSlugs` is passed to `renderMarkdown()`, links to non-existent notes receive the `broken` CSS class, which you can style:

```css
a.wikilink.broken {
  opacity: 0.5;
  text-decoration-style: dashed;
}
```

Resolution (`createNoteResolver()` in `links.ts`, passed to `renderMarkdown()` as `resolveLink`):
- Exact path: `[[notes/foo]]` → `notes/foo`
- Relative to the linking note: `[[./foo]]`, `[[../foo]]` (targets starting with `.` use only this rule)
- Unique file name or alias: `[[foo]]` matches `notes/foo` when no other note is named `foo`
- Normalized with `normalizeNotePath()`: lowercased, spaces → hyphens, `.md` removed

Without `resolveLink`, targets are only normalized (`[[My Note]]` → `/my-note`).

### Embeds and attachments

`remarkEmbed` replaces a paragraph that is only `![[note]]`, `![[note#heading]]`, or `![[note#^block]]` with the rendered note, using the `resolveEmbed` option. `remarkWikilink` turns `![[file.ext]]` and Markdown images into `<img>`, `<video>`, `<audio>`, PDF `<iframe>`, or download links, with `resolveAsset` mapping the file to a URL. `createAssetResolver()` implements Obsidian's attachment lookup. Without `resolveAsset`, attachments point to `/api/content/<path>` relative to the note's folder; the starter passes its own resolver that serves `/content/<path>`.

### Callouts

Quartz/Obsidian-style callout blocks:

```markdown
> [!note]
> This is a note callout.

> [!warning] Custom title
> Something to be careful about.
```

Any type is accepted. `[!type]-` and `[!type]+` render foldable `<details>` callouts, and `[!type|metadata]` adds `data-callout-metadata`. The starter styles the Obsidian types and aliases; others use the default style.

See [docs/features/callouts](https://nuartz.vercel.app/docs/features/callouts) for styling details.

### Highlights

`==highlighted text==` is converted to `<mark>highlighted text</mark>`.

### Inline Tags

`#tag-name` inline in prose is parsed and added to the note's tag list. These appear in the [graph view](https://nuartz.vercel.app/docs/features/graph-view) alongside frontmatter tags.

### Comments

`` blocks are stripped from the output and never appear in the rendered HTML.

## Configuration

These features are enabled by default in `renderMarkdown()`. They are implemented as individual remark plugins in `packages/nuartz/src/plugins/`:

| File | Feature |
|------|---------|
| `wikilink.ts` | Wikilinks, Markdown note links, attachments, broken link detection |
| `callout.ts` | Callout blocks |
| `highlight.ts` | `==highlight==` syntax |
| `tag.ts` | Inline `#tag` extraction |
| `comment.ts` | `` removal |
| `embed.ts` | Note embeds and `^block-id` anchors |
| `media.ts` | Attachment kinds, sizes, YouTube URLs |
| `arrows.ts` | `-->` / `<--` arrows |

## Source

- [`packages/nuartz/src/plugins/wikilink.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/plugins/wikilink.ts)
- [`packages/nuartz/src/plugins/callout.ts`](https://github.com/syshin0116/nuartz/blob/main/packages/nuartz/src/plugins/callout.ts)
