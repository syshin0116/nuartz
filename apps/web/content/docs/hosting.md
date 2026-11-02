---
order: 7
title: Hosting
description: Deploy Nuartz to GitHub Pages, Vercel, Netlify, or your own server.
---

Nuartz can be deployed in two ways: as a **static site** (GitHub Pages, S3, any CDN) or with a **Node server** (Vercel, Netlify, Docker). Most features work in both modes, but a few things need a server.

## Which mode should I use?

| Feature | Static export | Server |
|---------|:---:|:---:|
| Pages, search, graph view | O | O |
| Popover previews (internal links) | O | O |
| Dark mode, tags, backlinks, TOC | O | O |
| Images and attachments (`/content/...`) | O | O |
| RSS feed, sitemap, `llms.txt`, `/md/*.md` | O | O |
| Per-page OG images (`/og`) | X (site-wide image) | O |
| External link previews | X | O |
| `Accept: text/markdown` content negotiation | X | O |
| MCP server (`/api/mcp`) | X | O |

**Short version:** if you just want to publish your notes for free, GitHub Pages works well. If you want per-page social cards, external link previews, or the [[docs/features/ai-agents|agent endpoints]] that need a server, use Vercel or another Node host.

## Build commands

All commands run from the repository root:

| Command | What it does |
|---------|--------------|
| `bun run generate` | Reads `apps/web/content/` and writes the generated data (`apps/web/.generated/`, plus `graph.json`, `preview-index.json`, `content/`, `md/`, and the Pagefind index under `apps/web/public/`) |
| `bun run build` | `build:pkg` + `generate` + `next build`, for server deployments |
| `bun run build:static` | The same steps with `output: "export"`, writing static files to `apps/web/out` |

`generate` must run before `next build`; the app imports its output. `bun run build` and `bun run build:static` already include it.

---

## GitHub Pages (static export)

`bun run build:static` builds every page as HTML. It sets the export mode itself, so `next.config.ts` needs no edits. Two environment variables describe where the site will live:

| Variable | Example | Used for |
|----------|---------|----------|
| `NUARTZ_BASE_PATH` | `/my-garden` | Sub-path the site is served from. Leave unset at a domain root. |
| `NUARTZ_SITE_URL` | `https://user.github.io/my-garden` | Full public URL for canonical links, sitemap, RSS, and OG tags. The starter config uses it as `site.baseUrl`. |

Routes that need a server (`/og`, `/api/preview`, `/api/mcp`, and `proxy.ts`) are moved aside during the build and restored afterwards. Pages then use the site-wide `opengraph-image` instead of a per-page card.

### Setup

#### 1. Enable GitHub Pages in your repo

Go to your repo's **Settings > Pages** and set the source to **GitHub Actions**.

#### 2. Run the workflow

The repo includes `.github/workflows/deploy-pages.yml`. It runs only on manual dispatch, so it does not fail on repos that don't use GitHub Pages. Trigger it from the **Actions** tab, or add a `push` trigger to deploy on every push:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

The workflow installs dependencies, takes `NUARTZ_BASE_PATH` and `NUARTZ_SITE_URL` from `actions/configure-pages`, runs `bun run build:static`, and uploads `apps/web/out`.

Your site will be live at `https://<username>.github.io/<repo-name>/`.

> [!tip] Local testing
> ```bash
> NUARTZ_BASE_PATH=/my-garden NUARTZ_SITE_URL=http://localhost:3000/my-garden bun run build:static
> ```
> The output in `apps/web/out` expects to be served under `/my-garden`. Without `NUARTZ_BASE_PATH`, serve `apps/web/out` at the root, e.g. `npx serve apps/web/out`.

---

## Vercel (recommended)

Vercel has first-class Next.js support and enables the full feature set.

### 1. Import the repository

Go to [vercel.com/new](https://vercel.com/new), click **Import Git Repository**, and select your Nuartz repo.

### 2. Configure the project

Nuartz is a **monorepo**: the Next.js app lives in `apps/web`, not the root. Set **Root Directory** to `apps/web`. The install and build commands come from `apps/web/vercel.json`:

```json
{
  "installCommand": "cd ../.. && bun install --frozen-lockfile",
  "buildCommand": "cd ../.. && bun run build"
}
```

They `cd ../..` back to the monorepo root so Bun can resolve the `nuartz` workspace package and run `generate`.

### 3. Site URL and environment variables

Set `site.baseUrl` in `apps/web/nuartz.config.ts` to your production URL, or set `NUARTZ_SITE_URL` in **Settings > Environment Variables** (the starter config reads it first). It drives canonical URLs, the sitemap, RSS, and OG tags.

For [[docs/features/comments|comments]], also add:

```.env
NEXT_PUBLIC_GISCUS_REPO=your-user/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxx
```

### 4. Deploy

Click **Deploy**. Vercel rebuilds automatically on every push to `main`. The Pagefind search index is built during `generate`, so search works on Vercel too.

---

## Netlify

> [!warning]
> Netlify's Next.js support (via `@netlify/plugin-nextjs`) works but is less reliable than Vercel for App Router features. Use Vercel if possible.

1. Import your repo at [app.netlify.com](https://app.netlify.com)
2. Set **Base directory**: `apps/web`
3. Set **Build command**: `cd ../.. && bun run build`
4. Set **Publish directory**: `apps/web/.next`
5. Add the [Essential Next.js plugin](https://www.netlify.com/products/build/plugins/) if not auto-detected

---

## Self-hosting (Node.js / Docker)

Use Node.js 22.12 or later (the root `package.json` `engines` field).

### Node.js

```bash
# From repo root
bun run build                     # nuartz package + generate + Next.js app
bun run --cwd apps/web start      # next start on port 3000
```

### Docker

See [[docs/features/docker-support|Docker Support]] for a Dockerfile.
