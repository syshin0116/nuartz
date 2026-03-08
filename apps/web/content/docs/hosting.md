---
title: Hosting
description: Deploy Nuartz to GitHub Pages, Vercel, Netlify, or your own server.
---

Nuartz can be deployed in two ways: as a **static site** (GitHub Pages) or with a **server** (Vercel, Netlify, Docker). Most features work in both modes, but a few things need a server.

## Which mode should I use?

| Feature | Static (GitHub Pages) | Server (Vercel) |
|---------|:---:|:---:|
| Pages, search, graph view | O | O |
| Popover previews (internal links) | O | O |
| Dark mode, tags, backlinks, TOC | O | O |
| RSS feed, sitemap | O | O |
| Dynamic OG images (per-page social cards) | X | O |
| External link previews | X | O |
| Next.js image optimization | X | O |
| Cost | Free | Free tier |

**Short version:** if you just want to publish your notes for free, GitHub Pages works great. If you want social preview cards or external link previews, use Vercel.

---

## GitHub Pages (static export)

GitHub Pages serves static files for free. Nuartz supports this by building all pages as HTML at build time.

### How it works

When you enable static export, Nuartz:
1. **Pre-generates `graph.json`** — the same graph data that normally comes from `/api/graph`, saved as a static file
2. **Pre-generates `preview-index.json`** — preview data for internal link popups, no API needed
3. **Copies media files** from `content/` to `public/content/` so images work without a server
4. **Temporarily disables server-only routes** (API routes, OG image generation) that aren't compatible with static hosting
5. **Builds all pages as static HTML** using Next.js `output: "export"`

The prebuild script (`apps/web/scripts/prebuild-static.ts`) handles steps 1-4 automatically.

### Setup

#### 1. Enable GitHub Pages in your repo

Go to your repo's **Settings > Pages** and set the source to **GitHub Actions**.

#### 2. Enable automatic deployment

The repo includes `.github/workflows/deploy-pages.yml`, but it's set to manual dispatch by default (so it doesn't fail on repos that don't use GitHub Pages). To deploy on every push, add the `push` trigger:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

Or you can leave it as-is and trigger deployments manually from the **Actions** tab.

#### 3. Push to main

The workflow will:
1. Automatically enable `output: "export"` in `next.config.ts`
2. Run the prebuild script (generate static graph/preview data, copy media files)
3. Build all pages as static HTML
4. Deploy to GitHub Pages

That's it. Your site will be live at `https://<username>.github.io/<repo-name>/`.

> [!note] No manual config changes needed
> The workflow automatically enables static export during the build. Your `next.config.ts` stays unchanged in the repo, so Vercel and local `bun dev` continue to work normally.

> [!tip] Local testing
> You can test the static build locally:
> ```bash
> bun run apps/web/scripts/prebuild-static.ts
> bun run build
> npx serve apps/web/out
> ```

---

## Vercel (recommended)

Vercel has first-class Next.js support and enables the full feature set, including dynamic OG images and external link previews.

### 1. Import the repository

Go to [vercel.com/new](https://vercel.com/new), click **Import Git Repository**, and select your Nuartz repo.

### 2. Configure the project

Nuartz is a **monorepo** — the Next.js app lives in `apps/web`, not the root. Override the defaults:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js (auto-detected) |
| **Install Command** | `cd ../.. && bun install --frozen-lockfile` |
| **Build Command** | `cd ../.. && bun run build:pkg && cd apps/web && next build` |
| **Output Directory** | `.next` (default) |

> [!tip]
> The install and build commands run from `apps/web` by default. The overrides above `cd ../..` back to the monorepo root so Bun can resolve the `nuartz` workspace package.

### 3. Environment variables

Add these in **Settings > Environment Variables** if you use optional features:

```
# Site URL (used for RSS, OG images)
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app

# Giscus comments (optional)
NEXT_PUBLIC_GISCUS_REPO=your-user/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxx
```

### 4. Deploy

Click **Deploy**. Vercel rebuilds automatically on every push to `main`.

---

## Netlify

> [!warning]
> Netlify's Next.js support (via `@netlify/plugin-nextjs`) works but is less reliable than Vercel for App Router features. Use Vercel if possible.

1. Import your repo at [app.netlify.com](https://app.netlify.com)
2. Set **Base directory**: `apps/web`
3. Set **Build command**: `cd ../.. && bun run build:pkg && cd apps/web && next build`
4. Set **Publish directory**: `apps/web/.next`
5. Add the [Essential Next.js plugin](https://www.netlify.com/products/build/plugins/) if not auto-detected

---

## Self-hosting (Node.js / Docker)

### Node.js

```bash
# From repo root
bun run build          # builds nuartz package + Next.js app
cd apps/web
node .next/standalone/server.js
```

Make sure `output: "standalone"` is set in `apps/web/next.config.ts`.

### Docker

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build:pkg
RUN bun run --cwd apps/web build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

```bash
docker build -t nuartz .
docker run -p 3000:3000 nuartz
```
