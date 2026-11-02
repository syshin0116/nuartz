# Wikilinks

> Wikilink syntax in nuartz - link between notes using [[double brackets]].

Wikilinks let you link between notes using `[[double brackets]]`, just like in Obsidian. nuartz resolves these links at build time and renders them as clickable links with [graph view](https://nuartz.vercel.app/docs/features/graph-view) connections.

## Syntax

### Basic Link

```markdown
[[docs/getting-started]]
```

Renders as: [docs/getting-started](https://nuartz.vercel.app/docs/getting-started)

The link text is the target as written, not the note's title. Targets are resolved like Obsidian does:

1. The exact path from the content root (`docs/getting-started`)
2. A path relative to the current note (`./sibling`, `../other`); targets starting with `.` only use this rule
3. A file name or [alias](https://nuartz.vercel.app/docs/frontmatter) that exactly one note has (`[[getting-started]]`)

Matching ignores case, a trailing `.md`, and treats spaces as hyphens. A link that resolves to no published note gets the `broken` class.

### Custom Display Text

```markdown
[[docs/getting-started|Get Started Guide]]
```

Renders as: [Get Started Guide](https://nuartz.vercel.app/docs/getting-started)

Use the pipe `|` to set custom link text.

### Heading Anchor

```markdown
[[docs/authoring-content#Frontmatter]]
```

Renders as: [docs/authoring-content > Frontmatter](https://nuartz.vercel.app/docs/authoring-content#frontmatter)

Link directly to a specific heading within a note. Without display text, the link reads `target > heading`. `[[#Heading]]` links to a heading on the current page, and `[[note#^block-id]]` links to a [block](https://nuartz.vercel.app/docs/features/obsidian-compatibility#note-embeds).

### Combined

```markdown
[[docs/authoring-content#Frontmatter|See frontmatter docs]]
```

Renders as: [See frontmatter docs](https://nuartz.vercel.app/docs/authoring-content#frontmatter)

## Standard Markdown links

Ordinary Markdown links to notes resolve the same way and count as links for backlinks and the graph:

```markdown
[Getting started](getting-started.md)
[Install section](docs/getting-started.md#Installation)
```

Links to other files (`[slides](deck.pdf)`) point to the attachment.

## Embeds

Embed images and other attachments using the `!` prefix:

```markdown
![[my-image.png]]
```

With a width, or width and height in pixels:

```markdown
![[my-image.png|300]]
![[my-image.png|400x300]]
```

Video, audio, PDF, and note embeds are covered in [Obsidian Compatibility](https://nuartz.vercel.app/docs/features/obsidian-compatibility).

## How It Works

nuartz resolves wikilinks during the Markdown-to-HTML transformation:

1. The parser finds `[[...]]` patterns (and Markdown links to `.md` files) during `bun run generate`
2. It resolves the target against the published notes
3. It generates an `<a class="wikilink">` with the resolved URL
4. The link is registered for [graph view](https://nuartz.vercel.app/docs/features/graph-view) and backlinks

> [!tip] Obsidian Compatible
> nuartz uses the same wikilink syntax as Obsidian, so your notes work in both environments without changes.

## Related

- [Authoring Content](https://nuartz.vercel.app/docs/authoring-content) - full syntax reference
- [Graph View](https://nuartz.vercel.app/docs/features/graph-view) - see how wikilinks build your note graph
- [Configuration](https://nuartz.vercel.app/docs/configuration) - enable or disable wikilinks
