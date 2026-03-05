---
title: Social Images
description: Auto-generated Open Graph preview images for social media sharing.
---

Nuartz generates Open Graph (OG) images for each page, providing rich link previews when your content is shared on Twitter/X, Discord, Slack, or iMessage.

## How it works

Two routes generate OG images:

| Route | Used for |
|-------|---------|
| `app/opengraph-image.tsx` | Root `/` OG image |
| `app/og/route.tsx` | Per-page OG images (Edge runtime) |

The per-page image is referenced in `<meta>` tags generated in `app/[...slug]/page.tsx`:

```ts
openGraph: {
  images: [`/og?title=${title}&description=${description}`],
}
```

The image shows the page title, description, and site name on a dark background (1200×630px).

## Customization

To change the visual design, edit `apps/web/app/og/route.tsx`. The JSX returned by the `GET` handler is rendered to a PNG via `ImageResponse`.

> [!note] No frontmatter override
> There is currently no support for specifying a custom `image` in frontmatter to override the auto-generated card. To add this, read `f.frontmatter.image` in the metadata generation code in `app/[...slug]/page.tsx` and use it as the OG image URL when present.

## Requirements

Set `NEXT_PUBLIC_SITE_URL` in your environment so that absolute OG image URLs resolve correctly when scraped by social platforms:

```bash
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```
