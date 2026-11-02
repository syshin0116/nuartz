# Search

> Client-side full-text search powered by Pagefind, triggered by Cmd+K.

nuartz includes client-side full-text search powered by [Pagefind](https://pagefind.app/). The search index is built after the production site is compiled and is served with the static assets. No search server is required.

## Opening search

Press `Cmd+K` on macOS or `Ctrl+K` on Windows/Linux to open the search modal. You can also click the search icon in the header.

## Keyboard navigation

Once the modal is open:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move between results |
| `Tab` / `Shift+Tab` | Move forward / backward through results |
| `Enter` | Navigate to the highlighted result |
| `Esc` | Close search |

## Searching by tag

Prefix your query with `#` to search by tag. For example, typing `#feature` returns all pages tagged with `feature`.

> [!tip]
> Tags are also browsable at the [/tags](https://nuartz.vercel.app/docs/features/tags) index page if you prefer browsing over searching.

## How the index is built

nuartz indexes every page at build time with Markdown syntax stripped. This means raw URLs and formatting characters are not searchable — only the visible text is. Separate sub-indexes are built for:

- **Title** (highest weight)
- **Content**
- **Tags**

Title matches are ranked above content matches, so searching for a note's exact title will surface it first.

nuartz correctly tokenises Latin, Chinese, Korean, and Japanese characters.

> [!note]
> The search index is regenerated on every build. In development mode (`bun dev`) it rebuilds automatically when content changes.

## Related

- [Tags](https://nuartz.vercel.app/docs/features/tags) — browse content by tag
- [Backlinks](https://nuartz.vercel.app/docs/features/backlinks) — find notes that reference the current page
- [Configuration](https://nuartz.vercel.app/docs/configuration) — site-wide settings
