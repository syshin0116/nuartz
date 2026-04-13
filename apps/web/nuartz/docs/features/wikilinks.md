---
title: Wikilinks
date: 2026-03-01
tags:
  - nuartz
  - features
  - wikilinks
description: Wikilink syntax in nuartz — link between notes using [[double brackets]].
---

Wikilinks let you link between notes using `[[double brackets]]`, just like in Obsidian. nuartz resolves these links at build time and renders them as clickable links with [[docs/features/graph-view|graph view]] connections.

## Syntax

### Basic Link

```markdown
[[docs/getting-started]]
```

Renders as: [[docs/getting-started]]

The link text defaults to the note's title. The path is relative to the `content/` directory.

### Custom Display Text

```markdown
[[docs/getting-started|Get Started Guide]]
```

Renders as: [[docs/getting-started|Get Started Guide]]

Use the pipe `|` to set custom link text.

### Heading Anchor

```markdown
[[docs/authoring-content#Frontmatter]]
```

Renders as: [[docs/authoring-content#Frontmatter]]

Link directly to a specific heading within a note.

### Combined

```markdown
[[docs/authoring-content#Frontmatter|See frontmatter docs]]
```

Renders as: [[docs/authoring-content#Frontmatter|See frontmatter docs]]

## Image Embeds

Embed images using the `!` prefix:

```markdown
![[my-image.png]]
```

With dimensions:

```markdown
![[my-image.png|400x300]]
```

## How It Works

nuartz resolves wikilinks during the Markdown-to-HTML transformation:

1. The parser finds `[[...]]` patterns in your Markdown
2. It looks up the target file in the content directory
3. It generates a proper `<a>` link with the resolved URL
4. The link is registered for [[docs/features/graph-view|graph view]] and backlinks

> [!tip] Obsidian Compatible
> nuartz uses the same wikilink syntax as Obsidian, so your notes work in both environments without changes.

## Related

- [[docs/authoring-content|Authoring Content]] — full syntax reference
- [[docs/features/graph-view|Graph View]] — see how wikilinks build your note graph
- [[docs/configuration|Configuration]] — enable or disable wikilinks
