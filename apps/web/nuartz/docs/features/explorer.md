---
title: Explorer
description: A sidebar file explorer for browsing all notes and folders.
---

nuartz includes a sidebar explorer that lets you browse all pages and folders in your vault. It supports nested folders and can be collapsed or expanded.

## Features

- Nested folder tree with expand/collapse
- Alphabetical sorting with folders first
- Folder display names resolved from `index.md` frontmatter titles
- Open/closed state is per-session (resets on page reload — no localStorage persistence)

## Customization

The explorer appears in the left sidebar by default. You can control which files and folders are visible by adjusting your content structure.

To hide specific pages from the explorer, use the `draft: true` frontmatter field to exclude them from the build entirely.
