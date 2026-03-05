---
title: Social Images
description: Auto-generated Open Graph preview images for social media sharing.
---

nuartz can generate Open Graph (OG) images for each page, providing rich link previews when your content is shared on social media platforms like Twitter, Discord, or Slack.

## How it works

At build time, nuartz renders a styled card for each page containing the title and description. This image is referenced in the page's `<meta>` tags so that social platforms display it as a preview.

## Requirements

Your site's `baseUrl` must be configured correctly so that the OG image URLs resolve properly when shared.

## Customization

You can customize the appearance of generated social images -- including colors, fonts, and layout -- through your site configuration. Pages can also specify a custom `image` field in frontmatter to override the auto-generated card.
