# nuartz

> Obsidian-compatible digital garden built on Next.js + shadcn/ui

nuartz turns your Obsidian vault into a modern web app — wikilinks, callouts, backlinks, and all — without compromising on UI quality.

## Why nuartz?

[Quartz](https://quartz.jzhao.xyz) is an excellent Obsidian-to-web tool with deep OFM support. nuartz is built on the same parsing foundation — wikilinks, callouts, backlinks — but packages it as a composable remark/rehype plugin set that plugs into any Next.js app.

If you want Obsidian fidelity with full control over your React UI, nuartz is for you.

## Features

- **Wikilinks** — `[[page]]`, `[[page|alias]]`, `[[page#heading]]`
- **Callouts** — `> [!note]`, `> [!warning]`, `> [!tip]`, and more
- **Tags** — `#tag` inline tags rendered as links
- **Backlinks** — automatic backlink index per page
- **Math** — KaTeX inline and block
- **Syntax highlighting** — Shiki-based code blocks
- **Full-text search** — client-side with FlexSearch
- **Dark mode** — system-aware with manual toggle
- **shadcn/ui** — all components built on Radix primitives

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Radix UI |
| Styling | Tailwind CSS v4 |
| Markdown | unified / remark / rehype |
| Search | FlexSearch |
| Runtime | Bun |

## Roadmap

- [x] OFM markdown pipeline (wikilinks, callouts, tags)
- [x] Backlink index
- [x] shadcn/ui layout (sidebar, TOC, breadcrumbs)
- [x] Dark mode
- [x] Full-text search
- [ ] Graph view
- [ ] AI chat (LangGraph Python)
- [ ] File-based semantic search

## License

MIT
