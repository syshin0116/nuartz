# Changelog

All notable changes to this project will be documented in this file.

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
