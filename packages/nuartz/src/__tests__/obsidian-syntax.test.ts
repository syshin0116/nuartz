import { describe, expect, it } from "vitest"
import { renderMarkdown } from "../markdown"
import type { RenderOptions } from "../types"

const assets = new Set(["attachments/photo.png", "attachments/clip.mp4", "audio/talk.mp3", "docs/paper.pdf", "files/data.zip", "notes/local.png"])
const options: RenderOptions = {
  filePath: "notes/current.md",
  knownSlugs: new Set(["notes/current", "other", "guide"]),
  // Obsidian-style lookup: exact path, then unique file name anywhere.
  resolveAsset: target => {
    const hit = assets.has(target) ? target : [...assets].find(path => path.endsWith(`/${target}`))
    return hit ? `/content/${hit}` : undefined
  },
}
const render = (markdown: string) => renderMarkdown(markdown, options)

describe("attachment embeds", () => {
  it("finds attachments by file name and applies Obsidian size syntax", async () => {
    const { html } = await render("![[photo.png|300]] ![[photo.png|300x200]] ![[photo.png|A caption]]")
    expect(html).toContain('src="/content/attachments/photo.png" alt="photo.png" class="embed-image" data-embed="photo.png" width="300" loading="lazy"')
    expect(html).toContain('width="300" height="200"')
    expect(html).toContain('alt="A caption"')
  })

  it("embeds video, audio and PDF files with native elements", async () => {
    const { html } = await render("![[clip.mp4|640]]\n\n![[talk.mp3]]\n\n![[paper.pdf]]")
    expect(html).toContain('<video src="/content/attachments/clip.mp4" controls preload="metadata" class="embed-video" data-embed="clip.mp4" width="640"></video>')
    expect(html).toContain('<audio src="/content/audio/talk.mp3" controls preload="metadata" class="embed-audio"')
    expect(html).toContain('<iframe src="/content/docs/paper.pdf" title="paper.pdf" class="embed-pdf"')
  })

  it("links other file types and marks missing attachments instead of linking a note", async () => {
    const { html, links } = await render("![[data.zip]] ![[gone.png]]")
    expect(html).toContain('<a href="/content/files/data.zip" class="embed-file" download>data.zip</a>')
    expect(html).toContain('<span class="embed-missing" title="Attachment not found">gone.png</span>')
    expect(links).toEqual([])
  })
})

describe("Markdown links and images", () => {
  it("resolves links to notes with or without .md and records them as links", async () => {
    const { html, links } = await render("[Other](other.md) and [Guide](guide#Setup%20Steps) and [Gone](missing.md)")
    expect(html).toContain('<a href="/other" class="internal" data-target="other">Other</a>')
    expect(html).toContain('<a href="/guide#setup-steps" class="internal" data-target="guide" data-heading="Setup Steps">Guide</a>')
    expect(html).toContain('class="internal broken" data-target="missing"')
    expect(links).toEqual(["other", "guide", "missing"])
  })

  it("resolves relative images and attachment links, and reads |size from alt text", async () => {
    const { html } = await render("![Photo|240](local.png) [Report](paper.pdf)")
    expect(html).toContain('<img src="/content/notes/local.png" alt="Photo" class="embed-image" data-embed="local.png" width="240"')
    expect(html).toContain('<a href="/content/docs/paper.pdf">Report</a>')
  })

  it("keeps the query and fragment of attachment links and images", async () => {
    const { html } = await render("![Photo](local.png?v=2) [Page 3](paper.pdf#page=3)")
    expect(html).toContain('src="/content/notes/local.png?v=2"')
    expect(html).toContain('<a href="/content/docs/paper.pdf#page=3">Page 3</a>')
  })

  it("embeds YouTube and external video URLs, and leaves other external links alone", async () => {
    const { html } = await render("![](https://youtu.be/dQw4w9WgXcQ?t=42)\n\n![|320](https://example.com/v.webm)\n\n[site](https://example.com/page.md) ![x](https://example.com/a.png)")
    expect(html).toContain('<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?start=42"')
    expect(html).toContain('<video src="https://example.com/v.webm" controls preload="metadata" class="embed-video" data-embed="https://example.com/v.webm" width="320">')
    expect(html).toContain('<a href="https://example.com/page.md">site</a>')
    expect(html).toContain('<img src="https://example.com/a.png" alt="x">')
  })
})

describe("block references", () => {
  it("gives a list item's ^id to the item itself", async () => {
    const { html } = await render("- first ^item-a\n- second")
    expect(html).toContain('<li id="item-a">first</li>')
  })

  it("embeds a nested list item with its children", async () => {
    const source = "# Notes\n\n- parent\n  - target item ^deep\n    - child of target\n- sibling"
    const { html } = await renderMarkdown("![[other#^deep]]", {
      resolveEmbed: target => target === "other" ? { content: source, filePath: "other.md" } : undefined,
    })
    expect(html).toContain("target item")
    expect(html).toContain("child of target")
    expect(html).not.toContain("sibling")
    expect(html).not.toContain("^deep")
  })
})

describe("wikilinks in tables", () => {
  it("keeps an escaped alias pipe inside one cell", async () => {
    const { html } = await render("| Note |\n| --- |\n| [[other\\|Shown]] |")
    expect(html).toContain('<td><a href="/other" class="wikilink" data-target="other">Shown</a></td>')
  })
})
