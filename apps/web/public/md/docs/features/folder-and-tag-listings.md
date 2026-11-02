# Folder and Tag Listings

> Auto-generated index pages for folders and tags.

nuartz automatically generates listing pages for your folders and tags, making it easy to browse related content.

## Folder listings

Every folder in your content directory gets a page that lists all notes within it, including those in subfolders, newest first. For example, if you have notes under `content/guides/`, nuartz generates a page at `/guides` listing all guides. Each card shows the note's title, date, `summary` (or `description`, or an excerpt), and tags.

To customize a folder page, create an `index.md` inside the folder. Its `title` becomes the page heading (and the folder's label in the sidebar and breadcrumbs), and its rendered content is shown above the listing. The index note itself is not repeated in the list.

## Tag listings

Each unique tag used across your notes, in frontmatter or inline, gets its own listing page under `/tags/<tag-name>`. A global tag index at `/tags` shows all available tags with their note counts.

Tags support hierarchies using `/` separators. A note tagged `#feature/navigation` is listed under that tag and also under its parent, `feature`.

### Linking to listings

`[[guides]]` and `[[tags/tutorial]]` produce the right URLs, but they are not notes, so they get the dimmed `broken` link style. Link to the folder's index note instead (`[[guides/index|Guides]]`), or use a plain Markdown link.

## Customization

Listing pages are React components: folder pages in `apps/web/app/[...slug]/page.tsx`, tag pages in `apps/web/app/tags/`. Edit them to change sorting or layout.
