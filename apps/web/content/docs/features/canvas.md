---
title: Canvas
description: Obsidian Canvas (.canvas) files published as pannable, zoomable pages.
tags:
  - nuartz
  - features
  - canvas
---

Every `.canvas` file in your content folder becomes a page. Open [[canvas-demo.canvas|the demo canvas]] to try it.

## URLs

A canvas is published at its path without the extension: `maps/overview.canvas` becomes `/maps/overview`. If a note already uses that URL (`maps/overview.md`), the note keeps it and the canvas moves to `/maps/overview-canvas`. The build prints a warning when this happens. Link to a canvas with its file name, including the extension: `[[overview.canvas]]`.

Canvases inside hidden folders (`.obsidian`, `_private`, and so on) are skipped, like notes.

## What is rendered

Nodes follow [JSON Canvas 1.0](https://jsoncanvas.org/spec/1.0/):

| Node | Rendering |
| --- | --- |
| Text | Markdown rendered with the same pipeline as notes, so wikilinks, callouts, and math work |
| File | A card linking to the note (title and excerpt), or to a canvas or base page. Images are displayed. Other attachments link to the file |
| Link | A card with the site's host name that opens the URL in a new tab (only `http` and `https` URLs) |
| Group | A labelled box, with its background image if set |

Edges are drawn as curves between node sides (the nearest sides when `fromSide` or `toSide` is missing), with arrowheads, labels, and colors. Preset colors `1` to `6` use Obsidian's palette; hex colors are used as given.

## Navigating

- Drag the background or scroll to pan. Hold `Ctrl` or `Cmd` while scrolling (or pinch on a trackpad) to zoom.
- Focus the canvas and use the arrow keys to pan, `+` and `-` to zoom, and `0` to fit it to the screen.
- The toolbar in the corner has zoom and fit buttons.

Canvas text, card titles, and edge labels are included in [[search]]. Notes a canvas links to appear as connections in the [[graph-view]].

## Not supported

- File nodes show a note's title and excerpt, not the full note, and ignore `subpath`.
- Link nodes are not embedded as live web pages.
- Canvases are read-only: nodes cannot be moved or edited.
- Canvas links do not add [[backlinks]] to the linked notes.
- `![[file.canvas]]` in a note renders as a link to the canvas page, not an embedded canvas.
