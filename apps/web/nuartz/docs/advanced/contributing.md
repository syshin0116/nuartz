---
title: Contributing
description: How to contribute to the nuartz project.
---

nuartz is open source and welcomes contributions. Here's how to get started.

## Setup

```bash
git clone https://github.com/syshin0116/nuartz.git
cd nuartz
bun install
```

## Project structure

```
nuartz/
  apps/web/          # Next.js digital garden app
  packages/nuartz/   # Core markdown processing library
  refs/              # Reference materials
```

See [[architecture]] for details on how the pieces fit together.

## Development

Start the dev server:

```bash
cd apps/web
bun dev
```

Run tests:

```bash
cd packages/nuartz
bun test
```

## Making changes

1. Create a branch from `main`
2. Make your changes
3. Add tests if you're modifying `packages/nuartz`
4. Verify the dev server renders correctly
5. Open a pull request

## Content contributions

To add or improve documentation, edit files in `apps/web/content/`. All content files need frontmatter with at least `title` and `description`. See [[frontmatter]] for details.

## Plugin contributions

If you're adding a new remark or rehype plugin, see [[creating-plugins]] for the conventions and testing patterns.
