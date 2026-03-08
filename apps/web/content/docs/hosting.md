---
title: Hosting
description: Deploy Nuartz to GitHub Pages, Vercel, Netlify, or your own server.
---

Nuartz supports both static and server-side deployment. Choose based on your needs:

| Host | Type | Cost | Setup |
|------|------|------|-------|
| GitHub Pages | Static | Free | GitHub Actions workflow |
| Vercel | Server-side | Free tier | One-click import |
| Netlify | Server-side | Free tier | Import + plugin |
| Docker / Node.js | Server-side | Self-hosted | Manual |

## GitHub Pages

GitHub Pages serves static files for free. Nuartz supports this via Next.js static export.

### 1. Enable static export

Uncomment `output: "export"` in `apps/web/next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "export",
  // ...
}
```

### 2. Use the included workflow

The repo includes `.github/workflows/deploy-pages.yml`. It runs the prebuild script (copies media, generates graph and preview data as static JSON) then builds and deploys to GitHub Pages.

### 3. Enable Pages in repo settings

Go to **Settings > Pages** and set the source to **GitHub Actions**.

### 4. Push to main

Every push to `main` triggers a build and deploy automatically.

> [!note] What works in static export
> Search, graph view, popover previews, dark mode, tags, backlinks — all work. The prebuild script generates `graph.json` and `preview-index.json` at build time so client components can fetch static data instead of API routes.

> [!warning] What doesn't work in static export
> - OG image generation (edge runtime) — use pre-made images or a third-party service
> - External link previews (requires server-side fetch) — internal previews still work
> - Next.js Image Optimization — images are served as-is

---

## Vercel (recommended)

Vercel has first-class Next.js support and is the easiest option for the full feature set.

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
