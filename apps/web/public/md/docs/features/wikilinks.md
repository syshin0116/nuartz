# Wikilinks

> Wikilink syntax in nuartz — link between notes using [[double brackets]].

Wikilinks let you link between notes using `[[double brackets]]`, just like in Obsidian. nuartz resolves these links at build time and renders them as clickable links with [graph view](https://nuartz.vercel.app/docs/features/graph-view) connections.

## Syntax

### Basic Link

```markdown
[[docs/getting-started]]
```

Renders as: [docs/getting-started](https://nuartz.vercel.app/docs/getting-started)

The link text defaults to the note's title. The path is relative to the `content/` directory.

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

Link directly to a specific heading within a note.

### Combined

```markdown
[[docs/authoring-content#Frontmatter|See frontmatter docs]]
```

Renders as: [See frontmatter docs](https://nuartz.vercel.app/docs/authoring-content#frontmatter)

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
4. The link is registered for [graph view](https://nuartz.vercel.app/docs/features/graph-view) and backlinks

> [!tip] Obsidian Compatible
> nuartz uses the same wikilink syntax as Obsidian, so your notes work in both environments without changes.

## Related

- [Authoring Content](https://nuartz.vercel.app/docs/authoring-content) — full syntax reference
- [Graph View](https://nuartz.vercel.app/docs/features/graph-view) — see how wikilinks build your note graph
- [Configuration](https://nuartz.vercel.app/docs/configuration) — enable or disable wikilinks
