import { describe, it, expect } from "vitest"
import { buildBacklinkIndex, getBacklinks } from "../backlinks"
import type { RenderResult } from "../types"

function mockPage(
  links: string[],
  title: string,
  raw: string
): { result: RenderResult; raw: string } {
  return {
    result: {
      html: "",
      frontmatter: { title },
      toc: [],
      links,
      tags: [],
    },
    raw,
  }
}

describe("buildBacklinkIndex", () => {
  it("builds index from pages with outgoing links", () => {
    const pages = new Map([
      ["page-a", mockPage(["Page B"], "Page A", "Links to Page B")],
      ["page-b", mockPage(["Page A"], "Page B", "Links to Page A")],
    ])

    const index = buildBacklinkIndex(pages)
    // "Page B" normalizes to "page-b"
    const backlinksForB = index.get("page-b")
    expect(backlinksForB).toBeDefined()
    expect(backlinksForB).toHaveLength(1)
    expect(backlinksForB![0].slug).toBe("page-a")
    expect(backlinksForB![0].title).toBe("Page A")
  })

  it("normalizes target slugs: lowercase and spaces to hyphens", () => {
    const pages = new Map([
      ["source", mockPage(["My Target Page"], "Source", "Content here")],
    ])

    const index = buildBacklinkIndex(pages)
    expect(index.has("my-target-page")).toBe(true)
  })

  it("strips non-word/non-hyphen characters from target slug", () => {
    const pages = new Map([
      ["source", mockPage(["Page (draft)"], "Source", "Content")],
    ])

    const index = buildBacklinkIndex(pages)
    // "Page (draft)" -> "page-draft" (parens removed)
    expect(index.has("page-draft")).toBe(true)
  })

  it("collects multiple backlinks for the same target", () => {
    const pages = new Map([
      ["alpha", mockPage(["Target"], "Alpha", "Alpha links to target")],
      ["beta", mockPage(["Target"], "Beta", "Beta links to target")],
      ["gamma", mockPage(["Target"], "Gamma", "Gamma links to target")],
    ])

    const index = buildBacklinkIndex(pages)
    const backlinks = index.get("target")
    expect(backlinks).toHaveLength(3)
    const slugs = backlinks!.map((b) => b.slug)
    expect(slugs).toContain("alpha")
    expect(slugs).toContain("beta")
    expect(slugs).toContain("gamma")
  })

  it("generates excerpt from raw content stripping frontmatter", () => {
    const raw = `---
title: Source Page
---

This is the body content that should appear in the excerpt.`

    const pages = new Map([
      ["source", mockPage(["Target"], "Source Page", raw)],
    ])

    const index = buildBacklinkIndex(pages)
    const backlinks = index.get("target")!
    expect(backlinks[0].excerpt).toContain("This is the body content")
    expect(backlinks[0].excerpt).not.toContain("---")
  })

  it("truncates excerpt to 160 characters plus ellipsis", () => {
    const longBody = "A".repeat(200)
    const pages = new Map([
      ["source", mockPage(["Target"], "Source", longBody)],
    ])

    const index = buildBacklinkIndex(pages)
    const backlinks = index.get("target")!
    // 160 chars + ellipsis character
    expect(backlinks[0].excerpt.length).toBeLessThanOrEqual(161)
    expect(backlinks[0].excerpt).toMatch(/\u2026$/)
  })

  it("uses slug as title fallback when no frontmatter title", () => {
    const pages = new Map([
      [
        "no-title-page",
        {
          result: {
            html: "",
            frontmatter: {},
            toc: [],
            links: ["Target"],
            tags: [],
          } as RenderResult,
          raw: "Some content",
        },
      ],
    ])

    const index = buildBacklinkIndex(pages)
    const backlinks = index.get("target")!
    expect(backlinks[0].title).toBe("no-title-page")
  })
})

describe("getBacklinks", () => {
  it("returns correct BacklinkEntry[] for known slug", () => {
    const pages = new Map([
      ["source", mockPage(["Target"], "Source Title", "Content about target")],
    ])

    const index = buildBacklinkIndex(pages)
    const backlinks = getBacklinks(index, "target")

    expect(backlinks).toHaveLength(1)
    expect(backlinks[0].slug).toBe("source")
    expect(backlinks[0].title).toBe("Source Title")
    expect(backlinks[0].excerpt).toBeTruthy()
  })

  it("returns empty array for unknown slug", () => {
    const pages = new Map([
      ["source", mockPage(["Target"], "Source", "Content")],
    ])

    const index = buildBacklinkIndex(pages)
    const backlinks = getBacklinks(index, "nonexistent")
    expect(backlinks).toEqual([])
  })

  it("returns empty array for empty index", () => {
    const index = buildBacklinkIndex(new Map())
    const backlinks = getBacklinks(index, "anything")
    expect(backlinks).toEqual([])
  })
})
