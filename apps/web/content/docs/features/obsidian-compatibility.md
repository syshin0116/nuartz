---
title: Obsidian Compatibility
date: 2026-03-01
tags:
  - feature
  - obsidian
description: nuartz supports Obsidian Flavored Markdown - wikilinks, callouts, tags, highlights, comments, and more.
---

nuartz was designed to publish [Obsidian](https://obsidian.md/) vaults as websites with zero friction. Drop your vault's content folder into `apps/web/content/` and nuartz handles the rest.

## Supported OFM features

### Wikilinks

Internal links using `[[double brackets]]` are resolved to the correct page URLs at build time, by exact path, path relative to the note, or unique file name. Standard Markdown links to notes (`[text](note.md)`, `[text](note.md#heading)`) resolve the same way and count as backlinks. See [[docs/features/wikilinks|Wikilinks]] for full syntax.

```markdown
[[docs/getting-started]]
[[docs/getting-started|Custom label]]
[[docs/authoring-content#Frontmatter]]
```

### Attachments and media

Embed files with the `!` prefix. Attachments are found the way Obsidian finds them: the exact path from the content root, then a path relative to the note, then the file name when only one file has it. They are copied to `/content/...` during `bun run generate`; files under `_` or `.` folders are never copied.

```markdown
![[screenshot.png]]            image
![[screenshot.png|600]]        image, 600px wide
![[screenshot.png|600x400]]    image, width and height
![alt|300](images/photo.png)   standard syntax with a size
![[demo.mp4]]                  <video> player (mp4, webm, mov, ogv, mkv)
![[talk.mp3]]                  <audio> player (mp3, wav, m4a, ogg, flac, 3gp)
![[paper.pdf]]                 embedded PDF viewer
![[archive.zip]]               download link
![](https://youtu.be/VIDEO_ID)  YouTube player
![](https://example.com/a.mp4)  external video
```

An attachment that cannot be found renders as its file name with the `embed-missing` class and an "Attachment not found" tooltip. `[text](file.pdf)` links to the attachment.

### Note embeds

Place a note embed in its own paragraph to include its content:

```markdown
![[docs/getting-started]]
![[docs/getting-started#Installation]]
![[my-note#^block-id]]
```

A section embed includes its subheadings until the next heading at the same or a higher level. Add `^block-id` at the end of a paragraph or list item, or on a separate line after a block (table, quote, callout, code), to reference that block. An id on a list item's first line names the whole item, nested items included, and `![[note#^id]]` finds blocks nested inside lists. Embedded content keeps its links relative to the source note.

Missing targets, circular references, and embeds beyond four nested notes stay as links. Inline note embeds also remain links. Draft and unpublished notes are excluded from the embed lookup.

### Callouts

Obsidian-style callout blocks using the `> [!type]` syntax, including foldable callouts (`[!type]-`, `[!type]+`) and custom types. See [[docs/features/callouts|Callouts]].

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

Obsidian comments (`%%...%%`) are stripped from the output - they never appear in the published site:

```markdown
%% This comment is invisible to readers. %%
```

### Arrows

`-->`, `<--`, and `<-->` are converted to typographic arrows (`→`, `←`, `↔`):

```markdown
Input --> Process --> Output
```

### Strikethrough

Standard `~~strikethrough~~` syntax is supported.

## Frontmatter compatibility

nuartz reads the same frontmatter fields as Obsidian (`title`, `tags`, `aliases`, `cssclasses`, ...), in the list, single-value, or comma-separated forms Obsidian accepts. See [[docs/frontmatter|Frontmatter]] for the full field reference.

## Tips for a smooth migration

> [!tip] Moving an existing vault
> 1. Copy your vault into `apps/web/content/`. `.obsidian/` and `.trash/` are ignored.
> 2. Run `bun dev`. Broken wikilinks are dimmed with a dashed underline, and `bun run validate` lists them.
> 3. Pages with `draft: true` or `published: false` are not published, also in dev mode.

> [!warning] Unsupported features
> Some Obsidian features (Dataview queries, custom plugins) have no equivalent in nuartz. Plain Markdown notes, the OFM features listed above, [[canvas]] files, and a subset of [[bases]] work out of the box.

## Related

- [[docs/features/wikilinks|Wikilinks]] - full wikilink syntax reference
- [[docs/features/callouts|Callouts]] - callout types and nesting
- [[docs/features/tags|Tags]] - tag index and inline tags
- [[docs/authoring-content|Authoring Content]] - full syntax guide
