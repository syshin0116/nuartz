# Recent Notes

> Display a list of recently created or updated notes.

The home page (`/`) can show either your `index.md` content or a list of recent notes. This is controlled by `homePage` in `nuartz.config.ts`:

```typescript
homePage: "recent"   // show recent notes list (this page)
homePage: "index"    // show content/index.md instead (default)
```

When `homePage: "recent"`, Nuartz shows all notes except the home `index.md`, newest first, 10 per page (`/`, `/page/2`, ...). `/notes` lists every note on one page with tag filtering and title sorting, whichever `homePage` you choose.

## How it works

`bun run generate` writes `apps/web/.generated/notes-list.json`, sorted by date. The home page (`apps/web/app/page.tsx`) reads it with `getSortedNotes()` from `apps/web/lib/notes.ts`, takes the first page with `paginateNotes()`, and renders it with `components/notes-list.tsx`: title, date, `summary` (or `description`, or an excerpt), and tags. Later pages are `app/page/[page]/page.tsx`.

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

The date is `date` (or `created`) from frontmatter, else the file's first git commit. Notes with no date at all appear at the bottom.

## Customizing the listing

To change how the listing looks, edit `apps/web/components/notes-list.tsx`. To change the page size, edit `NOTES_PER_PAGE` in `apps/web/lib/notes.ts`.
