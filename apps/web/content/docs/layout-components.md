---
title: Layout & Components
description: How nuartz structures its layout and the key React components you can customize.
---

nuartz uses the Next.js App Router with a component-based layout. Unlike Quartz's custom component system, nuartz uses standard React components styled with Tailwind CSS.

## Layout structure

The root layout (`apps/web/app/layout.tsx`) defines the page shell:

```
┌─────────────────────────────────────────────┐
│  Header (logo, mobile nav, theme toggle)    │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │         Main Content             │
│ (nav)    │  ┌─────────────┬────────────┐    │
│          │  │  Article    │  ToC / Graph│    │
│          │  │             │  Backlinks  │    │
│          │  └─────────────┴────────────┘    │
│          │                                  │
├──────────┴──────────────────────────────────┤
```

- **Header** (`components/layout/header.tsx`) — top bar with site title, mobile hamburger menu, and theme toggle
- **NavSidebar** (`components/layout/nav-sidebar.tsx`) — left sidebar with file tree navigation, hidden on mobile
- **Main content** — rendered markdown with table of contents and graph view in the right column

## Key components

### Layout components

| Component | File | Purpose |
|-----------|------|---------|
| Header | `components/layout/header.tsx` | Top navigation bar |
| NavSidebar | `components/layout/nav-sidebar.tsx` | File tree sidebar |
| MobileNav | `components/layout/mobile-nav.tsx` | Mobile slide-out navigation |
| LayoutShell | `components/layout/layout-shell.tsx` | Page content wrapper |

### Content components

| Component | File | Purpose |
|-----------|------|---------|
| TableOfContents | `components/toc.tsx` | Right-side heading navigation |
| GraphView | `components/graph-view.tsx` | Interactive note graph |
| Backlinks | `components/backlinks.tsx` | Pages linking to current page |
| Breadcrumb | `components/breadcrumb.tsx` | Path breadcrumbs |
| FileExplorer | `components/file-explorer.tsx` | Folder tree browser |
| CommandPalette | `components/command-palette.tsx` | `Cmd+K` search |
| HeadingAnchors | `components/heading-anchors.tsx` | Clickable heading links |
| MermaidRenderer | `components/mermaid-renderer.tsx` | Mermaid diagram rendering |
| ThemeToggle | `components/theme-toggle.tsx` | Light/dark mode switch |

### UI primitives

Reusable primitives live in `components/ui/` — button, badge, card, dialog, sheet, scroll-area, tooltip, etc. These follow [shadcn/ui](https://ui.shadcn.com/) conventions.

## Customizing the layout

Since nuartz uses standard React and Tailwind, customization is straightforward:

### Modifying the sidebar

Edit `components/layout/nav-sidebar.tsx` to change what appears in the left sidebar. The component receives a `tree` prop built from your content directory structure.

### Changing the page layout

The root layout in `app/layout.tsx` controls the overall page structure. You can adjust column widths, hide the sidebar, or rearrange sections by editing the Tailwind classes.

### Adding components to pages

The catch-all page route (`app/[...slug]/page.tsx`) renders individual content pages. Add or remove components (graph view, backlinks, table of contents) here.

### Responsive behavior

nuartz uses Tailwind breakpoints for responsive design:

- **Mobile** (`< lg`): sidebar hidden, hamburger menu in header
- **Desktop** (`lg+`): sidebar visible, full layout

There is no `MobileOnly` / `DesktopOnly` wrapper — use Tailwind's `hidden lg:block` and `lg:hidden` classes directly.

## Styling

Global styles are in `apps/web/app/globals.css`. Component-specific styles use Tailwind utility classes. CSS variables control theming (colors, spacing, sidebar width) and are defined in `globals.css`.
