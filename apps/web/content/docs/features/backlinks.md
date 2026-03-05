---
title: Backlinks
date: 2026-03-01
tags:
  - feature
  - navigation
description: Every note shows which other notes link to it.
---

Backlinks appear at the bottom of every note page and show you which other notes link to the current one. They help you navigate your knowledge graph and discover connections you may have forgotten.

> [!tip] Build a richer graph
> The more [[docs/features/wikilinks|wikilinks]] you use, the more useful backlinks become. Together they power the [[docs/features/graph-view|graph view]].

## How it works

When nuartz builds your site, it scans every note for `[[wikilinks]]` and standard Markdown links. For each link it finds, it registers a backlink on the target page. At render time, the backlinks panel is assembled from that index and displayed below the note body.

If a page has no backlinks, the panel is hidden automatically.

## Behaviour

- Backlinks are collected at build time — no client-side work needed.
- The panel shows the title and a short excerpt from each linking page.
- Clicking a backlink navigates to the source note.
- Only published pages (not `draft: true`) appear as backlinks. See [[docs/features/private-pages|Private Pages]].

> [!note]
> Backlinks reflect the state of the content at the last build. In development mode (`bun dev`), they update on every hot reload.

## Related

- [[docs/features/wikilinks|Wikilinks]] — the link syntax that generates backlinks
- [[docs/features/graph-view|Graph View]] — visual map of all connections
- [[docs/features/tags|Tags]] — another way to group related notes
