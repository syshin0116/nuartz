# Search

> Client-side full-text search powered by Pagefind, triggered by Cmd+K.

nuartz includes client-side full-text search powered by [Pagefind](https://pagefind.app/). `bun run generate` builds the index from the rendered notes and writes it to `apps/web/public/pagefind/`, so it works the same with `bun dev`, Vercel, and static exports. No search server is required.

## Opening search

Press `Cmd+K` on macOS or `Ctrl+K` on Windows/Linux to open the search modal. You can also click **Search notes** in the header. Set `features.search: false` in the [configuration](https://nuartz.vercel.app/docs/configuration) to remove search and skip the index.

## Keyboard navigation

Once the modal is open:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move between results |
| `Enter` | Navigate to the highlighted result |
| `Esc` | Close search |

## Searching by tag

Prefix your query with `#` to search by tag. For example, typing `#feature` returns all pages tagged with `feature`.

> [!tip]
> Tags are also browsable at the [/tags](https://nuartz.vercel.app/docs/features/tags) index page if you prefer browsing over searching.

## How the index is built

`generate` gives Pagefind each note's rendered HTML with its title as a heading, so only visible text is searchable (not raw URLs or Markdown syntax), and title matches rank highly. The index language is `site.locale` (default `en`). Pagefind segments Chinese, Japanese, and Korean text.

Tag search (`#`) and a fallback when Pagefind cannot load use a second index of note titles, paths, text, and tags, served from `/api/search`.

> [!note]
> The index reflects the content at the last `generate`. With `bun dev`, run `bun run generate` again (or restart `bun dev`) after editing notes.

## Related

- [Tags](https://nuartz.vercel.app/docs/features/tags) - browse content by tag
- [Backlinks](https://nuartz.vercel.app/docs/features/backlinks) - find notes that reference the current page
- [Configuration](https://nuartz.vercel.app/docs/configuration) - site-wide settings
