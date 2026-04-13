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

You can link to a tag page with a wikilink:

```markdown
[[tags/feature]]
```

## Hierarchical tags

Tags can use a `/` separator to create hierarchies, for example `plugin/transformer`. nuartz generates a separate page for each level of the hierarchy.

## Folder index pages

In addition to tag pages, nuartz auto-generates an index page for every folder in your content directory. If your content looks like:

```
content/
  docs/
    getting-started.md
    features/
      wikilinks.md
```

Then `/docs` and `/docs/features` are both browsable index pages listing all notes in that folder.

You can customise a folder index by creating an `index.md` file inside the folder:

```yaml
---
title: Documentation
description: All nuartz documentation pages.
---
```

> [!tip]
> Folder index pages are useful for building structured wikis. Link to a folder with a trailing slash: `[[docs/features/]]`.

## Related

- [[docs/features/search|Search]] — search by tag with the `#` prefix
- [[docs/features/backlinks|Backlinks]] — find all pages that reference the current one
- [[docs/frontmatter|Frontmatter]] — all supported frontmatter fields
