---
title: Recent Notes
description: Display a list of recently created or updated notes.
---

nuartz can display a list of recently modified notes, making it easy for visitors to find fresh content.

## How it works

Recent notes are sorted by the `date` field in each page's frontmatter. Pages without a date are excluded from the listing.

## Usage

Add a recent notes section to any page by including it in your layout. You can control:

- **Limit** -- how many notes to show (default: 5)
- **Filtering** -- exclude certain tags or folders
- **Display** -- show or hide tags and descriptions

## Example frontmatter

```yaml
---
title: My Note
date: 2026-01-15
tags:
  - tutorial
---
```

Notes with more recent dates appear first in the listing.
