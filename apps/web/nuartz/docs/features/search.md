---
title: Search
date: 2026-03-01
tags:
  - feature
  - navigation
description: Client-side full-text search powered by FlexSearch, triggered by Cmd+K.
---

nuartz includes client-side full-text search powered by [FlexSearch](https://github.com/nextapps-de/flexsearch). The search index is built at compile time and shipped to the browser — no server required.

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
> Tags are also browsable at the [[docs/features/tags|/tags]] index page if you prefer browsing over searching.

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

- [[docs/features/tags|Tags]] — browse content by tag
- [[docs/features/backlinks|Backlinks]] — find notes that reference the current page
- [[docs/configuration|Configuration]] — site-wide settings
