---
title: Comments
description: Allow readers to leave comments on your pages
---

nuartz can integrate with comment providers to let readers leave comments on your site.

## Status

Comments are **not yet implemented** in nuartz. The following describes the planned approach.

## Providers

### Giscus

[Giscus](https://giscus.app/) uses GitHub Discussions to power a comment system. To use it, your GitHub repository must meet these requirements:

1. The repository is [public](https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/setting-repository-visibility#making-a-repository-public)
2. The [Giscus app](https://github.com/apps/giscus) is installed
3. The Discussions feature is [enabled](https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/enabling-or-disabling-github-discussions-for-a-repository)

Use the [Giscus configuration site](https://giscus.app/#repository) to get your `repoId` and `categoryId`. Select **Announcements** for the discussion category.

Once nuartz adds comment support, you will be able to configure Giscus in your site configuration with values like:

- `repo` - your GitHub repository (e.g. `user/repo`)
- `repoId` - from the Giscus configuration
- `category` - typically `Announcements`
- `categoryId` - from the Giscus configuration

### Conditionally displaying comments

Comments can be disabled on individual pages using frontmatter:

```yaml
---
title: No comments here
comments: false
---
```
