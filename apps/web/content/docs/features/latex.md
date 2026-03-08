---
title: LaTeX
date: 2026-03-01
tags:
  - feature
  - math
description: Render inline and block math expressions using remark-math and rehype-katex.
---

nuartz renders LaTeX math expressions using [remark-math](https://github.com/remarkjs/remark-math) and [rehype-katex](https://github.com/remarkjs/remark-math/tree/main/packages/rehype-katex). Math is typeset at build time — no JavaScript required in the browser beyond the KaTeX CSS.

## Inline math

Wrap an expression in double dollar signs `$$...$$` for inline math.

```
The famous identity is $$e^{i\pi} + 1 = 0$$.
```

Renders as: The famous identity is $$e^{i\pi} + 1 = 0$$.

Another example: the energy-mass equivalence $$E = mc^2$$ is perhaps the most recognisable equation in physics.

## Block math

Wrap an expression in double dollar signs `$$` on their own lines for a centred block.

```
$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$
```

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

## Aligned equations

Use the `aligned` environment for multi-line derivations:

$$
\begin{aligned}
(a + b)^2 &= a^2 + 2ab + b^2 \\
(a - b)^2 &= a^2 - 2ab + b^2
\end{aligned}
$$

## Matrices

$$
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

## Dollar signs in text

Literal `$` signs in text are safe — they will not be parsed as math delimiters. Only `$$...$$` triggers math rendering.

```
I have $5 and you have $10.
```

Renders as: I have $5 and you have $10.

> [!info] Why not single dollar `$...$`?
>
> Single dollar math is disabled by default. Blog content — especially Korean/CJK text — frequently contains stray `$` characters that would be misinterpreted as math delimiters, producing KaTeX warnings. Double dollar `$$` is explicit and safe.

## Supported functions

KaTeX supports a large subset of LaTeX. See the [KaTeX supported functions reference](https://katex.org/docs/supported.html) for the full list.

> [!tip]
> For chemistry equations, KaTeX ships a `mhchem` extension. Enable it by importing `katex/contrib/mhchem` in the nuartz build configuration.

## Related

- [[docs/authoring-content|Authoring Content]] — full Markdown syntax reference
- [[docs/features/syntax-highlighting|Syntax Highlighting]] — code block highlighting
- [[docs/features/mermaid|Mermaid Diagrams]] — render diagrams in Markdown
