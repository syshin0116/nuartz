# Obsidian Compatibility

> nuartz supports Obsidian Flavored Markdown - wikilinks, callouts, tags, highlights, comments, and more.

nuartz was designed to publish [Obsidian](https://obsidian.md/) vaults as websites with zero friction. Drop your vault's content folder into `content/` and nuartz handles the rest.

## Supported OFM features

### Wikilinks

Internal links using `[[double brackets]]` are resolved to the correct page URLs at build time. See [Wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) for full syntax.

```markdown
[[docs/getting-started]]
[[docs/getting-started|Custom label]]
[[docs/authoring-content#Frontmatter]]
```

### Image embeds

Embed images with the `!` prefix, optionally specifying dimensions:

```markdown
![[screenshot.png]]
![[screenshot.png|600x400]]
```

### Note embeds

Place a note embed in its own paragraph to include its content:

```markdown
![[docs/getting-started]]
![[docs/getting-started#Installation]]
![[my-note#^block-id]]
```

A section embed includes its subheadings until the next heading at the same or a higher level. Add `^block-id` at the end of a paragraph, or on a separate line after a block, to reference that block. Embedded content keeps its links relative to the source note.

Missing targets, circular references, and embeds beyond four nested notes stay as links. Inline note embeds also remain links. Draft and unpublished notes are excluded from the embed lookup.

### Callouts

Obsidian-style callout blocks using the `> [!type]` syntax. See [Callouts](https://nuartz.vercel.app/docs/features/callouts) for all supported types.

```markdown
> [!tip] My tip
> Content goes here.
```

### Tags

Inline `#hashtag` syntax in prose is recognised and linked to the tag index. Tags in frontmatter are also supported. See [Tags](https://nuartz.vercel.app/docs/features/tags).

### Highlights

Wrap text in `==double equals==` to highlight it:

```markdown
This is ==highlighted== text.
```

### Comments

Obsidian comments (``) are stripped from the output - they never appear in the published site:

```markdown
%% This comment is invisible to readers. %%
```

### Arrows

`->` and `<-` are converted to proper typographic arrows (`→` and `←`):

```markdown
Input -> Process -> Output
```

### Strikethrough

Standard `~~strikethrough~~` syntax is supported.

## Frontmatter compatibility

nuartz reads the same frontmatter fields as Obsidian (`title`, `tags`, `aliases`, `date`, `draft`, etc.). See [Frontmatter](https://nuartz.vercel.app/docs/frontmatter) for the full field reference.

## Tips for a smooth migration

> [!tip] Moving an existing vault
> 1. Copy your vault's Markdown files into `content/`.
> 2. Run `bun dev` and check the browser console for any broken wikilinks.
> 3. Pages with `draft: true` are excluded from listings but still accessible by URL in dev mode.

> [!warning] Unsupported features
> Some Obsidian features (Dataview queries, custom plugins) have no equivalent in nuartz. Plain Markdown notes, the OFM features listed above, [canvas](https://nuartz.vercel.app/docs/features/canvas) files, and a subset of [bases](https://nuartz.vercel.app/docs/features/bases) work out of the box.

## Related

- [Wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) - full wikilink syntax reference
- [Callouts](https://nuartz.vercel.app/docs/features/callouts) - callout types and nesting
- [Tags](https://nuartz.vercel.app/docs/features/tags) - tag index and inline tags
- [Authoring Content](https://nuartz.vercel.app/docs/authoring-content) - full syntax guide
