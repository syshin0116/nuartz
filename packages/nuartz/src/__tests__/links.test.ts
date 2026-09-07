import { expect, test } from "vitest"
import { createNoteResolver, noteHref, normalizeNotePath } from "../links"
import { renderMarkdown } from "../markdown"
import { buildBacklinkIndex } from "../backlinks"

test("links, embeds and backlinks share canonical paths and preserve section context", async () => {
  const notes = [
    { slug: "docs/source", frontmatter: { title: "Source" }, content: "Unrelated opening.\n\nRead [[가이드#설치 방법|설치 안내]] before continuing.\n\n[[docs/한글 노트]]" },
    { slug: "docs/한글 노트", frontmatter: { aliases: ["가이드"] }, content: "## 설치 방법\n\nInstall **this** package. ^install\n\n### Detail\n\nMore details.\n\n## Other\n\nDo not include this.\n\n![[source]]" },
    { slug: "elsewhere/source", frontmatter: {}, content: "Another source." },
    { slug: "index", frontmatter: {}, content: "Home" },
    { slug: "docs/index", frontmatter: {}, content: "Docs" },
  ]
  const resolve = createNoteResolver(notes)
  expect(resolve("가이드")).toBe("docs/한글 노트")
  expect(resolve("./한글 노트.md", "docs/source.md")).toBe("docs/한글 노트")
  expect(resolve("source")).toBeUndefined()
  expect(resolve("source", "docs/한글 노트")).toBe("docs/source")
  expect(resolve("index", "docs/source")).toBe("index")
  expect(resolve("./index", "docs/source")).toBe("docs/index")
  const options = {
    filePath: "docs/source.md",
    resolveLink: (target: string, heading?: string, from?: string) => noteHref(resolve(target, from) ?? normalizeNotePath(target), heading),
    resolveEmbed: (target: string, from?: string) => {
      const note = notes.find(note => note.slug === resolve(target, from))
      return note && { content: note.content, filePath: `${note.slug}.md` }
    },
    knownSlugs: new Set(notes.map(note => note.slug)),
  }
  const result = await renderMarkdown(`---\ntitle: Source\n---\n${notes[0].content}`, options)
  expect(result.html).toContain('href="/docs/%ED%95%9C%EA%B8%80%20%EB%85%B8%ED%8A%B8#%EC%84%A4%EC%B9%98-%EB%B0%A9%EB%B2%95"')
  expect(result.html).not.toContain("broken")
  const index = buildBacklinkIndex(new Map(notes.map((note, i) => [note.slug, { result: i === 0 ? result : { ...result, frontmatter: note.frontmatter, links: [] }, raw: note.content }])))
  expect(index.get("docs/한글 노트")).toEqual([{ slug: "docs/source", title: "Source", excerpt: "Read 설치 안내 before continuing." }])

  const section = await renderMarkdown("![[가이드#설치 방법]]\n\n![[가이드#^install]]\n\n![[missing]]", options)
  expect(section.html).toContain('<section class="embed-note">')
  expect(section.html).toContain("<strong>this</strong>")
  expect(section.html).toContain("More details.")
  expect(section.html).not.toContain("Do not include this")
  expect(section.html).not.toContain("^install")
  expect(section.html).not.toContain("<img")
  expect(section.html).toContain("wikilink broken")
  const whole = await renderMarkdown("![[가이드]]", options)
  expect(whole.html).toContain("Do not include this")
  expect(whole.html).toContain('href="/docs/source"')
  expect(whole.html).not.toContain("Unrelated opening")
  const defaultLink = await renderMarkdown("[[한글/Note#A & B]] [[#Local]]", { baseUrl: "/vault/", knownSlugs: new Set(["한글/note"]) })
  expect(defaultLink.html).toContain('href="/vault/%ED%95%9C%EA%B8%80/note#a--b"')
  expect(defaultLink.html).toContain('href="#local"')
  expect(defaultLink.html).not.toContain("broken")
})
