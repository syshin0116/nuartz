# Changelog

All notable changes to this project will be documented in this file.

## [0.1.7] - 2026-03-14

### Fixed
- **Inline math support** — enable `$...$` for inline math, `$$...$$` for block math (matching Obsidian behavior)
- **Graph view dark mode** — nodes were invisible because `hsl()` wrapped oklch CSS variables, producing invalid colors
- **Graph view tag styling** — tag nodes now use muted gray instead of accent color

### Changed
- Updated LaTeX docs to reflect single dollar inline math syntax

## [0.1.6] - 2026-03-13

### Fixed
- **Blog pagination** — converted from query string to path-based SSG
- **Backlink regex** — improved accuracy to match original quality
- **Performance** — lazy-load search index, static graph API, optimized backlinks

## [0.1.5] - 2026-03-08

### Added
- **GitHub Pages support** — static export mode with prebuild script that generates `graph.json`, `preview-index.json`, and copies media files. Deploy with the included GitHub Actions workflow.
- **Tooltips on header buttons** — Search, GitHub, Reader Mode, Theme Toggle now show tooltips on hover
- **Dependabot** — automatic dependency update PRs for npm packages and GitHub Actions

### Fixed
- **Full-text search actually works now** — cmdk was overriding FlexSearch results with its own slug-based filter. Disabled cmdk's built-in filter so FlexSearch content/tag search works correctly.
- **Cursor pointer on all buttons** — all buttons now show pointer cursor on hover, not just links

### Changed
- Rewrote README, philosophy, and hosting docs with clearer positioning: who Nuartz is for, how it compares to Quartz, and what works in each deployment mode (static vs server)
- Updated package description to "Publish your Obsidian vault as a Next.js website"

## [0.1.4] - 2026-03-08

### Added
- `sortBy: 'date'` option for `buildFileTree()` — sort by frontmatter date or filename date

## [0.1.3] - 2026-03-08

### Fixed
- Include `dist/` folder in npm package — fixes module resolution errors on install

## [0.1.2] - 2026-03-08

### Added
- `buildFileTree()` now accepts `sortBy` option (`'name'` | `'modified'`) — sort sidebar/nav by modification time
- `MarkdownFile` and `FileTreeNode` expose `mtime` (file modification time)

### Fixed
- Math rendering: disable single `$...$` parsing to prevent Korean/CJK text being misinterpreted as math
- KaTeX `strict: "ignore"` — suppress residual unicode-in-math warnings

## [0.1.1] - 2026-03-06

### Fixed
- `defineConfig` guarantees `baseUrl` is always a string (adds fallback)
- FlexSearch CJK tokenizer — Korean/Japanese/Chinese search now works correctly
- KaTeX CSS injection via `rehype-katex`
- Heading anchor positioning (right-side rendering)

## [0.1.0] - 2026-03-01

Initial release.

### Added
- `renderMarkdown()` — unified pipeline with full Obsidian-Flavored Markdown support
  - wikilink resolution (`[[note]]`, `[[note|alias]]`)
  - callout blocks (`> [!note]`, `> [!warning]`, etc.)
  - highlight (`==text==`), comment (`%%text%%`), arrows (`->`, `-->`)
  - syntax highlighting via `rehype-pretty-code` + Shiki
  - math rendering via `remark-math` + `rehype-katex`
  - heading anchors via `rehype-autolink-headings`
- `getAllMarkdownFiles()` — recursive markdown discovery with draft filtering
- `buildFileTree()` — folder-first sorted tree structure
- `buildSearchIndex()` — FlexSearch-based index with CJK support
- `buildBacklinkIndex()` / `getBacklinks()` — wikilink graph for backlinks
- `nuartz.config.ts` — user configuration (`title`, `baseUrl`, `homePage`, `nav`)
- Dead link detection and reporting
- Full TypeScript types (`Frontmatter`, `TocEntry`, `RenderResult`, `NuartzConfig`)
