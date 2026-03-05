---
title: Creating Layout Components
---

nuartz's UI is built from standard Next.js React components using Tailwind CSS v4. This guide explains how to add new components or extend existing ones.

## Component Location

All layout and UI components live in `apps/web/components/`. They are organized by concern:

```
apps/web/components/
├── layout/
│   ├── nav-sidebar.tsx      # Left navigation tree
│   ├── right-sidebar.tsx    # Right sidebar (TOC, graph, backlinks)
│   └── breadcrumbs.tsx      # Breadcrumb navigation
├── graph-view.tsx           # D3 force-directed graph
├── backlinks.tsx            # Backlinks list
├── popover-preview.tsx      # Hover preview for wikilinks
├── reader-mode-toggle.tsx   # Reader mode button
└── copy-code.tsx            # Code block copy button
```

## A Simple Component

Create a new file in `apps/web/components/`:

```tsx title="apps/web/components/note-count.tsx"
interface NoteCountProps {
  count: number
}

export function NoteCount({ count }: NoteCountProps) {
  return (
    <p className="text-xs text-muted-foreground">
      {count} notes published
    </p>
  )
}
```

Then import and use it in a page or layout.

## Adding to the Page Layout

The main page layout is in `apps/web/app/[...slug]/page.tsx`. The right sidebar content is composed in:

```tsx title="apps/web/app/[...slug]/page.tsx"
import { NoteCount } from "@/components/note-count"

// Inside the sidebar section:
<NoteCount count={files.length} />
```

## Client vs Server Components

Next.js 15 uses React Server Components by default. Most layout components can be server components (no `"use client"` directive needed).

Use `"use client"` only when you need:
- Browser APIs (`window`, `document`, `localStorage`)
- React hooks (`useState`, `useEffect`, `useRef`)
- Event listeners

```tsx
"use client"

import { useState } from "react"

export function Collapsible({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}>Toggle</button>
      {open && children}
    </div>
  )
}
```

## Styling

nuartz uses **Tailwind CSS v4** with oklch-based CSS variables defined in `apps/web/app/globals.css`. Use the standard Tailwind utility classes and design tokens:

| Token | Purpose |
|-------|---------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / dimmed text |
| `bg-background` | Page background |
| `bg-muted` | Subtle surface (hover states, cards) |
| `border` | Default border colour |
| `hsl(var(--primary))` | Accent colour |

> [!warning]
> Tailwind v4's `@apply` only works inside files that begin with `@import "tailwindcss"`. For component-level styles, use utility classes directly in JSX.

## Reading Markdown Data

Server components can read content from the filesystem using nuartz's core functions:

```tsx
import { getAllMarkdownFiles, renderMarkdown } from "nuartz"
import path from "node:path"

const CONTENT_DIR = path.join(process.cwd(), "content")

export async function RecentNotes() {
  const files = await getAllMarkdownFiles(CONTENT_DIR)
  const recent = files
    .sort((a, b) => (b.frontmatter.date ?? "") > (a.frontmatter.date ?? "") ? 1 : -1)
    .slice(0, 5)

  return (
    <ul>
      {recent.map(f => (
        <li key={f.slug}>
          <a href={`/${f.slug}`}>{f.frontmatter.title ?? f.slug}</a>
        </li>
      ))}
    </ul>
  )
}
```

## Tips

- Keep components small and focused — one responsibility per file.
- Prefer server components to avoid shipping unnecessary JavaScript to the browser.
- Look at existing components in `apps/web/components/` as reference implementations.
