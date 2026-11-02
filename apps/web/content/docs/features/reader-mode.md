---
title: Reader Mode
description: Distraction-free reading by hiding sidebars and UI elements.
---

Reader mode provides a clean, focused reading experience by hiding sidebars and other UI elements.

## Usage

Click the book icon in the header (or in the mobile menu) to toggle it. When enabled:

- The left sidebar, the right sidebar (table of contents and graph), and the mobile **On this page** panel are hidden
- The content column is centered and limited to about 72 characters wide
- The setting is saved in `localStorage` (`reader-mode`), so it persists across navigation, reloads, and other open tabs

## Customization

The toggle adds the `reader-mode` class to the `<html>` element. Its styles are the `html.reader-mode` rules in `apps/web/app/globals.css`; edit them to change what is hidden. The toggle itself is `apps/web/components/reader-mode-toggle.tsx`.
