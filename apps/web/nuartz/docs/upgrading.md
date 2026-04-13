---
title: Upgrading nuartz
description: How to update nuartz to the latest version
---

How you upgrade depends on how you're using nuartz.

## If you cloned the repo (starter template)

Pull the latest changes:

```bash
git pull origin main
bun install
```

If you have local changes that conflict with the updates, you may need to resolve merge conflicts manually.

> [!tip]
> If you get a conflict mid-merge, you can use `git merge --abort` to cancel and review what changed before trying again.

## If you installed the npm package

Update the package:

```bash
bun update nuartz
```

### Automatic updates with Dependabot

If you want to be notified when a new version of nuartz is released, you can set up [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates) in your repo. It will automatically open a PR when a new version is available.

Create `.github/dependabot.yml` in your project:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
```

That's it. Dependabot will check for updates weekly and open a PR like "Bump nuartz from 0.1.4 to 0.1.5" when a new version is published. Review the [changelog](https://github.com/syshin0116/nuartz/blob/main/CHANGELOG.md), merge the PR, and you're up to date.

## Checking for breaking changes

Before upgrading, check the [changelog](https://github.com/syshin0116/nuartz/blob/main/CHANGELOG.md) or [releases](https://github.com/syshin0116/nuartz/releases) page for any breaking changes that may require updates to your content or configuration.
