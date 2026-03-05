---
title: Upgrading nuartz
description: How to update nuartz to the latest version
---

nuartz is distributed as a monorepo with the web app at `apps/web/` and the markdown pipeline at `packages/nuartz/`. To upgrade, pull the latest changes from the repository:

```bash
git pull origin main
bun install
```

If you have local changes that conflict with the updates, you may need to resolve merge conflicts manually.

> [!tip]
> If you get a conflict mid-merge, you can use `git merge --abort` to cancel and review what changed before trying again.

For help resolving conflicts, see the [GitHub guide on resolving merge conflicts](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line).

## Checking for breaking changes

After upgrading, check the commit history or release notes for any breaking changes that may require updates to your content or configuration.
