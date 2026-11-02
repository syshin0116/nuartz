---
title: Breadcrumbs
description: Navigation breadcrumbs showing the folder hierarchy for the current page.
---

nuartz shows breadcrumb navigation at the top of each note inside a folder, and on folder pages, showing the path from the root of your content to the current page.

Breadcrumbs help readers orient themselves within nested folder structures and quickly jump to parent folders.

## How it works

The breadcrumb trail is derived from the file path of the current page. For example, a note at `content/guides/setup/install.md` would display:

```
Home > Guides > Setup > Install
```

The house icon links home, and each folder segment links to its folder page. A folder's label is the `title` of its `index.md` when it has one; otherwise the folder name with hyphens shown as spaces. The last segment is the note's `title`.

## Customization

Breadcrumbs are rendered by `apps/web/components/breadcrumb.tsx`. Edit it to change the root icon or separator.
