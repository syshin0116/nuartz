---
title: Bases
description: Obsidian Bases (.base) tables, cards, and lists, evaluated over your published notes at build time.
tags:
  - nuartz
  - features
  - bases
---

[Obsidian Bases](https://help.obsidian.md/bases) turn note properties into database-like views. nuartz evaluates a practical subset of the [Bases syntax](https://help.obsidian.md/bases/syntax) at build time, so the result is static HTML that works on any host. See [[bases-demo.base|the demo base]].

## Three ways to use a base

1. **A `.base` file** becomes its own page, with tabs when it has several views. URLs follow the same rule as [[canvas]] pages: `projects.base` is published at `/projects`, or at `/projects-base` when a note already uses `/projects`. Link to it as `[[projects.base]]`.
2. **An embed** `![[projects.base]]` in a note renders every view of that base inline.
3. **A code block** with the language `base` renders inline too:

```base
filters:
  and:
    - file.inFolder("docs/features")
    - file.hasTag("features")
views:
  - type: list
    name: Tagged features
    order: [file.name, description]
    limit: 3
```

The block above is written as:

````markdown
```base
filters:
  and:
    - file.inFolder("docs/features")
    - file.hasTag("features")
views:
  - type: list
    name: Tagged features
    order: [file.name, description]
    limit: 3
```
````

## Supported

Bases only see **published notes** (Markdown files that are not drafts or hidden). Attachments, canvases, and other bases are never rows.

- **Views**: `table`, `cards`, and `list`, with `name`, `order` (columns), `sort` (list of `property` and `direction`), `limit`, `groupBy`, and per-view `filters`. Other view types (for example kanban or map) are shown as tables with a notice.
- **Properties**: note properties (`status` or `note.status`), formulas (`formula.name`), and `file.name`, `file.basename`, `file.path`, `file.folder`, `file.ext`, `file.size`, `file.ctime`, `file.mtime`, `file.tags` (frontmatter and inline tags), `file.links` (wikilinks in the body and frontmatter), `file.properties`. `displayName` in `properties` sets column labels.
- **Filters**: `and`, `or`, and `not` lists of expressions, globally and per view.
- **Operators**: `==`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||`, `!`, `+`, `-`, `*`, `/`, `%`, parentheses, and list literals. Dates can be compared and shifted with durations such as `now() - "1w"`.
- **File functions**: `hasTag` (any of several tags, nested tags included), `inFolder` (subfolders included), `hasLink`, `hasProperty`, `asLink`.
- **Other functions**: `if`, `now`, `today`, `date`, `duration`, `number`, `list`, `link`, `file`, `min`, `max`; string methods (`contains`, `containsAll`, `containsAny`, `startsWith`, `endsWith`, `lower`, `upper`, `title`, `trim`, `replace`, `split`, `slice`, `repeat`, `reverse`); number methods (`abs`, `ceil`, `floor`, `round`, `toFixed`); list methods (`contains`, `containsAll`, `containsAny`, `join`, `filter`, `map`, `sort`, `unique`, `flat`, `slice`, `reverse`); date `format` (common Moment.js tokens), `date`, `time`, and fields such as `year`; `isEmpty`, `isTruthy`, `isType`, `toString`, and `length`.
- **`this`** is the base file on a base page, and the embedding note for embeds and code blocks.

Note names in cells link to the note, and property values written as `[[wikilinks]]` become links.

## Not supported

Anything below is skipped without failing the build. The page shows a short notice and `bun run generate` prints a warning:

- An expression that uses an unsupported function or property, such as `file.backlinks`, `file.embeds`, `reduce`, `relative()`, `random()`, regular expressions, `html()`, `image()`, or `icon()`. In a filter, that expression is ignored (treated as true). In a formula, the cell stays empty.
- `summaries` and `groupOrder`.
- View-specific display options such as card images, column widths, and row heights.
- `![[file.base#View]]` (embedding a single view). Embeds always show every view.

Bases are evaluated once, at build time: `now()` and `today()` are the build time, and dates are shown in UTC. Results change only when the site is rebuilt. `file.ctime` is the file's creation time on the build machine, which is usually the checkout time in CI.
