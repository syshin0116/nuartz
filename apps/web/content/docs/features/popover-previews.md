---
title: Popover Previews
description: Wikipedia-style page previews when hovering over internal links.
---

Nuartz shows a small popup when you hover over an internal wikilink, letting you peek at the linked page without navigating away.

## How it works

When you hover over a `[[wikilink]]` in the content area, `PopoverPreview` (a client component) waits 350ms then fetches `/api/preview?slug=<target-slug>`. The API returns the page title and a short excerpt, which are displayed in a floating card near your cursor.

The popup disappears when you move your mouse away.

## What's shown

The preview card displays:
- **Title** — from frontmatter `title`
- **Excerpt** — first ~200 characters of the page body

> [!note] Scope
> Previews only work for **internal wikilinks** (`.wikilink` anchors in `article.prose`). External links are not previewed.

## Implementation

| File | Role |
|------|------|
| `apps/web/components/popover-preview.tsx` | Client component — attaches mouseover listeners |
| `apps/web/app/api/preview/route.ts` | Returns `{ title, excerpt }` for a given slug |

## Limitations

- No header-scroll: the preview always shows the top of the page, not a specific section anchor.
- No image previews for `![[image]]` embeds.
- Previews are not shown on mobile (hover is not available).
- The preview is plain text — no rendered HTML or images.
