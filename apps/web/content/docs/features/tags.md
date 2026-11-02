---
title: Tags
date: 2026-03-01
tags:
  - feature
  - navigation
description: Tag your notes and browse them at /tags. Folder index pages are auto-generated.
---

nuartz supports tags in [[docs/frontmatter|frontmatter]] and inline in Markdown. It automatically generates a tag index at `/tags` and a detail page for each tag. #feature

## Adding tags

### Frontmatter tags

A YAML list, a single value, or a comma-separated string (`tags: feature, navigation`) all work. The key `tag` is accepted too, and a leading `#` is dropped.

```yaml
---
title: My Note
date: 2026-03-01
tags:
  - feature
  - navigation
---
```

### Inline tags

You can also use `#hashtag` syntax directly in your Markdown prose:

```markdown
This note is about #search and #navigation features.
```

> [!note]
> Inline tags become clickable links that navigate to the tag detail page. They are also included in the [[docs/features/search|search]] index.

## Tag pages

nuartz generates two kinds of tag pages automatically:

| URL | Contents |
|-----|----------|
| `/tags` | Global index listing every tag and its note count |
| `/tags/[tag]` | All notes that have the given tag |

Inline tags already link to their tag page. A wikilink such as `[[tags/feature]]` also points there, but gets the dimmed `broken` style because a tag page is not a note.

## Hierarchical tags

Tags can use a `/` separator to create hierarchies, for example `plugin/transformer`. The note is listed under `plugin/transformer` and also under `/tags/plugin`.

## Folder index pages

In addition to tag pages, nuartz auto-generates an index page for every folder in your content directory. If your content looks like:

```
content/
  docs/
    getting-started.md
    features/
      wikilinks.md
```

Then `/docs` and `/docs/features` are both browsable index pages listing all notes in that folder and its subfolders.

You can customise a folder page by creating an `index.md` file inside the folder. Its title becomes the heading, and its content appears above the listing:

```yaml
---
title: Documentation
description: All nuartz documentation pages.
---
```

> [!tip]
> Folder index pages are useful for building structured wikis. See [[docs/features/folder-and-tag-listings|Folder and Tag Listings]] for details.

## Related

- [[docs/features/search|Search]] - search by tag with the `#` prefix
- [[docs/features/backlinks|Backlinks]] - find all pages that reference the current one
- [[docs/frontmatter|Frontmatter]] - all supported frontmatter fields
