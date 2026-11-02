# Explorer

> A sidebar file explorer for browsing all notes and folders.

nuartz includes a sidebar explorer that lets you browse all pages and folders in your vault. It supports nested folders and can be collapsed or expanded.

## Features

- Nested folder tree with expand/collapse; top-level folders and the folders around the current page start open
- Sorting: frontmatter `order` first (a folder takes the lowest `order` among its notes), then folders before files, then by name
- File labels come from frontmatter `title`. A folder's label comes from the title of its `index.md`, and that index note is not listed again inside the folder (clicking the folder opens its [folder page](https://nuartz.vercel.app/docs/features/folder-and-tag-listings))
- Open/closed state is not saved (resets on page reload)

## Customization

The explorer appears in the left sidebar by default. You can control which files and folders are visible by adjusting your content structure.

To hide specific pages from the explorer, use the `draft: true` frontmatter field or a `_`-prefixed folder to exclude them from the site entirely. See [Private Pages](https://nuartz.vercel.app/docs/features/private-pages).
