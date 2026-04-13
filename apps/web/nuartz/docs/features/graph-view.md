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

- **Local graph** — shows notes directly connected to the current page (one hop away)
- **Global graph** — shows all notes and their connections; toggle it from the graph icon

## Building a Connected Garden

The more you use wikilinks, the richer your graph becomes. Here are the docs in this garden and how they connect:

- [[index|Home]] — the entry point, links to all major sections
- [[docs/getting-started|Getting Started]] — setup guide
- [[docs/authoring-content|Authoring Content]] — writing syntax reference
- [[docs/configuration|Configuration]] — config options
- [[docs/features/wikilinks|Wikilinks]] — the linking mechanism that powers the graph
- [[docs/features/callouts|Callouts]] — callout block types
- [[docs/features/syntax-highlighting|Syntax Highlighting]] — code rendering
- [[docs/features/mermaid|Mermaid Diagrams]] — diagram rendering

> [!tip] Make Your Graph Interesting
> Link liberally between notes. Each `[[wikilink]]` adds an edge to the graph, making it easier to discover related content.

## Enabling Graph View

Graph view is enabled by default. You can toggle it in [[docs/configuration|nuartz.config.ts]]:

```typescript
features: {
  // graph view is part of the core layout
  backlinks: true, // backlinks power the graph edges
}
```

> [!note] Visited Nodes
> Like how browsers color visited links differently, the graph highlights nodes you have already visited.
