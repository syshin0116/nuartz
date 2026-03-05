---
title: SPA Routing
description: Single-page app style navigation for smooth page transitions.
---

nuartz uses SPA (single-page application) style routing for smooth, instant page transitions without full page reloads.

## How it works

When you click an internal link, Next.js handles the navigation client-side, fetching only the data needed for the new page and updating the DOM without a full reload. This eliminates flashes of unstyled content and makes navigation feel instant.

Under the hood, this is powered by the Next.js App Router's built-in client-side navigation.

## Benefits

- No full page reloads between navigations
- Preserves scroll position and UI state where possible
- Faster perceived navigation speed

## Customization

SPA routing can be disabled in your site configuration if you prefer traditional full-page navigation.
