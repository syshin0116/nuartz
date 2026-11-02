import { describe, expect, it } from "vitest"
import { isUnpublished, normalizeFrontmatter } from "../frontmatter"
import { renderMarkdown } from "../markdown"

describe("normalizeFrontmatter", () => {
  it("splits comma-separated tag strings and strips a leading #", () => {
    expect(normalizeFrontmatter({ tags: "a, #b,  ,c" }).tags).toEqual(["a", "b", "c"])
  })

  it("reads singular tag/alias keys and single values", () => {
    expect(normalizeFrontmatter({ tag: "solo", alias: "Other Name" })).toMatchObject({ tags: ["solo"], aliases: ["Other Name"] })
    expect(normalizeFrontmatter({ tags: 2026 }).tags).toEqual(["2026"])
  })

  it("deduplicates lists and ignores non-scalar entries", () => {
    expect(normalizeFrontmatter({ tags: ["x", "#x", { nested: true }, "y"] }).tags).toEqual(["x", "y"])
    expect(normalizeFrontmatter({ aliases: ["A", "A"] }).aliases).toEqual(["A"])
  })

  it("accepts string booleans for draft and published", () => {
    expect(isUnpublished(normalizeFrontmatter({ draft: "true" }))).toBe(true)
    expect(isUnpublished(normalizeFrontmatter({ published: "false" }))).toBe(true)
    expect(isUnpublished(normalizeFrontmatter({ draft: "false", published: "true" }))).toBe(false)
    expect(isUnpublished(normalizeFrontmatter({}))).toBe(false)
  })

  it("keeps a publish date in published", () => {
    const frontmatter = normalizeFrontmatter({ published: "2023-11-30 20:58 +0900" })
    expect(frontmatter.published).toBe("2023-11-30 20:58 +0900")
    expect(isUnpublished(frontmatter)).toBe(false)
  })

  it("leaves unrelated keys untouched", () => {
    expect(normalizeFrontmatter({ title: "T", order: 3 })).toEqual({ title: "T", order: 3 })
  })
})

describe("renderMarkdown tags", () => {
  it("returns comma-separated frontmatter tags as whole tags", async () => {
    const result = await renderMarkdown("---\ntags: research, ai\n---\nBody #inline")
    expect(result.tags).toEqual(["research", "ai", "inline"])
  })
})
