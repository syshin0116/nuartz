import { describe, expect, test } from "vitest"
import { evaluateBase, normalizePropertyId, parseBase, parseBaseExpression, renderBaseViewHtml, BaseUnsupportedError, type BaseFile } from "../bases"
import { remarkBaseBlock } from "../plugins/base"
import { renderMarkdown } from "../markdown"

const files: BaseFile[] = [
  {
    path: "projects/alpha.md", slug: "projects/alpha", tags: ["project/active", "work"], links: ["people/ann"],
    properties: { title: "Alpha", status: "active", priority: 3, due: new Date("2026-01-10T00:00:00Z"), owner: "[[ann|Ann]]", tags: ["project/active"] },
    mtime: new Date("2026-02-01T10:30:00Z"), size: 120,
  },
  {
    path: "projects/beta.md", slug: "projects/beta", tags: ["project"], links: [],
    properties: { status: "done", priority: 1, due: "2025-12-01", aliases: ["b"] },
  },
  {
    path: "projects/archive/gamma.md", slug: "projects/archive/gamma", tags: [], links: ["projects/alpha"],
    properties: { status: "active", priority: "2" },
  },
  { path: "people/ann.md", slug: "people/ann", tags: ["person"], links: [], properties: { role: "lead" } },
  { path: "readme.md", slug: "readme", tags: [], links: [], properties: {} },
]
const resolveNote = (target: string) => ({ ann: "people/ann", alpha: "projects/alpha", "projects/alpha": "projects/alpha" } as Record<string, string>)[target.toLowerCase()]
const now = new Date("2026-01-01T12:00:00Z")

function run(yaml: string, options = {}) {
  return evaluateBase(parseBase(yaml), files, { resolveNote, now, ...options })
}
const slugs = (yaml: string, options = {}) => run(yaml, options).views[0].groups.flatMap(group => group.rows.map(row => row.slug))

describe("parseBase", () => {
  test("normalizes views, properties and sort", () => {
    const base = parseBase(`
filters:
  and:
    - file.inFolder("projects")
formulas:
  double: priority * 2
properties:
  status:
    displayName: State
views:
  - type: table
    name: Projects
    order: [file.name, status, formula.double]
    sort:
      - property: priority
        direction: DESC
    limit: 2
    groupBy:
      property: status
      direction: ASC
  - type: kanban
    summaries: { priority: Average }
    groupOrder: [a]
    columnSize: { file.name: 200 }
    mystery: 1
`)
    expect(base.filters).toEqual({ and: ["file.inFolder(\"projects\")"] })
    expect(base.formulas).toEqual({ double: "priority * 2" })
    expect(base.properties).toEqual({ "note.status": { displayName: "State" } })
    expect(base.views[0]).toMatchObject({
      type: "table", name: "Projects", order: ["file.name", "note.status", "formula.double"],
      sort: [{ property: "note.priority", direction: "DESC" }], limit: 2, groupBy: { property: "note.status", direction: "ASC" }, notices: [],
    })
    expect(base.views[1]).toMatchObject({ type: "table", name: "View 2", order: ["file.name"], sort: [] })
    expect(base.views[1].notices).toEqual([
      "View type \"kanban\" is shown as a table", "Summaries are not supported",
      "groupOrder is not supported; groups follow groupBy.direction", "View option \"mystery\" is ignored",
    ])
  })

  test("never throws on bad input", () => {
    expect(parseBase("views: [").notices[0]).toMatch(/^Invalid YAML/)
    expect(parseBase("").views).toHaveLength(1)
    expect(parseBase("- a\n- b").views[0].name).toBe("Table")
    expect(parseBase("filters:\n  xor: [a]\nsummaries: {}").notices).toEqual(["Summaries are not supported", "Unsupported filter: {\"xor\":[\"a\"]}"])
  })

  test("normalizePropertyId keeps namespaces", () => {
    expect(normalizePropertyId(" status ")).toBe("note.status")
    expect(normalizePropertyId("file.mtime")).toBe("file.mtime")
    expect(normalizePropertyId("this.file.name")).toBe("this.file.name")
  })
})

describe("filters", () => {
  test("file functions", () => {
    expect(slugs(`filters: 'file.hasTag("project")'`)).toEqual(["projects/alpha", "projects/beta"])
    expect(slugs(`filters: 'file.hasTag("#WORK", "person")'`)).toEqual(["projects/alpha", "people/ann"])
    expect(slugs(`filters: 'file.inFolder("projects/")'`)).toEqual(["projects/alpha", "projects/beta", "projects/archive/gamma"])
    expect(slugs(`filters: 'file.inFolder("/")'`)).toHaveLength(5)
    expect(slugs(`filters: 'file.hasLink("ann")'`)).toEqual(["projects/alpha"])
    expect(slugs(`filters: 'file.hasLink(link("Alpha"))'`)).toEqual(["projects/archive/gamma"])
    expect(slugs(`filters: 'file.hasProperty("role")'`)).toEqual(["people/ann"])
    expect(slugs(`filters: 'file.folder == "/"'`)).toEqual(["readme"])
    expect(slugs(`filters: 'file.ext == "md" && file.basename.startsWith("al")'`)).toEqual(["projects/alpha"])
  })

  test("and / or / not and comparisons", () => {
    expect(slugs(`filters:\n  or: ['status == "done"', 'role == "lead"']`)).toEqual(["people/ann", "projects/beta"])
    expect(slugs(`filters:\n  not: ['file.inFolder("projects")', 'file.name == "readme.md"']`)).toEqual(["people/ann"])
    expect(slugs(`filters:\n  and: ['priority > 1', 'status != "done"']`)).toEqual(["projects/alpha", "projects/archive/gamma"])
    expect(slugs(`filters: 'priority >= 2 && priority <= 2'`)).toEqual(["projects/archive/gamma"])
    expect(slugs(`filters: 'due < date("2026-01-01")'`)).toEqual(["projects/beta"])
    expect(slugs(`filters: 'due > now() - "1w" && due < today() + "2 weeks"'`)).toEqual(["projects/alpha"])
    expect(slugs(`filters: 'note.status.contains("act") || !note.role.isEmpty()'`)).toEqual(["projects/alpha", "people/ann", "projects/archive/gamma"])
    expect(slugs(`filters: 'file.tags.contains("person") || aliases.containsAny("b", "c")'`)).toEqual(["people/ann", "projects/beta"])
    expect(slugs(`filters: 'owner == link("ann")'`)).toEqual(["projects/alpha"])
    expect(slugs(`filters: 'file.links.contains(file("people/ann.md"))'`)).toEqual(["projects/alpha"])
    expect(slugs(`filters: 'status.isEmpty()'`)).toEqual(["people/ann", "readme"])
    expect(slugs("filters:\n  or: []")).toHaveLength(5)
  })

  test("view filters combine with global filters, and unsupported filters are ignored with a notice", () => {
    const result = run(`
filters: 'file.inFolder("projects")'
views:
  - type: list
    filters: 'status == "active"'
  - type: table
    filters:
      and: ['file.backlinks.length > 0', 'nope(']
`)
    expect(result.views[0].groups[0].rows.map(row => row.slug)).toEqual(["projects/alpha", "projects/archive/gamma"])
    expect(result.views[1].count).toBe(3)
    expect(result.views[1].notices).toEqual([
      "Ignored filter `file.backlinks.length > 0`: file.backlinks is not supported",
      "Ignored filter `nope(`: Unexpected end of \"nope(\"",
    ])
  })

  test("this refers to the embedding file", () => {
    const thisFile = files[3]
    expect(slugs(`filters: 'file.hasLink(this.file)'`, { thisFile })).toEqual(["projects/alpha"])
    expect(slugs(`filters: 'this.role == "lead" && file.name == this.file.name'`, { thisFile })).toEqual(["people/ann"])
    expect(slugs(`filters: 'this.file.name == "x"'`)).toEqual([])
  })
})

describe("views", () => {
  const yaml = `
formulas:
  double: priority * 2
  label: 'file.basename.upper() + " (" + status + ")"'
  broken: 'status.frobnicate()'
  days: '(due - date("2025-11-30")).days'
  loop: formula.loop
properties:
  note.status:
    displayName: State
views:
  - type: table
    name: Table
    order: [file.name, status, formula.double, formula.label, formula.broken, formula.days, formula.loop, owner, due, file.mtime, file.tags, file.links]
    sort: [{ property: formula.double, direction: DESC }]
    limit: 3
  - type: cards
    name: By status
    order: [file.name, status]
    groupBy: { property: status, direction: DESC }
`
  test("columns, sort, limit, formulas, and cells", () => {
    const [table, cards] = run(yaml).views
    expect(table.columns.map(column => column.label)).toEqual(["Name", "State", "double", "label", "broken", "days", "loop", "owner", "due", "Modified", "Tags", "Links"])
    expect(table.count).toBe(3)
    const [alpha, gamma, beta] = table.groups[0].rows
    expect([alpha.slug, gamma.slug, beta.slug]).toEqual(["projects/alpha", "projects/archive/gamma", "projects/beta"])
    expect(alpha.title).toBe("Alpha")
    expect(alpha.cells).toEqual({
      "file.name": { text: "alpha", slug: "projects/alpha" },
      "note.status": "active",
      "formula.double": 6,
      "formula.label": "ALPHA (active)",
      "formula.broken": null,
      "formula.days": 41,
      "formula.loop": null,
      "note.owner": { text: "Ann", slug: "people/ann" },
      "note.due": "2026-01-10",
      "file.mtime": "2026-02-01 10:30",
      "file.tags": ["project/active", "work"],
      "file.links": [{ text: "ann", slug: "people/ann" }],
    })
    expect(gamma.cells["formula.double"]).toBe(4)
    expect(table.notices).toEqual([
      "Formula \"broken\" could not be evaluated: Method frobnicate() is not supported on strings",
      "Formula \"loop\" could not be evaluated: Formula \"loop\" refers to itself",
    ])
    expect(cards.grouped).toBe(true)
    expect(cards.groups.map(group => [group.label, group.rows.length])).toEqual([["done", 1], ["active", 2], [null, 2]])
  })

  test("renderBaseViewHtml renders each view type as a single line", () => {
    const result = run(yaml)
    const href = (slug: string) => `/base/${slug}`
    const table = renderBaseViewHtml(result.views[0], { href })
    expect(table).not.toContain("\n")
    expect(table).toContain("<th>State</th>")
    expect(table).toContain("<a href=\"/base/people/ann\" class=\"base-link\">Ann</a>")
    expect(table).toContain("<p class=\"base-notice\">Formula &quot;broken&quot;")
    const cards = renderBaseViewHtml(result.views[1], { href })
    expect(cards).toContain("<p class=\"base-group\">done</p>")
    expect(cards).toContain("<p class=\"base-group\">(empty)</p>")
    expect(cards).toContain("<dt>State</dt><dd>active</dd>")
    const list = renderBaseViewHtml(run(`views: [{ type: list, order: [file.name, status, priority], filters: 'priority == 3' }]`).views[0], { href })
    expect(list).toBe("<div class=\"base-view\"><ul class=\"base-list\"><li><a href=\"/base/projects/alpha\" class=\"base-link\">Alpha</a> <span class=\"base-list-meta\">active · 3</span></li></ul></div>")
    const grouped = renderBaseViewHtml(run(`views: [{ type: table, groupBy: status, filters: 'priority == 3' }]`).views[0], { href })
    expect(grouped).toContain("<tr class=\"base-group\"><th colspan=\"1\">active</th></tr>")
    expect(renderBaseViewHtml(run(`filters: 'false'`).views[0], { href })).toBe("<div class=\"base-view\"><p class=\"base-empty\">No matching notes.</p></div>")
  })
})

describe("expressions", () => {
  const value = (expression: string) =>
    evaluateBase(parseBase(`filters: 'file.name == "alpha.md"'\nformulas:\n  x: ${JSON.stringify(expression)}\nviews: [{ order: [formula.x] }]`), files, { resolveNote, now }).views[0].groups[0].rows[0].cells["formula.x"]

  test("operators and literals", () => {
    expect(value("1 + 2 * 3 - 4 / 2 % 3")).toBe(5)
    expect(value("(1 + 2) * -3")).toBe(-9)
    expect(value("'a\\'b' + \"c\\n\"")).toBe("a'bc\n")
    expect(value("[1, 2] + 3")).toEqual([1, 2, 3])
    expect(value("null")).toBeNull()
    expect(value("true && false || 'fallback'")).toBe("fallback")
    expect(value("\"x\" * 2")).toBeNull()
    expect(value("'1' == 1 && 2 == '2' && [1, 'a'] == [1, 'a']")).toBe(true)
    expect(value("10 > '9' && '10' > 9 && 'b' > 'a' && true > false")).toBe(true)
    expect(value("'a' < 1 || null < 1 || due < 'x'")).toBe(false)
    expect(value("note['status']")).toBe("active")
    expect(value("tags[0]")).toBe("project/active")
    expect(value("file.properties.priority")).toBe(3)
  })

  test("functions and methods", () => {
    expect(value("if(priority > 2, 'high', 'low')")).toBe("high")
    expect(value("if(false, 1)")).toBeNull()
    expect(value("max(1, 5, 3) + min([4, 2])")).toBe(7)
    expect(value("max('a')")).toBeNull()
    expect(value("number('12') + number(true) + number(date('1970-01-01'))")).toBe(13)
    expect(value("number('x')")).toBeNull()
    expect(value("list(1).length + list(null).length + list([1, 2]).length")).toBe(3)
    expect(value("duration('1d 2h').hours")).toBe(26)
    expect(value("duration('nope')")).toBeNull()
    expect(value("now().format('YYYY/MM/DD [at] HH:mm:ss')")).toBe("2026/01/01 at 12:00:00")
    expect(value("now().date() == today() && now().time() == '12:00:00'")).toBe(true)
    expect(value("due.year + due.month + due.day")).toBe(2026 + 1 + 10)
    expect(value("due.format('D/M/YY')")).toBe("10/1/26")
    expect(value("(now() - due).days")).toBe(-8)
    expect(value("'Hello World'.lower().title().replace('o', '0').slice(0, 7)")).toBe("Hell0 W")
    expect(value("' a,b '.trim().split(',').join('+')")).toBe("a+b")
    expect(value("'ab'.repeat(2).reverse().upper()")).toBe("BABA")
    expect(value("'abc'.containsAll('a', 'c') && 'abc'.containsAny('z', 'b') && 'abc'.endsWith('c')")).toBe(true)
    expect(value("(3.14159).round(2) + (2.5).floor() + (-1).abs() + (1.2).ceil()")).toBeCloseTo(8.14)
    expect(value("(1.5).toFixed(2)")).toBe("1.50")
    expect(value("[3, 1, 2, 1].unique().sort().reverse().slice(0, 2)")).toEqual([3, 2])
    expect(value("[[1], [2]].flat().map(value * 10).filter(value > 10)")).toEqual([20])
    expect(value("[1, 2].containsAll(1, 2) && [1].isEmpty() == false && [].isEmpty()")).toBe(true)
    expect(value("priority.isType('number') && status.isTruthy() && priority.toString() == '3'")).toBe(true)
    expect(value("missing.contains('x') || missing.lower() != null")).toBe(false)
    expect(value("file.asLink('Go')")).toEqual({ text: "Go", slug: "projects/alpha" })
    expect(value("link('people/ann.md').asFile().name")).toBe("ann.md")
    expect(value("link('ann').linksTo(file('people/ann.md'))")).toBe(true)
    expect(value("file.size + file.ctime.isEmpty().toString().length")).toBe(124)
    expect(value("file.path + ' ' + file.links.length")).toBe("projects/alpha.md 1")
    expect(value("owner")).toEqual({ text: "Ann", slug: "people/ann" })
    expect(value("'[[nowhere]]'")).toEqual({ text: "nowhere" })
    expect(value("link('nowhere', 3)")).toEqual({ text: "3" })
    expect(value("file.properties")).toBe(JSON.stringify(files[0].properties))
  })

  test("unsupported features are reported", () => {
    const unsupported = (expression: string) => evaluateBase(parseBase(`formulas:\n  x: ${JSON.stringify(expression)}\nviews: [{ order: [formula.x] }]`), [files[0]], { now }).views[0].notices[0]
    expect(unsupported("random()")).toMatch(/Function random\(\) is not supported/)
    expect(unsupported("file.nope()")).toMatch(/Method file.nope\(\) is not supported/)
    expect(unsupported("[1].reduce(acc, 0)")).toMatch(/not supported on lists/)
    expect(unsupported("(1).foo()")).toMatch(/not supported on numbers/)
    expect(unsupported("due.relative()")).toMatch(/not supported on date/)
    expect(unsupported("priority.foo")).toMatch(/Property "foo" is not supported on number/)
    expect(unsupported("[].filter()")).toMatch(/needs an expression/)
    expect(unsupported("if()")).toMatch(/needs a condition/)
    expect(unsupported("(1)(2)")).toMatch(/Only functions and methods/)
    expect(() => parseBaseExpression("a ~ b")).toThrow(BaseUnsupportedError)
    expect(() => parseBaseExpression("'open")).toThrow(/Unterminated/)
    expect(() => parseBaseExpression("a b")).toThrow(/Unexpected "b"/)
    expect(() => parseBaseExpression("a.")).toThrow(/property name/)
    expect(() => parseBaseExpression(")")).toThrow(/Unexpected "\)"/)
  })
})

test("```base blocks render through renderBase and stay code without it", async () => {
  const markdown = "Intro\n\n```base\nviews: []\n```\n\n```js\nx\n```"
  const withBase = await renderMarkdown(markdown, { filePath: "notes/host.md", renderBase: (source, filePath) => `<div class="base-view" data-from="${filePath}">${source.trim()}</div>` })
  expect(withBase.html).toContain("<div class=\"base-view\" data-from=\"notes/host.md\">views: []</div>")
  const without = await renderMarkdown(markdown)
  expect(without.html).toContain("data-language=\"base\"")
  expect(typeof remarkBaseBlock).toBe("function")
})
