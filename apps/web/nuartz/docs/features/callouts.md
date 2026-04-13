---
title: Callouts
date: 2026-03-01
tags:
  - nuartz
  - features
  - callouts
description: Obsidian-style callout blocks in nuartz — all supported types with live examples.
---

nuartz supports the same callout syntax as Obsidian. Use them to draw attention to important information in your notes.

## Syntax

```markdown
> [!type] Optional Title
> Callout content here. Supports **Markdown** and [[docs/features/wikilinks|wikilinks]].
```

If you omit the title, the callout type name is used as the default title.

## Showcase

### Informational

> [!note]
> Use **note** for general-purpose annotations.

> [!info]
> Use **info** to provide additional context or background.

> [!tip] Helpful Tip
> Use **tip** to share useful advice or shortcuts.

> [!question] FAQ
> Use **question** for frequently asked questions or open-ended queries.

### Status

> [!success] Done
> Use **success** to indicate completed tasks or positive outcomes.

> [!warning]
> Use **warning** to flag potential issues or things to be careful about.

> [!danger]
> Use **danger** for critical alerts that require immediate attention.

> [!bug]
> Use **bug** to document known issues or unexpected behavior.

### Content

> [!example] Usage Example
> Use **example** to show sample usage or demonstrations.
>
> ```typescript
> const garden = new Garden({ theme: "dark" })
> ```

> [!quote] Albert Einstein
> Imagination is more important than knowledge.

> [!abstract]
> Use **abstract** (also: summary, tldr) for brief overviews.

> [!todo]
> - [x] Implement callout parsing
> - [x] Add styling for all types
> - [ ] Add collapsible callouts

## Nesting

Callouts can be nested inside each other:

> [!question] Can callouts be nested?
>
> > [!success] Yes!
> > You can nest callouts to create layered information structures.

## Using Callouts Effectively

> [!tip] Best Practices
> - Use callouts sparingly — too many reduces their impact
> - Pick the right type to match the intent of your message
> - Keep callout content concise
> - See [[docs/authoring-content|Authoring Content]] for more writing tips
