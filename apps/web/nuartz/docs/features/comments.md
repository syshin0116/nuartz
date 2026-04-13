---
title: Comments
description: Allow readers to leave comments on your pages via Giscus
---

Nuartz ships with [Giscus](https://giscus.app/) — a comment system powered by GitHub Discussions. It requires no backend, no database, and is completely free.

## Setup

### 1. Enable GitHub Discussions

Your repository must be **public** and have Discussions enabled:
- Go to your repo → **Settings → Features → Discussions** → check it on.

### 2. Install the Giscus app

Install the [Giscus GitHub App](https://github.com/apps/giscus) on your repository.

### 3. Get your IDs

Visit [giscus.app](https://giscus.app/#repository), enter your repo name, and it will generate your config values. Select **Announcements** as the discussion category.

### 4. Add environment variables

In Vercel (or your `.env.local` for local dev):

```bash
NEXT_PUBLIC_GISCUS_REPO=your-user/your-repo
NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxxxxxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxxxxxxx
```

If any variable is missing, the comment section is silently hidden.

### 5. Done

The `<Giscus>` component in `apps/web/components/giscus.tsx` reads these env vars and renders automatically on every content page.

## Disabling per page

Add `comments: false` to a page's frontmatter:

```yaml
---
title: No comments here
comments: false
---
```

## Alternatives

Giscus requires a GitHub account to comment. If your audience is non-technical or you want anonymous comments, consider these alternatives:

### Waline

[Waline](https://waline.js.org/) supports anonymous comments, emoji reactions, and has an admin dashboard.

- Requires a backend: deploy to Vercel + a database (Vercel KV, PlanetScale, or MongoDB Atlas — all have free tiers)
- Setup: [waline.js.org/en/guide/get-started](https://waline.js.org/en/guide/get-started/)
- Replace `components/giscus.tsx` with the `@waline/client` script

### Remark42

[Remark42](https://remark42.com/) is a self-hosted, privacy-first system with support for Google, GitHub, Twitter, and anonymous logins.

- Requires Docker to self-host (no external database needed — stores data in a single file)
- Best if you control your own server
- Docker image: `umputun/remark42`

### Cusdis

[Cusdis](https://cusdis.com/) is ultra-lightweight (~5kb), anonymous-first, and requires no login from commenters.

- Requires self-hosting or their cloud plan
- Minimal UI — approve comments in a dashboard before they appear

### Utterances

[Utterances](https://utteranc.es/) is the predecessor to Giscus. It uses GitHub **Issues** instead of Discussions.

- Simpler than Giscus but lacks reactions and nested replies
- If you're already using Giscus, there's no reason to switch

## Comparison

| System | Login required | Backend | Nested replies | Reactions | Effort |
|--------|---------------|---------|---------------|-----------|--------|
| Giscus | GitHub | No | ✅ | ✅ | Low |
| Waline | Optional | Yes (Vercel) | ✅ | ✅ | Medium |
| Remark42 | Optional | Yes (Docker) | ✅ | ✅ | Medium |
| Cusdis | No | Yes (self-host) | ❌ | ❌ | Medium |
| Utterances | GitHub | No | ❌ | ❌ | Low |

**Recommendation:** For a developer-focused garden, stick with Giscus. For a general-audience blog, Waline is the best balance of features and setup effort.
