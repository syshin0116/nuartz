# RSS Feed

> Automatically generated RSS feed for your content.

Nuartz generates an RSS feed so readers can subscribe to your site using any RSS reader.

## How it works

The feed is a statically generated route at `/rss.xml`. It includes the title, description, date, and link for the 20 most recent published notes. The channel language is `site.locale` (default `en`).

After deploying, your RSS feed is available at:

```
https://your-site.com/rss.xml
```

The implementation lives in `apps/web/app/rss.xml/route.ts`.

## Requirements

Item URLs are built from `site.baseUrl` in `apps/web/nuartz.config.ts` (or the `NUARTZ_SITE_URL` environment variable, which the starter config reads), so set it to your public URL.

Notes are ordered by `date` (or `created`) in frontmatter, falling back to the file's first git commit. The item description is the note's `description`, else `summary`, else an excerpt of its first paragraphs. [Unpublished notes](https://nuartz.vercel.app/docs/features/private-pages) are never included.

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
