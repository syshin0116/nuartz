# nuartz Design Decisions

## Core Principle

nuartz is a **composable OFM plugin set**, not a framework.
Use exactly the pieces you need, skip the rest.

## What nuartz is NOT

- Not a static site generator (that's Quartz's job, and it does it well)
- Not a Quartz fork — we don't sync or vendor Quartz internals
- Not opinionated about your Next.js app structure

## Plugin Architecture

nuartz exports individual remark/rehype plugins:

```
unified pipeline
  └── remark-parse
  └── remark-gfm           (npm)
  └── remark-math          (npm)
  └── remarkWikilink       ← nuartz
  └── remarkCallout        ← nuartz
  └── remarkTag            ← nuartz
  └── remark-rehype
  └── rehype-raw
  └── rehype-slug          (npm)
  └── rehype-katex         (npm)
  └── rehypeExtractToc     ← nuartz
  └── rehype-stringify
```

Each nuartz plugin is independently importable.
You can compose them with any other remark/rehype plugin.

## Why not copy Quartz's OFM plugin directly?

Quartz's OFM plugin uses `externalResources()` to inject vanilla JS
`<script>` tags that listen for a custom `nav` SPA event.
This is incompatible with React's event model and Next.js.

nuartz reimplements only the **remark/rehype transform layer**:
- `markdownPlugins()` → `remarkWikilink`, `remarkCallout`, `remarkTag`
- `htmlPlugins()` → `rehypeExtractToc`

Interactive behavior (foldable callouts, checkboxes) is handled
by React components instead of inline scripts.

## Wikilink Resolution

Default: `[[Page Name]]` → `/page-name` (lowercase, hyphenated)

Custom resolution via `resolveLink` option in `renderMarkdown()`:

```typescript
renderMarkdown(content, {
  resolveLink: (target) => `/notes/${slugify(target)}`,
})
```

## Backlink Index

Built at request time (Next.js RSC), not at build time.
Trade-off: slightly slower cold start, but always up-to-date in dev.
For large vaults, consider caching with `unstable_cache`.

## File Tree

`buildFileTree()` converts a flat `slug[]` list into a nested tree.
Folder nodes are inferred from path segments — no explicit folder config needed.

## Future: AI Layer (Phase 2)

- LangGraph Python backend (FastAPI)
- Semantic search over note embeddings
- Chat interface via prompt-kit
- Skill routing for note-aware Q&A
