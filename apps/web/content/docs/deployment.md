---
order: 4
title: Deployment
date: 2026-03-01
tags:
  - deployment
  - vercel
description: Deploy your nuartz garden to Vercel in a few steps.
---

nuartz is a Next.js application that supports both static export (GitHub Pages) and server-side deployment (Vercel, Netlify). See the [[docs/hosting|full hosting guide]] for all options including GitHub Pages.

> [!info] Prerequisites
> - Your nuartz project is pushed to a GitHub repository.
> - The `apps/web/content/` directory is committed to the repo (not gitignored).

## Deploy to Vercel

### 1. Push to GitHub

Make sure all your content and configuration is committed:

```bash
git add .
git commit -m "initial content"
git push
```

### 2. Import the repository in Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and click **Add New Project**.
2. Select **Import Git Repository** and choose your nuartz repo.
3. Vercel auto-detects Next.js - leave the framework preset as **Next.js**.
4. Set the root directory to `apps/web`. The install and build commands come from `apps/web/vercel.json` (`cd ../.. && bun run build`).

### 3. Set the site URL

Set `site.baseUrl` in `apps/web/nuartz.config.ts` to your production URL, or add an environment variable before deploying:

| Name | Value |
|------|-------|
| `NUARTZ_SITE_URL` | `https://your-domain.vercel.app` |

It is used for canonical URLs, the sitemap, RSS, and OG tags. Update it to your custom domain once you have one.

### 4. Deploy

Click **Deploy**. Vercel runs `bun run build` (package build, `generate`, then `next build`) and publishes it. Your site is live at `<project>.vercel.app` within a minute or two.

> [!tip] Automatic deploys
> Every push to the `main` branch triggers a new production deployment automatically. Pull requests get preview deployments at unique URLs.

## Custom domain

1. Go to your project in the Vercel dashboard and open **Settings > Domains**.
2. Enter your domain and follow the DNS instructions.
3. Update `site.baseUrl` (or `NUARTZ_SITE_URL`) to match the new domain and redeploy.

## Content updates

Because `apps/web/content/` is part of the repo, updating your notes is just a git push:

```bash
# edit apps/web/content/notes/my-note.md
git add apps/web/content/
git commit -m "update notes"
git push
```

Vercel picks up the push and rebuilds automatically.

> [!warning] Keep content/ in the repo
> nuartz reads content files from disk at build time (`bun run generate`). If `apps/web/content/` is gitignored, the build will produce an empty site.

## Local production preview

Test the production build locally before deploying:

```bash
bun run build
bun run --cwd apps/web start
```

Open `http://localhost:3000` to verify everything looks correct.

## Related

- [[docs/getting-started|Getting Started]] - local development setup
- [[docs/configuration|Configuration]] - `nuartz.config.ts` reference
- [[docs/features/private-pages|Private Pages]] - exclude draft content from builds
