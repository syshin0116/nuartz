---
title: AI Agents
date: 2026-11-02
tags:
  - feature
  - ai
description: Markdown versions of every note, llms.txt, content negotiation, and a read-only MCP server for AI agents.
---

nuartz publishes your notes in forms that LLMs and coding agents can read directly, without scraping HTML.

## Markdown per note

`bun run generate` writes a portable Markdown copy of every published note to `/md/<slug>.md`, for example `/md/docs/features/ai-agents.md`. A folder URL gets a copy of its `index.md`, so `/md/docs.md` is the docs index.

The copy is plain CommonMark: frontmatter and `%%comments%%` are removed, the title (and `description` or `summary`) are added at the top, and wikilinks and embeds become ordinary links and images with absolute URLs. Code blocks are left unchanged. The library function behind it is `toStandardMarkdown()`.

Each note links to its copy in three ways:

- A `<link rel="alternate" type="text/markdown">` tag in the page head
- **Copy Markdown** (copies the note to the clipboard, e.g. to paste into a chat) and **View Markdown** buttons under the title
- Content negotiation: a page request whose `Accept` header prefers `text/markdown` over `text/html` gets the Markdown instead, with `Vary: Accept`. Claude Code and Cursor send this header. It is handled by `apps/web/proxy.ts`.

## llms.txt

- `/llms.txt` lists the site title, description, and every published note, linking each note's Markdown copy.
- `/llms-full.txt` contains every published note in one file, each preceded by an HTML comment with its URL.

## MCP server

Server deployments include a read-only [MCP](https://modelcontextprotocol.io/) server at `/api/mcp`. It is stateless and uses the streamable HTTP transport with JSON responses. Tools:

| Tool | Input | Returns |
|------|-------|---------|
| `search_notes` | `query`, optional `limit` (1-50, default 10) | Matching notes with slug, title, URL, tags, and excerpt |
| `read_note` | `slug` | The note's Markdown copy. Only slugs of published notes are accepted. |
| `list_notes` | optional `folder`, optional `limit` (1-500, default 100) | Published notes, newest first, with slug, title, URL, description, date, and tags |

To use it from Claude Code:

```bash
claude mcp add --transport http my-garden https://example.com/api/mcp
```

The server is named after `site.title`, and note URLs use `site.baseUrl`.

## Static export

| Feature | Static export |
|---------|:---:|
| `/md/<slug>.md`, alternate link, Copy / View Markdown | O |
| `/llms.txt`, `/llms-full.txt` | O |
| `Accept: text/markdown` content negotiation | X |
| `/api/mcp` | X |

`bun run build:static` sets `proxy.ts` and `/api/mcp` aside because they need a server. See [[docs/hosting|Hosting]].

> [!note]
> Unpublished notes and files under `_` or `.` folders never appear in any of these. See [[docs/features/private-pages|Private Pages]].
