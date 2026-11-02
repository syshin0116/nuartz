# Social Images

> Auto-generated Open Graph preview images for social media sharing.

Nuartz generates Open Graph (OG) images for each page, providing rich link previews when your content is shared on Twitter/X, Discord, Slack, or iMessage.

## How it works

Two routes generate OG images:

| Route | Used for |
|-------|---------|
| `app/opengraph-image.tsx` | Site-wide OG image, used by `/` and any page without its own |
| `app/og/route.tsx` | Per-page OG images (Node.js runtime) |

The per-page image is referenced in `<meta>` tags generated in `app/[...slug]/page.tsx`:

```ts
openGraph: {
  images: [withBasePath(`/og?${new URLSearchParams({ title, description })}`)],
}
```

The description is the note's `description`, else `summary`, else an excerpt of its first paragraphs.

> [!note] Static export
> `/og` needs a server, so `bun run build:static` leaves it out and every page uses the site-wide image instead. See [Hosting](https://nuartz.vercel.app/docs/hosting).

The image shows the page title, description, and site name on a dark background (1200×630px).

## Customization

To change the visual design, edit `apps/web/app/og/route.tsx`. The site-wide image in `app/opengraph-image.tsx` has its own hard-coded text; update it for your site. The JSX returned by the `GET` handler is rendered to a PNG via `ImageResponse`.

> [!note] No frontmatter override
> There is currently no support for specifying a custom `image` in frontmatter to override the auto-generated card. To add this, read `f.frontmatter.image` in the metadata generation code in `app/[...slug]/page.tsx` and use it as the OG image URL when present.

## Requirements

Set `site.baseUrl` in `apps/web/nuartz.config.ts` (or the `NUARTZ_SITE_URL` environment variable, which the starter config reads) so that absolute OG image URLs resolve correctly when scraped by social platforms. It becomes Next's `metadataBase`.
