---
title: Layout
description: Customize the page layout and component arrangement.
---

nuartz pages are composed of several sections that you can customize by rearranging or swapping components.

## Page sections

A typical nuartz page includes:

- **Header**: site title, search, `nav` links, reader mode and dark mode toggles
- **Left sidebar**: Home, All notes, and the [[docs/features/explorer|explorer]]
- **Content area**: breadcrumbs, title and dates, the rendered note, backlinks, previous/next links, and comments
- **Right sidebar**: table of contents and graph view

## Responsive behavior

nuartz adapts its layout based on screen width:

- **1280px and wider** (`xl`): both sidebars
- **1024px to 1279px** (`lg`): left sidebar and content; the table of contents and graph move into an **On this page** panel above the note
- **Below 1024px**: content only, with the explorer and links in the mobile menu

## Customization

There is no layout config: the shell is `apps/web/app/layout.tsx` and note pages are `apps/web/app/[...slug]/page.tsx`. Edit them to add, remove, or reorder components. See [[docs/layout-components|Layout & Components]].
