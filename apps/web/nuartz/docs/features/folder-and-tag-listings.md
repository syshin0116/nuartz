---
title: Folder and Tag Listings
description: Auto-generated index pages for folders and tags.
---

nuartz automatically generates listing pages for your folders and tags, making it easy to browse related content.

## Folder listings

Every folder in your content directory gets an index page that lists all notes within it, including those in subfolders. For example, if you have notes under `content/guides/`, nuartz generates a page at `/guides` listing all guides.

To customize a folder's listing page, create an `index.md` file inside the folder with a `title` and optional description in the frontmatter.

## Tag listings

Each unique tag used across your notes gets its own listing page under `/tags/<tag-name>`. A global tag index at `/tags` shows all available tags.

Tags support hierarchies using `/` separators (e.g., `feature/navigation`), and nuartz generates pages for each level of the hierarchy.

### Linking to listings

- Link to a folder listing: `[[guides/]]`
- Link to a tag listing: `[[tags/tutorial]]`

## Customization

You can customize the sort order and display of listing pages through your site configuration. Folder listings and tag listings can be styled independently.
