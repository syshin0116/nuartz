---
title: Graph View
date: 2026-03-01
tags:
  - nuartz
  - features
  - graph
description: Visualize connections between your notes with nuartz's interactive graph view.
---

nuartz includes an interactive graph view that visualizes the connections between your notes, built from [[docs/features/wikilinks|wikilinks]] and backlinks.

## How It Works

The graph is generated from the link structure of your content:

- Each note becomes a **node** in the graph
- Each [[docs/features/wikilinks|wikilink]] creates an **edge** between two nodes
- Node size is proportional to the number of connections

## Local vs Global

- **Local graph**: shows up to 28 nodes within two hops of the current page, including shared tags
- **Global graph**: choose **Explore**, then **All notes** to see the whole garden

## Building a Connected Garden

The more you use wikilinks, the richer your graph becomes. Here are the docs in this garden and how they connect:

- [[index|Home]] - the entry point, links to all major sections
- [[docs/getting-started|Getting Started]] - setup guide
- [[docs/authoring-content|Authoring Content]] - writing syntax reference
- [[docs/configuration|Configuration]] - config options
- [[docs/features/wikilinks|Wikilinks]] - the linking mechanism that powers the graph
- [[docs/features/callouts|Callouts]] - callout block types
- [[docs/features/syntax-highlighting|Syntax Highlighting]] - code rendering
- [[docs/features/mermaid|Mermaid Diagrams]] - diagram rendering

> [!tip] Make Your Graph Interesting
> Link liberally between notes. Each `[[wikilink]]` adds an edge to the graph, making it easier to discover related content.

## Exploring connections

Select a node to highlight its direct connections, then use the note link to open it. **Explore** opens a larger graph with note and tag filters. Use the search field to find a note in the current view, or choose a connected note in the side panel. Drag nodes to rearrange them, and use the zoom and fit buttons to adjust the view.

The current note is teal. Tags use amber diamonds. Labels appear for the current note, selection, and hovered or focused nodes. On mobile, open **On this page** to reach the graph.

Use Tab to enter the graph, arrow keys to move between nodes, and Enter or Space to select one. In the sidebar, hold Ctrl or Command while scrolling to zoom; normal scrolling continues down the page.
