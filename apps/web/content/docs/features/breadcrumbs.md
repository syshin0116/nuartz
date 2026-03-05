---
title: Breadcrumbs
description: Navigation breadcrumbs showing the folder hierarchy for the current page.
---

nuartz generates breadcrumb navigation at the top of each page, showing the path from the root of your content to the current note.

Breadcrumbs help readers orient themselves within nested folder structures and quickly jump to parent folders.

## How it works

The breadcrumb trail is derived from the file path of the current page. For example, a note at `content/guides/setup/install.md` would display:

```
Home > Guides > Setup > Install
```

Each segment links to the corresponding folder listing page. Folder display names are pulled from the `title` field in the folder's `index.md` frontmatter when available.

## Customization

Breadcrumbs are rendered automatically as part of the page layout. To customize the root label or separator, edit the breadcrumb component in your layout configuration.
