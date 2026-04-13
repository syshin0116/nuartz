---
title: Dark Mode
date: 2026-03-01
tags:
  - feature
  - ui
description: nuartz respects your system theme and lets you toggle dark mode from the header.
---

nuartz supports dark mode out of the box using [next-themes](https://github.com/pacocoursey/next-themes).

## Behaviour

- On first visit, the theme matches your operating system preference (`prefers-color-scheme`).
- A toggle button in the site header lets you switch between light and dark mode manually.
- Your choice is saved in `localStorage` and persists across page loads and navigation.

## System preference

If you have never toggled the switch, nuartz always follows your system setting. Change your OS appearance and the site updates immediately without a page reload.

> [!tip]
> If you want to always start in a specific theme, you can set a default in `nuartz.config.ts` under `theme.defaultMode`.

## Related

- [[docs/configuration|Configuration]] — customise colours, fonts, and layout
- [[docs/getting-started|Getting Started]] — initial setup
