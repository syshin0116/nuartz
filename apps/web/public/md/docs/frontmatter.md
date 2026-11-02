# Frontmatter

> All frontmatter fields nuartz reads - title, dates, tags, aliases, draft, and more.

Every Markdown file in nuartz can include a YAML frontmatter block at the top. Frontmatter controls how the page is titled, indexed, and displayed.

## Example

```yaml
---
title: My Note
date: 2026-03-01
description: Shown in meta tags and under the page title.
tags:
  - example
  - reference
draft: false
aliases:
  - my note
  - mynote
summary: An even shorter one-liner for the tag/folder index cards.
---
```

## Field reference

### `title`

The page title shown in the browser tab, the page header, the sidebar, listings, and the graph. Defaults to the file name if omitted. [Wikilinks](https://nuartz.vercel.app/docs/features/wikilinks) show their target text, not this title, unless you give display text with `|`.

### `description` and `summary`

Both are optional short texts:

- `<meta name="description">`, OpenGraph, RSS, and `llms.txt` prefer `description`, then `summary`.
- Note cards (home page, `/notes`, folder and tag listings) prefer `summary`, then `description`.
- With neither, both fall back to an automatic excerpt of the note's first paragraphs (about 200 characters).

`description` is also shown under the title in the page header.

### `tags` / `tag`

Tags for this page. Tags generate clickable links and appear in the [tag index](https://nuartz.vercel.app/docs/features/tags). A YAML list, a single value, or a comma-separated string all work, and a leading `#` is stripped:

```yaml
tags:
  - feature
  - navigation
# or
tags: feature, navigation
```

You can also use inline `#hashtag` syntax in the body. See [Tags](https://nuartz.vercel.app/docs/features/tags).

### `aliases` / `alias`

Alternative names for this page, in the same list formats as `tags`. Wikilinks that use an alias resolve to this page, and the alias also works as a URL: `/my-note` permanently redirects (308) to the page. Alias URLs are normalized like wikilink targets (lowercase, spaces to hyphens).

```yaml
aliases:
  - wikilinks
  - double brackets
```

An alias is skipped as a URL when it matches a real page or folder, or when two notes claim it.

### `permalink`

An extra URL for the page that redirects to it, handled like an alias.

### `date` / `created`

Publication date, e.g. `2026-03-01`. Used for sorting the home page, `/notes`, folder and tag listings, and RSS, and displayed in the page header. Without either field the date of the file's first git commit is used.

### `modified` / `updated` / `lastmod`

Last-modified date, shown as "Updated" in the page header and used for the sitemap and JSON-LD. Without these fields, nuartz uses the file's last git commit, then the file modification time.

> [!note] Shallow clones
> Git dates need history. Shallow CI clones only see their latest commits, so set dates in frontmatter if they matter.

### `draft` / `published`

`draft: true` or `published: false` (booleans or the strings `"true"` / `"false"`) keeps the page off the site in every mode, including `bun dev`. See [Private Pages](https://nuartz.vercel.app/docs/features/private-pages).

```yaml
draft: true
```

### `order`

A number that places the page before higher numbers (and unnumbered pages) in the sidebar and in previous/next navigation. Date sorting in listings is unchanged.

### `cssclasses` / `cssclass`

Extra CSS classes added to the page's `<article>` element, as in Obsidian.

### `toc` / `enableToc`

Set either to `false` to hide the [table of contents](https://nuartz.vercel.app/docs/features/table-of-contents) for this page.

```yaml
toc: false
```

### `comments`

Set to `false` to hide [comments](https://nuartz.vercel.app/docs/features/comments) on this page.

## Notes

> [!tip]
> All frontmatter fields are optional except in specific contexts. A file with no frontmatter at all is valid - nuartz uses the filename as the title.

> [!note] Obsidian compatibility
> nuartz reads the same fields Obsidian writes. If you open your content folder in Obsidian, the properties panel will display and edit these fields correctly. See [Obsidian Compatibility](https://nuartz.vercel.app/docs/features/obsidian-compatibility).

## Related

- [Authoring Content](https://nuartz.vercel.app/docs/authoring-content) - full Markdown syntax reference
- [Tags](https://nuartz.vercel.app/docs/features/tags) - how tags work
- [Private Pages](https://nuartz.vercel.app/docs/features/private-pages) - using `draft: true`
- [Table of Contents](https://nuartz.vercel.app/docs/features/table-of-contents) - using `toc: false`
