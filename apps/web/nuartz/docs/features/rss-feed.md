---
title: RSS Feed
description: Automatically generated RSS feed for your content.
---

Nuartz generates an RSS feed so readers can subscribe to your site using any RSS reader.

## How it works

The feed is served as a dynamic route at `/rss.xml`. It includes the title, description, date, and link for the 20 most recent published pages.

After deploying, your RSS feed is available at:

```
https://your-site.com/rss.xml
```

The implementation lives in `apps/web/app/rss.xml/route.ts`.

## Requirements

Set `NEXT_PUBLIC_SITE_URL` in your environment so that item URLs resolve correctly:

```bash
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```

Pages should include `date` in their frontmatter to appear in the feed with proper ordering. Pages with `draft: true` are excluded automatically.

## Linking the feed

Add the feed URL to your site header or `<head>` so RSS readers can auto-discover it. In `apps/web/app/layout.tsx`, add:

```tsx
export const metadata: Metadata = {
  // ...
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
}
```
