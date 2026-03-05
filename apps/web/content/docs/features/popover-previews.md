---
title: Popover Previews
description: Wikipedia-style page previews when hovering over internal links.
---

nuartz supports popover previews -- when you hover over an internal link, a popup appears showing a preview of the linked page's content.

## How it works

Hovering over any internal link triggers a fetch for the target page. The preview displays the page title, metadata, and content excerpt in a scrollable popup. Links to specific headers will scroll the preview to that section.

Images referenced via wikilinks can also be previewed as popups.

## Limitations

Previews are only generated for pages within your vault. External links are not fetched due to browser CORS restrictions.

## Customization

Popover previews can be enabled or disabled in your site configuration. When building custom components, add the `popover-hint` class to any element you want included in the preview content.
