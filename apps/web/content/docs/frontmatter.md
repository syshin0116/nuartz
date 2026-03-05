---
title: Frontmatter
date: 2026-03-01
tags:
  - reference
  - authoring
description: All frontmatter fields supported by nuartz — title, date, tags, draft, aliases, and more.
---

Every Markdown file in nuartz can include a YAML frontmatter block at the top. Frontmatter controls how the page is titled, indexed, and displayed.

## Example

```yaml
---
title: My Note
date: 2026-03-01
description: A short summary shown in link previews and the search index.
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

The page title shown in the browser tab, the page header, and any [[docs/features/wikilinks|wikilinks]] that point to this page.

Defaults to the filename if omitted.

### `date`

Publication date in `YYYY-MM-DD` format. Used for sorting in folder and tag listings and displayed in the page header.

```yaml
date: 2026-03-01
```

### `description`

A short description of the page. Used in:

- `<meta name="description">` for SEO
- OpenGraph previews when sharing links
- The [[docs/features/search|search]] index excerpt

### `tags`

A list of tags for this page. Tags generate clickable links and appear in the [[docs/features/tags|tag index]].

```yaml
tags:
  - feature
  - navigation
```

You can also use inline `#hashtag` syntax in the body. See [[docs/features/tags|Tags]].

### `draft`

Set to `true` to exclude the page from builds. The page is still accessible by direct URL in development mode. See [[docs/features/private-pages|Private Pages]].

```yaml
draft: true
```

### `aliases`

Alternative names for this page. nuartz resolves wikilinks that use any of the aliases to the correct URL.

```yaml
aliases:
  - wikilinks
  - double brackets
```

### `summary`

A short one-liner displayed on tag index cards and folder listing pages. Falls back to `description` if omitted.

### `enableToc`

Set to `false` to hide the [[docs/features/table-of-contents|table of contents]] sidebar panel for this page.

```yaml
enableToc: false
```

## Notes

> [!tip]
> All frontmatter fields are optional except in specific contexts. A file with no frontmatter at all is valid — nuartz uses the filename as the title.

> [!note] Obsidian compatibility
> nuartz reads the same fields Obsidian writes. If you open your content folder in Obsidian, the properties panel will display and edit these fields correctly. See [[docs/features/obsidian-compatibility|Obsidian Compatibility]].

## Related

- [[docs/authoring-content|Authoring Content]] — full Markdown syntax reference
- [[docs/features/tags|Tags]] — how tags work
- [[docs/features/private-pages|Private Pages]] — using `draft: true`
- [[docs/features/table-of-contents|Table of Contents]] — using `enableToc`
