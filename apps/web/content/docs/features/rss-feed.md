---
title: RSS Feed
description: Automatically generated RSS feed for your content.
---

nuartz generates an RSS feed so readers can subscribe to your site using any RSS reader.

## How it works

An `index.xml` file is emitted at build time containing your published content. The feed includes the title, description, date, and a link to each page.

After deploying, your RSS feed is available at:

```
https://your-site.com/index.xml
```

## Requirements

Make sure your site configuration includes a `baseUrl` so that RSS links resolve correctly. Pages should include `date` in their frontmatter to appear in the feed with proper ordering.

## Customization

You can control which pages appear in the feed by adjusting frontmatter fields like `draft` or by filtering on tags and folders in your build configuration.
