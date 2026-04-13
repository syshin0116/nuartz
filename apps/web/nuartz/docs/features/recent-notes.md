---
title: Recent Notes
description: Display a list of recently created or updated notes.
---

The home page (`/`) can show either your `index.md` content or a list of recent notes. This is controlled by `homePage` in `nuartz.config.ts`:

```typescript
homePage: "recent"   // show recent notes list (this page)
homePage: "index"    // show content/index.md instead (default)
```

When `homePage: "recent"`, Nuartz shows a list of all notes sorted by `date` in frontmatter (most recent first).

## How it works

The home page at `apps/web/app/page.tsx` calls `getAllMarkdownFiles()`, sorts by `frontmatter.date`, and renders a linked list of notes with their title, date, description, and tags.

There is no separate configurable `RecentNotes` component — the home page itself serves as the recent notes listing.

## Adding a date to your notes

```yaml
---
title: My Note
date: 2026-01-15
description: A short summary shown in the listing.
tags:
  - tutorial
---
```

Notes with a `date` field are sorted chronologically. Notes without a date appear at the bottom.

## Customizing the listing

To change how the home page listing looks, edit `apps/web/app/page.tsx` directly. For example, to show only the 10 most recent notes:

```ts
const notes = files
  .filter((f) => f.slug !== "index")
  .sort(/* by date */)
  .slice(0, 10)  // limit to 10
```
