---
title: Syntax Highlighting
tags:
  - plugin
---

nuartz uses [rehype-pretty-code](https://rehype-pretty-code.netlify.app/) (powered by [Shiki](https://shiki.style/)) for syntax highlighting. This gives you accurate, VS Code-quality highlighting with zero runtime JavaScript.

See [[features/syntax-highlighting]] for usage examples.

## Themes

The current theme is set in `packages/nuartz/src/markdown.ts`:

```ts
[rehypePrettyCode, {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
}]
```

You can replace `"github-light"` / `"github-dark"` with any [Shiki bundled theme](https://shiki.style/themes). Setting `keepBackground: true` uses the theme's own background colour instead of your site's `--background` variable.

## Line Highlighting

Annotate specific lines in fenced code blocks:

````markdown
```ts {2,4-6}
const a = 1    // plain
const b = 2    // highlighted
const c = 3    // plain
const d = 4    // highlighted
const e = 5    // highlighted
const f = 6    // highlighted
```
````

## Line Numbers

Add `showLineNumbers` to enable line numbers:

````markdown
```ts showLineNumbers
const x = 1
const y = 2
```
````

## Titles

Add a `title` attribute to label the code block:

````markdown
```ts title="src/index.ts"
export default {}
```
````

## Source

- [`packages/nuartz/src/markdown.ts`](https://github.com/your-user/nuartz/blob/main/packages/nuartz/src/markdown.ts)
- [rehype-pretty-code docs](https://rehype-pretty-code.netlify.app/)
