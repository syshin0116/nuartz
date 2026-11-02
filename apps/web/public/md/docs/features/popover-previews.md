# Popover Previews

> Wikipedia-style page previews when hovering over internal links.

Nuartz shows a small popup when you hover over a wikilink, letting you peek at the linked page without navigating away.

## How it works

When you hover over a `[[wikilink]]` in the content area, `PopoverPreview` (a client component) waits 250 ms, then looks up the target in `/preview-index.json`. `bun run generate` writes that file from published notes only, so drafts and hidden paths never show up. If the index is unavailable, it asks `/api/preview?slug=...`, which reads the same index.

The popup disappears when you move your mouse away. On touch screens, long-press a link (500 ms) to show it; it hides again after 3 seconds.

## What's shown

The preview card displays:
- **Title**: from frontmatter `title`, else the file name
- **Excerpt**: the first ~350 characters of the note body with Markdown syntax stripped (the card shows up to four lines)

## External links

On server deployments, hovering an `http(s)` link shows the page's title, description, and `og:image`, fetched by `/api/preview?url=...`. The route only fetches public addresses and re-checks each redirect. External previews are not available in a [static export](https://nuartz.vercel.app/docs/hosting).

> [!note] Scope
> Internal previews work for wikilinks (`a.wikilink` in `article.prose`). Standard Markdown links to notes (`[text](note.md)`) navigate normally but do not show a preview.

## Implementation

| File | Role |
|------|------|
| `apps/web/components/popover-preview.tsx` | Client component: attaches hover and touch listeners |
| `apps/web/app/api/preview/route.ts` | Returns `{ title, excerpt }` for a slug, or link metadata for an external URL |

## Limitations

- No section previews: `[[note#heading]]` shows the top of the note.
- The preview is plain text, without rendered HTML or images.
