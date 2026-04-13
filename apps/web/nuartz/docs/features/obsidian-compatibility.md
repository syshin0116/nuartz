---
title: Obsidian Compatibility
date: 2026-03-01
tags:
  - feature
  - obsidian
description: nuartz supports Obsidian Flavored Markdown — wikilinks, callouts, tags, highlights, comments, and more.
---

nuartz was designed to publish [Obsidian](https://obsidian.md/) vaults as websites with zero friction. Drop your vault's content folder into `content/` and nuartz handles the rest.

## Supported OFM features

### Wikilinks

Internal links using `[[double brackets]]` are resolved to the correct page URLs at build time. See [[docs/features/wikilinks|Wikilinks]] for full syntax.

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

### Callouts

Obsidian-style callout blocks using the `> [!type]` syntax. See [[docs/features/callouts|Callouts]] for all supported types.

```markdown
> [!tip] My tip
> Content goes here.
```

### Tags

Inline `#hashtag` syntax in prose is recognised and linked to the tag index. Tags in frontmatter are also supported. See [[docs/features/tags|Tags]].

### Highlights

Wrap text in `==double equals==` to highlight it:

```markdown
This is ==highlighted== text.
```

### Comments

Obsidian comments (`%%...%%`) are stripped from the output — they never appear in the published site:

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

nuartz reads the same frontmatter fields as Obsidian (`title`, `tags`, `aliases`, `date`, `draft`, etc.). See [[docs/frontmatter|Frontmatter]] for the full field reference.

## Tips for a smooth migration

> [!tip] Moving an existing vault
> 1. Copy your vault's Markdown files into `content/`.
> 2. Run `bun dev` and check the browser console for any broken wikilinks.
> 3. Pages with `draft: true` are excluded from listings but still accessible by URL in dev mode.

> [!warning] Unsupported features
> Some Obsidian features (Canvas files, Dataview queries, custom plugins) have no equivalent in nuartz. Plain Markdown notes and the OFM features listed above work out of the box.

## Related

- [[docs/features/wikilinks|Wikilinks]] — full wikilink syntax reference
- [[docs/features/callouts|Callouts]] — callout types and nesting
- [[docs/features/tags|Tags]] — tag index and inline tags
- [[docs/authoring-content|Authoring Content]] — full syntax guide
