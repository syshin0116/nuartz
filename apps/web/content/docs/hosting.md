---
title: Hosting
description: Deploy your nuartz site to Vercel, Netlify, Cloudflare Pages, or any static host.
---

nuartz builds your content into static HTML, CSS, and JS files that can be deployed to any static hosting provider.

## Vercel (recommended)

1. Push your nuartz project to a GitHub repository.
2. Import the repository in the [Vercel Dashboard](https://vercel.com/dashboard).
3. Set the framework preset to **Next.js** (nuartz uses Next.js under the hood).
4. Deploy. Vercel will automatically rebuild on every push.

Add a custom domain under **Settings > Domains** in your Vercel project.

## Netlify

1. Import your repository in [Netlify](https://app.netlify.com/).
2. Set the build command to `bun run build`.
3. Set the publish directory to `.next` or as configured by your output settings.
4. Deploy.

## Cloudflare Pages

1. Connect your repository in the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Set the build command and output directory to match your nuartz configuration.
3. Deploy.

## Self-hosting

Run `bun run build` to generate the production output, then serve the resulting files with any web server (Nginx, Caddy, Apache, etc.).

Make sure your `baseUrl` is configured correctly in your site settings so that features like RSS feeds and sitemaps generate valid URLs.
