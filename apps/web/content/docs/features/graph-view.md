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

Select a node to highlight its direct connections, then use the note link to open it. **Explore** opens a larger graph with note and tag filters. Use the search field to find a note in the current view, or choose a connected note in the side panel. Drag a node and its neighbors respond, then settle when released. Live motion runs for graphs of up to 250 nodes; larger graphs and reduced-motion mode move only the dragged node. Use the zoom and fit buttons to adjust the view.

The current note is teal. Tags use amber diamonds. Labels appear for the current note, selection, and hovered or focused nodes. On mobile, open **On this page** to reach the graph.

Use Tab to enter the graph, arrow keys to move between nodes, and Enter or Space to select one. In the sidebar, hold Ctrl or Command while scrolling to zoom; normal scrolling continues down the page.

## 2D, 3D, VR, and AR

Choose a view at the top of **Explore**. The current scope, tag filter, and selected note carry across modes. The search field and connected-note panel remain available.

- **2D**: the default view, with keyboard navigation and live drag physics for up to 250 nodes.
- **3D**: drag the background to orbit, scroll to zoom, and click a node to select it. **Fit** brings the graph back into view.
- **VR**: choose **Start VR preview**, then use the viewer's headset button on a compatible device and browser. A desktop preview is available without a headset.
- **AR**: open the [Hiro marker](/graph-marker/hiro.jpg) on another screen or print it. Choose **Start AR camera**, allow camera access, and point at the marker. This is marker-based AR, not automatic placement on arbitrary surfaces.

VR and AR require HTTPS or localhost. Camera availability and immersive headset support depend on the device and browser. **Stop camera**, **Exit VR view**, switching modes, or closing Explore removes the immersive viewer. If loading fails, retry or return to 2D.

Spatial libraries load only when their view is started. AR uses [AR.js](https://github.com/AR-js-org/AR.js) with its standard Hiro pattern and camera calibration data, served locally with the site.
