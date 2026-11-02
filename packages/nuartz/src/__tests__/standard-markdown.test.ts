import { describe, expect, it } from "vitest"
import { toStandardMarkdown } from "../standard-markdown"

const options = {
  resolveLink: (target: string, heading?: string) => target === "missing" ? undefined : `https://site.test/${target}${heading ? `#${heading.toLowerCase()}` : ""}`,
  resolveAsset: (target: string) => target === "gone.png" ? undefined : `https://site.test/content/${target}`,
}

describe("toStandardMarkdown", () => {
  it("drops frontmatter and comments and adds the title and description", () => {
    const md = toStandardMarkdown("---\ntitle: T\nsecret: x\n---\nVisible %%hidden%% text\n%%\nblock comment\n%%\nEnd", { ...options, title: "T", description: "About T" })
    expect(md).toBe("# T\n\n> About T\n\nVisible  text\n\nEnd\n")
  })

  it("turns wikilinks and embeds into standard links and images", () => {
    const md = toStandardMarkdown("[[note]] [[note#Part|see part]] [[missing|Gone]] ![[pic.png|300]] ![[pic.png|Caption]] ![[gone.png]]", options)
    expect(md).toBe("[note](https://site.test/note) [see part](https://site.test/note#part) Gone ![pic.png](https://site.test/content/pic.png) ![Caption](https://site.test/content/pic.png) gone.png\n")
  })

  it("leaves fenced and inline code untouched", () => {
    const md = toStandardMarkdown("`[[inline]]` and [[real]]\n```\n[[fenced]] %%kept%%\n```\n~~~md\n[[tilde]]\n~~~", options)
    expect(md).toContain("`[[inline]]` and [real](https://site.test/real)")
    expect(md).toContain("[[fenced]] %%kept%%")
    expect(md).toContain("[[tilde]]")
  })
})
