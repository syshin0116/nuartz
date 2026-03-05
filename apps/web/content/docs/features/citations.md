---
title: Citations
description: BibTeX citation support using rehype-citation
---

nuartz uses [rehype-citation](https://github.com/timlrx/rehype-citation) to support parsing of BibTeX bibliography files.

Under the default configuration, a citation key `[@templeton2024scaling]` will be exported as `(Templeton et al., 2024)`.

> [!example]- BibTeX file
>
> ```bib title="bibliography.bib"
> @article{templeton2024scaling,
>   title={Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet},
>   author={Templeton, Adly and Conerly, Tom and Marcus, Jonathan and others},
>   year={2024},
>   journal={Transformer Circuits Thread},
>   url={https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html}
> }
> ```

> [!note] Behaviour of references
>
> By default, references are included at the end of the page. To control where references appear, use `[^ref]`.
>
> Refer to the `rehype-citation` docs for more information.

## Status

Citation support is **not yet implemented** in nuartz. The `rehype-citation` plugin needs to be added to the markdown pipeline at `packages/nuartz/src/plugins/`. Contributions are welcome!
