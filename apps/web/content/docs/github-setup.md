---
title: GitHub Repository Setup
description: How to set up a GitHub repository for your nuartz digital garden.
---

## Creating your repository

1. [Fork](https://github.com/syshin0116/nuartz/fork) or clone the nuartz repository
2. If cloning, create a new repository on GitHub (do **not** initialize with README or .gitignore)
3. Set your repository as the origin:

```bash
git clone https://github.com/syshin0116/nuartz.git my-garden
cd my-garden
git remote set-url origin https://github.com/YOUR-USERNAME/my-garden.git
```

## Keeping up with upstream

To pull updates from the main nuartz repository:

```bash
# Add upstream if you haven't already
git remote add upstream https://github.com/syshin0116/nuartz.git

# Fetch and merge updates
git fetch upstream
git merge upstream/main
```

Resolve any merge conflicts, especially in `apps/web/content/` where your content lives.

## Pushing your content

Your content lives in `apps/web/content/`. Commit and push as usual:

```bash
git add apps/web/content/
git commit -m "Add new notes"
git push
```

If you have [[deployment]] set up with Vercel, pushing to `main` will automatically deploy your site.

## Repository structure tips

- Keep personal content in `apps/web/content/` — this is the only directory you need to modify for most use cases
- Configuration lives in `apps/web/` (layout, styles, components)
- The core library in `packages/nuartz/` rarely needs changes unless you're adding [[creating-plugins|custom plugins]]
