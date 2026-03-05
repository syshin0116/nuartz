---
title: Mermaid Diagrams
date: 2026-03-01
tags:
  - nuartz
  - features
  - mermaid
description: Render Mermaid diagrams in nuartz — flowcharts, sequence diagrams, class diagrams, and more.
---

nuartz renders [Mermaid](https://mermaid.js.org/) diagrams directly from code blocks. Create flowcharts, sequence diagrams, class diagrams, and more using simple text syntax.

## Flowchart

```mermaid
graph TD
    A[Write Markdown] --> B{Has wikilinks?}
    B -->|Yes| C[Resolve links]
    B -->|No| D[Parse as standard MD]
    C --> E[Render HTML]
    D --> E
    E --> F[Publish]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant N as nuartz
    participant MD as Markdown Parser
    participant R as React

    U->>N: Add .md file to content/
    N->>MD: Parse frontmatter + body
    MD->>MD: Resolve wikilinks
    MD->>R: Generate React components
    R->>U: Rendered page
```

## Class Diagram

```mermaid
classDiagram
    class Config {
        +string contentDir
        +SiteConfig site
        +Features features
        +NavConfig nav
    }
    class SiteConfig {
        +string title
        +string description
        +string baseUrl
    }
    class Features {
        +bool wikilinks
        +bool callouts
        +bool tags
        +bool backlinks
        +bool toc
        +bool search
    }
    Config --> SiteConfig
    Config --> Features
```

## Syntax

Use a fenced code block with the `mermaid` language:

````markdown
```mermaid
graph LR
    A --> B --> C
```
````

> [!tip] Mermaid Live Editor
> Use the [Mermaid Live Editor](https://mermaid.live/) to prototype your diagrams before adding them to your notes.

> [!note] Theme Matching
> Mermaid diagrams automatically adapt to nuartz's light/dark theme.

## Related

- [[docs/features/syntax-highlighting|Syntax Highlighting]] — code block rendering
- [[docs/authoring-content|Authoring Content]] — full content writing guide
- [[docs/configuration|Configuration]] — enable/disable features
