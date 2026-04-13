---
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
> - The `content/` directory is committed to the repo (not gitignored).

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
3. Vercel auto-detects Next.js — leave the framework preset as **Next.js**.
4. Leave the root directory as `./` (or `apps/web` if you use the monorepo layout).

### 3. Set the environment variable

In the **Environment Variables** section before deploying, add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` |

Update this to your custom domain once you have one.

### 4. Deploy

Click **Deploy**. Vercel builds the project with `next build` and publishes it. Your site is live at `<project>.vercel.app` within a minute or two.

> [!tip] Automatic deploys
> Every push to the `main` branch triggers a new production deployment automatically. Pull requests get preview deployments at unique URLs.

## Custom domain

1. Go to your project in the Vercel dashboard and open **Settings > Domains**.
2. Enter your domain and follow the DNS instructions.
3. Update `NEXT_PUBLIC_SITE_URL` to match the new domain and redeploy.

## Content updates

Because `content/` is part of the repo, updating your notes is just a git push:

```bash
# edit content/notes/my-note.md
git add content/
git commit -m "update notes"
git push
```

Vercel picks up the push and rebuilds automatically.

> [!warning] Keep content/ in the repo
> nuartz reads content files from disk at build time. If `content/` is gitignored, the build will produce an empty site.

## Local production preview

Test the production build locally before deploying:

```bash
bun run build
bun run start
```

Open `http://localhost:3000` to verify everything looks correct.

## Related

- [[docs/getting-started|Getting Started]] — local development setup
- [[docs/configuration|Configuration]] — `nuartz.config.ts` reference
- [[docs/features/private-pages|Private Pages]] — exclude draft content from builds
