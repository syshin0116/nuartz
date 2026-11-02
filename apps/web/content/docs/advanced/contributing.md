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
```

See [[architecture]] for details on how the pieces fit together.

## Development

Start the dev server:

```bash
bun dev
```

Run the full check (package build, `generate`, lint, typecheck, tests with coverage, and content validation), as CI does:

```bash
bun run check
```

## Making changes

1. Create a branch from `main`
2. Make your changes
3. Add tests if you're modifying `packages/nuartz`
4. Verify the dev server renders correctly
5. Open a pull request

## Content contributions

To add or improve documentation, edit files in `apps/web/content/`. Give each content file frontmatter with at least `title` and `description`; `bun run check` warns about a missing `title`. See [[docs/frontmatter|Frontmatter]] for details.

## Plugin contributions

If you're adding a new remark or rehype plugin, see [[creating-plugins]] for the conventions and testing patterns.
