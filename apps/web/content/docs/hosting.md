---
title: Hosting
description: Deploy Nuartz to Vercel, Netlify, or your own server.
---

Nuartz is a Next.js 15 app with server-side features (API routes, OG image generation, etc.) so it requires a Node.js-compatible host — not a plain static host like GitHub Pages.

## Vercel (recommended)

Vercel is the easiest option and has first-class Next.js support.

### 1. Import the repository

Go to [vercel.com/new](https://vercel.com/new), click **Import Git Repository**, and select your Nuartz repo.

### 2. Configure the project

Nuartz is a **monorepo** — the Next.js app lives in `apps/web`, not the root. You must override the defaults:

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

Add these in **Settings → Environment Variables** if you use optional features:

```
# Giscus comments (optional)
NEXT_PUBLIC_GISCUS_REPO=your-user/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxx

# Site URL (used for RSS, OG images)
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
```

### 4. Deploy

Click **Deploy**. Vercel will rebuild automatically on every push to `main`.

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

---

## Why not GitHub Pages?

GitHub Pages only serves static files. Nuartz uses:
- `/api/graph` — server-side API route
- `/api/preview` — server-side API route
- `/app/og` — Edge runtime OG image generation
- Next.js Image Optimization

These require a Node.js runtime, so GitHub Pages is not compatible.
