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

When `bun run generate` runs, it collects every note's outgoing links: `[[wikilinks]]`, note embeds, and standard Markdown links to notes (`[text](note.md)`). Each link registers a backlink on the page it resolves to. The **Linked from** panel below the note body is built from that index.

If a page has no backlinks, the panel is hidden automatically.

## Behaviour

- Backlinks are collected at build time, with no client-side work.
- The panel shows the title and a short excerpt (the line containing the wikilink) from each linking page. The first four are listed; the rest sit behind **Show more references**.
- Clicking a backlink navigates to the source note.
- Only published pages appear as backlinks. See [[docs/features/private-pages|Private Pages]].
- `features.backlinks: false` in the [[docs/configuration|configuration]] removes the panel.

> [!note]
> Backlinks reflect the content at the last `generate`. With `bun dev`, run `bun run generate` again (or restart `bun dev`) after editing notes.

## Related

- [[docs/features/wikilinks|Wikilinks]] - the link syntax that generates backlinks
- [[docs/features/graph-view|Graph View]] - visual map of all connections
- [[docs/features/tags|Tags]] - another way to group related notes
